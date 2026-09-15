'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),K=require('../dist/core.js'),M=require('../dist/render/mower.js');
let count=0;function test(name,fn){fn();console.log('PASS '+name);count++;}
test('Idle, near-zero speed, completed round and reduced motion use neutral legs',()=>{
 for(const speed of [0,2.99,-2.99])assert.equal(M.walkFrame({speed,travel:25}),0);
 assert.equal(M.walkFrame({speed:112,travel:25,done:true}),0);
 assert.equal(M.walkFrame({speed:112,travel:25},true),0);
});
test('Walking alternates two poses by travelled distance, identically in reverse',()=>{
 for(const speed of [3,53,112,-3,-53])for(const [travel,frame] of [[0,1],[17.9,1],[18,2],[35.9,2],[36,1],[54,2]])assert.equal(M.walkFrame({speed,travel}),frame);
});
test('Pause or blocked movement returns to idle without resetting gait or mutating physics',()=>{
 const g={speed:12,travel:25},before=JSON.stringify(g);
 assert.equal(M.animationFrame(g,0),2);assert.equal(M.animationFrame(g,121),0);
 g.travel=26;assert.equal(M.animationFrame(g,130),2);
 g.travel=25;assert.equal(JSON.stringify(g),before);
});
test('Real forward, reverse and boosted movement drive gait and release returns to idle',()=>{
 for(const input of [{throttle:1},{throttle:-1},{throttle:1,speedBoost:true}]){
  const g=new K.Game('normal','career1');g.x=400;g.y=400;g.angle=0;const poses=new Set();
  for(let i=0;i<45;i++){g.step(1/60,input);poses.add(M.walkFrame(g));}
  assert(poses.has(1)&&poses.has(2));
  for(let i=0;i<120;i++)g.step(1/60,{});
  assert.equal(M.walkFrame(g),0);
 }
});
function runtime(){
 const tiles=[],requests=[],draws=[];
 const context=()=>new Proxy({drawImage(...args){draws.push(args);},createLinearGradient(){return {addColorStop(){}};}},{get:(o,k)=>o[k]??(()=>{})});
 const sandbox={KlippeAssets:{rounded(){},circle(){}},Image:class{constructor(){requests.push(this);}},document:{createElement(){const tile={width:0,height:0,getContext:context};tiles.push(tile);return tile;}}};
 vm.createContext(sandbox);vm.runInContext(fs.readFileSync(require.resolve('../dist/render/mower.js'),'utf8'),sandbox);
 const m=sandbox.KlippeMower;requests[0].naturalWidth=1254;requests[0].naturalHeight=1254;requests[0].onload();
 return {m,tiles,draws,ctx:context()};
}
test('Three cached poses share the exact source anchor and draw dimensions without per-frame allocation',()=>{
 const {m,tiles,draws,ctx}=runtime(),g=new K.Game('normal','career1');assert.equal(tiles.length,3);
 for(const [speed,travel,frame] of [[0,0,0],[100,1,1],[-53,20,2]]){
  Object.assign(g,{speed,travel});const before=JSON.stringify(g);m.draw(ctx,g,{last:10});const draw=draws.at(-1);
  assert.equal(draw[0],tiles[frame]);assert.deepEqual(draw.slice(1),[-625*.105,-890*.105,1254*.105,1254*.105]);assert.equal(JSON.stringify(g),before);
 }
 for(let i=0;i<120;i++)m.draw(ctx,g,{last:i*16});assert.equal(tiles.length,3);
});
test('Animation state is per round and a failed Canvas cache can retain the loaded PNG',()=>{
 const a={speed:100,travel:20},b={speed:100,travel:20};M.animationFrame(a,0);assert.equal(M.animationFrame(a,500),0);assert.equal(M.animationFrame(b,500),2);
 const old=global.document,img={};global.document={createElement:()=>({getContext:()=>null})};try{assert.deepEqual(M.makeWalkFrames(img,M.SPRITES[M.ACTIVE]),[img,img,img]);}finally{global.document=old;}
});
console.log(count+' PASS');
