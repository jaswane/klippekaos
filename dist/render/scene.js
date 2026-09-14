(function(root){
'use strict';

const DRAW_ORDER=Object.freeze(['world background','cached decor','lawn / cut state','ground obstacles','actors','foreground with proximity transparency','particles','DOM HUD']);
// Conservative visual overlap only: this never affects collision or movement.
function foregroundAlpha(d,game){
 const scale=d.scale||1,[ax,ay]=d.anchor||[.5,.5],angle=d.rotation||0;
 const dx=(.5-ax)*d.w*scale,dy=(.5-ay)*d.h*scale;
 const x=d.x+dx*Math.cos(angle)-dy*Math.sin(angle),y=d.y+dx*Math.sin(angle)+dy*Math.cos(angle),radius=Math.hypot(d.w,d.h)*scale/2;
 const actors=[game,...(game.cat.active?[game.cat]:[]),...(game.nest.active?[game.nest]:[])];
 return Math.min(...actors.map(a=>.35+.65*Math.max(0,Math.min(1,(Math.hypot(a.x-x,a.y-y)-radius-20)/20))));
}
function create(game,P){
 const cache=document.createElement('canvas');
 // A modest world-space cache, including off-world decor; never a full DPR-sized texture.
 const bounds={x:-160,y:-160,w:P.width+320,h:P.height+320};cache.width=bounds.w;cache.height=bounds.h;
 let data;
 function reset(){
  data=KlippeSceneData.forLevel(game.level);const c=cache.getContext('2d');c.clearRect(0,0,cache.width,cache.height);c.save();c.translate(-bounds.x,-bounds.y);
  // Cache decor outside the lawn only; actor silhouettes are always drawn later.
  c.beginPath();c.rect(bounds.x,bounds.y,bounds.w,bounds.h);game.level.polygon.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.clip('evenodd');
  for(const d of data.decor)if(d.layer==='background')KlippeAssets.draw(c,d);
  c.strokeStyle='#334d3638';c.lineWidth=2;c.strokeRect(P.drive.x,P.drive.y,P.drive.w,P.drive.h);c.restore();
 }
 function background(ctx,view){const a=view.screenToWorld(0,0),b=view.screenToWorld(view.width,view.height);ctx.fillStyle=data.ground;ctx.fillRect(a.x,a.y,b.x-a.x,b.y-a.y);ctx.drawImage(cache,bounds.x,bounds.y);}
 function obstacles(ctx){for(const visual of data.obstacleVisuals){const o=game.level.obstacles[visual.colliderIndex];
  if(o.type==='circle'){KlippeAssets.circle(ctx,o.x,o.y,o.r,'#b29b72');KlippeAssets.circle(ctx,o.x,o.y,o.r*.8,'#795b3b');}
  else KlippeAssets.draw(ctx,{...visual,x:o.x+o.w/2,y:o.y+o.h/2,w:o.w,h:o.h});
 }}
 function foreground(ctx){
  const paint=d=>{ctx.save();ctx.globalAlpha=foregroundAlpha(d,game);KlippeAssets.draw(ctx,d);ctx.restore();};
  ctx.save();ctx.beginPath();ctx.rect(bounds.x,bounds.y,bounds.w,bounds.h);game.level.polygon.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.clip('evenodd');
  for(const d of data.decor)if(d.layer==='foreground')paint(d);ctx.restore();
  for(const v of data.obstacleVisuals)if(v.layer==='foreground'){const o=game.level.obstacles[v.colliderIndex];paint({...v,x:o.x,y:o.y,w:o.r*2,h:o.r*2});}
 }
 return {reset,background,obstacles,foreground};
}

root.KlippeScene={DRAW_ORDER,create,foregroundAlpha};if(typeof module!=='undefined')module.exports=root.KlippeScene;
})(typeof window!=='undefined'?window:globalThis);
