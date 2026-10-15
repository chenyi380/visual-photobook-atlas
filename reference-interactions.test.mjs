import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {inflateSync} from 'node:zlib';
import vm from 'node:vm';

const root=new URL('./',import.meta.url);
const [system,navigation,library,cosmos]=await Promise.all([
  'src/system-source.js','src/scene-navigation.js','src/orbit-library.js','src/handheld-cosmos.js',
].map(path=>readFile(new URL(path,root),'utf8')));
const context=vm.createContext({performance:{now:()=>0},document:{querySelector:()=>null,body:{classList:{contains:()=>false}}}});
vm.runInContext(`${system}\n${navigation}\n${library}\n${cosmos}\nthis.tools={StarGlobe,OrbitalLibrary,HandheldCosmos,bookOrbitTier,bookOrbitPoint,dampedOrbitStep,sceneNavigationPose,cosmosPoint,cylindricalPlayerGeometry};`,context);
const {StarGlobe,OrbitalLibrary,HandheldCosmos,bookOrbitTier,bookOrbitPoint,dampedOrbitStep,sceneNavigationPose,cosmosPoint,cylindricalPlayerGeometry}=context.tools;

// Exercise the actual resize contract, rather than copying scene constants into
// the tests. None of these tests starts animation, a browser, or a renderer.
function globeFor(width,height,opened=false) {
  Object.assign(context,{innerWidth:width,innerHeight:height,devicePixelRatio:1});
  const canvas=()=>({width:0,height:0});
  const drawing={setTransform(){}};
  const globe=Object.assign(Object.create(StarGlobe.prototype),{
    canvas:canvas(),effectsCanvas:canvas(),orbitCanvas:canvas(),
    context:drawing,effectsContext:drawing,orbitContext:drawing,
    prepareSphereGrid(){},libraryOpened:opened,scale:1,reducedMotion:false,
  });
  globe.resize();
  return globe;
}
const near=(actual,expected,epsilon=1e-9)=>assert.ok(Math.abs(actual-expected)<=epsilon,`${actual} differs from ${expected}`);
const finite=(point,keys)=>keys.forEach(key=>assert.ok(Number.isFinite(point[key]),`${key}: ${point[key]}`));

test('glass players have visibly bowed upper and lower edges, not rectangular rims',()=>{
  for(const [width,height] of [[236,138],[180,105],[86,57]]) {
    const geometry=cylindricalPlayerGeometry(width,height);
    assert.equal(geometry.strips.length,31);
    assert.ok(geometry.topBow>=height*.12,`top bow ${geometry.topBow} must be visible at ${width}px`);
    assert.ok(geometry.bottomBow>=height*.12,`bottom bow ${geometry.bottomBow} must be visible at ${width}px`);
    if(width===236){assert.ok(geometry.topBow>=20&&geometry.topBow<=28);}
    assert.match(geometry.path,/^M/);assert.match(geometry.path,/ Z$/);assert.doesNotMatch(geometry.path,/NaN|Infinity|undefined/);
    const railBow=geometry.project(.5,.48).y-(geometry.project(.1,.48).y+geometry.project(.9,.48).y)/2;
    assert.ok(railBow>height*.08,'content rail follows the curved glass rather than remaining straight');
    for(let u=0;u<=1;u+=.01)for(const v of [0,.5,1]) {
      const p=geometry.project(u,v);finite(p,['x','y']);
      assert.ok(p.x>=-.001&&p.x<=width+.001&&p.y>=-.001&&p.y<=height+.001);
    }
  }
});

test('borderless player content strips project continuously onto the single glass surface',()=>{
  const geometry=cylindricalPlayerGeometry(236,138),height=138;
  const map=(strip,x,y)=>{const [a,b,c,d,e,f]=strip.matrix;return{x:a*x+c*y+e,y:b*x+d*y+f};};
  for(let index=0;index<geometry.strips.length;index++) {
    const strip=geometry.strips[index],m=strip.matrix;
    assert.ok(m.every(Number.isFinite));assert.ok(m[0]*m[3]-m[1]*m[2]>.5);
    if(index===geometry.strips.length-1)continue;
    for(const y of [0,height/2,height]) {
      const right=map(strip,strip.width,y),left=map(geometry.strips[index+1],0,y);
      assert.ok(Math.hypot(right.x-left.x,right.y-left.y)<.5,'adjacent content strips cannot leave a visible grid seam');
    }
  }
  assert.match(library,/length:31/);
  assert.match(library,/class="player-shell"/);
  assert.match(library,/cylindricalPlayerGeometry\(pose\.width,pose\.height\)/);
});

