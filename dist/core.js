(function(root){
'use strict';
// Prototype 01 driving values stay unchanged. Boosts are temporary modifiers.
const P={width:900,height:580,lawn:{x:62,y:54,w:776,h:472},drive:{x:12,y:8,w:876,h:564},deck:23,body:14,maxSpeed:112,reverseSpeed:53,acceleration:155,braking:290,drag:195,wheelbase:32,steerAngle:0.62,cell:2,finish:0.995,trim:4,boostCapacity:3,boostStart:2.5,pickupEnergy:1.2,boostSpeed:1.65,boostAcceleration:240,boostTurn:1.85,timeLimit:60,damageWarn:1.8,damageAfter:3.6,damageSpeed:6,damageRadius:12};
const obstacles=[{type:'circle',x:302,y:208,r:27},{type:'rect',x:575,y:344,w:112,h:62}];
const pickupSpots=[{type:'speed',x:160,y:120},{type:'turn',x:510,y:365}];
const eventTuning={catRadius:16,hazardGap:3,waspFirstMin:12,waspFirstMax:18,waspCooldownMin:18,waspCooldownMax:26,waspMinDistance:90,waspMaxDistance:240,waspSeparation:80,waspPenalty:200,waspPenaltyCap:400};
function seededRandom(seed){let state=Number(seed)>>>0;return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};}
function waspSpawnValid(x,y,game){return Number.isFinite(x)&&Number.isFinite(y)&&Math.hypot(x-game.x,y-game.y)>=eventTuning.waspMinDistance&&Math.hypot(x-game.x,y-game.y)<=eventTuning.waspMaxDistance&&game.waspSpawns.every(p=>Math.hypot(x-p.x,y-p.y)>=eventTuning.waspSeparation)&&[0,1,2,3,4,5,6,7].every(i=>{const a=i*Math.PI/4;return legal(x+Math.cos(a)*8,y+Math.sin(a)*8,game.garden)&&mowable(x+Math.cos(a)*8,y+Math.sin(a)*8,game.garden);});}
// Swept relative motion prevents either moving body from tunnelling through the other.
function catContact(ax,ay,bx,by,cx,cy,dx,dy){const x=ax-cx,y=ay-cy,vx=(bx-ax)-(dx-cx),vy=(by-ay)-(dy-cy),t=clamp(-(x*vx+y*vy)/(vx*vx+vy*vy||1),0,1);return Math.hypot(x+vx*t,y+vy*t)<=P.body+eventTuning.catRadius;}
const levels={garden1:{id:'garden1',name:'Den lille hagen',polygon:[[62,54],[838,54],[838,526],[62,526]],obstacles,pickups:pickupSpots,timeTarget:240},garden2:{id:'garden2',name:'Testhage 2',polygon:[[62,54],[838,54],[838,300],[490,300],[490,526],[62,526]],obstacles:[obstacles[0],{type:'rect',x:340,y:364,w:112,h:62}],pickups:[pickupSpots[0],{type:'turn',x:420,y:464}],timeTarget:200}};
// Terrain and event tuning are independent of the original driving parameters.
const terrainTuning={heavySpeedFactor:.75,wildflowerPenalty:180};
levels.garden3={id:'garden3',name:'Testhage 3 · Kurvehagen',
 polygon:Array.from({length:96},(_,i)=>{const a=i/96*Math.PI*2;return [450+350*Math.cos(a)*(1-.13*Math.sin(a)),290+220*Math.sin(a)*(1-.09*Math.cos(2*a))];}),
 obstacles,pickups:[{type:'speed',x:190,y:300},{type:'turn',x:690,y:300}],timeTarget:210,start:{x:165,y:405},
 heavy:[{x:380,y:405,rx:100,ry:56}],wildflowers:[{x:615,y:195,rx:58,ry:40}]};

// Career mechanics are explicit; later stages define their own open garden geometry.
const careerLevels={};
const careerSpecs=[
 ['Den lille hagen','garden1',false,false,false,false,'Klipp plenen · finn styringen'],
 ['L-hagen','garden2',true,false,false,false,'Mørkt gress bremser klipperen litt'],
 ['Kurvehagen','garden3',false,true,false,false,'Pass på katten · treff avslutter runden'],
 ['Blomsterhagen','garden3',false,false,true,false,'La markblomstene stå · de teller ikke som plen'],
 ['Sommerhagen','garden3',false,false,false,true,'Jordveps! Kjør unna når du varsles']
];
careerSpecs.forEach(([name,source,heavy,cat,wildflowers,wasps,intro],i)=>{
 const base=levels[source],id='career'+(i+1);
 careerLevels[id]={...base,id,name,stage:i+1,intro,mechanics:{heavy,cat,wildflowers,wasps,damage:false,find:false,pickups:false},
 heavy:heavy?[{x:220,y:405,rx:95,ry:60}]:[],wildflowers:wildflowers?levels.garden3.wildflowers:[],pickups:[]};
});
Object.assign(careerLevels.career4,{
 polygon:[[150,90],[750,90],[790,130],[790,450],[750,490],[150,490],[110,450],[110,130]],
 obstacles:[{type:'circle',x:215,y:160,r:27},{type:'rect',x:650,y:150,w:112,h:62}],
 wildflowers:[{x:355,y:235,rx:42,ry:42},{x:550,y:355,rx:36,ry:36}],start:{x:160,y:440}
});
Object.assign(careerLevels.career5,{
 polygon:[[62,54],[690,54],[838,140],[838,440],[730,526],[62,526]],
 obstacles:[{type:'circle',x:225,y:175,r:27},{type:'rect',x:675,y:365,w:112,h:62}],start:{x:101,y:482}
});
for(const level of Object.values(levels))level.mechanics={cat:true,wasps:true,heavy:!!level.heavy,wildflowers:!!level.wildflowers,damage:true,find:true,pickups:true};
const catRoutes=[{id:'left-right',from:[-30,280],to:[930,280]}, {id:'right-left',from:[930,280],to:[-30,280]}, {id:'top-bottom',from:[450,-30],to:[450,610]}, {id:'diagonal',from:[-30,70],to:[930,510]}];
function seededRoute(seed=0){let n=Number(seed)>>>0;n=Math.imul(n^(n>>>16),0x45d9f3b);n=Math.imul(n^(n>>>16),0x45d9f3b);return ((n^(n>>>16))>>>0)%catRoutes.length;}
function inPatch(x,y,patches=[]){return patches.some(p=>((x-p.x)/p.rx)**2+((y-p.y)/p.ry)**2<=1);}
function wildflowerAt(x,y,garden){const l=levelFor(garden);return l.mechanics.wildflowers&&inPatch(x,y,l.wildflowers)&&inPolygon(x,y,l.polygon)&&l.obstacles.every(o=>distance(x,y,o)>P.trim);}
const starterMower={boostCapacity:P.boostCapacity,boostStart:P.boostStart,heavyHandling:1};
function inPolygon(x,y,points){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
function levelFor(id){return careerLevels[id]||levels[id]||levels.garden1;}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function distance(x,y,o){return o.type==='circle'?Math.hypot(x-o.x,y-o.y)-o.r:Math.hypot(x-clamp(x,o.x,o.x+o.w),y-clamp(y,o.y,o.y+o.h));}
function legal(x,y,garden='garden1'){const l=P.drive;return x>=l.x+P.body&&x<=l.x+l.w-P.body&&y>=l.y+P.body&&y<=l.y+l.h-P.body&&levelFor(garden).obstacles.every(o=>distance(x,y,o)>=P.body);}
function mowable(x,y,garden='garden1'){const level=levelFor(garden);return !wildflowerAt(x,y,garden)&&inPolygon(x,y,level.polygon)&&level.obstacles.every(o=>distance(x,y,o)>P.trim);}
class Game{
 constructor(mode='normal',garden='garden1',mower=starterMower,events={}){this.eventOptions={...events};this.mower={...starterMower,...mower};this.reset(mode,garden);}
 reset(mode=this.mode||'normal',garden=this.garden||'garden1'){
  this.level=levelFor(garden);this.garden=this.level.id;this.mechanics={...this.level.mechanics};this.hazardUntil=0;this.nextCatAt=18;
  this.mode=mode==='timed'?'timed':'normal';this.x=this.level.start?.x??101;this.y=this.level.start?.y??482;this.angle=-Math.PI/2;this.speed=0;this.steer=0;this.time=0;this.started=false;this.done=false;this.reason=null;this.travel=0;this.cut=0;this.repeat=0;this.total=0;
  this.energy={speed:Math.min(this.mower.boostStart,this.mower.boostCapacity),turn:Math.min(this.mower.boostStart,this.mower.boostCapacity)};this.active={speed:false,turn:false};this.pickups=this.mechanics.pickups?this.level.pickups.map(p=>({...p,taken:false})):[];this.random=seededRandom((this.eventOptions.seed??0)^0x5a17);this.waspSpawns=[];this.waspStings=0;this.nextWaspAt=eventTuning.waspFirstMin+this.random()*(eventTuning.waspFirstMax-eventTuning.waspFirstMin);this.nest={x:0,y:0,originX:0,originY:0,revealed:false,active:false,age:0,caught:false};this.penalty=0;this.collisions=0;this.contact=false;this.impactX=this.x;this.impactY=this.y;this.flash=0;this.milestone=0;this.damage=[];this.idleTime=0;this.idleX=this.x;this.idleY=this.y;this.damageWarned=false;this.damageGrace=0;this.recentCells=[];
  this.find={x:210,y:382,revealed:false,collected:false};this.cat={x:-30,y:280,active:false,warned:false,finished:false,stopped:false,side:0};
  const route=catRoutes.find(r=>r.id===this.eventOptions.catRoute)||catRoutes[seededRoute(this.eventOptions.seed)];
  this.cat={...this.cat,x:route.from[0],y:route.from[1],route,angle:Math.atan2(route.to[1]-route.from[1],route.to[0]-route.from[0])};
  this.heavyCut=0;this.heavyTotal=0;this.heavyLoad=0;this.flowerCut=0;this.flowerTotal=0;this.flowerNoticeAt=-Infinity;
  this.nx=P.width/P.cell;this.ny=P.height/P.cell;this.mask=new Uint8Array(this.nx*this.ny);this.last=new Float32Array(this.mask.length);this.last.fill(-1e6);this.terrain=new Uint8Array(this.mask.length);this.flowers=new Uint8Array(this.mask.length);
  for(let y=0;y<this.ny;y++)for(let x=0;x<this.nx;x++)if(mowable((x+.5)*P.cell,(y+.5)*P.cell,this.garden)){this.mask[y*this.nx+x]=1;this.total++;if(this.mechanics.heavy&&inPatch((x+.5)*P.cell,(y+.5)*P.cell,this.level.heavy)){this.terrain[y*this.nx+x]=1;this.heavyTotal++;}}
  if(this.level.wildflowers)for(let y=0;y<this.ny;y++)for(let x=0;x<this.nx;x++)if(wildflowerAt((x+.5)*P.cell,(y+.5)*P.cell,this.garden)){this.flowers[y*this.nx+x]=1;this.flowerTotal++;}
 }
 get coverage(){return this.cut/this.total;}
 get overlap(){return this.cut+this.repeat?this.repeat/(this.cut+this.repeat):0;}
 get remaining(){return Math.max(0,P.timeLimit-this.time);}
 mow(x,y){let fresh=0;const r=P.deck,s=P.cell;
  for(let gy=Math.max(0,Math.floor((y-r)/s));gy<=Math.min(this.ny-1,Math.floor((y+r)/s));gy++)for(let gx=Math.max(0,Math.floor((x-r)/s));gx<=Math.min(this.nx-1,Math.floor((x+r)/s));gx++){
   if(((gx+.5)*s-x)**2+((gy+.5)*s-y)**2>r*r)continue;let i=gy*this.nx+gx;if(this.flowers[i]===1){this.flowers[i]=2;this.flowerCut++;}if(!this.mask[i])continue;
   if(this.mask[i]===1){this.mask[i]=2;this.cut++;if(this.terrain[i])this.heavyCut++;fresh++;this.recentCells.push(i);}else if(this.travel-this.last[i]>P.deck*2.4){this.repeat++;}this.last[i]=this.travel;
  }return fresh;
 }
 terrainLoad(){
  if(!this.heavyTotal)return 0;let load=0;const a=this.angle+(this.speed<0?Math.PI:0);
  // Sample the incoming strip, not side points already erased by the previous deck pass.
  for(const offset of [-P.deck*.5,0,P.deck*.5]){const x=Math.floor((this.x+Math.cos(a)*(P.deck+P.cell*2)-Math.sin(a)*offset)/P.cell),y=Math.floor((this.y+Math.sin(a)*(P.deck+P.cell*2)+Math.cos(a)*offset)/P.cell),i=y*this.nx+x;if(x>=0&&x<this.nx&&y>=0&&y<this.ny&&this.mask[i]===1&&this.terrain[i])load++;}
  return load/3;
 }
 result(){
  const failed=this.reason==='cat-collision',completed=!failed&&this.coverage>=P.finish,coverage=completed?1:this.coverage;
  const potential=this.mode==='timed'?10000:8500+1500*clamp((this.level.timeTarget-this.time)/(this.level.timeTarget-60),0,1);
  const breakdown={base:Math.round(coverage*potential),overlap:Math.round(this.overlap*1500),collisions:Math.min(250,this.collisions*25),damage:Math.min(300,this.damage.length*60),wasps:this.penalty,flowers:Math.round(terrainTuning.wildflowerPenalty*(this.flowerTotal?this.flowerCut/this.flowerTotal:0))};
  const score=Math.max(0,breakdown.base-breakdown.overlap-breakdown.collisions-breakdown.damage-breakdown.wasps-breakdown.flowers);
  return {mode:this.mode,garden:this.garden,score,rank:score>=9000?'S':score>=7500?'A':score>=5500?'B':score>=3500?'C':'D',time:this.time,coverage,actualCoverage:this.coverage,overlap:this.overlap,collisions:this.collisions,damage:this.damage.length,failed,reason:this.reason,waspStings:this.waspStings,penalty:this.penalty,heavyCut:this.heavyCut,heavyTotal:this.heavyTotal,flowerCut:this.flowerCut,flowerTotal:this.flowerTotal,breakdown,completed};
 }
 updateCat(dt,events){
  const c=this.cat;if(!this.mechanics.cat||!this.started||c.finished)return;
  if(!c.active&&(this.nest.active||this.time<this.hazardUntil)){this.nextCatAt=Math.max(this.nextCatAt,this.time+1.5);return;}
  if(this.time>=this.nextCatAt-1.5&&!c.warned){c.warned=true;events.push('cat-warning');}
  if(this.time<this.nextCatAt)return;c.active=true;
  const r=c.route,length=Math.hypot(r.to[0]-r.from[0],r.to[1]-r.from[1]),ux=(r.to[0]-r.from[0])/length,uy=(r.to[1]-r.from[1])/length;
  c.x+=ux*180*dt;c.y+=uy*180*dt;c.angle=Math.atan2(uy,ux);
  if((c.x-r.from[0])*ux+(c.y-r.from[1])*uy>length){c.active=false;c.finished=true;this.hazardUntil=this.time+eventTuning.hazardGap;events.push('cat-gone');}
 }
 spawnWasps(events){
  if(!this.mechanics.wasps||this.cat.active||(this.cat.warned&&!this.cat.finished)||this.time<this.hazardUntil)return false;
  for(let i=0;i<80;i++){const x=P.drive.x+this.random()*P.drive.w,y=P.drive.y+this.random()*P.drive.h;if(!waspSpawnValid(x,y,this))continue;
   this.nest={x,y,originX:x,originY:y,revealed:true,active:true,age:0,caught:false};this.waspSpawns.push({x,y,time:this.time});events.push('wasps');return true;}
  this.nextWaspAt=this.time+3;return false;
 }
 updateWasps(dt,events){
  if(!this.mechanics.wasps||!this.started)return;
  if(!this.nest.active&&this.time>=this.nextWaspAt)this.spawnWasps(events);
  const n=this.nest;if(!n.active)return;n.age+=dt;
  if(n.age>.9){const vx=this.x-n.x,vy=this.y-n.y,d=Math.hypot(vx,vy),travel=Math.min(d,82*dt);n.x+=vx/(d||1)*travel;n.y+=vy/(d||1)*travel;if(Math.hypot(this.x-n.x,this.y-n.y)<20){n.caught=true;n.active=false;this.waspStings++;this.penalty=Math.min(eventTuning.waspPenaltyCap,this.penalty+eventTuning.waspPenalty);events.push('sting');}}
  if(n.age>=4.5&&n.active){n.active=false;events.push('escaped');}
  if(!n.active){this.hazardUntil=this.time+eventTuning.hazardGap;this.nextWaspAt=this.time+eventTuning.waspCooldownMin+this.random()*(eventTuning.waspCooldownMax-eventTuning.waspCooldownMin);}
 }
 updateDamage(dt,events){
  if(!this.mechanics.damage)return;
  const onGrass=mowable(this.x,this.y,this.garden);
  if(this.contact){this.damageGrace=1.2;}
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
  if(throttle)this.started=true;if(this.started)this.time+=dt;this.flash=Math.max(0,this.flash-dt);const events=[];this.recentCells=[];const catBefore={x:this.cat.x,y:this.cat.y,active:this.cat.active};this.updateCat(dt,events);
  const canBoost=this.started&&(Math.abs(this.speed)>2||throttle!==0);
  const speedUse=input.speedBoost&&canBoost?Math.min(this.energy.speed,dt):0,turnUse=input.turnBoost&&canBoost?Math.min(this.energy.turn,dt):0;
  this.energy.speed=Math.max(0,this.energy.speed-speedUse);this.energy.turn=Math.max(0,this.energy.turn-turnUse);this.active={speed:speedUse>0,turn:turnUse>0};
  const speedFactor=1+(P.boostSpeed-1)*(dt?speedUse/dt:0),turnFactor=1+(P.boostTurn-1)*(dt?turnUse/dt:0);
  this.heavyLoad=(throttle!==0||Math.abs(this.speed)>2)?this.terrainLoad():0;
  const terrainFactor=1-(1-terrainTuning.heavySpeedFactor)*this.heavyLoad/clamp(this.mower.heavyHandling,.5,10);
  const target=throttle*(throttle>=0?P.maxSpeed:P.reverseSpeed)*speedFactor*terrainFactor;
  const rate=throttle?(Math.sign(target)!==Math.sign(this.speed)&&Math.abs(this.speed)>1?P.braking:(speedUse?P.boostAcceleration:P.acceleration)):P.drag;
  this.speed+=clamp(target-this.speed,-rate*dt,rate*dt);this.steer+=(turn-this.steer)*Math.min(1,dt*13);
  let oldx=this.x,oldy=this.y;this.angle+=this.speed/P.wheelbase*Math.tan(this.steer*P.steerAngle)*turnFactor*dt;
  let dx=Math.cos(this.angle)*this.speed*dt,dy=Math.sin(this.angle)*this.speed*dt,contact=!legal(this.x+dx,this.y+dy,this.garden);
  if(!contact){this.x+=dx;this.y+=dy;}else{
   if(!this.contact&&Math.abs(this.speed)>20){this.collisions++;this.impactX=this.x;this.impactY=this.y;this.flash=.22;events.push('collision');}
   if(legal(this.x+dx,this.y,this.garden))this.x+=dx;if(legal(this.x,this.y+dy,this.garden))this.y+=dy;this.speed*=0.65;
  }if(contact)this.contact=true;else if(Math.hypot(this.x-this.impactX,this.y-this.impactY)>8)this.contact=false;
  if((catBefore.active||this.cat.active)&&catContact(oldx,oldy,this.x,this.y,catBefore.x,catBefore.y,this.cat.x,this.cat.y)){this.done=true;this.reason='cat-collision';this.speed=0;this.active={speed:false,turn:false};this.heavyLoad=0;events.push('cat-collision');return {fromX:oldx,fromY:oldy,x:this.x,y:this.y,moved:false,fresh:0,events,cells:[]};}
  let dist=Math.hypot(this.x-oldx,this.y-oldy),fresh=0,flowersBefore=this.flowerCut;if(dist<=.001)this.heavyLoad=0;
  if(dist>.001){let n=Math.ceil(dist/1.5);for(let j=1;j<=n;j++){this.travel+=dist/n;fresh+=this.mow(oldx+(this.x-oldx)*j/n,oldy+(this.y-oldy)*j/n);}}
  if(this.flowerCut>flowersBefore&&this.time-this.flowerNoticeAt>1.5){events.push('flowers');this.flowerNoticeAt=this.time;}
  for(const p of this.pickups)if(!p.taken&&Math.hypot(this.x-p.x,this.y-p.y)<P.body+12&&this.energy[p.type]<this.mower.boostCapacity-.001){p.taken=true;this.energy[p.type]=Math.min(this.mower.boostCapacity,this.energy[p.type]+P.pickupEnergy);events.push('pickup-'+p.type);}
  this.updateWasps(dt,events);
  if(this.mechanics.find&&!this.find.revealed&&fresh>0&&Math.hypot(this.x-this.find.x,this.y-this.find.y)<P.deck+5){this.find.revealed=true;events.push('find');}
  if(this.mechanics.find&&this.find.revealed&&!this.find.collected&&Math.hypot(this.x-this.find.x,this.y-this.find.y)<P.body+12&&(this.energy.speed<this.mower.boostCapacity||this.energy.turn<this.mower.boostCapacity)){for(const k of ['speed','turn'])this.energy[k]=Math.min(this.mower.boostCapacity,this.energy[k]+.6);this.find.collected=true;events.push('find-collected');}
  this.updateDamage(dt,events);
  const mark=Math.floor(this.coverage*4);if(mark>this.milestone&&mark<4){this.milestone=mark;events.push('milestone-'+mark*25);}
  if(this.coverage>=P.finish||(this.started&&this.mode==='timed'&&this.remaining<1e-8)){this.done=true;this.reason=this.coverage>=P.finish?'complete':'timeout';if(this.reason==='timeout')this.time=P.timeLimit;this.speed=0;this.active={speed:false,turn:false};}
  return{fromX:oldx,fromY:oldy,x:this.x,y:this.y,moved:dist>.001,fresh,events,cells:this.recentCells};
 }
}
function recordKey(result){return (result.garden||'garden1')+':'+result.mode;}
function recordFlags(book,result){if(result.failed)return {score:false,time:false,overlap:false};const p=book[recordKey(result)];return {score:!p||result.score>p.score,time:result.completed&&(!p||p.time===null||result.time<p.time),overlap:!p||result.overlap<p.overlap};}
function recordRun(book,result){
 if(result.failed)return book;
 const key=recordKey(result),previous=book[key]||{},runs=Array.isArray(previous.runs)?previous.runs:[];
 const next={score:Math.max(previous.score||0,result.score),time:result.completed?Math.min(Number.isFinite(previous.time)?previous.time:Infinity,result.time):(previous.time??null),overlap:Math.min(Number.isFinite(previous.overlap)?previous.overlap:Infinity,result.overlap),runs:[{...result,date:new Date().toISOString()},...runs].sort((a,b)=>b.score-a.score||b.coverage-a.coverage||a.time-b.time||a.overlap-b.overlap).slice(0,5)};
 return {...book,[key]:next};
}
function padInput(pad){
 if(!pad||pad.mapping!=='standard')return {};const button=i=>pad.buttons[i]?.value||0;
 const axis=Number.isFinite(pad.axes[0])?pad.axes[0]:0,steering=Math.abs(axis)>.16?(axis-Math.sign(axis)*.16)/.84:0;
 return{throttle:Math.max(button(7),button(0))-Math.max(button(6),button(1)),steering:clamp(steering,-1,1),speedBoost:button(5)>.5,turnBoost:button(4)>.5,pause:button(9)>.5};
}
root.Klippe={Game,P,obstacles,legal,distance,mowable,recordRun,recordKey,recordFlags,padInput,eventTuning,seededRandom,waspSpawnValid,catContact,levels,careerLevels,levelFor,inPolygon,starterMower,terrainTuning,wildflowerAt,inPatch,catRoutes,seededRoute};if(typeof module!=='undefined')module.exports=root.Klippe;
})(typeof window!=='undefined'?window:globalThis);

