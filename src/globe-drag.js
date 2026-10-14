// Pointer capture makes direction control continuous even when the pointer leaves the globe.
function rotateGlobeByPixels(globe,dx,dy) {
  const radius=Math.max(globe.baseRadius*globe.scale,90);
  globe.yaw+=dx/radius*.85;
  globe.pitch=clamp(globe.pitch+dy/radius*.75,radians(-85),radians(85));
}
class GlobeDragController {
  constructor(element,globe,onStart){
    Object.assign(this,{element,globe,onStart,pointer:null,velocity:{x:0,y:0}});
    element.addEventListener('pointerdown',event=>{
      if(event.button!==0||this.pointer!==null)return;
      event.preventDefault();element.focus({preventScroll:true});
      this.pointer=event.pointerId;this.last={x:event.clientX,y:event.clientY,time:performance.now()};
      this.velocity={x:0,y:0};globe.dragging=true;globe.transition=null;globe.focusBook=null;
      element.setPointerCapture(event.pointerId);element.dataset.dragging='true';this.onStart();
    });
    element.addEventListener('pointermove',event=>{
      if(event.pointerId!==this.pointer)return;
      const now=performance.now(),dt=Math.max(now-this.last.time,8);
      const dx=event.clientX-this.last.x,dy=event.clientY-this.last.y;
      rotateGlobeByPixels(globe,dx,dy);this.velocity={x:dx/dt,y:dy/dt};
      this.last={x:event.clientX,y:event.clientY,time:now};globe.lastSphereTime=0;
    });
    const finish=event=>{
      if(event.pointerId!==this.pointer)return;
      this.pointer=null;globe.dragging=false;globe.manualUntil=performance.now()+4000;
      if(globe.reducedMotion)this.velocity={x:0,y:0};
      if(element.hasPointerCapture(event.pointerId))element.releasePointerCapture(event.pointerId);
      element.dataset.dragging='false';
    };
    element.addEventListener('pointerup',finish);element.addEventListener('pointercancel',finish);element.addEventListener('lostpointercapture',finish);
    element.addEventListener('keydown',event=>{
      const direction={ArrowLeft:[-20,0],ArrowRight:[20,0],ArrowUp:[0,-20],ArrowDown:[0,20]}[event.key];
      if(!direction)return;event.preventDefault();event.stopPropagation();
      globe.transition=null;globe.focusBook=null;this.velocity={x:0,y:0};this.onStart();
      rotateGlobeByPixels(globe,...direction);globe.manualUntil=performance.now()+4000;
    });
  }
  update(delta,time){
    const {globe,element}=this,r=globe.baseRadius*globe.scale;
    element.style.width=element.style.height=`${2*r}px`;element.style.left=`${globe.centerX-r}px`;element.style.top=`${globe.centerY-r}px`;
    element.dataset.yaw=globe.yaw.toFixed(5);element.dataset.pitch=globe.pitch.toFixed(5);
    if(globe.dragging||globe.transition||globe.focusBook||time>globe.manualUntil)return;
    if(Math.hypot(this.velocity.x,this.velocity.y)>.006){
      rotateGlobeByPixels(globe,this.velocity.x*delta,this.velocity.y*delta);
      const decay=Math.exp(-delta/150);this.velocity.x*=decay;this.velocity.y*=decay;
    }
  }
}
