(function(root){
'use strict';
const K=typeof module!=='undefined'?require('./core.js'):root.Klippe;
const key='klippekaos-p05';
const validInitials=value=>typeof value==='string'&&/^[A-Z0-9]{3}$/.test(value);
const normalizeInitials=value=>String(value).toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,3);
const compare=(a,b)=>b.score-a.score||b.coverage-a.coverage||a.time-b.time||a.overlap-b.overlap;
function qualifies(book,result){if(result.failed)return false;const runs=book[K.recordKey(result)]?.runs||[];return runs.length<5||compare(result,runs[4])<0;}
function submit(book,result,initials){if(!validInitials(initials))throw new Error('Bruk nøyaktig tre tegn: A–Z eller 0–9.');if(!qualifies(book,result))return book;return K.recordRun(book,{...result,initials});}
function advance(unlocked,result){const stage=K.careerLevels[result.garden]?.stage;return stage&&result.mode==='normal'&&result.completed&&!result.failed&&stage<=unlocked?Math.max(unlocked,Math.min(5,stage+1)):unlocked;}
const defaultMower='mower-01-push';
const mowerIDs=Object.keys(K.mowerProfiles);
function mowerState(raw={},book={},unlocked=1){
 // unlocked=5 proves completion of level 4, not level 5. A saved completion proves the finale.
 let completed=Math.max(0,Math.min(4,unlocked-1));
 for(const level of Object.values(K.careerLevels))if(level.stage<=unlocked&&(book[level.id+':normal']?.runs||[]).some(r=>r.completed&&!r.failed))completed=Math.max(completed,level.stage);
 const saved=Array.isArray(raw.unlockedMowers)?raw.unlockedMowers:[];
 const unlockedMowers=mowerIDs.filter(id=>K.mowerProfiles[id].unlockAfterCareerLevel<=completed||saved.includes(id));
 const selectedMower=unlockedMowers.includes(raw.selectedMower)?raw.selectedMower:defaultMower;
 return {unlockedMowers,selectedMower};
}
function selectMower(profile,id){if(!K.mowerProfiles[id]||!profile.unlockedMowers?.includes(id))return false;profile.selectedMower=id;return true;}
function completeCareer(profile,result){
 const stage=K.careerLevels[result.garden]?.stage;
 if(!stage||result.mode!=='normal'||!result.completed||result.failed||stage>profile.unlocked)return [];
 const fresh=mowerIDs.filter(id=>K.mowerProfiles[id].unlockAfterCareerLevel<=stage&&!profile.unlockedMowers.includes(id));
 profile.unlockedMowers=mowerIDs.filter(id=>profile.unlockedMowers.includes(id)||fresh.includes(id));
 profile.unlocked=advance(profile.unlocked,result);return fresh;
}
function load(storage){
 const empty={book:{},unlocked:1,...mowerState(),ok:true};
 try{const raw=JSON.parse(storage.getItem(key)||'{}');const book={};
 for(const garden of [...Object.keys(K.levels),...Object.keys(K.careerLevels)])for(const mode of ['normal','timed']){
  const k=garden+':'+mode,r=raw?.book?.[k];if(!r||!Array.isArray(r.runs))continue;
  const runs=r.runs.filter(x=>x&&validInitials(x.initials)&&x.garden===garden&&x.mode===mode&&!x.failed&&[x.score,x.time,x.coverage,x.overlap].every(Number.isFinite)&&x.score>=0&&x.time>=0&&x.coverage>=0&&x.coverage<=1&&x.overlap>=0&&x.overlap<=1).sort(compare).slice(0,5);
  if(runs.length){let b={};for(const run of runs)b=K.recordRun(b,run);book[k]={...b[k],runs};
   // Preserve historical bests that can outlive the five highest-scoring runs.
   if(Number.isFinite(r.score)&&r.score>=book[k].score)book[k].score=r.score;
   if(Number.isFinite(r.time)&&r.time>=0&&(book[k].time===null||r.time<book[k].time))book[k].time=r.time;
   if(Number.isFinite(r.overlap)&&r.overlap>=0&&r.overlap<=book[k].overlap)book[k].overlap=r.overlap;}
 }
 const unlocked=Number.isInteger(raw?.unlocked)?Math.max(1,Math.min(5,raw.unlocked)):1;return {book,unlocked,...mowerState(raw||{},book,unlocked),ok:true};
 }catch{return {...empty,ok:false};}
}
function save(storage,book,unlocked,mowers){try{const state=mowerState(mowers||{},book,unlocked);storage.setItem(key,JSON.stringify({book,unlocked,...state}));return true;}catch{return false;}}
const api={key,validInitials,normalizeInitials,qualifies,submit,advance,load,save,defaultMower,mowerState,selectMower,completeCareer};root.KlippeProfile=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
