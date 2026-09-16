(function(root){
'use strict';
// Visual profiles only. Trunks inside lawns reference existing colliders; border trees are decor.
const prop=(asset,x,y,w,h,extra={})=>({asset,x,y,w,h,anchor:[.5,.5],layer:['canopy','bush','parasol'].includes(asset)?'foreground':'background',...extra});
const tree=(x,y,size,variant,rotation=0)=>[prop('trunk',x,y,18,18),prop('canopy',x,y,size,size,{variant,rotation})];
const profiles={
 1:{ground:'#73846b',decor:[prop('path',27,290,48,474),prop('patio',450,20,650,65),prop('house',370,-23,320,48),prop('table',615,22,42,30),prop('chair',656,23,29,38,{rotation:.06}),prop('pot',133,25,26,29,{flowers:true}),prop('pot',760,25,26,29),prop('fence',868,291,475,16,{rotation:Math.PI/2}),...tree(36,95,116,0,-.07),prop('bush',858,490,74,78,{variant:1,rotation:.08}),prop('trampoline',-32,340,92,92)]},
 2:{ground:'#697960',decor:[prop('patio',690,433,350,230),prop('wall',499,429,235,14,{rotation:Math.PI/2}),prop('table',687,406,53,40),prop('chair',640,407,25,36),prop('chair',735,407,25,36),prop('trunk',711,468,10,10),prop('parasol',711,468,76,76),prop('pot',812,504,26,30),prop('hedge',28,285,44,500),prop('fence',695,554,340,16),prop('bush',846,326,78,64,{variant:2,rotation:-.09,mirrorX:true}),...tree(868,102,120,1,.06),prop('flowerbed',670,350,138,84,{rotation:-.04})]},
 3:{ground:'#6b8566',decor:[prop('patio',806,70,156,134),prop('table',816,83,45,32),prop('chair',775,86,24,32),prop('trunk',822,42,10,10),prop('parasol',822,42,79,79),...tree(90,137,148,1,-.08),...tree(849,375,132,2,.09),prop('bush',105,455,96,74,{variant:0,rotation:-.1,mirrorX:true}),prop('bush',54,345,86,102,{variant:1,rotation:.07}),prop('path',75,275,35,155),prop('pot',74,41,26,29)]},
 4:{ground:'#879074',decor:[prop('path',450,50,620,45),prop('flowerbed',450,40,165,78,{rotation:.025}),...[225,295,600,680].map(x=>prop('pot',x,55,25,28,{flowers:true})),prop('pot',78,240,30,34,{flowers:true}),prop('pot',824,360,30,34,{flowers:true}),prop('flowerbed',398,538,155,80,{rotation:-.035}),prop('flowerbed',596,536,132,74,{rotation:.045}),prop('bush',87,100,80,65,{variant:2,rotation:-.06}),...tree(845,167,120,2,.07),prop('fence',52,335,245,14,{rotation:Math.PI/2})]},
 5:{ground:'#809075',decor:[prop('patio',818,48,245,162),prop('pool',816,44,142,94),prop('lounger',728,25,27,62),prop('lounger',903,54,26,61),prop('trunk',679,19,10,10),prop('parasol',679,19,74,74),prop('patio',814,525,186,135),prop('lounger',811,514,28,67),prop('table',865,536,30,31),prop('pot',920,450,30,34),prop('hedge',26,340,28,310),...tree(31,77,122,0,-.06),prop('bush',858,414,90,66,{variant:1,rotation:-.08,mirrorX:true})]}
};
function withArt(d){
 const sprite=d.asset==='canopy'?((d.variant||0)%2?'tree-canopy-02':'tree-round-01'):
 d.asset==='bush'?((d.variant||0)%2?'bush-flowering-02':'bush-round-01'):
 ({hedge:'hedge-segment-01',pot:'plant-pot-01',chair:'garden-chair-01',parasol:'parasol-red-white-01',flowerbed:'flower-bed-stone-01'})[d.asset];
 return sprite?{...d,sprite}:d;
}
function forLevel(level){
 const stage=level.stage||Number(level.id?.slice(-1))||1,p=profiles[stage]||profiles[1];
 return {ground:p.ground,decor:p.decor.map(d=>withArt({...d,anchor:[...d.anchor]})),obstacleVisuals:level.obstacles.map((o,index)=>({colliderIndex:index,asset:o.type==='circle'?'canopy':'flowerbed',variant:(stage-1)%3,canopyFactor:stage===3?2.75:2.6,layer:o.type==='circle'?'foreground':'ground',...(o.type==='circle'?{rotation:stage%2?.055:-.065,sprite:(stage-1)%2?'tree-canopy-02':'tree-round-01'}:{})}))};
}
root.KlippeSceneData={forLevel};if(typeof module!=='undefined')module.exports=root.KlippeSceneData;
})(typeof window!=='undefined'?window:globalThis);
