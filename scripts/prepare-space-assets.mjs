import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
const require = createRequire(import.meta.url);
const sharp = require("C:/Users/chen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp");
const root = fileURLToPath(new URL("../", import.meta.url));
await mkdir(resolve(root, "assets/orbit"), { recursive: true });
await sharp(resolve(process.argv[2])).resize(4096, 2048).jpeg({ quality: 89, progressive: true }).toFile(resolve(root, "assets/earth-blue-marble-4k.jpg"));
const previews = {
  nanchang: "books/nanchang/assets/photos/3105ebc92f290310db9ccf48f4851473.jpg",
  iceland: "assets/iceland/02-volcano.jpg", naoshima: "assets/naoshima/02-pier.jpg",
  morocco: "assets/morocco/01-kasbah.jpg", tidelines: "assets/naoshima/06-pier-long.jpg",
  "lava-field": "assets/iceland/05-aerial.jpg", "dune-notes": "assets/morocco/05-dunes.jpg",
  "white-island": "assets/naoshima/04-lighthouse.jpg", "north-waves": "assets/iceland/03-waves.jpg",
  "earth-city": "assets/morocco/02-fortress.jpg",
};
for (const [id, file] of Object.entries(previews)) {
  await sharp(resolve(root, file)).rotate().resize(600, 400, { fit: "cover" }).jpeg({ quality: 82 }).toFile(resolve(root, `assets/orbit/${id}.jpg`));
}
console.log("Prepared a 4K Earth texture and ten embedded orbital photo previews.");
