'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),K=require('../dist/core.js'),M=require('../dist/render/mower.js'),A=require('../dist/render/assets.js'),D=require('../dist/scene-data.js');
let count=0;function test(name,fn){fn();console.log('PASS '+name);count++;}const close=(a,b)=>assert(Math.abs(a-b)<1e-9);
function runtime(files=['assets','mower','scene']){
 const requests=[],draws=[],calls=[];let canvases=0;
 function ctx(){return new Proxy({drawImage(...a){draws.push(a);},createLinearGradient(){return {addColorStop(){}};}},{get:(o,k)=>o[k]??((...a)=>calls.push([k,...a]))});}
 const sandbox={KlippeSceneData:D,Image:class{constructor(){requests.push(this);}naturalWidth=1254;naturalHeight=1254;},document:{createElement(){canvases++;return {width:0,height:0,getContext:ctx};}}};
 vm.createContext(sandbox);for(const f of files)vm.runInContext(fs.readFileSync('dist/render/'+f+'.js','utf8'),sandbox);
 return {sandbox,requests,draws,calls,ctx:ctx(),canvases:()=>canvases,load:()=>{for(const image of requests)image.onload();}};
}
test('All 18 local RGBA assets are declared and the build copies their original bytes',()=>{
 const paths=new Set();for(const s of Object.values(M.SPRITES)){paths.add(s.src);if(s.riderSprite)paths.add(s.riderSprite);assert.equal(s.sprite,s.src);assert.equal(s.worldScale,s.scale);assert(s.class&&s.name);}
 for(const s of Object.values(A.ART))paths.add(s.src);assert.equal(paths.size,18);
 for(const src of paths){const png=fs.readFileSync('public/art/'+src.slice(7));assert.equal(png.readUInt32BE(16),1254);assert.equal(png.readUInt32BE(20),1254);assert.equal(png[25],6);assert.deepEqual(fs.readFileSync('dist/'+src),png);}
});
test('Approved control-type mapping preserves filenames and pairs the three correct riders',()=>{
 const c=M.SPRITES['mower-03-ride-compact'],t=M.SPRITES['mower-04-ride-tractor'],z=M.SPRITES['mower-05-zero-turn'];
 assert.equal(c.controls,'wheel');assert(t.src.endsWith('mower-05-zero-turn-yellow.png'));assert(t.riderSprite.endsWith('rider-04-ride-tractor.png'));assert.equal(t.controls,'wheel');
 assert(z.src.endsWith('mower-04-ride-tractor-yellow.png'));assert(z.riderSprite.endsWith('rider-05-zero-turn.png'));assert.equal(z.controls,'levers');
 for(const s of Object.values(M.SPRITES).filter(s=>s.class==='push')){assert(s.walk);assert.equal(s.riderSprite,undefined);}
});
test('Every mower rotates around its explicit deck anchor without changing gameplay or progression',()=>{
 const g=new K.Game('normal','career3'),before=JSON.stringify(g);
 for(const s of Object.values(M.SPRITES)){M.setAppearance(g,s.id);assert.equal(M.appearance(g),s);for(const angle of [0,1.3,Math.PI,-Math.PI/2]){const p=M.spritePoint({...g,angle},s.anchor,s);close(p.x,g.x);close(p.y,g.y);}}
 assert.equal(JSON.stringify(g),before);assert.equal(K.P.body,14);assert.equal(K.P.deck,23);assert.throws(()=>M.setAppearance(g,'missing'));
 assert.equal(M.appearance(new K.Game()).id,'mower-01-push');
});
test('Rider hand anchors coincide with calibrated controls at all mower headings',()=>{
 for(const s of Object.values(M.SPRITES).filter(s=>s.riderSprite))for(const angle of [0,Math.PI/2,Math.PI,-.7]){
  const source=M.riderPoint({x:s.riderAnchorX,y:s.riderAnchorY},s);close(source.x,s.anchorX+s.riderOffsetX);close(source.y,s.anchorY+s.riderOffsetY);
  const g={x:222,y:333,angle},world=M.spritePoint(g,source,s);assert(Number.isFinite(world.x)&&Number.isFinite(world.y));
 }
});
test('Seated motion is bounded, mirrored by steering and disabled at idle, pause, finish or reduced motion',()=>{
 const g={speed:100,steer:.8,travel:3};const a=M.riderPose(g),b=M.riderPose({...g,steer:-.8});close(a.x,-b.x);close(a.angle,-b.angle);close(a.y,b.y);
 for(let i=0;i<100;i++){const p=M.riderPose({...g,speed:i*5,steer:2,travel:i});assert(Math.abs(p.x)<=.25&&Math.abs(p.y)<=.18&&Math.abs(p.angle)<=.015);}
 for(const p of [M.riderPose({...g,speed:0}),M.riderPose({...g,done:true}),M.riderPose(g,{moving:false}),M.riderPose(g,{reduced:true})])assert.deepEqual(p,{x:0,y:0,angle:0});
});
test('Every loaded rider draws above its mower, with no gameplay mutation or repeated image requests',()=>{
 const r=runtime(),m=r.sandbox.KlippeMower,g=new K.Game('normal','career1');
 for(const s of Object.values(m.SPRITES).filter(s=>s.riderSprite)){
  m.setAppearance(g,s.id);r.load();r.draws.length=0;const before=JSON.stringify(g),requests=r.requests.length;m.draw(r.ctx,g);
  assert.equal(r.draws[0][0].src,s.src);assert.equal(r.draws[1][0].src,s.riderSprite);if(s.controls==='wheel'){const control=r.draws.findIndex((args,i)=>i>0&&args[0].src===s.src);assert(control>1);assert(r.draws.slice(1,control).every(args=>args[0].src===s.riderSprite));assert(r.draws.slice(control+1).every(args=>args[0].src===s.riderSprite));}
  for(let i=0;i<20;i++)m.draw(r.ctx,g,{last:i*16});assert.equal(r.requests.length,requests);assert.equal(JSON.stringify(g),before);
 }
});
test('Missing rider retains its mower; missing mower retains the existing Canvas fallback',()=>{
 const r=runtime(),m=r.sandbox.KlippeMower,g=new K.Game();m.setAppearance(g,'mower-03-ride-compact');r.load();
 const rider=r.requests.find(i=>i.src.includes('riders/')),body=r.requests.find(i=>i.src.includes('mower-03'));rider.onerror();r.draws.length=0;m.draw(r.ctx,g);assert.equal(r.draws.length,1);assert.equal(r.draws[0][0],body);
 body.onerror();r.draws.length=0;m.draw(r.ctx,g);assert.equal(r.draws.length,0);
});
test('Canopy proximity includes rider head and shoulders for all three seated variants',()=>{
 const r=runtime(),m=r.sandbox.KlippeMower,g=new K.Game();g.cat.active=false;g.nest.active=false;
 for(const s of Object.values(m.SPRITES).filter(s=>s.riderSprite)){m.setAppearance(g,s.id);r.load();const points=m.foregroundPoints(g);assert.equal(points.length,6);const head=points[1],d={x:head.x,y:head.y,w:2,h:2};close(r.sandbox.KlippeScene.foregroundAlpha(d,g),.35);}
});
test('Nine environment images retain aspect ratio and long hedges repeat rather than stretching',()=>{
 const r=runtime(['assets']),a=r.sandbox.KlippeAssets;
 for(const id of Object.keys(a.ART)){const d={asset:'preview',sprite:id,x:0,y:0,w:80,h:50};a.draw(r.ctx,d);r.load();r.draws.length=0;a.draw(r.ctx,d);const args=r.draws.at(-1);close(args[7]/args[8],args[3]/args[4]);}
 r.draws.length=0;a.draw(r.ctx,{asset:'hedge',sprite:'hedge-segment-01',x:0,y:0,w:30,h:400});assert(r.draws.length>3);for(const args of r.draws)close(args[7]/args[8],args[3]/args[4]);
});
test('Art becomes visible after asynchronous loading with a single cache rebuild and no simulation reset',()=>{
 const r=runtime(),g=new K.Game('normal','career1'),s=r.sandbox.KlippeScene.create(g,K.P),view={width:900,height:580,screenToWorld:(x,y)=>({x,y})};s.reset();const before=JSON.stringify(g),initial=r.canvases();r.load();s.background(r.ctx,view);assert(r.canvases()>initial);const built=r.canvases();
 for(let i=0;i<20;i++)s.background(r.ctx,view);assert.equal(r.canvases(),built);assert.equal(JSON.stringify(g),before);
});
test('Environment art stays decorative and preserves visible solid collider footprints',()=>{
 const used=new Set();for(const level of Object.values(K.careerLevels)){const before=JSON.stringify(level),d=D.forLevel(level);for(const p of d.decor)if(p.sprite){assert(A.ART[p.sprite]);used.add(p.sprite);}for(const v of d.obstacleVisuals){const o=level.obstacles[v.colliderIndex];if(o.type==='circle'){assert(v.sprite.startsWith('tree-'));assert.equal(v.layer,'foreground');}else {assert.equal(v.sprite,'flower-bed-stone-01');assert(v.solidBed);assert.equal(v.rotation||0,0);}}assert.equal(JSON.stringify(level),before);}assert.equal(used.size,9);
});
test('Seated foreshortening preserves upper body, both hands and a continuous positive leg mapping',()=>{
 for(const spec of Object.values(M.SPRITES).filter(s=>s.riderSprite)){
  const {fromY,scaleY}=spec.riderLowerBody;assert(scaleY>0&&scaleY<1);
  for(const y of [0,140,410,spec.riderAnchorY,fromY])close(M.riderY(y,spec),y);
  for(const [x,y,w,h] of spec.handWindows||[])assert(y+h<=fromY,'Hand crops must stay above the leg transform');
  close(M.riderY(fromY+.001,spec)-M.riderY(fromY-.001,spec),.001*(1+scaleY));
  const ankle=M.riderY(1060,spec);assert(ankle>fromY&&ankle<1060);assert(M.riderY(1100,spec)>ankle);
  for(const angle of [0,.6,Math.PI,-Math.PI/2]){const g={x:300,y:400,angle};const visual=M.spritePoint(g,M.riderPoint({x:625,y:1060},spec),spec);assert(Number.isFinite(visual.x)&&Number.isFinite(visual.y));}
 }
 for(const spec of Object.values(M.SPRITES).filter(s=>s.class==='push'))assert.equal(spec.riderLowerBody,undefined);
});

