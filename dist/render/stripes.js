(function(root){
'use strict';

// First-cut direction in a coarse visual grid. Never read by the simulation.
class DirectionBuffer{
 constructor(width,height,size=6){this.size=size;this.cols=Math.ceil(width/size);this.rows=Math.ceil(height/size);this.directions=new Float32Array(this.cols*this.rows);this.reset();}
 reset(){this.directions.fill(NaN);}
 record(cells,angle,logicalCols,logicalSize){
  const direction=Math.atan2(Math.sin(angle),Math.cos(angle)),paint=[];
  for(const i of cells){const x=(i%logicalCols)*logicalSize,y=Math.floor(i/logicalCols)*logicalSize;
   const index=Math.floor((y+logicalSize/2)/this.size)*this.cols+Math.floor((x+logicalSize/2)/this.size);
   if(index<0||index>=this.directions.length)continue;
   if(Number.isNaN(this.directions[index]))this.directions[index]=direction;
   paint.push({x,y,direction:this.directions[index]});
  }
  return paint;
 }
}
// A continuous directional reflectance, lit from the upper left, not a binary palette.
function reflectance(direction){return Math.cos(direction+Math.PI*.75);}
function style(direction){const light=reflectance(direction);return light>=0?'rgba(237,241,190,'+(light*.07)+')':'rgba(25,52,29,'+(-light*.075)+')';}

root.KlippeStripes={DirectionBuffer,reflectance,style};if(typeof module!=='undefined')module.exports=root.KlippeStripes;
})(typeof window!=='undefined'?window:globalThis);
