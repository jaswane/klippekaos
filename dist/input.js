(function(root){
'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function deviceState({maxTouchPoints=0,coarse=false,hover=false,width=0,height=0,touchSeen=false}={}){
 const touch=touchSeen||coarse||(maxTouchPoints>0&&!hover);
 return {touch,portrait:touch&&!hover&&height>width};
}
// Pointer IDs remain independent: releasing boost must never release the throttle.
class TouchInput{
 constructor(){this.pointers=new Map();}
 down(id,action,x=0,radius=1){
  if(action==='steer'&&[...this.pointers.values()].some(p=>p.action==='steer'))return false;
  this.pointers.set(id,{action,steering:action==='steer'?this.axis(x,radius):0});return true;
 }
 axis(x,radius){const n=clamp(x/Math.max(1,radius),-1,1);return Math.abs(n)<.08?0:(n-Math.sign(n)*.08)/.92;}
 move(id,x,radius){const p=this.pointers.get(id);if(p?.action==='steer')p.steering=this.axis(x,radius);}
 up(id){this.pointers.delete(id);}
 clear(){this.pointers.clear();}
 read(){let forward=0,reverse=0,steering=0,speedBoost=false,turnBoost=false;
  for(const p of this.pointers.values()){if(p.action==='steer')steering=p.steering;if(p.action==='throttle')forward=1;if(p.action==='reverse')reverse=1;if(p.action==='speedBoost')speedBoost=true;if(p.action==='turnBoost')turnBoost=true;}
  return {throttle:forward-reverse,steering,speedBoost,turnBoost};
 }
}
root.KlippeInput={TouchInput,deviceState};if(typeof module!=='undefined')module.exports=root.KlippeInput;
})(typeof window!=='undefined'?window:globalThis);
