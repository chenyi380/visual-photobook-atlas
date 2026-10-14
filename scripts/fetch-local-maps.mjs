import { mkdir, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const dir = fileURLToPath(new URL('../src/maps/', import.meta.url));
await mkdir(dir, {recursive:true});
const regions = {
  nanchang: {box:[28.625,115.81,28.72,115.965], roads:'motorway|trunk|primary|secondary|tertiary|residential|unclassified|service', extra:'nwr["name"~"滕王阁|万寿宫|八一广场|南昌之星|南昌站"](28.625,115.81,28.72,115.965);'},
  naoshima: {box:[34.40,133.91,34.51,134.04], roads:'primary|secondary|tertiary|residential|unclassified|service|footway', extra:''},
  iceland: {box:[63.25,-24.7,66.65,-13.3], roads:'trunk|primary', extra:''},
  morocco: {box:[28.6,-10.6,35.9,-2.0], roads:'motorway|trunk|primary', extra:''},
};
for (const [id, region] of Object.entries(regions)) {
  try { await access(dir + id + '.json'); console.log(`${id}: using saved map extract`); continue; } catch {}
  const box = region.box.join(',');
  const country = ['iceland','morocco'].includes(id);
  const query = country ? `[out:json][timeout:50];way["highway"~"^(motorway|trunk)$"](${box});out geom(${box});` : `[out:json][timeout:50];(way["highway"~"^(${region.roads})$"](${box});way["natural"="coastline"](${box});way["waterway"~"river|canal|riverbank"](${box}););out geom(${box});`;
  const endpoint = process.argv[2] || 'https://overpass-api.de/api/interpreter';
  const response = await fetch(endpoint + '?data=' + encodeURIComponent(query), {headers:{'User-Agent':'VisualPhotobookAtlas/1.0 (+https://github.com/chenyi380/visual-photobook-atlas)'},signal:AbortSignal.timeout(100000)});
  if (!response.ok) throw new Error(`${id}: ${response.status} ${(await response.text()).slice(0,200)}`);
  const data = await response.json();
  if (data.remark || !data.elements?.length) throw new Error(`${id}: incomplete response ${data.remark ?? ''}`);
  await writeFile(dir + id + '.json', JSON.stringify({bounds:region.box,...data}));
  console.log(`${id}: ${data.elements.length} road, water and landmark elements`);
}
