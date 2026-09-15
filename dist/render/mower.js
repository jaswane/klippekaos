(function(root){
'use strict';
// Transparent sprite contract: 48x48 world units, center anchor, front +X. Never a collider.
const BOUNDS=Object.freeze({x:-24,y:-24,w:48,h:48});
// Per-sprite source-pixel metadata; all coordinates below are visual only.
const SPRITES=Object.freeze({'mower-01-push':Object.freeze({id:'mower-01-push',name:'Skyveklipper',tier:1,src:'assets/mowers/mower-01-push.png',width:1254,height:1254,anchor:Object.freeze({x:625,y:890}),scale:.105,angleOffset:-Math.PI/2,fadeSamples:Object.freeze([{x:625,y:890},{x:625,y:575},{x:625,y:260},{x:625,y:130}].map(Object.freeze))})});
const ACTIVE='mower-01-push',images=new Map();
function imageFor(id=ACTIVE){
 if(images.has(id))return images.get(id);
 const spec=SPRITES[id];if(!spec||typeof root.Image!=='function')return null;
 const entry={image:new root.Image(),ready:false};images.set(id,entry);
 entry.image.onload=()=>{entry.ready=entry.image.naturalWidth===spec.width&&entry.image.naturalHeight===spec.height;};
 entry.image.onerror=()=>{entry.ready=false;};entry.image.src=spec.src;return entry;
}
function spritePoint(mower,p,spec=SPRITES[ACTIVE]){const a=mower.angle+spec.angleOffset,x=(p.x-spec.anchor.x)*spec.scale,y=(p.y-spec.anchor.y)*spec.scale;return {x:mower.x+x*Math.cos(a)-y*Math.sin(a),y:mower.y+x*Math.sin(a)+y*Math.cos(a)};}
function foregroundPoints(mower){const entry=imageFor();return entry?.ready?SPRITES[ACTIVE].fadeSamples.map(p=>spritePoint(mower,p)):[];}
function drawSprite(ctx,mower,image,spec){ctx.save();ctx.translate(mower.x,mower.y);ctx.rotate(mower.angle+spec.angleOffset);ctx.drawImage(image,-spec.anchor.x*spec.scale,-spec.anchor.y*spec.scale,spec.width*spec.scale,spec.height*spec.scale);ctx.restore();}
imageFor();
function draw(ctx,mower,{last=0,settings={reduced:false},cutLevel=0,sprite=null}={}){
 const {rounded,circle}=KlippeAssets,a=mower.angle;
 const entry=!sprite&&imageFor();
 // The PNG already contains contact shading. Do not add the fallback shadow beneath it.
 if(entry?.ready){drawSprite(ctx,mower,entry.image,SPRITES[ACTIVE]);return;}
 ctx.save();ctx.translate(mower.x+3,mower.y+4);ctx.rotate(a);rounded(ctx,-22,-21,44,42,9,'#102a2833');rounded(ctx,-19,-18,38,36,7,'#0c241e65');ctx.restore();
 ctx.save();ctx.translate(mower.x,mower.y);ctx.rotate(a);
 if(sprite){ctx.drawImage(sprite,BOUNDS.x,BOUNDS.y,BOUNDS.w,BOUNDS.h);ctx.restore();return;}
 const lx=Math.cos(-Math.PI*.75-a),ly=Math.sin(-Math.PI*.75-a);
 const metal=(light,dark)=>{const g=ctx.createLinearGradient(-lx*22,-ly*22,lx*22,ly*22);if(!g?.addColorStop)return light;g.addColorStop(0,dark);g.addColorStop(1,light);return g;};
 // Exposed broad rubber tires frame a narrower warm body; front is the rounded yellow nose.
 for(const x of [-14,13])for(const y of [-17.5,17.5]){
  rounded(ctx,x-5.5,y-5.3,11,10.6,2.7,'#111e20');rounded(ctx,x-4.6,y-4.2,9.2,8.4,2,metal('#4c5350','#232b2b'));
  ctx.strokeStyle='#161e20';ctx.lineWidth=1;for(const t of [-2.5,0,2.5]){ctx.beginPath();ctx.moveTo(x+t,y-3.5);ctx.lineTo(x+t-.6,y+3.5);ctx.stroke();}rounded(ctx,x-2,y-1.3,4,2.6,.8,'#a1a295');
 }
 rounded(ctx,-19,-16,39,32,8,metal('#b5baa1','#4e6354'));
 rounded(ctx,-18,-14.7,36.5,29.4,7,metal('#ffdc68','#bb741d'));
 // Front hood has a clear raised surface and a dark lower bumper.
 rounded(ctx,4,-13,16,26,7,metal('#ffe18b','#df9e26'));
 rounded(ctx,16.7,-8,3.5,16,1.5,'#485449');rounded(ctx,16.5,-7,1.6,14,.7,'#e1c66c');
 ctx.strokeStyle='#ffe9a6';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(7,-10.5);ctx.lineTo(12,-10.5);ctx.quadraticCurveTo(17,-10.5,17,-5);ctx.stroke();
 // Rear engine cover reads as a machine, never a seated figure.
 const vibration=settings.reduced?0:Math.sin(last*.13)*Math.min(1,cutLevel)*.12;ctx.save();ctx.translate(vibration,0);
 rounded(ctx,-14,-9.8,19,19.6,4,'#926221');rounded(ctx,-13,-9,18,18,3.8,metal('#454f44','#25352f'));
 for(const y of [-5,-2,1,4])rounded(ctx,-9,y,10,1.2,.5,'#111f1d');
 circle(ctx,-9,-5.5,2.1,'#938e6b');circle(ctx,-9,-5.5,.8,'#d5cba6');ctx.restore();
 rounded(ctx,-22,-10,3,20,1.5,'#243831');rounded(ctx,-23,-8,2,16,1,'#718272');
 for(const x of [-15,13])for(const y of [-12,12])circle(ctx,x,y,.8,'#ffebb0');
 if(mower.active?.speed||mower.active?.turn)rounded(ctx,-18,-6,1.5,12,.7,'#fff0a4');
 ctx.restore();
}
root.KlippeMower={BOUNDS,SPRITES,ACTIVE,spritePoint,foregroundPoints,drawSprite,draw};if(typeof module!=='undefined')module.exports=root.KlippeMower;
})(typeof window!=='undefined'?window:globalThis);
