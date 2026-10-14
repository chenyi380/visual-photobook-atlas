import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const sharp = require('C:/Users/chen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = fileURLToPath(new URL('../', import.meta.url));
await sharp(resolve(process.argv[2])).resize(4096, 2048).jpeg({ quality: 94 }).toFile(resolve(root, 'assets/earth-black-marble-4k.jpg'));
await sharp(resolve(process.argv[3])).resize(256, 256, { fit: 'contain' }).png().toFile(resolve(root, 'assets/asteroid.png'));
console.log('Prepared NASA night texture and transparent asteroid artwork.');
