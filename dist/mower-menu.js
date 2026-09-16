(function(root){
'use strict';
const previews=new Map();
function preview(canvas,id){const actor={x:0,y:0,angle:-Math.PI/2,speed:0,travel:0};KlippeMower.setAppearance(actor,id);previews.set(canvas,{actor,spec:KlippeMower.SPRITES[id]});}
function paint(){for(const [canvas,{actor,spec}] of previews){if(!canvas.isConnected){previews.delete(canvas);continue;}if(!canvas.getClientRects().length)continue;
 const c=canvas.getContext('2d'),points=[{x:0,y:0},{x:spec.width,y:spec.height}].map(p=>KlippeMower.spritePoint(actor,p,spec));
 const minX=Math.min(...points.map(p=>p.x)),minY=Math.min(...points.map(p=>p.y)),w=Math.abs(points[1].x-points[0].x),h=Math.abs(points[1].y-points[0].y),s=Math.min(canvas.width/w,canvas.height/h)*.96;
 c.clearRect(0,0,canvas.width,canvas.height);c.save();c.translate((canvas.width-w*s)/2-minX*s,(canvas.height-h*s)/2-minY*s);c.scale(s,s);KlippeMower.draw(c,actor,{settings:{reduced:true}});c.restore();
 }}
function choices(container,profile,choose){container.replaceChildren();for(const p of Object.values(Klippe.mowerProfiles)){
 const spec=KlippeMower.SPRITES[p.id],open=profile.unlockedMowers.includes(p.id),selected=profile.selectedMower===p.id;
 const card=document.createElement('article');card.className='mower-card';card.dataset.locked=String(!open);card.dataset.selected=String(selected);
 const image=document.createElement('canvas');image.width=240;image.height=130;image.className='mower-preview';image.setAttribute('role','img');image.setAttribute('aria-label',spec.name);preview(image,p.id);
 const name=document.createElement('h3');name.textContent=spec.name;const status=document.createElement('p');status.className='mower-state';status.textContent=selected?'✓ Valgt':open?'Låst opp':'🔒 Låses opp etter nivå '+p.unlockAfterCareerLevel;
 const stats=document.createElement('dl');stats.className='mower-stats';for(const [label,key,base,step] of [['Fart','speedMultiplier',1,.075],['Klippebredde','mowWidthMultiplier',1,.08],['Manøver','steeringMultiplier',.94,.035]]){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;const value=Math.max(1,Math.min(5,Math.round((p[key]-base)/step)+1));dd.textContent='●'.repeat(value)+'○'.repeat(5-value);dd.setAttribute('aria-label',value+' av 5');stats.append(dt,dd);}
 const button=document.createElement('button');button.type='button';button.textContent=selected?'Valgt klipper':open?'Velg klipper':'Låst';button.disabled=!open;button.setAttribute('aria-label',(selected?'Valgt: ':'Velg ')+spec.name);button.setAttribute('aria-pressed',String(selected));button.onclick=()=>choose(p.id);
 card.append(image,name,status,stats,button);container.append(card);
 }}
root.KlippeMowerMenu={preview,paint,choices};
})(typeof window!=='undefined'?window:globalThis);
