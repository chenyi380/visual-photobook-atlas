import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

export async function buildEditorialMaps(root, ids, destinations, world) {
  await mkdir(resolve(root,'assets/maps'),{recursive:true});
  const regions = {
    nanchang:{title:'NANCHANG',country:'JIANGXI · CHINA',box:[28.625,115.81,28.72,115.965],km:3,
      points:[['Tengwang Pavilion',115.8797,28.6846],['Wanshou Palace',115.883,28.6755],['Bayi Square',115.9026,28.6748],['Nanchang Star',115.8591,28.6502],['Nanchang Station',115.9194,28.6628]],water:'Gan River'},
    naoshima:{title:'NAOSHIMA',country:'SETOUCHI · JAPAN',box:[34.40,133.91,34.51,134.04],km:3,
      points:[['Miyanoura Port',133.9706,34.4614],['Chichu Art Museum',133.9842,34.4493],['Benesse House',133.9935,34.4440],['Honmura',133.9988,34.4588],['Seto Inland Sea',133.94,34.427]],water:'Seto Inland Sea'},
    iceland:{title:'ICELAND',country:'NORTH ATLANTIC',box:[63.25,-24.7,66.65,-13.3],km:100,
      points:[['Reykjavik',-21.94,64.1466],['Thingvellir',-21.129,64.255],['Reykjanes',-22.45,63.88],['Vik',-19.04,63.40],['Highlands',-19.02,64.96]],water:'North Atlantic'},
    morocco:{title:'MOROCCO',country:'NORTH AFRICA',box:[28.6,-10.6,35.9,-2.0],km:100,
      points:[['Marrakech',-7.9811,31.6295],['Ait Benhaddou',-7.13,31.05],['Ouarzazate',-6.91,30.92],['Merzouga',-4.01,31.10],['High Atlas',-7.09,31.79]],water:'Atlantic Ocean'},
  };
  const extracts = {};
  for(const key of Object.keys(regions)) {
    try { extracts[key]=JSON.parse(await readFile(resolve(root,`src/maps/${key}.json`),'utf8')); }
    catch { if(['nanchang','naoshima'].includes(key)) throw new Error(`${key}: city street map is required`); }
  }
  const data={},meta={};
  const countryKey = id => id==='nanchang' ? id : ['naoshima','tidelines','white-island'].includes(id) ? 'naoshima' : ['iceland','lava-field','north-waves'].includes(id) ? 'iceland' : 'morocco';
  const esc = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  for(const id of ids) {
    const key=countryKey(id),region=regions[key], [south,west,north,east]=region.box;
    const latitude=(south+north)/2, cosine=Math.cos(latitude*Math.PI/180);
    const unit=Math.min(730/((east-west)*cosine),425/(north-south));
    const ox=160+(730-(east-west)*cosine*unit)/2,oy=15+(425-(north-south)*unit)/2;
    const project=([lon,lat])=>[ox+(lon-west)*cosine*unit,oy+(north-lat)*unit];
    const d = geometry => {
      let previous=false;
      return geometry.map(p=>{if(!p||!Number.isFinite(p.lon)||!Number.isFinite(p.lat)){previous=false;return '';}const xy=project([p.lon,p.lat]);const command=previous?'L':'M';previous=true;return command+xy.map(n=>n.toFixed(1)).join(',');}).join(' ');
    };
    const ways=extracts[key]?.elements.filter(e=>e.type==='way' && e.geometry) ?? [];
    const coast=ways.filter(e=>e.tags?.natural==='coastline').map(e=>`<path d="${d(e.geometry)}" fill="none" stroke="#fff" stroke-width="1.1" opacity=".82"/>`).join('');
    const water=ways.filter(e=>e.tags?.waterway||e.tags?.natural==='water').map(e=>`<path d="${d(e.geometry)}" fill="${e.tags?.natural==='water' ? '#c1d8e0' : 'none'}" stroke="#e8f3f6" stroke-width="${e.tags?.waterway==='river' ? 2.7 : .6}" opacity=".68"/>`).join('');
    const roads=ways.filter(e=>e.tags?.highway).map(e=>`<path d="${d(e.geometry)}" fill="none" stroke="#fff" stroke-width="${['motorway','trunk','primary'].includes(e.tags.highway)? .95 : .42}" opacity="${['residential','service'].includes(e.tags.highway)? .40 : .66}"/>`).join('');
    let boundaries='';
    if(['iceland','morocco'].includes(key)) {
      boundaries=world.features.filter(f=>f.properties.ADMIN===destinations[id][0]).map(f=>{
        const rings=f.geometry.type==='Polygon' ? f.geometry.coordinates : f.geometry.coordinates.flat(1);
        return rings.map(r=>`<path d="${d(r.map(([lon,lat])=>({lon,lat})))}Z" fill="#e4eef1" fill-opacity=".12" stroke="#fff" stroke-width="1.1" opacity=".8"/>`).join('');
      }).join('');
    }
    const [,lon,lat]=destinations[id], [mx,my]=project([lon,lat]);
    const labels=region.points.map(([name,lon,lat],i)=>{
      const [x,y]=project([lon,lat]);
      const dir=i%2 ? -1 : 1;
      const end=x+dir*24,ly=y+(i%2 ? 15 : -10);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2" fill="#3c5662"/><path d="M${x.toFixed(1)},${y.toFixed(1)}L${end.toFixed(1)},${ly.toFixed(1)}" fill="none" stroke="#57717b" stroke-width=".6"/><text x="${(end+dir*4).toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${dir>0?'start':'end'}" fill="#3b535e" font-family="Georgia,Times New Roman,serif" font-style="italic" font-size="13" letter-spacing=".8">${esc(name)}</text>`;
    }).join('');
    const ruler=region.km/111.32*unit;
    const ticks=Array.from({length:4},(_,i)=>{const x=875-ruler+i*ruler/3;return `<path d="M${x.toFixed(1)} 111v7" stroke="#415863" stroke-width=".7"/><text x="${x.toFixed(1)}" y="132" text-anchor="middle" font-family="Georgia,serif" fill="#415863" font-size="12">${Math.round(i*region.km/3)}${i===3?' km':''}</text>`;}).join('');
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 520"><defs><clipPath id="clip"><rect x="0" y="0" width="900" height="460"/></clipPath><linearGradient id="fade"><stop stop-color="#d6e7eb" stop-opacity=".82"/><stop offset=".31" stop-color="#d6e7eb" stop-opacity="0"/></linearGradient></defs><g clip-path="url(#clip)">${boundaries}${water}${coast}${roads}<rect width="900" height="520" fill="url(#fade)"/>${labels}<circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="5.8" fill="#bd533e"/><text x="${(mx-12).toFixed(1)}" y="${(my-14).toFixed(1)}" text-anchor="end" fill="#354e5a" font-family="Georgia,serif" font-size="16">${region.title==='NANCHANG'?'Nanchang':region.title==='NAOSHIMA'?'Naoshima':region.title==='ICELAND'?'Iceland':'Morocco'}</text><text x="738" y="396" fill="#405c69" font-family="Georgia,serif" font-style="italic" font-size="15" letter-spacing="3">${esc(region.water)}</text></g><g fill="none" stroke="#425b68" stroke-width=".8"><circle cx="854" cy="70" r="13"/><path d="M854 52v36M836 70h36"/><path d="M${(875-ruler).toFixed(1)} 114H875"/></g><text x="854" y="47" text-anchor="middle" fill="#3b5664" font-family="Georgia,serif" font-size="13">N</text>${ticks}<text x="879" y="507" text-anchor="end" fill="#3d5d6b" opacity=".8" font-family="Georgia,serif" font-size="9">© OpenStreetMap contributors · Natural Earth</text></svg>`;
    data[id]=`assets/maps/${id}.svg`;
    await writeFile(resolve(root,data[id]),svg);
    meta[id]={title:region.title,country:region.country,landmarks:region.points.map(p=>p[0]),roadCount:ways.filter(e=>e.tags?.highway).length};
    if(id===key) await writeFile(resolve(root,`assets/${key}-editorial-map.svg`),svg);
  }
  return {data,meta};
}
