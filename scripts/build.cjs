const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const base=path.resolve(__dirname,'..');
for(const file of ['core.js','input.js','game.js']){
 const r=spawnSync(process.execPath,['--check',path.join(base,'dist',file)],{stdio:'inherit'});
 if(r.status!==0)process.exit(r.status||1);
}
const html=fs.readFileSync(path.join(base,'dist/index.html'),'utf8');
for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){
 if(/^(https?:|data:|#)/.test(match[1]))continue;
 if(!fs.existsSync(path.join(base,'dist',match[1])))throw new Error('Missing asset: '+match[1]);
}
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
if(new Set(ids).size!==ids.length)throw new Error('Duplicate HTML id');
console.log('Static site validated. Deploy dist/; no runtime backend or dependencies.');
