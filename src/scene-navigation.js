// One reversible camera/reveal coordinate. Wheels never create competing tweens.
function sceneNavigationPose(progress,planetRadius,bookRadius) {
  const p=clamp(progress,0,1),t=clamp((p-.22)/.78,0,1);
  const blend=t*t*(3-2*t),zoom=1+.24*Math.min(p/.22,1)*(1-blend);
  return {progress:p,blend,zoom,radius:(planetRadius+(bookRadius-planetRadius)*blend)*zoom,center:.43+.11*blend};
}
class SceneNavigationController {
  constructor(globe,library,onMode,blocked) {
    Object.assign(this,{globe,library,onMode,blocked,progress:0,target:0,lastTime:performance.now()});
    globe.sceneController=this;library.navigation=this;
    addEventListener('wheel',event=>{
      if(event.ctrlKey||event.metaKey||this.blocked()||event.target.closest('dialog,a'))return;
      const pixels=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);
      if(Math.abs(pixels)<.5)return;
      event.preventDefault();
      this.target=clamp(this.target-pixels/850,0,1);
      library.hovered=library.focused=null;library.previewHeld=false;
      if(document.activeElement?.classList.contains('orbital-book'))document.activeElement.blur();
    },{passive:false});
  }
  setOpen(opened){this.target=opened?1:0;}
  get settled(){return Math.abs(this.progress-this.target)<.0005;}
  update(time) {
    const delta=Math.max(0,Math.min(time-this.lastTime,80));this.lastTime=time;
    this.progress+=(this.target-this.progress)*(this.globe.reducedMotion?1:1-Math.exp(-delta/140));
    if(Math.abs(this.progress-this.target)<.0005)this.progress=this.target;
    const g=this.globe,pose=sceneNavigationPose(this.progress,g.planetRadius,g.bookRadius);
    const introScale=1+((g.cosmicIntroScale??1)-1)*(1-pose.blend);
    g.sceneZoom=pose.zoom;g.libraryBlend=pose.blend;g.baseRadius=pose.radius*introScale;g.targetRadius=0;
    g.planetUnit=(g.planetBaseUnit??g.planetUnit)*pose.zoom*introScale;
    g.restCenterY=g.height*(pose.center+((g.cosmicIntroCenter??.43)-.43)*(1-pose.blend));g.centerY=g.restCenterY;
    const opened=pose.blend>.5;
    if(opened!==this.library.opened){this.library.opened=opened;this.library.active=null;this.library.syncLabels();this.onMode(opened);}
    g.libraryOpened=opened;
    this.library.element.style.setProperty('--library-blend',pose.blend.toFixed(5));
    this.library.element.dataset.sceneProgress=this.progress.toFixed(4);
    this.library.element.dataset.sceneZoom=pose.zoom.toFixed(4);
    this.library.element.dataset.reveal=pose.blend.toFixed(4);
    document.body.classList.toggle('orbits-open',opened);
    if(pose.blend===1&&this.settled){const index=this.library.hovered??this.library.focused;if(index!=null)this.library.preview(index);}
  }
}

// Three levels on one cylinder share a camera and angular velocity. The offsets
// belong to the orbital planes, not to an independent screen-space bobbing effect.
function bookOrbitTier(index,globe) {
  const mobile=globe.width<720;
  const tiers=[1,0,1,0,1,2,2,2,0,1];
  const tier=tiers[index]??1;
  return {tier,radius:mobile?globe.width*.295:Math.min(globe.width*.335,globe.height*.64),
    altitude:(tier-1)*globe.height*(mobile?.145:.19),tilt:(mobile?10:7)*Math.PI/180};
}
// Actual three-dimensional circles viewed through one perspective camera.
function bookOrbitPoint(index,angle,globe) {
  const {tier,radius,altitude,tilt}=bookOrbitTier(index,globe),camera=globe.width*3;
  const z=radius*Math.cos(angle)*Math.cos(tilt),perspective=camera/(camera-z);
  const zoom=globe.sceneZoom??1;
  return {x:globe.centerX+Math.sin(angle)*radius*perspective*zoom,
    y:globe.restCenterY+(altitude+Math.cos(angle)*radius*Math.sin(tilt))*perspective*zoom,
    z,depth:Math.cos(angle),perspective,worldRadius:radius,tier,altitude};
}
function dampedOrbitStep(speed,target,delta,tau=100) {
  const decay=Math.exp(-delta/tau);
  return {speed:target+(speed-target)*decay,angle:target*delta+(speed-target)*tau*(1-decay)};
}

