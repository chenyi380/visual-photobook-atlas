import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('./src/handheld-cosmos.js',import.meta.url),'utf8');
const context=vm.createContext({Math});
vm.runInContext(source+';globalThis.pose=cosmicIntroPose;',context);

test('opening follows the supplied four-second hand-to-energy timeline',()=>{
  const p=context.pose;
  assert.equal(p(0).phase,'black');assert.equal(p(350).veil,1);
  assert.equal(p(650).phase,'fist');assert.ok(p(650).fist>0);
  assert.equal(p(1050).phase,'unfurl');assert.ok(p(1050).unfurl>0);
  assert.ok(p(1500).hand>.9);assert.ok(p(2000).formation>.99);
  assert.equal(p(2500).phase,'satellites');assert.equal(p(3250).phase,'vortex');
  assert.equal(p(4000).active,false);assert.equal(p(4000).hand,0);assert.equal(p(4000).core,1);
});
test('intro camera is finite, monotone in size and has no completion jump',()=>{
  let last=0;
  for(let t=0;t<=4500;t+=10){const p=context.pose(t);assert.ok(p.scale>=last-1e-10);assert.ok(p.center>=.43&&p.center<=.54);assert.ok(p.reveal>=0&&p.reveal<=1);last=p.scale;}
  assert.equal(context.pose(4000).scale,context.pose(4500).scale);
});
test('reduced motion immediately shows the settled scene without a hand or camera animation',()=>{
  const p=context.pose(0,true);assert.equal(p.active,false);assert.equal(p.veil,0);assert.equal(p.hand,0);assert.equal(p.fist,0);assert.equal(p.unfurl,0);assert.equal(p.core,1);
});
test('nebula is a continuous GPU density volume, not CPU parallel ellipse strokes',async()=>{
  const shader=await readFile(new URL('./src/nebula-ring.js',import.meta.url),'utf8');
  assert.match(shader,/float fbm\(/);assert.match(shader,/foregroundMask/);assert.match(shader,/for\(int layer=0;layer<3;layer\+\+\)/);
  assert.doesNotMatch(source,/for\(let band=/);assert.doesNotMatch(source,/lineTo|stroke\(/);
});
