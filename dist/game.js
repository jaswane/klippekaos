'use strict';
const {Game,P,obstacles,recordRun,recordKey,recordFlags,padInput,inPatch,wildflowerAt}=Klippe,game=new Game(),canvas=document.getElementById('game'),ctx=canvas.getContext('2d'),$=id=>document.getElementById(id),keys=new Set();
let onMenu=true,paused=false,last=0,rings=[],particles=[],book={},storageOK=true,noticeTime=0,cutLevel=0,padPause=false,hadPad=false;
const touch=new KlippeInput.TouchInput();let touchSeen=false,device={touch:false,portrait:false};
const settings={sound:true,volume:.55,reduced:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false};
try{const v=JSON.parse(localStorage.getItem('klippekaos-settings')||'{}');if(typeof v.sound==='boolean')settings.sound=v.sound;if(Number.isFinite(v.volume))settings.volume=Math.max(0,Math.min(1,v.volume));if(typeof v.reduced==='boolean')settings.reduced=v.reduced;const saved=JSON.parse(localStorage.getItem('klippekaos-p04')||'{}');if(saved&&typeof saved==='object')for(const garden of ['garden1','garden2','garden3'])for(const mode of ['normal','timed']){const key=garden+':'+mode,r=saved[key];if(r&&Array.isArray(r.runs)&&Number.isFinite(r.score)&&Number.isFinite(r.overlap)&&(r.time===null||Number.isFinite(r.time)))book[key]={...r,runs:r.runs.filter(x=>x&&[x.score,x.time,x.coverage,x.overlap].every(Number.isFinite)).slice(0,5)};}}catch{storageOK=false;}
const lawn=document.createElement('canvas');lawn.width=900;lawn.height=580;const g=lawn.getContext('2d'),grass=document.createElement('canvas');grass.width=900;grass.height=580;const tall=grass.getContext('2d');
let seed=14;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
function rounded(c,x,y,w,h,r,fill){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();}
function circle(c,x,y,r,fill){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=fill;c.fill();}
const sound={
 enabled:settings.sound,a:null,
 start(){if(!this.enabled)return;try{if(!this.a){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;this.a=new AC();const a=this.a;
 this.master=a.createGain();this.master.gain.value=settings.volume*.65;this.master.connect(a.destination);
 this.motor=a.createOscillator();this.motor.type='triangle';this.motor.frequency.value=42;this.motorGain=a.createGain();this.motorGain.gain.value=0;this.motor.connect(this.motorGain).connect(this.master);this.motor.start();
 const buffer=a.createBuffer(1,a.sampleRate,a.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
 this.noise=a.createBufferSource();this.noise.buffer=buffer;this.noise.loop=true;this.filter=a.createBiquadFilter();this.filter.type='bandpass';this.filter.frequency.value=1700;this.filter.Q.value=.6;this.cutGain=a.createGain();this.cutGain.gain.value=0;this.noise.connect(this.filter).connect(this.cutGain).connect(this.master);this.noise.start();this.boostVoices={};for(const type of ['speed','turn']){const o=a.createOscillator(),v=a.createGain();o.type=type==='speed'?'sine':'triangle';o.frequency.value=type==='speed'?190:430;v.gain.value=0;o.connect(v).connect(this.master);o.start();this.boostVoices[type]={o,v};}}
 if(this.a.state==='suspended')this.a.resume().catch(()=>{});}catch{this.enabled=false;$('sound').textContent='Lyd utilgjengelig';$('sound').setAttribute('aria-pressed','false');}},
 update(){if(!this.a)return;const t=this.a.currentTime,on=this.enabled&&!onMenu&&!paused&&game.started&&!game.done;this.master.gain.setTargetAtTime(this.enabled?settings.volume*.65:0,t,.04);this.motor.frequency.setTargetAtTime(40+Math.abs(game.speed)*.62-game.heavyLoad*15,t,.07);this.motorGain.gain.setTargetAtTime(on?.08+Math.abs(game.speed)/P.maxSpeed*.04+game.heavyLoad*.025:0,t,.07);this.cutGain.gain.setTargetAtTime(on?Math.min(.18,cutLevel*.12):0,t,.045);for(const type of ['speed','turn']){const voice=this.boostVoices[type];voice.v.gain.setTargetAtTime(on&&game.active[type]?.045:0,t,.045);voice.o.frequency.setTargetAtTime(type==='speed'?190+Math.abs(game.speed)*.6:410+Math.abs(game.steer)*100,t,.08);}},
 chime(type){if(!this.enabled||!this.a)return;const a=this.a,o=a.createOscillator(),gain=a.createGain();o.type='sine';o.frequency.value=['sting','damage'].includes(type)?180:type==='collision'?90:type==='pickup-turn'?820:type==='pickup-speed'?660:650;gain.gain.setValueAtTime(.055,a.currentTime);gain.gain.exponentialRampToValueAtTime(.001,a.currentTime+.24);o.frequency.exponentialRampToValueAtTime(type==='sting'?95:900,a.currentTime+.18);o.connect(gain).connect(this.master);o.start();o.stop(a.currentTime+.25);o.onended=()=>{o.disconnect();gain.disconnect();};}
};
function lawnPath(c){c.beginPath();game.level.polygon.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();}
function initGrass(){
 const obstacles=game.level.obstacles;
 seed=14;g.clearRect(0,0,900,580);tall.clearRect(0,0,900,580);const l=P.lawn;
 g.save();lawnPath(g);g.clip();g.fillStyle='#acd675';g.fillRect(l.x,l.y,l.w,l.h);
 for(let i=0;i<12000;i++){let x=l.x+random()*l.w,y=l.y+random()*l.h;g.fillStyle=i%3?'#a2cc69':'#bcdf8b';g.fillRect(x,y,1+random()*2,1);}
 g.restore();tall.save();lawnPath(tall);tall.clip();tall.fillStyle='#478438';tall.fillRect(l.x,l.y,l.w,l.h);
 tall.save();tall.beginPath();tall.rect(l.x,l.y,l.w,l.h);tall.clip();
 for(let i=0;i<14000;i++){let x=l.x+random()*l.w,y=l.y+random()*l.h;tall.strokeStyle=['#659c43','#58923e','#3c7532','#78a64c'][i%4];tall.lineWidth=1;tall.beginPath();tall.moveTo(x,y);tall.lineTo(x+1.5,y-2.5-random()*3);tall.stroke();}tall.restore();tall.restore();
 // Tall terrain and tiny ordinary flowers share the existing erasing mask.
 tall.save();lawnPath(tall);tall.clip();
 for(const p of game.level.heavy||[]){tall.fillStyle='#315f35';tall.beginPath();tall.ellipse(p.x,p.y,p.rx,p.ry,0,0,Math.PI*2);tall.fill();for(let i=0;i<550;i++){const x=p.x+(random()*2-1)*p.rx,y=p.y+(random()*2-1)*p.ry;if(!inPatch(x,y,[p]))continue;tall.strokeStyle=i%2?'#71924f':'#578447';tall.beginPath();tall.moveTo(x,y);tall.lineTo(x-2,y-7);tall.lineTo(x+2,y-4);tall.stroke();}}
 for(let i=0;i<100;i++){const x=70+random()*760,y=65+random()*450;if(!Klippe.mowable(x,y,game.garden))continue;for(let j=0;j<3;j++)circle(tall,x+Math.cos(j*2.1)*2,y+Math.sin(j*2.1)*2,1.5,'#eee8bd');circle(tall,x,y,.9,'#e4ba55');}
 for(const p of game.level.wildflowers||[]){tall.fillStyle='#527952';tall.beginPath();tall.ellipse(p.x,p.y,p.rx,p.ry,0,0,Math.PI*2);tall.fill();for(let i=0;i<85;i++){const x=p.x+(random()*2-1)*p.rx,y=p.y+(random()*2-1)*p.ry;if(!wildflowerAt(x,y,game.garden))continue;tall.strokeStyle='#a7b778';tall.beginPath();tall.moveTo(x,y+5);tall.lineTo(x,y-2);tall.stroke();for(let j=0;j<5;j++)circle(tall,x+Math.cos(j*1.257)*3,y-2+Math.sin(j*1.257)*3,2,['#ecbdc5','#ebd89a','#c2b5de','#f6efd7'][i%4]);circle(tall,x,y-2,1.3,'#dcad47');}}
 tall.restore();
 // Visible soil is excluded by the same four-unit geometry used in the score mask.
 for(const o of obstacles){for(const c of [g,tall]){c.save();c.globalCompositeOperation='destination-out';if(o.type==='circle')circle(c,o.x,o.y,o.r+P.trim,'#000');else rounded(c,o.x-P.trim,o.y-P.trim,o.w+2*P.trim,o.h+2*P.trim,P.trim,'#000');c.restore();}}
}
function notify(message,duration=1.8){$('notice').textContent=message;$('notice').hidden=false;$('notice').style.opacity=1;noticeTime=duration;}
function eventFeedback(event){
 if(event==='wasps')notify('VEPS! Kjør unna',2);
 else if(event==='flowers')notify('La markblomstene stå · poengtrekk',1.8);
 else if(event==='sting')notify('VEPS! Samlet trekk: −'+game.penalty+' poeng',2);
 else if(event==='escaped')notify('Du kom deg unna',2);
 else if(event.startsWith('pickup-'))notify((event==='pickup-speed'?'BOOST · Fart':'BOOST · Manøver')+' fylt på',2);
 else if(event.startsWith('milestone-'))notify(event.split('-')[1]+' % · Fin flyt!',1.8);
 if(event==='damage-warning')notify('Aggregatet varmer plenen · kjør litt videre',2);
 if(event==='damage')notify('En slitt flekk · −60 poeng',2.5);
 if(event==='find')notify('Noe lå under gresset!',1.5);
 if(event==='find-collected')notify('Liten energireserve! +0,6 s til begge',2.5);
 if(event==='cat-warning')notify('KATT! Styr unna · treff avslutter runden',2.5);

 if(event==='cat-gone')notify('Pus er trygt videre',1.5);
 if(event.startsWith('pickup-')||event==='find-collected')rings.push({x:game.x,y:game.y,life:.65,color:event==='pickup-turn'?'#bd9bdd':'#bce8ad'});
 if(event!=='wasps')sound.chime(event);
}
function cutVisual(e){
 if(!e)return;for(const event of e.events)eventFeedback(event);if(!e.moved)return;
 tall.save();tall.globalCompositeOperation='destination-out';tall.lineWidth=P.deck*2;tall.lineCap='round';tall.beginPath();tall.moveTo(e.fromX,e.fromY);tall.lineTo(e.x,e.y);tall.stroke();tall.restore();
 if(e.fresh>0){cutLevel=1;
 // Shade each newly cut logical cell once. Repeated frames never darken a patch.
 g.save();g.globalCompositeOperation='source-atop';g.fillStyle=Math.sin(game.angle)<0?'#edfac224':'#466d251a';for(const i of e.cells)g.fillRect((i%game.nx)*P.cell,Math.floor(i/game.nx)*P.cell,P.cell,P.cell);g.restore();
 for(let i=0;i<Math.min(4,Math.ceil(e.fresh/9));i++)if(!settings.reduced&&particles.length<400)particles.push({x:e.x+Math.sin(game.angle)*19,y:e.y-Math.cos(game.angle)*19,vx:(random()-.5)*60,vy:(random()-.5)*60,life:.25+random()*.35});}
}

function draw(){const obstacles=game.level.obstacles;ctx.clearRect(0,0,900,580);ctx.fillStyle='#dce1cf';ctx.fillRect(0,0,900,580);for(let y=16;y<580;y+=31)for(let x=15;x<900;x+=43){rounded(ctx,x,y,37,25,4,(x+y)%2?'#d1d8c5':'#d5dcc9');}lawnPath(ctx);ctx.strokeStyle='#eef0da';ctx.lineJoin='round';ctx.lineWidth=12;ctx.stroke();ctx.strokeStyle='#8b9c7e';ctx.lineWidth=5;ctx.strokeRect(P.drive.x,P.drive.y,P.drive.w,P.drive.h);for(const o of obstacles){if(o.type==='circle')circle(ctx,o.x,o.y,o.r+P.trim,'#bba782');else rounded(ctx,o.x-P.trim,o.y-P.trim,o.w+P.trim*2,o.h+P.trim*2,P.trim,'#bba782');}ctx.drawImage(lawn,0,0);ctx.drawImage(grass,0,0);ctx.strokeStyle='#34562a35';ctx.lineWidth=5;lawnPath(ctx);ctx.stroke();
ctx.save();lawnPath(ctx);ctx.clip();for(const p of game.damage){circle(ctx,p.x,p.y,P.damageRadius,'#a5824e');for(let i=0;i<8;i++){let a=i*2.4;circle(ctx,p.x+Math.cos(a)*7,p.y+Math.sin(a)*7,2,'#bc9b65');}}ctx.restore();
if(game.idleTime>=P.damageWarn&&!game.damage.some(p=>Math.hypot(game.x-p.x,game.y-p.y)<24)){ctx.strokeStyle='#e5b953';ctx.lineWidth=2;ctx.beginPath();ctx.arc(game.x,game.y,26,0,Math.PI*2*Math.min(1,(game.idleTime-P.damageWarn)/(P.damageAfter-P.damageWarn)));ctx.stroke();}
if(game.find.revealed&&!game.find.collected){circle(ctx,game.find.x,game.find.y,10,'#e2bd56');ctx.fillStyle='#fffce5';ctx.textAlign='center';ctx.font='bold 14px Segoe UI';ctx.fillText('+',game.find.x,game.find.y+5);}
if(game.cat.active){const c=game.cat;ctx.save();ctx.translate(c.x,c.y);ctx.rotate(c.angle);const stride=settings.reduced?0:Math.sin(game.time*24);ctx.scale(1+stride*.035,1-stride*.025);ctx.strokeStyle='#656b68';ctx.lineWidth=3;for(const side of [-1,1])for(const front of [-8,8]){ctx.beginPath();ctx.moveTo(front,side*5);ctx.lineTo(front+stride*(front>0?4:-4)*side,side*11);ctx.stroke();}ctx.strokeStyle='#64666b';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-10,0);ctx.quadraticCurveTo(-25,-15+stride*4,-25,stride*5);ctx.stroke();rounded(ctx,-13,-7,24,14,7,'#85898b');circle(ctx,12,0,7,'#85898b');ctx.fillStyle='#85898b';ctx.beginPath();ctx.moveTo(9,-4);ctx.lineTo(9,-12);ctx.lineTo(15,-6);ctx.fill();ctx.beginPath();ctx.moveTo(10,4);ctx.lineTo(10,12);ctx.lineTo(16,6);ctx.fill();circle(ctx,15,-3,1.2,'#f2d77e');circle(ctx,15,3,1.2,'#f2d77e');ctx.restore();}
// Ambient bees are presentation only; they never enter Game.step or score.
for(const p of game.level.wildflowers||[]){ctx.save();ctx.strokeStyle='#f5e6b8';ctx.lineWidth=1.5;ctx.setLineDash([3,6]);ctx.beginPath();ctx.ellipse(p.x,p.y,p.rx+4,p.ry+4,0,0,Math.PI*2);ctx.stroke();ctx.restore();ctx.fillStyle='#f8f1d9';ctx.font='600 11px Segoe UI';ctx.textAlign='center';ctx.fillText('LA BLOMSTENE STÅ',p.x,p.y-p.ry-12);for(let i=0;i<3;i++){const a=(settings.reduced?0:game.time)*1.5+i*2.1,x=p.x+Math.cos(a)*(p.rx+8),y=p.y+Math.sin(a)*p.ry;circle(ctx,x-2,y-2,2,'#ffffffaa');circle(ctx,x+2,y-2,2,'#ffffffaa');circle(ctx,x,y,2,'#e7c25c');ctx.fillStyle='#4c4935';ctx.fillRect(x,y-1,1,2);}}
for(const r of rings){ctx.globalAlpha=r.life/.65;ctx.strokeStyle=r.color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(r.x,r.y,20+(1-r.life/.65)*32,0,Math.PI*2);ctx.stroke();}ctx.globalAlpha=1;
if(game.coverage>=.97&&!game.done){ctx.fillStyle='#f4e29a';ctx.globalAlpha=.4+.18*Math.sin(last/500);for(let i=0;i<game.mask.length;i++)if(game.mask[i]===1)ctx.fillRect((i%game.nx)*P.cell,Math.floor(i/game.nx)*P.cell,P.cell,P.cell);ctx.globalAlpha=1;}
for(const p of game.pickups)if(!p.taken){circle(ctx,p.x+2,p.y+3,13,'#163d3025');circle(ctx,p.x,p.y,12,p.type==='speed'?'#398da9':'#9565ae');ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='bold 17px Segoe UI';ctx.fillText(p.type==='speed'?'↟':'↶',p.x,p.y+5);circle(ctx,p.x+10,p.y-10,6,'#fff7dc');ctx.fillStyle='#44613e';ctx.font='bold 10px Segoe UI';ctx.fillText('+',p.x+10,p.y-6);}
if(game.nest.revealed){circle(ctx,game.nest.originX,game.nest.originY,8,'#94764b');circle(ctx,game.nest.originX,game.nest.originY,4,'#423a2a');}
if(game.nest.active){for(let i=0;i<7;i++){const a=last/140+i*2.4,x=game.nest.x+Math.cos(a)*12,y=game.nest.y+Math.sin(a*1.1)*12;circle(ctx,x-2,y-2,3,'#f8ffde99');circle(ctx,x+2,y-2,3,'#f8ffde99');circle(ctx,x,y,2.6,'#e9be40');ctx.fillStyle='#332e24';ctx.fillRect(x-1,y-2,1.5,4);}}
if(game.flash>0){ctx.strokeStyle='#f2b365';ctx.lineWidth=2;ctx.beginPath();ctx.arc(game.x,game.y,29+(1-game.flash/.22)*8,0,Math.PI*2);ctx.stroke();}
if(game.active.speed||game.active.turn){ctx.strokeStyle=game.active.turn?'#b692cc':'#78c7e1';ctx.lineWidth=4;ctx.beginPath();ctx.arc(game.x,game.y,28,0,Math.PI*2);ctx.stroke();}
// One raised flower bed, with its footprint matching collision and coverage.
const bed=obstacles[1];rounded(ctx,bed.x+4,bed.y+6,bed.w,bed.h,10,'#243a2940');rounded(ctx,bed.x,bed.y,bed.w,bed.h,8,'#c9b390');rounded(ctx,bed.x+5,bed.y+5,bed.w-10,bed.h-10,5,'#795a40');for(let i=0;i<12;i++){let x=bed.x+17+(i%6)*16,y=bed.y+18+Math.floor(i/6)*26;circle(ctx,x-3,y+2,7,'#557744');for(let a=0;a<5;a++)circle(ctx,x+Math.cos(a*1.257)*4,y+Math.sin(a*1.257)*4,3.6,i%3?'#f4c766':'#e8a1a6');circle(ctx,x,y,2.6,'#fff0c1');}
// A compact crown keeps the reachable lawn around the trunk visible.
let tree=obstacles[0];circle(ctx,tree.x+9,tree.y+8,29,'#20382b28');circle(ctx,tree.x,tree.y,27,'#b29b72');circle(ctx,tree.x,tree.y,22,'#795b3b');circle(ctx,tree.x,tree.y,20,'#356b39');circle(ctx,tree.x-9,tree.y-7,14,'#488443');circle(ctx,tree.x+9,tree.y-5,13,'#518d46');circle(ctx,tree.x,tree.y-14,12,'#639b4c');circle(ctx,tree.x-3,tree.y+7,12,'#3b793e');
for(let p of particles){ctx.globalAlpha=Math.min(1,p.life*3);ctx.fillStyle='#c5e782';ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.life*8);ctx.fillRect(-1,-1,4,2);ctx.restore();}ctx.globalAlpha=1;
ctx.save();ctx.translate(game.x+3,game.y+4);ctx.rotate(game.angle);rounded(ctx,-21,-17,43,34,12,'#19332535');ctx.restore();ctx.save();ctx.translate(game.x+(!settings.reduced?Math.sin(last*.18)*cutLevel*.4:0),game.y);ctx.rotate(game.angle);rounded(ctx,-11,-23,20,46,9,'#bfd1a1');rounded(ctx,-9,-21,16,42,6,'#e3e9c3');for(let x of [-15,11])for(let y of [-15,15])rounded(ctx,x-5,y-4,10,8,3,'#283e34');rounded(ctx,-20,-12,39,24,7,'#e9b74f');rounded(ctx,1,-11,19,22,6,'#f5cc66');rounded(ctx,5,-8,11,16,3,'#f8d87b');rounded(ctx,16,-9,3,5,1,'#fff4b1');rounded(ctx,16,4,3,5,1,'#fff4b1');rounded(ctx,-15,-9,13,18,4,'#344c40');circle(ctx,-5,0,6,'#d08e62');circle(ctx,-7,0,5,'#f0dcb3');ctx.strokeStyle='#334b3b';ctx.lineWidth=2;ctx.beginPath();ctx.arc(4,0,5,-1.4,1.4);ctx.stroke();ctx.restore();}


