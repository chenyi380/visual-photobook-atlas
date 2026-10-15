// A single authored timeline connects the scene to its original reader.
const BOOK_JOURNEY_DURATION=8000;
function journeyPhase(elapsed,reduced=false) {
  const time=Math.max(0,elapsed);
  if(reduced)return {phase:time<220?'opening':'complete',progress:clamp(time/220,0,1),totalProgress:clamp(time/220,0,1)};
  const phases=[['departure',0,550],['space',550,1600],['atmosphere',1600,2850],['clouds',2850,4050],['destination',4050,4850],['materialize',4850,6100],['opening',6100,BOOK_JOURNEY_DURATION]];
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
    this.bookWidth=Math.max(100,Math.min(250,innerWidth*.17,innerHeight*.245));
    this.card.style.width=`${this.bookWidth}px`;this.card.style.height=`${this.bookWidth*1.30}px`;
    this.card.style.setProperty('--book-thickness',`${Math.max(10,this.bookWidth*.070)}px`);
  }
  loadImage(source){
    if(this.imageCache.has(source))return this.imageCache.get(source);
    const photo=new Image();photo.decoding='async';photo.src=source;this.imageCache.set(source,photo);return photo;
  }
  loadPhoto(book){return this.loadImage(ATLAS_BOOK_IMAGES[book.id]||ATLAS_PROJECTION_IMAGES[book.id]);}
  makeBook(book){
    const card=document.createElement('div');card.className='journey-card journey-book';card.setAttribute('aria-hidden','true');card.textContent=book.title;
    document.body.append(card);this.card=card;this.sizeBook();this.coverTexture=this.createCoverTexture(book);this.innerTexture=null;
    const active=this.active,prepareInner=()=>{if(active===this.active&&active.photo.complete&&active.photo.naturalWidth>0)this.innerTexture=this.createInnerTexture(book,active.photo);};
    prepareInner();active.photo.addEventListener?.('load',prepareInner,{once:true});
  }
  createCoverTexture(book){
    const canvas=document.createElement('canvas');canvas.width=700;canvas.height=910;const c=canvas.getContext('2d');
    const leather=c.createLinearGradient(0,0,700,910);leather.addColorStop(0,'#776043');leather.addColorStop(.4,'#4b3a2d');leather.addColorStop(1,'#33281f');c.fillStyle=leather;c.fillRect(0,0,700,910);
    for(let i=0;i<5000;i++){c.fillStyle=i%2?'#dcc4960b':'#08060312';c.fillRect(journeySeed(i+8)*700,journeySeed(i+91)*910,1+journeySeed(i+7)*2,1);}
    for(const inset of [20,26,45,49,65]){c.strokeStyle=inset===20?'#ffdda0':'#bfa26a';c.lineWidth=inset===20?3:1;c.strokeRect(inset,inset,700-inset*2,910-inset*2);}
    c.strokeStyle='#d7b678';c.lineWidth=2;
    for(const [x,y,dx,dy] of [[67,67,1,1],[633,67,-1,1],[67,843,1,-1],[633,843,-1,-1]]){
      c.save();c.translate(x,y);c.scale(dx,dy);
      for(let i=0;i<3;i++){c.beginPath();c.moveTo(0,16+i*7);c.bezierCurveTo(32,15,14,48,44,48+i*6);c.bezierCurveTo(59,46,49,15,22+i*5,4);c.stroke();}c.restore();
    }
    const title=book.title,characters=Array.from(title);c.textAlign='center';c.textBaseline='middle';c.shadowOffsetY=2;c.shadowBlur=4;c.shadowColor='#170d05';
    const gold=c.createLinearGradient(0,240,0,650);gold.addColorStop(0,'#fff1bb');gold.addColorStop(.45,'#d3ad66');gold.addColorStop(.7,'#ffe0a0');gold.addColorStop(1,'#ae7b35');c.fillStyle=gold;
    if(characters.length<=4){const size=characters.length===4?91:118;c.font=`400 ${size}px KaiTi,STKaiti,SimSun,serif`;characters.forEach((char,i)=>c.fillText(char,350,455+(i-(characters.length-1)/2)*(size+25)));}
    else{c.font='400 88px Georgia,serif';c.fillText(title,350,450,490);}
    c.shadowBlur=0;c.shadowOffsetY=0;c.font='400 19px Georgia,serif';c.fillStyle='#d4be90';c.fillText(book.english.split(' / ')[0],350,760,470);
    c.strokeStyle='#baa071';c.beginPath();c.moveTo(284,703);c.lineTo(416,703);c.stroke();return canvas;
  }
  createInnerTexture(book,photo){
    const canvas=document.createElement('canvas');canvas.width=700;canvas.height=910;const c=canvas.getContext('2d');
    const paper=c.createLinearGradient(0,0,700,0);paper.addColorStop(0,'#bdae8e');paper.addColorStop(.09,'#e7d6ad');paper.addColorStop(.45,'#efe1c1');paper.addColorStop(1,'#d6c39a');c.fillStyle=paper;c.fillRect(0,0,700,910);
    c.fillStyle='#5c4c32';c.textAlign='center';c.font='400 46px KaiTi,STKaiti,SimSun,serif';c.fillText(book.title,350,151,525);
    const scale=Math.min(540/photo.naturalWidth,435/photo.naturalHeight),width=photo.naturalWidth*scale,height=photo.naturalHeight*scale;
    c.drawImage(photo,(700-width)/2,240+(435-height)/2,width,height);
    c.strokeStyle='#98815c';c.lineWidth=1;c.strokeRect((700-width)/2-8,240+(435-height)/2-8,width+16,height+16);
    c.fillStyle='#776449';c.font='400 18px Georgia,serif';c.fillText(book.english.split(' / ')[0],350,750,520);
    c.strokeStyle='#bba57d';c.beginPath();c.moveTo(270,792);c.lineTo(430,792);c.stroke();return canvas;
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
    this.card?.remove();this.card=null;this.bookPose=null;this.coverTexture=null;this.innerTexture=null;this.canvas.classList.remove('visible');this.context.clearRect(0,0,innerWidth,innerHeight);
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
    const ctx=this.context,w=innerWidth,h=innerHeight,head=journeyCurve(start,end,journeySmooth(progress),h),time=(this.frameElapsed||0)/1000;
    const tail={x:start.x,y:start.y},dx=head.x-tail.x,dy=head.y-tail.y,length=Math.max(1,Math.hypot(dx,dy)),nx=-dy/length,ny=dx/length;
    const curve=offset=>{ctx.beginPath();ctx.moveTo(tail.x+nx*offset,tail.y+ny*offset);ctx.bezierCurveTo(tail.x+dx*.35+nx*(offset*.55-15),tail.y+dy*.35+ny*(offset*.55-15),head.x-dx*.16+nx*offset*.06,head.y-dy*.16+ny*offset*.06,head.x,head.y);};
    ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha*=opacity;ctx.lineCap='round';
    // A broad amber plume and white-hot core, not a thin decorative line.
    for(const [width,alpha,blur] of [[h*.115,.16,35],[h*.052,.35,18],[h*.020,.75,8],[Math.max(3,h*.005),1,2]]){
      const g=ctx.createLinearGradient(tail.x,tail.y,head.x,head.y);g.addColorStop(0,`rgba(251,171,63,${alpha*.02})`);g.addColorStop(.44,`rgba(255,191,82,${alpha*.72})`);g.addColorStop(.88,`rgba(255,224,157,${alpha})`);g.addColorStop(1,`rgba(255,251,223,${alpha})`);
      ctx.strokeStyle=g;ctx.lineWidth=width;ctx.shadowColor='#ffbf58';ctx.shadowBlur=blur;ctx.filter=blur>15?`blur(${blur*.45}px)`:'none';curve(0);ctx.stroke();
    }
    ctx.filter='none';ctx.shadowBlur=6;
    for(let i=0;i<31;i++){
      const seed=journeySeed(i+12),offset=(seed-.5)*h*.32*(.85+Math.sin(time*1.8+i)*.10),colored=i>27;
      const g=ctx.createLinearGradient(tail.x,tail.y,head.x,head.y);g.addColorStop(0,'#f6b75b00');g.addColorStop(.65,colored?'#c1d1ff28':`rgba(255,219,151,${.12+seed*.24})`);g.addColorStop(1,'#fff4cfb0');ctx.strokeStyle=g;ctx.lineWidth=.5+seed*1.4;curve(offset);ctx.stroke();
    }
    this.glow(head.x,head.y,Math.min(w,h)*.19,.95);
    const flare=ctx.createLinearGradient(head.x-w*.16,head.y,head.x+w*.16,head.y);flare.addColorStop(0,'#ffbb4a00');flare.addColorStop(.5,'#fff7d6df');flare.addColorStop(1,'#ffbb4a00');ctx.fillStyle=flare;ctx.fillRect(head.x-w*.16,head.y-1,w*.32,2);
    ctx.restore();return head;
  }
  drawSpace(elapsed,opacity){
    const ctx=this.context,w=innerWidth,h=innerHeight,a=this.active,settle=journeyRange(elapsed,550,1500),cx=(a.target.x+(.62-a.target.x)*settle)*w,cy=(a.target.y+(.44-a.target.y)*settle)*h;
    ctx.save();ctx.globalAlpha=opacity;const base=ctx.createLinearGradient(0,0,w,h);base.addColorStop(0,'#02040b');base.addColorStop(.55,'#07101c');base.addColorStop(1,'#152032');ctx.fillStyle=base;ctx.fillRect(0,0,w,h);
    const speed=journeyRange(elapsed,550,1350)*(1-journeyRange(elapsed,1600,2600)),distance=Math.hypot(w,h);ctx.globalCompositeOperation='screen';
    for(let i=0;i<115;i++){
      const angle=journeySeed(i+89)*Math.PI*2,seed=journeySeed(i+247),cycle=(seed+Math.max(0,elapsed-550)*.00025)%1,r=(.03+cycle*cycle)*distance*.84,x=cx+Math.cos(angle)*r,y=cy+Math.sin(angle)*r,len=(1+speed*135)*cycle;
      ctx.strokeStyle=`rgba(${i%5===0?'249,201,146':'192,215,237'},${(.18+seed*.6)*(1-speed*.32)})`;ctx.lineWidth=.5+seed*.9;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(angle)*len,y+Math.sin(angle)*len);ctx.stroke();
    }
    ctx.restore();
  }
  drawAtmosphere(elapsed){
    const ctx=this.context,w=innerWidth,h=innerHeight,entry=journeyRange(elapsed,1350,2250),exit=1-journeyRange(elapsed,2850,3550);if(entry<=0||exit<=0)return;
    const radius=w*(.86+entry*.5),cx=w*.38,cy=h*.42+radius+entry*h*.06;ctx.save();ctx.globalAlpha=entry*exit;
    const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#030812');sky.addColorStop(.5,'#10243b');sky.addColorStop(.8,'#567d9b');sky.addColorStop(1,'#b8cbd1');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
    ctx.translate(w/2,h/2);ctx.rotate(.16*(1-journeyRange(elapsed,2600,3500)));ctx.translate(-w/2,-h/2);
    for(let i=5;i>=0;i--){ctx.strokeStyle=`rgba(${i<2?'209,243,255':'90,164,241'},${i<2?.7:.08})`;ctx.lineWidth=2+i*8;ctx.beginPath();ctx.arc(cx,cy,radius-i*3,Math.PI,Math.PI*2);ctx.stroke();}
    // A complete planetary disk closes below the viewport. Closing a semicircle
    // through screen corners creates a diagonal wedge once the camera rolls.
    ctx.save();ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.closePath();ctx.clip();
    const earth=ctx.createLinearGradient(0,h*.4,0,h);earth.addColorStop(0,'#658b9a');earth.addColorStop(.4,'#274558');earth.addColorStop(1,'#101f30');ctx.fillStyle=earth;ctx.fillRect(-w,-h,w*3,h*3);
    this.drawCloudPlate(elapsed,journeyRange(elapsed,1700,2550)*.96,true);this.drawCloudLayers(elapsed,.11,true);ctx.restore();ctx.restore();
  }
  drawCloudLayers(elapsed,opacity=1,distant=false){
    if(!this.cloudSprites)return;const ctx=this.context,w=innerWidth,h=innerHeight,travel=clamp((elapsed-2400)/1800,0,1),inheritedAlpha=ctx.globalAlpha;ctx.save();const count=distant?12:26;
    for(let i=0;i<count;i++){
      const seed=journeySeed(i+517),depth=(i%5)/4,size=w*(.25+depth*.60),drift=elapsed/1000*(11+depth*29),x=((journeySeed(i+42)*w*1.5+drift)%(w*1.7))-w*.36,y=h*(distant?.58:.29)+seed*h*.56+(distant?0:(depth-.4)*travel*h*.30);
      ctx.globalAlpha=inheritedAlpha*opacity*(.33+depth*.54);ctx.drawImage(this.cloudSprites[i%5],x-size*.5,y-size*.25,size,size*.5);
    }ctx.restore();
  }
  drawCloudPlate(elapsed,opacity=1,surface=false){
    const image=this.cloudSea;if(!image||!image.complete||image.naturalWidth<=0){this.canvas.dataset.cloudImage='loading';return false;}
    const ctx=this.context,w=innerWidth,h=innerHeight,travel=journeyRange(elapsed,1600,4400),zoom=1.06+travel*.22;
    const scale=Math.max(w/image.naturalWidth,h/image.naturalHeight)*zoom,width=image.naturalWidth*scale,height=image.naturalHeight*scale;
    ctx.save();ctx.globalAlpha*=opacity;
    // Generated cinematic cloud plate only; never represented as a destination photograph.
    if(surface)ctx.drawImage(image,0,image.naturalHeight*.32,image.naturalWidth,image.naturalHeight*.68,-w*.55,-h*.02,w*2.10,h*2.10);
    else ctx.drawImage(image,(w-width)/2,(h-height)/2+h*(.035-travel*.095),width,height);ctx.restore();
    this.canvas.dataset.cloudImage='ready';return true;
  }
  drawCloudSea(elapsed){
    const ctx=this.context,w=innerWidth,h=innerHeight,enter=journeyRange(elapsed,2500,3050),leave=1-journeyRange(elapsed,3900,4550);if(enter*leave<=0)return;ctx.save();ctx.globalAlpha=enter*leave;
    const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#1b3554');sky.addColorStop(.35,'#7b9caf');sky.addColorStop(.69,'#c0d3d7');sky.addColorStop(1,'#dce4e0');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
    const plateReady=this.drawCloudPlate(elapsed,.98);this.glow(w*.78,h*.21,h*.34,.22);this.drawCloudLayers(elapsed,plateReady?.19:.96);
    const penetration=journeyRange(elapsed,2900,3800),haze=.02+Math.sin(penetration*Math.PI)*.065;ctx.fillStyle=`rgba(234,242,240,${haze})`;ctx.fillRect(0,0,w,h);ctx.restore();
  }
  drawDestination(elapsed){
    const ctx=this.context,w=innerWidth,h=innerHeight,arrival=journeyRange(elapsed,3750,4650);if(!arrival)return;ctx.save();ctx.globalAlpha=arrival;
    const backdrop=ctx.createLinearGradient(0,0,0,h);backdrop.addColorStop(0,'#15283b');backdrop.addColorStop(1,'#10151e');ctx.fillStyle=backdrop;ctx.fillRect(0,0,w,h);const photo=this.active.photo;
    if(photo.complete&&photo.naturalWidth>0){
      // Cinematic city/landscape plate uses the same-book cover, not a frontal museum photo or invented aerial geography.
      const travel=journeyRange(elapsed,3900,8000),scale=Math.max(w/photo.naturalWidth,h/photo.naturalHeight),zoom=1.14-travel*.055,width=photo.naturalWidth*scale*zoom,height=photo.naturalHeight*scale*zoom;
      ctx.drawImage(photo,(w-width)/2+w*(.018-travel*.025),(h-height)/2+h*.045,width,height);this.canvas.dataset.destinationImage='ready';
    }else{this.drawCloudLayers(elapsed,.4);this.canvas.dataset.destinationImage=photo.complete?'unavailable':'loading';}
    const shade=ctx.createLinearGradient(0,0,0,h);shade.addColorStop(0,'rgba(3,10,20,.50)');shade.addColorStop(.46,'rgba(3,10,20,.13)');shade.addColorStop(1,'rgba(3,10,20,.42)');ctx.fillStyle=shade;ctx.fillRect(0,0,w,h);ctx.restore();
  }
  drawBookTexture(image,quad,left=0,right=1){
    const ctx=this.context,iw=image.width*(right-left),ih=image.height;
    // Two native affine triangles map the readable cover onto its perspective quadrilateral.
    for(let triangle=0;triangle<2;triangle++){
      ctx.save();ctx.beginPath();const q=triangle?[quad[1],quad[2],quad[3]]:[quad[0],quad[1],quad[3]];q.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.clip();
      if(!triangle){ctx.transform((quad[1].x-quad[0].x)/iw,(quad[1].y-quad[0].y)/iw,(quad[3].x-quad[0].x)/ih,(quad[3].y-quad[0].y)/ih,quad[0].x,quad[0].y);}
      else{const a=(quad[2].x-quad[3].x)/iw,b=(quad[2].y-quad[3].y)/iw,c=(quad[2].x-quad[1].x)/ih,d=(quad[2].y-quad[1].y)/ih;ctx.transform(a,b,c,d,quad[1].x-a*iw,quad[1].y-b*iw);}
      ctx.drawImage(image,image.width*left,0,iw,ih,0,0,iw,ih);ctx.restore();
    }
  }
  drawPhysicalBook(){
    const pose=this.bookPose;if(!pose||pose.alpha<=.002)return;
    const ctx=this.context,w=this.bookWidth,h=w*1.30,open=pose.open,faces=[],rad=Math.PI/180;
    const cy=Math.cos(pose.yaw*rad),sy=Math.sin(pose.yaw*rad),cx=Math.cos(pose.pitch*rad),sx=Math.sin(pose.pitch*rad),cz=Math.cos(pose.roll*rad),sz=Math.sin(pose.roll*rad);
    const project=(x,y,z)=>{
      x-=(1-open)*w*.5;const rx=x*cy+z*sy,rz=-x*sy+z*cy,ry=y*cx-rz*sx,depth=y*sx+rz*cx,perspective=1100/(1100-depth);
      return {x:pose.x+(rx*cz-ry*sz)*perspective*pose.scale,y:pose.y+(rx*sz+ry*cz)*perspective*pose.scale,depth};
    };
    const vertex=(x,y,angle,depth,bend=0)=>{const a=angle*rad,curl=Math.sin(x/w*Math.PI)*bend,asymmetry=Math.sin(y/h*Math.PI)*Math.pow(x/w,2)*bend*.23;return project(x*Math.cos(a)+depth*Math.sin(a),y+asymmetry,-x*Math.sin(a)+depth*Math.cos(a)+curl);};
    const face=(quad,kind,angle,index=0,extra={})=>{const value={quad,kind,angle,index,depth:quad.reduce((sum,p)=>sum+p.depth,0)/4,...extra};faces.push(value);return value;};
    const addSheet=(angle,depth,bend,kind,index=0)=>{
      const segments=kind==='cover'&&open<.08?1:7,gradStart=vertex(0,-h/2,angle,depth,bend),gradEnd=vertex(w,h/2,angle,depth,bend);
      for(let strip=0;strip<segments;strip++){const left=w*strip/segments,right=w*(strip+1)/segments;face([vertex(left,-h/2,angle,depth,bend),vertex(right,-h/2,angle,depth,bend),vertex(right,h/2,angle,depth,bend),vertex(left,h/2,angle,depth,bend)],kind,angle,index,{left:strip/segments,right:(strip+1)/segments,strip,segments,gradStart,gradEnd});}
      if(kind!=='paper')for(let edge=0;edge<4;edge++){
        const corners=[[0,-h/2],[w,-h/2],[w,h/2],[0,h/2]],a=corners[edge],b=corners[(edge+1)%4];
        face([vertex(...a,angle,depth),vertex(...b,angle,depth),vertex(...b,angle,depth-6),vertex(...a,angle,depth-6)],'edge',angle,index);
      }
    };
    const right=-25*open,left=-151*open;
    addSheet(right,-15,0,'back');
    const addPageBlock=(angle,near,far)=>{
      const corners=[[0,-h/2],[w,-h/2],[w,h/2],[0,h/2]];
      for(let edge=0;edge<4;edge++)for(let band=0;band<6;band++){
        const d0=far+(near-far)*band/6,d1=far+(near-far)*(band+1)/6,a=corners[edge],b=corners[(edge+1)%4];
        face([vertex(...a,angle,d0),vertex(...b,angle,d0),vertex(...b,angle,d1),vertex(...a,angle,d1)],'page-edge',angle,band);
      }
    };
    addPageBlock(right-3*open,-3,-13);addPageBlock(left+3*open,10,3);
    // Two resting signatures and only two principal turning folios. Their fore
    // edges curl asymmetrically instead of forming an empty rigid paper crown.
    const finalAngles=[-29,-57,-119,-148],depths=[-2,1,4,8];
    for(let i=0;i<4;i++){
      const fan=journeyRange(open,.05+i*.045,.97),angle=finalAngles[i]*fan;
      addSheet(angle,depths[i],(i===1?1:i===2?.74:.19)*w*.135*fan,'paper',i);
    }
    addSheet(left,12,0,'cover');faces.sort((a,b)=>open<.08&&((a.kind==='cover')!==(b.kind==='cover'))?(a.kind==='cover'?1:-1):a.depth-b.depth);
    ctx.save();ctx.globalAlpha*=pose.alpha;
    // A displaced soft shadow grounds the volume without turning it into a neon rectangle.
    ctx.save();ctx.filter='blur(18px)';ctx.fillStyle='#02050965';ctx.beginPath();ctx.ellipse(pose.x+w*.02,pose.y+h*.44,w*.65*pose.scale,h*.10*pose.scale,0,0,Math.PI*2);ctx.fill();ctx.restore();
    for(const f of faces){
      const q=f.quad,mid={x:q.reduce((v,p)=>v+p.x,0)/4,y:q.reduce((v,p)=>v+p.y,0)/4};ctx.beginPath();q.forEach((p,i)=>{const dx=p.x-mid.x,dy=p.y-mid.y,d=Math.max(1,Math.hypot(dx,dy)),x=p.x+dx/d*.35,y=p.y+dy/d*.35;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);});ctx.closePath();
      const gs=f.gradStart||q[0],ge=f.gradEnd||q[2],g=ctx.createLinearGradient(gs.x,gs.y,ge.x+.01,ge.y+.01);
      if(f.kind==='paper'){const shade=Math.round(220+Math.sin((f.angle+90)*rad)*15);g.addColorStop(0,`rgb(${shade-15},${shade-28},${shade-51})`);g.addColorStop(.30,'#e4d2a8');g.addColorStop(.78,'#f0e0b9');g.addColorStop(1,'#b6a17a');}
      else if(f.kind==='page-edge'){g.addColorStop(0,f.index%2?'#a69168':'#d8c49a');g.addColorStop(.4,'#e0cda7');g.addColorStop(1,f.index%2?'#baa478':'#f0d9ad');}
      else if(f.kind==='edge'){g.addColorStop(0,'#b2813c');g.addColorStop(.45,'#f3d895');g.addColorStop(1,'#7c542d');}
      else{g.addColorStop(0,'#c5a36b');g.addColorStop(.12,'#5e4934');g.addColorStop(1,'#33271f');}
      ctx.fillStyle=g;ctx.fill();ctx.strokeStyle=f.kind==='paper'?'#ffebbbc0':'#ffe0a1';ctx.lineWidth=f.kind==='paper'?.75:1.4;
      ctx.beginPath();ctx.moveTo(q[0].x,q[0].y);ctx.lineTo(q[1].x,q[1].y);ctx.moveTo(q[3].x,q[3].y);ctx.lineTo(q[2].x,q[2].y);if(f.strip===0){ctx.moveTo(q[0].x,q[0].y);ctx.lineTo(q[3].x,q[3].y);}if(f.strip===f.segments-1){ctx.moveTo(q[1].x,q[1].y);ctx.lineTo(q[2].x,q[2].y);}ctx.stroke();
      const winding=(q[1].x-q[0].x)*(q[3].y-q[0].y)-(q[1].y-q[0].y)*(q[3].x-q[0].x);
      if(f.kind==='cover'&&winding>0&&this.coverTexture)this.drawBookTexture(this.coverTexture,q,f.left,f.right);
      if(f.kind==='paper'&&(f.index===0||f.index===3)&&winding>0&&this.innerTexture)this.drawBookTexture(this.innerTexture,q,f.left,f.right);
      if(f.kind==='paper'&&f.index%3===1){
        ctx.strokeStyle='#69553418';ctx.lineWidth=.45;
        for(let line=0;line<17;line++){const t=.20+line*.033;ctx.beginPath();ctx.moveTo(q[0].x+(q[3].x-q[0].x)*t,q[0].y+(q[3].y-q[0].y)*t);ctx.lineTo(q[1].x+(q[2].x-q[1].x)*t,q[1].y+(q[2].y-q[1].y)*t);ctx.stroke();}
      }
    }
    const spineNear=project(0,h/2,2),spineFar=project(0,-h/2,2);
    ctx.strokeStyle='#ffdda3';ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(spineFar.x,spineFar.y);ctx.quadraticCurveTo((spineFar.x+spineNear.x)/2-3,(spineFar.y+spineNear.y)/2,spineNear.x,spineNear.y);ctx.stroke();
    ctx.restore();this.canvas.dataset.bookPitch=pose.pitch.toFixed(1);this.canvas.dataset.bookOpen=open.toFixed(4);this.canvas.dataset.bookGeometry='perspective-hardcover-fan';this.canvas.dataset.principalFolios='4';
  }
  drawBookAura(elapsed,amount){
    if(amount<=0)return;const ctx=this.context,w=innerWidth,h=innerHeight,cx=w*.52,cy=h*.56,t=(elapsed-4850)/1000;ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=amount;this.glow(cx,cy,Math.min(w,h)*.26,.26);
    const colors=['113,221,255','173,152,255','244,164,222','255,221,154'];
    for(let line=0;line<9;line++){
      const rise=((t*.21+line/9)%1),topX=cx+Math.sin(line*2.1+t*.4)*this.bookWidth*1.12,topY=cy-this.bookWidth*(.4+rise*1.24),bottomY=cy+this.bookWidth*.28;
      const gradient=ctx.createLinearGradient(cx,bottomY,topX,topY);gradient.addColorStop(0,`rgba(${colors[line%4]},0)`);gradient.addColorStop(.6,`rgba(${colors[line%4]},.26)`);gradient.addColorStop(1,`rgba(${colors[line%4]},.65)`);
      ctx.lineWidth=.8;ctx.strokeStyle=gradient;ctx.shadowColor=`rgb(${colors[line%4]})`;ctx.shadowBlur=8;ctx.beginPath();ctx.moveTo(cx+(line-4)*4,bottomY);ctx.bezierCurveTo(cx+Math.sin(t+line)*this.bookWidth*.8,cy-this.bookWidth*.3,topX-this.bookWidth*.3,topY+50,topX,topY);ctx.stroke();this.glow(topX,topY,8,.38,'blue');
    }ctx.restore();
  }
  positionBook(elapsed,state){
    const w=innerWidth,h=innerHeight,a=this.active;this.card.style.opacity='0';
    if(this.globe.reducedMotion){this.bookPose=null;return;}
    if(state.phase==='departure'){
      const t=journeySmooth(state.progress),p=journeyCurve({x:a.origin.x*w,y:a.origin.y*h},{x:a.target.x*w,y:a.target.y*h},t,h),size=Math.max(.008,(a.sourceWidth/this.bookWidth)*(1-Math.pow(t,.85)));
      this.bookPose={x:p.x,y:p.y,scale:size,alpha:1-journeyRange(state.progress,.35,.95),open:0,pitch:-8,yaw:-18-t*40,roll:-9-t*20};return;
    }
    const appear=journeyRange(elapsed,4860,5550),open=journeyRange(elapsed,6160,7790),float=Math.sin((elapsed-4850)*.0016)*5;
    this.bookPose={x:w*.52,y:h*.53+float,scale:.22+appear*.78,alpha:appear*(1-journeyRange(elapsed,7880,8000)),open,pitch:-9+open*69,yaw:-17+open*14,roll:-13+open*19};
    this.card.style.setProperty('--cover-angle',`${-151*open}deg`);
  }
  frame(time){
    if(!this.active)return;const a=this.active,elapsed=time-a.start,state=journeyPhase(elapsed,this.globe.reducedMotion),ctx=this.context,w=innerWidth,h=innerHeight;
    document.body.dataset.journey=state.phase;this.canvas.dataset.progress=state.progress.toFixed(4);this.canvas.dataset.totalProgress=state.totalProgress.toFixed(4);
    if(state.phase==='complete'){const book=a.book;this.clear();this.onComplete(book);return;}
    ctx.clearRect(0,0,w,h);this.frameElapsed=elapsed;this.positionBook(elapsed,state);
    if(this.globe.reducedMotion){ctx.fillStyle=`rgba(237,231,218,${journeySmooth(state.progress)})`;ctx.fillRect(0,0,w,h);this.requestFrame();return;}
    const spaceOpacity=journeyRange(elapsed,490,950);if(spaceOpacity)this.drawSpace(elapsed,spaceOpacity);
    this.drawAtmosphere(elapsed);this.drawCloudSea(elapsed);this.drawDestination(elapsed);
    if(state.phase==='departure')this.drawStream({x:a.origin.x*w,y:a.origin.y*h},{x:a.target.x*w,y:a.target.y*h},state.progress,.88);
    else if(elapsed<5450){
      const settle=journeyRange(elapsed,550,1500),arrive=journeyRange(elapsed,3950,5180),camera=journeyRange(elapsed,1700,3850);
      const head={x:w*((a.target.x+(.64-a.target.x)*settle)*(1-arrive)+.52*arrive),y:h*((a.target.y+(.44-a.target.y)*settle)*(1-arrive)+.53*arrive)};
      this.drawStream({x:-w*.19,y:h*(1.04-camera*.12)},head,1,(1-journeyRange(elapsed,4860,5450))*.97);
    }
    this.drawBookAura(elapsed,journeyRange(elapsed,5150,6350)*(1-journeyRange(elapsed,7810,8000)));this.drawPhysicalBook();
    const veil=journeyRange(elapsed,7830,8000);if(veil){ctx.fillStyle=`rgba(237,231,218,${veil})`;ctx.fillRect(0,0,w,h);}this.requestFrame();
  }
}
