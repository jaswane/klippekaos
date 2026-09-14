(function(root){
'use strict';

class System{
 constructor(){this.clear();}
 clear(){this.items=[];this.credit=0;this.seed=713;}
 random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
 emit(event,mower,{reduced=false,mobile=false}={}){
  if(reduced){this.clear();return;}
  if(!event?.moved||event.fresh<=0)return;
  const cap=mobile?32:80,divisor=mobile?19:10;
  this.credit+=event.fresh/divisor*(1+Math.min(1,mower.heavyLoad||0)*.2);
  const count=Math.min(8,Math.floor(this.credit));this.credit-=Math.floor(this.credit);
  if(this.items.length>cap)this.items.length=cap;
  for(let i=0;i<count&&this.items.length<cap;i++){
   const side=this.random()<.8?1:-1,along=(this.random()-.5)*20,across=side*(15+this.random()*5),a=mower.angle;
   const life=.22+this.random()*.24;
   this.items.push({x:event.x+Math.cos(a)*along-Math.sin(a)*across,y:event.y+Math.sin(a)*along+Math.cos(a)*across,
    vx:-Math.sin(a)*side*(14+this.random()*24)-Math.cos(a)*8,vy:Math.cos(a)*side*(14+this.random()*24)-Math.sin(a)*8,
    life,total:life,angle:a+this.random(),length:1.2+this.random()*1.8,tint:Math.floor(this.random()*3)});
  }
 }
 update(dt,reduced=false){if(reduced){this.clear();return;}for(const p of this.items){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.exp(-dt*4);p.vy*=Math.exp(-dt*4);p.life-=dt;}this.items=this.items.filter(p=>p.life>0);}
}
function draw(ctx,items){ctx.save();ctx.lineCap='round';ctx.lineWidth=.85;for(const p of items){ctx.globalAlpha=Math.min(.85,p.life/p.total*2);ctx.strokeStyle=['#8cab5b','#bed07b','#5e803e'][p.tint];ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+Math.cos(p.angle)*p.length,p.y+Math.sin(p.angle)*p.length);ctx.stroke();}ctx.restore();}

root.KlippeClippings={System,draw};if(typeof module!=='undefined')module.exports=root.KlippeClippings;
})(typeof window!=='undefined'?window:globalThis);
