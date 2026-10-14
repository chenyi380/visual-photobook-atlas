import {mkdir,writeFile,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('../src/maps/travel-v2/',import.meta.url));
await mkdir(dir,{recursive:true});
const bounds={iceland:[63.92,-16.35,64.17,-15.98],morocco:[30.97,-7.23,31.12,-7.00],'lava-field':[63.86,-22.30,63.96,-22.10],'dune-notes':[31.0,-4.12,31.20,-3.86],'north-waves':[63.34,-19.25,63.48,-19.02]};
const pending=Object.entries(bounds);
async function worker(){while(pending.length){const [id,box]=pending.shift();try{await access(dir+id+'.json');console.log(id,'cached');continue;}catch{}
 const [south,west,north,east]=box;
 const r=await fetch(`https://api.openstreetmap.org/api/0.6/map?bbox=${west},${south},${east},${north}`,{headers:{'User-Agent':'VisualPhotobookAtlas/2.0'},signal:AbortSignal.timeout(45000)});
 if(!r.ok)throw Error(`${id}: ${r.status} ${(await r.text()).slice(0,180)}`);const xml=await r.text();
 const attributes=text=>Object.fromEntries([...text.matchAll(/([\w:]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
 const nodes=new Map([...xml.matchAll(/<node\b([^>]+)>?/g)].map(m=>{const a=attributes(m[1]);return[a.id,{lat:Number(a.lat),lon:Number(a.lon)}];}));
 const elements=[...xml.matchAll(/<way\b([^>]+)>([\s\S]*?)<\/way>/g)].map(m=>({type:'way',id:attributes(m[1]).id,tags:Object.fromEntries([...m[2].matchAll(/<tag\b([^>]+)\/>/g)].map(t=>{const a=attributes(t[1]);return[a.k,a.v];})),geometry:[...m[2].matchAll(/<nd ref="(\d+)"\/>/g)].map(n=>nodes.get(n[1]))})).filter(e=>e.tags.highway||e.tags.waterway||/coastline|water|glacier|ridge|cliff/.test(e.tags.natural??''));
 const data={elements};if(!elements.length)throw Error(`${id}: incomplete map`);
 await writeFile(dir+id+'.json',JSON.stringify({bounds:box,...data}));console.log(id,data.elements.length);
}}
await Promise.all([worker(),worker()]);
