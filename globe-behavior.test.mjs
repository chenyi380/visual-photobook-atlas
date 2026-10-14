import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import vm from "node:vm";

const root = new URL("./", import.meta.url);
const source = await readFile(new URL("src/system-source.js", root), "utf8");
const context = vm.createContext({ performance: { now: () => 0 }, document: { body: { classList: { contains: () => false } } } });
vm.runInContext(source + "\nthis.testing = { StarGlobe, books, radians };", context);
const { StarGlobe, books, radians } = context.testing;
const modelSource=await readFile(new URL('src/orbital-model.js',root),'utf8');
vm.runInContext(modelSource+'\nthis.physics={ORBIT_ELEMENTS,ORBIT_MU,keplerPosition,orbitPositionAtAnomaly,solveEccentricAnomaly,projectOrbitalPoint,fitPlanetUnit};',context);
const physics=context.physics;
const orbitSource = await readFile(new URL("src/orbit-library.js", root), "utf8");
context.document.querySelector = () => ({ setAttribute() {} });
vm.runInContext(orbitSource + "\nthis.OrbitalLibraryForTest = OrbitalLibrary;", context);
const mockGlobe = () => Object.assign(Object.create(StarGlobe.prototype), {
  width: 1280, height: 720, centerX: 640, centerY: 381.6, restCenterY: 381.6,
  baseRadius: 198, yaw: radians(-45), pitch: radians(15), scale: 1,
  reducedMotion: false, lastTime: 0, transition: null, focusBook: null,
});

test("each destination rotates to the actual visible latitude and longitude", () => {
  for (const book of books) {
    const globe = mockGlobe();
    let completed = 0;
    globe.flyTo(book, { x: 500, y: 600 }, () => completed++);
    globe.update(3200);
    const point = globe.project(book.lat, book.lon);
    assert.ok(point.visible, book.id);
    assert.ok(Math.abs(point.x - globe.centerX) < .001, `${book.id} longitude aligns`);
    assert.ok(Math.abs(point.y - globe.centerY) < .001, `${book.id} latitude aligns`);
    assert.equal(completed, 1);
    assert.equal(globe.scale, 4.1);
    globe.update(3300);
    assert.equal(completed, 1, "completion fires once");
    assert.ok(Math.abs(globe.project(book.lat, book.lon).x - globe.centerX) < .001, "location holds for inspection");
  }
});

test("Nanchang visibly rotates and zooms before arrival", () => {
  const globe = mockGlobe();
  const startYaw = globe.yaw;
  globe.flyTo(books[0], { x: 450, y: 600 }, () => {});
  globe.update(1700);
  assert.ok(Math.abs(globe.yaw - startYaw) > radians(25));
  assert.ok(globe.scale > 1.4);
  assert.ok(globe.scale < 4.1);
  assert.ok(globe.transition, "reader not opened before motion completes");
});

test("embedded texture contains the real JPEG and does not need a separate image request", async () => {
  const bundle = await readFile(new URL("system.js", root), "utf8");
  const jpeg = await readFile(new URL("assets/earth-blue-marble-4k.jpg", root));
  const encoded = bundle.match(/const ATLAS_EARTH_TEXTURE = "data:image\/jpeg;base64,([^"\n]+)";/)?.[1];
  assert.ok(encoded);
  const embedded = Buffer.from(encoded, "base64");
  assert.equal(embedded[0], 255);
  assert.equal(embedded[1], 216);
  const digest = buffer => createHash("sha256").update(buffer).digest("hex");
  assert.equal(digest(embedded), digest(jpeg));
  const map = await readFile(new URL("assets/nanchang-region.svg", root), "utf8");
  assert.ok(map.includes("南昌"));
  assert.equal((map.match(/fill="#ca7655"/g) || []).length, 1, "only Nanchang region is highlighted");
});

test("both orbital book rings stop during hover and resume after pointer departure", () => {
  const library = Object.assign(Object.create(context.OrbitalLibraryForTest.prototype), {
    opened: true, phase: 0, lastTime: 0, hovered: null, focused: null, morph: null,
    element: { dataset: {} }, books, globe: mockGlobe(),
    buttons: books.map(() => ({ dataset: {}, style: { setProperty() {} } })),
  });
  library.update(80);
  assert.ok(library.phase > 0);
  const frozen = library.phase;
  library.hovered = 0;
  library.update(160);
  library.update(240);
  assert.equal(library.phase, frozen);
  assert.equal(library.element.dataset.motion, "paused");
  library.hovered = null;
  library.update(320);
  assert.ok(library.phase > frozen);
  assert.equal(library.element.dataset.motion, "rotating");
  const poses = books.map((_, index) => library.pose(index));
  assert.ok(poses.some(pose => pose.depth > 0) && poses.some(pose => pose.depth < 0));
});

