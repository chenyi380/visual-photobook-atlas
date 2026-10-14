import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
// Genuine geography in a transparent independent layer. No source photo is rewritten.
export async function buildTravelPhotoLayers(root,covers,world){
  await mkdir(resolve(root,'assets/travel-maps-v2'),{recursive:true});
  const config={
    nanchang:{title:'NANCHANG',country:'Jiangxi, China',region:'nanchang',center:[115.90,28.69],label:'Nanchang area',water:'Gan River'},
    iceland:{title:'JÖKULSÁRLÓN',country:'Iceland',region:'iceland',center:[-16.18,64.05],label:'Glacier lagoon area',water:'North Atlantic'},
    naoshima:{title:'NAOSHIMA',country:'Seto Inland Sea, Japan',region:'naoshima',center:[133.99,34.46],label:'Naoshima area',water:'Seto Inland Sea'},
    morocco:{title:'AÏT BENHADDOU',country:'Morocco',region:'morocco',center:[-7.13,31.05],label:'Aït Benhaddou area',water:'High Atlas'},
    tidelines:{title:'SETOUCHI',country:'Japan',region:'naoshima',center:[133.99,34.46],label:'Seto Inland Sea area',water:'Seto Inland Sea'},
    'lava-field':{title:'LITLI-HRÚTUR',country:'Reykjanes, Iceland',region:'iceland',center:[-22.20,63.92],label:'Reykjanes area',water:'North Atlantic'},
    'dune-notes':{title:'ERG CHEBBI',country:'Sahara, Morocco',region:'morocco',center:[-4.01,31.10],label:'Erg Chebbi area',water:'Sahara'},
    'white-island':{title:'NAOSHIMA',country:'Japan',region:'naoshima',center:[133.99,34.46],label:'Naoshima area',water:'Seto Inland Sea'},
    'north-waves':{title:'DYRHÓLAEY',country:'South coast, Iceland',region:'iceland',center:[-19.13,63.40],label:'South coast area',water:'North Atlantic'},
    'earth-city':{title:'AÏT BENHADDOU',country:'Morocco',region:'morocco',center:[-7.13,31.05],label:'Aït Benhaddou area',water:'High Atlas'},
  };
  const bounds={nanchang:[28.625,115.81,28.72,115.965],naoshima:[34.40,133.91,34.51,134.04],iceland:[63.25,-24.7,66.65,-13.3],morocco:[28.6,-10.6,35.9,-2.0]};
  const extracts={};
  for(const id of ['nanchang','naoshima'])extracts[id]=JSON.parse(await readFile(resolve(root,`src/maps/${id}.json`),'utf8'));
  for(const id of ['iceland','morocco','lava-field','dune-notes','north-waves']){
    const local=JSON.parse(await readFile(resolve(root,`src/maps/travel-v2/${id}.json`),'utf8'));
    extracts[id]=local;bounds[id]=local.bounds;
  }
  for(const id of ['lava-field','dune-notes','north-waves'])config[id].region=id;
  const result={};
  const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;');
  for(const [id,c] of Object.entries(config)){
    const [south,west,north,east]=bounds[c.region],cos=Math.cos((north+south)/2*Math.PI/180),u=Math.min(720/((east-west)*cos),355/(north-south));
    const x0=200+(720-(east-west)*cos*u)/2,y0=24+(355-(north-south)*u)/2;
    const project=([lon,lat])=>[x0+(lon-west)*cos*u,y0+(north-lat)*u];
    const path=pts=>{let previous=false;return pts.map(p=>{if(!p||!Number.isFinite(p[0])||!Number.isFinite(p[1])){previous=false;return '';}const command=previous?'L':'M';previous=true;return command+project(p).map(v=>v.toFixed(1)).join(',');}).join(' ');};
    const ways=extracts[c.region].elements.filter(e=>e.geometry&&e.tags);
    const roads=ways.filter(e=>e.tags.highway).map(e=>`<path d="${path(e.geometry.map(p=>p&&[p.lon,p.lat]))}" stroke="#758586" stroke-width="${['motorway','trunk','primary'].includes(e.tags.highway)?1.15:.55}" opacity=".54"/>`).join('');
    const water=ways.filter(e=>e.tags.waterway||e.tags.natural).map(e=>`<path d="${path(e.geometry.map(p=>p&&[p.lon,p.lat]))}" stroke="#f1eee5" stroke-width="${e.tags.waterway?2.2:1.4}" opacity=".86"/>`).join('');
    const country=null; // Local extracts, not a country silhouette standing in for city geography.
    const boundary=country?world.features.filter(f=>f.properties.ADMIN===country).flatMap(f=>f.geometry.type==='Polygon'?f.geometry.coordinates:f.geometry.coordinates.flat(1)).map(r=>`<path d="${path(r)}" stroke="#eee9de" stroke-width="1.4" opacity=".76"/>`).join(''):'';
    const [mx,my]=project(c.center);
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 430"><defs><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop stop-color="white"/><stop offset=".62" stop-color="white"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient><radialGradient id="edge"><stop offset=".45" stop-color="white"/><stop offset="1" stop-color="white" stop-opacity="0"/></radialGradient><mask id="soft"><rect width="1000" height="430" fill="url(#fade)"/></mask><clipPath id="region"><rect x="145" y="0" width="805" height="420"/></clipPath></defs><g mask="url(#soft)"><g clip-path="url(#region)" fill="none">${boundary}${water}${roads}</g><circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="5" fill="#be4e43"/><text x="${(mx+12).toFixed(1)}" y="${(my+4).toFixed(1)}" font-family="Georgia,serif" fill="#344144" font-size="13">${escape(c.label)}</text><text x="650" y="385" font-family="Georgia,serif" font-style="italic" font-size="16" letter-spacing="2" fill="#48585c">${c.water}</text><g transform="translate(925,56)" fill="none" stroke="#49575a" stroke-width=".9"><circle r="15"/><path d="M0-23V23M-23 0H23M-6 6L0-18 6 6 0 2Z"/></g><text x="925" y="25" text-anchor="middle" font-family="Georgia,serif" font-size="12" fill="#49575a">N</text></g></svg>`;
    const protectedSvg=id==='nanchang'?svg.replace('</mask>','<polygon points="200,255 630,255 765,430 140,430" fill="black"/></mask>'):svg;
    const tonedSvg=['lava-field','dune-notes'].includes(id)?protectedSvg.replaceAll('#344144','#e5e2d9').replaceAll('#48585c','#d5d5cb').replaceAll('#49575a','#e5e2d9').replaceAll('#758586','#dbdfd5'):protectedSvg;
    const map=`assets/travel-maps-v2/${id}.svg`;await writeFile(resolve(root,map),tonedSvg.replace('r="5" fill="#be4e43"','r="7.5" fill="#be4e43"'));
    result[id]={...c,map,ratio:covers[id].width/covers[id].height,approximate:true,mapCredit:'© OpenStreetMap contributors · Natural Earth'};
  }
  return result;
}
