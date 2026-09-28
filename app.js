(() => {
  'use strict';
  const canvas = document.getElementById('network');
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const motion = document.getElementById('motion-toggle');
  let w = 500, h = 500, rotation = .6, tilt = -.25, paused = reduced.matches, visible = true, dragging = false, lastX = 0, raf = 0;
  const points = [];
  const rings = 36, segments = 84;
  for (let i = 0; i < rings; i++) {
    const a = i / rings * Math.PI * 2;
    const row = [];
    for (let j = 0; j < segments; j++) {
      const b = j / segments * Math.PI * 2;
      const r = 1.45 + .48 * Math.cos(b);
      row.push([r * Math.cos(a), .48 * Math.sin(b), r * Math.sin(a)]);
    }
    points.push(row);
  }
  function project(p) {
    const x = p[0] * Math.cos(rotation) - p[2] * Math.sin(rotation);
    const z = p[0] * Math.sin(rotation) + p[2] * Math.cos(rotation);
    const y = p[1] * Math.cos(tilt) - z * Math.sin(tilt);
    const depth = p[1] * Math.sin(tilt) + z * Math.cos(tilt);
    const spin = -.7;
    const scale = Math.min(w, h) * .235 * (5 / (5 + depth));
    return [w / 2 + (x * Math.cos(spin) - y * Math.sin(spin)) * scale, h / 2 + (x * Math.sin(spin) + y * Math.cos(spin)) * scale, depth];
  }
  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < rings; i++) {
      for (let j = 0; j < segments; j++) {
        const a = project(points[i][j]);
        const b = project(points[i][(j + 1) % segments]);
        ctx.strokeStyle = `rgba(211,211,211,${.17 + ((2.3 - a[2]) / 4.6) * .57})`;
        ctx.lineWidth = .55;
        ctx.beginPath();ctx.moveTo(a[0], a[1]);ctx.lineTo(b[0], b[1]);ctx.stroke();
        if (j % 3 === 0) {
          const c = project(points[(i + 1) % rings][j]);
          ctx.beginPath();ctx.moveTo(a[0], a[1]);ctx.lineTo(c[0], c[1]);ctx.stroke();
        }
      }
    }
    [[0,0],[8,20],[16,45]].forEach(([a,b]) => {const p=project(points[a][b]);ctx.fillStyle='#ee5839';ctx.fillRect(p[0]-3,p[1]-3,6,6)});
  }
  let previous = 0;
  function loop(time) {
    if (!visible || paused || document.hidden) { raf = 0; return; }
    if (time - previous > 32) { if (!dragging) rotation += .004; draw(); previous = time; }
    raf = requestAnimationFrame(loop);
  }
  function start() { if (!raf && !paused && visible && !document.hidden) raf = requestAnimationFrame(loop); }
  function syncMotion() { motion.textContent = paused ? '▷' : 'Ⅱ'; motion.setAttribute('aria-pressed', String(paused)); motion.setAttribute('aria-label', paused ? '播放立体结构动画' : '暂停立体结构动画'); }
  new ResizeObserver(() => { const rect = canvas.getBoundingClientRect();w = rect.width; h = rect.height; const dpr = Math.min(devicePixelRatio || 1, 2);canvas.width = w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);draw(); }).observe(canvas);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; start(); }).observe(canvas);
  motion.addEventListener('click', () => { paused = !paused; syncMotion(); start(); if(paused)draw(); });
  reduced.addEventListener('change', () => {paused = reduced.matches;syncMotion();start();draw();});
  document.addEventListener('visibilitychange', start);
  canvas.addEventListener('pointerdown', e => {if(e.pointerType==='mouse'){dragging=true;lastX=e.clientX;canvas.setPointerCapture(e.pointerId)}});
  canvas.addEventListener('pointermove', e => {if(dragging){rotation+=(e.clientX-lastX)*.008;lastX=e.clientX;draw()}});
  const release = () => dragging=false;
  canvas.addEventListener('pointerup', release);canvas.addEventListener('pointercancel', release);
  syncMotion();draw();start();

  const dialog = document.getElementById('detail-dialog');
  const detail = document.getElementById('dialog-content');
  const title = document.getElementById('dialog-title');
  const close = document.getElementById('close-dialog');
  let origin = null;
  const titles = ['1052 OS / 项目档案','KouriChat / 项目档案','GEO / 开发实践','帮我看 App / 产品实践','NeoAI / 项目档案','心晴港湾 / 项目档案'];
  function openDetail(template, label, trigger) {
    if (!template) return;
    origin = trigger;
    detail.replaceChildren(template.content.cloneNode(true));
    title.textContent = label;
    dialog.showModal();
    dialog.scrollTop = 0;
    close.focus({preventScroll:true});
  }
  document.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => {
    const index = Number(button.dataset.project);
    openDetail(document.getElementById('project-'+index), titles[index], button);
  }));
  document.querySelectorAll('[data-resume]').forEach(button => button.addEventListener('click', () => openDetail(document.getElementById('full-resume'), '完整履历 / 公开展示版', button)));
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => {if(e.target === dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
  dialog.addEventListener('close', () => origin?.focus({preventScroll:true}));

  if (!reduced.matches && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('motion-ready');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {entry.target.classList.remove('pending');observer.unobserve(entry.target)}
    }), {threshold:0,rootMargin:'0px 0px -35px 0px'});
    document.querySelectorAll('.section-heading,.flagship,.secondary-project,.good-project,.project-line,.craft-intro,.execution-chain,.education,.timeline article,.recognition,.archive-bar').forEach(el => {el.classList.add('reveal','pending');observer.observe(el)});
  }
})();
