// The blue orbital ribbons are an authored navigation effect, not measured star trails.
function cosmosPoint(angle,radius,tilt,roll,globe) {
  const x=Math.cos(angle)*radius,y=Math.sin(angle)*radius*Math.sin(tilt),z=Math.sin(angle)*radius*Math.cos(tilt);
  const c=Math.cos(roll),s=Math.sin(roll),p=12/(12-z),u=globe.planetUnit;
  return {x:globe.centerX+(x*c-y*s)*u*p,y:globe.restCenterY+(x*s+y*c)*u*p,z,depth:z/3.3,perspective:p};
}
class HandheldCosmos {
  constructor(globe){this.globe=globe;this.hand=document.querySelector('#supportingHand');}
  planetPose(index,seconds){
    const g=this.globe,radius=index<7?2.5+(index%4)*.20:2.04+(index-7)*.03,tilt=(index<7?18+index*2:48+(index-7)*21)*Math.PI/180;
    const mean=index*2.39996+seconds*(.10/(radius/2.5)**1.5)*(index===8?-1:1);
    const point=cosmosPoint(mean,radius,tilt,-.18+(index>=7?(index-8)*.50:0),g),physicalRadius=.12+(index%3)*.025;
    const size=physicalRadius*2*g.planetUnit*point.perspective;
    return {...point,scale:1,width:Math.max(30,size),height:Math.max(30,size),turn:0,roll:0,physicalRadius,visibleSize:size};
  }
  decorations(seconds,alpha){
    return Array.from({length:18},(_,i)=>{
      const radius=2.62+(i%5)*.14,p=cosmosPoint(i*2.39996+seconds*.075, radius,.30+(i%3)*.08,-.18,this.globe),physicalRadius=.025+(i%4)*.008;
      return {...p,index:i%10,physicalRadius,visibleSize:physicalRadius*2*this.globe.planetUnit*p.perspective,alpha};
    });
  }
  occluded(p){const g=this.globe,dx=p.x-g.centerX,dy=p.y-g.restCenterY,r=g.baseRadius*g.scale,d=dx*dx+dy*dy;return d<r*r&&p.z*g.planetUnit<Math.sqrt(r*r-d);}
  draw(time,alpha){
    const g=this.globe,seconds=g.reducedMotion?0:time/1000;
    if(this.hand){
      const width=g.baseRadius*3.7;
      this.hand.style.width=`${width}px`;this.hand.style.left=`${g.centerX-width*.43}px`;this.hand.style.top=`${g.restCenterY+g.baseRadius*.73}px`;
      this.hand.style.opacity=String(alpha);this.hand.style.transform=`translateY(${g.reducedMotion?0:Math.sin(seconds*.45)*2}px)`;
    }
    if(alpha<=.001)return;
    const back=g.orbitContext,front=g.effectsContext;
    const line=(points,ctx,near,color,width,blur)=>{
      ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.shadowBlur=blur;ctx.shadowColor='#238eff';ctx.beginPath();let pen=false;
      for(const p of points){if((p.z>0)!==near||near&&this.occluded(p)){pen=false;continue;}if(pen)ctx.lineTo(p.x,p.y);else{ctx.moveTo(p.x,p.y);pen=true;}}
      ctx.stroke();ctx.restore();
    };
    // Continuous ribbons use a single inclined annulus. Small orbital particles are
    // sampled in its own plane; they are not random stars or planet-attached tails.
    for(let band=0;band<22;band++){
      const r=2.40+band*.034,phase=seconds*.035+band*.29;
      const points=Array.from({length:181},(_,j)=>{const a=j*Math.PI*2/180;return cosmosPoint(a,r+.018*Math.sin(a*5+phase),.31+.018*Math.sin(band),-.18,g);});
      const core=band%5===0,color=core?'rgba(75,185,255,.56)':'rgba(40,92,245,.18)';
      for(const [ctx,near] of [[back,false],[front,true]])line(points,ctx,near,color,core?1.7:.7,core?9:3);
    }
    for(let i=0;i<420;i++){
      const a=i*2.399963+seconds*(.035+(i%5)*.004),r=2.38+((i*73)%419)/419*.89;
      const p=cosmosPoint(a,r,.31+(i%11-5)*.002,-.18,g),ctx=p.z>0?front:back;
      if(p.z>0&&this.occluded(p))continue;
      ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=alpha*(.18+(i%7)*.07);ctx.fillStyle=i%11===0?'#e0f8ff':'#4c9dff';
      const size=i%31===0?1.8:.40+(i%4)*.18;ctx.beginPath();ctx.arc(p.x,p.y,size,0,Math.PI*2);ctx.fill();ctx.restore();
    }
    // Two restrained outer guides show that the navigation planets have distinct planes.
    for(const index of [7,9]){
      const points=Array.from({length:181},(_,j)=>cosmosPoint(j*Math.PI*2/180,2.04+(index-7)*.03,(48+(index-7)*21)*Math.PI/180,-.18+(index-8)*.5,g));
      line(points,back,false,'rgba(93,132,198,.16)',.65,0);line(points,front,true,'rgba(109,163,223,.20)',.65,0);
    }
  }
}
