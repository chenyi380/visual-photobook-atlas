function journeyPhase(elapsed,reduced=false) {
  if(reduced)return {phase:elapsed<220?'opening':'complete',progress:clamp(elapsed/220,0,1)};
  if(elapsed<1050)return {phase:'flight',progress:clamp(elapsed/1050,0,1)};
  if(elapsed<2450)return {phase:'tunnel',progress:(elapsed-1050)/1400};
  if(elapsed<2800)return {phase:'opening',progress:(elapsed-2450)/350};
  return {phase:'complete',progress:1};
}
function journeyCurve(start,end,t,height) {
  const control={x:start.x+(end.x-start.x)*.45,y:Math.min(start.y,end.y)-height*.17},v=1-t;
  return {x:v*v*start.x+2*v*t*control.x+t*t*end.x,y:v*v*start.y+2*v*t*control.y+t*t*end.y};
}
class BookJourneyController {
  constructor(canvas,globe,library,projection,onComplete,onCancel) {
    Object.assign(this,{canvas,globe,library,projection,onComplete,onCancel,active:null});
    this.context=canvas.getContext('2d');this.resize();
    addEventListener('resize',()=>this.resize());
  }
  resize(){this.ratio=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.round(innerWidth*this.ratio);this.canvas.height=Math.round(innerHeight*this.ratio);this.context.setTransform(this.ratio,0,0,this.ratio,0,0);}
  start(book,button,locationBook) {
    if(this.active)return false;
    const r=button.getBoundingClientRect();
    this.active={book,locationBook,start:performance.now(),origin:{x:r.x+r.width/2,y:r.y+r.height/2},button};
    this.library.busy=this.library.previewHeld=true;clearTimeout(this.library.releaseTimer);
    document.body.classList.add('journey-active');document.body.dataset.journey='flight';
    this.canvas.dataset.progress='0';
    document.querySelector('#journeyStatus').textContent=`正在穿越至${book.title}，按 Esc 可返回`;
    document.querySelector('#libraryView').setAttribute('aria-busy','true');
    this.card=document.createElement('div');this.card.className='journey-card';this.card.setAttribute('aria-hidden','true');
    this.card.innerHTML=`<img src="${ATLAS_BOOK_IMAGES[book.id]}" alt=""><span>${book.title}</span>`;document.body.append(this.card);
    this.card.style.width=`${r.width}px`;this.card.style.height=`${r.height}px`;
    this.canvas.classList.add('visible');
    requestAnimationFrame(time=>this.frame(time));return true;
  }
  clear(){
    this.active=null;this.library.busy=this.library.previewHeld=false;this.card?.remove();this.card=null;
    this.canvas.classList.remove('visible');this.context.clearRect(0,0,innerWidth,innerHeight);
    document.body.classList.remove('journey-active');document.body.dataset.journey='idle';
    document.querySelector('#libraryView').setAttribute('aria-busy','false');
    document.querySelector('#journeyStatus').textContent='';
  }
  cancel(){if(!this.active)return false;const book=this.active.book;this.clear();this.onCancel?.(book);return true;}
  frame(time){
    if(!this.active)return;
    const a=this.active,state=journeyPhase(time-a.start,this.globe.reducedMotion),ctx=this.context,w=innerWidth,h=innerHeight;
    document.body.dataset.journey=state.phase;this.canvas.dataset.progress=state.progress.toFixed(4);
    if(state.phase==='complete'){const book=a.book;this.clear();this.onComplete(book);return;}
    ctx.clearRect(0,0,w,h);
    // Travel follows the red geographic marker inside the independent map layer.
    const rect=this.projection.getBoundingClientRect(),meta=ATLAS_TRAVEL_PHOTOS[a.book.id];
    const end={x:rect.x+rect.width*meta.marker[0],y:rect.y+rect.height*meta.marker[1]};
    if(state.phase==='flight'){
      const t=state.progress,eased=t*t*(3-2*t),head=journeyCurve(a.origin,end,eased,h);
      const collapse=1-Math.pow(t,1.5)*.985;
      this.card.style.transform=`translate(${head.x}px,${head.y}px) translate(-50%,-50%) rotate(${t*-18}deg) scale(${collapse},${collapse*(1-t*.75)})`;
      this.card.style.opacity=String(1-clamp((t-.6)/.4,0,1));
      ctx.save();ctx.globalCompositeOperation='screen';ctx.shadowColor='#75ccff';ctx.shadowBlur=18;
      const tail=journeyCurve(a.origin,end,Math.max(0,eased-.17),h),gradient=ctx.createLinearGradient(tail.x,tail.y,head.x,head.y);
      gradient.addColorStop(0,'#87cfff00');gradient.addColorStop(.65,'#7cd7ffa0');gradient.addColorStop(1,'#f4fbff');
      ctx.strokeStyle=gradient;ctx.lineWidth=2+6*t;ctx.beginPath();
      for(let i=0;i<=30;i++){const p=journeyCurve(a.origin,end,Math.max(0,eased-.17)+Math.min(eased,.17)*i/30,h);if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);}ctx.stroke();
      ctx.fillStyle='#f4fcff';ctx.beginPath();ctx.arc(head.x,head.y,2+t*3,0,Math.PI*2);ctx.fill();ctx.restore();
    }else{
      this.card.style.opacity='0';
      const t=state.phase==='opening'?1:state.progress,ease=t*t*(3-2*t);
      const cx=end.x+(w/2-end.x)*ease,cy=end.y+(h/2-end.y)*ease,max=Math.hypot(w,h);
      ctx.fillStyle=`rgba(1,7,18,${Math.min(1,t*2)})`;ctx.fillRect(0,0,w,h);
      const halo=ctx.createRadialGradient(cx,cy,0,cx,cy,max*.6);halo.addColorStop(0,'#88d5ff35');halo.addColorStop(.25,'#24497838');halo.addColorStop(1,'#02060d00');ctx.fillStyle=halo;ctx.fillRect(0,0,w,h);
      // Temporary cinematic tunnel, separate from the astronomically fixed star sphere.
      ctx.save();ctx.globalCompositeOperation='screen';
      for(let i=0;i<160;i++){
        const angle=i*2.399963,seed=((i*73)%157)/157;
        const distance=(.018+((seed+t*1.45)%1)**3)*max*.8;
        const length=(8+t*110)*(distance/max),x=cx+Math.cos(angle)*distance,y=cy+Math.sin(angle)*distance;
        ctx.strokeStyle=`rgba(${185+i%3*25},${215+i%3*12},255,${.12+t*.42})`;ctx.lineWidth=.5+seed;
        ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(angle)*length,y+Math.sin(angle)*length);ctx.stroke();
      }
      for(let i=0;i<7;i++){const r=(.015+((i/7+t*.7)%1)**2)*max*.55;ctx.strokeStyle=`rgba(106,185,235,${.15*(1-r/max)})`;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(cx,cy,r,r*.60,.15,0,Math.PI*2);ctx.stroke();}
      ctx.restore();
      if(state.phase==='opening'){ctx.fillStyle=`rgba(241,235,220,${state.progress})`;ctx.fillRect(0,0,w,h);}
    }
    requestAnimationFrame(next=>this.frame(next));
  }
}