test('NASA Black Marble and every real destination map are bundled', async () => {
  const bundle = await readFile(new URL('system.js', root), 'utf8');
  const night = await readFile(new URL('assets/earth-black-marble-4k.jpg', root));
  const encoded = bundle.match(/const ATLAS_NIGHT_TEXTURE = "data:image\/jpeg;base64,([^"\n]+)";/)?.[1];
  assert.deepEqual(Buffer.from(encoded, 'base64'), night);
  const maps = JSON.parse(bundle.match(/const ATLAS_REGION_MAPS = (.*);\n/)?.[1]);
  assert.deepEqual(Object.keys(maps).sort(), Array.from(books, b=>b.id).sort());
  for (const [id, data] of Object.entries(maps)) {
    const svg = await readFile(new URL(data,root),'utf8');
    assert.ok(svg.includes('<path'), id);
    assert.ok(svg.includes('<circle'), id);
    assert.ok(!/NaN|Infinity|undefined/.test(svg), id);
  }
});

test('small-planet click transforms all books without opening a reader; second click reads', () => {
  const mockButton = () => ({ dataset: {}, style: { setProperty() {} },
    classList: { toggle() {}, remove() {} }, setAttribute() {}, blur() {},
    handlers: {}, addEventListener(name, handler) { this.handlers[name] = handler; } });
  context.document.createElement = mockButton;
  context.document.body.classList.toggle = () => {};
  context.ATLAS_PLANET_IMAGES = Array.from({length:10},()=> 'data:image/png;base64,test');
  context.ATLAS_BOOK_IMAGES = Object.fromEntries(books.map(book=>[book.id,'photo']));
  let read = 0, mode = 0;
  const library = new context.OrbitalLibraryForTest({ dataset: {}, append() {}, setAttribute() {} }, mockGlobe(), books, { activate() { read++; }, mode() { mode++; }, preview() {}, release() {} });
  assert.equal(library.opened, false);
  library.phase = 1.75;
  library.buttons[0].handlers.click();
  assert.equal(library.opened, true);
  assert.equal(library.phase, 0, 'book reveal starts at the reference layout');
  assert.equal(mode, 1);
  assert.equal(read, 0);
  assert.equal(library.element.dataset.mode, 'books');
  library.update(1201);
  library.buttons[0].handlers.click();
  assert.equal(read, 1);
});

test('Kepler equation converges; different orbital planes and periods are real model inputs',()=>{
  assert.equal(physics.ORBIT_ELEMENTS.length,10);
  assert.ok(new Set(physics.ORBIT_ELEMENTS.map(e=>e.i)).size>8);
  assert.ok(new Set(physics.ORBIT_ELEMENTS.map(e=>e.node)).size>8);
  for(const e of physics.ORBIT_ELEMENTS)for(let mean=-20;mean<20;mean+=.137){
    const eccentric=physics.solveEccentricAnomaly(mean,e.e);
    const residual=Math.atan2(Math.sin(eccentric-e.e*Math.sin(eccentric)-mean),Math.cos(eccentric-e.e*Math.sin(eccentric)-mean));
    assert.ok(Math.abs(residual)<1e-10);
  }
});

test('each body returns after its a^(3/2) period and remains outside Earth',()=>{
  for(const e of physics.ORBIT_ELEMENTS){
    const period=2*Math.PI*Math.sqrt(e.a**3/physics.ORBIT_MU);
    const start=physics.keplerPosition(e,0),end=physics.keplerPosition(e,period);
    assert.ok(Math.hypot(start.x-end.x,start.y-end.y,start.z-end.z)<1e-10);
    for(let t=0;t<period;t+=period/160){
      const p=physics.keplerPosition(e,t);
      assert.ok(Math.hypot(p.x,p.y,p.z)>1.5);
    }
  }
});

test('two-body orbital energy and angular momentum remain conserved',()=>{
  const vector=p=>[p.x,p.y,p.z],norm=v=>Math.hypot(...v);
  for(const e of physics.ORBIT_ELEMENTS){
    const expectedEnergy=-physics.ORBIT_MU/(2*e.a),expectedMomentum=Math.sqrt(physics.ORBIT_MU*e.a*(1-e.e*e.e));
    for(let t=0;t<100;t+=2.7){
      const p=vector(physics.keplerPosition(e,t)),before=vector(physics.keplerPosition(e,t-.001)),after=vector(physics.keplerPosition(e,t+.001));
      const v=after.map((x,i)=>(x-before[i])/.002);
      const energy=norm(v)**2/2-physics.ORBIT_MU/norm(p);
      const h=[p[1]*v[2]-p[2]*v[1],p[2]*v[0]-p[0]*v[2],p[0]*v[1]-p[1]*v[0]];
      assert.ok(Math.abs(energy-expectedEnergy)<1e-7);
      assert.ok(Math.abs(norm(h)-expectedMomentum)<1e-7);
    }
  }
});

test('observer projection fits every physical orbit without screen-space squashing',()=>{
  for(const [width,height] of [[1672,941],[1920,1080],[390,844]]){
    const globe={width,height,centerX:width/2,restCenterY:height/2,planetUnit:physics.fitPlanetUnit(width,height)};
    for(const e of physics.ORBIT_ELEMENTS)for(let sample=0;sample<360;sample++){
      const p=physics.projectOrbitalPoint(physics.orbitPositionAtAnomaly(e,sample*Math.PI/180),globe);
      assert.ok(p.x>10&&p.x<width-10&&p.y>10&&p.y<height-10);
    }
  }
});

