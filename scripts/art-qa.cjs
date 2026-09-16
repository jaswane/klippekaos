'use strict';
// Opt-in local art tools. Never copied into dist or injected by the production server.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const base=path.resolve(__dirname,'../dist');
function handler(req,res){
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/__art-qa-storage.js'){res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store'});return res.end("window.KlippeQAStorage={getItem:k=>sessionStorage.getItem('art-qa:'+k),setItem:(k,v)=>sessionStorage.setItem('art-qa:'+k,v)};");}
 if(url.pathname==='/__art-qa.js'){res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store'});return res.end(fs.readFileSync(path.join(__dirname,'art-qa.js')));}
 let name;try{name=decodeURIComponent(url.pathname);}catch{res.writeHead(400);return res.end();}
 const file=path.resolve(base,'.'+(name==='/'?'/index.html':name));
 if(!file.startsWith(base+path.sep)){res.writeHead(403);return res.end();}
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end('Not found');}
  if(file.endsWith('index.html'))data=data.toString().replace('<script src="game.js">','<script src="/__art-qa-storage.js"></script><script src="game.js">').replace('</body>','<script src="/__art-qa.js"></script></body>');
  res.writeHead(200,{'Content-Type':{'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png'}[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
 });
}
if(require.main===module)http.createServer(handler).listen(4191,'127.0.0.1',()=>console.log('Art QA: http://127.0.0.1:4191/ (local only)'));
module.exports={handler};
