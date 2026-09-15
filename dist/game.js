'use strict';
const {Game,P,recordKey,recordFlags,padInput}=Klippe,game=new Game(),canvas=document.getElementById('game'),ctx=canvas.getContext('2d'),$=id=>document.getElementById(id),keys=new Set();
let onMenu=true,paused=false,last=0,rings=[],book={},storageOK=true,noticeTime=0,cutLevel=0,padPause=false,hadPad=false;
const clippings=new KlippeClippings.System();
const mouse=new KlippeMouse.MouseInput();
const touch=new KlippeInput.TouchInput();let touchSeen=false,device={touch:false,portrait:false};
const settings={sound:true,volume:.55,reduced:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false};
try{const v=JSON.parse(localStorage.getItem('klippekaos-settings')||'{}');if(typeof v.sound==='boolean')settings.sound=v.sound;if(Number.isFinite(v.volume))settings.volume=Math.max(0,Math.min(1,v.volume));if(typeof v.reduced==='boolean')settings.reduced=v.reduced;}catch{storageOK=false;}
let unlocked=1,pendingScore=null;
try{const profile=KlippeProfile.load(localStorage);book=profile.book;unlocked=profile.unlocked;storageOK=storageOK&&profile.ok;}catch{storageOK=false;}
function saveProfile(){try{storageOK=KlippeProfile.save(localStorage,book,unlocked);}catch{storageOK=false;}}
function careerMenu(){
 const selected=$('careerLevel').value||'career1';$('careerLevel').replaceChildren();
 for(const level of Object.values(Klippe.careerLevels)){const option=document.createElement('option');option.value=level.id;option.textContent=level.stage+' · '+level.name+(level.stage>unlocked?' · låst':'');option.disabled=level.stage>unlocked;$('careerLevel').append(option);}
 $('careerLevel').value=selected;$('careerLabel').textContent=Klippe.careerLevels[selected].stage+' · '+Klippe.careerLevels[selected].name+' →';
}
function scoreGate(waiting){for(const id of ['again','resultMenu','nextLevel'])$(id).disabled=waiting;}