function time(t){const seconds=Math.max(0,Math.floor(t+1e-7));return Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');}
function pct(n){return(n*100).toFixed(1).replace('.',',');}
function scoreText(n){return Math.round(n).toLocaleString('nb-NO');}
function hud(){
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
 $(target).replaceChildren();runs.forEach((r,i)=>{const tr=document.createElement('tr');const values=compact?[i+1,scoreText(r.score),time(r.time),pct(r.coverage)+' %']:[i+1,scoreText(r.score),time(r.time),pct(r.coverage)+' %',pct(r.overlap)+' %'];for(const v of values){const td=document.createElement('td');td.textContent=v;tr.append(td);}$(target).append(tr);});
}
function records(){
 const b=book[recordKey(game)];renderRows('runs',b?.runs||[]);$('storageNote').hidden=storageOK;
 $('recordSummary').textContent=b?'Beste score: '+scoreText(b.score):'Ingen forsøk ennå';
 $('recordBest').textContent=b?'Beste score: '+scoreText(b.score)+(b.time!==null?' · Beste fullføringstid: '+time(b.time):'')+' · Laveste overlapp: '+pct(b.overlap)+' %':'Ingen resultater i denne hagen og modusen ennå.';
}
function finish(){
 const r=game.result();
 if(r.failed){clearTouch();keys.clear();$('notice').hidden=true;$('gameOver').hidden=false;$('retryCat').focus();sound.chime('collision');return;}
 const flags=recordFlags(book,r);book=recordRun(book,r);try{localStorage.setItem('klippekaos-p04',JSON.stringify(book));}catch{storageOK=false;}
 $('resultEyebrow').textContent=r.completed?'NYKLIPT OG NYDELIG':'DITT FORSØK · 60 SEKUNDER';
 $('resultTitle').textContent=r.completed?'FULLFØRT':'GODT KLIPPET!';$('score').textContent=scoreText(r.score);$('rank').textContent='Rang '+r.rank;
 $('personalBests').replaceChildren();for(const [key,label] of [['score','NY REKORD'],['time','NY BESTE TID'],['overlap','NY LAVESTE OVERLAPP']])if(flags[key]){const span=document.createElement('span');span.textContent=label;$('personalBests').append(span);}
 $('endCoverage').textContent=r.mode==='timed'?'Du klippet '+pct(r.coverage)+' % på '+Number(r.time.toFixed(1)).toLocaleString('nb-NO')+' sekunder':(r.completed?'100':pct(r.coverage))+' % klippet';$('endTime').textContent=time(r.time);$('endOverlap').textContent=pct(r.overlap)+' %';
 $('endCollisions').textContent=r.collisions+' (−'+r.breakdown.collisions+' p)';$('endDamage').textContent=r.damage+' (−'+r.breakdown.damage+' p)';$('endPenalty').textContent='−'+r.penalty+' p';
 $('endHeavy').textContent=pct(r.heavyTotal?r.heavyCut/r.heavyTotal:0)+' %';
 $('endFlowers').textContent=pct(r.flowerTotal?r.flowerCut/r.flowerTotal:0)+' % (−'+r.breakdown.flowers+' p)';
 for(const [id,value] of [['endCollisions',r.collisions],['endDamage',r.damage],['endPenalty',r.penalty],['endHeavy',r.heavyCut],['endFlowers',r.flowerCut]])$(id).parentElement.hidden=!value;
 $('scoreBreakdown').textContent='Dekning og tid: '+scoreText(r.breakdown.base)+' p. '+[['overlap','Overlapp'],['collisions','Kollisjoner'],['damage','Plenskade'],['wasps','Veps'],['flowers','Markblomster']].map(([key,label])=>label+': −'+r.breakdown[key]).join('. ')+'. Sum (minst 0): '+scoreText(r.score)+' p.';
 clearTouch();
 const b=book[recordKey(r)];$('best').textContent=game.level.name+' · '+(game.mode==='timed'?'Tidspress':'Full plen');renderRows('resultRuns',b.runs,true);
 $('notice').hidden=true;$('result').hidden=false;$('again').focus({preventScroll:true});$('result').querySelector('.card').scrollTop=0;records();sound.chime('finish');
}
function reset(){
 game.eventOptions.seed=Math.floor(Math.random()*4294967296);game.reset($('mode').value,game.garden);keys.clear();clearTouch();particles=[];rings=[];cutLevel=0;paused=false;accumulator=0;noticeTime=0;
 $('gameOver').hidden=true;$('result').hidden=true;$('pause').hidden=true;$('notice').hidden=true;$('gardenName').textContent=game.level.name;
 $('modeGoal').textContent=game.mode==='timed'?'Hvor mye klarer du å klippe på 60 sekunder?':game.garden==='garden3'?'Klipp plenen · la markblomstene stå · mørkt gress er tyngre':'Klipp hele plenen og finn flyten';
 $('hint').textContent=device.touch?'Hold Gass · sving med venstre tommel':'Trykk W eller ↑ og finn klippeflyten';
 initGrass();hud();records();canvas.focus();
}
function startGame(mode,garden){
 onMenu=false;$('menu').hidden=true;$('play').hidden=false;$('mode').value=mode;game.garden=garden;
 reset();sound.start();window.scrollTo(0,0);
}
function showMenu(){
 onMenu=true;paused=false;keys.clear();clearTouch();particles=[];rings=[];cutLevel=0;accumulator=0;
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
function modalOpen(){return $('settingsDialog').open||$('helpDialog').open;}
const playKeys=['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','shift','e',' '];
document.addEventListener('keydown',e=>{
 if(onMenu||modalOpen()||e.target.tagName==='SELECT')return;const k=e.key.toLowerCase();
 if(playKeys.includes(k)&&!(k===' '&&e.target.tagName==='BUTTON')){e.preventDefault();keys.add(k);sound.start();}
 if(k==='escape'&&!e.repeat)pause(!paused);
});
document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{keys.clear();if(game.started&&!game.done&&!onMenu)pause(true);});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&game.started&&!onMenu)pause(true);});
$('career').onclick=()=>startGame('normal','garden1');
$('timeTrial').onclick=()=>startGame('timed',$('timedGarden').value);
$('testGarden').onclick=()=>startGame('normal','garden2');
$('organicGarden').onclick=()=>startGame('normal','garden3');
$('timedGarden').onchange=()=>{game.reset('normal',$('timedGarden').value);initGrass();const b=book[recordKey(game)];$('menuRecord').textContent=b?'Din beste score her: '+scoreText(b.score):'Klar for første runde?';};
$('howButton').onclick=()=>$('helpDialog').showModal();$('settingsButton').onclick=openSettings;$('pauseSettings').onclick=openSettings;
document.querySelectorAll('[data-close]').forEach(button=>button.onclick=()=>$(button.dataset.close).close());
$('soundSetting').checked=settings.sound;$('volumeSetting').value=Math.round(settings.volume*100);$('motionSetting').checked=settings.reduced;
$('soundSetting').onchange=()=>{sound.enabled=$('soundSetting').checked;if(sound.enabled)sound.start();saveSettings();};
$('volumeSetting').oninput=()=>{settings.volume=Number($('volumeSetting').value)/100;sound.start();saveSettings();};
$('motionSetting').onchange=()=>{settings.reduced=$('motionSetting').checked;saveSettings();};
$('retryCat').onclick=reset;$('gameOverMenu').onclick=()=>{$('gameOver').hidden=true;showMenu();};$('restart').onclick=reset;$('again').onclick=reset;$('resume').onclick=()=>{sound.start();pause(false);};$('mode').onchange=reset;
for(const id of ['menuButton','pauseMenu','resultMenu'])$(id).onclick=showMenu;
canvas.onclick=()=>{canvas.focus();sound.start();};
$('sound').onclick=()=>{if(sound.enabled&&(!sound.a||sound.a.state==='suspended'))sound.start();else{sound.enabled=!sound.enabled;if(sound.enabled)sound.start();}saveSettings();};
// All input devices produce the same small command object consumed by Game.step.
// Touch, keyboard and gamepad share the existing throttle/steering contract.
function controls(){
 let pad;try{pad=Array.from(navigator.getGamepads?.()||[]).find(p=>p&&p.connected&&p.mapping==='standard');}catch{}
 if(hadPad&&!pad&&game.started&&!game.done&&!onMenu)pause(true);hadPad=!!pad;
 const p=padInput(pad);if(p.pause&&!padPause&&!onMenu&&!modalOpen())pause(!paused);padPause=!!p.pause;
 const throttle=(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0),steering=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
 const t=touch.read();return{throttle:throttle||t.throttle||p.throttle||0,steering:steering||t.steering||p.steering||0,speedBoost:keys.has('shift')||t.speedBoost||!!p.speedBoost,turnBoost:keys.has('e')||keys.has(' ')||t.turnBoost||!!p.turnBoost};
}
function clearTouch(){touch.clear();document.querySelectorAll('[data-touch]').forEach(el=>el.classList.remove('held'));$('stickKnob').style.transform='translate(0,0)';}
function updateDevice(){
 const previous=device;device=KlippeInput.deviceState({maxTouchPoints:navigator.maxTouchPoints,coarse:matchMedia('(pointer: coarse)').matches,hover:matchMedia('(hover: hover)').matches,width:innerWidth,height:innerHeight,touchSeen});
 document.body.classList.toggle('touch-device',device.touch);$('rotatePrompt').hidden=!device.portrait;document.body.classList.toggle('portrait-prompt',device.portrait);$('menu').inert=device.portrait;$('play').inert=device.portrait;
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
 const dt=Math.min((now-last)/1000||0,.08);last=now;const input=controls();
 if(!onMenu&&!paused&&!game.done&&!modalOpen()&&!device.portrait){
  accumulator+=dt;while(accumulator>=1/120){cutVisual(game.step(1/120,input));accumulator-=1/120;if(game.done){finish();break;}}
  for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}particles=particles.filter(p=>p.life>0);for(const r of rings)r.life-=dt;rings=rings.filter(r=>r.life>0);
  cutLevel=Math.max(0,cutLevel-dt*5);if(noticeTime>0){noticeTime-=dt;$('notice').style.opacity=Math.min(1,noticeTime/.4);if(noticeTime<=0)$('notice').hidden=true;}
 }else accumulator=0;
 draw();hud();sound.update();
 if(onMenu){const c=$('menuPreview').getContext('2d');c.clearRect(0,0,900,580);c.drawImage(canvas,0,0);}
 requestAnimationFrame(frame);
}
initGrass();records();saveSettings();requestAnimationFrame(frame);



