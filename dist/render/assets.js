(function(root){
'use strict';
function rounded(c,x,y,w,h,r,fill){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();}
function circle(c,x,y,r,fill){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=fill;c.fill();}
function path(c,level){c.beginPath();level.polygon.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();}
const KIT=Object.freeze(['canopy','bush','trunk','hedge','fence','wall','patio','house','pot','flowerbed','table','chair','lounger','parasol','pool','trampoline','path']);
// Local source art only. Crops exclude transparent padding; originals stay untouched.
const ART=Object.freeze(Object.fromEntries([
 ['tree-round-01',[12,12,1228,1228]],['tree-canopy-02',[25,40,1210,1160]],
 ['bush-round-01',[120,110,1000,1000]],['bush-flowering-02',[60,190,1150,910]],
 ['hedge-segment-01',[50,420,1150,410]],['plant-pot-01',[240,210,780,800]],
 ['garden-chair-01',[250,190,750,850]],['parasol-red-white-01',[40,55,1175,1125]],
 ['flower-bed-stone-01',[40,260,1180,750]]
].map(([id,crop])=>[id,Object.freeze({id,src:'assets/environment/'+id+'.png',width:1254,height:1254,crop:Object.freeze(crop)})])));
const artImages=new Map();let artRevision=0;
function artImage(id){
 const spec=ART[id];if(!spec||typeof root.Image!=='function')return null;
 if(artImages.has(id))return artImages.get(id);
 const entry={image:new root.Image(),ready:false};artImages.set(id,entry);
 entry.image.onload=()=>{entry.ready=entry.image.naturalWidth===spec.width&&entry.image.naturalHeight===spec.height;artRevision++;};
 entry.image.onerror=()=>{entry.ready=false;artRevision++;};entry.image.src=spec.src;return entry;
}
function drawArt(c,d){
 const spec=ART[d.sprite],entry=artImage(d.sprite);if(!entry?.ready)return false;
 const [sx,sy,sw,sh]=spec.crop;
 const blit=(x,y,w,h)=>c.drawImage(entry.image,sx,sy,sw,sh,x-w/2,y-h/2,w,h);
 if(d.asset==='hedge'){
  // Repeat short hedge sections along the boundary, never stretch one long bitmap.
  const vertical=d.h>d.w,length=vertical?d.h:d.w,thickness=vertical?d.w:d.h;
  c.save();if(vertical)c.rotate(Math.PI/2);const count=Math.max(1,Math.ceil(length/(thickness*sw/sh))),segment=length/count;
  c.beginPath();c.rect(-length/2,-thickness/2,length,thickness);c.clip();
  for(let i=0;i<count;i++)blit(-length/2+segment*(i+.5),0,thickness*sw/sh,thickness);c.restore();
 }else{const scale=(d.solidBed?Math.max:Math.min)(d.w/sw,d.h/sh);blit(0,0,sw*scale,sh*scale);}
 return true;
}
function draw(c,d){
 c.save();c.translate(d.x,d.y);c.rotate(d.rotation||0);c.scale((d.mirrorX?-1:1)*(d.scale||1),d.scale||1);
 const w=d.w,h=d.h,[ax,ay]=d.anchor||[.5,.5];c.translate((.5-ax)*w,(.5-ay)*h);
 if(drawArt(c,d)){c.restore();return;}
 if(d.solidBed){c.fillStyle="#897d64";c.beginPath();c.ellipse(0,0,d.w/2,d.h/2,0,0,Math.PI*2);c.fill();c.fillStyle="#51452f";c.beginPath();c.ellipse(0,0,d.w/2-5,d.h/2-5,0,0,Math.PI*2);c.fill();c.restore();return;}
 let seed=97+(d.variant||0)*417;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const line=(x,y,X,Y,color,width=1)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.stroke();};
 const box=(color,inset=0,r=3)=>rounded(c,-w/2+inset,-h/2+inset,w-2*inset,h-2*inset,r,color);
 const shade=()=>rounded(c,-w/2+4,-h/2+5,w,h,5,'#16302438');
 function leaves(x,y,rx,ry,n,palette){
  c.fillStyle=palette[0];c.beginPath();c.ellipse(x+2,y+3,rx,ry,0,0,Math.PI*2);c.fill();
  for(let i=0;i<n;i++){const a=rnd()*Math.PI*2,r=Math.sqrt(rnd()),xx=x+Math.cos(a)*rx*r,yy=y+Math.sin(a)*ry*r,s=2+rnd()*3.5;
   const lit=(xx-x)/rx+(yy-y)/ry;const k=lit<-.4?3:lit>.5?1:2;
   c.fillStyle=palette[k];c.beginPath();c.ellipse(xx,yy,s,s*.64,-.7+rnd()*.8,0,Math.PI*2);c.fill();
  }
 }
 const palettes=[['#355a2e','#406c34','#628b3f','#96ae50'],['#305c40','#40764d','#63935b','#9aba73'],['#485f30','#5c7836','#829b43','#b3be67']];
 const foliage=palettes[(d.variant||0)%3];
 if(d.asset==='patio'){
  shade();box('#897051',0,4);box('#b59b70',2,3);
  for(let x=-w/2+4;x<w/2-4;x+=14){line(x,-h/2+3,x,h/2-3,'#755d413d',1.4);line(x+2,-h/2+3,x+2,h/2-3,'#d9c59a66');for(let y=-h/2+8;y<h/2;y+=45){line(x+3,y,x+10,y,'#80674944',.6);circle(c,x+5,y+4,.6,'#68563d');}}
 }else if(d.asset==='house'){
  shade();box('#e0cc9e');rounded(c,-w/2,-h/2,w,h*.7,3,'#935741');
  for(let y=-h/2+9;y<h*.2;y+=9)line(-w/2+2,y,w/2-2,y,'#b87b55');
  rounded(c,-w*.2,h*.05,w*.4,h*.42,2,'#526b60');line(-w*.22,h*.5,w*.22,h*.5,'#f3e2ba',3);
 }else if(d.asset==='fence'||d.asset==='wall'){
  shade();box(d.asset==='wall'?'#777b68':'#826044');
  for(let x=-w/2+1;x<w/2;x+=d.asset==='wall'?24:12){rounded(c,x,-h/2+1,d.asset==='wall'?22:10,h-2,2,d.asset==='wall'?'#a0a28a':'#b89564');line(x+1,-h/2+2,x+9,-h/2+2,'#dcc79b',1);}
  if(d.asset==='fence')line(-w/2,h*.18,w/2,h*.18,'#7f5c3e',2);
 }else if(d.asset==='path'){
  for(let y=-h/2;y<h/2;y+=23)for(let x=-w/2;x<w/2;x+=27){rounded(c,x+1,y+2,24,20,3,'#626d5640');rounded(c,x,y,23,18,3,'#b0b29a');line(x+2,y+2,x+20,y+2,'#d4d2b8');}
 }else if(d.asset==='trunk'){
  const r=Math.min(w,h)/2;circle(c,2,3,r,'#775b3d');for(let i=0;i<5;i++){const a=i*1.257;line(0,0,Math.cos(a)*r*.85,Math.sin(a)*r*.85,'#a08351',r*.18);}circle(c,-r*.1,-r*.1,r*.55,'#947449');circle(c,-r*.22,-r*.24,r*.28,'#ba9864');
 }else if(d.asset==='hedge'){
  shade();box('#315437',0,Math.min(w,h)*.25);
  for(let y=-h/2+8;y<h/2;y+=15)for(let x=-w/2+8;x<w/2;x+=17)leaves(x,y,11,9,18,foliage);
 }else if(d.asset==='canopy'&&d.style!=='parasol'||d.asset==='bush'){
  c.fillStyle='#18382035';c.beginPath();c.ellipse(5,7,w*.48,h*.45,0,0,Math.PI*2);c.fill();
  const clusters=d.asset==='bush'?4:7;
  for(let i=0;i<clusters;i++){const a=i*2.4,r=i? .24:0;leaves(Math.cos(a)*w*r,Math.sin(a)*h*r,w*(d.asset==='bush'?.28:.27),h*.26,d.asset==='bush'?48:72,foliage);}
 }else if(d.asset==='parasol'||d.asset==='canopy'&&d.style==='parasol'){
  const r=Math.min(w,h)/2;circle(c,4,6,r,'#17372930');
  for(let i=0;i<8;i++){c.beginPath();c.moveTo(0,0);c.arc(0,0,r,i*Math.PI/4,(i+1)*Math.PI/4);c.closePath();c.fillStyle=i%2?'#d1a655':'#f0dfac';c.fill();line(0,0,Math.cos(i*Math.PI/4)*r,Math.sin(i*Math.PI/4)*r,'#816b4540');}circle(c,-1,-1,3,'#faf0cd');
 }else if(d.asset==='pot'){
  shade();box('#80583d',0,5);box('#bf885c',1,5);box('#e3b785',3,4);box('#5d4932',6,3);leaves(0,-1,w*.32,h*.29,24,foliage);
  if(d.flowers)for(let i=0;i<5;i++)circle(c,(rnd()-.5)*w*.55,(rnd()-.5)*h*.55,2.4,i%2?'#e7b0a7':'#eed893');
 }else if(d.asset==='flowerbed'){
  shade();box('#817965',0,8);box('#c3bda0',1,7);box('#594331',6,4);
  for(let x=-w/2+8;x<w/2-6;x+=14){line(x,-h/2+1,x,-h/2+6,'#8b8b77');line(x,h/2-6,x,h/2-1,'#8b8b77');}
  for(let y=-h/2+17;y<h/2-8;y+=20)for(let x=-w/2+16;x<w/2-8;x+=19){circle(c,x+2,y+2,8,'#334f31');for(let j=0;j<5;j++)circle(c,x+Math.cos(j*1.257)*3.2,y+Math.sin(j*1.257)*3.2,3.5,rnd()>.5?'#d89197':'#e6ba66');circle(c,x,y,2,'#fae9ad');}
 }else if(d.asset==='table'){
  shade();box('#785b3c',0,6);box('#bf9c65',2,5);for(let x=-w/2+9;x<w/2-4;x+=9)line(x,-h/2+4,x,h/2-4,'#907048');circle(c,-3,-2,5,'#e9dbc0');circle(c,-3,-2,3,'#6f8b48');
 }else if(d.asset==='chair'||d.asset==='lounger'){
  shade();box('#785e42',0,3);box('#d9c391',2,2);rounded(c,-w/2+4,-h/2+4,w-8,h*.30,2,'#ede0b5');line(-w/2+4,-h/2+h*.37,w/2-4,-h/2+h*.37,'#aa9670',2);
  for(let y=-h/2+h*.47;y<h/2-4;y+=7)line(-w/2+5,y,w/2-5,y,'#bba97e');
 }else if(d.asset==='pool'){
  shade();box('#8c9d91',0,14);box('#ded7b9',2,13);box('#327b85',9,9);box('#66b6b5',12,7);
  c.save();c.beginPath();c.roundRect(-w/2+13,-h/2+13,w-26,h-26,6);c.clip();
  for(let y=-h/2+17;y<h/2-10;y+=11){c.strokeStyle='#c9eece66';c.lineWidth=1.2;c.beginPath();c.moveTo(-w/2+12,y);c.bezierCurveTo(-w*.2,y-5,w*.2,y+6,w/2-12,y);c.stroke();}c.restore();line(w/2-14,-8,w/2+2,-8,'#edf0d8',2);line(w/2-14,5,w/2+2,5,'#edf0d8',2);
 }else if(d.asset==='trampoline'){
  const r=Math.min(w,h)/2;circle(c,4,5,r,'#16372940');circle(c,0,0,r,'#294b62');circle(c,-1,-1,r-3,'#718ca4');circle(c,0,0,r-8,'#303f44');circle(c,-2,-3,r-11,'#3c4b4d');
  for(let i=0;i<16;i++){const a=i*Math.PI/8;line(Math.cos(a)*(r-8),Math.sin(a)*(r-8),Math.cos(a)*(r-3),Math.sin(a)*(r-3),'#b5c5bd',1);}
 }
 c.restore();
}
root.KlippeAssets={rounded,circle,path,draw,KIT,ART,revision:()=>artRevision};if(typeof module!=='undefined')module.exports=root.KlippeAssets;
})(typeof window!=='undefined'?window:globalThis);
