const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const base=path.resolve(__dirname,'../dist'),port=Number(process.env.PORT)||4173;
http.createServer((req,res)=>{
 let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end('Bad request');return;}
 const file=path.resolve(base,'.'+(name==='/'?'/index.html':name));
 if(!file.startsWith(base+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
 fs.readFile(file,(err,data)=>{res.writeHead(err?404:200,{'Content-Type':{'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'}[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(err?'Not found':data);});
}).listen(port,'127.0.0.1',()=>console.log('http://127.0.0.1:'+port));
