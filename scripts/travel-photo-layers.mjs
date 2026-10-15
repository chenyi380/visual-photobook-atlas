import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';

// Only genuine cached geography is drawn. Source photography is never decoded,
// recoloured, cropped or flattened into this independently replaceable SVG layer.
const PHOTO_GEOGRAPHY={
  nanchang:{title:'NANCHANG',country:'Jiangxi Province · China',region:'nanchang',center:[115.90,28.69],label:'Nanchang area',water:'Gan River',field:[.43,0,.57,.40],marker:[.79,.16],tone:'ink'},
  iceland:{title:'JÖKULSÁRLÓN',country:'Southeast Iceland',region:'iceland',center:[-16.18,64.05],label:'Lagoon area',water:'Jökulsárlón',field:[.45,0,.55,.36],marker:[.73,.15],tone:'ink'},
  naoshima:{title:'NAOSHIMA',country:'Seto Inland Sea · Japan',region:'naoshima',center:[133.99,34.46],label:'Naoshima area',water:'Seto Inland Sea',field:[.43,0,.57,.40],marker:[.78,.15],tone:'ink'},
  // Here the empty foreground sand is preferable to covering the photographed buildings.
  morocco:{title:'AÏT BENHADDOU',country:'Ouarzazate Province · Morocco',region:'morocco',center:[-7.13,31.05],label:'Aït Benhaddou area',water:'Ounila Valley',field:[.48,.60,.52,.40],marker:[.82,.82],tone:'ink',placement:'sand'},
  tidelines:{title:'SETOUCHI',country:'Seto Inland Sea · Japan',region:'naoshima',center:[133.99,34.46],label:'Seto Inland Sea area',water:'Seto Inland Sea',field:[.44,0,.56,.40],marker:[.76,.16],tone:'ink'},
  'lava-field':{title:'LITLI-HRÚTUR',country:'Reykjanes Peninsula · Iceland',region:'lava-field',center:[-22.20,63.92],label:'Litli-Hrútur area',water:'Reykjanes',field:[.46,0,.54,.36],marker:[.78,.14],tone:'ink'},
  'dune-notes':{title:'ERG CHEBBI',country:'Sahara · Morocco',region:'dune-notes',center:[-4.01,31.10],label:'Erg Chebbi area',water:'Erg Chebbi',field:[.45,0,.55,.35],marker:[.76,.14],tone:'ivory'},
  'white-island':{title:'NAOSHIMA',country:'Kagawa Prefecture · Japan',region:'naoshima',center:[133.99,34.46],label:'Naoshima area',water:'Seto Inland Sea',field:[.44,0,.56,.42],marker:[.75,.18],tone:'ink'},
  'north-waves':{title:'DYRHÓLAEY',country:'South coast · Iceland',region:'north-waves',center:[-19.13,63.40],label:'Dyrhólaey area',water:'North Atlantic',field:[.45,0,.55,.34],marker:[.74,.14],tone:'ink'},
  'earth-city':{title:'AÏT BENHADDOU',country:'Ouarzazate Province · Morocco',region:'morocco',center:[-7.13,31.05],label:'Aït Benhaddou area',water:'Ounila Valley',field:[.46,0,.54,.40],marker:[.78,.17],tone:'ivory'},
};
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const closed=e=>e.geometry.length>3&&e.geometry[0]&&e.geometry.at(-1)&&e.geometry[0].lon===e.geometry.at(-1).lon&&e.geometry[0].lat===e.geometry.at(-1).lat;
const niceDistance=value=>{const magnitude=10**Math.floor(Math.log10(value));return [1,2,5,10].map(n=>n*magnitude).reduce((a,b)=>Math.abs(b-value)<Math.abs(a-value)?b:a);};

