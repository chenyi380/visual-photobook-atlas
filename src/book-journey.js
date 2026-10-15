// A single authored timeline connects the scene to its original reader.
const BOOK_JOURNEY_DURATION=9600;
function journeyPhase(elapsed,reduced=false) {
  const time=Math.max(0,elapsed);
  if(reduced)return {phase:time<220?'opening':'complete',progress:clamp(time/220,0,1),totalProgress:clamp(time/220,0,1)};
  const phases=[['departure',0,700],['space',700,2050],['atmosphere',2050,3350],['clouds',3350,4800],['destination',4800,6000],['materialize',6000,7250],['opening',7250,BOOK_JOURNEY_DURATION]];
  for(const [phase,start,end] of phases)if(time<end)return {phase,progress:clamp((time-start)/(end-start),0,1),totalProgress:clamp(time/BOOK_JOURNEY_DURATION,0,1)};
  return {phase:'complete',progress:1,totalProgress:1};
}
function journeyCurve(start,end,t,height) {
  const control={x:start.x+(end.x-start.x)*.45,y:Math.min(start.y,end.y)-height*.17},v=1-t;
  return {x:v*v*start.x+2*v*t*control.x+t*t*end.x,y:v*v*start.y+2*v*t*control.y+t*t*end.y};
}
function journeySmooth(t){const v=clamp(t,0,1);return v*v*(3-2*v);}
function journeyRange(time,start,end){return journeySmooth((time-start)/(end-start));}
function journeySeed(index){const n=Math.sin(index*127.1+311.7)*43758.5453123;return n-Math.floor(n);}
class BookJourneyController {
  constructor(canvas,globe,library,projection,onComplete,onCancel) {
    Object.assign(this,{canvas,globe,library,projection,onComplete,onCancel,active:null,imageCache:new Map(),generation:0});
    this.context=canvas.getContext('2d');this.cloudSea=this.loadImage('assets/cosmos-v3/cloud-sea.png');this.resize();addEventListener('resize',()=>this.resize());
  }
  resize(){
    this.ratio=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.round(innerWidth*this.ratio);this.canvas.height=Math.round(innerHeight*this.ratio);
    this.context.setTransform(this.ratio,0,0,this.ratio,0,0);if(this.card)this.sizeBook();
  }
  sizeBook(){
    this.bookWidth=Math.max(112,Math.min(286,innerWidth*.24,innerHeight*.32));
    this.card.style.width=`${this.bookWidth}px`;this.card.style.height=`${this.bookWidth*1.42}px`;
    this.card.style.setProperty('--book-thickness',`${Math.max(10,this.bookWidth*.070)}px`);
  }
  loadImage(source){
    if(this.imageCache.has(source))return this.imageCache.get(source);
    const photo=new Image();photo.decoding='async';photo.src=source;this.imageCache.set(source,photo);return photo;
  }
  loadPhoto(book){return this.loadImage(ATLAS_PROJECTION_IMAGES[book.id]||ATLAS_BOOK_IMAGES[book.id]);}
  makeBook(book){
    const card=document.createElement('div');card.className='journey-card journey-book';card.setAttribute('aria-hidden','true');
    card.innerHTML=`<div class="j-book-volume"><div class="j-book-back"></div><div class="j-book-paper"></div><div class="j-book-spine"></div><div class="j-book-leaf j-book-title-page"><span class="j-book-leaf-inner"><span class="j-book-place"></span><span class="j-book-english"></span></span></div>${Array.from({length:5},(_,i)=>`<div class="j-book-leaf j-book-turning" style="--leaf:${i}"><span class="j-book-leaf-inner">${i===0?'<span class="j-book-leaf-photo"></span><span class="j-book-place"></span>':''}</span></div>`).join('')}<div class="j-book-cover"><div class="j-book-cover-outside"><div class="j-book-cover-frame"><span class="j-book-photo"></span><span class="j-book-cover-title"></span><span class="j-book-cover-english"></span></div></div><div class="j-book-cover-inside"></div></div></div>`;
    card.querySelectorAll('.j-book-place,.j-book-cover-title').forEach(el=>{el.textContent=book.title;});
    card.querySelectorAll('.j-book-english,.j-book-cover-english').forEach(el=>{el.textContent=book.english.split(' / ')[0];});
    card.querySelectorAll('.j-book-photo,.j-book-leaf-photo').forEach(el=>{el.style.backgroundImage=`url("${ATLAS_BOOK_IMAGES[book.id]}")`;});
    document.body.append(card);this.card=card;this.sizeBook();
  }
  start(book,button,locationBook) {
    if(this.active)return false;
    const r=button.getBoundingClientRect(),rect=this.projection.getBoundingClientRect(),meta=ATLAS_TRAVEL_PHOTOS[book.id];
    const projected=locationBook&&this.globe.project?this.globe.project(locationBook.lat,locationBook.lon):null,marker=meta?.marker||[.5,.38];
    // Snapshot the selected map marker; a rotating scene must not wobble the flight path.
    const target=rect.width>1&&rect.height>1?{x:rect.x+rect.width*marker[0],y:rect.y+rect.height*marker[1]}:projected||{x:innerWidth*.5,y:innerHeight*.36};
    this.active={book,locationBook,start:performance.now(),origin:{x:(r.x+r.width/2)/innerWidth,y:(r.y+r.height/2)/innerHeight},target:{x:target.x/innerWidth,y:target.y/innerHeight},sourceWidth:r.width,button,photo:this.loadPhoto(book),generation:++this.generation};
    this.library.busy=this.library.previewHeld=true;clearTimeout(this.library.releaseTimer);
    this.canvas.dataset.book=book.id;this.canvas.dataset.progress='0';this.canvas.dataset.totalProgress='0';
    document.body.classList.add('journey-active');document.body.dataset.journey=this.globe.reducedMotion?'opening':'departure';
    document.querySelector('#journeyStatus').textContent=`正在穿越至${book.title}，按 Esc 可返回`;
    document.querySelector('#libraryView').setAttribute('aria-busy','true');this.makeBook(book);this.canvas.classList.add('visible');
    if(!this.globe.reducedMotion&&!this.cloudSprites)this.cloudSprites=this.createCloudSprites();
    this.requestFrame();return true;
  }
  requestFrame(){const generation=this.generation;this.raf=requestAnimationFrame(time=>{if(generation===this.generation)this.frame(time);});}
  clear(){
    ++this.generation;if(this.raf!=null)cancelAnimationFrame(this.raf);this.raf=null;this.active=null;this.library.busy=this.library.previewHeld=false;
    this.card?.remove();this.card=null;this.canvas.classList.remove('visible');this.context.clearRect(0,0,innerWidth,innerHeight);
    document.body.classList.remove('journey-active');document.body.dataset.journey='idle';
    document.querySelector('#libraryView').setAttribute('aria-busy','false');document.querySelector('#journeyStatus').textContent='';
  }
  cancel(){if(!this.active)return false;const book=this.active.book;this.clear();this.onCancel?.(book);return true;}
  createCloudSprites(){
    // Cached shaded density billboards: no per-frame noise textures or readbacks.
    return Array.from({length:5},(_,variant)=>{
      const canvas=document.createElement('canvas');canvas.width=640;canvas.height=320;const ctx=canvas.getContext('2d');
      for(let pass=0;pass<3;pass++)for(let i=0;i<54;i++){
        const seed=i+variant*67,x=65+journeySeed(seed)*510,y=145+Math.sin(x/95+variant)*30+journeySeed(seed+15)*56-pass*21;
        const radius=29+journeySeed(seed+7)*76,cold=pass===0,g=ctx.createRadialGradient(x-radius*.18,y-radius*.33,0,x,y,radius);
        g.addColorStop(0,cold?'rgba(81,115,144,.30)':'rgba(247,249,246,.43)');g.addColorStop(.46,cold?'rgba(114,141,162,.22)':'rgba(217,232,238,.31)');g.addColorStop(1,'rgba(212,231,241,0)');
        ctx.fillStyle=g;ctx.fillRect(x-radius,y-radius,radius*2,radius*2);
      }return canvas;
    });
  }
  glow(x,y,radius,strength=1,color='gold'){
    const ctx=this.context;if(radius<=0||strength<=0)return;
    const g=ctx.createRadialGradient(x,y,0,x,y,radius);g.addColorStop(0,`rgba(255,252,229,${Math.min(1,strength)})`);g.addColorStop(.06,`rgba(255,228,166,${strength*.8})`);
    g.addColorStop(.24,color==='blue'?`rgba(121,203,255,${strength*.3})`:`rgba(255,185,81,${strength*.29})`);g.addColorStop(1,'rgba(255,194,107,0)');ctx.fillStyle=g;ctx.fillRect(x-radius,y-radius,radius*2,radius*2);
  }
  drawStream(start,end,progress,opacity=1){
    const ctx=this.context,h=innerHeight,eased=journeySmooth(progress),head=journeyCurve(start,end,eased,h);ctx.save();ctx.globalCompositeOperation='screen';
    for(let strand=0;strand<7;strand++){
      const duration=.20+strand*.015,begin=Math.max(0,eased-duration),tail=journeyCurve(start,end,begin,h),gradient=ctx.createLinearGradient(tail.x,tail.y,head.x+.01,head.y+.01);
      const colors=['255,191,78','255,225,152','255,246,221','173,170,255','128,221,248','239,180,226','255,209,130'];
      gradient.addColorStop(0,`rgba(${colors[strand]},0)`);gradient.addColorStop(.73,`rgba(${colors[strand]},${opacity*(strand<3?.52:.20)})`);gradient.addColorStop(1,`rgba(255,252,233,${opacity*.95})`);
      ctx.strokeStyle=gradient;ctx.lineWidth=strand<3?1.5+(2-strand)*1.7:.8;ctx.shadowColor='#ffc679';ctx.shadowBlur=strand<3?14:5;ctx.beginPath();
      for(let i=0;i<=40;i++){const t=begin+(eased-begin)*i/40,p=journeyCurve(start,end,t,h),separation=Math.sin(i/40*Math.PI)*(strand-3)*2.5,x=p.x+Math.sin(t*14+strand)*separation,y=p.y+Math.cos(t*10+strand)*separation;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.stroke();
    }
    this.glow(head.x,head.y,Math.min(innerWidth,h)*.12,opacity);ctx.restore();return head;
  }
  drawSpace(elapsed,opacity){
    const ctx=this.context,w=innerWidth,h=innerHeight,a=this.active,settle=journeyRange(elapsed,700,1850),cx=(a.target.x+(.57-a.target.x)*settle)*w,cy=(a.target.y+(.43-a.target.y)*settle)*h;
    ctx.save();ctx.globalAlpha=opacity;const base=ctx.createLinearGradient(0,0,w,h);base.addColorStop(0,'#02040b');base.addColorStop(.55,'#07101c');base.addColorStop(1,'#152032');ctx.fillStyle=base;ctx.fillRect(0,0,w,h);
    const speed=journeyRange(elapsed,700,1750)*(1-journeyRange(elapsed,2350,3400)),distance=Math.hypot(w,h);ctx.globalCompositeOperation='screen';
    for(let i=0;i<115;i++){
      const angle=journeySeed(i+89)*Math.PI*2,seed=journeySeed(i+247),cycle=(seed+Math.max(0,elapsed-700)*.00014)%1,r=(.03+cycle*cycle)*distance*.84,x=cx+Math.cos(angle)*r,y=cy+Math.sin(angle)*r,len=(1+speed*92)*cycle;
      ctx.strokeStyle=`rgba(${i%5===0?'249,201,146':'192,215,237'},${(.18+seed*.6)*(1-speed*.32)})`;ctx.lineWidth=.5+seed*.9;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(angle)*len,y+Math.sin(angle)*len);ctx.stroke();
    }
    this.glow(cx,cy,Math.min(w,h)*(.08+speed*.12),.35+speed*.2);
    for(let i=0;i<6;i++){ctx.strokeStyle=`rgba(${i<3?'255,209,135':'172,199,255'},${.05+(1-i/6)*speed*.16})`;ctx.lineWidth=(6-i)*.65;ctx.beginPath();ctx.moveTo(-w*.08,h*(.83+i*.035));ctx.bezierCurveTo(w*.22,h*.8,w*.31,h*.42,cx,cy);ctx.stroke();}
    ctx.restore();
  }
  drawAtmosphere(elapsed){
    const ctx=this.context,w=innerWidth,h=innerHeight,entry=journeyRange(elapsed,1850,4000),exit=1-journeyRange(elapsed,4100,5100);if(entry<=0||exit<=0)return;
    const radius=w*(1.17+entry*.8),cx=w*.44,cy=h*.54+radius+entry*h*.10;ctx.save();ctx.globalAlpha=entry*exit;
    const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#0b1632');sky.addColorStop(.5,'#365777');sky.addColorStop(.8,'#7c9eae');sky.addColorStop(1,'#b8cbd1');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
    for(let i=5;i>=0;i--){ctx.strokeStyle=`rgba(${i<2?'209,243,255':'90,164,241'},${i<2?.7:.08})`;ctx.lineWidth=2+i*8;ctx.beginPath();ctx.arc(cx,cy,radius-i*3,Math.PI,Math.PI*2);ctx.stroke();}
    ctx.save();ctx.beginPath();ctx.arc(cx,cy,radius,Math.PI,Math.PI*2);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.closePath();ctx.clip();
    const earth=ctx.createLinearGradient(0,h*.4,0,h);earth.addColorStop(0,'#658b9a');earth.addColorStop(.4,'#274558');earth.addColorStop(1,'#101f30');ctx.fillStyle=earth;ctx.fillRect(0,0,w,h);
    this.drawCloudPlate(elapsed,journeyRange(elapsed,2350,3350)*.9);this.drawCloudLayers(elapsed,.15,true);ctx.restore();
    ctx.globalCompositeOperation='screen';this.glow(w*.81,h*.39,Math.min(w,h)*.31,.56);this.drawStream({x:-w*.15,y:h*.87},{x:w*(.54+.19*entry),y:h*(.49+.12*entry)},.90,.65);ctx.restore();
  }
  drawCloudLayers(elapsed,opacity=1,distant=false){
    if(!this.cloudSprites)return;const ctx=this.context,w=innerWidth,h=innerHeight,travel=clamp((elapsed-3000)/1900,0,1),inheritedAlpha=ctx.globalAlpha;ctx.save();const count=distant?12:26;
    for(let i=0;i<count;i++){
      const seed=journeySeed(i+517),depth=(i%5)/4,size=w*(.25+depth*.60),drift=elapsed/1000*(11+depth*29),x=((journeySeed(i+42)*w*1.5+drift)%(w*1.7))-w*.36,y=h*(distant?.58:.29)+seed*h*.56+(distant?0:(depth-.4)*travel*h*.30);
      ctx.globalAlpha=inheritedAlpha*opacity*(.33+depth*.54);ctx.drawImage(this.cloudSprites[i%5],x-size*.5,y-size*.25,size,size*.5);
    }ctx.restore();
  }
  drawCloudPlate(elapsed,opacity=1){
    const image=this.cloudSea;if(!image||!image.complete||image.naturalWidth<=0){this.canvas.dataset.cloudImage='loading';return false;}
    const ctx=this.context,w=innerWidth,h=innerHeight,travel=journeyRange(elapsed,2050,5200),zoom=1.06+travel*.14;
    const scale=Math.max(w/image.naturalWidth,h/image.naturalHeight)*zoom,width=image.naturalWidth*scale,height=image.naturalHeight*scale;
    ctx.save();ctx.globalAlpha*=opacity;
    // Generated cinematic cloud plate only; never represented as a destination photograph.
    ctx.drawImage(image,(w-width)/2,(h-height)/2+h*(.035-travel*.065),width,height);ctx.restore();
    this.canvas.dataset.cloudImage='ready';return true;
  }
  drawCloudSea(elapsed){
    const ctx=this.context,w=innerWidth,h=innerHeight,enter=journeyRange(elapsed,3100,3650),leave=1-journeyRange(elapsed,4750,5550);if(enter*leave<=0)return;ctx.save();ctx.globalAlpha=enter*leave;
    const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#1b3554');sky.addColorStop(.35,'#7b9caf');sky.addColorStop(.69,'#c0d3d7');sky.addColorStop(1,'#dce4e0');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
    const plateReady=this.drawCloudPlate(elapsed,.98);this.glow(w*.78,h*.21,h*.34,.22);this.drawCloudLayers(elapsed,plateReady?.19:.96);
    const penetration=journeyRange(elapsed,3800,4600),haze=.025+Math.sin(penetration*Math.PI)*.09;ctx.fillStyle=`rgba(234,242,240,${haze})`;ctx.fillRect(0,0,w,h);
    ctx.globalCompositeOperation='screen';this.drawStream({x:-w*.13,y:h*.74},{x:w*.65,y:h*.40},.94,.70);ctx.restore();
  }
  drawDestination(elapsed){
    const ctx=this.context,w=innerWidth,h=innerHeight,arrival=journeyRange(elapsed,4450,5750);if(!arrival)return;ctx.save();ctx.globalAlpha=arrival;
    const backdrop=ctx.createLinearGradient(0,0,0,h);backdrop.addColorStop(0,'#15283b');backdrop.addColorStop(1,'#10151e');ctx.fillStyle=backdrop;ctx.fillRect(0,0,w,h);const photo=this.active.photo;
    if(photo.complete&&photo.naturalWidth>0){
      // Same licensed destination photograph, not invented aerial geography; preserve its ratio.
      const scale=Math.min(w/photo.naturalWidth,h/photo.naturalHeight),width=photo.naturalWidth*scale,height=photo.naturalHeight*scale,zoom=1.05-arrival*.05;
      ctx.translate(w/2,h/2);ctx.scale(zoom,zoom);ctx.drawImage(photo,-width/2,-height/2,width,height);ctx.setTransform(this.ratio,0,0,this.ratio,0,0);this.canvas.dataset.destinationImage='ready';
    }else{this.drawCloudLayers(elapsed,.4);this.canvas.dataset.destinationImage=photo.complete?'unavailable':'loading';}
    const shade=ctx.createLinearGradient(0,0,0,h);shade.addColorStop(0,'rgba(3,10,20,.07)');shade.addColorStop(.43,'rgba(3,10,20,0)');shade.addColorStop(1,'rgba(3,10,20,.42)');ctx.fillStyle=shade;ctx.fillRect(0,0,w,h);ctx.restore();
  }
  drawBookAura(elapsed,amount){
    if(amount<=0)return;const ctx=this.context,w=innerWidth,h=innerHeight,cx=w*.54,cy=h*.54,t=(elapsed-6000)/1000;ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=amount;this.glow(cx,cy,Math.min(w,h)*.31,.22);
    const colors=['113,221,255','173,152,255','244,164,222','255,221,154'];
    for(let line=0;line<4;line++){
      ctx.lineWidth=.8;ctx.strokeStyle=`rgba(${colors[line]},.39)`;ctx.shadowColor=`rgb(${colors[line]})`;ctx.shadowBlur=10;ctx.beginPath();
      for(let j=0;j<100;j++){const a=j/99*Math.PI*2+t*.23+line*.8,r=this.bookWidth*(.64+.14*Math.sin(a*2+t)),x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r*.6+Math.sin(a*2+t)*this.bookWidth*.19;if(j)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.stroke();
    }
    ctx.shadowBlur=7;for(let i=0;i<45;i++){const a=journeySeed(i+67)*Math.PI*2+t*(.1+journeySeed(i)*.3),r=this.bookWidth*(.61+journeySeed(i+81)*.6),x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r*.80;ctx.fillStyle=`rgba(${colors[i%4]},${.25+journeySeed(i+2)*.57})`;ctx.beginPath();ctx.arc(x,y,.65+journeySeed(i+4)*1.2,0,Math.PI*2);ctx.fill();}ctx.restore();
  }
  positionBook(elapsed,state){
    const w=innerWidth,h=innerHeight,a=this.active;if(this.globe.reducedMotion){this.card.style.opacity='0';return;}
    if(state.phase==='departure'){
      const t=journeySmooth(state.progress),p=journeyCurve({x:a.origin.x*w,y:a.origin.y*h},{x:a.target.x*w,y:a.target.y*h},t,h),size=Math.max(.008,(a.sourceWidth/this.bookWidth)*(1-Math.pow(t,.85)));
      this.card.style.opacity=String(1-journeyRange(state.progress,.48,.96));this.card.style.transform=`translate3d(${p.x}px,${p.y}px,0) translate(-50%,-50%) perspective(1300px) rotateY(${-20-t*55}deg) rotateZ(${-8-t*23}deg) scale(${size})`;return;
    }
    const appear=journeyRange(elapsed,5960,7120),open=journeyRange(elapsed,7440,9360),float=Math.sin((elapsed-6000)*.0015)*5;
    this.card.style.opacity=String(appear*(1-journeyRange(elapsed,9430,9600)));this.card.style.transform=`translate3d(${w*(.54+open*.045)}px,${h*.53+float}px,0) translate(-50%,-50%) perspective(1400px) rotateX(${10-open*6}deg) rotateY(${-22+open*10}deg) rotateZ(${-6+Math.sin(elapsed*.001)*1.8}deg) scale(${.65+appear*.35})`;
    this.card.style.setProperty('--cover-angle',`${-150*open}deg`);this.card.style.setProperty('--book-light',String(.45+Math.sin(clamp((elapsed-5960)/1160,0,1)*Math.PI)*.55));
    this.card.querySelectorAll('.j-book-turning').forEach((leaf,index)=>{leaf.style.setProperty('--page-angle',`${-(134-index*23)*journeyRange(elapsed,7620+index*100,9150+index*65)}deg`);});
  }
  frame(time){
    if(!this.active)return;const a=this.active,elapsed=time-a.start,state=journeyPhase(elapsed,this.globe.reducedMotion),ctx=this.context,w=innerWidth,h=innerHeight;
    document.body.dataset.journey=state.phase;this.canvas.dataset.progress=state.progress.toFixed(4);this.canvas.dataset.totalProgress=state.totalProgress.toFixed(4);
    if(state.phase==='complete'){const book=a.book;this.clear();this.onComplete(book);return;}
    ctx.clearRect(0,0,w,h);this.positionBook(elapsed,state);
    if(this.globe.reducedMotion){ctx.fillStyle=`rgba(237,231,218,${journeySmooth(state.progress)})`;ctx.fillRect(0,0,w,h);this.requestFrame();return;}
    if(state.phase==='departure')this.drawStream({x:a.origin.x*w,y:a.origin.y*h},{x:a.target.x*w,y:a.target.y*h},state.progress,.84);
    const spaceOpacity=journeyRange(elapsed,650,1220);if(spaceOpacity)this.drawSpace(elapsed,spaceOpacity);
    this.drawAtmosphere(elapsed);this.drawCloudSea(elapsed);this.drawDestination(elapsed);this.drawBookAura(elapsed,journeyRange(elapsed,5850,6750)*(1-journeyRange(elapsed,9350,9600)));
    const veil=journeyRange(elapsed,9350,9600);if(veil){ctx.fillStyle=`rgba(237,231,218,${veil})`;ctx.fillRect(0,0,w,h);}this.requestFrame();
  }
}