// The player's screen is a section of a cylinder seen from an elevated camera.
// A yaw-only transform cannot reveal this bow: depth must also displace the
// upper/lower edges vertically. The silhouette and native content use exactly
// the same projected surface, with one continuous rim and no strip borders.
function cylindricalPlayerGeometry(width,height,segmentCount=31) {
  const arc=1.50,radius=width/arc,elevation=.60,camera=width*8;
  const raw=(u,v)=>{
    const angle=(u-.5)*arc,x=radius*Math.sin(angle),z=radius*(Math.cos(angle)-1),y=(v-.5)*height;
    const screenY=y*Math.cos(elevation)+z*Math.sin(elevation);
    const depth=z*Math.cos(elevation)-y*Math.sin(elevation),p=camera/(camera-depth);
    return {x:x*p,y:screenY*p};
  };
  const bounds=[];
  for(let n=0;n<=64;n++)for(const v of [0,1])bounds.push(raw(n/64,v));
  const minX=Math.min(...bounds.map(p=>p.x)),maxX=Math.max(...bounds.map(p=>p.x));
  const minY=Math.min(...bounds.map(p=>p.y)),maxY=Math.max(...bounds.map(p=>p.y));
  const project=(u,v)=>{const p=raw(u,v);return {x:(p.x-minX)*width/(maxX-minX),y:(p.y-minY)*height/(maxY-minY)};};
  const rx=Math.min(.045,8/width),ry=Math.min(.075,8/height),boundary=[];
  const edge=(u0,v0,u1,v1,count=32)=>{for(let n=0;n<=count;n++){const t=n/count;boundary.push(project(u0+(u1-u0)*t,v0+(v1-v0)*t));}};
  const corner=(cx,cy,from,to)=>{for(let n=1;n<=8;n++){const a=from+(to-from)*n/8;boundary.push(project(cx+rx*Math.cos(a),cy+ry*Math.sin(a)));}};
  edge(rx,0,1-rx,0);corner(1-rx,ry,-Math.PI/2,0);
  edge(1,ry,1,1-ry,8);corner(1-rx,1-ry,0,Math.PI/2);
  edge(1-rx,1,rx,1);corner(rx,1-ry,Math.PI/2,Math.PI);
  edge(0,1-ry,0,ry,8);corner(rx,ry,Math.PI,Math.PI*1.5);
  const path=boundary.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(3)} ${p.y.toFixed(3)}`).join(' ')+' Z';
  const strips=Array.from({length:segmentCount},(_,i)=>{
    const u0=i/segmentCount,u1=(i+1)/segmentCount,u=(u0+u1)/2,w=width/segmentCount;
    const left=project(u0,.5),right=project(u1,.5),top=project(u,0),bottom=project(u,1),center=project(u,.5);
    const a=(right.x-left.x)/w,b=(right.y-left.y)/w,c=(bottom.x-top.x)/height,d=(bottom.y-top.y)/height;
    return {matrix:[a,b,c,d,center.x-a*w/2-c*height/2,center.y-b*w/2-d*height/2],width:w};
  });
  const topBow=project(.5,0).y-(project(0,0).y+project(1,0).y)/2;
  const bottomBow=project(.5,1).y-(project(0,1).y+project(1,1).y)/2;
  return {width,height,path,strips,topBow,bottomBow,project};
}
