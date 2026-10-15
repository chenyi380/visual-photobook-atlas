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
    g.sceneZoom=pose.zoom;g.libraryBlend=pose.blend;g.baseRadius=pose.radius;g.targetRadius=0;
    g.planetUnit=(g.planetBaseUnit??g.planetUnit)*pose.zoom;
    g.restCenterY=g.height*pose.center;g.centerY=g.restCenterY;
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
