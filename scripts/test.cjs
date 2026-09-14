const {spawnSync}=require('node:child_process'),path=require('node:path');
for(const name of ['prototype01','prototype02','prototype03','prototype04','prototype05']){
 const r=spawnSync(process.execPath,[path.join(__dirname,'../tests',name+'.cjs')],{stdio:'inherit'});
 if(r.status!==0)process.exit(r.status||1);
}