test('Upper and lower rider source slices meet exactly without shifting the hand pivot',()=>{
 const r=runtime(),m=r.sandbox.KlippeMower,g=new K.Game();
 for(const spec of Object.values(m.SPRITES).filter(s=>s.riderSprite)){
  m.setAppearance(g,spec.id);r.load();r.draws.length=0;m.draw(r.ctx,g);
  const [upper,lower]=r.draws.filter(args=>args[0].src===spec.riderSprite);
  close(upper[2]+upper[4],lower[2]);close(upper[6]+upper[8],lower[6]);close(upper[5],lower[5]);close(upper[7],lower[7]);
  close(lower[8]/lower[4],spec.scale*spec.riderScale*spec.riderLowerBody.scaleY);
 }
});

test('Feature stone beds draw as one readable image rather than repeated miniature tiles',()=>{
 const r=runtime(['assets']),a=r.sandbox.KlippeAssets;
 for(const l of Object.values(K.careerLevels))for(const bed of D.forLevel(l).decor.filter(p=>p.asset==='flowerbed')){
  assert(bed.w>=120&&bed.h>=70);a.draw(r.ctx,bed);r.load();r.draws.length=0;a.draw(r.ctx,bed);assert.equal(r.draws.length,1);
  const args=r.draws[0];assert(args[7]>105&&args[8]>=70);close(args[7]/args[8],args[3]/args[4]);
 }
});

test('Foliage variations stay deterministic, use enlarged bounded crowns and retain every solid trunk',()=>{
 for(const l of Object.values(K.careerLevels)){
  const original=JSON.stringify(l),data=D.forLevel(l);assert.deepEqual(data,D.forLevel(l));
  for(const crown of data.decor.filter(p=>p.asset==='canopy')){assert(crown.w>=110&&crown.w<=150);assert(Math.abs(crown.rotation)<=.1);}
  for(const v of data.obstacleVisuals.filter(p=>p.layer==='foreground')){assert(v.canopyFactor>=2.6&&v.canopyFactor<=2.75);assert(l.obstacles[v.colliderIndex].type==='circle');}
  assert.equal(JSON.stringify(l),original);
 }
 const r=runtime(['assets']);r.sandbox.KlippeAssets.draw(r.ctx,{asset:'bush',x:0,y:0,w:80,h:60,mirrorX:true,scale:1.1});assert(r.calls.some(c=>c[0]==='scale'&&c[1]===-1.1&&c[2]===1.1));
});
console.log(count+' PASS');
