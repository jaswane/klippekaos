(function(root){
'use strict';

const PARAMETERS=Object.freeze({near:40,far:280,nearAuthority:1,farAuthority:.55,fullSteerAngle:Math.PI/3,deadDistance:8,fullDistance:18,deadAngle:.025});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function command(mower,target){
 const dx=target.x-mower.x,dy=target.y-mower.y,distance=Math.hypot(dx,dy);
 if(!Number.isFinite(distance)||distance<=PARAMETERS.deadDistance)return {throttle:1,steering:0};
 const angle=Math.atan2(dy,dx)-mower.angle,error=Math.atan2(Math.sin(angle),Math.cos(angle));
 const t=clamp((distance-PARAMETERS.near)/(PARAMETERS.far-PARAMETERS.near),0,1);
 const authority=PARAMETERS.nearAuthority+(PARAMETERS.farAuthority-PARAMETERS.nearAuthority)*t;
 const stability=clamp((distance-PARAMETERS.deadDistance)/(PARAMETERS.fullDistance-PARAMETERS.deadDistance),0,1);
 return {throttle:1,steering:Math.abs(error)<PARAMETERS.deadAngle?0:clamp(error/PARAMETERS.fullSteerAngle,-1,1)*authority*stability};
}
class MouseInput{
 constructor(){this.clear();}
 down(event,onScene){if(!onScene||event.pointerType!=='mouse'||event.button!==0||this.active)return false;this.id=event.pointerId;this.active=true;this.move(event);return true;}
 move(event){if(this.active&&event.pointerId===this.id){this.clientX=event.clientX;this.clientY=event.clientY;}}
 up(event){if(event.pointerId===this.id)this.clear();}
 clear(){this.active=false;this.id=null;this.clientX=0;this.clientY=0;}
 read(mower,view,rect){return this.active?command(mower,view.screenToWorld(this.clientX-rect.left,this.clientY-rect.top)):{throttle:0,steering:0};}
}
// A held mouse owns driving axes; the existing keyboard/touch/pad priority is retained otherwise.
// Keyboard driving keydown cancels mouse capture at the DOM boundary. Boosts remain combinable.
function arbitrate(mouseActive,mouse,keyboard,touch,pad){return {
 throttle:mouseActive?mouse.throttle:keyboard.throttle||touch.throttle||pad.throttle||0,
 steering:mouseActive?mouse.steering:keyboard.steering||touch.steering||pad.steering||0,
 speedBoost:!!(keyboard.speedBoost||touch.speedBoost||pad.speedBoost),
 turnBoost:!!(keyboard.turnBoost||touch.turnBoost||pad.turnBoost)};}
function bind(canvas,input,{enabled,onStart,window:host=window}){
 const release=e=>input.up(e);
 const clear=()=>{const id=input.id;input.clear();if(id!==null&&canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);};
 canvas.addEventListener('pointerdown',e=>{if(!input.down(e,enabled()))return;e.preventDefault();canvas.setPointerCapture(e.pointerId);onStart();});
 canvas.addEventListener('pointermove',e=>{if(e.pointerId!==input.id)return;if(!(e.buttons&1)){clear();return;}input.move(e);});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,release);
 host.addEventListener('pointerup',release);host.addEventListener('pointercancel',release);host.addEventListener('blur',clear);
 return clear;
}

root.KlippeMouse={PARAMETERS,command,MouseInput,arbitrate,bind};if(typeof module!=='undefined')module.exports=root.KlippeMouse;
})(typeof window!=='undefined'?window:globalThis);