const sound={
 enabled:settings.sound,a:null,
 start(){if(!this.enabled)return;try{if(!this.a){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;this.a=new AC();const a=this.a;
 this.master=a.createGain();this.master.gain.value=settings.volume*.65;this.master.connect(a.destination);
 this.motor=a.createOscillator();this.motor.type='triangle';this.motor.frequency.value=42;this.motorGain=a.createGain();this.motorGain.gain.value=0;this.motor.connect(this.motorGain).connect(this.master);this.motor.start();
 const buffer=a.createBuffer(1,a.sampleRate,a.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
 this.noise=a.createBufferSource();this.noise.buffer=buffer;this.noise.loop=true;this.filter=a.createBiquadFilter();this.filter.type='bandpass';this.filter.frequency.value=1700;this.filter.Q.value=.6;this.cutGain=a.createGain();this.cutGain.gain.value=0;this.noise.connect(this.filter).connect(this.cutGain).connect(this.master);this.noise.start();this.boostVoices={};for(const type of ['speed','turn']){const o=a.createOscillator(),v=a.createGain();o.type=type==='speed'?'sine':'triangle';o.frequency.value=type==='speed'?190:430;v.gain.value=0;o.connect(v).connect(this.master);o.start();this.boostVoices[type]={o,v};}}
 if(this.a.state==='suspended')this.a.resume().catch(()=>{});}catch{this.enabled=false;$('sound').textContent='Lyd utilgjengelig';$('sound').setAttribute('aria-pressed','false');}},
 update(){if(!this.a)return;const t=this.a.currentTime,on=this.enabled&&!onMenu&&!paused&&game.started&&!game.done;this.master.gain.setTargetAtTime(this.enabled?settings.volume*.65:0,t,.04);this.motor.frequency.setTargetAtTime(40+Math.abs(game.speed)*.62-game.heavyLoad*15,t,.07);this.motorGain.gain.setTargetAtTime(on?.08+Math.abs(game.speed)/P.maxSpeed*.04+game.heavyLoad*.025:0,t,.07);this.cutGain.gain.setTargetAtTime(on?Math.min(.18,cutLevel*.12):0,t,.045);for(const type of ['speed','turn']){const voice=this.boostVoices[type];voice.v.gain.setTargetAtTime(on&&game.active[type]?.045:0,t,.045);voice.o.frequency.setTargetAtTime(type==='speed'?190+Math.abs(game.speed)*.6:410+Math.abs(game.steer)*100,t,.08);}},
 chime(type){if(!this.enabled||!this.a)return;const a=this.a,o=a.createOscillator(),gain=a.createGain();o.type=type==='wasps'?'sawtooth':type==='cat-warning'?'triangle':'sine';o.frequency.value=type==='wasps'?150:type==='cat-warning'?520:type==='milestone-50'?880:['sting','damage'].includes(type)?180:type==='collision'?90:type==='pickup-turn'?820:type==='pickup-speed'?660:650;gain.gain.setValueAtTime(.055,a.currentTime);gain.gain.exponentialRampToValueAtTime(.001,a.currentTime+.24);o.frequency.exponentialRampToValueAtTime(type==='wasps'?110:type==='cat-warning'?740:type==='milestone-50'?1175:type==='sting'?95:900,a.currentTime+.18);o.connect(gain).connect(this.master);o.start();o.stop(a.currentTime+.25);o.onended=()=>{o.disconnect();gain.disconnect();};}
};
function lawnPath(c){KlippeAssets.path(c,game.level);}
const lawnRenderer=KlippeLawn.create(game,P),sceneRenderer=KlippeScene.create(game,P);
let viewport=KlippeViewport.fit(900,580);
function initGrass(){sceneRenderer.reset();lawnRenderer.reset({scale:onMenu?1:fitScene().scale,dpr:onMenu?1:devicePixelRatio});}
function notify(message,duration=1.8){$('notice').classList.toggle('hazard-notice',message==='JORDVEPS!'||message==='PASS PÅ KATTEN!');$('notice').textContent=message;$('notice').hidden=false;$('notice').style.opacity=1;noticeTime=duration;}
function eventFeedback(event){
 if(event==='wasps')notify('JORDVEPS!',2);
 else if(event==='flowers')notify('La markblomstene stå · poengtrekk',1.8);
 else if(event==='sting')notify('VEPS! Samlet trekk: −'+game.penalty+' poeng',2);
 else if(event==='escaped')notify('Du kom deg unna',2);
 else if(event.startsWith('pickup-'))notify((event==='pickup-speed'?'BOOST · Fart':'BOOST · Manøver')+' fylt på',2);
 else if(event.startsWith('milestone-'))notify(event==='milestone-50'?'HALVVEIS!':event.split('-')[1]+' % · Fin flyt!',1.8);
 if(event==='damage-warning')notify('Aggregatet varmer plenen · kjør litt videre',2);
 if(event==='damage')notify('En slitt flekk · −60 poeng',2.5);
 if(event==='find')notify('Noe lå under gresset!',1.5);
 if(event==='find-collected')notify('Liten energireserve! +0,6 s til begge',2.5);
 if(event==='cat-warning')notify(game.cat.variant==='blender'?'PASS DEG FOR BLENDER!':'PASS PÅ KATTEN!',2.5);

 if(event==='cat-gone')notify('Pus er trygt videre',1.5);
 if(event.startsWith('pickup-')||event==='find-collected')rings.push({x:game.x,y:game.y,life:.65,color:event==='pickup-turn'?'#bd9bdd':'#bce8ad'});
 sound.chime(event);
}
function cutVisual(e){
 if(!e)return;for(const event of e.events)eventFeedback(event);lawnRenderer.cut(e);
 if(!e.moved||!e.fresh)return;cutLevel=1;
 clippings.emit(e,game,{reduced:settings.reduced,mobile:device.touch});
}
function fitScene(){
 if(onMenu)return KlippeViewport.fit(900,580);
 const r=canvas.getBoundingClientRect(),hud=$('sceneHud').getBoundingClientRect(),foot=$('sceneFooter').getBoundingClientRect();
 const safe=getComputedStyle($('sceneHud'));
 return KlippeViewport.fit(r.width,r.height,{x:0,y:0,w:P.width,h:P.height},KlippeViewport.sceneInsets({touch:device.touch,compact:document.body.classList.contains('compact-touch'),hudHeight:hud.bottom-r.top,footerHeight:r.bottom-foot.top,paddingLeft:parseFloat(safe.paddingLeft)||0,paddingRight:parseFloat(safe.paddingRight)||0}));
}
function draw(){
 if(!onMenu)$('play').style.setProperty('--scene-top',($('sceneHud').getBoundingClientRect().bottom+8)+'px');KlippeViewport.begin(canvas,ctx,viewport,onMenu?1:devicePixelRatio);
 lawnRenderer.resize(viewport.scale,onMenu?1:devicePixelRatio);sceneRenderer.background(ctx,viewport);lawnRenderer.draw(ctx);sceneRenderer.obstacles(ctx);
 KlippeActors.draw(ctx,game,P,{last,settings,cutLevel,rings,particles:clippings.items});sceneRenderer.foreground(ctx);KlippeActors.effects(ctx,clippings.items);
}

function time(t){const seconds=Math.max(0,Math.floor(t+1e-7));return Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');}
function pct(n){return(n*100).toFixed(1).replace('.',',');}
function scoreText(n){return Math.round(n).toLocaleString('nb-NO');}
function hud(){
 $('liveScore').textContent=scoreText(game.result().score);
 const early=game.earlyFinishPenalty();$('finishEarly').hidden=early===null;$('finishEarly').disabled=paused||modalOpen();if(early!==null)$('finishEarly').textContent='Ferdig nå · −'+early;

 $('coverage').innerHTML=(game.coverage>=P.finish?'100':pct(game.coverage))+' <small>%</small>';
 $('timeLabel').textContent=game.mode==='timed'?'TID IGJEN':'TID';$('time').textContent=time(game.mode==='timed'?Math.ceil(game.remaining):game.time);$('time').classList.toggle('urgent',game.mode==='timed'&&game.remaining<=10);
 $('overlap').innerHTML=pct(game.overlap)+' <small>%</small>';$('hint').hidden=game.started;
 $('touchControls').hidden=!device.touch||onMenu||paused||game.done||device.portrait||modalOpen();
 $('pauseButton').disabled=game.done;
 for(const type of ['speed','turn']){
  const active=game.active[type]&&!paused&&!onMenu&&!game.done,empty=game.energy[type]<.01;
  $(type+'Energy').max=game.mower.boostCapacity;$(type+'Energy').value=game.energy[type];$(type+'Value').textContent=game.energy[type].toFixed(1).replace('.',',')+' s';
  $(type+'Energy').parentElement.classList.toggle('active',active);$(type+'Energy').parentElement.classList.toggle('empty',empty);
  $(type+'State').textContent=active?'AKTIV':empty?'TOM':'KLAR';
 }
}
function renderRows(target,runs,compact=false){
 $(target).replaceChildren();runs.forEach((r,i)=>{const tr=document.createElement('tr');const values=compact?[i+1,r.initials||'—',scoreText(r.score),time(r.time),pct(r.coverage)+' %']:[i+1,r.initials||'—',scoreText(r.score),time(r.time),pct(r.coverage)+' %',pct(r.overlap)+' %'];for(const v of values){const td=document.createElement('td');td.textContent=v;tr.append(td);}$(target).append(tr);});
}
function records(){
 const b=book[recordKey(game)];renderRows('runs',b?.runs||[]);$('storageNote').hidden=storageOK;
 $('recordSummary').textContent=b?'Beste score: '+scoreText(b.score):'Ingen forsøk ennå';
 $('recordBest').textContent=b?'Beste score: '+scoreText(b.score)+(b.time!==null?' · Beste fullføringstid: '+time(b.time):'')+' · Laveste overlapp: '+pct(b.overlap)+' %':'Ingen resultater i denne hagen og modusen ennå.';
}
function finish(){
 const r=game.result();
 if(r.failed){clearTouch();keys.clear();$('notice').hidden=true;$('gameOver').hidden=false;$('retryCat').focus();sound.chime('collision');return;}
 const flags=recordFlags(book,r);unlocked=KlippeProfile.advance(unlocked,r);saveProfile();careerMenu();
 pendingScore=KlippeProfile.qualifies(book,r)?r:null;$('initialsForm').hidden=!pendingScore;$('initials').value='';$('scoreSaved').hidden=true;scoreGate(!!pendingScore);
 $('nextLevel').hidden=!(r.completed&&game.level.stage&&game.level.stage<5);
 $('resultEyebrow').textContent=r.reason==='early-complete'?'Ferdig nå · −'+r.breakdown.earlyFinish+' poeng':r.completed?'NYKLIPT OG NYDELIG':'DITT FORSØK · 60 SEKUNDER';
 $('resultTitle').textContent=r.reason==='early-complete'?'FULLFØRT TIDLIG':r.completed?'FULLFØRT':'GODT KLIPPET!';$('score').textContent=scoreText(r.score);$('rank').textContent='Rang '+r.rank;
 $('personalBests').replaceChildren();for(const [key,label] of [['score','NY REKORD'],['time','NY BESTE TID'],['overlap','NY LAVESTE OVERLAPP']])if(flags[key]){const span=document.createElement('span');span.textContent=label;$('personalBests').append(span);}
 $('endCoverage').textContent=r.mode==='timed'?'Du klippet '+pct(r.coverage)+' % på '+Number(r.time.toFixed(1)).toLocaleString('nb-NO')+' sekunder':(r.reason==='early-complete'?pct(r.actualCoverage):r.completed?'100':pct(r.coverage))+' % klippet';$('endTime').textContent=time(r.time);$('endOverlap').textContent=pct(r.overlap)+' %';
 $('endCollisions').textContent=r.collisions+' (−'+r.breakdown.collisions+' p)';$('endDamage').textContent=r.damage+' (−'+r.breakdown.damage+' p)';$('endPenalty').textContent='−'+r.penalty+' p';
 $('endHeavy').textContent=pct(r.heavyTotal?r.heavyCut/r.heavyTotal:0)+' %';
 $('endFlowers').textContent=pct(r.flowerTotal?r.flowerCut/r.flowerTotal:0)+' % (−'+r.breakdown.flowers+' p)';
 for(const [id,value] of [['endCollisions',r.collisions],['endDamage',r.damage],['endPenalty',r.penalty],['endHeavy',r.heavyCut],['endFlowers',r.flowerCut]])$(id).parentElement.hidden=!value;
 $('scoreBreakdown').textContent='Dekning og tid: '+scoreText(r.breakdown.base)+' p. '+[['earlyFinish','Ferdig nå'],['overlap','Overlapp'],['collisions','Kollisjoner'],['damage','Plenskade'],['wasps','Veps'],['flowers','Markblomster']].map(([key,label])=>label+': −'+r.breakdown[key]).join('. ')+'. Sum (minst 0): '+scoreText(r.score)+' p.';
 clearTouch();
 const b=book[recordKey(r)];$('best').textContent=game.level.name+' · '+(game.mode==='timed'?'Tidspress':'Full plen');renderRows('resultRuns',b?.runs||[],true);
 $('notice').hidden=true;$('result').hidden=false;$('again').focus({preventScroll:true});$('result').querySelector('.card').scrollTop=0;records();if(pendingScore)$('initials').focus({preventScroll:true});sound.chime('finish');
}
function reset(){
 pendingScore=null;scoreGate(false);$('initialsForm').hidden=true;
 game.eventOptions.seed=Math.floor(Math.random()*4294967296);game.reset($('mode').value,game.garden);keys.clear();clearTouch();clippings.clear();rings=[];cutLevel=0;paused=false;accumulator=0;noticeTime=0;
 $('gameOver').hidden=true;$('result').hidden=true;$('pause').hidden=true;$('notice').hidden=true;$('gardenName').textContent=game.level.name;$('currentLevel').textContent=game.level.stage?game.level.stage+' · '+game.level.name:game.level.name;
 $('modeGoal').textContent=game.mode==='timed'?'Hvor mye klarer du å klippe på 60 sekunder?':game.level.intro|| (game.garden==='garden3'?'Klipp plenen · la markblomstene stå · mørkt gress er tyngre':'Klipp hele plenen og finn flyten');
 $('hint').textContent=device.touch?'Hold Gass · sving med venstre tommel':'Venstre: kjør · Høyre: rygg · flytt musen for å styre' ;
 initGrass();hud();records();canvas.focus();
}
function startGame(mode,garden){
 onMenu=false;$('menu').hidden=true;$('play').hidden=false;$('mode').value=mode;game.garden=garden;
 $('mode').disabled=!!Klippe.careerLevels[garden];reset();sound.start();window.scrollTo(0,0);
}
function showMenu(){
 careerMenu();onMenu=true;paused=false;keys.clear();clearTouch();clippings.clear();rings=[];cutLevel=0;accumulator=0;
 $('menu').hidden=false;$('play').hidden=true;$('result').hidden=true;$('pause').hidden=true;
 game.reset('normal',$('timedGarden').value);initGrass();sound.update();
 const b=book[recordKey(game)];$('menuRecord').textContent=b?'Din beste score her: '+scoreText(b.score):'Klar for første runde?';
 $('career').focus();window.scrollTo(0,0);
}
function pause(value){if(onMenu||game.done)return;paused=value;keys.clear();clearTouch();cutLevel=0;$('pause').hidden=!value;if(value)$('resume').focus();else canvas.focus();sound.update();}
function saveSettings(){
 settings.sound=sound.enabled;$('sound').textContent=sound.enabled?'Lyd på':'Lyd av';$('sound').setAttribute('aria-pressed',String(sound.enabled));$('soundSetting').checked=sound.enabled;
 try{localStorage.setItem('klippekaos-settings',JSON.stringify(settings));}catch{storageOK=false;}sound.update();
}
function openSettings(){if(!onMenu&&!game.done)pause(true);$('settingsDialog').showModal();}
function openAbout(){if(!onMenu&&!game.done)pause(true);$('aboutDialog').showModal();}
function modalOpen(){return !!document.querySelector('dialog[open]');}
const playKeys=['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','shift','e',' '];
document.addEventListener('keydown',e=>{
 if(onMenu||modalOpen()||['SELECT','INPUT','TEXTAREA'].includes(e.target.tagName))return;const k=e.key.toLowerCase();
 if(playKeys.includes(k)&&!(k===' '&&e.target.tagName==='BUTTON')){e.preventDefault();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k))clearMouse();keys.add(k);sound.start();}
 if(k==='escape'&&!e.repeat)pause(!paused);
});
document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{keys.clear();if(game.started&&!game.done&&!onMenu)pause(true);});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&game.started&&!onMenu)pause(true);});
$('careerLevel').onchange=careerMenu;
$('career').onclick=()=>{const level=Klippe.careerLevels[$('careerLevel').value];if(level&&level.stage<=unlocked)startGame('normal',level.id);};
$('nextLevel').onclick=()=>{if(game.level.stage<unlocked)startGame('normal','career'+(game.level.stage+1));};
// Keep the existing form reachable when a soft keyboard reduces the visual viewport.
function fitResultViewport(event){
 const viewport=window.visualViewport,overlay=$('result');
 overlay.style.setProperty('--result-height',(viewport?.height||innerHeight)+'px');
 overlay.style.setProperty('--result-top',(viewport?.offsetTop||0)+'px');
 if(event?.type==='scroll')return;
 requestAnimationFrame(()=>{
  if(overlay.hidden||document.activeElement!==$('initials'))return;
  const card=overlay.querySelector('.card'),form=$('initialsForm'),c=card.getBoundingClientRect(),f=form.getBoundingClientRect();
  if(f.top<c.top+8||f.bottom>c.bottom-8)card.scrollTop+=f.top-c.top-(card.clientHeight-f.height)/2;
 });
}
window.addEventListener('resize',fitResultViewport);
window.visualViewport?.addEventListener('resize',fitResultViewport);
window.visualViewport?.addEventListener('scroll',fitResultViewport);
$('initials').addEventListener('focus',fitResultViewport);
fitResultViewport();
$('initials').oninput=()=>{$('initials').value=KlippeProfile.normalizeInitials($('initials').value);};
$('initialsForm').onsubmit=e=>{e.preventDefault();const initials=KlippeProfile.normalizeInitials($('initials').value);if(!pendingScore||!KlippeProfile.validInitials(initials))return;book=KlippeProfile.submit(book,pendingScore,initials);pendingScore=null;saveProfile();scoreGate(false);$('initialsForm').hidden=true;$('scoreSaved').hidden=false;$('scoreSaved').textContent=storageOK?'Highscore lagret!':'Highscore beholdes bare i denne økten.';renderRows('resultRuns',book[recordKey(game)]?.runs||[],true);records();$('nextLevel').hidden?$('again').focus({preventScroll:true}):$('nextLevel').focus({preventScroll:true});};
$('timeTrial').onclick=()=>startGame('timed',$('timedGarden').value);
$('testGarden').onclick=()=>startGame('normal','garden2');
$('organicGarden').onclick=()=>startGame('normal','garden3');
$('timedGarden').onchange=()=>{game.reset('normal',$('timedGarden').value);initGrass();const b=book[recordKey(game)];$('menuRecord').textContent=b?'Din beste score her: '+scoreText(b.score):'Klar for første runde?';};
$('howButton').onclick=()=>$('helpDialog').showModal();$('settingsButton').onclick=openSettings;$('pauseSettings').onclick=openSettings;$('aboutButton').onclick=openAbout;$('pauseAbout').onclick=openAbout;
document.querySelectorAll('[data-close]').forEach(button=>button.onclick=()=>$(button.dataset.close).close());
$('soundSetting').checked=settings.sound;$('volumeSetting').value=Math.round(settings.volume*100);$('motionSetting').checked=settings.reduced;
$('soundSetting').onchange=()=>{sound.enabled=$('soundSetting').checked;if(sound.enabled)sound.start();saveSettings();};
$('volumeSetting').oninput=()=>{settings.volume=Number($('volumeSetting').value)/100;sound.start();saveSettings();};
$('motionSetting').onchange=()=>{settings.reduced=$('motionSetting').checked;if(settings.reduced)clippings.clear();saveSettings();};
$('finishEarly').onclick=()=>{if(!paused&&!modalOpen()&&game.finishEarly()){clearTouch();keys.clear();hud();finish();}};
$('retryCat').onclick=reset;$('gameOverMenu').onclick=()=>{$('gameOver').hidden=true;showMenu();};$('restart').onclick=reset;$('again').onclick=reset;$('resume').onclick=()=>{sound.start();pause(false);};$('mode').onchange=reset;
for(const id of ['menuButton','pauseMenu','resultMenu'])$(id).onclick=showMenu;
const clearMouse=KlippeMouse.bind(canvas,mouse,{enabled:()=>!onMenu&&!paused&&!game.done&&!device.portrait&&!modalOpen(),onStart:()=>{canvas.focus();sound.start();}});
$('sound').onclick=()=>{if(sound.enabled&&(!sound.a||sound.a.state==='suspended'))sound.start();else{sound.enabled=!sound.enabled;if(sound.enabled)sound.start();}saveSettings();};
// All input devices produce the same small command object consumed by Game.step.
// Touch, keyboard and gamepad share the existing throttle/steering contract.
function controls(){
 let pad;try{pad=Array.from(navigator.getGamepads?.()||[]).find(p=>p&&p.connected&&p.mapping==='standard');}catch{}
 if(hadPad&&!pad&&game.started&&!game.done&&!onMenu)pause(true);hadPad=!!pad;
 const p=padInput(pad);if(p.pause&&!padPause&&!onMenu&&!modalOpen())pause(!paused);padPause=!!p.pause;
 const throttle=(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0),steering=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
 const t=touch.read(),m=mouse.read(game,viewport,canvas.getBoundingClientRect());return KlippeMouse.arbitrate(mouse.active,m,{throttle,steering,speedBoost:keys.has('shift'),turnBoost:keys.has('e')||keys.has(' ')},t,p);
}
function clearTouch(){clearMouse();touch.clear();document.querySelectorAll('[data-touch]').forEach(el=>el.classList.remove('held'));$('stickKnob').style.transform='translate(0,0)';}
function fitPlayViewport(){
 const height=Math.min(innerHeight,window.visualViewport?.height||innerHeight),width=Math.min(innerWidth,window.visualViewport?.width||innerWidth);
 $('play').style.setProperty('--play-height',height+'px');
 document.body.classList.toggle('compact-touch',!device.portrait&&KlippeViewport.compactTouch(width,height,device.touch));
}
window.visualViewport?.addEventListener('resize',fitPlayViewport);
function updateDevice(){
 const previous=device;device=KlippeInput.deviceState({maxTouchPoints:navigator.maxTouchPoints,coarse:matchMedia('(pointer: coarse)').matches,hover:matchMedia('(hover: hover)').matches,width:innerWidth,height:innerHeight,touchSeen});
 document.body.classList.toggle('touch-device',device.touch);fitPlayViewport();$('rotatePrompt').hidden=!device.portrait;document.body.classList.toggle('portrait-prompt',device.portrait);$('menu').inert=device.portrait;$('play').inert=device.portrait;
 $('fullscreenButton').hidden=!device.touch||!document.fullscreenEnabled;
 if(device.portrait&&!previous.portrait){for(const dialog of document.querySelectorAll('dialog[open]'))dialog.close();clearTouch();if(!onMenu&&!game.done)pause(true);}
}
const coarseQuery=matchMedia('(pointer: coarse)');coarseQuery.addEventListener('change',updateDevice);matchMedia('(hover: hover)').addEventListener('change',updateDevice);window.addEventListener('resize',updateDevice);
document.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&!touchSeen){touchSeen=true;updateDevice();}},{capture:true});
for(const el of document.querySelectorAll('[data-touch]')){
 const action=el.dataset.touch;
 function position(e){const r=el.getBoundingClientRect();return {x:e.clientX-r.left-r.width/2,y:e.clientY-r.top-r.height/2,radius:r.width*.34};}
 el.addEventListener('pointerdown',e=>{if(onMenu||paused||game.done||device.portrait||modalOpen())return;e.preventDefault();const p=position(e);if(!touch.down(e.pointerId,action,p.x,p.radius))return;el.setPointerCapture(e.pointerId);el.classList.add('held');sound.start();if(action==='steer')move(e);});
 function move(e){if(!touch.pointers.has(e.pointerId)||action!=='steer')return;const p=position(e);touch.move(e.pointerId,p.x,p.radius);const length=Math.hypot(p.x,p.y)||1,f=Math.min(1,p.radius/length);$('stickKnob').style.transform='translate('+p.x*f+'px,'+p.y*f+'px)';}
 el.addEventListener('pointermove',move);
 function release(e){touch.up(e.pointerId);el.classList.toggle('held',[...touch.pointers.values()].some(p=>p.action===action));if(action==='steer'&&![...touch.pointers.values()].some(p=>p.action==='steer'))$('stickKnob').style.transform='translate(0,0)';}
 for(const event of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(event,release);
 el.addEventListener('contextmenu',e=>e.preventDefault());
}
window.addEventListener('blur',clearTouch);document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTouch();});
$('pauseButton').onclick=()=>pause(true);
$('fullscreenButton').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{notify('Fullskjerm er ikke tilgjengelig her');}};
document.addEventListener('fullscreenchange',()=>{$('fullscreenButton').textContent=document.fullscreenElement?'Avslutt fullskjerm':'Fullskjerm';updateDevice();});
updateDevice();
let accumulator=0;
function frame(now){
 const dt=Math.min((now-last)/1000||0,.08);last=now;viewport=fitScene();const input=controls();
 if(!onMenu&&!paused&&!game.done&&!modalOpen()&&!device.portrait){
  accumulator+=dt;while(accumulator>=1/120){cutVisual(game.step(1/120,input));accumulator-=1/120;if(game.done){finish();break;}}
  clippings.update(dt,settings.reduced);for(const r of rings)r.life-=dt;rings=rings.filter(r=>r.life>0);
  cutLevel=Math.max(0,cutLevel-dt*5);if(noticeTime>0){noticeTime-=dt;$('notice').style.opacity=Math.min(1,noticeTime/.4);if(noticeTime<=0)$('notice').hidden=true;}
 }else accumulator=0;
 draw();hud();sound.update();
 if(onMenu){const c=$('menuPreview').getContext('2d');c.clearRect(0,0,900,580);c.drawImage(canvas,0,0);}
 requestAnimationFrame(frame);
}
careerMenu();initGrass();records();saveSettings();requestAnimationFrame(frame);