test('reference players occupy exactly three shared cylindrical tiers',()=>{
  for(const [width,height] of [[1672,941],[1280,720],[390,844]]) {
    const globe=globeFor(width,height,true);
    const tiers=Array.from({length:10},(_,i)=>bookOrbitTier(i,globe));
    assert.deepEqual([...new Set(tiers.map(p=>p.tier))].sort(),[0,1,2]);
    assert.equal(new Set(tiers.map(p=>p.radius)).size,1,'all three levels share one cylinder');
    assert.equal(new Set(tiers.map(p=>p.tilt)).size,1,'no independent rocking planes');
    for(const tier of tiers) {
      assert.equal(Math.sign(tier.altitude),Math.sign(tier.tier-1));
      assert.ok(tier.radius>0&&tier.radius<width/2);
    }
    near(tiers.find(p=>p.tier===0).altitude,-tiers.find(p=>p.tier===2).altitude);
    near(tiers.find(p=>p.tier===1).altitude,0);
  }
});

test('all player tiers share perspective, phase and a continuous 3D circle',()=>{
  const globe=globeFor(1672,941,true);
  for(let sample=0;sample<=360;sample++) {
    const angle=sample*Math.PI/180;
    const points=[0,1,5].map(index=>bookOrbitPoint(index,angle,globe));
    for(const point of points) {
      finite(point,['x','y','z','depth','perspective','worldRadius','altitude']);
      near(point.perspective,points[0].perspective);
      near(point.x,points[0].x);near(point.z,points[0].z);
      const tier=bookOrbitTier(point.tier===0?1:point.tier===1?0:5,globe);
      const x=(point.x-globe.centerX)/point.perspective;
      const z=point.z/Math.cos(tier.tilt);
      near(Math.hypot(x,z),tier.radius,1e-8);
      near((point.y-globe.restCenterY)/point.perspective,point.altitude+Math.cos(angle)*tier.radius*Math.sin(tier.tilt),1e-8);
    }
    near(points[2].y-points[0].y,(points[2].altitude-points[0].altitude)*points[0].perspective,1e-8);
  }
  const front=bookOrbitPoint(5,0,globe),rear=bookOrbitPoint(5,Math.PI,globe);
  assert.ok(front.perspective>1&&rear.perspective<1);
  assert.ok(front.y>rear.y,'same tier gets its depth from the common camera');
});

test('every player remains inside desktop and narrow-screen bounds for a full revolution',()=>{
  for(const [width,height] of [[1672,941],[1280,720],[390,844],[320,720]]) {
    const globe=globeFor(width,height,true);
    const orbit=Object.assign(Object.create(OrbitalLibrary.prototype),{globe,phase:0});
    for(let sample=0;sample<720;sample++) {
      orbit.phase=sample*Math.PI/360;
      for(let index=0;index<10;index++) {
        const p=orbit.bookPose(index),selectedScale=p.scale+.075;
        finite(p,['x','y','z','depth','scale','width','height','turn','roll']);
        assert.ok(p.width>0&&p.height>0);
        assert.ok(Math.abs(p.turn)<90&&p.roll===0,'readable tangency without unrelated wobble');
        assert.ok(p.x-p.width*selectedScale/2>=0,`${width}: album ${index} clipped left`);
        assert.ok(p.x+p.width*selectedScale/2<=width,`${width}: album ${index} clipped right`);
        assert.ok(p.y-p.height*selectedScale/2>=0,`${height}: album ${index} clipped above`);
        assert.ok(p.y+p.height*selectedScale/2<=height,`${height}: album ${index} clipped below`);
      }
    }
  }
});

