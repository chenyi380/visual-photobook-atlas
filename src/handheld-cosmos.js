// Reference-led four-second opening. All positions derive from one timeline and
// one observer; no endlessly bobbing hand or geometric line-ring substitute.
const cosmicSmooth=(a,b,value)=>{const p=Math.max(0,Math.min(1,(value-a)/(b-a)));return p*p*(3-2*p);};
function cosmicIntroPose(milliseconds,reducedMotion=false){
  const t=reducedMotion?4:Math.max(0,milliseconds/1000);
  const complete=t>=4;
  // The reference's sphere is already the hero above the palm by 1.5s.
  // The remaining two seconds reveal the surrounding bodies, not a new surface.
  const advance=cosmicSmooth(.66,1.92,t);
  return {seconds:Math.min(4,t),active:!complete,
    phase:t<.35?'black':t<.9?'fist':t<1.45?'unfurl':t<2.15?'rise':t<3.05?'satellites':t<4?'closeup':'complete',
    veil:1-cosmicSmooth(.35,.78,t),
    reveal:cosmicSmooth(.62,1.04,t),
    scale:.20+.92*advance,
    center:.54-.11*cosmicSmooth(.8,2.2,t),
    formation:cosmicSmooth(.95,1.85,t),
    fist:cosmicSmooth(.39,.70,t)*(1-cosmicSmooth(.89,1.17,t)),
    unfurl:cosmicSmooth(.84,1.10,t)*(1-cosmicSmooth(1.19,1.46,t)),
    hand:cosmicSmooth(1.14,1.46,t)*(1-cosmicSmooth(3.34,4,t)),
    handEnter:1-cosmicSmooth(.40,.86,t),
    handExit:cosmicSmooth(3.25,4,t),
  };
}

