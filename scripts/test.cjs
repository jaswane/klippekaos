const {spawnSync}=require('node:child_process'),path=require('node:path');
for(const name of ['prototype01','prototype02','prototype03','prototype04','prototype05','prototype051','prototype06','prototype061','prototype062','prototype062mobile','mouse-reverse','mower-sprite','mouse-native','prototype063','art-integration','mower-events']){
 const r=spawnSync(process.execPath,[path.join(__dirname,'../tests',name+'.cjs')],{stdio:'inherit'});
 if(r.status!==0)process.exit(r.status||1);
}
