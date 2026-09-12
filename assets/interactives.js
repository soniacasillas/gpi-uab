(function(){
 'use strict';
 const $=id=>document.getElementById(id),fmt=(n,d=1)=>n.toLocaleString('ca-ES',{maximumFractionDigits:d});
 const percent=x=>x>0&&x<0.0001?'<0,01%':fmt(x*100,2)+'%';
 const svgText=(x,y,t,extra='')=>`<text x="${x}" y="${y}" ${extra}>${t}</text>`;
 let seed=42;
 function updateCoverage(){
   const m=GPI.coverageModel(Number($('coverage').value),seed);
   $('coverage-value').textContent=fmt(m.coverage)+'×';
   const max=Math.max(15,...m.depth), w=1040, x0=55, y0=180;
   let s=`<line x1="55" x2="1095" y1="180" y2="180" stroke="#526574"/>`;
   for(let i=0;i<=3;i++){const v=max*i/3,y=y0-v/max*140;s+=`<line x1="55" x2="1095" y1="${y}" y2="${y}" stroke="#dce3e5"/>`+svgText(45,y+6,fmt(v,0),'text-anchor="end"');}
   // One bin per 25 bp: plotted height is average depth; amber marks any uncovered base.
   for(let i=0;i<400;i++){const chunk=m.depth.slice(i*25,(i+1)*25),mean=chunk.reduce((a,b)=>a+b,0)/25,h=mean/max*140;
     s+=`<rect x="${x0+i*w/400}" y="${y0-h}" width="${w/400+.2}" height="${h}" fill="#147d79"/>`;
     if(chunk.some(x=>x===0))s+=`<rect x="${x0+i*w/400}" y="187" width="${w/400+.2}" height="7" fill="#b24b16"/>`;
   }
   s+=svgText(55,220,'0 pb')+svgText(1095,220,'10.000 pb','text-anchor="end"')+svgText(55,25,'Profunditat (×) · taronja: trams amb bases no observades');
   $('coverage-plot').innerHTML=s;
   $('coverage-summary').textContent=`${m.N} lectures · Bases no observades: ${percent(m.missingFraction)} · Esperança de Poisson: ${percent(m.poissonMissing)}`;
 }
 function updateRepeat(){
   const L=Number($('read-length').value),m=GPI.repeatModel(L);
   $('read-value').textContent=L+' kb';
   let s='';
   [['A','B'],['C','D']].forEach((ends,row)=>{
     const y=45+row*112;
     s+=`<rect x="180" y="${y}" width="120" height="36" fill="#147d79"/><rect x="300" y="${y}" width="480" height="36" fill="#c16523"/><rect x="780" y="${y}" width="120" height="36" fill="#147d79"/>`;
     s+=svgText(240,y+25,ends[0],'text-anchor="middle" fill="white"')+svgText(540,y+25,'R · 8 kb','text-anchor="middle" fill="white"')+svgText(840,y+25,ends[1],'text-anchor="middle" fill="white"');
     const width=L*60;
     s+=`<rect x="${540-width/2}" y="${y+52}" width="${width}" height="14" rx="4" fill="#243959"/>`;
     s+=svgText(60,y+25,`Còpia ${row+1}`);
     if(m.bridges)s+=svgText(975,y+65,'Ancorada','text-anchor="middle" fill="#147d79"');
   });
   $('repeat-plot').innerHTML=s;
   $('repeat-summary').textContent=m.bridges?'La lectura connecta els dos flancs únics en aquest esquema.':'La lectura encara no connecta els dos flancs amb l’ancoratge requerit.';
 }
 function updateN50(){
   const m=GPI.assemblyStats(GPI_DATA.contigsMb),count=Number($('n50-step').value),sum=m.sorted.slice(0,count).reduce((a,b)=>a+b,0);
   $('n50-step-value').textContent=count;
   let s='',offset=0;const x0=40,w=1030;
   m.sorted.forEach((v,i)=>{let x=x0+offset/m.total*w,width=v/m.total*w;
     s+=`<rect x="${x}" y="75" width="${width}" height="68" fill="${i<count?'#147d79':'#e1e8e8'}" stroke="white" stroke-width="2"/>`;
     if(width>35)s+=svgText(x+width/2,116,String(i+1),`text-anchor="middle" fill="${i<count?'white':'#526574'}"`);
     offset+=v;
   });
   const half=x0+w/2,point=x0+sum/m.total*w;
   s+=`<line x1="${half}" x2="${half}" y1="48" y2="190" stroke="#b24b16" stroke-width="3" stroke-dasharray="6 5"/>`;
   s+=svgText(half,32,'50% = 94,05 Mb','text-anchor="middle" fill="#b24b16"');
   s+=`<path d="M${point-8} 158 L${point+8} 158 L${point} 146 Z" fill="#243959"/>`;
   s+=svgText(Math.min(960,Math.max(150,point)),222,`Acumulat: ${fmt(sum,2)} Mb`,'text-anchor="middle"');
   s+=svgText(40,275,'0 Mb')+svgText(1070,275,'188,1 Mb','text-anchor="end"');
   $('n50-plot').innerHTML=s;
   $('n50-summary').textContent=count<m.l50?`Encara falten ${fmt(m.total/2-sum,2)} Mb per arribar al 50%.`:`El primer creuament és al contig ${m.l50}: N50 = ${fmt(m.n50)} Mb · L50 = ${m.l50}.`;
 }
 function polls(){
   document.querySelectorAll('.poll-slot').forEach(el=>{
     if(el.dataset.ready)return;el.dataset.ready='1';
     const id=el.dataset.poll,cfg=GPI_POLLS[id]||{};
     const safe=u=>{try{const p=new URL(u);return p.protocol==='https:'&&(p.hostname==='wooclap.com'||p.hostname.endsWith('.wooclap.com'));}catch{return false;}};
     if(safe(cfg.url)){const a=document.createElement('a');a.href=cfg.url;a.target='_blank';a.rel='noopener';a.textContent='Obrir la pregunta a Wooclap';el.append(a);}
     else el.textContent='Discussió a l’aula · Vinculació amb Wooclap pendent';
     if(safe(cfg.embedUrl)){const frame=document.createElement('iframe');frame.src=cfg.embedUrl;frame.title='Pregunta Wooclap '+id;frame.loading='lazy';el.append(frame);}
   });
 }
 function init(){
   polls();
   if(!$('coverage'))return;
   $('coverage').addEventListener('input',updateCoverage);
   $('resample').addEventListener('click',()=>{seed++;updateCoverage();});
   $('read-length').addEventListener('input',updateRepeat);
   $('n50-step').addEventListener('input',updateN50);
   $('n50-threshold').addEventListener('click',()=>{$('n50-step').value=GPI.assemblyStats(GPI_DATA.contigsMb).l50;updateN50();});
   // Prevent presentation shortcuts from stealing input navigation, while retaining Tab.
   document.querySelectorAll('input,button').forEach(el=>el.addEventListener('keydown',e=>{if(e.key!=='Tab')e.stopPropagation();}));
   updateCoverage();updateRepeat();updateN50();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
