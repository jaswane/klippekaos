(function(root){
'use strict';

function create(game,P){
 const {inPatch,wildflowerAt}=Klippe,{circle,rounded,path}=KlippeAssets;
 const lawn=document.createElement('canvas');lawn.width=900;lawn.height=580;const g=lawn.getContext('2d'),grass=document.createElement('canvas');grass.width=900;grass.height=580;const tall=grass.getContext('2d');
let seed=14;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}

 function lawnPath(c){path(c,game.level);}
 function initGrass(){

 const obstacles=game.level.obstacles;
 seed=14;g.clearRect(0,0,900,580);tall.clearRect(0,0,900,580);const l=P.lawn;
 g.save();lawnPath(g);g.clip();g.fillStyle='#acd675';g.fillRect(l.x,l.y,l.w,l.h);
 for(let i=0;i<12000;i++){let x=l.x+random()*l.w,y=l.y+random()*l.h;g.fillStyle=i%3?'#a2cc69':'#bcdf8b';g.fillRect(x,y,1+random()*2,1);}
 g.restore();tall.save();lawnPath(tall);tall.clip();tall.fillStyle='#478438';tall.fillRect(l.x,l.y,l.w,l.h);
 tall.save();tall.beginPath();tall.rect(l.x,l.y,l.w,l.h);tall.clip();
 for(let i=0;i<14000;i++){let x=l.x+random()*l.w,y=l.y+random()*l.h;tall.strokeStyle=['#659c43','#58923e','#3c7532','#78a64c'][i%4];tall.lineWidth=1;tall.beginPath();tall.moveTo(x,y);tall.lineTo(x+1.5,y-2.5-random()*3);tall.stroke();}tall.restore();tall.restore();
 // Tall terrain and tiny ordinary flowers share the existing erasing mask.
 tall.save();lawnPath(tall);tall.clip();
 for(const p of game.level.heavy||[]){tall.fillStyle='#315f35';tall.beginPath();tall.ellipse(p.x,p.y,p.rx,p.ry,0,0,Math.PI*2);tall.fill();for(let i=0;i<550;i++){const x=p.x+(random()*2-1)*p.rx,y=p.y+(random()*2-1)*p.ry;if(!inPatch(x,y,[p]))continue;tall.strokeStyle=i%2?'#71924f':'#578447';tall.beginPath();tall.moveTo(x,y);tall.lineTo(x-2,y-7);tall.lineTo(x+2,y-4);tall.stroke();}}
 for(let i=0;i<100;i++){const x=70+random()*760,y=65+random()*450;if(!Klippe.mowable(x,y,game.garden))continue;for(let j=0;j<3;j++)circle(tall,x+Math.cos(j*2.1)*2,y+Math.sin(j*2.1)*2,1.5,'#eee8bd');circle(tall,x,y,.9,'#e4ba55');}
 for(const p of game.level.wildflowers||[]){tall.fillStyle='#527952';tall.beginPath();tall.ellipse(p.x,p.y,p.rx,p.ry,0,0,Math.PI*2);tall.fill();for(let i=0;i<85;i++){const x=p.x+(random()*2-1)*p.rx,y=p.y+(random()*2-1)*p.ry;if(!wildflowerAt(x,y,game.garden))continue;tall.strokeStyle='#a7b778';tall.beginPath();tall.moveTo(x,y+5);tall.lineTo(x,y-2);tall.stroke();for(let j=0;j<5;j++)circle(tall,x+Math.cos(j*1.257)*3,y-2+Math.sin(j*1.257)*3,2,['#ecbdc5','#ebd89a','#c2b5de','#f6efd7'][i%4]);circle(tall,x,y-2,1.3,'#dcad47');}}
 tall.restore();
 // Visible soil is excluded by the same four-unit geometry used in the score mask.
 for(const o of obstacles){for(const c of [g,tall]){c.save();c.globalCompositeOperation='destination-out';if(o.type==='circle')circle(c,o.x,o.y,o.r+P.trim,'#000');else rounded(c,o.x-P.trim,o.y-P.trim,o.w+2*P.trim,o.h+2*P.trim,P.trim,'#000');c.restore();}}
}

 function cut(e){
 if(!e||!e.moved)return;
 tall.save();tall.globalCompositeOperation='destination-out';tall.lineWidth=P.deck*2;tall.lineCap='round';tall.beginPath();tall.moveTo(e.fromX,e.fromY);tall.lineTo(e.x,e.y);tall.stroke();tall.restore();
 if(e.fresh>0){
 // Shade each newly cut logical cell once. Repeated frames never darken a patch.
 g.save();g.globalCompositeOperation='source-atop';g.fillStyle=Math.sin(game.angle)<0?'#edfac224':'#466d251a';for(const i of e.cells)g.fillRect((i%game.nx)*P.cell,Math.floor(i/game.nx)*P.cell,P.cell,P.cell);g.restore();
}
}

 function draw(ctx){lawnPath(ctx);ctx.strokeStyle='#e1dfc2';ctx.lineJoin='round';ctx.lineWidth=7;ctx.stroke();
 for(const o of game.level.obstacles){if(o.type==='circle')circle(ctx,o.x,o.y,o.r+P.trim,'#bba782');else rounded(ctx,o.x-P.trim,o.y-P.trim,o.w+P.trim*2,o.h+P.trim*2,P.trim,'#bba782');}
 ctx.drawImage(lawn,0,0);ctx.drawImage(grass,0,0);ctx.strokeStyle='#34562a35';ctx.lineWidth=5;lawnPath(ctx);ctx.stroke();}
 return {reset:initGrass,cut,draw};
}

root.KlippeLawn={create};if(typeof module!=='undefined')module.exports=root.KlippeLawn;
})(typeof window!=='undefined'?window:globalThis);
