(function(root){
'use strict';

// All coordinates are CSS pixels at the boundary and world units inside the game.
function fit(width,height,world={x:0,y:0,w:900,h:580},insets={}){
 const left=insets.left||0,top=insets.top||0;
 const w=Math.max(1,width-left-(insets.right||0)),h=Math.max(1,height-top-(insets.bottom||0));
 const scale=Math.min(w/world.w,h/world.h);
 const x=left+(w-world.w*scale)/2-world.x*scale,y=top+(h-world.h*scale)/2-world.y*scale;
 return {width,height,scale,x,y,
  worldToScreen:(wx,wy)=>({x:x+wx*scale,y:y+wy*scale}),
  screenToWorld:(sx,sy)=>({x:(sx-x)/scale,y:(sy-y)/scale})};
}
function pixelRatio(width,height,dpr=1){return Math.min(Math.max(1,dpr),2,Math.sqrt(4000000/Math.max(1,width*height)));}
function begin(canvas,ctx,view,dpr=1){
 const ratio=pixelRatio(view.width,view.height,dpr),w=Math.max(1,Math.round(view.width*ratio)),h=Math.max(1,Math.round(view.height*ratio));
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
 ctx.setTransform(w/view.width,0,0,h/view.height,0,0);
 ctx.clearRect(0,0,view.width,view.height);
 ctx.translate(view.x,view.y);ctx.scale(view.scale,view.scale);
}

root.KlippeViewport={fit,pixelRatio,begin};if(typeof module!=='undefined')module.exports=root.KlippeViewport;
})(typeof window!=='undefined'?window:globalThis);
