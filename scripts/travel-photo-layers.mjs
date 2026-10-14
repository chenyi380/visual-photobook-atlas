import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
// Editorial geography is an independent vector layer. The photograph is never rewritten.
export async function buildTravelPhotoLayers(root,covers){
  await mkdir(resolve(root,'assets/travel-maps-v2'),{recursive:true});
  const config={
    nanchang:{title:'NANCHANG',country:'Jiangxi, China',region:'nanchang',center:[115.90,28.69],label:'Nanchang area',water:'Gan River'},
    iceland:{title:'JÖKULSÁRLÓN',country:'Iceland',region:'iceland',center:[-16.18,64.05],label:'Glacier lagoon area',water:'North Atlantic'},
    naoshima:{title:'NAOSHIMA',country:'Seto Inland Sea, Japan',region:'naoshima',center:[133.99,34.46],label:'Naoshima area',water:'Seto Inland Sea'},
    morocco:{title:'AÏT BENHADDOU',country:'Morocco',region:'morocco',center:[-7.13,31.05],label:'Aït Benhaddou area',water:'High Atlas'},
    tidelines:{title:'SETOUCHI',country:'Japan',region:'naoshima',center:[133.99,34.46],label:'Seto Inland Sea area',water:'Seto Inland Sea'},
    'lava-field':{title:'LITLI-HRÚTUR',country:'Reykjanes, Iceland',region:'lava-field',center:[-22.20,63.92],label:'Reykjanes area',water:'North Atlantic'},
    'dune-notes':{title:'ERG CHEBBI',country:'Sahara, Morocco',region:'dune-notes',center:[-4.01,31.10],label:'Erg Chebbi area',water:'Sahara'},
    'white-island':{title:'NAOSHIMA',country:'Japan',region:'naoshima',center:[133.99,34.46],label:'Naoshima area',water:'Seto Inland Sea'},
    'north-waves':{title:'DYRHÓLAEY',country:'South coast, Iceland',region:'north-waves',center:[-19.13,63.40],label:'South coast area',water:'North Atlantic'},
    'earth-city':{title:'AÏT BENHADDOU',country:'Morocco',region:'morocco',center:[-7.13,31.05],label:'Aït Benhaddou area',water:'High Atlas'},
  };
  const extracts={};
  for(const id of ['nanchang','naoshima'])extracts[id]=JSON.parse(await readFile(resolve(root,`src/maps/${id}.json`),'utf8'));
  for(const id of ['iceland','morocco','lava-field','dune-notes','north-waves'])extracts[id]=JSON.parse(await readFile(resolve(root,`src/maps/travel-v2/${id}.json`),'utf8'));
  const result={},escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  for(const [id,c] of Object.entries(config)){
    const W=1200,ratio=covers[id].width/covers[id].height,H=W/ratio,skyHeight=H*.48;
    const [south,west,north,east]=extracts[c.region].bounds;
    const cosine=Math.cos(c.center[1]*Math.PI/180);
    const unit=Math.max(W*.90/((east-west)*cosine),skyHeight*.98/(north-south));
    const marker=[id==='naoshima'?.76:.60,id==='nanchang'?.17:.18];
    const project=([lon,lat])=>[W*marker[0]+(lon-c.center[0])*cosine*unit,H*marker[1]-(lat-c.center[1])*unit];
    const path=geometry=>{let previous=false;return geometry.map(p=>{if(!p||!Number.isFinite(p.lon)||!Number.isFinite(p.lat)){previous=false;return '';}const cmd=previous?'L':'M';previous=true;return cmd+project([p.lon,p.lat]).map(v=>v.toFixed(2)).join(',');}).join(' ');};
    const ways=extracts[c.region].elements.filter(e=>e.geometry&&e.tags),closed=e=>e.geometry.length>3&&e.geometry[0]&&e.geometry.at(-1)&&e.geometry[0].lon===e.geometry.at(-1).lon&&e.geometry[0].lat===e.geometry.at(-1).lat;
    const ground=ways.filter(e=>closed(e)&&(e.tags.natural==='wood'||e.tags.landuse||e.tags.natural==='water'||e.tags.water)).map(e=>`<path d="${path(e.geometry)}Z" fill="${e.tags.natural==='water'||e.tags.water?'#aec4c9':'#e3dfd0'}" fill-opacity=".52" stroke="#bec7be" stroke-width=".65"/>`).join('');
    const roads=ways.filter(e=>e.tags.highway).map(e=>{
      const major=['motorway','trunk','primary','secondary'].includes(e.tags.highway),minor=['footway','path','track','steps','service'].includes(e.tags.highway);
      return `<path d="${path(e.geometry)}" stroke="${major?'#748385':'#89999a'}" stroke-width="${major?1.5:minor?.52:.8}" opacity="${major?.78:.66}"/>`;
    }).join('');
    const water=ways.filter(e=>e.tags.waterway||e.tags.natural==='coastline'||e.tags.natural==='water'||e.tags.natural==='glacier').map(e=>`<path d="${path(e.geometry)}" stroke="#d8e5e2" stroke-width="${e.tags.waterway?2.5:1.6}" opacity=".94"/>`).join('');
    const [mx,my]=project(c.center);
    // Source-specific masks preserve the photographed roofline, ridge and radio tower.
    let protect='';
    if(id==='nanchang')protect=`<path d="M390 ${H*.215} Q600 ${H*.25} 833 ${H*.215} L854 ${H*.39} 950 ${H*.50} 1200 ${H*.86} V${H} H0 L296 ${H*.51} 386 ${H*.39}Z" fill="black" filter="url(#softProtection)"/>`;
    if(id==='naoshima')protect=`<path d="M660 ${H*.06} H733 L750 ${H*.42} H644Z" fill="black" filter="url(#softProtection)"/><path d="M0 ${H*.38} L250 ${H*.47} 465 ${H*.30} 630 ${H*.42} 820 ${H*.37} 1040 ${H*.22} 1200 ${H*.20} V${H} H0Z" fill="black" filter="url(#softProtection)"/>`;
    const labels=[],occupied=[];
    for(const e of ways.filter(e=>e.tags['name:en']&&(e.tags.waterway||e.tags.natural||['primary','secondary'].includes(e.tags.highway)))){
      const p=e.geometry[Math.floor(e.geometry.length/2)];if(!p)continue;const [x,y]=project([p.lon,p.lat]),name=e.tags['name:en'];
      if(name.length>26||x<W*.27||x>W*.85||y<25||y>skyHeight*.76||Math.hypot(x-mx,y-my)<90||occupied.some(o=>Math.hypot(x-o[0],y-o[1])<140))continue;
      occupied.push([x,y]);labels.push(`<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="13" font-style="italic" letter-spacing="1">${escape(name)}</text>`);if(labels.length===3)break;
    }
    const compass=`<g transform="translate(1128,56)" stroke="#506062" stroke-width=".85"><circle r="17" fill="none"/>${[0,45,90,135,180,225,270,315].map(a=>`<path transform="rotate(${a})" d="M0-26L4 0 0-7-4 0Z" fill="${a%90?'none':'#506062'}"/>`).join('')}<text x="0" y="-33" text-anchor="middle" font-size="11" stroke="none">N</text><text x="32" y="3" font-size="10" stroke="none">E</text><text x="0" y="38" text-anchor="middle" font-size="10" stroke="none">S</text><text x="-38" y="3" font-size="10" stroke="none">W</text></g>`;
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H.toFixed(2)}" data-geography="local-osm" data-map-extent="full-sky"><defs><filter id="softProtection"><feGaussianBlur stdDeviation="5"/></filter><linearGradient id="vertical" x1="0" y1="0" x2="0" y2="1"><stop stop-color="white"/><stop offset=".64" stop-color="white"/><stop offset="1" stop-color="black"/></linearGradient><linearGradient id="horizontal"><stop stop-color="black"/><stop offset=".23" stop-color="white"/><stop offset="1" stop-color="white"/></linearGradient><mask id="horizontalFade"><rect width="1200" height="${skyHeight}" fill="url(#horizontal)"/></mask><mask id="photoSky"><g mask="url(#horizontalFade)"><rect width="1200" height="${skyHeight}" fill="url(#vertical)"/></g>${protect}</mask></defs><g mask="url(#photoSky)"><path d="M0 0H1200V${skyHeight}H0Z" fill="#e6e8df" fill-opacity=".40"/>${ground}<g fill="none" stroke-linecap="round" stroke-linejoin="round">${water}${roads}</g><g font-family="Georgia,Times New Roman,serif" fill="#4c5b5e">${labels.join('')}<text x="${W*.65}" y="${H*.095}" font-size="17" letter-spacing="2.2" font-style="italic">${escape(c.water)}</text></g></g><g font-family="Georgia,Times New Roman,serif" fill="#344448"><circle cx="${mx}" cy="${my}" r="5.5" fill="#be4e43"/><text x="${mx+13}" y="${my+4}" font-size="14">${escape(c.label)}</text>${compass}</g></svg>`;
    const map=`assets/travel-maps-v2/${id}.svg`;await writeFile(resolve(root,map),svg);
    result[id]={...c,map:map+'?v=20261014-journey1',ratio,marker,approximate:true,mapExtent:'full-sky',mapCredit:'© OpenStreetMap contributors'};
  }
  return result;
}
