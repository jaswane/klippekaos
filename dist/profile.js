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
function load(storage){
 const empty={book:{},unlocked:1,ok:true};
 try{const raw=JSON.parse(storage.getItem(key)||'{}');const book={};
 for(const garden of [...Object.keys(K.levels),...Object.keys(K.careerLevels)])for(const mode of ['normal','timed']){
  const k=garden+':'+mode,r=raw?.book?.[k];if(!r||!Array.isArray(r.runs))continue;
  const runs=r.runs.filter(x=>x&&validInitials(x.initials)&&x.garden===garden&&x.mode===mode&&!x.failed&&[x.score,x.time,x.coverage,x.overlap].every(Number.isFinite)&&x.score>=0&&x.time>=0&&x.coverage>=0&&x.coverage<=1&&x.overlap>=0&&x.overlap<=1).sort(compare).slice(0,5);
  if(runs.length){let b={};for(const run of runs)b=K.recordRun(b,run);book[k]=b[k];}
 }
 return {book,unlocked:Number.isInteger(raw?.unlocked)?Math.max(1,Math.min(5,raw.unlocked)):1,ok:true};
 }catch{return {...empty,ok:false};}
}
function save(storage,book,unlocked){try{storage.setItem(key,JSON.stringify({book,unlocked}));return true;}catch{return false;}}
const api={key,validInitials,normalizeInitials,qualifies,submit,advance,load,save};root.KlippeProfile=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