function cosmosPoint(angle,radius,tilt,roll,globe) {
  const x=Math.cos(angle)*radius,y=Math.sin(angle)*radius*Math.sin(tilt),z=Math.sin(angle)*radius*Math.cos(tilt);
  const c=Math.cos(roll),s=Math.sin(roll),p=12/(12-z),u=globe.planetUnit;
  return {x:globe.centerX+(x*c-y*s)*u*p,y:globe.restCenterY+(x*s+y*c)*u*p,z,depth:z/3.3,perspective:p};
}
function cosmosOrbit(index){
  return {radius:index<7?2.48+(index%4)*.23:2.20+(index-7)*.08,
    tilt:(index<7?16+index*1.4:39+(index-7)*24)*Math.PI/180,
    roll:-.18+(index>=7?(index-8)*.39:0),physicalRadius:.13+(index%3)*.027};
}
// Exact extrema of (A cos(t)+B sin(t))/(1-K sin(t)). Fitting the whole
// perspective orbit once avoids clipping at phases missed by sampled bounds.
function cosmicProjectionBounds(radius,tilt,roll){
  const k=radius*Math.cos(tilt)/12,denominator=1-k*k;
  const extrema=(a,b)=>{const spread=Math.sqrt(b*b+denominator*a*a);return [(b*k-spread)/denominator,(b*k+spread)/denominator];};
  return {x:extrema(radius*Math.cos(roll),-radius*Math.sin(tilt)*Math.sin(roll)),
    y:extrema(radius*Math.sin(roll),radius*Math.sin(tilt)*Math.cos(roll)),maxPerspective:1/(1-Math.abs(k))};
}
function cosmicObserverFit(globe,scale=1.12,center=.43){
  const unit=(globe.planetBaseUnit??globe.planetUnit)*scale;
  const margin=Math.min(20,globe.width*.04,globe.height*.03);
  const available=[globe.centerX-margin,globe.width-globe.centerX-margin,globe.height*center-margin,globe.height*(1-center)-margin];
  let fit=1;
  for(let index=0;index<10;index++){
    const orbit=cosmosOrbit(index),bounds=cosmicProjectionBounds(orbit.radius,orbit.tilt,orbit.roll);
    const extent=[-bounds.x[0],bounds.x[1],-bounds.y[0],bounds.y[1]],body=orbit.physicalRadius*bounds.maxPerspective;
    for(let side=0;side<4;side++){
      // Both the physical sphere and the accessible minimum 30px target fit.
      fit=Math.min(fit,(available[side]-15)/(unit*extent[side]),available[side]/(unit*(extent[side]+body)));
    }
  }
  return Math.max(.25,Math.min(1,fit));
}
class HandheldCosmos {
  constructor(globe){
    this.globe=globe;this.hand=document.querySelector('#supportingHand');this.fist=document.querySelector('#cosmicFist');this.unfurl=document.querySelector('#cosmicUnfurl');this.veil=document.querySelector('#cosmicIntroVeil');
    this.startTime=null;this.elapsed=globe.reducedMotion?4000:0;this.pose=cosmicIntroPose(this.elapsed,globe.reducedMotion);
    const canvas=document.querySelector('#nebulaCanvas');
    try{this.nebula=canvas&&typeof NebulaRingRenderer!=='undefined'?new NebulaRingRenderer(canvas):null;}
    catch(error){this.nebula=null;if(canvas)canvas.dataset.renderer='unavailable';console.info('Nebula renderer unavailable',error.message);}
  }
  get active(){return this.pose.active;}
  replay(){
    this.startTime=null;this.elapsed=this.globe.reducedMotion?4000:0;this.skipped=false;
    if(this.globe.sceneController){this.globe.sceneController.target=0;this.globe.sceneController.progress=0;}
  }
  skip(){this.skipped=true;this.elapsed=4000;this.pose=cosmicIntroPose(4000);this.applyPresentation();}
  update(time){
    const g=this.globe;
    if(this.startTime===null&&(g.ready||g.meshRenderer?.ready||g.reducedMotion))this.startTime=time+100;
    this.elapsed=g.reducedMotion||this.skipped?4000:this.startTime===null?0:Math.max(0,time-this.startTime);
    this.pose=cosmicIntroPose(this.elapsed,g.reducedMotion);
    this.observerFit=cosmicObserverFit(g,this.pose.scale,this.pose.center);
    g.cosmicIntroActive=this.pose.active;g.cosmicIntroCenter=this.pose.center;g.cosmicIntroScale=this.pose.scale*this.observerFit;
    g.cosmicReveal=this.pose.reveal;
    this.applyPresentation();
  }
  applyPresentation(){
    const p=this.pose,g=this.globe;
    if(this.veil)this.veil.style.opacity=String(p.veil);
    document.body.classList.toggle('cosmic-intro-active',p.active);
    document.body.dataset.cosmicIntroPhase=p.phase;
    document.body.dataset.cosmicIntroProgress=(p.seconds/4).toFixed(4);
    const width=Math.min(g.width*.77,g.height*1.16),radius=g.planetRadius*(g.cosmicIntroScale??p.scale);
    const cy=g.height*p.center,exit=p.handExit*g.height*.29;
    for(const [node,opacity,size] of [[this.fist,p.fist,.66],[this.unfurl,p.unfurl,.86],[this.hand,p.hand,1]]){
      if(!node)continue;
      const w=width*size;
      node.style.width=`${w.toFixed(2)}px`;node.style.left=`${(g.centerX-w*.49+p.handEnter*g.width*.34).toFixed(2)}px`;
      node.style.top=`${(cy+radius*.60+exit).toFixed(2)}px`;node.style.opacity=String(opacity*(1-(g.libraryBlend??0)));
      node.style.transform=`rotate(${p.handEnter*11-p.handExit*4}deg)`;
    }
  }
  planetPose(index,seconds){
    const g=this.globe,{radius,tilt,roll,physicalRadius}=cosmosOrbit(index);
    const mean=index*2.39996+seconds*(.10/(radius/2.5)**1.5)*(index===8?-1:1);
    const point=cosmosPoint(mean,radius,tilt,roll,g);
    const size=physicalRadius*2*g.planetUnit*point.perspective;
    const starts=index<5?2.10+index*.065:2.55+(index-5)*.13;
    const planetAlpha=g.reducedMotion?1:cosmicSmooth(starts,starts+.18,this.pose.seconds);
    return {...point,scale:1,width:Math.max(30,size),height:Math.max(30,size),turn:0,roll:0,physicalRadius,visibleSize:size,planetAlpha};
  }
  decorations(seconds,alpha){
    const birth=cosmicSmooth(2.8,3.4,this.pose.seconds);
    return Array.from({length:4},(_,i)=>{
      const radius=2.72+i*.13,p=cosmosPoint(i*2.39996+seconds*.075,radius,.30+(i%3)*.06,-.18,this.globe),physicalRadius=.022+(i%3)*.007;
      return {...p,index:i+4,physicalRadius,visibleSize:physicalRadius*2*this.globe.planetUnit*p.perspective,alpha:alpha*birth};
    });
  }
  occluded(p){const g=this.globe,dx=p.x-g.centerX,dy=p.y-g.restCenterY,r=g.baseRadius*g.scale,d=dx*dx+dy*dy;return d<r*r&&p.z*g.planetUnit<Math.sqrt(r*r-d);}
  draw(time,alpha){
    const g=this.globe,seconds=g.reducedMotion?0:time/1000;
    this.nebula?.draw(g,seconds,alpha*this.pose.reveal,this.pose.formation);
  }
}
