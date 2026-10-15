// Accessible DOM books share the observer and position model of the scene.
class OrbitalLibrary {
  constructor(element,globe,books,callbacks) {
    Object.assign(this,{element,globe,books,callbacks,opened:false,phase:0,seconds:0,lastTime:performance.now(),hovered:null,focused:null,active:null,morph:null});
    this.buttons=books.map((book,index)=>{
      const button=document.createElement('button');button.type='button';button.className='orbital-book';
      button.dataset.index=index;button.dataset.book=book.id;
      button.dataset.player='travel';
      const icon=(name,path)=>`<svg class="player-icon player-icon-${name}" viewBox="0 0 24 24" focusable="false" aria-hidden="true">${path}</svg>`;
      const heart=icon('heart','<path d="M20.3 4.8a5.3 5.3 0 0 0-7.5 0L12 5.6l-.8-.8a5.3 5.3 0 0 0-7.5 7.5L12 20l8.3-7.7a5.3 5.3 0 0 0 0-7.5Z"/>');
      const previous=icon('previous','<path d="M6 5v14M19 5 8 12l11 7Z"/>');
      const next=icon('next','<path d="M18 5v14M5 5l11 7-11 7Z"/>');
      const read=icon('read','<path d="m9 6 9 6-9 6Z"/>');
      const orbit=icon('orbit','<ellipse cx="12" cy="12" rx="9" ry="4.2" transform="rotate(-35 12 12)"/><circle cx="12" cy="12" r="2"/><path d="m6 5 .3 3 3-.3"/>');
      const bookmark=icon('bookmark','<path d="M7 4h10v16l-5-3-5 3Z"/>');
      // Player anatomy follows the reference, but the only actual action is to
      // open this travel album. The ornamental controls are never nested buttons.
      const tile=`<span class="player-heading"><span class="player-copy"><b>${book.title}</b><small>${book.english.split(' / ')[0]}</small></span>${heart}</span><span class="player-progress"><i style="--player-position:${(index+.5)/books.length}"></i></span><span class="player-pagination"><span>${book.number}</span><span>${String(books.length).padStart(2,'0')}</span></span><span class="player-controls">${bookmark}${previous}<span class="player-read">${read}</span>${next}${orbit}</span>`;
      // Native labels and controls bend with the same elevated cylindrical
      // projection as the single glass outline. The strips have no own rims.
      const segments=Array.from({length:31},(_,i)=>`<span class="tile-segment" style="--segment:${i}"><span class="tile-face">${tile}</span></span>`).join('');
      const shell=`<span class="player-glass"></span><svg class="player-shell" viewBox="0 0 236 138" preserveAspectRatio="none" focusable="false"><defs><linearGradient id="player-glass-${index}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#eee6d4" stop-opacity=".22"/><stop offset=".48" stop-color="#b7b4ac" stop-opacity=".13"/><stop offset="1" stop-color="#bba17d" stop-opacity=".22"/></linearGradient><linearGradient id="player-rim-${index}" x1="0" y1="0" x2=".95" y2="1"><stop stop-color="#c7e1f1"/><stop offset=".27" stop-color="#fff5dc"/><stop offset=".72" stop-color="#edcda9"/><stop offset="1" stop-color="#e8d3f7"/></linearGradient></defs><path class="player-surface" fill="url(#player-glass-${index})"/><path class="player-rim" fill="none" stroke="url(#player-rim-${index})"/></svg>`;
      button.innerHTML=`<span class="planet-art"><img src="${ATLAS_PLANET_IMAGES[index]}" alt=""><span>${book.title}</span></span><span class="holographic-book curved-tile travel-player" aria-hidden="true">${shell}${segments}</span>`;
      button.addEventListener('mouseenter',()=>{this.hovered=index;this.preview(index);});
      button.addEventListener('mouseleave',()=>{this.hovered=null;this.endPreview();});
      button.addEventListener('focus',()=>{this.focused=index;this.preview(index);});
      button.addEventListener('blur',()=>{this.focused=null;this.endPreview();});
      button.addEventListener('click',()=>{if(this.busy||this.morph||this.navigation&&!this.navigation.settled)return;if(!this.opened){this.setOpen(true);if(!this.navigation)this.callbacks.mode?.(true);button.blur();}else this.callbacks.activate(book,button);});
      element.append(button);return button;
    });
    this.syncLabels();element.setAttribute('aria-hidden','false');
  }
  get paused(){return this.opened && (this.busy || this.previewHeld || this.globe.dragging || this.hovered!==null || this.focused!==null);}
  syncLabels(){
    this.element.dataset.mode=this.opened?'books':'planets';
    this.buttons.forEach((button,index)=>{button.tabIndex=0;button.setAttribute('aria-label',this.opened?`阅读《${this.books[index].title}》，悬停预览地图与景色`:`小星球：${this.books[index].title}，点击展开全部画册`);});
  }
  preview(index){
    clearTimeout(this.releaseTimer);
    if(this.busy||!this.opened||this.morph||this.navigation&&!this.navigation.settled||this.active===index)return;
    this.active=index;this.buttons.forEach((button,i)=>button.classList.toggle('active',i===index));this.callbacks.preview(this.books[index]);
  }
  endPreview(){if(!this.opened||this.paused)return;clearTimeout(this.releaseTimer);this.releaseTimer=setTimeout(()=>{if(this.paused)return;this.active=null;this.buttons.forEach(button=>button.classList.remove('active'));this.callbacks.release();},220);}
  setOpen(opened){
    if(this.navigation){this.navigation.setOpen(opened);return;}
    if(this.opened===opened)return;
    const from=this.buttons.map((_,index)=>this.pose(index));this.opened=opened;
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
  planetPose(index){return this.cosmos?.planetPose(index,this.seconds??0)??this.planetScreenPose(index,keplerPosition(ORBIT_ELEMENTS[index],this.seconds??0));}
  bookPose(index){
    const mobile=this.globe.width<720;
    const unit=mobile?Math.min(this.globe.width/600,.65):Math.min(this.globe.width/1672,this.globe.height/941,1.8);
    const cardWidth=mobile?86:236*unit;
    const angles=[-.58,-.95,-2.10,1.05,2.20,1.40,.24,-1.40,3.05,.75];
    const angle=angles[index]+this.phase,point=bookOrbitPoint(index,angle,this.globe);
    // Tangency is compressed slightly so both side players remain readable;
    // the actual translation and depth still come from the shared 3D cylinder.
    return {...point,scale:point.perspective*(this.globe.sceneZoom??1),width:cardWidth,height:mobile?57:138*unit,
      turn:-Math.atan2(Math.sin(angle),.60+Math.abs(Math.cos(angle)))*180/Math.PI,roll:0};
  }
  pose(index){return this.opened?this.bookPose(index):this.planetPose(index);}
  update(time){
    const delta=Math.max(0,Math.min(time-this.lastTime,80));this.lastTime=time;
    if(!this.globe.reducedMotion)this.seconds=(this.seconds??0)+delta/1000;
    const moving=this.opened&&!this.paused&&!this.morph&&!this.globe.reducedMotion&&(!this.navigation||this.navigation.settled);
    const step=dampedOrbitStep(this.orbitSpeed??0,moving?.000075:0,delta,110);
    this.orbitSpeed=step.speed;if(this.orbitSpeed<1e-8&&!moving)this.orbitSpeed=0;else this.phase+=step.angle;
    this.element.dataset.motion=this.morph||this.navigation&&!this.navigation.settled?'transforming':this.paused?(this.orbitSpeed?'decelerating':'paused'):'rotating';this.element.dataset.phase=this.phase.toFixed(5);
    this.element.dataset.simulationSeconds=this.seconds.toFixed(3);
    const amount=this.morph?easeInOutCubic(clamp((time-this.morph.start)/this.morph.duration,0,1)):1;
    const blend=this.navigation?this.globe.libraryBlend:this.morph?(this.opened?amount:1-amount):this.opened?1:0;
    const planetAlpha=1-blend;
    this.globe.planetMeshes=planetAlpha>0?this.books.map((_,index)=>{const p=this.planetPose(index);return {index,...p,alpha:planetAlpha*(p.planetAlpha??1)};}):[];
    for(let index=0;index<this.buttons.length;index++){
      const button=this.buttons[index],target=this.pose(index);
      const planet=this.planetPose(index),book=this.bookPose(index);
      const pose=this.navigation?Object.fromEntries(['x','y','depth','scale','width','height','turn','roll'].map(key=>[key,planet[key]+(book[key]-planet[key])*blend])):this.morph?Object.fromEntries(['x','y','depth','scale','width','height','turn','roll'].map(key=>[key,this.morph.from[index][key]+(target[key]-this.morph.from[index][key])*amount])):target;
      const selected=this.active===index;
      button.highlight=(button.highlight??0)+((selected?.075:0)-(button.highlight??0))*(1-Math.exp(-delta/180));
      const scale=pose.scale+button.highlight;
      button.style.setProperty('--book-opacity',String(blend));button.style.setProperty('--planet-opacity',String(1-blend));
      button.style.setProperty('--book-width',`${pose.width}px`);button.style.setProperty('--book-height',`${pose.height}px`);
      const curveSize=`${pose.width.toFixed(2)}:${pose.height.toFixed(2)}`;
      if(button.querySelectorAll && button.dataset.curveSize!==curveSize){
        button.dataset.curveSize=curveSize;
        const geometry=cylindricalPlayerGeometry(pose.width,pose.height);
        button.dataset.curveBow=geometry.topBow.toFixed(2);
        button.querySelectorAll('.player-shell').forEach(shell=>shell.setAttribute('viewBox',`0 0 ${pose.width} ${pose.height}`));
        button.querySelectorAll('.player-surface,.player-rim').forEach(path=>path.setAttribute('d',geometry.path));
        button.querySelectorAll('.player-glass').forEach(glass=>glass.style.clipPath=`path("${geometry.path}")`);
        button.querySelectorAll('.tile-segment').forEach((segment,i)=>{
          segment.style.transform=`matrix(${geometry.strips[i].matrix.map(value=>value.toFixed(6)).join(',')})`;
        });
      }
      button.style.transform=`translate3d(${(pose.x-pose.width/2).toFixed(2)}px,${(pose.y-pose.height/2).toFixed(2)}px,0) perspective(1200px) rotateY(${pose.turn.toFixed(2)}deg) rotateZ(${this.opened?pose.roll.toFixed(2):0}deg) scale(${scale.toFixed(4)})`;
      const occluded=blend<.05&&this.isEarthOccluded(target);
      const visibleAlpha=blend+(1-blend)*(planet.planetAlpha??1);
      button.style.zIndex=selected?'8':pose.depth>=0?'6':'1';button.style.opacity=String(occluded?0:visibleAlpha*(this.opened&&pose.depth<0?.78:1));
      button.style.pointerEvents=occluded||visibleAlpha<.1?'none':'auto';button.dataset.occluded=String(occluded);button.dataset.depth=pose.depth.toFixed(4);
      button.dataset.tier=String(book.tier);
    }
    if(this.morph&&amount===1){this.morph=null;const index=this.hovered??this.focused;if(index!==null)this.preview(index);}
    this.drawTracks(time);
  }
  isEarthOccluded(point){
    const dx=(point.x-this.globe.centerX)/this.globe.baseRadius,dy=(point.y-this.globe.restCenterY)/this.globe.baseRadius,squared=dx*dx+dy*dy;
    return squared<1&&(point.z??point.depth*2.6)<Math.sqrt(1-squared)*this.globe.baseRadius/(this.globe.planetUnit??this.globe.baseRadius);
  }
  drawTracks(time){
    const back=this.globe.orbitContext,front=this.globe.effectsContext;if(!back)return;
    back.clearRect(0,0,this.globe.width,this.globe.height);
    const stroke=(points,context,frontPass,color,width)=>{
      if(!context)return;context.save();context.beginPath();let drawing=false;
      for(const p of points){const visible=frontPass?p.z>0&&!this.isEarthOccluded(p):p.z<=0;
        if(!visible){drawing=false;continue;}if(!drawing){context.moveTo(p.x,p.y);drawing=true;}else context.lineTo(p.x,p.y);}
      context.strokeStyle=color;context.lineWidth=width;context.stroke();context.restore();
    };
    const blend=this.navigation?this.globe.libraryBlend:this.opened?1:0;
    if(blend<1){
      if(this.cosmos)this.cosmos.draw(time,1-blend);
      else {
        if(!this.physicalPaths)this.physicalPaths=ORBIT_ELEMENTS.map(elements=>Array.from({length:241},(_,n)=>orbitPositionAtAnomaly(elements,n*Math.PI*2/240)));
        for(let index=0;index<10;index++){
          const points=this.physicalPaths[index].map(point=>projectOrbitalPoint(point,this.globe));
          stroke(points,back,false,`rgba(148,182,215,${.26*(1-blend)})`,.7);stroke(points,front,true,`rgba(165,207,241,${.40*(1-blend)})`,.8);
        }
      }
    }
    if(blend>0){
      for(const index of [1,0,5]){
        const points=Array.from({length:241},(_,n)=>bookOrbitPoint(index,n*Math.PI*2/240,this.globe));
        // Convert pixel-depth into the Earth-relative unit for occlusion checks.
        points.forEach(p=>p.z/=this.globe.planetUnit??this.globe.baseRadius);
        stroke(points,back,false,`rgba(184,196,213,${.12*blend})`,.7);stroke(points,front,true,`rgba(219,223,232,${.20*blend})`,.8);
      }
    }
  }
}
