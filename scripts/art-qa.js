'use strict';
// Local-only controls: machine profiles affect driving/cutting, with no unlocks or economy.
const qaStyle=document.createElement('style');qaStyle.textContent=`
#artQA{position:fixed;left:10px;top:104px;z-index:30;width:298px;max-width:calc(100vw - 20px);max-height:calc(100dvh - 150px);overflow:auto;border:1px solid #658570;border-radius:10px;background:#13382ff2;color:#f8f2d9;font:12px/1.4 system-ui;padding:10px;box-shadow:0 4px 16px #0003}
#artQA header{display:flex;justify-content:space-between;align-items:center;font-weight:bold;margin-bottom:5px}#artQA label{display:block}#artQA select{display:block;max-width:100%;width:100%;font:inherit;color:#17382d;background:#fff9df;border-radius:5px;padding:6px;margin:4px 0 6px}#artQA small{display:block;overflow-wrap:anywhere;color:#c8dacc}#artQA button{font:inherit;border:1px solid #76917d;background:#264e3d;color:#fff5dc;border-radius:5px;padding:5px 7px;margin:3px 4px 3px 0}#artQA details{margin-top:8px}#artQA summary{cursor:pointer;font-weight:bold}#artQA p{margin:5px 0}#artQA[data-collapsed] {width:auto;padding:5px}#artQA[data-collapsed] header{margin:0}#artQA[data-collapsed] .qa-content,#artQA[data-collapsed] header span{display:none}
#artQA #artCurrent{display:block;font-size:11px}#artQA #artEnvironment{font-size:11px;white-space:normal}
@media(max-height:550px){#artQA{top:102px;left:6px;width:264px;padding:6px;max-height:calc(100dvh - 152px);font-size:11px}#artQA select{padding:3px;margin:2px 0}#artQA header{margin:0}#artQA #artCurrent{font-size:10px}}
`;document.head.append(qaStyle);
const panel=document.createElement('section');panel.id='artQA';panel.setAttribute('aria-label','Lokalt Art QA');panel.innerHTML='<header><span>ART QA · lokalt</span><button id="artHide">Skjul QA</button></header><div class="qa-content"><label for="artMower">Klipper</label><select id="artMower"></select><small id="artCurrent"></small><small id="artProfile"></small><small id="artNests"></small><small id="artCareer"></small><details id="artTools"><summary>Nivå og testscener</summary><label for="artLevel">Nivå</label><select id="artLevel"></select><p>Klipperbytte bevarer runden. Nivåbytte starter en ny.</p><label for="artSeed">Seed for ny QA-runde</label><input id="artSeed" type="number" value="42" style="width:100%;box-sizing:border-box"><label><input id="artShowNests" type="checkbox"> Vis skjulte bol · kun QA</label><label><input id="artShowColliders" type="checkbox"> Vis collider · kun QA</label><div id="artButtons"></div><details><summary>Miljøbilder i dette nivået</summary><p id="artEnvironment"></p></details></details></div>';document.body.append(panel);
const mowerSelect=document.getElementById('artMower'),levelSelect=document.getElementById('artLevel'),buttons=document.getElementById('artButtons');
for(const s of Object.values(KlippeMower.SPRITES)){const o=document.createElement('option');o.value=s.id;o.textContent=s.name+' · '+s.src.split('/').pop().replace('.png','');mowerSelect.append(o);}
for(const l of Object.values(Klippe.careerLevels)){const o=document.createElement('option');o.value=l.stage;o.textContent=l.stage+' · '+l.name;levelSelect.append(o);}
function applyMower(id){game.setMowerProfile(id);KlippeMower.setAppearance(game,id);}
function label(){const s=KlippeMower.appearance(game);document.getElementById('artCurrent').textContent='ID: '+s.id+(s.controls?' · '+(s.controls==='wheel'?'rattgrep':'spakgrep'):'');document.getElementById('artProfile').textContent='Fart ×'+game.mower.speedMultiplier.toFixed(2)+' · bredde ×'+game.mower.mowWidthMultiplier.toFixed(2)+' · styring ×'+game.mower.steeringMultiplier.toFixed(2);const data=KlippeSceneData.forLevel(game.level);document.getElementById('artEnvironment').textContent=[...new Set([...data.decor,...data.obstacleVisuals].map(p=>p.sprite).filter(Boolean))].join(', ');}
document.getElementById('artHide').onclick=()=>{const hidden=panel.toggleAttribute('data-collapsed');document.getElementById('artHide').textContent=hidden?'Art QA · vis klippere':'Skjul QA';};
let frozen=false,forced=null,timer=null;const step=game.step;game.step=function(...args){return frozen?{moved:false,events:[],cells:[],fresh:0}:step.apply(this,args);};const originalControls=controls;controls=()=>forced||originalControls();
function closeTools(){document.getElementById('artTools').open=false;}
function select(){clearTimeout(timer);forced=null;clearMouse();frozen=false;startGame('normal','career'+levelSelect.value);game.eventOptions.seed=Number(document.getElementById('artSeed').value)>>>0;game.reset('normal',game.garden);initGrass();applyMower(mowerSelect.value);hud();label();}
// Leaving a deterministic test scene via ordinary restart/menu buttons restores normal play.
for(const id of ['restart','again','retryCat','nextLevel','career','timeTrial','testGarden','organicGarden'])document.getElementById(id)?.addEventListener('click',()=>{clearTimeout(timer);forced=null;frozen=false;},true);
// Profile and art change together; coverage, time and position stay intact.
mowerSelect.onchange=()=>{applyMower(mowerSelect.value);label();};levelSelect.onchange=select;
function fixture(){select();frozen=true;game.x=450;game.y=330;game.angle=-Math.PI/2;closeTools();}
function button(text,fn){const b=document.createElement('button');b.textContent=text;b.onclick=fn;buttons.append(b);}
function drive(steering,throttle=1){fixture();frozen=false;forced={throttle,steering};timer=setTimeout(()=>{forced={};timer=setTimeout(()=>{frozen=true;},800);},2200);}
button('Ny runde med seed',select);
button('Karriere · meny',()=>{clearTimeout(timer);forced=null;frozen=false;showMenu();});
button('QA: ny karriereprofil',()=>{book={};unlocked=1;mowerProgress=KlippeProfile.mowerState();saveProfile();clearTimeout(timer);forced=null;frozen=false;$('careerLevel').value='career1';showMenu();});
button('QA: fullfør valgt nivå',()=>{clearTimeout(timer);forced=null;clearMouse();frozen=true;if(!game.level.stage||game.level.stage>unlocked)return;game.cut=Math.ceil(game.total*P.finish);game.done=true;game.reason='complete';game.started=true;finish();closeTools();});
button('QA: neste mower-unlock',()=>{const next=Object.values(Klippe.mowerProfiles).find(p=>!mowerProgress.unlockedMowers.includes(p.id));if(!next)return;levelSelect.value=String(next.unlockAfterCareerLevel);select();frozen=true;game.cut=Math.ceil(game.total*P.finish);game.done=true;game.reason='complete';game.started=true;finish();closeTools();});
button('Sommerhagen · bol',()=>{levelSelect.value='5';select();});
function nearNest(drive=false){
 clearTimeout(timer);forced=null;clearMouse();const n=game.waspNests.find(n=>n.state==='hidden');if(!n)return;
 const dx=52;game.x=n.x-dx;game.y=n.y;game.angle=0;game.speed=0;game.steer=0;frozen=false;closeTools();
 if(drive){forced={throttle:1};timer=setTimeout(()=>{forced=null;},1400);}
}
button('Still opp ved neste bol',()=>nearNest());button('Test bol: kjør over',()=>nearNest(true));
button('Kjør rett',()=>drive(0));button('Venstresving',()=>drive(-.65));button('Høyresving',()=>drive(.65));button('Revers',()=>drive(.5,-1));button('Idle',fixture);
button('Spill videre',()=>{clearTimeout(timer);forced=null;frozen=false;clearMouse();closeTools();});
button('Redusert bevegelse',()=>{settings.reduced=!settings.reduced;closeTools();});
button('Touch',()=>{const real=window.matchMedia;window.matchMedia=q=>q==='(hover: hover)'?{matches:false}:q==='(pointer: coarse)'?{matches:true}:real.call(window,q);touchSeen=true;updateDevice();select();});
for(const type of ['klipper','katt','veps'])button('Krone: '+type,()=>{fixture();const o=game.level.obstacles.find(o=>o.type==='circle');game.started=true;if(type==='klipper'){game.x=o.x+o.r+18;game.y=o.y;game.angle=0;}else{game.x=450;game.y=420;if(type==='katt')game.cat={...game.cat,active:true,variant:'blender',x:o.x+o.r+18,y:o.y,angle:0};else game.nest={...game.nest,active:true,revealed:true,x:o.x+o.r+18,y:o.y,originX:o.x+o.r+18,originY:o.y};}closeTools();});
button('Resultat',()=>{clearTimeout(timer);forced=null;clearMouse();frozen=true;game.done=true;game.reason='timeout';game.started=true;finish();closeTools();});
button('Katt: neste varsel',()=>{fixture();game.x=100;game.y=500;game.time=game.catSettings.first-1.7;game.started=true;frozen=false;});
button('Rider-galleri',()=>{
 const overlay=document.createElement('div');overlay.id='gallery';overlay.style='position:fixed;inset:104px 8px 44px;overflow:auto;z-index:40;background:#45633e;color:white';
 const close=document.createElement('button');close.textContent='Lukk galleri';close.onclick=()=>overlay.remove();overlay.append(close);
 const row=document.createElement('div');row.style='display:flex;flex-wrap:wrap';overlay.append(row);
 for(const spec of Object.values(KlippeMower.SPRITES).filter(s=>s.riderSprite)){const box=document.createElement('figure');box.style='margin:8px';const c=document.createElement('canvas');c.width=350;c.height=420;const cap=document.createElement('figcaption');cap.textContent=spec.name;box.append(c,cap);row.append(box);const g={x:44,y:57,angle:Math.PI/2,speed:0,travel:0},ctx=c.getContext('2d');KlippeMower.setAppearance(g,spec.id);function paint(){if(!overlay.isConnected)return;ctx.clearRect(0,0,350,420);ctx.save();ctx.scale(4,4);KlippeMower.draw(ctx,g);ctx.restore();requestAnimationFrame(paint);}requestAnimationFrame(paint);}
 document.body.append(overlay);closeTools();
});
// Optional DOM markers share the game's world/screen transform, never its physics.
const nestLayer=document.createElement('div');nestLayer.style='position:fixed;inset:0;pointer-events:none;z-index:19';document.body.append(nestLayer);let debugNests=null;
const normalObstacles=sceneRenderer.obstacles;sceneRenderer.obstacles=function(c){normalObstacles(c);if(!$('artShowColliders').checked)return;c.save();c.strokeStyle='#f7a3ff';c.lineWidth=1.5;for(const o of game.level.obstacles){c.beginPath();if(o.type==='rect')c.rect(o.x,o.y,o.w,o.h);else c.arc(o.x,o.y,o.r,0,Math.PI*2);c.stroke();}c.restore();};
function debug(){
 mowerSelect.value=KlippeMower.appearance(game).id;if(game.level.stage)levelSelect.value=String(game.level.stage);label();
 $('artCareer').textContent='QA-profil · nivå '+unlocked+' · '+mowerProgress.unlockedMowers.length+'/6 klippere · valgt '+KlippeMower.SPRITES[mowerProgress.selectedMower].name;
 const touched=game.waspNests.filter(n=>n.state!=='hidden').length,used=game.waspSpawns.length;
 document.getElementById('artCurrent').title='Karrierenivå '+unlocked+' · '+mowerProgress.unlockedMowers.length+' klippere · valgt '+mowerProgress.selectedMower;document.getElementById('artNests').textContent='Bol truffet: '+touched+'/'+game.waspNests.length+' · hendelser: '+used+'/4 · igjen: '+(game.waspNests.length-used);
 if(debugNests!==game.waspNests){debugNests=game.waspNests;nestLayer.replaceChildren();for(const n of debugNests){const mark=document.createElement('div');mark.style='position:absolute;border:2px dashed #e1a5ff;border-radius:50%;color:white;text-shadow:0 1px 3px #000;background:#66339930;font:bold 11px system-ui;display:grid;place-items:center;box-sizing:border-box';nestLayer.append(mark);}}
 nestLayer.hidden=!document.getElementById('artShowNests').checked||onMenu||paused||game.done;
 const r=canvas.getBoundingClientRect();[...nestLayer.children].forEach((mark,i)=>{const n=debugNests[i],p=viewport.worldToScreen(n.x,n.y),radius=Math.max(12,viewport.scale*game.mowRadius);mark.style.left=(r.left+p.x-radius)+'px';mark.style.top=(r.top+p.y-radius)+'px';mark.style.width=mark.style.height=radius*2+'px';mark.textContent=(i+1)+(n.state==='hidden'?'':n.state==='queued'?' · kø':' · brukt');});
}
const report=document.createElement('pre');report.id='artMetrics';report.style='display:none';document.body.append(report);setInterval(()=>{panel.hidden=(!onMenu&&(paused||game.done))||modalOpen();debug();report.textContent=JSON.stringify({mower:KlippeMower.appearance(game).id,careerProfile:{unlocked,...mowerProgress},profile:game.mower,mowRadius:game.mowRadius,nests:game.waspNests,waspSpawns:game.waspSpawns,wasp:game.nest,cat:{active:game.cat.active,warned:game.cat.warned,finished:game.cat.finished,passes:game.catPasses,nextAt:game.nextCatAt,settings:game.catSettings},time:game.time,penalty:game.penalty,speed:game.speed,steer:game.steer,travel:game.travel,frame:KlippeMower.animationFrame(game,last,settings.reduced),pose:KlippeMower.riderPose(game,{reduced:settings.reduced}),revision:KlippeAssets.revision(),reduced:settings.reduced,paused,frozen,coverage:game.coverage,position:{x:game.x,y:game.y,angle:game.angle},foreground:KlippeSceneData.forLevel(game.level).obstacleVisuals.filter(v=>v.layer==='foreground').map(v=>{const o=game.level.obstacles[v.colliderIndex];return KlippeScene.foregroundAlpha({...v,x:o.x,y:o.y,w:o.r*2*v.canopyFactor,h:o.r*2*v.canopyFactor},game);}),canvas:sceneRenderer.diagnostics()});},100);
select();