test('player acceleration and hover braking are frame-rate independent',()=>{
  const integrate=dt=>{
    let speed=0,angle=0;
    for(const [duration,target] of [[800,.000075],[880,0],[800,.000075]]) {
      for(let elapsed=0;elapsed<duration;elapsed+=dt) {
        const step=dampedOrbitStep(speed,target,Math.min(dt,duration-elapsed),110);
        speed=step.speed;angle+=step.angle;
      }
    }
    return {speed,angle};
  };
  const a=integrate(16),b=integrate(40),c=integrate(1000/60);
  near(a.angle,b.angle,1e-12);near(a.angle,c.angle,1e-12);
  near(a.speed,b.speed,1e-12);near(a.speed,c.speed,1e-12);
  const unchanged=dampedOrbitStep(.00005,0,0,110);
  near(unchanged.angle,0);near(unchanged.speed,.00005);
  const resting=dampedOrbitStep(0,0,800,110);
  near(resting.angle,0);near(resting.speed,0);
});

test('wheel reversal retains proportional first-stage magnification and returns exactly',()=>{
  const planet=200,book=240;
  for(let sample=0;sample<=1000;sample++) {
    const p=sample/1000,a=sceneNavigationPose(p,planet,book),b=sceneNavigationPose(1-(1-p),planet,book);
    near(a.radius,b.radius);near(a.zoom,b.zoom);near(a.blend,b.blend);
    assert.ok(a.center>=.43&&a.center<=.54);
    if(p<=.22){near(a.blend,0);near(a.radius/planet,a.zoom);}
  }
  near(sceneNavigationPose(-1,planet,book).center,.43);
  near(sceneNavigationPose(2,planet,book).center,.54);
  near(sceneNavigationPose(0,planet,book).radius,planet);
  near(sceneNavigationPose(1,planet,book).radius,book);
});

test('cosmos projection is finite, periodic, and rotates true orbital planes',()=>{
  const globe=globeFor(1672,941);
  const zero=cosmosPoint(2.4,0,.31,-.18,globe);
  near(zero.x,globe.centerX);near(zero.y,globe.restCenterY);near(zero.perspective,1);
  for(const radius of [0,2.4,2.7,3.3])for(const tilt of [-Math.PI/2,0,.31,Math.PI/2])for(const roll of [-1.2,0,1.2]) {
    for(let sample=0;sample<360;sample+=3) {
      const angle=sample*Math.PI/180,a=cosmosPoint(angle,radius,tilt,roll,globe),b=cosmosPoint(angle+Math.PI*2,radius,tilt,roll,globe);
      finite(a,['x','y','z','depth','perspective']);near(a.x,b.x,1e-8);near(a.y,b.y,1e-8);near(a.z,b.z,1e-8);
      assert.ok(a.perspective>0&&a.perspective<1.5);
    }
  }
  const unrolled=cosmosPoint(0,2.5,.31,0,globe),rolled=cosmosPoint(0,2.5,.31,Math.PI/2,globe);
  near(unrolled.y,globe.restCenterY);near(rolled.x,globe.centerX);
  near(rolled.y-globe.restCenterY,unrolled.x-globe.centerX);
});