test('rear bodies are occluded by the Earth and foreground bodies remain visible',()=>{
  const globe=mockGlobe();globe.planetUnit=globe.baseRadius;
  const library=Object.assign(Object.create(context.OrbitalLibraryForTest.prototype),{globe});
  assert.equal(library.isEarthOccluded({x:globe.centerX,y:globe.restCenterY,z:-2}),true);
  assert.equal(library.isEarthOccluded({x:globe.centerX,y:globe.restCenterY,z:2}),false);
  assert.equal(library.isEarthOccluded({x:globe.centerX+400,y:globe.restCenterY,z:-2}),false);
});

test('narrow screens keep all selectable books within horizontal bounds',()=>{
  const library=Object.assign(Object.create(context.OrbitalLibraryForTest.prototype),{phase:0,books,globe:mockGlobe(),opened:true});
  library.globe.width=390;library.globe.centerX=195;
  for(let phase=0;phase<6.3;phase+=.1){
    library.phase=phase;
    for(let index=0;index<10;index++){
      const p=library.pose(index);
      assert.ok(p.x-p.width*p.scale/2>=0);
      assert.ok(p.x+p.width*p.scale/2<=390);
    }
  }
});

test('NASA catalogue sky replaces dense photo, generated dots, colored tails and fake meteors',async()=>{
  const sky=await readFile(new URL('src/sky-renderer.js',root),'utf8');
  assert.match(sky,/nasa-starmap-8k\.jpg/);
  assert.match(sky,/observer-rotation/);
  assert.doesNotMatch(source,/makeNebula|makeStars|const cycle =/);
  assert.doesNotMatch(orbitSource,/shadowColor=colors|\.22-step\/18/);
  const css=await readFile(new URL('system.css',root),'utf8');
  assert.match(css,/\.planet-art \{filter:none !important/);
});

test('Earth drag rotates in both directions and clamps latitude without a jump',async()=>{
  const drag=await readFile(new URL('src/globe-drag.js',root),'utf8');
  vm.runInContext(drag+'\nthis.rotateByPixels=rotateGlobeByPixels;',context);
  const globe=mockGlobe(),start=globe.yaw;
  context.rotateByPixels(globe,80,30);assert.ok(globe.yaw>start);assert.ok(globe.pitch>radians(15));
  context.rotateByPixels(globe,-80,-30);assert.ok(Math.abs(globe.yaw-start)<1e-10);
  context.rotateByPixels(globe,0,10000);assert.equal(globe.pitch,radians(85));
  assert.match(drag,/setPointerCapture/);assert.match(drag,/pointercancel/);assert.match(drag,/Math\.exp\(-delta\/150\)/);
});

test('curved books use tangent strips; photo projections retain aspect and do not claim exact GPS',async()=>{
  assert.match(orbitSource,/tile-segment/);assert.match(orbitSource,/radius\*Math\.sin\(angle\)/);assert.match(orbitSource,/radius\*\(Math\.cos\(angle\)-1\)/);
  const controller=await readFile(new URL('src/atlas-controller.js',root),'utf8');
  assert.match(controller,/height=width\/ratio/);assert.match(controller,/Approximate area/);
  assert.doesNotMatch(controller,/projectionMap'\)\.src = ATLAS_HOLOGRAM_MAPS/);
  const bundle=await readFile(new URL('system.js',root),'utf8');
  const meta=JSON.parse(bundle.match(/const ATLAS_TRAVEL_PHOTOS = (.*);\n/)?.[1]);
  for(const [id,m] of Object.entries(meta)){assert.ok(m.ratio>1);assert.equal(m.approximate,true);const svg=await readFile(new URL(m.map,root),'utf8');assert.match(svg,/fill="#be4e43"/);assert.doesNotMatch(svg,/<rect[^>]*fill="#/);}
});

test('editorial maps include true street detail, red position, compass and kilometre scale', async()=>{
  const bundle=await readFile(new URL('system.js',root),'utf8');
  const maps=JSON.parse(bundle.match(/const ATLAS_REGION_MAPS = (.*);\n/)?.[1]);
  const meta=JSON.parse(bundle.match(/const ATLAS_MAP_META = (.*);\n/)?.[1]);
  assert.ok(meta.nanchang.roadCount>500);
  assert.ok(meta.naoshima.roadCount>100);
  for(const data of Object.values(maps)) {
    const svg=await readFile(new URL(data,root),'utf8');
    assert.match(svg,/viewBox="0 0 900 520"/);
    assert.match(svg,/fill="#bd533e"/);
    assert.match(svg,/>N<\/text>/);
    assert.match(svg,/ km/);
    assert.match(svg,/OpenStreetMap contributors/);
  }
  assert.equal((JSON.parse(bundle.match(/const ATLAS_PLANET_IMAGES = (.*);\n/)?.[1])).length,10);
});
