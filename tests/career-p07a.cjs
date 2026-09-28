'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),K=require('../dist/core.js');
let count=0;
function test(name,fn){fn();count++;console.log('PASS '+name);}
const before=[354804,276280,241212,247852,343532];
const snapshot=g=>({route:g.cat.route.id,from:[...g.cat.route.from],to:[...g.cat.route.to],variant:g.cat.variant});
function passes(g){
 const trace=[];g.started=true;
 for(let i=0;i<g.catSettings.maxPasses;i++){
  g.time=g.nextCatAt-K.eventTuning.catWarning;const warning=[];g.updateCat(0,warning);
  assert.deepEqual(warning,['cat-warning']);assert(!g.cat.active);
  const choice=snapshot(g);trace.push(choice);
  g.time=g.nextCatAt-.01;g.updateCat(0,[]);assert(!g.cat.active);assert.deepEqual(snapshot(g),choice);
  g.time=g.nextCatAt;
  for(let tick=0;tick<200&&!g.cat.finished;tick++){
   g.updateCat(1/30,[]);g.time+=1/30;assert.deepEqual(snapshot(g),choice);
  }
  assert(g.cat.finished);
 }
 return trace;
}

test('Career mowable area grows each stage; intro shrinks 35–45 percent and level two is shorter',()=>{
 const area=Object.keys(K.careerLevels).map(id=>new K.Game('normal',id).total*K.P.cell**2);
 assert(area[0]>=before[0]*.55&&area[0]<=before[0]*.65);
 assert(area[1]<before[1]*.85);assert.equal(area[2],before[2]);assert(area[3]>before[3]);assert.equal(area[4],before[4]);
 for(let i=1;i<area.length;i++)assert(area[i]>area[i-1]*1.07,'Distinct area step '+(i+1));
 for(const id of Object.keys(K.careerLevels)){const g=new K.Game('normal',id);if(['career1','career2','career4'].includes(id))assert(K.mowable(g.x,g.y,id));assert(K.legal(g.x,g.y,id));}
 console.log('P07A mowable world-pixel areas: '+area.join(', '));
});
test('The three test gardens keep their original areas, starts, hazards and round-stable cats',()=>{
 const expected=[[354804,101,482],[276280,101,482],[233920,165,405]];
 Object.keys(K.levels).forEach((id,i)=>{const g=new K.Game('normal',id);assert.deepEqual([g.total*4,g.x,g.y],expected[i]);assert(g.mechanics.cat&&g.mechanics.wasps);assert(!g.level.catRoutes);g.catSettings.maxPasses=3;const trace=passes(g);assert.deepEqual(trace[0],trace[1]);assert.deepEqual(trace[1],trace[2]);});
});
test('Intro and heavy grass stay quiet until their late warning and respect their pass limits on long replays',()=>{
 for(const id of ['career1','career2']){const g=new K.Game('normal',id);g.started=true;let warnings=0;
  for(let i=0;i<=300*30;i++){g.time=i/30;const events=[];g.updateCat(1/30,events);if(g.time<g.catSettings.first-K.eventTuning.catWarning){assert.deepEqual(events,[]);assert(!g.cat.active&&!g.cat.warned);}if(events.includes('cat-warning'))warnings++;}
  assert.equal(warnings,g.catSettings.maxPasses);assert.equal(g.catPasses,g.catSettings.maxPasses);assert(!g.cat.active);
 }
});
test('Each cat stage offers 3–5 unique off-screen lines across mowable grass clear of solid obstacles',()=>{
 for(const l of Object.values(K.careerLevels).filter(l=>l.mechanics.cat)){
  assert(l.catRoutes.length>=3&&l.catRoutes.length<=5);assert.equal(new Set(l.catRoutes.map(r=>r.id)).size,l.catRoutes.length);
  for(const r of l.catRoutes){
   for(const [x,y] of [r.from,r.to])assert(x<=-K.eventTuning.catRadius||x>=K.P.width+K.eventTuning.catRadius||y<=-K.eventTuning.catRadius||y>=K.P.height+K.eventTuning.catRadius);
   let lawn=0;
   for(let i=0;i<=500;i++){const t=i/500,x=r.from[0]+(r.to[0]-r.from[0])*t,y=r.from[1]+(r.to[1]-r.from[1])*t;if(K.mowable(x,y,l.id))lawn++;for(const o of l.obstacles)assert(K.distance(x,y,o)>K.eventTuning.catRadius,l.id+' '+r.id);}
   assert(lawn>80,l.id+' '+r.id+' must visibly cross the lawn');
  }
 }
});
test('Per-event choices are seeded, replayable, use every route and variant, and never immediately repeat',()=>{
 for(const id of ['career3','career4','career5']){
  const seenRoutes=new Set(),seenVariants=new Set(),firstRoutes=new Set(),firstVariants=new Set();
  for(let seed=0;seed<24;seed++){
   const g=new K.Game('normal',id,undefined,{seed}),trace=passes(g);firstRoutes.add(trace[0].route);firstVariants.add(trace[0].variant);
   if(seed<3){g.reset();assert.deepEqual(passes(g),trace);}
   trace.forEach((p,i)=>{seenRoutes.add(p.route);seenVariants.add(p.variant);if(i){assert.notEqual(p.route,trace[i-1].route);assert.notEqual(p.variant,trace[i-1].variant);}});
  }
  assert.deepEqual([...seenRoutes].sort(),K.careerLevels[id].catRoutes.map(r=>r.id).sort());
  assert.deepEqual([...seenVariants].sort(),['blender','grey','tuxedo']);
  assert.equal(firstRoutes.size,K.careerLevels[id].catRoutes.length);assert.equal(firstVariants.size,3);
 }
});
test('Explicit route overrides still work for every career pass',()=>{
 for(const route of ['left-right','south-north']){const g=new K.Game('normal','career3',undefined,{seed:42,catRoute:route});for(const p of passes(g))assert.equal(p.route,route);}
});
test('Blender and ordinary warning text match the variant already selected for each event',()=>{
 const source=fs.readFileSync(require('node:path').join(__dirname,'../dist/game.js'),'utf8');
 const feedback=source.slice(source.indexOf('function eventFeedback('),source.indexOf('function cutVisual(')),seen=new Set();
 for(let seed=0;seed<5;seed++)for(const p of passes(new K.Game('normal','career3',undefined,{seed}))){
  const notes=[],sounds=[],context={game:{cat:{variant:p.variant}},sound:{chime:x=>sounds.push(x)},notify:x=>notes.push(x),rings:[]};
  vm.runInNewContext(feedback+";eventFeedback('cat-warning');",context);seen.add(p.variant);
  assert.deepEqual(sounds,['cat-warning']);assert.deepEqual(notes,[p.variant==='blender'?'PASS DEG FOR BLENDER!':'PASS PÅ KATTEN!']);
 }
 assert.equal(seen.size,3);
});
test('Postponement never rerolls a pass, and cat randomness cannot change hidden nest placement',()=>{
 const g=new K.Game('normal','career5',undefined,{seed:42}),initial=snapshot(g),nests=JSON.stringify(g.waspNests);
 g.started=true;g.nest.active=true;
 for(let i=0;i<80;i++){g.time=18+i/10;const events=[];g.updateCat(.1,events);assert.deepEqual(events,[]);assert.deepEqual(snapshot(g),initial);}
 g.nest.active=false;g.time=g.nextCatAt-K.eventTuning.catWarning;const events=[];g.updateCat(0,events);assert.deepEqual(events,['cat-warning']);assert.deepEqual(snapshot(g),initial);
 assert.equal(JSON.stringify(g.waspNests),nests);
 const fixed=new K.Game('normal','career5',undefined,{seed:42,catRoute:'left-right'});assert.equal(JSON.stringify(fixed.waspNests),nests);
});
test('Varied career cats and queued wasps keep exclusive slots and the full three-second separation',()=>{
 for(let seed=0;seed<12;seed++){
  const g=new K.Game('normal','career5',undefined,{seed});g.started=true;g.x=28;g.y=550;
  let previous=null,lastEnd=-Infinity,warnings=0;
  for(let i=0;i<150*30;i++){
   if(i%900===0){const n=g.waspNests[i/900];if(n)g.encounterWasps(n.x-1,n.y,n.x,n.y);}
   const e=g.step(1/30);assert(e&&!g.done);if(e.events.includes('cat-warning'))warnings++;
   const cat=g.cat.active||(g.cat.warned&&!g.cat.finished),current=g.nest.active?'wasp':cat?'cat':null;
   assert(!(cat&&g.nest.active));if(previous&&!current)lastEnd=g.time;
   if(current&&!previous)assert(g.time-lastEnd>=K.eventTuning.hazardGap-1/30-1e-8);
   previous=current;
  }
  assert.equal(g.catPasses,g.catSettings.maxPasses);assert.equal(warnings,g.catPasses);assert.equal(g.waspSpawns.length,g.waspNests.length);
 }
});
test('Level one enables one late cat at 33 seconds with three routes and the full warning',()=>{
 const g=new K.Game('normal','career1');assert(g.mechanics.cat&&g.catSettings.enabled);assert.equal(g.catSettings.first,33);assert.equal(g.catSettings.maxPasses,1);assert.equal(g.level.catRoutes.length,3);
 g.time=33;const idle=[];g.updateCat(0,idle);assert.deepEqual(idle,[]);assert(!g.cat.active);
 g.started=true;g.time=31.49;g.updateCat(0,idle);assert.deepEqual(idle,[]);
 const trace=passes(g);assert.equal(trace.length,1);g.time=300;const after=[];g.updateCat(1,after);assert.deepEqual(after,[]);assert(!g.cat.active);assert.equal(g.catPasses,1);
});
test('Level two enables two late cats at 26 seconds with four routes and the full warning',()=>{
 const g=new K.Game('normal','career2');assert(g.mechanics.cat&&g.catSettings.enabled);assert.equal(g.catSettings.first,26);assert.equal(g.catSettings.maxPasses,2);assert.equal(g.level.catRoutes.length,4);
 g.started=true;g.time=24.49;const early=[];g.updateCat(0,early);assert.deepEqual(early,[]);assert(!g.cat.warned);
 const trace=passes(g);assert.equal(trace.length,2);assert.notEqual(trace[0].route,trace[1].route);assert.notEqual(trace[0].variant,trace[1].variant);
 g.time=300;const after=[];g.updateCat(1,after);assert.deepEqual(after,[]);assert(!g.cat.active);assert.equal(g.catPasses,2);
});
test('Blender, grey and tuxedo can be the first cat on both early levels, using every valid route',()=>{
 for(const id of ['career1','career2']){
  const routes=new Set(),variants=new Set();
  for(let seed=0;seed<32;seed++){
   const g=new K.Game('normal',id,undefined,{seed}),first=snapshot(g);routes.add(first.route);variants.add(first.variant);
   const trace=passes(g);assert.deepEqual(trace[0],first);g.reset();assert.deepEqual(passes(g),trace);
  }
  assert.equal(routes.size,K.careerLevels[id].catRoutes.length);assert.deepEqual([...variants].sort(),['blender','grey','tuxedo']);
 }
});
test('Both early levels use the shared selector without immediate variant or route repeats',()=>{
 // Level one permits only one actual pass; exercise its selector without bypassing the gameplay cap.
 for(const id of ['career1','career2'])for(let seed=0;seed<12;seed++){
  const g=new K.Game('normal',id,undefined,{seed});
  for(let i=0;i<32;i++){const previous=snapshot(g);g.chooseCatPass();assert.notEqual(g.cat.route.id,previous.route);assert.notEqual(g.cat.variant,previous.variant);}
  assert.equal(g.catPasses,0);assert.equal(g.catSettings.maxPasses,id==='career1'?1:2);
 }
});
test('Every cat variant remains fatal on level one and two, after an appropriate warning',()=>{
 const source=fs.readFileSync(require('node:path').join(__dirname,'../dist/game.js'),'utf8'),feedback=source.slice(source.indexOf('function eventFeedback('),source.indexOf('function cutVisual('));
 for(const id of ['career1','career2']){
  const seen=new Set();
  for(let seed=0;seed<32;seed++){
   const g=new K.Game('normal',id,undefined,{seed,catRoute:'left-right'});seen.add(g.cat.variant);g.started=true;g.time=g.nextCatAt-K.eventTuning.catWarning;const warning=[];g.updateCat(0,warning);assert.deepEqual(warning,['cat-warning']);
   const notes=[];vm.runInNewContext(feedback+";eventFeedback('cat-warning');",{game:g,sound:{chime(){}},notify:x=>notes.push(x),rings:[]});assert.equal(notes[0],g.cat.variant==='blender'?'PASS DEG FOR BLENDER!':'PASS PÅ KATTEN!');
   g.time=g.nextCatAt;g.x=420;g.y=280;g.cat.x=390;g.cat.y=280;g.cat.active=true;
   const e=g.step(1/120);assert(e.events.includes('cat-collision'));assert(g.done&&g.result().failed);assert.equal(g.reason,'cat-collision');
  }
  assert.equal(seen.size,3);
 }
});
test('Level one stays entirely free of wasps throughout its single cat pass and a long round',()=>{
 const g=new K.Game('normal','career1');assert(!g.mechanics.wasps);assert.deepEqual(g.waspNests,[]);g.started=true;g.x=28;g.y=550;
 for(let i=0;i<180*30;i++){const e=g.step(1/30);assert(e&&!g.done);assert(!e.events.includes('wasps'));assert(!g.nest.active);}
 assert.equal(g.catPasses,1);assert.deepEqual(g.waspSpawns,[]);assert.equal(g.penalty,0);assert.equal(g.waspStings,0);
});
test('Final cat adjustment preserves exact P07A career areas and level three to five frequencies',()=>{
 assert.deepEqual(Object.keys(K.careerLevels).map(id=>new K.Game('normal',id).total*K.P.cell**2),[195856,212056,241212,269852,343532]);
 assert.deepEqual([3,4,5].map(n=>{const l=K.careerLevels['career'+n];return [l.catRoutes.length,l.catSettings.first,l.catSettings.cooldown,l.catSettings.maxPasses];}),[[5,18,17,3],[4,18,16,3],[5,18,13.5,4]]);
});
console.log(count+' PASS');
