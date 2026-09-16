(function(root){
'use strict';
// Transparent sprite contract: 48x48 world units, center anchor, front +X. Never a collider.
const BOUNDS=Object.freeze({x:-24,y:-24,w:48,h:48});
// Per-sprite source-pixel metadata; all coordinates below are visual only.
// Offsets/anchors are source pixels; scale converts them to world units, never hitboxes.
function definition(id,name,kind,file,anchorX,anchorY,scale,extra={}){
 const sprite='assets/mowers/'+file+'.png';
 return Object.freeze({id,name,class:kind,sprite,src:sprite,width:1254,height:1254,anchorX,anchorY,anchor:Object.freeze({x:anchorX,y:anchorY}),scale,worldScale:scale,angleOffset:-Math.PI/2,
  fadeSamples:Object.freeze([{x:anchorX,y:anchorY},...(kind==='push'?[{x:625,y:575},{x:625,y:260},{x:625,y:130}]:[])].map(Object.freeze)),...extra});
}
const SPRITES=Object.freeze({
 'mower-01-push':definition('mower-01-push','Skyveklipper','push','mower-01-push',625,890,.105,{tier:1,walk:true}),
 'mower-01-push-yellow':definition('mower-01-push-yellow','Gul skyveklipper','push','mower-01-push-yellow',627,930,.1,{walk:true}),
 'mower-02-push-premium':definition('mower-02-push-premium','Premium skyveklipper','push','mower-02-push-premium-yellow',627,950,.09,{walk:true,walkOffsetY:-18}),
 'mower-03-ride-compact':definition('mower-03-ride-compact','Kompakt sitteklipper','ride-on','mower-03-ride-compact-yellow',625,725,.0726,{riderSprite:'assets/riders/rider-03-ride-compact.png',riderAnchorX:625,riderAnchorY:640,riderScale:.62,riderOffsetX:0,riderOffsetY:-195,riderAngleOffset:0,riderLowerBody:Object.freeze({fromY:700,scaleY:.46}),controls:'wheel',controlWindow:Object.freeze([625,535,108,75]),handWindows:Object.freeze([[435,584,112,108],[703,584,112,108]].map(Object.freeze))}),
 // User-approved visual mapping: file 05 depicts a steering wheel/tractor, despite its name.
 'mower-04-ride-tractor':definition('mower-04-ride-tractor','Hagetraktor','ride-tractor','mower-05-zero-turn-yellow',625,700,.07068,{riderSprite:'assets/riders/rider-04-ride-tractor.png',riderAnchorX:625,riderAnchorY:650,riderScale:.59,riderOffsetX:0,riderOffsetY:-255,riderAngleOffset:0,riderLowerBody:Object.freeze({fromY:740,scaleY:.42}),controls:'wheel',controlWindow:Object.freeze([625,443,116,68]),handWindows:Object.freeze([[399,592,132,132],[710,592,132,132]].map(Object.freeze))}),
 // File 04 depicts zero-turn levers; retain the supplied filename and use the lever-grip rider.
 'mower-05-zero-turn':definition('mower-05-zero-turn','Zero-turn','zero-turn','mower-04-ride-tractor-yellow',625,750,.07192,{riderSprite:'assets/riders/rider-05-zero-turn.png',riderAnchorX:625,riderAnchorY:655,riderScale:.56,riderOffsetX:0,riderOffsetY:-270,riderAngleOffset:0,riderLowerBody:Object.freeze({fromY:700,scaleY:.65}),controls:'levers'})
});
const appearances=new WeakMap();
function setAppearance(mower,id){if(!SPRITES[id])throw new Error('Unknown mower art: '+id);appearances.set(mower,id);imageFor(id);}
function appearance(mower){return SPRITES[appearances.get(mower)||ACTIVE];}


function walkFrame(mower,reduced=false){return reduced||mower.done||Math.abs(mower.speed||0)<3?0:1+(Math.floor((mower.travel||0)/18)%2);}
// A blocked or paused mower returns to idle even while its physics speed is nonzero.
const motion=new WeakMap();
function animationFrame(mower,now,reduced=false){
 let state=motion.get(mower);
 if(!state||state.travel!==mower.travel){state={travel:mower.travel,movedAt:now};motion.set(mower,state);}
 return now-state.movedAt>120?0:walkFrame(mower,reduced);
}
function makeWalkFrames(image,spec){
 if(!root.document?.createElement)return null;
 return [0,1,2].map(frame=>{
  const tile=root.document.createElement('canvas'),ratio=.25;tile.width=Math.ceil(spec.width*ratio);tile.height=Math.ceil(spec.height*ratio);
  const c=tile.getContext('2d');if(!c)return image;c.scale(tile.width/spec.width,tile.height/spec.height);
  // Only the lower body changes; the handle is restored over the legs.
  const legY=spec.walkOffsetY||0;
  c.save();c.beginPath();c.rect(0,0,spec.width,spec.height);c.rect(548,340+legY,174,230);c.clip('evenodd');c.drawImage(image,0,0);c.restore();c.save();c.translate(0,legY);
  for(const [i,x] of [[0,584],[1,661]]){
   const step=frame===0?0:(frame===1?1:-1)*(i===0?1:-1)*24,y=385+step;
   c.fillStyle='#17201e44';c.beginPath();c.roundRect(x-27,y+30,57,92,24);c.fill();
   const trouser=c.createLinearGradient(x-25,0,x+25,0);trouser.addColorStop(0,'#403a2e');trouser.addColorStop(.5,'#75674f');trouser.addColorStop(1,'#4b4437');
   c.fillStyle=trouser;c.beginPath();c.roundRect(x-24,338,48,y+52-338,18);c.fill();
   c.fillStyle='#242725';c.beginPath();c.roundRect(x-27,y+37,54,72,20);c.fill();
   c.fillStyle='#514b40';c.beginPath();c.roundRect(x-23,y+37,46,64,18);c.fill();
   c.strokeStyle='#998775';c.lineWidth=4;c.beginPath();c.moveTo(x-10,y+54);c.lineTo(x+10,y+54);c.moveTo(x-9,y+65);c.lineTo(x+9,y+65);c.stroke();
  }
  c.restore();c.drawImage(image,548,398+legY,174,45,548,398+legY,174,45);return tile;
 });
}

const ACTIVE='mower-01-push',images=new Map();
function loadImage(src,onReady){
 if(typeof root.Image!=='function')return null;
 const entry={image:new root.Image(),ready:false};
 entry.image.onload=()=>{entry.ready=entry.image.naturalWidth===1254&&entry.image.naturalHeight===1254;if(entry.ready)onReady?.(entry);};
 entry.image.onerror=()=>{entry.ready=false;};entry.image.src=src;return entry;
}
function imageFor(id=ACTIVE){
 if(images.has(id))return images.get(id);
 const spec=SPRITES[id];if(!spec||typeof root.Image!=='function')return null;
 const entry=loadImage(spec.src,e=>{if(spec.walk)e.frames=makeWalkFrames(e.image,spec);});
 images.set(id,entry);if(spec.riderSprite)entry.rider=loadImage(spec.riderSprite);return entry;
}
function spritePoint(mower,p,spec=SPRITES[ACTIVE]){const a=mower.angle+spec.angleOffset,x=(p.x-spec.anchor.x)*spec.scale,y=(p.y-spec.anchor.y)*spec.scale;return {x:mower.x+x*Math.cos(a)-y*Math.sin(a),y:mower.y+x*Math.sin(a)+y*Math.cos(a)};}
// Foreshorten only the seated lower body; shoulders, hands and control pivot stay fixed.
function riderY(y,spec){const lower=spec.riderLowerBody;return lower&&y>lower.fromY?lower.fromY+(y-lower.fromY)*lower.scaleY:y;}
function riderPoint(p,spec){const a=spec.riderAngleOffset||0,x=(p.x-spec.riderAnchorX)*spec.riderScale,y=(riderY(p.y,spec)-spec.riderAnchorY)*spec.riderScale;return {x:spec.anchorX+spec.riderOffsetX+x*Math.cos(a)-y*Math.sin(a),y:spec.anchorY+spec.riderOffsetY+x*Math.sin(a)+y*Math.cos(a)};}
function foregroundPoints(mower){
 const spec=appearance(mower),entry=imageFor(spec.id);if(!entry?.ready)return [];
 const samples=[...spec.fadeSamples];if(entry.rider?.ready)for(const p of [{x:625,y:140},{x:390,y:410},{x:860,y:410},{x:625,y:650},{x:625,y:1060}])samples.push(riderPoint(p,spec));
 return samples.map(p=>spritePoint(mower,p,spec));
}
// Sub-world-unit motion around the hand/control pivot; never move the mower or its anchor.
function riderPose(mower,{moving=true,reduced=false}={}){
 if(!moving||reduced||mower.done||Math.abs(mower.speed||0)<3)return {x:0,y:0,angle:0};
 const intensity=Math.min(1,Math.abs(mower.speed)/50),steer=Math.max(-1,Math.min(1,mower.steer||0))*intensity;
 return {x:-steer*.25,y:Math.sin((mower.travel||0)*Math.PI/12)*.18*intensity,angle:-steer*.015};
}
function drawRider(ctx,mower,image,spec,pose,crop=null){
 ctx.save();ctx.translate(mower.x,mower.y);ctx.rotate(mower.angle+spec.angleOffset);
 ctx.translate(spec.riderOffsetX*spec.scale+pose.x,spec.riderOffsetY*spec.scale+pose.y);ctx.rotate((spec.riderAngleOffset||0)+pose.angle);
 const scale=spec.scale*spec.riderScale;
 if(crop){const [x,y,w,h]=crop;ctx.drawImage(image,x,y,w,h,(x-spec.riderAnchorX)*scale,(y-spec.riderAnchorY)*scale,w*scale,h*scale);}
 else if(spec.riderLowerBody){
  const y=spec.riderLowerBody.fromY,lowerHeight=(spec.height-y)*spec.riderLowerBody.scaleY;
  // Two adjoining source slices share the same pose. No new raster assets or hard leg cutoff.
  ctx.drawImage(image,0,0,spec.width,y,-spec.riderAnchorX*scale,-spec.riderAnchorY*scale,spec.width*scale,y*scale);
  ctx.drawImage(image,0,y,spec.width,spec.height-y,-spec.riderAnchorX*scale,(y-spec.riderAnchorY)*scale,spec.width*scale,lowerHeight*scale);
 }else ctx.drawImage(image,-spec.riderAnchorX*scale,-spec.riderAnchorY*scale,spec.width*scale,spec.height*scale);ctx.restore();
}
function drawSprite(ctx,mower,image,spec){ctx.save();ctx.translate(mower.x,mower.y);ctx.rotate(mower.angle+spec.angleOffset);ctx.drawImage(image,-spec.anchor.x*spec.scale,-spec.anchor.y*spec.scale,spec.width*spec.scale,spec.height*spec.scale);ctx.restore();}
imageFor();
function draw(ctx,mower,{last=0,settings={reduced:false},cutLevel=0,sprite=null}={}){
 const {rounded,circle}=KlippeAssets,a=mower.angle;
 const spec=appearance(mower),entry=!sprite&&imageFor(spec.id);
 // The PNG already contains contact shading. Do not add the fallback shadow beneath it.
 if(entry?.ready){
  const frame=animationFrame(mower,last,settings.reduced);
  drawSprite(ctx,mower,entry.frames?.[frame]||entry.image,spec);
  if(entry.rider?.ready){
   const pose=riderPose(mower,{moving:frame!==0,reduced:settings.reduced});drawRider(ctx,mower,entry.rider.image,spec,pose);
   // The wheel sits in front of the rider's lap; restore it from the same unmodified PNG,
   // then keep both hands above the rim. Zero-turn handles already meet their overlay.
   if(spec.controlWindow){
    const [x,y,rx,ry]=spec.controlWindow;ctx.save();ctx.translate(mower.x,mower.y);ctx.rotate(mower.angle+spec.angleOffset);ctx.scale(spec.scale,spec.scale);ctx.translate(-spec.anchorX,-spec.anchorY);
    ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.clip();ctx.drawImage(entry.image,0,0);ctx.restore();
    for(const crop of spec.handWindows)drawRider(ctx,mower,entry.rider.image,spec,pose,crop);
   }
  }
  return;
 }
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
root.KlippeMower={BOUNDS,SPRITES,ACTIVE,setAppearance,appearance,riderPose,riderY,riderPoint,drawRider,walkFrame,animationFrame,makeWalkFrames,spritePoint,foregroundPoints,drawSprite,draw};if(typeof module!=='undefined')module.exports=root.KlippeMower;
})(typeof window!=='undefined'?window:globalThis);