// The same locally equirectangular projection controls both geometry and scale.
export function geographicScaleKm(unit,desiredPixels){
  const distanceKm=niceDistance(desiredPixels*111.32/unit);
  return {distanceKm,pixels:distanceKm*unit/111.32};
}
function subjectProtection(id,H){
  if(id==='nanchang')return `<path d="M390 ${H*.213} Q600 ${H*.25} 833 ${H*.213} L854 ${H*.39} 950 ${H*.50} 1200 ${H*.86} V${H} H0 L296 ${H*.51} 386 ${H*.39}Z" fill="black"/>`;
  if(id==='naoshima')return `<path d="M660 ${H*.06} H733 L750 ${H*.42} H644Z" fill="black"/><path d="M0 ${H*.38} L250 ${H*.47} 465 ${H*.30} 630 ${H*.42} 820 ${H*.37} 1040 ${H*.22} 1200 ${H*.20} V${H} H0Z" fill="black"/>`;
  if(id==='morocco')return `<path d="M0 0H1200V${H*.66} L1080 ${H*.67} 1035 ${H*.73} 930 ${H*.73} 850 ${H*.70} 755 ${H*.72} 675 ${H*.78} 570 ${H*.77} 480 ${H*.84} H0Z" fill="black"/>`;
  if(id==='lava-field')return `<path d="M430 ${H*.17} L585 ${H*.12} 725 ${H*.25} 740 ${H*.40} 860 ${H*.49} 920 ${H*.75} 620 ${H*.94} 250 ${H*.77} 235 ${H*.41}Z" fill="black"/>`;
  if(id==='north-waves')return `<path d="M0 ${H*.46} L400 ${H*.40} 560 ${H*.34} 760 ${H*.30} 875 ${H*.32} 960 ${H*.36} 1200 ${H*.36}V${H}H0Z" fill="black"/>`;
  if(id==='earth-city')return `<path d="M0 ${H*.12} L220 ${H*.12} 420 ${H*.21} 650 ${H*.26} 800 ${H*.38} 1000 ${H*.42} 1200 ${H*.47}V${H}H0Z" fill="black"/>`;
  return '';
}
export async function buildTravelPhotoLayers(root,covers){
  await mkdir(resolve(root,'assets/travel-maps-v2'),{recursive:true});
  const extracts={};
  for(const id of ['nanchang','naoshima'])extracts[id]=JSON.parse(await readFile(resolve(root,`src/maps/${id}.json`),'utf8'));
  for(const id of ['iceland','morocco','lava-field','dune-notes','north-waves'])extracts[id]=JSON.parse(await readFile(resolve(root,`src/maps/travel-v2/${id}.json`),'utf8'));
  const result={};
  for(const [id,c] of Object.entries(PHOTO_GEOGRAPHY)){
    const W=1200,ratio=covers[id].width/covers[id].height,H=W/ratio;
    const [fx,fy,fw,fh]=c.field,[bx,by,bw,bh]=[fx*W,fy*H,fw*W,fh*H];
    const [south,west,north,east]=extracts[c.region].bounds;
    const cosine=Math.cos(c.center[1]*Math.PI/180);
    // Fill the allocated negative space with local detail, not a shrunken outline.
    const unit=Math.max(bw/((east-west)*cosine),bh/(north-south))*.94;
    const marker=c.marker,[mx,my]=[W*marker[0],H*marker[1]];
    const project=([lon,lat])=>[mx+(lon-c.center[0])*cosine*unit,my-(lat-c.center[1])*unit];
    const path=geometry=>{let previous=false;return geometry.map(p=>{if(!p||!Number.isFinite(p.lon)||!Number.isFinite(p.lat)){previous=false;return '';}const command=previous?'L':'M';previous=true;return command+project([p.lon,p.lat]).map(v=>v.toFixed(2)).join(',');}).join(' ');};
    const ways=extracts[c.region].elements.filter(e=>e.geometry&&e.tags);
    const ivory=c.tone==='ivory';
    const palette=ivory?{road:'#e5dfcb',minor:'#d3d3bd',water:'#c8e0df',ink:'#f1e5cc',land:'#e8ddc7'}:{road:'#697f7c',minor:'#839692',water:'#769da1',ink:'#344e50',land:'#81948a'};
    const land=ways.filter(e=>closed(e)&&(e.tags.natural==='wood'||e.tags.landuse)).map(e=>`<path d="${path(e.geometry)}Z" stroke="${palette.land}" stroke-width=".7" opacity=".36"/>`).join('');
    const waterAreas=ways.filter(e=>closed(e)&&(e.tags.natural==='water'||e.tags.water)).map(e=>`<path d="${path(e.geometry)}Z" fill="${palette.water}" fill-opacity=".075" stroke="${palette.water}" stroke-width="1.25" opacity=".8"/>`).join('');
    const roads=ways.filter(e=>e.tags.highway).map(e=>{
      const major=['motorway','trunk','primary','secondary'].includes(e.tags.highway),trail=['footway','path','track','steps'].includes(e.tags.highway);
      return `<path d="${path(e.geometry)}" stroke="${major?palette.road:palette.minor}" stroke-width="${major?1.65:trail?.75:.98}" opacity="${major?.86:trail?.56:.68}"${trail?' stroke-dasharray="2.5 3"':''}/>`;
    }).join('');
    const water=ways.filter(e=>e.tags.waterway||e.tags.natural==='coastline'||e.tags.natural==='glacier').map(e=>`<path d="${path(e.geometry)}" stroke="${palette.water}" stroke-width="${e.tags.natural==='coastline'?1.9:e.tags.waterway==='river'?2.25:1.1}" opacity=".9"/>`).join('');
    const labels=[],occupied=[[mx,my],[bx+bw-72,by+44]],seen=new Set();
    // Road and feature names must exist in the cached OpenStreetMap extract.
    for(const e of ways.filter(e=>e.tags['name:en']&&(e.tags.waterway||e.tags.natural||['primary','secondary'].includes(e.tags.highway)))){
      const p=e.geometry[Math.floor(e.geometry.length/2)];if(!p)continue;
      const name=e.tags['name:en'],[x,y]=project([p.lon,p.lat]);
      if(name.length>28||seen.has(name)||x<bx+45||x>bx+bw-120||y<by+25||y>by+bh-25||occupied.some(o=>Math.hypot(x-o[0],y-o[1])<86))continue;
      seen.add(name);occupied.push([x,y]);labels.push(`<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="12.5" font-style="italic" letter-spacing=".8">${escape(name)}</text>`);
      if(labels.length===3)break;
    }
    const scale=geographicScaleKm(unit,Math.min(140,bw*.23)),sx=bx+bw-scale.pixels-28,sy=by+93;
    const unitLabel=scale.distanceKm<1?'m':'km',total=scale.distanceKm<1?scale.distanceKm*1000:scale.distanceKm;
    const scaleBar=`<g transform="translate(${sx.toFixed(2)},${sy.toFixed(2)})" stroke="${palette.ink}" stroke-width="1" fill="none"><path d="M0-4V4M${(scale.pixels/2).toFixed(2)}-4V4M${scale.pixels.toFixed(2)}-4V4M0 0H${scale.pixels.toFixed(2)}"/><g stroke="none" fill="${palette.ink}" font-size="10.5" text-anchor="middle"><text y="17">0</text><text x="${(scale.pixels/2).toFixed(2)}" y="17">${total/2}</text><text x="${scale.pixels.toFixed(2)}" y="17">${total} ${unitLabel}</text></g></g>`;
    const compass=`<g transform="translate(${(bx+bw-44).toFixed(2)},${(by+38).toFixed(2)})" stroke="${palette.ink}" stroke-width=".95" fill="none"><circle r="14"/><path d="M0-20V17M-17 0H17M0-14L3 0 0-4-3 0Z"/><text x="0" y="-25" fill="${palette.ink}" stroke="none" text-anchor="middle" font-size="11">N</text></g>`;
    // Only linework fades at the footprint edge. No coloured rectangle, full-sky
    // grey wash, synthetic terrain, blur filter or square geographical card.
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H.toFixed(2)}" data-geography="local-osm" data-map-extent="negative-space" data-map-coverage="${(fw*fh).toFixed(3)}" data-tone="${c.tone}"><defs><radialGradient id="mapEdge"><stop offset=".68" stop-color="white"/><stop offset="1" stop-color="black"/></radialGradient><clipPath id="mapFootprint"><rect x="${bx}" y="${by}" width="${bw}" height="${bh}"/></clipPath><mask id="photoNegativeSpace"><g clip-path="url(#mapFootprint)"><ellipse cx="${bx+bw*.52}" cy="${by+bh*.42}" rx="${bw*.62}" ry="${bh*.76}" fill="url(#mapEdge)"/></g>${subjectProtection(id,H)}</mask></defs><g mask="url(#photoNegativeSpace)"><g fill="none" stroke-linecap="round" stroke-linejoin="round">${land}${waterAreas}${water}${roads}</g><g font-family="Georgia,Times New Roman,serif" fill="${palette.ink}">${labels.join('')}</g></g><g font-family="Georgia,Times New Roman,serif" fill="${palette.ink}">${compass}${scaleBar}<g mask="url(#photoNegativeSpace)"><text x="${bx+bw*.20}" y="${by+bh*.86}" font-size="15.5" letter-spacing="1.4" font-style="italic">${escape(c.water)}</text></g><circle cx="${mx}" cy="${my}" r="4.7" fill="#b84737"/><text x="${mx+11}" y="${my+4}" font-size="12.5">${escape(c.label)}</text></g></svg>`;
    const map=`assets/travel-maps-v2/${id}.svg`;await writeFile(resolve(root,map),svg);
    result[id]={...c,map:map+'?v=20261015-editorial1',ratio,marker,approximate:true,mapExtent:'negative-space',mapCoverage:Number((fw*fh).toFixed(3)),scaleKm:scale.distanceKm,mapCredit:'© OpenStreetMap contributors'};
  }
  return result;
}
