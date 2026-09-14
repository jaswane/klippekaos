const assert=require('node:assert/strict');const{Game,P,legal}=require('../dist/core.js');const tests=[];function test(name,fn){fn();tests.push(name);}function run(g,n,input){for(let i=0;i<n*120;i++)g.step(1/120,input);}
test('Idle never starts timer or cuts',()=>{let g=new Game();run(g,2,{});assert.equal(g.time,0);assert.equal(g.cut,0);});
test('Acceleration, coast braking and reversing',()=>{let g=new Game();run(g,.75,{forward:true});assert.equal(g.speed,112);let y=g.y;run(g,.6,{});assert.equal(g.speed,0);assert(y-g.y<34);run(g,1,{back:true});assert.equal(g.speed,-53);});
test('Steering requires movement, and reverse steering is vehicle relative',()=>{let g=new Game(),a=g.angle;run(g,1,{right:true});assert.equal(g.angle,a);run(g,.6,{forward:true,right:true});assert(g.angle>a);g=new Game();run(g,.6,{back:true,right:true});assert(g.angle<-Math.PI/2);});
test('Straight pass has zero repeat; backtrack adds overlap',()=>{let g=new Game();run(g,2,{forward:true});assert.equal(g.repeat,0);let cut=g.cut;run(g,3,{back:true});assert(g.repeat>0);assert(g.cut<cut*1.15);});
test('Tree, bed and boundaries block motion',()=>{for(let [x,y,a] of [[302,290,-Math.PI/2],[630,460,-Math.PI/2],[101,100,-Math.PI/2]]){let g=new Game();g.x=x;g.y=y;g.angle=a;run(g,4,{forward:true});assert(legal(g.x,g.y));assert(Math.abs(g.speed)<20);}});
test('All grass is reachable with collision footprint (dense legal-center sweep)',()=>{let g=new Game();for(let y=68;y<=512;y+=3)for(let x=76;x<=824;x+=3)if(legal(x,y))g.mow(x,y);assert(g.coverage>=.995,`${g.coverage}`);console.log('Reachable coverage',g.coverage);});
test('Finish threshold and frozen result; reset clears run',()=>{let g=new Game();g.cut=Math.ceil(g.total*.995);g.step(1/120,{});assert(g.done);let t=g.time;run(g,1,{forward:true});assert.equal(g.time,t);g.reset();assert.equal(g.cut,0);assert.equal(g.repeat,0);assert(!g.done);});
console.log(tests.length+' PASS\n'+tests.join('\n'));