test('one fitted observer keeps whole orbital planes inside the viewport at the actual final 1.12 intro scale',()=>{
  const fitObserver=vm.runInContext('cosmicObserverFit',context);
  for(const [width,height] of [[1672,941],[1280,720],[390,844],[320,720]]) {
    const globe=globeFor(width,height),scene=new HandheldCosmos(globe);
    scene.pose=vm.runInContext('cosmicIntroPose(4000)',context);
    near(scene.pose.scale,1.12);
    const fit=fitObserver(globe,scene.pose.scale,scene.pose.center);
    assert.ok(fit>0&&fit<=1);
    globe.cosmicIntroScale=scene.pose.scale*fit;
    globe.baseRadius=globe.planetRadius*globe.cosmicIntroScale;
    globe.planetUnit=globe.planetBaseUnit*globe.cosmicIntroScale;
    globe.restCenterY=height*scene.pose.center;
    for(let frame=0;frame<=5400;frame++) {
      const seconds=frame/30;
      for(let index=0;index<10;index++) {
        const p=scene.planetPose(index,seconds);
        finite(p,['x','y','z','depth','perspective','width','height','visibleSize','physicalRadius']);
        assert.ok(p.width>=30&&p.height>=30&&p.physicalRadius>0);assert.equal(p.planetAlpha,1);
        assert.ok(p.x-p.width/2>=0,`${width}x${height} frame ${frame} planet ${index}: left ${p.x-p.width/2}`);
        assert.ok(p.x+p.width/2<=width,`${width}x${height} frame ${frame} planet ${index}: right ${p.x+p.width/2}`);
        assert.ok(p.y-p.height/2>=0,`${width}x${height} frame ${frame} planet ${index}: top ${p.y-p.height/2}`);
        assert.ok(p.y+p.height/2<=height,`${width}x${height} frame ${frame} planet ${index}: bottom ${p.y+p.height/2}`);
      }
    }
  }
});

test('cosmos occlusion distinguishes Earth, rear objects and foreground objects',()=>{
  const globe=globeFor(1280,720),scene=new HandheldCosmos(globe);
  const center={x:globe.centerX,y:globe.restCenterY};
  assert.equal(scene.occluded({...center,z:-3}),true);
  assert.equal(scene.occluded({...center,z:3}),false);
  assert.equal(scene.occluded({x:globe.centerX+globe.baseRadius*2,y:globe.restCenterY,z:-3}),false);
  assert.ok(scene.decorations(0,.37).every(point=>point.alpha===0),'decorations wait for the satellite-birth phase');
  scene.pose=vm.runInContext('cosmicIntroPose(4000)',context);
  for(const seconds of [0,1,90,1e6]) {
    const points=scene.decorations(seconds,.37);
    // Four quiet secondary satellites replace the previous 18-object clutter;
    // the ten accessible destination planets remain separate and unchanged.
    assert.equal(points.length,4);
    for(const point of points) {
      finite(point,['x','y','z','perspective','physicalRadius','visibleSize','alpha']);
      assert.equal(point.alpha,.37);assert.ok(point.physicalRadius>0&&point.visibleSize>0);
    }
  }
});

test('supporting hand is a real high-resolution RGBA PNG with transparent background and a visible subject',async()=>{
  const png=await readFile(new URL('assets/cosmos-v3/supporting-hand.png',root));
  assert.deepEqual(png.subarray(0,8),Buffer.from([137,80,78,71,13,10,26,10]));
  const width=png.readUInt32BE(16),height=png.readUInt32BE(20);
  assert.ok(width>=1000&&height>=500);assert.equal(png[24],8);assert.equal(png[25],6);assert.equal(png[28],0);
  const chunks=[];
  for(let offset=8;offset<png.length;){const size=png.readUInt32BE(offset),type=png.toString('ascii',offset+4,offset+8);if(type==='IDAT')chunks.push(png.subarray(offset+8,offset+8+size));offset+=size+12;}
  const data=inflateSync(Buffer.concat(chunks)),stride=width*4;
  assert.equal(data.length,(stride+1)*height);
  let previous=new Uint8Array(stride),transparent=0,opaque=0;
  const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
  for(let y=0;y<height;y++) {
    const filter=data[y*(stride+1)],row=new Uint8Array(stride);assert.ok(filter<=4);
    for(let x=0;x<stride;x++) {
      const left=x>=4?row[x-4]:0,up=previous[x],upperLeft=x>=4?previous[x-4]:0;
      const predictor=filter===0?0:filter===1?left:filter===2?up:filter===3?Math.floor((left+up)/2):paeth(left,up,upperLeft);
      row[x]=(data[y*(stride+1)+1+x]+predictor)&255;
      if(x%4===3){if(row[x]===0)transparent++;if(row[x]>=240)opaque++;}
    }
    previous=row;
  }
  assert.ok(transparent>width*height*.10,'a painted opaque backdrop is not a transparent cutout');
  assert.ok(opaque>width*height*.05,'the subject needs substantial near-opaque photographic detail');
});
