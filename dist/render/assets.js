(function(root){
'use strict';
function rounded(c,x,y,w,h,r,fill){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();}
function circle(c,x,y,r,fill){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=fill;c.fill();}

function path(c,level){c.beginPath();level.polygon.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();}
function draw(c,d){
 c.save();c.translate(d.x,d.y);c.rotate(d.rotation||0);c.scale(d.scale||1,d.scale||1);
 const w=d.w,h=d.h,[ax,ay]=d.anchor||[.5,.5];c.translate((.5-ax)*w,(.5-ay)*h);
 if(d.asset==='patio'){
  rounded(c,-w/2,-h/2,w,h,5,'#bba88b');c.strokeStyle='#d0bea0';c.lineWidth=2;
  for(let x=-w/2+12;x<w/2;x+=18){c.beginPath();c.moveTo(x,-h/2+3);c.lineTo(x,h/2-3);c.stroke();}
 }else if(d.asset==='pot'){
  rounded(c,-w/2+3,-h/2+4,w,h,4,'#163d3025');rounded(c,-w/2,-h/2,w,h,4,'#9b7358');rounded(c,-w/2-2,-h/2,w+4,7,2,'#c79571');circle(c,0,-2,w*.4,'#557655');circle(c,-3,-6,w*.23,'#789169');
  if(d.flowers)for(const x of [-5,3]){circle(c,x,-6,3,'#d8af85');circle(c,x,-6,1,'#f0d8a4');}
 }else if(d.asset==='hedge'){
  rounded(c,-w/2+4,-h/2+5,w,h,10,'#19332525');rounded(c,-w/2,-h/2,w,h,10,'#496b48');
  for(let y=-h/2+10;y<h/2;y+=18)for(let x=-w/2+10;x<w/2;x+=18)circle(c,x,y,9,'#65815a');
 }else if(d.asset==='pool'){
  rounded(c,-w/2,-h/2,w,h,12,'#e0d6b7');rounded(c,-w/2+8,-h/2+8,w-16,h-16,9,'#659d9b');c.strokeStyle='#b3d2bc';c.lineWidth=2;
  for(let y=-h/2+20;y<h/2-12;y+=15){c.beginPath();c.moveTo(-w/2+19,y);c.quadraticCurveTo(0,y-6,w/2-19,y);c.stroke();}
 }else if(d.asset==='canopy'){
  const r=Math.min(w,h)/2;circle(c,5,6,r,'#19332528');
  if(d.style==='parasol'){for(let i=0;i<8;i++){c.beginPath();c.moveTo(0,0);c.arc(0,0,r,i*Math.PI/4,(i+1)*Math.PI/4);c.closePath();c.fillStyle=i%2?'#d5b880':'#eee0b8';c.fill();}circle(c,0,0,3,'#8b7759');}
  else{circle(c,0,0,r,'#356b39');circle(c,-r*.33,-r*.26,r*.52,'#488443');circle(c,r*.33,-r*.18,r*.48,'#518d46');circle(c,0,-r*.52,r*.44,'#639b4c');circle(c,-r*.1,r*.26,r*.44,'#3b793e');}
 }else if(d.asset==='flowerbed'){
  rounded(c,-w/2+4,-h/2+6,w,h,10,'#243a2940');rounded(c,-w/2,-h/2,w,h,8,'#c9b390');rounded(c,-w/2+5,-h/2+5,w-10,h-10,5,'#795a40');
  for(let i=0;i<12;i++){const x=-w/2+17+(i%6)*16,y=-h/2+18+Math.floor(i/6)*26;circle(c,x-3,y+2,7,'#557744');for(let a=0;a<5;a++)circle(c,x+Math.cos(a*1.257)*4,y+Math.sin(a*1.257)*4,3.6,i%3?'#f4c766':'#e8a1a6');circle(c,x,y,2.6,'#fff0c1');}
 }
 c.restore();
}

root.KlippeAssets={rounded,circle,path,draw};if(typeof module!=='undefined')module.exports=root.KlippeAssets;
})(typeof window!=='undefined'?window:globalThis);
