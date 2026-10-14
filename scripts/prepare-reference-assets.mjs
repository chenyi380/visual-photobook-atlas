import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const sharp = require('C:/Users/chen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = fileURLToPath(new URL('../',import.meta.url));
await sharp(resolve(process.argv[2])).resize(2160,1216,{fit:'cover'}).jpeg({quality:90}).toFile(resolve(root,'assets/galaxy-reference.jpg'));
const atlas = resolve(process.argv[3]);
const meta = await sharp(atlas).metadata();
await mkdir(resolve(root,'assets/planets'),{recursive:true});
for (let index=0;index<10;index++) {
  const col=index%5,row=Math.floor(index/5);
  const left=Math.round(col*meta.width/5),right=Math.round((col+1)*meta.width/5);
  const top=Math.round(row*meta.height/2),bottom=Math.round((row+1)*meta.height/2);
  await sharp(atlas).extract({left,top,width:right-left,height:bottom-top}).resize(144,144,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png().toFile(resolve(root,`assets/planets/${index}.png`));
}
console.log('Prepared star field and ten transparent colorful planets.');
