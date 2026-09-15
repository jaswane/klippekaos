(function(root){
'use strict';

const PARAMETERS=Object.freeze({near:40,far:280,nearAuthority:1,farAuthority:.55,fullSteerAngle:Math.PI/3,deadDistance:8,fullDistance:18,deadAngle:.025});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function command(mower,target,direction=1){
 const dx=target.x-mower.x,dy=target.y-mower.y,distance=Math.hypot(dx,dy);
 if(!Number.isFinite(distance)||distance<=PARAMETERS.deadDistance)return {throttle:direction,steering:0};
 // Aim the rear at the target. Negative speed reverses yaw, so reverse also negates steering.
 const angle=Math.atan2(dy,dx)+(direction<0?Math.PI:0)-mower.angle,error=Math.atan2(Math.sin(angle),Math.cos(angle));
 const t=clamp((distance-PARAMETERS.near)/(PARAMETERS.far-PARAMETERS.near),0,1);
 const authority=PARAMETERS.nearAuthority+(PARAMETERS.farAuthority-PARAMETERS.nearAuthority)*t;
 const stability=clamp((distance-PARAMETERS.deadDistance)/(PARAMETERS.fullDistance-PARAMETERS.deadDistance),0,1);
 return {throttle:direction,steering:Math.abs(error)<PARAMETERS.deadAngle?0:clamp(error/PARAMETERS.fullSteerAngle,-1,1)*authority*stability*direction};
}
class MouseInput{
 constructor(){this.clear();}
 down(event,onScene){if(!onScene||event.pointerType!=='mouse'||![0,2].includes(event.button))return false;this.id=event.pointerId;this.button=event.button;this.active=true;this.move(event);return true;}
 move(event){if(this.active&&event.pointerId===this.id){this.clientX=event.clientX;this.clientY=event.clientY;}}
 up(event){if(event.pointerId===this.id)this.clear();}
 clear(){this.active=false;this.id=null;this.button=null;this.clientX=0;this.clientY=0;}
 read(mower,view,rect){return this.active?command(mower,view.screenToWorld(this.clientX-rect.left,this.clientY-rect.top),this.button===2?-1:1):{throttle:0,steering:0};}
}
// A held mouse owns driving axes; the existing keyboard/touch/pad priority is retained otherwise.
// Keyboard driving keydown cancels mouse capture at the DOM boundary. Boosts remain combinable.
function arbitrate(mouseActive,mouse,keyboard,touch,pad){return {
 throttle:mouseActive?mouse.throttle:keyboard.throttle||touch.throttle||pad.throttle||0,
 steering:mouseActive?mouse.steering:keyboard.steering||touch.steering||pad.steering||0,
 speedBoost:!!(keyboard.speedBoost||touch.speedBoost||pad.speedBoost),
 turnBoost:!!(keyboard.turnBoost||touch.turnBoost||pad.turnBoost)};}
function bind(canvas,input,{enabled,onStart,window:host=window}){
 let rightGesture=false,gestureUntil=0;
 const ownsRight=()=>rightGesture||Date.now()<gestureUntil;
 const finishGesture=()=>{if(rightGesture){rightGesture=false;gestureUntil=Date.now()+500;}};
 const release=e=>{if(e.pointerId===input.id){finishGesture();input.up(e);}};
 // A new press outside the surface must never inherit suppression from a prior drive.
 host.addEventListener('pointerdown',()=>{rightGesture=false;gestureUntil=0;},true);
 const clear=()=>{const id=input.id;finishGesture();input.clear();if(id!==null&&canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);};
 canvas.addEventListener('pointerdown',e=>{if(!input.down(e,enabled()))return;e.preventDefault();if(e.button===2){rightGesture=true;gestureUntil=0;}canvas.setPointerCapture(e.pointerId);onStart();});
 // Chorded mouse presses are pointermove events, not another pointerdown.
 canvas.addEventListener('pointermove',e=>{if(e.pointerId!==input.id)return;
  if([0,2].includes(e.button)&&(e.buttons&(e.button===2?2:1))&&enabled()){input.down(e,true);if(e.button===2){rightGesture=true;gestureUntil=0;}e.preventDefault();}
  if(!(e.buttons&(input.button===2?2:1))){clear();return;}input.move(e);
 });
 // Mouseup also fires when one button is released while the other stays held.
 host.addEventListener('mouseup',e=>{if(e.button===input.button)clear();});
 const suppress=e=>{e.preventDefault();e.stopPropagation?.();};
 const surfaceNative=e=>{
  if(!enabled()&&!ownsRight())return;
  if(e.type==='auxclick'&&e.button!==2)return;
  suppress(e);
  if(e.type==='dragstart'||e.type==='selectstart'||(e.type==='auxclick'&&!(e.buttons&2)))clear();
 };
 for(const name of ['contextmenu','auxclick','dragstart','selectstart'])canvas.addEventListener(name,surfaceNative,{capture:true,passive:false});
 // Only the tail of a right gesture begun on this canvas may be caught off-surface.
 for(const name of ['contextmenu','auxclick'])host.addEventListener(name,e=>{
  if(e.button!==2||!ownsRight())return;suppress(e);
  if(e.type==='auxclick'&&!(e.buttons&2))clear();
 },{capture:true,passive:false});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,release);
 host.addEventListener('pointerup',release);host.addEventListener('pointercancel',release);host.addEventListener('blur',clear);
 return clear;
}

root.KlippeMouse={PARAMETERS,command,MouseInput,arbitrate,bind};if(typeof module!=='undefined')module.exports=root.KlippeMouse;
})(typeof window!=='undefined'?window:globalThis);
