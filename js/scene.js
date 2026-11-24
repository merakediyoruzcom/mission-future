/* Mission: Future — 2D koloni sahnesi (Canvas, düşük donanım dostu) */
window.MF = window.MF || {};

MF.Scene = (function () {
  let canvas, ctx, getState, w = 0, h = 0, dpr = 1, raf = 0, running = false;
  let stars = [], hills = [], dust = [], walkers = [];
  let flashColor = null, flashUntil = 0;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init(el, stateFn) {
    canvas = el; ctx = el.getContext('2d'); getState = stateFn;
    new ResizeObserver(resize).observe(el);
    resize();
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    start();
  }

  function resize() {
    dpr = Math.min(2, devicePixelRatio || 1);
    const r = canvas.getBoundingClientRect();
    w = Math.max(1, r.width); h = Math.max(1, r.height);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = Array.from({ length: Math.round((w * h) / 2500) }, () => ({ x: Math.random() * w, y: Math.random() * h * 0.7, r: Math.random() * 1.3 + 0.2, p: Math.random() * 6 }));
    hills = [0.62, 0.7].map((base, i) => Array.from({ length: 24 }, (_, k) => ({ x: (k / 23) * w, y: h * base + Math.sin(k * (1.3 + i)) * 14 + Math.random() * 10 })));
    dust = Array.from({ length: 120 }, () => ({ x: Math.random() * w, y: Math.random() * h, v: 1 + Math.random() * 3 }));
    if (!running) draw(performance.now());
  }

  function start() { if (!running && canvas) { running = true; raf = requestAnimationFrame(loop); } }
  function stop() { running = false; cancelAnimationFrame(raf); }
  function loop(t) { draw(t); if (running && !reduced) raf = requestAnimationFrame(loop); else running = false; }
  function refresh() { if (!running) draw(performance.now()); }

  function flash(color, ms = 700) { flashColor = color; flashUntil = performance.now() + ms; start(); }

  function layout(s) {
    const order = ['solar', 'oxygen', 'water', 'greenhouse', 'habitat', 'shield'];
    const list = [];
    order.forEach((k) => { for (let i = 0; i < s.buildings[k]; i++) list.push(k); });
    return list;
  }

  function draw(t) {
    const s = getState();
    if (!s) return;
    const ground = h * 0.74;

    // Gökyüzü: Proxima B — kırmızı cüce yıldızın turuncu ışığı
    const sky = ctx.createLinearGradient(0, 0, 0, ground);
    sky.addColorStop(0, '#0a0b1f'); sky.addColorStop(0.6, '#2a1430'); sky.addColorStop(1, '#7a3326');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);

    for (const st of stars) {
      ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t / 1400 + st.p));
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Proxima yıldızı
    const sx = w * 0.78, sy = h * 0.24, sr = Math.min(w, h) * 0.07;
    const glow = ctx.createRadialGradient(sx, sy, sr * 0.3, sx, sy, sr * 3.2);
    glow.addColorStop(0, 'rgba(255,140,80,.9)'); glow.addColorStop(0.3, 'rgba(255,90,50,.25)'); glow.addColorStop(1, 'rgba(255,90,50,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(sx, sy, sr * 3.2, 0, 7); ctx.fill();
    ctx.fillStyle = '#ff9a5c'; ctx.beginPath(); ctx.arc(sx, sy, sr, 0, 7); ctx.fill();

    // Nova-X yörüngede
    const ox = ((t / 90) % (w + 200)) - 100;
    ctx.fillStyle = '#c9d4f2'; ctx.fillRect(ox, h * 0.1, 26, 5); ctx.fillRect(ox + 8, h * 0.1 - 3, 10, 11);

    // Tepeler
    [['#3b1d22', hills[0]], ['#4d2420', hills[1]]].forEach(([c, pts]) => {
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, h);
      pts.forEach((p) => ctx.lineTo(p.x, p.y)); ctx.lineTo(w, h); ctx.fill();
    });
    ctx.fillStyle = '#5a2b22'; ctx.fillRect(0, ground, w, h - ground);

    // Modüller
    const list = layout(s);
    const gap = Math.min(78, (w - 60) / Math.max(1, list.length));
    const startX = w / 2 - (gap * (list.length - 1)) / 2;
    list.forEach((k, i) => drawBuilding(k, startX + i * gap, ground, Math.min(1, gap / 70), t, s));

    // Mürettebat
    const n = Math.min(40, Math.round(s.pop / 2));
    while (walkers.length < n) walkers.push({ x: Math.random() * w, v: (Math.random() - 0.5) * 0.6, c: ['#e7ecf7', '#5ee2c8', '#ffb35c', '#7aa7ff'][walkers.length % 4] });
    walkers.length = n;
    walkers.forEach((p) => {
      p.x += reduced ? 0 : p.v; if (p.x < 10 || p.x > w - 10) p.v *= -1;
      ctx.fillStyle = p.c; ctx.fillRect(p.x, ground + 8 + (p.c.length % 3) * 6, 3, 6);
    });

    // Fırtına
    if (s.stormDays > 0) {
      ctx.fillStyle = 'rgba(140,80,40,.45)'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(210,150,90,.6)';
      dust.forEach((d) => { d.x += d.v * 4; d.y += d.v * 0.5; if (d.x > w) { d.x = -10; d.y = Math.random() * h; } ctx.fillRect(d.x, d.y, 10, 1.5); });
    }

    // Moral düşükse soğuk ton
    if (s.morale < 30) { ctx.fillStyle = 'rgba(30,40,90,.25)'; ctx.fillRect(0, 0, w, h); }

    if (flashColor && t < flashUntil) {
      ctx.fillStyle = flashColor; ctx.globalAlpha = (flashUntil - t) / 700 * 0.5; ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1;
    }
  }

  function drawBuilding(k, x, g, sc, t, s) {
    ctx.save(); ctx.translate(x, g); ctx.scale(sc, sc);
    switch (k) {
      case 'solar':
        ctx.fillStyle = '#8a8fa3'; ctx.fillRect(-2, -18, 4, 18);
        ctx.fillStyle = s.stormDays > 0 ? '#2b3350' : '#2f5bd3';
        ctx.beginPath(); ctx.moveTo(-24, -20); ctx.lineTo(24, -28); ctx.lineTo(24, -16); ctx.lineTo(-24, -8); ctx.fill();
        ctx.strokeStyle = '#9fb6ff'; ctx.lineWidth = 0.6; ctx.stroke();
        break;
      case 'greenhouse':
        ctx.fillStyle = 'rgba(126,224,129,.35)'; ctx.strokeStyle = '#7ee081';
        ctx.beginPath(); ctx.arc(0, 0, 26, Math.PI, 0); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#2f9e6e'; for (let i = -16; i <= 16; i += 8) ctx.fillRect(i, -8, 3, 8);
        break;
      case 'water':
        ctx.fillStyle = '#4a6fa5'; ctx.fillRect(-16, -30, 32, 30);
        ctx.fillStyle = '#7fb3ff'; ctx.fillRect(-12, -26 + 4 * Math.sin(t / 600), 24, 6);
        break;
      case 'oxygen':
        ctx.fillStyle = '#c9d4f2'; ctx.fillRect(-12, -36, 24, 36);
        ctx.fillStyle = '#5ee2c8'; ctx.beginPath(); ctx.arc(0, -42 - ((t / 40) % 20), 4, 0, 7); ctx.globalAlpha = 0.6; ctx.fill(); ctx.globalAlpha = 1;
        break;
      case 'habitat':
        ctx.fillStyle = '#d6c5b0'; ctx.beginPath(); ctx.arc(0, 0, 28, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#ffd27a'; for (let i = -14; i <= 14; i += 14) ctx.fillRect(i - 3, -14, 6, 6);
        break;
      case 'shield':
        ctx.fillStyle = '#7a5ad8'; ctx.fillRect(-4, -40, 8, 40);
        ctx.strokeStyle = 'rgba(160,130,255,.5)'; ctx.beginPath(); ctx.arc(0, -40, 10 + 3 * Math.sin(t / 300), 0, 7); ctx.stroke();
        break;
    }
    ctx.restore();
  }

  return { init, refresh, flash };
})();
