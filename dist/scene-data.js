(function(root){
'use strict';
// Visual profiles only. Trunks inside lawns reference existing colliders; border trees are decor.
const prop=(asset,x,y,w,h,extra={})=>({asset,x,y,w,h,anchor:[.5,.5],layer:['canopy','bush','parasol'].includes(asset)?'foreground':'background',...extra});
const tree=(x,y,size,variant)=>[prop('trunk',x,y,18,18),prop('canopy',x,y,size,size,{variant})];
const profiles={
 1:{ground:'#73846b',decor:[prop('path',27,290,48,474),prop('patio',450,20,650,65),prop('house',370,-23,320,48),prop('table',615,22,42,30),prop('chair',656,23,23,32),prop('pot',133,25,26,29,{flowers:true}),prop('pot',760,25,26,29),prop('fence',868,291,475,16,{rotation:Math.PI/2}),...tree(36,95,83,0),prop('bush',858,490,55,60,{variant:1}),prop('trampoline',-32,340,92,92)]},
 2:{ground:'#697960',decor:[prop('patio',690,433,350,230),prop('wall',499,429,235,14,{rotation:Math.PI/2}),prop('table',687,406,53,40),prop('chair',640,407,25,36),prop('chair',735,407,25,36),prop('trunk',711,468,10,10),prop('parasol',711,468,76,76),prop('pot',812,504,26,30),prop('hedge',31,285,35,500),prop('fence',695,554,340,16),prop('bush',840,326,60,48,{variant:2}),...tree(872,102,86,1)]},
 3:{ground:'#6b8566',decor:[prop('patio',806,70,156,134),prop('table',816,83,45,32),prop('chair',775,86,24,32),prop('trunk',822,42,10,10),prop('parasol',822,42,79,79),...tree(90,137,116,1),...tree(849,375,98,2),prop('bush',115,455,82,62,{variant:0}),prop('bush',60,345,70,87,{variant:1}),prop('path',75,275,35,155),prop('pot',74,41,26,29)]},
 4:{ground:'#879074',decor:[prop('path',450,50,620,45),prop('flowerbed',450,26,220,42),...[225,295,600,680].map(x=>prop('pot',x,55,25,28,{flowers:true})),prop('pot',78,240,30,34,{flowers:true}),prop('pot',824,360,30,34,{flowers:true}),prop('flowerbed',450,534,300,40),prop('bush',98,100,66,55,{variant:2}),...tree(839,167,89,2),prop('fence',52,335,245,14,{rotation:Math.PI/2})]},
 5:{ground:'#809075',decor:[prop('patio',818,48,245,162),prop('pool',816,44,142,94),prop('lounger',728,25,27,62),prop('lounger',903,54,26,61),prop('trunk',679,19,10,10),prop('parasol',679,19,74,74),prop('patio',814,525,186,135),prop('lounger',811,514,28,67),prop('table',865,536,30,31),prop('pot',920,450,30,34),prop('hedge',26,340,28,310),...tree(31,77,91,0),prop('bush',856,414,68,50,{variant:1})]}
};
function forLevel(level){
 const stage=level.stage||Number(level.id?.slice(-1))||1,p=profiles[stage]||profiles[1];
 return {ground:p.ground,decor:p.decor.map(d=>({...d,anchor:[...d.anchor]})),obstacleVisuals:level.obstacles.map((o,index)=>({colliderIndex:index,asset:o.type==='circle'?'canopy':'flowerbed',variant:(stage-1)%3,canopyFactor:2.05,layer:o.type==='circle'?'foreground':'ground'}))};
}
root.KlippeSceneData={forLevel};if(typeof module!=='undefined')module.exports=root.KlippeSceneData;
})(typeof window!=='undefined'?window:globalThis);
