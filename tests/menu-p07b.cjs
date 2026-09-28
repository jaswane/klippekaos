'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const K=require('../dist/core.js'),S=require('../dist/profile.js'),M=require('../dist/render/mower.js');
const html=fs.readFileSync('dist/index.html','utf8'),source=fs.readFileSync('dist/game.js','utf8');
let count=0;function test(name,fn){fn();count++;console.log('PASS '+name);}
class Element{
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.attributes={};this.textContent='';this.hidden=false;}
 append(...children){this.children.push(...children);}replaceChildren(){this.children=[];}
 setAttribute(name,value){this.attributes[name]=value;}
}
const ids=Object.keys(K.mowerProfiles),memory=raw=>{let data=JSON.stringify(raw||{});return {getItem:()=>data,setItem:(k,v)=>{assert.equal(k,S.key);data=v;}};};
const result=stage=>({garden:'career'+stage,mode:'normal',completed:true,failed:false,score:9000,coverage:1,time:70,overlap:.1,initials:'ABC'});
function cards(profile){
 const context={document:{createElement:tag=>new Element(tag)},Klippe:K,KlippeMower:{SPRITES:M.SPRITES,setAppearance(){}},Map},container=new Element();
 vm.createContext(context);vm.runInContext(fs.readFileSync('dist/mower-menu.js','utf8'),context);
 context.KlippeMowerMenu.choices(container,profile,id=>S.selectMower(profile,id));return container.children;
}
const button=card=>card.children.find(e=>e.tagName==='BUTTON');
function menu(){
 const elements=Object.fromEntries(['modeCareer','modeTimed','careerSetup','timedSetup','careerLevel','timedGarden','previewMode','previewNumber','previewTitle','menuPreview','timedGardenName','menuRecord','career','timeTrial','testGarden','organicGarden','devDialog'].map(id=>[id,new Element()]));
 elements.careerLevel.value='career2';elements.timedGarden.value='garden1';
 const resets=[],starts=[],context={onMenu:true,$:id=>elements[id],Klippe:K,KlippeProfile:S,KlippeMower:{setAppearance(){}},mowerProgress:{selectedMower:ids[1]},unlocked:2,
  game:{setMowerProfile(id){this.mower=id;},reset(...args){resets.push(args);}},initGrass(){},book:{'garden1:timed':{score:1234},'garden1:normal':{score:9876}},scoreText:String,startGame:(...args)=>starts.push(args)};
 elements.devDialog.close=()=>starts.push(['closed']);vm.createContext(context);
 vm.runInContext(source.slice(source.indexOf('function updateMenuPreview('),source.indexOf('function scoreGate(')),context);
 return {context,elements,resets,starts};
}
test('Only Career and Time pressure are exposed as main modes; test gardens stay inside the developer dialog',()=>{
 const main=html.slice(html.indexOf('<section id="menu"'),html.indexOf('<dialog id="devDialog"'));
 assert.equal([...main.matchAll(/type="radio" name="menuMode"/g)].length,2);
 assert(!main.includes('id="testGarden"'));assert(!main.includes('id="organicGarden"'));assert(!main.includes('id="timedGarden"'));
 const dev=html.slice(html.indexOf('<dialog id="devDialog"'),html.indexOf('<dialog id="mowerDialog"'));
 for(const id of ['testGarden','organicGarden','timedGarden'])assert(dev.includes('id="'+id+'"'));
 assert(main.includes('aria-controls="careerSetup"')&&main.includes('aria-controls="timedSetup"'));
});
test('Mode selection changes visible setup and preview while preserving the chosen career level',()=>{
 const {context:c,elements:e,resets}=menu();c.selectMenuMode('career');assert(e.modeCareer.checked&&!e.modeTimed.checked);assert(!e.careerSetup.hidden&&e.timedSetup.hidden);assert.deepEqual(resets.at(-1),['normal','career2']);assert.equal(c.game.mower,ids[1]);assert.equal(e.previewTitle.textContent,'L-hagen');
 c.selectMenuMode('timed');assert(e.modeTimed.checked&&!e.modeCareer.checked);assert(e.careerSetup.hidden&&!e.timedSetup.hidden);assert.deepEqual(resets.at(-1),['timed','garden1']);assert.equal(c.game.mower,ids[0]);
 c.selectMenuMode('career');assert.equal(e.careerLevel.value,'career2');assert.deepEqual(resets.at(-1),['normal','career2']);
});
test('Preview reads the selected mode record and cannot reset an active round',()=>{
 const {context:c,elements:e,resets}=menu();c.selectMenuMode('timed');assert.equal(e.menuRecord.textContent,'Din beste score: 1234');const n=resets.length;c.onMenu=false;c.updateMenuPreview();assert.equal(resets.length,n);
});
test('Launch buttons retain the career gate and original modes, and close development dialogs before play',()=>{
 const {context:c,elements:e,starts}=menu();for(const id of ['career','timeTrial','testGarden','organicGarden']){
  const line=source.split(/\r?\n/).find(line=>line.startsWith("$('"+id+"').onclick="));assert(line);vm.runInContext(line,c);
 }
 e.career.onclick();assert.deepEqual(starts.pop(),['normal','career2']);e.careerLevel.value='career5';e.career.onclick();assert.equal(starts.length,0);
 e.timeTrial.onclick();assert.deepEqual(starts.pop(),['timed','garden1']);
 for(const [id,garden] of [['testGarden','garden2'],['organicGarden','garden3']]){e[id].onclick();assert.deepEqual(starts.splice(0),[['closed'],['normal',garden]]);}
});
test('Fresh profile renders only the starter as available, with five disabled buttons and explicit unlock requirements',()=>{
 const profile=S.load(memory()),view=cards(profile);assert.equal(view.length,6);assert.equal(view.filter(c=>!button(c).disabled).length,1);assert.equal(view[0].dataset.selected,'true');
 for(let i=1;i<6;i++){assert.equal(view[i].dataset.locked,'true');assert.equal(button(view[i]).attributes['aria-pressed'],'false');assert(button(view[i]).attributes['aria-label'].startsWith('Låst: '));assert(button(view[i]).textContent.includes('nivå '+i));assert(!S.selectMower(profile,ids[i]));}
});
test('Existing saved progress restores the selected unlocked mower and keeps later mower buttons disabled',()=>{
 const storage=memory(),p=S.load(storage);S.completeCareer(p,result(1));S.completeCareer(p,result(2));assert(S.selectMower(p,ids[2]));assert(S.save(storage,p.book,p.unlocked,p));
 const restored=S.load(storage),view=cards(restored);assert.equal(view.filter(c=>!button(c).disabled).length,3);assert.equal(view[2].dataset.selected,'true');assert.equal(view[0].dataset.selected,'false');
 button(view[0]).onclick();assert.equal(restored.selectedMower,ids[0]);assert(S.save(storage,restored.book,restored.unlocked,restored));assert.equal(S.load(storage).selectedMower,ids[0]);
});
test('Each level-one-to-five milestone exposes exactly its next mower after save and reload',()=>{
 const storage=memory();let profile=S.load(storage);
 for(let stage=1;stage<=5;stage++){assert.deepEqual(S.completeCareer(profile,result(stage)),[ids[stage]]);S.save(storage,profile.book,profile.unlocked,profile);profile=S.load(storage);const view=cards(profile);assert.equal(view.filter(c=>!button(c).disabled).length,stage+1);assert.equal(view.filter(c=>c.dataset.selected==='true').length,1);}
});
test('Legacy access to level five does not show zero-turn as unlocked until final completion is saved',()=>{
 let view=cards(S.load(memory({unlocked:5})));assert(button(view[5]).disabled);assert.equal(view.filter(c=>!button(c).disabled).length,5);
 const book=K.recordRun({},result(5));view=cards(S.load(memory({unlocked:5,book})));assert(!button(view[5]).disabled);
});
console.log(count+' PASS');
