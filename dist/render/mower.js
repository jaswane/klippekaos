(function(root){
'use strict';

// Sprite replacement contract: transparent 48x48 world-unit art, centered at (0,0), front +X.
// Visual bounds never feed Game, collision or mowing geometry.
const BOUNDS=Object.freeze({x:-24,y:-24,w:48,h:48});
function draw(ctx,mower,{last=0,settings={reduced:false},cutLevel=0,sprite=null}={}){
 const {rounded,circle}=KlippeAssets,a=mower.angle;
 // Offset stays in world space so the shadow always falls down/right.
 ctx.save();ctx.translate(mower.x+3,mower.y+4);ctx.rotate(a);rounded(ctx,-22,-21,45,43,11,'#102a2830');rounded(ctx,-19,-18,39,37,9,'#10251d48');ctx.restore();
 ctx.save();ctx.translate(mower.x,mower.y);ctx.rotate(a);
 if(sprite){ctx.drawImage(sprite,BOUNDS.x,BOUNDS.y,BOUNDS.w,BOUNDS.h);ctx.restore();return;}
 const lx=Math.cos(-Math.PI*.75-a),ly=Math.sin(-Math.PI*.75-a);
 function metal(light,dark,extent=22){const g=ctx.createLinearGradient(-lx*extent,-ly*extent,lx*extent,ly*extent);if(!g?.addColorStop)return light;g.addColorStop(0,dark);g.addColorStop(1,light);return g;}
 // Four tires remain visible beyond the deck. Tread is low contrast, without flashing animation.
 for(const x of [-14,13])for(const y of [-18,18]){
  rounded(ctx,x-6,y-4.5,12,9,3,'#192a28');rounded(ctx,x-5,y-3.4,10,6.8,2,metal('#505a4c','#24312b'));
  ctx.strokeStyle='#172925';ctx.lineWidth=.75;for(let t=-3;t<=3;t+=3){ctx.beginPath();ctx.moveTo(x+t,y-3);ctx.lineTo(x+t-1,y+3);ctx.stroke();}
  rounded(ctx,x-2,y-1.7,4,3.4,1,'#87917b');
 }
 // Shaped steel deck, rim and a small side discharge lip.
 rounded(ctx,-17,-21,36,42,10,metal('#d6d7b0','#71816a'));
 rounded(ctx,-15.5,-19.5,33,39,9,metal('#b6c09c','#809073'));
 rounded(ctx,-2,18,13,5,2,'#667560');rounded(ctx,-1,18,11,2,1,'#b9c2a0');
 rounded(ctx,-21,-11,5,22,2,'#263b30');rounded(ctx,-23,-9,3,18,1.5,metal('#73836b','#26372c'));
 // Warm stamped chassis with readable nose and rear crossbar.
 rounded(ctx,-17,-13,36,26,7,metal('#f8d879','#aa701f'));
 rounded(ctx,9,-10.5,11,21,5,metal('#ffe195','#d59b36'));
 ctx.strokeStyle='#ffe8a785';ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(-11,-11);ctx.lineTo(11,-11);ctx.quadraticCurveTo(17,-11,18,-6);ctx.stroke();
 rounded(ctx,17,-6,2.2,12,1,'#8b6b32');for(const y of [-7,5])rounded(ctx,17.5,y,2.3,2.3,.7,'#eee3bb');
 // Engine and ventilated cover; deliberately no driver/person.
 const vibration=settings.reduced?0:Math.sin(last*.13)*Math.min(1,cutLevel)*(.10+(mower.heavyLoad||0)*.08);
 ctx.save();ctx.translate(vibration,0);
 rounded(ctx,-11,-9,21,18,5,'#8b661e');rounded(ctx,-10,-8.5,20,17,4,metal('#536050','#27362e',12));
 circle(ctx,0,0,6.2,metal('#707b66','#34443a',9));circle(ctx,0,0,4.6,'#35473b');
 ctx.strokeStyle='#99a28a';ctx.lineWidth=.7;for(let i=0;i<6;i++){const angle=i*Math.PI/3;ctx.beginPath();ctx.moveTo(Math.cos(angle)*2,Math.sin(angle)*2);ctx.lineTo(Math.cos(angle+.2)*4,Math.sin(angle+.2)*4);ctx.stroke();}
 circle(ctx,0,0,1.4,'#bbc2a4');rounded(ctx,-9,-6,3,12,1,'#233b30');for(const y of [-4,0,4])rounded(ctx,-9,y,2.8,.7,.3,'#87927a');
 circle(ctx,7,-5,1.8,'#d8c99c');circle(ctx,7,-5,.6,'#52634b');ctx.restore();
 for(const x of [-13,14])for(const y of [-10,10])circle(ctx,x,y,.8,'#f6e2a3');
 if(mower.active?.speed||mower.active?.turn)rounded(ctx,-19,-6,1.8,12,.8,'#efda94');
 ctx.restore();
}

root.KlippeMower={BOUNDS,draw};if(typeof module!=='undefined')module.exports=root.KlippeMower;
})(typeof window!=='undefined'?window:globalThis);
