(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const fmt = (n, d = 2) => Number(n).toLocaleString('ca-ES', { maximumFractionDigits: d });

  function library() {
    const input = $('lib-r'); if (!input || input.dataset.ready) return;
    const draw = () => {
      const r = Number(input.value), p = 1 - Math.exp(-r);
      $('lib-r-value').value = `${fmt(r, 1)}×`;
      $('lib-meter').style.width = `${p * 100}%`;
      $('lib-summary').textContent = `Probabilitat idealitzada de representació: ${fmt(p * 100, 1)}% · Fracció esperada no representada: ${fmt((1-p)*100, 1)}%`;
    };
    input.addEventListener('input', draw); input.dataset.ready = '1'; draw();
  }

  function phred() {
    const input = $('phred-q'); if (!input || input.dataset.ready) return;
    const draw = () => {
      const q = Number(input.value), pe = 10 ** (-q / 10);
      $('phred-q-value').value = `Q${q}`;
      $('phred-summary').innerHTML = `P<sub>error</sub> = ${pe < 0.00001 ? pe.toExponential(1) : fmt(pe, 6)} · aproximadament 1 error per ${fmt(1 / pe, 0)} bases`;
    };
    input.addEventListener('input', draw); input.dataset.ready = '1'; draw();
  }

  function technology() {
    const input = $('tech-priority'); if (!input || input.dataset.ready) return;
    const labels = ['cost per base', 'exactitud de molècula', 'longitud i estructura'];
    const rows = [
      [{n:'Illumina',s:'Molt adequada',d:'moltes lectures curtes i exactes'}, {n:'PacBio HiFi',s:'Adequada',d:'lectures llargues de consens'}, {n:'Nanopore',s:'Depèn del disseny',d:'temps real i longitud flexible'}],
      [{n:'Illumina',s:'Alta',d:'per base, però lectura curta'}, {n:'PacBio HiFi',s:'Molt alta',d:'consens de la mateixa molècula'}, {n:'Nanopore',s:'Alta i evolutiva',d:'depèn de química i basecaller'}],
      [{n:'Illumina',s:'Limitada',d:'cal inferir amb fragments'}, {n:'PacBio HiFi',s:'Molt adequada',d:'fase i variants estructurals'}, {n:'Nanopore',s:'Molt adequada',d:'lectures ultra-llargues i senyal directe'}]
    ];
    const draw = () => {
      const i = Number(input.value); $('tech-priority-value').value = labels[i];
      $('tech-cards').innerHTML = rows[i].map(x => `<div class="card"><p class="card-title">${x.n}</p><p><strong>${x.s}</strong><br>${x.d}</p></div>`).join('');
    };
    input.addEventListener('input', draw); input.dataset.ready = '1'; draw();
  }

  function isoform() {
    const input = $('isoform-mode'); if (!input || input.dataset.ready) return;
    const labels = ['teixit A', 'teixit B', 'lectura curta'];
    const patterns = [[1,2,3,4],[1,2,4],[2,3]];
    const draw = () => {
      const i=Number(input.value); $('isoform-mode-value').value=labels[i];
      const gene = [1,2,3,4].map(e=>`<span class="exon exon-${e}">E${e}</span>`).join('<span class="intron"></span>');
      const transcript = patterns[i].map(e=>`<span class="exon exon-${e}">E${e}</span>`).join('<span class="join">—</span>');
      $('isoform-view').innerHTML = `<div class="iso-row"><b>Locus</b>${gene}</div><div class="iso-row"><b>${i===2?'Evidència local':'Isoforma'}</b>${transcript}</div><p class="small">${i===2?'Les unions observades no sempre determinen la combinació completa.':'Els exons seleccionats pertanyen a la mateixa molècula.'}</p>`;
    };
    input.addEventListener('input', draw); input.dataset.ready='1'; draw();
  }

  function normalization() {
    const input=$('dominant-gene'); if(!input||input.dataset.ready)return;
    const draw=()=>{
      const dominant=Number(input.value), w=900, x=150;
      $('dominant-gene-value').value=`${dominant}%`;
      const otherB=100-dominant;
      $('normalization-plot').innerHTML = `<text x="20" y="80">A</text><rect x="${x}" y="45" width="${w*.1}" height="55" fill="#b24b16"/><rect x="${x+w*.1}" y="45" width="${w*.9}" height="55" fill="#147d79"/><text x="20" y="175">B</text><rect x="${x}" y="140" width="${w*dominant/100}" height="55" fill="#b24b16"/><rect x="${x+w*dominant/100}" y="140" width="${w*otherB/100}" height="55" fill="#147d79"/><text x="${x+12}" y="80" fill="white">gen dominant</text><text x="${x+12}" y="175" fill="white">gen dominant</text><text x="${x+w}" y="235" text-anchor="end">100% de lectures</text>`;
      $('normalization-summary').textContent = dominant>10 ? 'Encara que els altres gens no canviïn en nombre absolut, ocupen una fracció menor de la biblioteca B.' : 'Les composicions són semblants; el biaix composicional és petit en aquest exemple.';
    };
    input.addEventListener('input',draw);input.dataset.ready='1';draw();
  }

  function jukesCantor(){
    const input=$('jc-p');if(!input||input.dataset.ready)return;
    const draw=()=>{const p=Number(input.value),d=-.75*Math.log(1-4*p/3),x0=70,y0=210,w=960,h=160,max=3.2;
      $('jc-p-value').value=fmt(p,2);
      let path='';for(let i=0;i<=100;i++){const px=.74*i/100,dy=-.75*Math.log(1-4*px/3),x=x0+px/.75*w,y=y0-Math.min(dy,max)/max*h;path+=`${i?'L':'M'}${x},${y}`;}
      const x=x0+p/.75*w,y=y0-Math.min(d,max)/max*h;
      $('jc-plot').innerHTML=`<line x1="${x0}" x2="${x0+w}" y1="${y0}" y2="${y0}" stroke="#526574"/><line x1="${x0}" x2="${x0}" y1="${y0}" y2="40" stroke="#526574"/><path d="${path}" fill="none" stroke="#147d79" stroke-width="5"/><circle cx="${x}" cy="${y}" r="9" fill="#b24b16"/><text x="${x0+w}" y="245" text-anchor="end">p observada</text><text x="20" y="45">d</text>`;
      $('jc-summary').textContent=`p = ${fmt(p,2)} · distància Jukes–Cantor d = ${fmt(d,2)} substitucions per lloc`;
    };input.addEventListener('input',draw);input.dataset.ready='1';draw();
  }

  function diversity(){
    const input=$('pi-minor');if(!input||input.dataset.ready)return;
    const draw=()=>{const p=Number(input.value),het=2*p*(1-p);$('pi-minor-value').value=fmt(p,2);$('pi-meter').style.width=`${het*200}%`;$('pi-summary').textContent=`2p(1−p) = ${fmt(het,3)} · ${fmt(het*100,1)}% de parelles difereixen en aquest lloc sota mostreig aleatori`;};
    input.addEventListener('input',draw);input.dataset.ready='1';draw();
  }

  function ld(){
    const generations=$('ld-generations'),recomb=$('ld-recomb');if(!generations||generations.dataset.ready)return;
    const draw=()=>{const t=Number(generations.value),r=Number(recomb.value),remain=(1-r)**t,x0=80,y0=195,w=960,h=145;
      $('ld-generations-value').value=t;$('ld-recomb-value').value=`${fmt(r*100,1)}%`;
      let path='';for(let i=0;i<=100;i++){const tx=200*i/100,v=(1-r)**tx;path+=`${i?'L':'M'}${x0+tx/200*w},${y0-v*h}`;}
      $('ld-plot').innerHTML=`<line x1="${x0}" x2="${x0+w}" y1="${y0}" y2="${y0}" stroke="#526574"/><path d="${path}" fill="none" stroke="#147d79" stroke-width="5"/><circle cx="${x0+t/200*w}" cy="${y0-remain*h}" r="9" fill="#b24b16"/><text x="${x0+w}" y="230" text-anchor="end">generacions</text><text x="25" y="55">D/D₀</text>`;
      $('ld-summary').textContent=`Resta el ${fmt(remain*100,1)}% del desequilibri inicial en el model.`;
    };generations.addEventListener('input',draw);recomb.addEventListener('input',draw);generations.dataset.ready='1';draw();
  }

  function init(){library();phred();technology();isoform();normalization();jukesCantor();diversity();ld();document.querySelectorAll('input,button').forEach(el=>{if(el.dataset.extraKeys)return;el.dataset.extraKeys='1';el.addEventListener('keydown',e=>{if(e.key!=='Tab')e.stopPropagation();});});}
  document.addEventListener('DOMContentLoaded',init);document.addEventListener('slidechanged',init);
})();
