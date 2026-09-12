(function(root) {
  'use strict';
  function assemblyStats(values) {
    if (!values.length || values.some(x => !Number.isFinite(x) || x <= 0)) throw new Error('Calen longituds positives.');
    const sorted = [...values].sort((a,b)=>b-a);
    const total = sorted.reduce((a,b)=>a+b,0);
    let cumulative=0, index=0;
    for (;index<sorted.length;index++) { cumulative+=sorted[index]; if(cumulative >= total/2-1e-9) break; }
    return {sorted,total,n50:sorted[index],l50:index+1,cumulative};
  }
  function randomGenerator(seed) {
    let s=seed>>>0;
    return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};
  }
  function coverageModel(coverage,seed=42,G=10000,L=500) {
    if (!Number.isFinite(coverage)||coverage<0||!Number.isInteger(G)||!Number.isInteger(L)||G<=0||L<=0||L>G) throw new Error('Paràmetres no vàlids.');
    const N=Math.round(coverage*G/L), depth=new Uint32Array(G), random=randomGenerator(seed);
    for(let n=0;n<N;n++) { const start=Math.floor(random()*G); for(let i=0;i<L;i++) depth[(start+i)%G]++; }
    const missing=depth.reduce((n,x)=>n+(x===0),0);
    return {N,G,L,depth,coverage:N*L/G,missingFraction:missing/G,poissonMissing:Math.exp(-N*L/G)};
  }
  function repeatModel(lengthKb,repeatKb=8,anchorKb=1) {
    return {bridges:lengthKb>=repeatKb+2*anchorKb,threshold:repeatKb+2*anchorKb};
  }
  const api={assemblyStats,coverageModel,repeatModel};
  root.GPI=api;
  if(typeof module!=='undefined' && module.exports) module.exports=api;
})(globalThis);
