// Accessible DOM books share the observer and position model of the scene.
class OrbitalLibrary {
  constructor(element,globe,books,callbacks) {
    Object.assign(this,{element,globe,books,callbacks,opened:false,phase:0,seconds:0,lastTime:performance.now(),hovered:null,focused:null,active:null,morph:null});
    this.buttons=books.map((book,index)=>{
      const button=document.createElement('button');button.type='button';button.className='orbital-book';
      button.dataset.index=index;button.dataset.book=book.id;
      const tile=`<span class="orbital-cover"><img src="${ATLAS_BOOK_IMAGES[book.id]}" alt="" draggable="false"></span><span class="orbital-title"><b>${book.title}</b><small>${book.english.split(' / ')[0]}</small></span>`;
      // Eleven tangent strips form one continuous cylindrical tile, including photo and type.
      const segments=Array.from({length:11},(_,i)=>`<span class="tile-segment" style="--segment:${i}"><span class="tile-face">${tile}</span></span>`).join('');
      button.innerHTML=`<span class="planet-art"><img src="${ATLAS_PLANET_IMAGES[index]}" alt=""><span>${book.title}</span></span><span class="holographic-book curved-tile" aria-hidden="true">${segments}</span>`;
      button.addEventListener('mouseenter',()=>{this.hovered=index;this.preview(index);});
      button.addEventListener('mouseleave',()=>{this.hovered=null;this.endPreview();});
      button.addEventListener('focus',()=>{this.focused=index;this.preview(index);});
      button.addEventListener('blur',()=>{this.focused=null;this.endPreview();});
      button.addEventListener('click',()=>{if(this.morph)return;if(!this.opened){this.setOpen(true);this.callbacks.mode?.(true);button.blur();}else this.callbacks.activate(book,button);});
      element.append(button);return button;
    });
    this.syncLabels();element.setAttribute('aria-hidden','false');
  }
  get paused(){return this.opened && (this.previewHeld || this.globe.dragging || this.hovered!==null || this.focused!==null);}
  syncLabels(){
    this.element.dataset.mode=this.opened?'books':'planets';
    this.buttons.forEach((button,index)=>{button.tabIndex=0;button.setAttribute('aria-label',this.opened?`阅读《${this.books[index].title}》，悬停预览地图与景色`:`小星球：${this.books[index].title}，点击展开全部画册`);});
  }
  preview(index){
    clearTimeout(this.releaseTimer);
    if(!this.opened||this.morph||this.active===index)return;
    this.active=index;this.buttons.forEach((button,i)=>button.classList.toggle('active',i===index));this.callbacks.preview(this.books[index]);
  }
  endPreview(){if(!this.opened||this.paused)return;clearTimeout(this.releaseTimer);this.releaseTimer=setTimeout(()=>{if(this.paused)return;this.active=null;this.buttons.forEach(button=>button.classList.remove('active'));this.callbacks.release();},220);}
  setOpen(opened){
    if(this.opened===opened)return;
    const from=this.buttons.map((_,index)=>this.pose(index));this.opened=opened;
    if(opened)this.phase=0;
    this.hovered=this.focused=this.active=null;
    this.morph={from,start:performance.now(),duration:this.globe.reducedMotion?1:1200};
    this.buttons.forEach(button=>button.classList.remove('active'));document.body.classList.toggle('orbits-open',opened);this.syncLabels();
  }
  planetOrbit(index,anomaly){return this.planetScreenPose(index,orbitPositionAtAnomaly(ORBIT_ELEMENTS[index],anomaly));}
  planetScreenPose(index,world){
    const point=projectOrbitalPoint(world,this.globe),physicalRadius=.088+index%3*.012;
    const unit=this.globe.planetUnit??this.globe.baseRadius,size=physicalRadius*2*unit*point.perspective;
    return {...point,scale:1,width:Math.max(28,size),height:Math.max(28,size),turn:0,roll:0,world,physicalRadius,visibleSize:size};
  }
  planetPose(index){return this.planetScreenPose(index,keplerPosition(ORBIT_ELEMENTS[index],this.seconds??0));}
  bookPose(index){
    const mobile=this.globe.width<720;
    const unit=mobile?Math.min(this.globe.width/600,.65):Math.min(this.globe.width/1672,this.globe.height/941,1.8);
    const cardWidth=mobile?90:240*unit;
    const angles=[-.70,-2.54,-1.93,2.54,1.93,1.08,.45,0,-.52,-1.08];
    const angle=angles[index]+this.phase,depth=Math.cos(angle);
    const rx=this.globe.width*(mobile?(index===0?.25:.34):(index===0?.28:.43));
    const ry=this.globe.height*(index===0?.08:mobile?.235:.235);
    return {x:this.globe.centerX+Math.sin(angle)*rx,y:this.globe.restCenterY+depth*ry,
      depth,scale:.84+(depth+1)*.10,width:cardWidth,height:mobile?51:112*unit,
      turn:-Math.sin(angle)*32,roll:-Math.sin(angle)*Math.cos(angle)*12};
  }
  pose(index){return this.opened?this.bookPose(index):this.planetPose(index);}
  update(time){
    const delta=Math.max(0,Math.min(time-this.lastTime,80));this.lastTime=time;
    if(!this.globe.reducedMotion)this.seconds=(this.seconds??0)+delta/1000;
    if(!this.paused&&!this.morph&&!this.globe.reducedMotion&&this.opened)this.phase+=delta*.000045;
    this.element.dataset.motion=this.morph?'transforming':this.paused?'paused':'rotating';this.element.dataset.phase=this.phase.toFixed(5);
    this.element.dataset.simulationSeconds=this.seconds.toFixed(3);
    const amount=this.morph?easeInOutCubic(clamp((time-this.morph.start)/this.morph.duration,0,1)):1;
    const planetAlpha=this.morph?(this.opened?1-amount:amount):this.opened?0:1;
    this.globe.planetMeshes=planetAlpha>0?this.books.map((_,index)=>({index,...this.planetPose(index),alpha:planetAlpha})):[];
    for(let index=0;index<this.buttons.length;index++){
      const button=this.buttons[index],target=this.pose(index);
      const pose=this.morph?Object.fromEntries(['x','y','depth','scale','width','height','turn','roll'].map(key=>[key,this.morph.from[index][key]+(target[key]-this.morph.from[index][key])*amount])):target;
      const selected=this.active===index,scale=pose.scale+(selected&&this.opened?.16:0);
      button.style.setProperty('--book-width',`${pose.width}px`);button.style.setProperty('--book-height',`${pose.height}px`);
      if(button.querySelectorAll){
        const radius=pose.width/.95;
        button.querySelectorAll('.tile-segment').forEach((segment,i)=>{
          const angle=((i+.5)/11-.5)*.95;
          segment.style.transform=`translate3d(${(radius*Math.sin(angle)).toFixed(2)}px,0,${(radius*(Math.cos(angle)-1)).toFixed(2)}px) rotateY(${(angle*180/Math.PI).toFixed(2)}deg)`;
        });
      }
      button.style.transform=`translate3d(${(pose.x-pose.width/2).toFixed(2)}px,${(pose.y-pose.height/2).toFixed(2)}px,0) perspective(1200px) rotateY(${pose.turn.toFixed(2)}deg) rotateZ(${this.opened?pose.roll.toFixed(2):0}deg) scale(${scale.toFixed(4)})`;
      const occluded=!this.opened&&this.isEarthOccluded(target);
      button.style.zIndex=selected?'8':pose.depth>=0?'6':'1';button.style.opacity=String(occluded?0:this.opened&&pose.depth<0?.90:1);
      button.style.pointerEvents=occluded?'none':'auto';button.dataset.occluded=String(occluded);button.dataset.depth=pose.depth.toFixed(4);
    }
    if(this.morph&&amount===1){this.morph=null;const index=this.hovered??this.focused;if(index!==null)this.preview(index);}
    this.drawTracks(time);
  }
  isEarthOccluded(point){
    const dx=(point.x-this.globe.centerX)/this.globe.baseRadius,dy=(point.y-this.globe.restCenterY)/this.globe.baseRadius,squared=dx*dx+dy*dy;
    return squared<1&&(point.z??point.depth*2.6)<Math.sqrt(1-squared)*this.globe.baseRadius/(this.globe.planetUnit??this.globe.baseRadius);
  }
  drawTracks(){
    const back=this.globe.orbitContext,front=this.globe.effectsContext;if(!back)return;
    back.clearRect(0,0,this.globe.width,this.globe.height);
    const stroke=(points,context,frontPass,color,width)=>{
      if(!context)return;context.save();context.beginPath();let drawing=false;
      for(const p of points){const visible=frontPass?p.z>0&&!this.isEarthOccluded(p):p.z<=0;
        if(!visible){drawing=false;continue;}if(!drawing){context.moveTo(p.x,p.y);drawing=true;}else context.lineTo(p.x,p.y);}
      context.strokeStyle=color;context.lineWidth=width;context.stroke();context.restore();
    };
    if(!this.opened){
      if(!this.physicalPaths)this.physicalPaths=ORBIT_ELEMENTS.map(elements=>Array.from({length:241},(_,n)=>orbitPositionAtAnomaly(elements,n*Math.PI*2/240)));
      for(let index=0;index<10;index++){
        const points=this.physicalPaths[index].map(point=>projectOrbitalPoint(point,this.globe));
        stroke(points,back,false,'rgba(148,182,215,.26)',.7);stroke(points,front,true,'rgba(165,207,241,.40)',.8);
      }
    }else{
      for(const index of [0,5]){
        const mobile=this.globe.width<720,rx=this.globe.width*(mobile?(index===0?.25:.34):(index===0?.28:.43));
        const ry=this.globe.height*(index===0?.08:mobile?.235:.235);
        const points=Array.from({length:241},(_,n)=>{const a=n*Math.PI*2/240;return{x:this.globe.centerX+Math.sin(a)*rx,y:this.globe.restCenterY+Math.cos(a)*ry,z:Math.cos(a)*2.5};});
        stroke(points,back,false,'rgba(107,169,255,.62)',1);stroke(points,front,true,'rgba(135,195,255,.9)',1.1);
      }
      if(front)for(let index=0;index<10;index++){
        const point=this.bookPose(index),context=point.depth<0?back:front;
        context.save();context.shadowColor='#72baff';context.shadowBlur=8;context.fillStyle='#ccecff';
        context.beginPath();context.arc(point.x,point.y,1.8,0,Math.PI*2);context.fill();context.restore();
      }
    }
  }
}
