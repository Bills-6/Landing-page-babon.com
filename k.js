// script.js — Dark Lab interactive + sliders + wave animation (pure JS)

(() => {
  // DOM
  const canvas = document.getElementById('graph');
  const ctx = canvas.getContext('2d', { alpha: false });

  const A_slider = document.getElementById('A_slider');
  const B_slider = document.getElementById('B_slider');
  const C_slider = document.getElementById('C_slider');
  const D_slider = document.getElementById('D_slider');
  const A_num = document.getElementById('A_num');
  const B_num = document.getElementById('B_num');
  const C_num = document.getElementById('C_num');
  const D_num = document.getElementById('D_num');

  const xminInp = document.getElementById('xmin');
  const xmaxInp = document.getElementById('xmax');
  const playBtn = document.getElementById('playBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const resetBtn = document.getElementById('resetBtn');
  const autoUpdate = document.getElementById('autoUpdate');
  const showTicks = document.getElementById('showTicks');
  const showOrigin = document.getElementById('showOrigin');
  const formulaDisplay = document.getElementById('formula-display');
  const animParamSelect = document.getElementById('animParam');
  const speedButtons = document.querySelectorAll('.speed-btn');

  // HiDPI fix
  function fixDPI() {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.getAttribute('width');
    const h = canvas.getAttribute('height');
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  fixDPI();

  // Colors
  const COLORS = {
    bg: "#050608",
    grid: "#172026",
    axis: "#9fb5ba",
    ticks: "#7f8b90",
    graph: "#00f0d1",
    chalk: "#e6f6f5",
    neon: "#7b4bff",
    center: "#ff6b6b"
  };

  // State
  const baseParams = {
    A: parseFloat(A_slider.value),
    B: parseFloat(B_slider.value),
    C: parseFloat(C_slider.value),
    D: parseFloat(D_slider.value)
  };

  // animated params are what is currently used to draw (for smoothing)
  const animState = { A: baseParams.A, B: baseParams.B, C: baseParams.C, D: baseParams.D };

  // animation control
  let playing = false;
  let animParam = animParamSelect.value; // 'C' by default per UI
  let speed = 1.0; // normal default
  let t0 = performance.now() / 1000;
  let lastFrame = t0;

  // smoothing helper (lerp)
  function lerp(a,b,f) { return a + (b - a) * f; }

  // mapping: world -> px
  function createMapper(xmin, xmax, canvasW, canvasH, padding = 60) {
    const xr = xmax - xmin;
    const pxPerX = (canvasW - padding*2) / xr;
    const ymaxAbs = Math.max(1, Math.abs(baseParams.D) + Math.abs(baseParams.A));
    const yr = Math.max(5, ymaxAbs * 3);
    const ymin = -yr/2;
    const ymax = yr/2;
    const pxPerY = (canvasH - padding*2) / (ymax - ymin);
    return { xmin, xmax, ymin, ymax, pxPerX, pxPerY, padding };
  }

  // draw helpers (grid, axes, function, formula)
  function clearCanvas() {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0,0,canvas.width,canvas.height);
  }

  function drawGrid(mapper) {
    const { xmin, xmax, ymin, ymax, pxPerX, pxPerY, padding } = mapper;
    const W = canvas.width / (window.devicePixelRatio || 1);
    const H = canvas.height / (window.devicePixelRatio || 1);

    ctx.save();
    ctx.lineCap = 'butt';

    // minor vertical lines every 0.5
    ctx.beginPath();
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (let x = Math.ceil(xmin*2)/2; x <= xmax; x += 0.5) {
      const p = padding + (x - xmin) * pxPerX;
      ctx.moveTo(p, padding);
      ctx.lineTo(p, H - padding);
    }
    ctx.stroke();

    // major vertical lines
    ctx.beginPath();
    ctx.strokeStyle = hexToRGBA(COLORS.neon, 0.06);
    ctx.lineWidth = 1.6;
    for (let x = Math.ceil(xmin); x <= xmax; x += 1) {
      const p = padding + (x - xmin) * pxPerX;
      ctx.moveTo(p, padding);
      ctx.lineTo(p, H - padding);
    }
    ctx.stroke();

    // horizontal
    ctx.beginPath();
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (let y = Math.floor(ymin); y <= ymax; y += 0.5) {
      const py = padding + (ymax - y) * pxPerY;
      ctx.moveTo(padding, py);
      ctx.lineTo(W - padding, py);
    }
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = hexToRGBA(COLORS.neon, 0.06);
    ctx.lineWidth = 1.6;
    for (let y = Math.floor(ymin); y <= ymax; y += 1) {
      const py = padding + (ymax - y) * pxPerY;
      ctx.moveTo(padding, py);
      ctx.lineTo(W - padding, py);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawArrow(x1,y1,x2,y2){
    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 2.2;
    ctx.stroke();
  }

  function drawAxes(mapper) {
    const { xmin, xmax, ymin, ymax, pxPerX, pxPerY, padding } = mapper;
    const W = canvas.width / (window.devicePixelRatio || 1);
    const H = canvas.height / (window.devicePixelRatio || 1);

    const y0 = (ymax >= 0 && ymin <= 0) ? padding + (ymax - 0) * pxPerY : (ymax < 0 ? padding : H - padding);
    const x0 = (xmin <= 0 && xmax >= 0) ? padding + (0 - xmin) * pxPerX : (xmin > 0 ? padding : W - padding);

    ctx.save();
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(padding, y0);
    ctx.lineTo(W - padding, y0);
    ctx.moveTo(x0, padding);
    ctx.lineTo(x0, H - padding);
    ctx.stroke();

    const arrowSize = 10;
    drawArrow(W - padding, y0, W - padding - arrowSize, y0 - arrowSize/2);
    drawArrow(W - padding, y0, W - padding - arrowSize, y0 + arrowSize/2);
    drawArrow(x0, padding, x0 - arrowSize/2, padding + arrowSize);
    drawArrow(x0, padding, x0 + arrowSize/2, padding + arrowSize);

    if (showTicks.checked) {
      ctx.fillStyle = COLORS.ticks;
      ctx.font = "12px 'Inter', Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      for (let x = Math.ceil(xmin); x <= xmax; x += 1) {
        const p = padding + (x - xmin) * pxPerX;
        ctx.beginPath();
        ctx.strokeStyle = COLORS.axis;
        ctx.lineWidth = 1.4;
        ctx.moveTo(p, y0 - 6);
        ctx.lineTo(p, y0 + 6);
        ctx.stroke();
        if (!(Math.abs(x) < 1e-8)) ctx.fillText(x.toString(), p, y0 + 8);
      }
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      for (let y = Math.floor(ymin); y <= ymax; y += 1) {
        const py = padding + (ymax - y) * pxPerY;
        ctx.beginPath();
        ctx.strokeStyle = COLORS.axis;
        ctx.lineWidth = 1.4;
        ctx.moveTo(x0 - 6, py);
        ctx.lineTo(x0 + 6, py);
        ctx.stroke();
        if (!(Math.abs(y) < 1e-8)) ctx.fillText(y.toString(), x0 - 8, py);
      }
    }

    if (showOrigin.checked) {
      ctx.fillStyle = COLORS.center;
      const r = 4;
      ctx.beginPath();
      ctx.arc(x0, y0, r, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = COLORS.chalk;
      ctx.font = "11px 'Inter', Arial";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText("(0,0)", x0 + 8, y0 - 8);
    }

    ctx.restore();
  }

  function drawFunction(mapper, fn) {
    const { xmin, xmax, pxPerX, pxPerY, padding, ymin, ymax } = mapper;
    const W = canvas.width / (window.devicePixelRatio || 1);
    const H = canvas.height / (window.devicePixelRatio || 1);

    const samples = Math.max(1000, Math.floor((xmax - xmin) * 120));
    const dx = (xmax - xmin) / samples;

    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = COLORS.graph;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    let started = false;
    for (let i = 0; i <= samples; i++) {
      const x = xmin + i * dx;
      const y = fn(x);
      if (!isFinite(y)) { started = false; continue; }
      const px = padding + (x - xmin) * pxPerX;
      const py = padding + (ymax - y) * pxPerY;
      if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // neon glow
    ctx.beginPath();
    ctx.lineWidth = 10;
    ctx.strokeStyle = hexToRGBA(COLORS.graph, 0.06);
    started = false;
    for (let i = 0; i <= samples; i++) {
      const x = xmin + i * dx;
      const y = fn(x);
      if (!isFinite(y)) { started = false; continue; }
      const px = padding + (x - xmin) * pxPerX;
      const py = padding + (ymax - y) * pxPerY;
      if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawFormulaText(A,B,C,D) {
    const padding = 18;
    ctx.save();
    ctx.font = "20px 'Segoe Script', 'Brush Script MT', cursive";
    ctx.fillStyle = COLORS.chalk;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const s = `y = ${formatNumber(A)}·cos(${formatNumber(B)}x ${C>=0?'+':'-'} ${formatNumber(Math.abs(C))}) ${D>=0?'+':'-'} ${formatNumber(Math.abs(D))}`;
    ctx.fillText(s, padding+2, padding+2);
    ctx.lineWidth = 1.0;
    ctx.strokeStyle = hexToRGBA('#000000', 0.12);
    ctx.strokeText(s, padding+2, padding+2);
    ctx.restore();
    formulaDisplay.textContent = s;
  }

  // formatting and util
  function formatNumber(n) {
    return Number(n).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
  }
  function hexToRGBA(hex, alpha) {
    hex = hex.replace('#','');
    const r = parseInt(hex.substring(0,2),16);
    const g = parseInt(hex.substring(2,4),16);
    const b = parseInt(hex.substring(4,6),16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // MAIN render
  function render(nowSec) {
    // read base (target) params from sliders
    const target = {
      A: parseFloat(A_slider.value),
      B: parseFloat(B_slider.value),
      C: parseFloat(C_slider.value),
      D: parseFloat(D_slider.value)
    };

    // smoothing towards target to keep slider moves smooth
    const smooth = 0.16; // higher = snappier
    animState.A = lerp(animState.A, target.A, smooth);
    animState.B = lerp(animState.B, target.B, smooth);
    animState.C = lerp(animState.C, target.C, smooth);
    animState.D = lerp(animState.D, target.D, smooth);

    // animation time
    const t = (performance.now() / 1000) - t0;

    // if playing, modify the animState for the selected animParam
    if (playing && animParam !== 'none') {
      const sp = speed; // speed multiplier
      // different animation styles per param (wave-like)
      switch (animParam) {
        case 'C':
          // move phase to make wave travel -> increment C
          animState.C += 0.9 * sp * (nowSec ? (nowSec - lastFrame) : (1/60));
          break;
        case 'A':
          // breathe amplitude around target A
          animState.A = target.A * (0.5 + 0.6 * Math.abs(Math.sin(t * 1.2 * sp)));
          break;
        case 'B':
          // frequency modulation
          animState.B = target.B * (0.6 + 0.8 * Math.abs(Math.sin(t * 0.8 * sp)));
          break;
        case 'D':
          // slow vertical offset oscillation
          animState.D = target.D + 0.8 * Math.sin(t * 0.9 * sp);
          break;
      }
    }

    // clamp some values for stability
    animState.B = Math.max(0, Math.min(25, animState.B));

    // clearing & drawing
    clearCanvas();
    const W = canvas.width / (window.devicePixelRatio || 1);
    const H = canvas.height / (window.devicePixelRatio || 1);
    let xmin = parseFloat(xminInp.value) || -10;
    let xmax = parseFloat(xmaxInp.value) || 10;
    if (xmin >= xmax) { xmin = -10; xmax = 10; xminInp.value = -10; xmaxInp.value = 10; }

    const mapper = createMapper(xmin, xmax, W, H, 60);
    drawGrid(mapper);
    drawAxes(mapper);

    // function with current animState
    const fn = (x) => animState.A * Math.cos(animState.B * x + animState.C) + animState.D;
    drawFunction(mapper, fn);
    drawFormulaText(animState.A, animState.B, animState.C, animState.D);

    lastFrame = nowSec || (performance.now() / 1000);
  }

  // loop
  function loop(now) {
    render(performance.now() / 1000);
    if (playing) {
      rafId = requestAnimationFrame(loop);
    } else {
      rafId = null;
    }
  }
  let rafId = null;

  // controls wiring
  function startAnimation() {
    if (playing) return;
    playing = true;
    t0 = performance.now() / 1000;
    lastFrame = t0;
    playBtn.classList.add('hidden');
    pauseBtn.classList.remove('hidden');
    rafId = requestAnimationFrame(loop);
  }
  function pauseAnimation() {
    playing = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    playBtn.classList.remove('hidden');
    pauseBtn.classList.add('hidden');
  }
  function resetAll() {
    // reset sliders to defaults
    A_slider.value = 1; A_num.value = 1;
    B_slider.value = 1; B_num.value = 1;
    C_slider.value = 0; C_num.value = 0;
    D_slider.value = 0; D_num.value = 0;
    animParamSelect.value = 'C';
    speed = 1;
    document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.speed-btn[data-speed="1"]').classList.add('active');
    // reset anim state
    animState.A = 1; animState.B = 1; animState.C = 0; animState.D = 0;
    baseParams.A = 1; baseParams.B = 1; baseParams.C = 0; baseParams.D = 0;
    // redraw single frame
    render();
  }

  // slider <-> number syncing
  function syncRangeNum(rangeEl, numEl) {
    rangeEl.addEventListener('input', () => {
      numEl.value = rangeEl.value;
      if (autoUpdate.checked && !playing) render();
    });
    numEl.addEventListener('input', () => {
      rangeEl.value = numEl.value;
      if (autoUpdate.checked && !playing) render();
    });
  }
  syncRangeNum(A_slider, A_num);
  syncRangeNum(B_slider, B_num);
  syncRangeNum(C_slider, C_num);
  syncRangeNum(D_slider, D_num);

  // play/pause/reset bindings
  playBtn.addEventListener('click', () => {
    animParam = animParamSelect.value;
    startAnimation();
  });
  pauseBtn.addEventListener('click', pauseAnimation);
  resetBtn.addEventListener('click', () => {
    pauseAnimation();
    resetAll();
  });

  // manual render button behavior: update on change if autoUpdate else user can still call render by toggling play/pause
  document.getElementById('animParam').addEventListener('change', e => {
    animParam = e.target.value;
  });

  // speed buttons
  speedButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      speedButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      speed = parseFloat(btn.dataset.speed);
    });
  });

  // auto update and tick toggle wiring
  [xminInp, xmaxInp, showTicks, showOrigin].forEach(el => {
    el.addEventListener('input', () => { if (autoUpdate.checked && !playing) render(); });
  });

  // initial draw
  render();
  // if autoUpdate ON, keep UI responsive: listen to number inputs to redraw
  [A_num,B_num,C_num,D_num].forEach(n => n.addEventListener('input', () => { if (autoUpdate.checked && !playing) render(); }));

  // ensure window resize re-fix dpi and redraw
  window.addEventListener('resize', () => {
    // restore base pixel dims (attrs) then fixDPI
    canvas.setAttribute('width', 1200);
    canvas.setAttribute('height', 650);
    fixDPI();
    render();
  });

  // initial hidden/visible state of play/pause
  pauseBtn.classList.add('hidden');

  // convenience: toggle play/pause via space key
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (playing) pauseAnimation(); else startAnimation();
    }
  });

})();
