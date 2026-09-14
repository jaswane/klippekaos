(function(root){
'use strict';
// Prototype 01 driving values stay unchanged. Boosts are temporary modifiers.
const P={width:900,height:580,lawn:{x:62,y:54,w:776,h:472},drive:{x:12,y:8,w:876,h:564},deck:23,body:14,maxSpeed:112,reverseSpeed:53,acceleration:155,braking:290,drag:195,wheelbase:32,steerAngle:0.62,cell:2,finish:0.995,trim:4,boostCapacity:3,boostStart:2.5,pickupEnergy:1.2,boostSpeed:1.65,boostAcceleration:240,boostTurn:1.85,timeLimit:60,damageWarn:1.8,damageAfter:3.6,damageSpeed:6,damageRadius:12};
const obstacles=[{type:'circle',x:302,y:208,r:27},{type:'rect',x:575,y:344,w:112,h:62}];
const pickupSpots=[{type:'speed',x:160,y:120},{type:'turn',x:510,y:365}];
const nestSpot={x:458,y:190};
const levels={garden1:{id:'garden1',name:'Den lille hagen',polygon:[[62,54],[838,54],[838,526],[62,526]],obstacles,pickups:pickupSpots,timeTarget:240},garden2:{id:'garden2',name:'Testhage 2',polygon:[[62,54],[838,54],[838,300],[490,300],[490,526],[62,526]],obstacles:[obstacles[0],{type:'rect',x:340,y:364,w:112,h:62}],pickups:[pickupSpots[0],{type:'turn',x:420,y:464}],timeTarget:200}};
const starterMower={boostCapacity:P.boostCapacity,boostStart:P.boostStart};
function inPolygon(x,y,points){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
function levelFor(id){return levels[id]||levels.garden1;}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function distance(x,y,o){return o.type==='circle'?Math.hypot(x-o.x,y-o.y)-o.r:Math.hypot(x-clamp(x,o.x,o.x+o.w),y-clamp(y,o.y,o.y+o.h));}
function legal(x,y,garden='garden1'){const l=P.drive;return x>=l.x+P.body&&x<=l.x+l.w-P.body&&y>=l.y+P.body&&y<=l.y+l.h-P.body&&levelFor(garden).obstacles.every(o=>distance(x,y,o)>=P.body);}
function mowable(x,y,garden='garden1'){const level=levelFor(garden);return inPolygon(x,y,level.polygon)&&level.obstacles.every(o=>distance(x,y,o)>P.trim);}
class Game{
 constructor(mode='normal',garden='garden1',mower=starterMower){this.mower={...starterMower,...mower};this.reset(mode,garden);}
 reset(mode=this.mode||'normal',garden=this.garden||'garden1'){
  this.level=levelFor(garden);this.garden=this.level.id;
  this.mode=mode==='timed'?'timed':'normal';this.x=101;this.y=482;this.angle=-Math.PI/2;this.speed=0;this.steer=0;this.time=0;this.started=false;this.done=false;this.reason=null;this.travel=0;this.cut=0;this.repeat=0;this.total=0;
  this.energy={speed:Math.min(this.mower.boostStart,this.mower.boostCapacity),turn:Math.min(this.mower.boostStart,this.mower.boostCapacity)};this.active={speed:false,turn:false};this.pickups=this.level.pickups.map(p=>({...p,taken:false}));this.nest={...nestSpot,revealed:false,active:false,age:0,caught:false};this.penalty=0;this.collisions=0;this.contact=false;this.impactX=this.x;this.impactY=this.y;this.flash=0;this.milestone=0;this.damage=[];this.idleTime=0;this.idleX=this.x;this.idleY=this.y;this.damageWarned=false;this.damageGrace=0;this.recentCells=[];
  this.find={x:210,y:382,revealed:false,collected:false};this.cat={x:-30,y:280,active:false,warned:false,finished:false,stopped:false,side:0};this.safetyStops=0;this.safetyActive=false;
  this.nx=P.width/P.cell;this.ny=P.height/P.cell;this.mask=new Uint8Array(this.nx*this.ny);this.last=new Float32Array(this.mask.length);this.last.fill(-1e6);
  for(let y=0;y<this.ny;y++)for(let x=0;x<this.nx;x++)if(mowable((x+.5)*P.cell,(y+.5)*P.cell,this.garden)){this.mask[y*this.nx+x]=1;this.total++;}
 }
 get coverage(){return this.cut/this.total;}
 get overlap(){return this.cut+this.repeat?this.repeat/(this.cut+this.repeat):0;}
 get remaining(){return Math.max(0,P.timeLimit-this.time);}
 mow(x,y){let fresh=0;const r=P.deck,s=P.cell;
  for(let gy=Math.max(0,Math.floor((y-r)/s));gy<=Math.min(this.ny-1,Math.floor((y+r)/s));gy++)for(let gx=Math.max(0,Math.floor((x-r)/s));gx<=Math.min(this.nx-1,Math.floor((x+r)/s));gx++){
   if(((gx+.5)*s-x)**2+((gy+.5)*s-y)**2>r*r)continue;let i=gy*this.nx+gx;if(!this.mask[i])continue;
   if(this.mask[i]===1){this.mask[i]=2;this.cut++;fresh++;this.recentCells.push(i);}else if(this.travel-this.last[i]>P.deck*2.4){this.repeat++;}this.last[i]=this.travel;
  }return fresh;
 }
 result(){
  const completed=this.coverage>=P.finish,coverage=completed?1:this.coverage;
  const potential=this.mode==='timed'?10000:8500+1500*clamp((this.level.timeTarget-this.time)/(this.level.timeTarget-60),0,1);
  const breakdown={base:Math.round(coverage*potential),overlap:Math.round(this.overlap*1500),collisions:Math.min(250,this.collisions*25),damage:Math.min(300,this.damage.length*60),wasps:this.penalty,safety:Math.min(120,this.safetyStops*40)};
  const score=Math.max(0,breakdown.base-breakdown.overlap-breakdown.collisions-breakdown.damage-breakdown.wasps-breakdown.safety);
  return {mode:this.mode,garden:this.garden,score,rank:score>=9000?'S':score>=7500?'A':score>=5500?'B':score>=3500?'C':'D',time:this.time,coverage,actualCoverage:this.coverage,overlap:this.overlap,collisions:this.collisions,damage:this.damage.length,safetyStops:this.safetyStops,penalty:this.penalty,breakdown,completed};
 }
 updateCat(dt,events){
  const c=this.cat;this.safetyActive=false;if(!this.started||c.finished)return;
  if(this.time>=16.5&&!c.warned){c.warned=true;events.push('cat-warning');}
  if(this.time<18)return;c.active=true;c.x+=180*dt;
  if(!c.side&&Math.abs(c.x-this.x)<125&&Math.abs(this.y-280)<65)c.side=this.y>=280?-1:1;
  const target=280+(c.side&&Math.abs(c.x-this.x)<145?c.side*75:0);c.y+=(target-c.y)*Math.min(1,dt*8);
  if(Math.hypot(c.x-this.x,c.y-this.y)<88){this.safetyActive=true;this.damageGrace=1.2;if(!c.stopped){c.stopped=true;this.safetyStops++;events.push('cat-stop');}}
  if(c.x>930){c.active=false;c.finished=true;events.push('cat-gone');}
 }
 updateDamage(dt,events){
  const onGrass=mowable(this.x,this.y,this.garden);
  if(this.contact||this.safetyActive){this.damageGrace=1.2;}
  this.damageGrace=Math.max(0,this.damageGrace-dt);
  if(!this.started||!onGrass||this.damageGrace>0||Math.abs(this.speed)>=P.damageSpeed||Math.hypot(this.x-this.idleX,this.y-this.idleY)>8){this.idleTime=0;this.idleX=this.x;this.idleY=this.y;this.damageWarned=false;return;}
  if(this.damage.some(p=>Math.hypot(this.x-p.x,this.y-p.y)<P.damageRadius*2))return;
  this.idleTime+=dt;
  if(this.idleTime>=P.damageWarn&&!this.damageWarned){this.damageWarned=true;events.push('damage-warning');}
  if(this.idleTime>=P.damageAfter){this.damage.push({x:this.x,y:this.y});this.idleTime=0;this.damageWarned=false;events.push('damage');}
 }
 step(dt,input={}){
  if(this.done)return null;dt=clamp(dt,0,1/30);if(this.mode==='timed')dt=Math.min(dt,this.remaining);
  let throttle=Number.isFinite(input.throttle)?clamp(input.throttle,-1,1):(input.forward?1:0)-(input.back?1:0);
  let turn=Number.isFinite(input.steering)?clamp(input.steering,-1,1):(input.right?1:0)-(input.left?1:0);
  if(throttle)this.started=true;if(this.started)this.time+=dt;this.flash=Math.max(0,this.flash-dt);const events=[];this.recentCells=[];this.updateCat(dt,events);if(this.safetyActive){this.speed=0;throttle=0;}
  const canBoost=!this.safetyActive&&this.started&&(Math.abs(this.speed)>2||throttle!==0);
  const speedUse=input.speedBoost&&canBoost?Math.min(this.energy.speed,dt):0,turnUse=input.turnBoost&&canBoost?Math.min(this.energy.turn,dt):0;
  this.energy.speed=Math.max(0,this.energy.speed-speedUse);this.energy.turn=Math.max(0,this.energy.turn-turnUse);this.active={speed:speedUse>0,turn:turnUse>0};
  const speedFactor=1+(P.boostSpeed-1)*(dt?speedUse/dt:0),turnFactor=1+(P.boostTurn-1)*(dt?turnUse/dt:0);
  const target=throttle*(throttle>=0?P.maxSpeed:P.reverseSpeed)*speedFactor;
  const rate=throttle?(Math.sign(target)!==Math.sign(this.speed)&&Math.abs(this.speed)>1?P.braking:(speedUse?P.boostAcceleration:P.acceleration)):P.drag;
  this.speed+=clamp(target-this.speed,-rate*dt,rate*dt);this.steer+=(turn-this.steer)*Math.min(1,dt*13);
  let oldx=this.x,oldy=this.y;this.angle+=this.speed/P.wheelbase*Math.tan(this.steer*P.steerAngle)*turnFactor*dt;
  let dx=Math.cos(this.angle)*this.speed*dt,dy=Math.sin(this.angle)*this.speed*dt,contact=!legal(this.x+dx,this.y+dy,this.garden);
  if(!contact){this.x+=dx;this.y+=dy;}else{
   if(!this.contact&&Math.abs(this.speed)>20){this.collisions++;this.impactX=this.x;this.impactY=this.y;this.flash=.22;events.push('collision');}
   if(legal(this.x+dx,this.y,this.garden))this.x+=dx;if(legal(this.x,this.y+dy,this.garden))this.y+=dy;this.speed*=0.65;
  }if(contact)this.contact=true;else if(Math.hypot(this.x-this.impactX,this.y-this.impactY)>8)this.contact=false;
  let dist=Math.hypot(this.x-oldx,this.y-oldy),fresh=0;
  if(dist>.001){let n=Math.ceil(dist/1.5);for(let j=1;j<=n;j++){this.travel+=dist/n;fresh+=this.mow(oldx+(this.x-oldx)*j/n,oldy+(this.y-oldy)*j/n);}}
  for(const p of this.pickups)if(!p.taken&&Math.hypot(this.x-p.x,this.y-p.y)<P.body+12&&this.energy[p.type]<this.mower.boostCapacity-.001){p.taken=true;this.energy[p.type]=Math.min(this.mower.boostCapacity,this.energy[p.type]+P.pickupEnergy);events.push('pickup-'+p.type);}
  const nest=this.nest;
  if(!nest.revealed&&fresh>0&&Math.hypot(this.x-nestSpot.x,this.y-nestSpot.y)<P.deck+6){nest.revealed=true;nest.active=true;events.push('wasps');}
  if(nest.active){nest.age+=dt;let vx=this.x-nest.x,vy=this.y-nest.y,d=Math.hypot(vx,vy);if(nest.age>.9){const step=Math.min(d,82*dt);nest.x+=vx/(d||1)*step;nest.y+=vy/(d||1)*step;if(d<20){nest.caught=true;nest.active=false;this.penalty=200;events.push('sting');}}
   if(nest.age>=4.5&&nest.active){nest.active=false;events.push('escaped');}
  }
  if(!this.find.revealed&&fresh>0&&Math.hypot(this.x-this.find.x,this.y-this.find.y)<P.deck+5){this.find.revealed=true;events.push('find');}
  if(this.find.revealed&&!this.find.collected&&Math.hypot(this.x-this.find.x,this.y-this.find.y)<P.body+12&&(this.energy.speed<this.mower.boostCapacity||this.energy.turn<this.mower.boostCapacity)){for(const k of ['speed','turn'])this.energy[k]=Math.min(this.mower.boostCapacity,this.energy[k]+.6);this.find.collected=true;events.push('find-collected');}
  this.updateDamage(dt,events);
  const mark=Math.floor(this.coverage*4);if(mark>this.milestone&&mark<4){this.milestone=mark;events.push('milestone-'+mark*25);}
  if(this.coverage>=P.finish||(this.started&&this.mode==='timed'&&this.remaining<1e-8)){this.done=true;this.reason=this.coverage>=P.finish?'complete':'timeout';if(this.reason==='timeout')this.time=P.timeLimit;this.speed=0;this.active={speed:false,turn:false};}
  return{fromX:oldx,fromY:oldy,x:this.x,y:this.y,moved:dist>.001,fresh,events,cells:this.recentCells};
 }
}
function recordKey(result){return (result.garden||'garden1')+':'+result.mode;}
function recordFlags(book,result){const p=book[recordKey(result)];return {score:!p||result.score>p.score,time:result.completed&&(!p||p.time===null||result.time<p.time),overlap:!p||result.overlap<p.overlap};}
function recordRun(book,result){
 const key=recordKey(result),previous=book[key]||{},runs=Array.isArray(previous.runs)?previous.runs:[];
 const next={score:Math.max(previous.score||0,result.score),time:result.completed?Math.min(Number.isFinite(previous.time)?previous.time:Infinity,result.time):(previous.time??null),overlap:Math.min(Number.isFinite(previous.overlap)?previous.overlap:Infinity,result.overlap),runs:[{...result,date:new Date().toISOString()},...runs].sort((a,b)=>b.score-a.score||b.coverage-a.coverage||a.time-b.time||a.overlap-b.overlap).slice(0,5)};
 return {...book,[key]:next};
}
function padInput(pad){
 if(!pad||pad.mapping!=='standard')return {};const button=i=>pad.buttons[i]?.value||0;
 const axis=Number.isFinite(pad.axes[0])?pad.axes[0]:0,steering=Math.abs(axis)>.16?(axis-Math.sign(axis)*.16)/.84:0;
 return{throttle:Math.max(button(7),button(0))-Math.max(button(6),button(1)),steering:clamp(steering,-1,1),speedBoost:button(5)>.5,turnBoost:button(4)>.5,pause:button(9)>.5};
}
root.Klippe={Game,P,obstacles,legal,distance,mowable,recordRun,recordKey,recordFlags,padInput,nestSpot,levels,inPolygon,starterMower};if(typeof module!=='undefined')module.exports=root.Klippe;
})(typeof window!=='undefined'?window:globalThis);

