'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const K=require('../dist/core.js'),V=require('../dist/render/viewport.js'),M=require('../dist/mouse-input.js'),I=require('../dist/input.js'),S=require('../dist/scene-data.js');
let count=0;const test=(name,fn)=>{fn();count++;console.log('PASS '+name);},close=(a,b)=>assert(Math.abs(a-b)<1e-9,a+' != '+b);
test('World/screen inverse round-trips and contain-fit preserves geometry at all QA sizes',()=>{
 for(const [w,h] of [[1440,900],[1280,720],[1024,768],[844,390],[390,844]]){
  const inset={left:126,right:134,top:98,bottom:46},v=V.fit(w,h,{x:0,y:0,w:900,h:580},inset);
  for(const [x,y] of [[0,0],[900,580],[101,482],[-30,70]]){const s=v.worldToScreen(x,y),p=v.screenToWorld(s.x,s.y);close(p.x,x);close(p.y,y);}
  const a=v.worldToScreen(0,0),b=v.worldToScreen(900,580);assert(a.x>=inset.left-1e-9&&a.y>=inset.top-1e-9);assert(b.x<=w-inset.right+1e-9&&b.y<=h-inset.bottom+1e-9);close((b.x-a.x)/(b.y-a.y),900/580);
 }
 const v=V.fit(800,600,{x:-100,y:30,w:1200,h:700});close(v.screenToWorld(v.worldToScreen(-40,42).x,v.worldToScreen(-40,42).y).x,-40);
});
test('Canvas backing resolution is bounded without changing input coordinates',()=>{assert(V.pixelRatio(1440,900,3)<=2);assert(V.pixelRatio(3840,2160,3)**2*3840*2160<=4000000+1e-8);});
test('Pointer directly ahead gives forward and zero steering for every heading',()=>{for(const angle of [-Math.PI,-1.5,0,1.5,Math.PI]){const m={x:350,y:300,angle},r=M.command(m,{x:m.x+Math.cos(angle)*100,y:m.y+Math.sin(angle)*100});assert.equal(r.throttle,1);close(r.steering,0);}});
test('Left/right use shortest signed angle across the wrap boundary',()=>{const m={x:0,y:0,angle:0};assert(M.command(m,{x:100,y:-100}).steering<0);assert(M.command(m,{x:100,y:100}).steering>0);assert(M.command({...m,angle:Math.PI-.1},{x:-100,y:-1}).steering>0);assert(M.command({...m,angle:-Math.PI+.1},{x:-100,y:1}).steering<0);});
test('Near target is stronger than equal-angle far target with continuous bounded authority',()=>{const m={x:0,y:0,angle:0},steer=d=>M.command(m,{x:d*Math.cos(.6),y:d*Math.sin(.6)}).steering;assert(steer(40)>steer(280));close(steer(280),steer(10000));assert(Math.abs(steer(40.001)-steer(39.999))<.00001);for(let d=0;d<1000;d+=.5)assert(Math.abs(steer(d))<=1);});
test('Zero-distance and close crossings do not cause steering singularities',()=>{const m={x:4,y:6,angle:0};for(const d of [0,.0001,4,8])assert.equal(M.command(m,{x:4,y:6+d}).steering,0);assert(Math.abs(M.command(m,{x:4,y:14.001}).steering)<.001);});
function event(extra={}){return {pointerType:'mouse',button:0,pointerId:1,clientX:100,clientY:100,buttons:1,preventDefault(){},...extra};}
function surface(){return {listeners:{},captured:null,addEventListener(n,f){(this.listeners[n]??=[]).push(f);},emit(n,e=event()){for(const f of this.listeners[n]||[])f(e);},setPointerCapture(id){this.captured=id;},hasPointerCapture(id){return this.captured===id;},releasePointerCapture(){this.captured=null;}};}
test('Mouseup, cancel, lost capture and blur always clear throttle',()=>{for(const name of ['pointerup','pointercancel','lostpointercapture','blur']){const canvas=surface(),host=surface(),m=new M.MouseInput();M.bind(canvas,m,{enabled:()=>true,onStart(){},window:host});canvas.emit('pointerdown');assert(m.active);(name==='blur'?host:canvas).emit(name);assert(!m.active);assert.equal(m.read({},null,null).throttle,0);}});
test('Pointer capture tracks outside scene and releases via the window',()=>{const c=surface(),host=surface(),m=new M.MouseInput();M.bind(c,m,{enabled:()=>true,onStart(){},window:host});c.emit('pointerdown');assert.equal(c.captured,1);c.emit('pointermove',event({clientX:1500,clientY:-200}));assert.equal(m.clientX,1500);host.emit('pointerup');assert(!m.active);c.emit('pointerdown');c.emit('pointermove',event({buttons:0}));assert(!m.active);});
test('HUD, disabled scene, right button and touch cannot start mouse throttle',()=>{const c=surface(),hud=surface(),host=surface(),m=new M.MouseInput();let enabled=false;M.bind(c,m,{enabled:()=>enabled,onStart(){},window:host});c.emit('pointerdown');assert(!m.active);enabled=true;hud.emit('pointerdown');assert(!m.active);for(const e of [event({button:2}),event({pointerType:'touch'}),event({pointerType:'pen'})]){c.emit('pointerdown',e);assert(!m.active);}assert(!m.down(event(),false));});
test('Pointer screen mapping changes with the viewport, never CSS or backing pixel guesses',()=>{const m=new M.MouseInput(),v=V.fit(1280,720),target=v.worldToScreen(200,100);m.down(event({clientX:target.x+25,clientY:target.y+40}),true);assert.deepEqual(m.read({x:200,y:300,angle:-Math.PI/2},v,{left:25,top:40}),{throttle:1,steering:0});});
test('Mouse axes take over, keyboard resumes after clear, and touch/gamepad remain independent',()=>{const neutral={throttle:0,steering:0},k={throttle:-1,steering:-1,speedBoost:true},t={throttle:1,steering:.7,turnBoost:true},p={throttle:.4,steering:.2};assert.deepEqual(M.arbitrate(true,{throttle:1,steering:.3},k,t,p),{throttle:1,steering:.3,speedBoost:true,turnBoost:true});assert.equal(M.arbitrate(false,neutral,k,t,p).throttle,-1);assert.equal(M.arbitrate(false,neutral,neutral,t,p).steering,.7);assert.equal(M.arbitrate(false,neutral,neutral,neutral,p).steering,.2);});
test('Unmodified touch path keeps simultaneous throttle, steering and boost release',()=>{const t=new I.TouchInput();t.down(1,'throttle');t.down(2,'steer',25,50);t.down(3,'turnBoost');const before=t.read();const m=new M.MouseInput();assert(!m.down(event({pointerType:'touch'}),true));assert.deepEqual(t.read(),before);t.up(3);assert.equal(t.read().throttle,1);assert(t.read().steering>0);});
test('Mouse release coasts through existing physics, with no direct angle or position writes',()=>{const a=new K.Game('normal','career1'),b=new K.Game('normal','career1');for(let i=0;i<100;i++){const input=M.command(a,{x:a.x,y:a.y-100});a.step(1/120,input);b.step(1/120,{throttle:1,steering:0});}assert.equal(a.x,b.x);assert.equal(a.y,b.y);const speed=a.speed;assert(speed>0);a.step(1/120,{throttle:0,steering:0});assert(a.speed<speed);for(let i=0;i<120;i++)a.step(1/120,{});assert.equal(a.speed,0);});
test('Scene data neither mutates geometry nor introduces gameplay collision or coverage',()=>{for(const level of Object.values(K.careerLevels)){const before=JSON.stringify(level),g=new K.Game('normal',level.id),mask=Buffer.from(g.mask),total=g.total,scene=S.forLevel(level);assert.equal(JSON.stringify(level),before);scene.decor.push({asset:'pool',x:g.x,y:g.y,w:1000,h:1000});scene.decor[0].x=12345;assert.equal(JSON.stringify(level),before);assert.notEqual(S.forLevel(level).decor[0].x,12345);assert(K.legal(g.x,g.y,g.garden));assert.equal(g.total,total);assert.deepEqual(Buffer.from(g.mask),mask);for(const v of scene.obstacleVisuals)assert(level.obstacles[v.colliderIndex]);}});
test('Scene/render dependencies remain one-way and all new modules are included in build',()=>{const source=fs.readFileSync(path.join(__dirname,'../dist/game.js'),'utf8'),core=fs.readFileSync(path.join(__dirname,'../dist/core.js'),'utf8'),html=fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8');assert(source.includes('clearMouse();keys.add(k)'));assert(!/Klippe(Scene|Assets|Viewport|Mouse)/.test(core));for(const f of ['mouse-input.js','scene-data.js','render/viewport.js','render/scene.js','render/lawn.js','render/actors.js','render/assets.js'])assert(html.includes('src="'+f+'"'));assert(!source.includes('const lawn=document.createElement'));});

test('Rendering, cache rebuilds and cut visuals cannot alter simulation state',()=>{
 const context=new Proxy({},{get:(object,key)=>key in object?object[key]:(()=>{}),set:(object,key,value)=>(object[key]=value,true)});
 const previousDocument=global.document;global.document={createElement:()=>({width:0,height:0,getContext:()=>context})};
 try{
  require('../dist/render/assets.js');const Lawn=require('../dist/render/lawn.js'),Scene=require('../dist/render/scene.js'),Actors=require('../dist/render/actors.js');
  for(const level of Object.values(K.careerLevels)){
   const game=new K.Game('normal',level.id,undefined,{seed:6}),lawn=Lawn.create(game,K.P),scene=Scene.create(game,K.P),before=JSON.stringify(game);
   scene.reset();lawn.reset();scene.background(context,V.fit(1440,900));lawn.draw(context);scene.obstacles(context);Actors.draw(context,game,K.P,{last:0,settings:{reduced:false},cutLevel:0,rings:[],particles:[]});
   scene.foreground(context);assert.equal(JSON.stringify(game),before);
   const step=game.step(1/120,{throttle:1}),after=JSON.stringify(game);lawn.cut(step);assert.equal(JSON.stringify(game),after);
  }
 }finally{global.document=previousDocument;}
});
test('Foreground canopy becomes transparent near mower or hazards, independent of physics',()=>{
 const Scene=require('../dist/render/scene.js'),d={x:100,y:100,w:60,h:60,anchor:[.5,.5]},game={x:500,y:500,cat:{active:false},nest:{active:false}};
 assert.equal(Scene.foregroundAlpha(d,game),1);assert.equal(Scene.foregroundAlpha(d,{...game,x:100,y:100}),.35);
 assert.equal(Scene.foregroundAlpha(d,{...game,cat:{active:true,x:100,y:100}}),.35);assert.equal(Scene.foregroundAlpha(d,{...game,nest:{active:true,x:100,y:100}}),.35);
});
console.log(count+' PASS');
