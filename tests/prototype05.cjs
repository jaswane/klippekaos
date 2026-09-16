'use strict';
const assert=require('node:assert/strict');const K=require('../dist/core.js'),S=require('../dist/profile.js');const tests=[];function test(n,f){f();tests.push(n);}function run(g,t,input={}){for(let i=0;i<Math.round(t*120);i++)g.step(1/120,input);}
function memory(){const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};}
function result(score=1000,garden='career1',mode='normal'){return {...new K.Game(mode,garden).result(),score,time:100,coverage:1,completed:true};}
test('Five career stages introduce terrain gradually while cats remain enabled',()=>{
 const expected=[[false,true,false,false],[true,true,false,false],[false,true,false,false],[false,true,true,false],[false,true,false,true]];
 assert.equal(Object.keys(K.careerLevels).length,5);
 Object.values(K.careerLevels).forEach((l,i)=>{assert.equal(l.stage,i+1);assert.deepEqual(['heavy','cat','wildflowers','wasps'].map(k=>l.mechanics[k]),expected[i]);assert(l.polygon.length>=4);});
});
test('Intro is ordinary grass with a late cat, but no terrain, pickups, finds, damage or wasps',()=>{
 const g=new K.Game('normal','career1');g.started=true;run(g,80);assert.equal(g.heavyTotal,0);assert.equal(g.flowerTotal,0);assert.equal(g.pickups.length,0);assert.equal(g.damage.length,0);assert(g.catPasses>0);assert.equal(g.waspSpawns.length,0);g.x=g.find.x;g.y=g.find.y;run(g,.1,{forward:true});assert(!g.find.revealed);
});
test('Career mechanics gate recurring cats and hidden nests to their introductory stages',()=>{
 for(let i=2;i<=5;i++){const g=new K.Game('normal','career'+i);assert.equal(g.heavyTotal>0,i===2);assert.equal(g.flowerTotal>0,i===4);assert.equal(g.waspNests.length>0,i===5);g.started=true;g.x=100;g.y=500;run(g,90);assert(g.catPasses>0);assert.equal(g.waspSpawns.length,0);}
});

test('Every career lawn remains reachable with its own geometry',()=>{
 for(const [id,l] of Object.entries(K.careerLevels)){const g=new K.Game('normal',id);assert(K.legal(g.x,g.y,id));for(let y=24;y<=554;y+=4)for(let x=28;x<=872;x+=4)if(K.legal(x,y,id))g.mow(x,y);assert(g.coverage>=K.P.finish,id);}
});
test('Cat warning reserves the hazard slot and blocks wasps through the post-cat gap',()=>{
 const g=new K.Game();g.started=true;g.time=16.5;g.nextWaspAt=0;g.updateCat(0,[]);assert(g.cat.warned);const waiting=g.waspNests[0];g.encounterWasps(waiting.x-1,waiting.y,waiting.x,waiting.y);assert(!g.spawnWasps([]));g.time=18;g.updateCat(1/120,[]);assert(g.cat.active);assert(!g.spawnWasps([]));while(!g.cat.finished){g.time+=1/120;g.updateCat(1/120,[]);}const end=g.time;assert(!g.spawnWasps([]));g.time=end+K.eventTuning.hazardGap-.01;assert(!g.spawnWasps([]));g.time=end+K.eventTuning.hazardGap;const n=g.waspNests[0];g.encounterWasps(n.x-1,n.y,n.x,n.y);assert(g.spawnWasps([]));
});
test('An active swarm postpones the cat, followed by a gap and the full warning lead-in',()=>{
 const g=new K.Game();g.started=true;g.time=17;g.nest={x:500,y:400,active:true,age:0};g.updateCat(0,[]);assert(!g.cat.warned&&!g.cat.active);g.nest.age=4.5;g.updateWasps(0,[]);const end=g.time;assert(!g.nest.active);g.time=end+2.99;g.updateCat(0,[]);assert(!g.cat.warned);g.time=end+3;const events=[];g.updateCat(0,events);assert(events.includes('cat-warning'));assert(!g.cat.active);g.time=g.nextCatAt;g.updateCat(0,[]);assert(g.cat.active);
});
test('Seeded combined runs never overlap dangers and preserve at least three seconds between them',()=>{
 for(let seed=0;seed<8;seed++){const g=new K.Game('normal','garden1',undefined,{seed,catRoute:'left-right'});g.started=true;g.x=100;g.y=500;let previous=null,lastEnd=-Infinity;
  for(let i=0;i<90*120;i++){if(i%2400===0){const n=g.waspNests[i/2400];if(n)g.encounterWasps(n.x-1,n.y,n.x,n.y);}g.step(1/120);const current=g.nest.active?'wasp':g.cat.active||(g.cat.warned&&!g.cat.finished)?'cat':null;assert(!(g.nest.active&&(g.cat.active||(g.cat.warned&&!g.cat.finished))));if(previous&&!current)lastEnd=g.time;if(current&&!previous)assert(g.time-lastEnd>=3-1/120);previous=current;}
  assert(g.catPasses>0);assert(g.waspSpawns.length>=2&&g.waspSpawns.length<=4);
 }
});

