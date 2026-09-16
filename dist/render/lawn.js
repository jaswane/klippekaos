(function(root){
'use strict';
const Stripes=typeof module!=='undefined'?require('./stripes.js'):root.KlippeStripes;
function create(game,P){
 const {circle,rounded,path}=KlippeAssets;
 const layer=()=>{const c=document.createElement('canvas');c.width=P.width;c.height=P.height;return c;};
 const lawn=layer(),grass=layer(),stripeLayer=layer(),cutMask=layer();
 const g=lawn.getContext('2d'),tall=grass.getContext('2d'),stripeInk=stripeLayer.getContext('2d'),maskInk=cutMask.getContext('2d');
 const stripes=new Stripes.DirectionBuffer(P.width,P.height,6);
 let ratio=1,builds=0,seed=14;
 function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
 function lawnPath(c){path(c,game.level);}
 const quality=(scale,dpr)=>Math.min(2,Math.max(1,Math.ceil(scale*dpr*2)/2));
 function gradient(c,light,dark){const fill=c.createLinearGradient(0,0,P.width*.7,P.height);if(!fill?.addColorStop)return light;fill.addColorStop(0,light);fill.addColorStop(1,dark);return fill;}
 function mottles(c){for(let i=0;i<160;i++){const x=random()*P.width,y=random()*P.height;c.fillStyle=i%2?'#c7d58c07':'#143c1c06';c.beginPath();c.ellipse(x,y,12+random()*30,8+random()*18,random()*3,0,Math.PI*2);c.fill();}}
 function paintShort(){
  g.save();lawnPath(g);g.clip();g.fillStyle=gradient(g,'#5d863b','#4e7834');g.fillRect(0,0,P.width,P.height);mottles(g);
  // Short grass keeps its own dense blade texture underneath directional light.
  // Jittered tufts avoid a regular grid; all randomness is consumed only on rebuild.
  const tufts=[[],[],[],[]];
  for(let y=0;y<P.height;y+=3.3)for(let x=0;x<P.width;x+=3.3){const xx=x+(random()-.5)*3.3,yy=y+(random()-.5)*3.3;tufts[Math.floor(random()*4)].push([xx,yy,1.3+random()*1.5,(random()-.3)*1.5]);}
  g.lineCap='round';g.lineWidth=.8;
  for(let k=0;k<4;k++){g.strokeStyle=['#3d672f90','#779b49b0','#638d3fb0','#91ab545c'][k];g.beginPath();for(const [x,y,h,lean] of tufts[k]){g.moveTo(x,y);g.quadraticCurveTo(x+lean*.25,y-h*.6,x+lean,y-h);if(k===1){g.moveTo(x+.7,y);g.lineTo(x+1.5,y-h*.65);}}g.stroke();}g.restore();
 }
 function paintTall(){
  tall.save();lawnPath(tall);tall.clip();tall.fillStyle=gradient(tall,'#477435','#39642d');tall.fillRect(0,0,P.width,P.height);mottles(tall);
  // Stable seeded clumps, batched into four paths, not regenerated per animation frame.
  const blades=[[],[],[],[]];
  for(let y=12;y<P.height;y+=6)for(let x=12;x<P.width;x+=6){const xx=x+(random()-.5)*5,yy=y+(random()-.5)*5;
   const shade=Math.min(3,Math.floor(random()*3+(Math.sin(xx*.027)+Math.cos(yy*.023)+2)*.25));
   blades[shade].push([xx,yy,3.2+random()*4.4,random()]);
  }
  for(let k=0;k<4;k++){tall.strokeStyle=['#3d682e','#507d35','#59853a','#71934470'][k];tall.lineWidth=k===3?.6:.8;tall.lineCap='round';tall.beginPath();
   for(const [x,y,h,bend] of blades[k]){const lean=(bend-.45)*3.6;tall.moveTo(x,y);tall.quadraticCurveTo(x+lean*.3,y-h*.55,x+lean,y-h);tall.moveTo(x+1.1,y-.4);tall.quadraticCurveTo(x+1.2+lean*.6,y-h*.35,x+2+lean,y-h*(.5+bend*.3));}tall.stroke();
  }
  for(const p of game.level.heavy||[]){
   tall.fillStyle='#2f532edb';tall.beginPath();tall.ellipse(p.x,p.y,p.rx,p.ry,0,0,Math.PI*2);tall.fill();
   for(const color of ['#426d32','#547d37','#6a904460']){tall.strokeStyle=color;tall.lineWidth=1.1;tall.beginPath();for(let i=0;i<700;i++){const x=p.x+(random()*2-1)*p.rx,y=p.y+(random()*2-1)*p.ry;if(!Klippe.inPatch(x,y,[p]))continue;const h=6+random()*6;tall.moveTo(x-2,y);tall.quadraticCurveTo(x-4,y-h*.4,x-3,y-h);tall.moveTo(x,y);tall.quadraticCurveTo(x+3,y-h*.7,x+1,y-h*.85);}tall.stroke();}
  }
  // Ordinary tiny flowers stay sparse; protected flower islands retain their explicit palette.
  for(let i=0;i<48;i++){const x=70+random()*760,y=65+random()*450;if(!Klippe.mowable(x,y,game.garden))continue;for(let j=0;j<3;j++)circle(tall,x+Math.cos(j*2.1)*1.6,y+Math.sin(j*2.1)*1.6,1.2,'#dedcaa');circle(tall,x,y,.7,'#cab55a');}
  const wildflowerAt=Klippe.wildflowerAt;
  for(const p of game.level.wildflowers||[]){tall.fillStyle='#527952';tall.beginPath();tall.ellipse(p.x,p.y,p.rx,p.ry,0,0,Math.PI*2);tall.fill();for(let i=0;i<85;i++){const x=p.x+(random()*2-1)*p.rx,y=p.y+(random()*2-1)*p.ry;if(!wildflowerAt(x,y,game.garden))continue;tall.strokeStyle='#a7b778';tall.beginPath();tall.moveTo(x,y+5);tall.lineTo(x,y-2);tall.stroke();for(let j=0;j<5;j++)circle(tall,x+Math.cos(j*1.257)*3,y-2+Math.sin(j*1.257)*3,2,['#ecbdc5','#ebd89a','#c2b5de','#f6efd7'][i%4]);circle(tall,x,y-2,1.3,'#dcad47');}}

  tall.restore();
 }
 function rebuild(){
  builds++;seed=14;
  for(const [canvas,c] of [[lawn,g],[grass,tall]]){canvas.width=Math.round(P.width*ratio);canvas.height=Math.round(P.height*ratio);c.setTransform(ratio,0,0,ratio,0,0);}
  paintShort();paintTall();
  // The stone PNG supplies its own organic edge; retain grass beneath its transparent corners.
  for(const o of game.level.obstacles)for(const c of [g,tall]){c.save();c.globalCompositeOperation='destination-out';if(o.type==='circle')circle(c,o.x,o.y,o.r+P.trim,'#000');c.restore();}
  tall.save();tall.globalCompositeOperation='destination-out';tall.drawImage(cutMask,0,0,P.width,P.height);tall.restore();
 }
 function reset({scale=1,dpr=1}={}){ratio=quality(scale,dpr);stripes.reset();stripeInk.clearRect(0,0,P.width,P.height);maskInk.clearRect(0,0,P.width,P.height);rebuild();}
 // Upgrade only, in half-DPR steps; resizing back never churns world caches.
 function resize(scale,dpr=1){const next=quality(scale,dpr);if(next<=ratio)return false;ratio=next;rebuild();return true;}
 function stroke(c,e,operation){c.save();c.globalCompositeOperation=operation;c.strokeStyle='#fff';c.lineWidth=(e.mowRadius??game.mowRadius??P.deck)*2;c.lineCap='round';c.beginPath();c.moveTo(e.fromX,e.fromY);c.lineTo(e.x,e.y);c.stroke();c.restore();}
 function cut(e){
  if(!e?.moved)return;const radius=e.mowRadius??game.mowRadius??P.deck;
  // The existing continuous cut path is retained, including flower cuts. This mask is visual only.
  stroke(maskInk,e,'source-over');stroke(tall,e,'destination-out');
  if(e.fresh<=0)return;
  for(const cell of stripes.record(e.cells,game.angle,game.nx,P.cell)){
   stripeInk.clearRect(cell.x,cell.y,P.cell,P.cell);stripeInk.fillStyle=Stripes.style(cell.direction);stripeInk.fillRect(cell.x,cell.y,P.cell,P.cell);
  }
  // Small blade-shaped gaps break the perfect round visual edge. Persist them in
  // the visual cut mask so resize reproduces them; Game.mask is never touched.
  for(const side of [-1,1]){const x=e.x-Math.sin(game.angle)*radius*side,y=e.y+Math.cos(game.angle)*radius*side;
   const hash=((Math.floor(x)*73856093)^(Math.floor(y)*19349663))>>>0;if(hash%4!==0)continue;
   for(const [c,operation] of [[maskInk,'source-over'],[tall,'destination-out']]){c.save();c.globalCompositeOperation=operation;c.strokeStyle='#fff';c.lineWidth=.8;c.lineCap='round';c.beginPath();c.moveTo(x,y+.5);c.lineTo(x+((hash%7)-3)*.2,y-1.2-(hash%5)*.18);c.stroke();c.restore();}
  }
  // Sparse short tips on remaining grass only: never refill a cut area or soften Game.mask.
  tall.save();tall.globalCompositeOperation='source-atop';tall.lineWidth=.6;tall.strokeStyle='#7c9a4d';tall.beginPath();
  for(const side of [-1,1]){const x=e.x-Math.sin(game.angle)*(radius+1)*side,y=e.y+Math.cos(game.angle)*(radius+1)*side;if((Math.floor(x*2)+Math.floor(y*2))%5!==0)continue;tall.moveTo(x,y);tall.lineTo(x-.7,y-1.8);}tall.stroke();tall.restore();
 }
 function draw(ctx){lawnPath(ctx);ctx.strokeStyle='#e1dfc2';ctx.lineJoin='round';ctx.lineWidth=7;ctx.stroke();
  for(const o of game.level.obstacles){if(o.type==='circle')circle(ctx,o.x,o.y,o.r+P.trim,'#bba782');}
  ctx.drawImage(lawn,0,0,P.width,P.height);ctx.drawImage(stripeLayer,0,0);ctx.drawImage(grass,0,0,P.width,P.height);ctx.strokeStyle='#34562a35';ctx.lineWidth=5;lawnPath(ctx);ctx.stroke();
 }
 function diagnostics(){return {ratio,builds,cachePixels:lawn.width*lawn.height+grass.width*grass.height+P.width*P.height*2,directionBytes:stripes.directions.byteLength};}
 return {reset,cut,draw,resize,stripes,diagnostics};
}
root.KlippeLawn={create};if(typeof module!=='undefined')module.exports=root.KlippeLawn;
})(typeof window!=='undefined'?window:globalThis);
