import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";

const root = new URL("./", import.meta.url);
const read = (name) => readFile(new URL(name, root), "utf8");

test("library exposes real sky, planets, map projection and reader", async () => {
  const html = await read("index.html");
  const css = await read("system.css");
  for (const id of ["spaceCanvas", "skyCanvas", "shelf", "toggleAtlas", "projectionMap", "projectionImage", "memoryProjection", "readerLayer", "bookFrame", "closeReader", "journeyStatus"]) {
    assert.match(html, new RegExp(`id=[\"']${id}[\"']`));
  }
  for (const removed of ["shelf-zone", "shelf-base", "infoDialog", "reader-system", "atlas-header", "brand-mark", "edition"]) {
    assert.doesNotMatch(html, new RegExp(removed));
  }
  assert.doesNotMatch(html, /<h1[^>]*>[\s\S]*?<br>/);
  assert.match(css, /cosmos-stage/);
  assert.match(css, /journey-active/);
});

test("ten books support hover preview and orbital opening", async () => {
  const source = await read("system.js");
  const data = await read("reader-data.js");
  const css = await read("system.css");
  const ids = ["nanchang", "iceland", "naoshima", "morocco", "tidelines", "lava-field", "dune-notes", "white-island", "north-waves", "earth-city"];
  for (const id of ids) assert.match(source, new RegExp(`id: [\"']${id}[\"']`));
  for (const id of ids.slice(1)) assert.match(data, new RegExp(`[\"']?${id}[\"']?: \\{`));
  assert.match(source, /#read\//);
  assert.match(source, /class OrbitalLibrary/);
  assert.match(source, /activate\(book\) \{ openReader\(book\)/);
  assert.ok(/if\s*\(!this.opened\)\s*\{\s*this.setOpen\(true\)/.test(source));
  assert.match(source, /class StarGlobe/);
  assert.match(source, /flyTo\(book/);
  assert.match(source, /lat: 28\.68, lon: 115\.86/);
  assert.doesNotMatch(source, /BOOK \$\{book\.number\}/);
  assert.match(css, /orbital-book.active/);
});

test("capsule reader respects book contract", async () => {
  const html = await read("reader.html");
  const script = await read("reader.js");
  assert.match(html, /id="book" data-page-width="512" data-page-height="640"/);
  assert.match(script, /className = "book-page"/);
  assert.match(script, /index === 0 \|\| index === pages\.length - 1/);
  assert.match(script, /loadFromHTML\(leaves\)/);
});

test("required assets and nested Nanchang reader exist", async () => {
  const paths = [
    "assets/earth-blue-marble.jpg", "assets/eso-milkyway-6k.jpg", "shared/page-flip.browser.js", "shared/paper-grain.svg",
    "books/nanchang/index.html", "assets/iceland/02-volcano.jpg", "assets/naoshima/02-pier.jpg", "assets/morocco/01-kasbah.jpg",
  ];
  await Promise.all(paths.map((name) => access(new URL(name, root))));
});
