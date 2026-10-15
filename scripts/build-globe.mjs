import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildEditorialMaps } from './editorial-maps.mjs';
import { buildTravelPhotoLayers } from './travel-photo-layers.mjs';

const root = fileURLToPath(new URL("../", import.meta.url));
const image = await readFile(resolve(root, "assets/earth-blue-marble-4k.jpg"));
const night = await readFile(resolve(root, "assets/earth-black-marble-4k.jpg"));
const asteroid = await readFile(resolve(root, "assets/asteroid.png"));
const planets = await Promise.all(Array.from({length:10},async(_,i)=>'data:image/png;base64,'+(await readFile(resolve(root,`assets/planets/${i}.png`))).toString('base64')));
const geo = JSON.parse(await readFile(resolve(root, "src/jiangxi-boundaries.geojson"), "utf8"));
const points = geo.features.flatMap(feature => feature.geometry.coordinates.flat(2));
const minX = Math.min(...points.map(p => p[0])), maxX = Math.max(...points.map(p => p[0]));
const minY = Math.min(...points.map(p => p[1])), maxY = Math.max(...points.map(p => p[1]));
const scale = Math.min(282 / ((maxX - minX) * Math.cos(28 * Math.PI / 180)), 284 / (maxY - minY));
const project = ([lon, lat]) => [36 + (lon - minX) * Math.cos(28 * Math.PI / 180) * scale, 24 + (maxY - lat) * scale];
const paths = geo.features.map(feature => {
  const d = feature.geometry.coordinates.map(polygon => polygon.map(ring => {
    return ring.filter((_, index) => index % 2 === 0 || index === ring.length - 1)
      .map((point, index) => `${index ? "L" : "M"}${project(point).map(value => value.toFixed(1)).join(",")}`).join(" ") + "Z";
  }).join(" ")).join(" ");
  return `<path d="${d}" fill="${feature.properties.adcode === 360100 ? "#ca7655" : "#183b55"}" stroke="#6ea4c2" stroke-width=".7"/>`;
}).join("");
const [x, y] = project([115.86, 28.68]);
const labels = geo.features.filter(f => [360400, 360700, 361100].includes(f.properties.adcode)).map(feature => {
  const [px, py] = project(feature.properties.center);
  return `<text x="${px.toFixed(1)}" y="${py.toFixed(1)}" fill="#92b4c5" font-family="Microsoft YaHei, sans-serif" font-size="10" text-anchor="middle">${feature.properties.name.replace("市", "")}</text>`;
}).join("");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 340"><defs><radialGradient id="bg"><stop stop-color="#11283e"/><stop offset="1" stop-color="#07111d"/></radialGradient></defs><rect width="360" height="340" fill="url(#bg)"/>${paths}${labels}<circle cx="${x}" cy="${y}" r="12" fill="none" stroke="#ffd9ad" stroke-width="1" opacity=".6"/><circle cx="${x}" cy="${y}" r="4" fill="#fff0d2"/><path d="M${x + 14},${y}H${x + 43}" stroke="#fff0d2"/><text x="${x + 47}" y="${y + 4}" fill="#fff0d2" font-family="Microsoft YaHei, sans-serif" font-size="16" font-weight="600">南昌</text><text x="322" y="315" fill="#6f9db9" font-family="Arial, sans-serif" font-size="10" text-anchor="end" letter-spacing="2">JIANGXI / CHINA</text></svg>`;
const ids = ["nanchang", "iceland", "naoshima", "morocco", "tidelines", "lava-field", "dune-notes", "white-island", "north-waves", "earth-city"];
const coverSources=JSON.parse(await readFile(resolve(root,'assets/covers-v2/manifest.json'),'utf8'));
const photos=Object.fromEntries(ids.map(id=>[id,coverSources[id].file]));
const world = JSON.parse(await readFile(resolve(root, 'src/world-countries.geojson'), 'utf8'));
const destinations = {
  nanchang: ['China', 115.86, 28.68], iceland: ['Iceland', -19.02, 64.96],
  naoshima: ['Japan', 133.99, 34.46], morocco: ['Morocco', -7.09, 31.79],
  tidelines: ['Japan', 134.03, 34.36], 'lava-field': ['Iceland', -22.45, 63.88],
  'dune-notes': ['Morocco', -4.01, 31.10], 'white-island': ['Japan', 133.98, 34.47],
  'north-waves': ['Iceland', -19.04, 63.40], 'earth-city': ['Morocco', -7.13, 31.05],
};
const toData = text => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(text);
const editorial = await buildEditorialMaps(root,ids,destinations,world);
const projectionSources={...coverSources,nanchang:coverSources['nanchang-day']};
const travelPhotos=await buildTravelPhotoLayers(root,projectionSources,world);
const maps = Object.fromEntries(ids.map(id => {
  const [country, lon, lat] = destinations[id];
  // Genuine geographic boundaries, not a decorative invented map silhouette.
  const features = id === 'nanchang' ? geo.features : world.features.filter(f => f.properties.ADMIN === country);
  const rings = features.flatMap(f => f.geometry.type === 'Polygon' ? f.geometry.coordinates : f.geometry.coordinates.flat(1));
  const coordinates = rings.flat(1);
  const xs = coordinates.map(p => p[0]), ys = coordinates.map(p => p[1]);
  const west = Math.min(...xs), east = Math.max(...xs), north = Math.max(...ys), south = Math.min(...ys);
  const cosine = Math.cos(lat * Math.PI / 180);
  const unit = Math.min(268 / ((east - west) * cosine), 268 / (north - south));
  const dx = (320 - (east - west) * cosine * unit) / 2, dy = (320 - (north - south) * unit) / 2;
  const projectMap = p => [dx + (p[0] - west) * cosine * unit, dy + (north - p[1]) * unit];
  const land = rings.map(ring => `<path d="${ring.map((p,i) => `${i ? 'L' : 'M'}${projectMap(p).map(n=>n.toFixed(1)).join(',')}`).join(' ')}Z" fill="#8bc6f5" fill-opacity=".10" stroke="#c0e4ff" stroke-width="1.1"/>`).join('');
  const [mx,my] = projectMap([lon,lat]);
  const grid = [80,160,240].map(n=>`<path d="M${n} 12V308M12 ${n}H308" stroke="#88b6dd" opacity=".13"/>`).join('');
  return [id, toData(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320">${grid}${land}<circle cx="${mx}" cy="${my}" r="10" fill="#ffc887" fill-opacity=".16" stroke="#ffe0af"/><circle cx="${mx}" cy="${my}" r="3.5" fill="#fff4dc"/><path d="M${mx+12} ${my}h20" stroke="#ffe4bd"/><text x="286" y="305" fill="#d3eaff" text-anchor="end" font-family="Arial" font-size="9" letter-spacing="2">${id === 'nanchang' ? 'JIANGXI' : country.toUpperCase()}</text></svg>`)];
}));
const [renderer, orbit, source, controller, sky, model, drag, navigation, journey, cosmos, nebula] = await Promise.all(["earth-renderer.js", "orbit-library.js", "system-source.js", "atlas-controller.js", "sky-renderer.js", "orbital-model.js", "globe-drag.js", "scene-navigation.js", "book-journey.js", "handheld-cosmos.js", "nebula-ring.js"].map(name => readFile(resolve(root, "src", name), "utf8")));
const bundle = [
  '// Generated by scripts/build-globe.mjs. Earth textures are embedded; the photographic sky is a separately cached asset.',
  `const ATLAS_EARTH_TEXTURE = ${JSON.stringify('data:image/jpeg;base64,'+image.toString('base64'))};`,
  `const ATLAS_NIGHT_TEXTURE = ${JSON.stringify('data:image/jpeg;base64,'+night.toString('base64'))};`,
  `const ATLAS_GALAXY_IMAGE = 'assets/nasa-starmap-8k.jpg';`,
  `const ATLAS_PLANET_IMAGES = ${JSON.stringify(planets)};`,
  `const ATLAS_ASTEROID_IMAGE = ${JSON.stringify('data:image/png;base64,'+asteroid.toString('base64'))};`,
  `const ATLAS_REGION_MAPS = ${JSON.stringify(editorial.data)};`,
  `const ATLAS_HOLOGRAM_MAPS = ${JSON.stringify(maps)};`,
  `const ATLAS_MAP_META = ${JSON.stringify(editorial.meta)};`,
  `const ATLAS_BOOK_IMAGES = ${JSON.stringify(photos)};`,
  `const ATLAS_PROJECTION_IMAGES = {...ATLAS_BOOK_IMAGES,nanchang:${JSON.stringify(projectionSources.nanchang.file)}};`,
  `const ATLAS_TRAVEL_PHOTOS = ${JSON.stringify(travelPhotos)};`,
  `const ATLAS_COVER_SOURCES = ${JSON.stringify(projectionSources)};`,
  `const ATLAS_REGION_MAP = ${JSON.stringify('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg))};`,
  renderer, sky, model, orbit, source, drag, navigation, journey, nebula, cosmos, controller,
].join('\n');
await writeFile(resolve(root, "system.js"), bundle);
await writeFile(resolve(root, "assets/nanchang-region.svg"), svg);
const mediaCredits=['# Current scene media sources','',
  '- Closed-fist, unfurling and open-hand poses and cinematic cloud sea: newly generated illustrative assets using the built-in image generator on 2026-10-15. Exact prompts and provenance are embedded and saved beside the PNG files in `assets/cosmos-v3/`. They are not documentary destination photography. The uploaded reference videos/photos are not redistributed.',
  '- Player Latin font: [Manrope](https://github.com/google/fonts/tree/main/ofl/manrope), self-hosted under the SIL Open Font License; license in `assets/fonts/OFL-Manrope.txt`. Chinese labels use the installed Chinese sans face; editorial text uses the closest available traditional serif, not an assertion of identical source font.',
  '- Star sphere: [NASA/Goddard Space Flight Center Scientific Visualization Studio — Deep Star Maps](https://svs.gsfc.nasa.gov/3895/). Original 8192×4096 JPEG from https://svs.gsfc.nasa.gov/vis/a000000/a003800/a003895/starmap_8k.jpg . Catalogue-based visualization, not an instantaneous sky photograph. Display exposure and observation direction adjusted for legibility.',
  '- Geographic line layers: © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), ODbL. Cached local city/coast/river/glacier/road geometry, not generated scenery or invented contour lines.',
  '- Source photo colours, subjects and aspect ratios are unchanged in the full photographic projection. The curved book thumbnail may crop for its small cover slot. Map and typography are separate overlay layers. Photo overlays/cover crops are adaptations; ShareAlike terms of the corresponding photograph apply. This does not relicense the site code or the original user photobooks.','',
  ...Object.entries(coverSources).map(([id,c])=>`## ${id}\n\n[Original photo](${c.source}) — ${c.author}; [${c.license}](${c.licenseUrl}). Local file: ${c.file}; ${c.width}×${c.height}.\n`)].join('\n');
await writeFile(resolve(root,'MEDIA-SOURCES.md'),mediaCredits);
console.log(`Built self-contained globe: ${(Buffer.byteLength(bundle) / 1024).toFixed(0)} KB; ${geo.features.length} city boundaries.`);
