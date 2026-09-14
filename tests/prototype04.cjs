'use strict';
const assert=require('node:assert/strict');
const {Game,P,levels,legal,mowable,wildflowerAt,terrainTuning,catRoutes,recordRun,padInput}=require('../dist/core.js');
const {TouchInput,deviceState}=require('../dist/input.js');
const tests=[];function test(name,f){f();tests.push(name);}
function run(g,t,input={}){for(let i=0;i<Math.round(t*120);i++)g.step(1/120,input);}
// Distance to the continuous ellipse, independent of the game's cell masks.
// Expanding both semiaxes by deck + 3 is NOT an ellipse offset curve:
// it excluded safe mower centers and left 330 / 58480 required cells uncut
// (99.43570451436389%). Use the true nearest boundary point instead.
function ellipseDistance(x,y,p){
 x=Math.abs(x-p.x);y=Math.abs(y-p.y);const a=p.rx*p.rx,b=p.ry*p.ry;
 if(x*x/a+y*y/b<=1)return 0;
 let lo=0,hi=Math.max(p.rx*x,p.ry*y);
 for(let j=0;j<50;j++){const t=(lo+hi)/2;if(a*x*x/(t+a)**2+b*y*y/(t+b)**2>1)lo=t;else hi=t;}
 return Math.hypot(x-a*x/(hi+a),y-b*y/(hi+b));
}
test('Ellipse clearance matches known boundary normals, not inflated semiaxes',()=>{
 const p=levels.garden3.wildflowers[0];assert.equal(ellipseDistance(p.x,p.y,p),0);
 for(const angle of [0,.3,.7,Math.PI/2,2.4,Math.PI,4.1]){
  const x=p.x+p.rx*Math.cos(angle),y=p.y+p.ry*Math.sin(angle),nx=Math.cos(angle)/p.rx,ny=Math.sin(angle)/p.ry,n=Math.hypot(nx,ny);
  for(const gap of [0,1,P.deck,P.deck+3])assert(Math.abs(ellipseDistance(x+nx/n*gap,y+ny/n*gap,p)-gap)<1e-8);
 }
});
test('Exactly three gardens; curved boundary leaves drivable outer corners',()=>{
 assert.equal(Object.keys(levels).length,3);const p=levels.garden3.polygon;assert(p.length>=64);
 assert(mowable(450,300,'garden3'));assert(!mowable(70,65,'garden3'));assert(legal(70,65,'garden3'));assert(!legal(5,290,'garden3'));
 for(const [x,y] of p){const vx=x-450,vy=y-290;assert(!mowable(450+vx*1.03,290+vy*1.03,'garden3'));}
});
test('Organic lawn reaches the unchanged completion threshold without cutting wildflowers',()=>{
 const g=new Game('normal','garden3');assert(legal(g.x,g.y,g.garden));assert(g.total>0&&g.flowerTotal>0&&g.heavyTotal>0);
 for(let y=24;y<=554;y+=4)for(let x=28;x<=872;x+=4){if(!legal(x,y,g.garden))continue;const p=g.level.wildflowers[0];if(ellipseDistance(x,y,p)<=P.deck)continue;g.mow(x,y);}
 assert(g.coverage>=P.finish,`Coverage avoiding flowers: ${g.coverage}`);assert.equal(g.flowerCut,0);assert.equal(g.heavyCut,g.heavyTotal);
 assert.equal(g.total,58480);assert.equal(g.flowerTotal,1823);
 assert.equal(g.cut,g.mask.reduce((n,v)=>n+(v===2),0));
 assert.equal(g.flowers.filter(v=>v===2).length,0);
 console.log('garden3 safe coverage '+g.cut+'/'+g.total+' = '+(g.coverage*100)+'%; flowers '+g.flowerCut+'/'+g.flowerTotal);
 g.step(1/120);assert(g.done);assert.equal(g.result().coverage,1);
});
test('Heavy grass is cut in one moving pass and does not punish stationary contact',()=>{
 const g=new Game('normal','garden3');g.x=300;g.y=405;g.angle=0;g.speed=P.maxSpeed;
 run(g,.3,{forward:true});assert(g.heavyCut>0);assert(g.speed<P.maxSpeed&&g.speed>=P.maxSpeed*terrainTuning.heavySpeedFactor-1);
 const count=g.heavyCut;g.mow(g.x,g.y);const after=g.heavyCut;g.mow(g.x,g.y);assert.equal(g.heavyCut,after);assert(after>=count);assert.equal(g.result().breakdown.flowers,0);
 const still=new Game('normal','garden3');still.x=380;still.y=405;run(still,1);assert.equal(still.heavyCut,0);assert.equal(still.heavyLoad,0);
});
test('Mown heavy grass restores base speed; mower handling is configurable',()=>{
 const g=new Game('normal','garden3');g.x=330;g.y=405;g.angle=0;for(let y=340;y<470;y+=10)for(let x=270;x<500;x+=10)g.mow(x,y);
 run(g,.3,{forward:true});assert.equal(g.heavyLoad,0);assert(Math.abs(g.speed-P.acceleration*.3)<1e-6);
 const a=new Game('normal','garden3'),b=new Game('normal','garden3',{heavyHandling:2});for(const h of [a,b]){h.x=300;h.y=405;h.angle=0;h.speed=P.maxSpeed;run(h,.3,{forward:true});}assert(b.speed>a.speed);
});
test('Wildflowers are soft geometry, excluded from coverage, penalized only by deck contact',()=>{
 const g=new Game('normal','garden3'),p=g.level.wildflowers[0];assert(legal(p.x,p.y,g.garden));assert(wildflowerAt(p.x,p.y,g.garden));assert(!mowable(p.x,p.y,g.garden));
 g.x=p.x;g.y=p.y;run(g,1);assert.equal(g.flowerCut,0);
 g.mow(p.x+p.rx+P.deck+1,p.y);assert.equal(g.flowerCut,0);
 run(g,.1,{forward:true});assert(g.flowerCut>0);assert(g.result().breakdown.flowers>0);
 const n=g.flowerCut;g.mow(g.x,g.y);g.mow(g.x,g.y);assert(g.flowerCut>=n);const fixed=g.flowerCut;g.mow(g.x,g.y);assert.equal(g.flowerCut,fixed);
 for(let y=p.y-p.ry;y<=p.y+p.ry;y+=8)for(let x=p.x-p.rx;x<=p.x+p.rx;x+=8)g.mow(x,y);
 assert.equal(g.flowerCut,g.flowerTotal);assert.equal(g.result().breakdown.flowers,terrainTuning.wildflowerPenalty);
});
test('Score is explained by raw deductions; heavy grass and decorative bees have no score cost',()=>{
 const g=new Game('timed','garden3');g.cut=g.total/2;const before=g.result().score;g.heavyCut=g.heavyTotal;g.ambientBees=[{x:g.x,y:g.y}];assert.equal(g.result().score,before);
 g.flowerCut=g.flowerTotal/2;const r=g.result();assert.equal(r.breakdown.flowers,90);assert.equal(r.score,Math.max(0,r.breakdown.base-Object.entries(r.breakdown).filter(([k])=>k!=='base').reduce((sum,[,v])=>sum+v,0)));
});
test('Every cat route can cross without affecting a mower away from the route',()=>{
 for(const route of catRoutes){const g=new Game('normal','garden1',undefined,{catRoute:route.id});g.started=true;g.time=16;g.x=100;g.y=500;run(g,10);assert(g.cat.finished,route.id);assert(!g.done);assert(Number.isFinite(g.cat.angle));}
});
test('Seeded routes and movement are repeatable; fixed route overrides seed',()=>{
 const seen=new Set();for(let seed=0;seed<30;seed++){const a=new Game('normal','garden3',undefined,{seed}),b=new Game('normal','garden3',undefined,{seed});seen.add(a.cat.route.id);run(a,20,{forward:true});run(b,20,{forward:true});assert.deepEqual(a.cat,b.cat);}
 assert.equal(seen.size,4);const fixed=new Game('normal','garden3',undefined,{seed:22,catRoute:'diagonal'});assert.equal(fixed.cat.route.id,'diagonal');
});
test('Touch supports analog steering, gas, both boosts and independent multi-touch release',()=>{
 const t=new TouchInput();t.down(1,'steer',25,50);t.down(2,'throttle');t.down(3,'speedBoost');t.down(4,'turnBoost');let i=t.read();assert(i.steering>0&&i.steering<1);assert.equal(i.throttle,1);assert(i.speedBoost&&i.turnBoost);
 t.up(3);i=t.read();assert(!i.speedBoost&&i.turnBoost&&i.throttle===1);t.move(1,-100,50);assert.equal(t.read().steering,-1);assert(!t.down(5,'steer',0,50));t.up(2);t.down(6,'reverse');assert.equal(t.read().throttle,-1);t.clear();assert.deepEqual(t.read(),{throttle:0,steering:0,speedBoost:false,turnBoost:false});
});
test('Touch device detection and portrait state use capabilities, never user agent',()=>{
 assert.deepEqual(deviceState({width:390,height:844}),{touch:false,portrait:false});
 assert.deepEqual(deviceState({width:390,height:844,maxTouchPoints:5}),{touch:true,portrait:true});
 assert.deepEqual(deviceState({width:844,height:390,coarse:true}),{touch:true,portrait:false});
 assert(deviceState({width:820,height:1180,maxTouchPoints:5}).portrait);assert(!deviceState({width:1180,height:820,maxTouchPoints:5}).portrait);assert(deviceState({width:844,height:390,touchSeen:true}).touch);
});
test('Mouse-first hybrid desktops wait for actual touch, and never force rotation',()=>{
 assert.deepEqual(deviceState({width:1440,height:900,maxTouchPoints:10,coarse:false,hover:true}),{touch:false,portrait:false});
 assert.deepEqual(deviceState({width:1440,height:900,maxTouchPoints:10,coarse:false,hover:true,touchSeen:true}),{touch:true,portrait:false});
 assert.deepEqual(deviceState({width:800,height:1200,maxTouchPoints:10,coarse:false,hover:true,touchSeen:true}),{touch:true,portrait:false});
 assert.deepEqual(deviceState({width:1180,height:820,maxTouchPoints:5,coarse:true,hover:false}),{touch:true,portrait:false});
});
test('Touch, keyboard and gamepad commands use identical movement and boosts',()=>{
 const t=new TouchInput();t.down(1,'throttle');t.down(2,'steer',50,50);t.down(3,'turnBoost');const pad={mapping:'standard',axes:[1],buttons:Array.from({length:16},()=>({value:0}))};pad.buttons[7].value=1;pad.buttons[4].value=1;
 const a=new Game(),b=new Game(),c=new Game();run(a,.6,t.read());run(b,.6,{forward:true,right:true,turnBoost:true});run(c,.6,padInput(pad));for(const key of ['x','y','angle','speed','cut']){assert.equal(a[key],b[key]);assert.equal(a[key],c[key]);}
});
test('Organic timed round ends at 60, records partial coverage per garden, reset clears terrain',()=>{
 const g=new Game('timed','garden3',undefined,{catRoute:'top-bottom'});run(g,1,{forward:true});run(g,61);assert(g.done);assert.equal(g.time,60);assert(!g.result().completed);const book=recordRun({},g.result());assert(book['garden3:timed']);assert(!book['garden1:timed']);assert.equal(book['garden3:timed'].time,null);
 g.reset();assert.equal(g.heavyCut,0);assert.equal(g.flowerCut,0);assert.equal(g.heavyLoad,0);assert.equal(g.garden,'garden3');
});
test('Cat collision immediately loses and freezes the round, including a stationary mower',()=>{
 for(const moving of [false,true]){const g=new Game();g.started=true;g.time=19;g.x=420;g.y=280;g.cat.x=390;g.cat.y=280;g.cat.active=true;g.angle=Math.PI;g.speed=moving?112:0;const e=g.step(1/120,{forward:moving});assert(g.done);assert.equal(g.reason,'cat-collision');assert(e.events.includes('cat-collision'));assert(g.result().failed);const time=g.time;assert.equal(g.step(1/120,{forward:true}),null);assert.equal(g.time,time);const book={};assert.equal(recordRun(book,g.result()),book);g.reset();assert(!g.done);assert.equal(g.reason,null);assert.equal(g.time,0);assert.equal(g.cut,0);assert(!g.cat.active);assert.equal(g.waspSpawns.length,0);}
});
test('Swept cat contact catches crossing between frame endpoints and rejects a near miss',()=>{
 const {catContact}=require('../dist/core.js');assert(catContact(100,100,200,100,150,50,150,150));assert(!catContact(100,100,200,100,150,131,150,131));
});
test('Wasps recur in one seeded round with separated locations and cooldown',()=>{
 const g=new Game('normal','garden3',undefined,{seed:42});g.started=true;g.cat.finished=true;run(g,90);assert(g.waspSpawns.length>=3);for(let i=1;i<g.waspSpawns.length;i++){const a=g.waspSpawns[i-1],b=g.waspSpawns[i];assert(b.time-a.time>=18);assert(Math.hypot(a.x-b.x,a.y-b.y)>=80);}assert(g.penalty<=400);
 const h=new Game('normal','garden3',undefined,{seed:42});h.started=true;h.cat.finished=true;run(h,90);assert.deepEqual(g.waspSpawns,h.waspSpawns);
 const j=new Game('normal','garden3',undefined,{seed:43});j.started=true;j.cat.finished=true;run(j,90);assert.notDeepEqual(g.waspSpawns,j.waspSpawns);
});
test('Invalid wasp positions are rejected, including mower, obstacles and no-mow flowers',()=>{
 const {waspSpawnValid}=require('../dist/core.js');for(const garden of ['garden1','garden2','garden3']){const g=new Game('normal',garden);g.x=450;g.y=300;for(const p of [[NaN,100],[-100,300],[450,300],[302,208],[600,370]])assert(!waspSpawnValid(...p,g));const events=[];assert(g.spawnWasps(events));const p=g.waspSpawns[0];g.waspSpawns=[];assert(waspSpawnValid(p.x,p.y,g));assert(Math.hypot(p.x-g.x,p.y-g.y)>=90);}
 const g=new Game('normal','garden3');g.x=450;g.y=195;assert(!waspSpawnValid(615,195,g));g.random=()=>0;assert(!g.spawnWasps([]));assert.equal(g.waspSpawns.length,0);assert.equal(g.nextWaspAt,g.time+3);
});
test('Repeated stings accumulate within a small cap and restart clears them',()=>{
 const g=new Game();g.started=true;for(let i=0;i<4;i++){g.nest={x:g.x,y:g.y,active:true,age:1,caught:false};g.updateWasps(1/120,[]);}assert.equal(g.waspStings,4);assert.equal(g.penalty,400);g.reset();assert.equal(g.penalty,0);assert.equal(g.waspStings,0);
});
console.log(tests.length+' PASS\n'+tests.join('\n'));