test('Heavy grass reduces full-load speed by 25 percent and steering response is retained',()=>{
 const heavy=new K.Game('normal','career2'),plain=new K.Game('normal','career1');for(const g of [heavy,plain]){g.x=160;g.y=405;g.angle=0;g.speed=K.P.maxSpeed;}run(heavy,.4,{forward:true});run(plain,.4,{forward:true});assert(Math.abs(heavy.speed/plain.speed-.75)<.01);heavy.step(1/120,{forward:true,right:true});plain.step(1/120,{forward:true,right:true});assert.equal(heavy.steer,plain.steer);assert.equal(K.terrainTuning.heavySpeedFactor,.75);
});
test('Initials accept exactly three ASCII letters/digits and reject unsafe or incomplete text',()=>{
 for(const v of ['ABC','A09','123'])assert(S.validInitials(v));for(const v of ['AB','ABCD','aBc','ÆØÅ','<a>','A B',''])assert(!S.validInitials(v));assert.equal(S.normalizeInitials('a!b9x'),'AB9');assert.throws(()=>S.submit({},result(),'AB'));
});
test('Only qualifying runs enter the five-place named leaderboard, separated by stage and mode',()=>{
 let book={};for(let i=0;i<5;i++)book=S.submit(book,result(1000+i),'A0'+i);assert.equal(book['career1:normal'].runs.length,5);assert(!S.qualifies(book,result(999)));assert(!S.qualifies(book,result(1000)));assert(S.qualifies(book,result(2000)));book=S.submit(book,result(2000),'TOP');assert.equal(book['career1:normal'].runs[0].initials,'TOP');assert.equal(book['career1:normal'].runs.length,5);assert(S.qualifies(book,result(1,'career2')));assert(S.qualifies(book,result(1,'career1','timed')));assert(!S.qualifies(book,{...result(99999),failed:true}));
});
test('Career unlocks only the next stage after successful normal completion',()=>{
 assert.equal(S.advance(1,result()),2);assert.equal(S.advance(1,{...result(),completed:false}),1);assert.equal(S.advance(1,{...result(),failed:true}),1);assert.equal(S.advance(1,result(1,'career1','timed')),1);assert.equal(S.advance(1,result(1,'career4')),1);assert.equal(S.advance(5,result(1,'career5')),5);
});
test('Profile round-trips names and unlocks, ignores malformed records and handles unavailable storage',()=>{
 const storage=memory(),book=S.submit({},result(),'A09');assert(S.save(storage,book,3));const loaded=S.load(storage);assert.equal(loaded.unlocked,3);assert.equal(loaded.book['career1:normal'].runs[0].initials,'A09');assert.equal(storage.getItem('klippekaos-p04'),null);storage.setItem(S.key,'{');assert(!S.load(storage).ok);storage.setItem(S.key,JSON.stringify({book:{'career1:normal':{runs:[{...result(),initials:'<x>'}]}},unlocked:99}));assert.equal(Object.keys(S.load(storage).book).length,0);assert.equal(S.load(storage).unlocked,5);const blocked={getItem(){throw Error();},setItem(){throw Error();}};assert(!S.load(blocked).ok);assert(!S.save(blocked,book,2));
});
test('Flower garden has two safely avoidable islands and a unique open outline',()=>{
 const g=new K.Game('normal','career4'),l=g.level;assert.notDeepEqual(l.polygon,K.careerLevels.career3.polygon);assert.equal(l.wildflowers.length,2);
 for(let y=24;y<=554;y+=4)for(let x=28;x<=872;x+=4)if(K.legal(x,y,g.garden)&&l.wildflowers.every(p=>Math.hypot(x-p.x,y-p.y)>p.rx+K.P.deck))g.mow(x,y);
 console.log('Blomsterhagen safe coverage '+g.cut+'/'+g.total+' = '+g.coverage*100+'%; flower damage '+g.flowerCut);
 assert(g.coverage>=K.P.finish);assert.equal(g.flowerCut,0);assert(g.flowerTotal>0);g.step(1/120);assert(g.result().completed);
});
test('Summer garden is larger, distinct and offers an unobstructed central escape corridor',()=>{
 const a=new K.Game('normal','career4'),b=new K.Game('normal','career5');assert(b.total>a.total*1.2);assert.notDeepEqual(b.level.polygon,a.level.polygon);assert.notDeepEqual(b.level.polygon,K.careerLevels.career3.polygon);
 for(let x=100;x<=800;x+=10)for(let y=250;y<=330;y+=10){assert(K.legal(x,y,b.garden));assert(K.mowable(x,y,b.garden));}
 for(let seed=0;seed<20;seed++){const g=new K.Game('normal','career5',undefined,{seed});assert(g.waspNests.length>=2&&g.waspNests.length<=4);for(const p of g.waspNests){assert(K.legal(p.x,p.y,g.garden));assert(K.mowable(p.x,p.y,g.garden));}}
});
console.log(tests.length+' PASS\n'+tests.join('\n'));
