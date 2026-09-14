(function(root){
'use strict';

// Presentation descriptors only. No copy of the lawn, drivable area or collision geometry.
// Anchors are normalized asset coordinates; positions and dimensions are world units.
const prop=(asset,x,y,w,h,extra={})=>({asset,x,y,w,h,anchor:[.5,.5],layer:asset==='canopy'?'foreground':'background',...extra});
const profiles={
 1:{ground:'#849779',decor:[prop('patio',350,0,430,80),prop('pot',-25,190,28,32,{anchor:[.5,1],scale:1.1}),prop('pot',-25,280,28,32),prop('hedge',450,-50,700,25)]},
 2:{ground:'#7d9073',decor:[prop('patio',690,433,325,207),prop('canopy',710,425,58,58,{style:'parasol'}),prop('pot',810,504,24,28),prop('hedge',-25,285,30,500),prop('hedge',700,606,380,25)]},
 3:{ground:'#80997a',decor:[prop('patio',806,70,156,134),prop('canopy',806,60,66,66,{style:'parasol'}),prop('canopy',-30,120,70,70),prop('pot',75,35,24,28),prop('hedge',-55,440,36,170)]},
 4:{ground:'#94977b',decor:[prop('patio',450,27,440,55),...[270,350,550,630].map(x=>prop('pot',x,29,25,28,{flowers:true})),prop('pot',70,240,30,34,{flowers:true}),prop('pot',840,360,30,34,{flowers:true}),prop('hedge',450,612,600,28)]},
 5:{ground:'#8e9e7b',decor:[prop('patio',810,30,220,135),prop('pool',809,50,127,79),prop('canopy',655,-15,64,64,{style:'parasol'}),prop('pot',920,450,30,34),prop('hedge',-35,250,30,400)]}
};
function forLevel(level){
 const stage=level.stage||Number(level.id?.slice(-1))||1,p=profiles[stage]||profiles[1];
 // Read collider shape to select a visual; never create or resize a collider from a visual.
 return {ground:p.ground,decor:p.decor.map(d=>({...d,anchor:[...d.anchor]})),obstacleVisuals:level.obstacles.map((o,index)=>({colliderIndex:index,asset:o.type==='circle'?'canopy':'flowerbed',layer:o.type==='circle'?'foreground':'ground'}))};
}

root.KlippeSceneData={forLevel};if(typeof module!=='undefined')module.exports=root.KlippeSceneData;
})(typeof window!=='undefined'?window:globalThis);
