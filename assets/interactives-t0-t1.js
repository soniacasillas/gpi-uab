(function () {
  const $ = (id) => document.getElementById(id);
  const fmt = new Intl.NumberFormat('ca-ES', { maximumFractionDigits: 2 });

  function initMilestones() {
    const slider = $('milestone-year');
    const out = $('milestone-year-value');
    const box = $('milestone-detail');
    if (!slider || slider.dataset.ready) return;
    const events = [
      [1977, 'ΦX174', 'Primer genoma complet seqüenciat, un virus de 5.386 nucleòtids.'],
      [1995, 'H. influenzae', 'Primer genoma complet d’un organisme de vida lliure.'],
      [2001, 'Genoma humà', 'Es publiquen els primers esborranys del genoma humà.'],
      [2022, 'T2T-CHM13', 'Una seqüència humana sense buits per als autosomes i el cromosoma X.'],
      [2023, 'Pangenoma humà', 'Un primer esborrany combina 94 haplotips de 47 individus.'],
      [2025, 'EBP fase II', 'El projecte passa de pilots a producció coordinada a gran escala.']
    ];
    function draw() {
      const year = Number(slider.value);
      let event = events[0];
      for (const candidate of events) if (candidate[0] <= year) event = candidate;
      out.value = year;
      box.innerHTML = `<strong>${event[0]} · ${event[1]}</strong><br>${event[2]}`;
    }
    slider.addEventListener('input', draw); slider.dataset.ready = '1'; draw();
  }

  function initGenomeScale() {
    const slider = $('genome-size');
    const out = $('genome-size-value');
    const summary = $('genome-size-summary');
    const bar = $('genome-size-bar');
    if (!slider || slider.dataset.ready) return;
    function draw() {
      const gb = 10 ** (Number(slider.value) / 100);
      const bp = gb * 1e9;
      const metres = bp * 0.34e-9;
      out.value = gb < 0.01 ? `${fmt.format(gb * 1000)} Mb` : `${fmt.format(gb)} Gb`;
      summary.textContent = `${fmt.format(bp)} parells de bases · uns ${fmt.format(metres)} m de DNA si l’estenguéssim`;
      bar.style.width = `${Math.max(2, Math.min(100, (Math.log10(gb) + 3) / 5.3 * 100))}%`;
    }
    slider.addEventListener('input', draw); slider.dataset.ready = '1'; draw();
  }

  function initReference() {
    const slider = $('reference-copies');
    const out = $('reference-copies-value');
    const paths = $('reference-paths');
    const summary = $('reference-summary');
    if (!slider || slider.dataset.ready) return;
    function draw() {
      const n = Number(slider.value); out.value = n;
      paths.innerHTML = '';
      for (let i = 0; i < n; i++) {
        const row = document.createElement('div'); row.className = 'haplotype-row';
        row.innerHTML = `<span style="width:20%"></span><span style="width:${10 + (i % 4) * 3}%;background:${i % 3 === 0 ? '#b24b16' : '#147d79'}"></span><span style="flex:1"></span>`;
        paths.appendChild(row);
      }
      summary.textContent = n === 1 ? 'Una seqüència lineal simplifica les coordenades, però no representa tota la variació.' : `${n} haplotips mostren camins alternatius i variants estructurals.`;
    }
    slider.addEventListener('input', draw); slider.dataset.ready = '1'; draw();
  }

  function initComposition() {
    const slider = $('repeat-fraction');
    const out = $('repeat-fraction-value');
    const rep = $('repeat-part'); const other = $('other-part');
    if (!slider || slider.dataset.ready) return;
    function draw() {
      const v = Number(slider.value); out.value = `${v}%`;
      rep.style.width = `${v}%`; other.style.width = `${100 - v}%`;
      rep.textContent = v > 18 ? `DNA repetitiu ${v}%` : `${v}%`;
      other.textContent = 100 - v > 18 ? `Altres seqüències ${100 - v}%` : `${100-v}%`;
    }
    slider.addEventListener('input', draw); slider.dataset.ready = '1'; draw();
  }

  function initCValue() {
    const slider = $('cvalue-pg');
    const out = $('cvalue-pg-value');
    const answer = $('cvalue-answer');
    if (!slider || slider.dataset.ready) return;
    function draw() {
      const pg = Number(slider.value); out.value = `${fmt.format(pg)} pg`;
      const gb = pg * 0.978;
      answer.innerHTML = `<strong>${fmt.format(gb)} Gb</strong> · conversió didàctica: 1 pg ≈ 0,978 Gb`;
    }
    slider.addEventListener('input', draw); slider.dataset.ready = '1'; draw();
  }

  function initZoom() {
    const slider = $('browser-zoom');
    const out = $('browser-zoom-value'); const track = $('browser-track');
    if (!slider || slider.dataset.ready) return;
    function draw() {
      const z = Number(slider.value); out.value = `${z}×`;
      track.style.transform = `scaleX(${1 + z / 8})`;
    }
    slider.addEventListener('input', draw); slider.dataset.ready = '1'; draw();
  }

  function initAll() {
    initMilestones(); initGenomeScale(); initReference(); initComposition(); initCValue(); initZoom();
    document.querySelectorAll('input,button').forEach(el => {
      if (el.dataset.keysReady) return;
      el.dataset.keysReady = '1';
      el.addEventListener('keydown', event => { if (event.key !== 'Tab') event.stopPropagation(); });
    });
  }
  document.addEventListener('DOMContentLoaded', initAll);
  document.addEventListener('slidechanged', initAll);
})();
