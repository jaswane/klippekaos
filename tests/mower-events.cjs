'use strict';
const assert=require('node:assert/strict'),K=require('../dist/core.js'),M=require('../dist/render/mower.js');let count=0;
const test=(name,fn)=>{fn();count++;console.log('PASS '+name);},near=(a,b,e=1e-8)=>assert(Math.abs(a-b)<e,a+' != '+b);
function run(g,seconds,input={}){const events=[];for(let i=0;i<Math.round(seconds*120);i++){const e=g.step(1/120,input);if(e)events.push(...e.events);}return events;}
function cross(g,n){g.x=n.x-g.mowRadius-1;g.y=n.y;g.angle=0;g.speed=K.P.maxSpeed*g.mower.speedMultiplier;return run(g,.04,{forward:true});}
const expected=[[1,1,1],[1.04,1.03,1],[1.10,1.08,1.02],[1.18,1.18,.98],[1.24,1.26,.96],[1.30,1.32,1.08]];
test('Six explicit profiles preserve the starter and the approved tractor/zero-turn art mapping',()=>{
 assert.equal(Object.keys(K.mowerProfiles).length,6);Object.values(K.mowerProfiles).forEach((p,i)=>{assert.deepEqual([p.speedMultiplier,p.mowWidthMultiplier,p.steeringMultiplier],expected[i]);assert(M.SPRITES[p.id]);});
 const g=new K.Game();assert.equal(g.mower.id,'mower-01-push');assert.equal(g.mowRadius,23);assert.equal(K.P.body,14);assert.equal(K.P.deck,23);assert.throws(()=>g.setMowerProfile('not-a-mower'));
 assert(M.SPRITES['mower-04-ride-tractor'].src.endsWith('mower-05-zero-turn-yellow.png'));assert(M.SPRITES['mower-05-zero-turn'].src.endsWith('mower-04-ride-tractor-yellow.png'));
});
test('Changing profiles preserves round, cells, boosts and position; restart preserves the machine',()=>{
 const g=new K.Game('normal','career1');run(g,.5,{forward:true});const before=JSON.stringify(g),mower=g.mower;g.setMowerProfile('mower-05-zero-turn');assert.equal(g.mower,mower);
 const after=JSON.parse(JSON.stringify(g)),old=JSON.parse(before);delete after.mower;delete old.mower;assert.deepEqual(after,old);
 g.reset();assert.equal(g.mower.id,'mower-05-zero-turn');assert.equal(g.cut,0);near(g.energy.speed,K.P.boostStart);near(g.mowRadius,30.36);
});
test('Forward and reverse speed use their profile multipliers with the original acceleration and drag',()=>{
 for(const p of Object.values(K.mowerProfiles))for(const sign of [1,-1]){
  const g=new K.Game('normal','career1');g.setMowerProfile(p.id);g.x=450;g.y=450;g.angle=0;g.speed=sign*(sign>0?K.P.maxSpeed:K.P.reverseSpeed)*p.speedMultiplier;
  const speed=g.speed;g.step(1/120,{throttle:sign});near(g.speed,speed);g.step(1/120,{});near(Math.abs(g.speed),Math.abs(speed)-K.P.drag/120);
 }
});
test('Steering multipliers affect curvature without changing input smoothing or collision radius',()=>{
 for(const p of Object.values(K.mowerProfiles)){const g=new K.Game('normal','career1');g.setMowerProfile(p.id);g.x=450;g.y=450;g.angle=0;g.steer=.5;g.speed=K.P.maxSpeed*p.speedMultiplier;g.step(1/120,{throttle:1,steering:.5});near(g.angle,g.speed/K.P.wheelbase*Math.tan(.5*K.P.steerAngle)*p.steeringMultiplier/120);near(g.steer,.5);assert.equal(K.P.body,14);}
});
test('Each profile cuts its precise wider disk, without changing the total mowable area',()=>{
 let previous=0;for(const p of Object.values(K.mowerProfiles)){const g=new K.Game('normal','career1'),total=g.total;g.setMowerProfile(p.id);const r=g.mowRadius;near(r,23*p.mowWidthMultiplier);g.mow(450,290);assert(g.cut>previous);previous=g.cut;assert.equal(g.total,total);
  for(let y=250;y<330;y+=2)for(let x=410;x<490;x+=2){const i=(y/2)*g.nx+x/2;assert.equal(g.mask[i]===2,Math.hypot(x+1-450,y+1-290)<=r);}
 }
});
test('Profile speed still receives the existing heavy-grass slowdown',()=>{
 for(const p of Object.values(K.mowerProfiles)){const g=new K.Game('normal','career2');g.setMowerProfile(p.id);g.x=160;g.y=405;g.angle=0;g.speed=K.P.maxSpeed*p.speedMultiplier;run(g,.4,{forward:true});near(g.speed,K.P.maxSpeed*p.speedMultiplier*.75);}
});
test('The widest mower can complete the flower garden without flower damage at unchanged 99.5 percent',()=>{
 const g=new K.Game('normal','career4');g.setMowerProfile('mower-05-zero-turn');for(let y=24;y<=554;y+=4)for(let x=28;x<=872;x+=4)if(K.legal(x,y,g.garden)&&g.level.wildflowers.every(p=>Math.hypot(x-p.x,y-p.y)>p.rx+g.mowRadius))g.mow(x,y);
 assert(g.coverage>=K.P.finish);assert.equal(g.flowerCut,0);assert.equal(K.P.finish,.995);console.log('Wide deck flower-safe coverage '+g.coverage*100+'%');
});
test('Scores and early-completion penalties remain independent of profile identity',()=>{
 const g=new K.Game('normal','career1');g.cut=g.total*.97;g.time=130;g.repeat=500;const score=g.result().score,penalty=g.earlyFinishPenalty();for(const p of Object.values(K.mowerProfiles)){g.setMowerProfile(p.id);assert.equal(g.result().score,score);assert.equal(g.earlyFinishPenalty(),penalty);}
});
test('Seated art grows by 10, 14 and 16 percent while rider offsets and anchors remain source-pixel based',()=>{
 for(const [id,oldScale,factor] of [['mower-03-ride-compact',.066,1.10],['mower-04-ride-tractor',.062,1.14],['mower-05-zero-turn',.062,1.16]]){const s=M.SPRITES[id];near(s.scale,oldScale*factor);near(s.worldScale,s.scale);for(const angle of [0,1.8,Math.PI]){const g={x:250,y:350,angle};assert.deepEqual(M.spritePoint(g,s.anchor,s),{x:250,y:350});const p=M.riderPoint({x:s.riderAnchorX,y:s.riderAnchorY},s);near(p.x,s.anchorX+s.riderOffsetX);near(p.y,s.anchorY+s.riderOffsetY);}}
 near(M.SPRITES['mower-01-push'].scale,.105);
});
test('Every wasp level deterministically places two to four well-separated nests away from edges, flowers and starts',()=>{
 const seen=new Set();for(const garden of ['garden1','garden2','garden3','career5'])for(let seed=0;seed<60;seed++){
  const level=K.levelFor(garden),g={garden,level,mechanics:level.mechanics,eventOptions:{seed:seed*97163}};const nests=K.hiddenWaspNests(g);assert(nests.length>=2&&nests.length<=4);assert.deepEqual(nests,K.hiddenWaspNests(g));seen.add(nests.length);
  for(const n of nests){assert.equal(n.state,'hidden');assert(K.waspSpawnValid(n.x,n.y,g,nests.filter(p=>p!==n)));assert(K.legal(n.x,n.y,garden));assert(K.mowable(n.x,n.y,garden));}
 }
 assert.deepEqual([...seen].sort(),[2,3,4]);for(let i=1;i<5;i++){const g=new K.Game('normal','career'+i);assert.deepEqual(g.waspNests,[]);}
});
test('Elapsed time, stationary contact and driving away from nests never cause random wasps',()=>{
 const g=new K.Game('normal','career5',undefined,{seed:42});run(g,2);g.started=true;run(g,120);assert.equal(g.waspSpawns.length,0);assert(!g.nest.revealed);const n=g.waspNests[0];g.x=n.x;g.y=n.y;run(g,2);assert.equal(g.waspSpawns.length,0);
 g.x=450;g.y=80;g.angle=0;run(g,.3,{forward:true});assert.equal(g.waspSpawns.length,0);assert(!g.spawnWasps([]));
});
test('A real deck crossing reveals its existing nest and gives exactly one warning with a full 0.9 second lead-in',()=>{
 const g=new K.Game('normal','career5',undefined,{seed:42}),n=g.waspNests[0];const events=cross(g,n);assert.equal(events.filter(e=>e==='wasps').length,1);assert.equal(g.waspSpawns.length,1);assert.equal(n.state,'used');assert.equal(g.nest.originX,n.x);assert.equal(g.nest.originY,n.y);
 g.x=n.x;g.y=n.y;g.speed=0;const age=g.nest.age;g.updateWasps(.9-age,[]);assert.equal(g.penalty,0);assert.equal(g.nest.x,n.x);assert.equal(g.nest.y,n.y);const attack=[];g.updateWasps(.001,attack);assert.deepEqual(attack,['sting']);assert.equal(g.penalty,200);
});
test('All six deck widths use the same physical hidden-nest crossing rule',()=>{
 for(const p of Object.values(K.mowerProfiles)){const g=new K.Game('normal','career5',undefined,{seed:42});g.setMowerProfile(p.id);const n=g.waspNests[0];assert(cross(g,n).includes('wasps'));assert.equal(g.waspSpawns.length,1);}
});
test('A nest cannot be reused, no fifth event is possible, and penalty remains capped at 400',()=>{
 const g=new K.Game('normal','career5',undefined,{seed:42});assert.equal(g.waspNests.length,4);for(const n of g.waspNests){cross(g,n);g.speed=0;g.x=n.x;g.y=n.y;run(g,8);}assert.equal(g.waspSpawns.length,4);assert.equal(g.waspStings,4);assert.equal(g.penalty,400);
 for(const n of g.waspNests){cross(g,n);run(g,.1);}run(g,15);assert.equal(g.waspSpawns.length,4);g.waspNests.push({id:4,x:450,y:250,state:'queued'});assert(!g.spawnWasps([]));
 g.reset();assert.equal(g.waspSpawns.length,0);assert.equal(g.waspStings,0);assert.equal(g.penalty,0);assert.equal(g.waspNests.length,4);assert(g.waspNests.every(n=>n.state==='hidden'));
});
test('Touching a second nest during a swarm reserves it once and waits the six-second cooldown',()=>{
 const g=new K.Game('normal','career5',undefined,{seed:42});const [a,b]=g.waspNests;cross(g,a);cross(g,b);assert.equal(b.state,'queued');assert.equal(g.waspSpawns.length,1);g.x=g.nest.x;g.y=g.nest.y;g.speed=0;run(g,1);assert(!g.nest.active);const next=g.nextWaspAt;g.time=next-.001;assert(!g.spawnWasps([]));g.time=next;assert(g.spawnWasps([]));assert.equal(g.nest.id,b.id);assert.equal(g.waspSpawns.length,2);
});
test('A crossed nest waits for the warned cat and the three-second gap without losing its trigger',()=>{
 const g=new K.Game('normal','garden1',undefined,{seed:42,catRoute:'left-right'});g.started=true;g.time=16.5;g.updateCat(0,[]);const n=g.waspNests[0];cross(g,n);assert.equal(n.state,'queued');assert(!g.nest.active);g.x=100;g.y=500;g.speed=0;
 let end=null;for(let i=0;i<15*120;i++){const events=g.step(1/120).events;assert(!(g.nest.active&&g.cat.active));if(events.includes('cat-gone'))end=g.time;if(events.includes('wasps')){assert(end!==null);assert(g.time-end>=3-1e-8);break;}}
 assert.equal(g.waspSpawns.length,1);assert.equal(g.waspSpawns[0].id,n.id);
});
test('Cats repeat with the unchanged first arrival and warning, 13.5 second rests, and one stable variant',()=>{
 const g=new K.Game('normal','career3',undefined,{catRoute:'left-right'});g.started=true;g.x=100;g.y=500;const variant=g.cat.variant,warnings=[],exits=[];
 for(let i=0;i<70*120;i++){const e=g.step(1/120);if(e.events.includes('cat-warning'))warnings.push(g.time);if(e.events.includes('cat-gone'))exits.push(g.time);assert.equal(g.cat.variant,variant);}
 assert(warnings.length>=3&&exits.length>=3);near(warnings[0],16.5,1/120+.00001);for(let i=1;i<warnings.length;i++)near(warnings[i]-exits[i-1],13.5,1/120+.00001);assert(!g.done);
});
test('Lawn strokes use the cut event width even if the profile changes before rendering',()=>{
 const saved=global.document,strokes=[];function context(){const c=new Proxy({createLinearGradient:()=>({addColorStop(){}}),stroke(){strokes.push(c.lineWidth);}},{get:(o,k)=>o[k]??(()=>{})});return c;}
 global.document={createElement:()=>({width:0,height:0,getContext:context})};try{require('../dist/render/assets.js');const L=require('../dist/render/lawn.js'),g=new K.Game('normal','career1');g.setMowerProfile('mower-05-zero-turn');const l=L.create(g,K.P);l.reset();const e=g.step(1/120,{forward:true});g.setMowerProfile('mower-01-push');strokes.length=0;l.cut(e);near(strokes[0],60.72);near(strokes[1],60.72);}finally{global.document=saved;}
});
console.log(count+' PASS');
