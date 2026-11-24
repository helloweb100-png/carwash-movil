/* ==========================================================
   Car Wash Móvil · script.js
   - Si el número queda vacío, el botón flotante y el envío del
     formulario se ocultan y queda solo el teléfono.
   ========================================================== */
const WHATSAPP_NUMERO = "524427061533";

(function () {
  'use strict';
  const html = document.documentElement;
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover)').matches;
  const finePtr = window.matchMedia('(pointer: fine)').matches;
  const ease = t => (1 - Math.cos(Math.PI * t)) / 2;
  const vh = () => window.innerHeight || document.documentElement.clientHeight;

  /* ---------- WhatsApp ---------- */
  const waOk = !!String(WHATSAPP_NUMERO).trim();
  const waUrl = msg => 'https://wa.me/' + WHATSAPP_NUMERO + '?text=' + encodeURIComponent(msg);
  function setWa(el, msg) {
    if (!waOk) return;
    el.setAttribute('href', waUrl(msg));
    el.setAttribute('target', '_blank');
    el.setAttribute('rel', 'noopener noreferrer');
    el.dataset.msg = msg;
  }
  if (!waOk) html.classList.add('no-wa');
  $$('[data-wa]').forEach(a => {
    if (waOk) setWa(a, a.dataset.msg || 'Hola Car Wash Móvil, quiero agendar un lavado a domicilio en Querétaro.');
    else if (!a.classList.contains('btn') || a.id === 'waBtn') { a.style.display = 'none'; }
    else { a.setAttribute('href', 'tel:+524427061533'); }
  });

  /* ---------- Titulares partidos en palabras ---------- */
  function split(el) {
    const text = el.textContent.replace(/\s+/g, ' ').trim();
    let i = 0;
    const frag = document.createDocumentFragment();
    const mk = node => {
      const w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
      const s = document.createElement('span'); s.style.setProperty('--i', i++); s.appendChild(node); w.appendChild(s); return w;
    };
    Array.from(el.childNodes).forEach(n => {
      if (n.nodeType === 3) {
        (n.textContent.match(/\S+|\s+/g) || []).forEach(t => {
          if (/^\s+$/.test(t)) frag.appendChild(document.createTextNode(' '));
          else frag.appendChild(mk(document.createTextNode(t)));
        });
      } else frag.appendChild(mk(n.cloneNode(true)));
    });
    el.textContent = '';
    const sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = text;
    el.appendChild(sr); el.appendChild(frag);
  }
  $$('[data-split]').forEach(split);

  /* ---------- Cargador ---------- */
  const loader = $('#loader');
  let loaderDone = false;
  function finishLoader() {
    if (loaderDone) return; loaderDone = true;
    if (loader) {
      loader.classList.add('open');
      setTimeout(() => { loader.classList.add('gone'); }, 600);
    }
    html.classList.add('ready');
    startCounters();
  }
  (function runLoader() {
    if (!loader) { finishLoader(); return; }
    const cnt = $('#ldCount');
    const dur = reduce ? 500 : 1600; const t0 = performance.now();
    (function tick(now) {
      const p = clamp((now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 2.2);
      loader.style.setProperty('--ld', e.toFixed(4));
      if (cnt) cnt.textContent = String(Math.round(e * 100)).padStart(3, '0') + '%';
      if (p < 1) requestAnimationFrame(tick); else finishLoader();
    })(t0);
    setTimeout(finishLoader, 2200);
  })();

  /* ---------- Lenis (scroll suave) ---------- */
  let lenis = null;
  if (typeof Lenis !== 'undefined' && canHover && !reduce) {
    try {
      lenis = new Lenis({ lerp: .09, smoothWheel: true });
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
    } catch (e) { lenis = null; }
  }
  const HH = 68;
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (!id || id === '#' || a.hasAttribute('data-wa') && waOk) return;
      const t = $(id); if (!t) return;
      e.preventDefault();
      closeMenu();
      if (lenis) lenis.scrollTo(t, { offset: id === '#inicio' ? 0 : -HH + 1, duration: 1.4 });
      else t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
  });

  /* ---------- Revelado (IntersectionObserver + respaldo por geometría) ---------- */
  const rvEls = $$('.rv');
  const reveal = el => { if (!el.classList.contains('in')) el.classList.add('in'); };
  let io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { reveal(en.target); io.unobserve(en.target); } }), { threshold: .15, rootMargin: '0px 0px -8% 0px' });
    rvEls.forEach(el => io.observe(el));
  }
  function geoReveal() {
    const h = vh();
    rvEls.forEach(el => {
      if (el.classList.contains('in')) return;
      const r = el.getBoundingClientRect();
      if (r.top < h * .96 && r.bottom > 0) reveal(el);
    });
  }
  let geoQ = false;
  const geoSched = () => { if (geoQ) return; geoQ = true; requestAnimationFrame(() => { geoQ = false; geoReveal(); }); };
  window.addEventListener('scroll', geoSched, { passive: true });
  window.addEventListener('resize', geoSched);
  window.addEventListener('load', () => { setTimeout(geoReveal, 2000); setTimeout(geoReveal, 4000); setTimeout(geoReveal, 7000); });
  geoReveal();

  /* ---------- Menú móvil ---------- */
  const burger = $('#burger'), menu = $('#menu');
  function openMenu() { menu.classList.add('open'); menu.setAttribute('aria-hidden', 'false'); burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', 'Cerrar menú'); html.classList.add('nolock'); if (lenis) lenis.stop(); }
  function closeMenu() { if (!menu || !menu.classList.contains('open')) return; menu.classList.remove('open'); menu.setAttribute('aria-hidden', 'true'); burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Abrir menú'); html.classList.remove('nolock'); if (lenis) lenis.start(); }
  if (burger) burger.addEventListener('click', () => menu.classList.contains('open') ? closeMenu() : openMenu());
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  window.addEventListener('resize', () => { if (window.innerWidth >= 900) closeMenu(); });
  if (menu) $$('.menu a[data-wa]').forEach(a => a.addEventListener('click', closeMenu));

  /* ---------- Enlace activo del menú ---------- */
  const navLinks = $$('.nav a');
  if ('IntersectionObserver' in window) {
    const so = new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting) navLinks.forEach(a => a.classList.toggle('act', a.getAttribute('href') === '#' + en.target.id));
    }), { rootMargin: '-45% 0px -50% 0px' });
    ['por-que', 'ciclo', 'paquetes', 'zonas', 'faq'].forEach(id => { const s = document.getElementById(id); if (s) so.observe(s); });
  }

  /* ---------- Burbujas (canvas) ---------- */
  function Bubbles(canvas, count, opts) {
    const ctx = canvas.getContext('2d'); if (!ctx) return { px: 0, py: 0 };
    let W = 0, H = 0, dpr = 1, vis = true, list = [], t0 = performance.now();
    const api = { px: 0, py: 0 };
    const mkB = (init) => ({ x: Math.random() * W, y: init ? Math.random() * H : H + 20 + Math.random() * 60, r: 3 + Math.random() * (opts.big || 14), vy: .15 + Math.random() * .5, ph: Math.random() * 6.28, amp: 8 + Math.random() * 22, life: 0, pop: Math.random() < .22 ? 120 + Math.random() * 380 : 1e9, ring: 0, z: .4 + Math.random() * .9 });
    function size() {
      const r = canvas.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!list.length) list = Array.from({ length: count() }, () => mkB(true));
    }
    function draw(still) {
      ctx.clearRect(0, 0, W, H);
      list.forEach(b => {
        if (!still) {
          b.y -= b.vy * b.z * (opts.speed || 1); b.life++;
          if (b.life > b.pop && !b.ring) b.ring = 1;
          if (b.ring) { b.ring += 1.4; if (b.ring > 22) Object.assign(b, mkB(false)); }
          if (b.y < -30) Object.assign(b, mkB(false));
        }
        const x = b.x + Math.sin(b.ph + b.life * .015) * b.amp + api.px * 24 * b.z, y = b.y + api.py * 16 * b.z;
        if (b.ring) { ctx.beginPath(); ctx.arc(x, y, b.r + b.ring, 0, 6.283); ctx.strokeStyle = opts.stroke.replace('A', String(Math.max(0, .5 - b.ring / 44))); ctx.lineWidth = 1.5; ctx.stroke(); return; }
        ctx.beginPath(); ctx.arc(x, y, b.r, 0, 6.283);
        ctx.fillStyle = opts.fill; ctx.fill(); ctx.strokeStyle = opts.stroke.replace('A', '.65'); ctx.lineWidth = 1.2; ctx.stroke();
        ctx.beginPath(); ctx.arc(x - b.r * .35, y - b.r * .35, b.r * .22, 0, 6.283); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fill();
      });
    }
    function loop() { if (vis) draw(false); requestAnimationFrame(loop); }
    size(); window.addEventListener('resize', () => { const n = count(); size(); while (list.length < n) list.push(mkB(true)); list.length = n; });
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { vis = es[0].isIntersecting; }, { threshold: 0 }).observe(canvas);
    if (reduce) draw(true); else requestAnimationFrame(loop);
    return api;
  }
  const mobileCount = n => () => window.innerWidth < 800 ? n : Math.round(n * 70 / 36);
  const bubHero = $('#burbujas') ? Bubbles($('#burbujas'), mobileCount(36), { stroke: 'rgba(157,255,58,A)', fill: 'rgba(157,255,58,.06)', big: 14 }) : { px: 0, py: 0 };
  if ($('#burbujasRes')) Bubbles($('#burbujasRes'), () => window.innerWidth < 800 ? 22 : 40, { stroke: 'rgba(7,17,10,A)', fill: 'rgba(255,255,255,.18)', big: 18, speed: .8 });

  /* ---------- Hero: bucle «Scan & Wipe» ---------- */
  const hero = $('#inicio'), stage = $('#stage'), gcRect = $('#gcRect'), shine = $('#shine');
  const hudEstado = $('#hudEstado'), hudBar = $('#hudBar'), hudPct = $('#hudPct'), stamp = $('#stamp');
  const cos = $$('.co');
  let heroVis = true, hStart = performance.now();
  function setWipe(w, sh) {
    stage.style.setProperty('--wipe', w.toFixed(4));
    const x = w * 960; gcRect.setAttribute('x', x.toFixed(1)); gcRect.setAttribute('width', Math.max(0, 960 - x).toFixed(1));
    const pct = Math.round(w * 100);
    hudPct.textContent = pct + '%';
    const f = Math.round(pct / 20); hudBar.textContent = '▮'.repeat(f) + '▯'.repeat(5 - f);
    hudEstado.textContent = pct >= 100 ? 'LISTO' : 'LIMPIANDO';
    cos.forEach(c => c.classList.toggle('ok', w >= parseFloat(c.dataset.x) + .02));
    shine.style.transform = 'translateX(' + (sh * 1300) + 'px) skewX(-20deg)';
  }
  if (stage) {
    if (reduce) { setWipe(1, -1); stamp.classList.add('on'); }
    else {
      if ('IntersectionObserver' in window) new IntersectionObserver(es => { heroVis = es[0].isIntersecting; }, { threshold: 0 }).observe(hero);
      (function loop(now) {
        if (heroVis) {
          const t = ((now - hStart) / 1000) % 8;
          let w = 0, sh = -1, st = false;
          if (t < .6) w = 0;
          else if (t < 5.4) w = ease((t - .6) / 4.8);
          else { w = 1; if (t < 6.6) sh = (t - 5.4) / 1.2 * 1.2 - .1; st = t > 5.6 && t < 7.4; }
          setWipe(w, sh); stamp.classList.toggle('on', st);
        }
        requestAnimationFrame(loop);
      })(performance.now());
    }
    // inclinación 3D y parallax de burbujas con el puntero
    if (canHover && !reduce) {
      hero.addEventListener('pointermove', e => {
        const r = hero.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        stage.style.setProperty('--ry', (x * 12).toFixed(2)); stage.style.setProperty('--rx', (-y * 6).toFixed(2));
        bubHero.px = x; bubHero.py = y;
      });
      hero.addEventListener('pointerleave', () => { stage.style.setProperty('--ry', 0); stage.style.setProperty('--rx', 0); bubHero.px = 0; bubHero.py = 0; });
    }
  }

  /* ---------- Contadores del hero ---------- */
  let countersStarted = false;
  function startCounters() {
    if (countersStarted) return; countersStarted = true;
    $$('[data-count]').forEach(el => {
      const target = +el.dataset.count, pre = el.dataset.pre || '', suf = el.dataset.suf || '';
      if (reduce) { el.textContent = pre + target + suf; return; }
      const o = { v: 0 };
      const upd = () => { el.textContent = pre + Math.round(o.v) + suf; };
      if (typeof anime !== 'undefined') anime({ targets: o, v: target, duration: 1800, delay: 900, easing: 'easeOutExpo', update: upd, complete: upd });
      else { const t0 = performance.now() + 900; (function f(n) { const p = clamp((n - t0) / 1800); o.v = target * (1 - Math.pow(1 - p, 3)); upd(); if (p < 1) requestAnimationFrame(f); })(performance.now()); }
    });
  }

  /* ---------- Bucle de cintas con velocidad ligada al scroll ---------- */
  const bands = $$('.band').map(b => ({ el: b, tr: $('.band-track', b), speed: +b.dataset.speed, dir: +b.dataset.dir, x: 0, hov: 1, half: 0 }));
  let scrollVel = 0, lastY = window.scrollY, bandsVis = true;
  bands.forEach(b => {
    b.el.addEventListener('pointerenter', () => { b.hold = true; }); b.el.addEventListener('pointerleave', () => { b.hold = false; });
  });
  const cintaEl = $('#cinta');
  if (cintaEl && 'IntersectionObserver' in window) new IntersectionObserver(es => { bandsVis = es[0].isIntersecting; }, { rootMargin: '200px' }).observe(cintaEl);
  let bPrev = performance.now();
  (function bandLoop(now) {
    const dt = Math.min(.05, (now - bPrev) / 1000); bPrev = now;
    if (bandsVis && !reduce) {
      bands.forEach(b => {
        b.half = b.tr.scrollWidth / 2; if (!b.half) return;
        if (b.x === 0 && b.dir > 0) b.x = -b.half;
        b.hov += ((b.hold ? 0 : 1) - b.hov) * .1;
        b.x += b.dir * (b.speed + scrollVel * 18) * dt * b.hov;
        if (b.dir < 0 && b.x <= -b.half) b.x += b.half;
        if (b.dir > 0 && b.x >= 0) b.x -= b.half;
        b.tr.style.transform = 'translate3d(' + b.x.toFixed(1) + 'px,0,0)';
      });
    }
    scrollVel *= .92;
    requestAnimationFrame(bandLoop);
  })(bPrev);
  if (!html.classList.contains('js')) bands.forEach(b => { b.tr.style.animation = ''; });

  /* ---------- Ciclo, showroom, ruta, pie y progreso (loop de scroll) ---------- */
  const header = $('#header'), hp = hero;
  const cicloEl = $('#cicloTrack'), lis = $$('#pasos li'), vls = $$('.vl'), visorLbl = $('#visorLbl');
  const showEl = $('#showroom'), rutaEl = $('#rutaPedir'), wordmark = $('#wordmark'), meterNum = $('#meterNum');
  const gItems = $$('.g'), trzCar = $('#trzCar');
  let curStep = -1, lastScroll = window.scrollY, ticking = false;

  function setStep(s) {
    if (s === curStep) return; curStep = s;
    cicloEl.dataset.step = s;
    lis.forEach((li, i) => li.classList.toggle('on', i === s));
    vls.forEach((v, i) => v.classList.toggle('on', i === s));
    if (lis[s]) visorLbl.textContent = 'ESTACIÓN 0' + (s + 1) + '/05 · ' + lis[s].dataset.lbl;
  }
  function placeCar(rp) {
    if (!rutaEl || !trzCar) return;
    const horiz = window.getComputedStyle($('.trz-h', rutaEl)).display !== 'none';
    const svg = $(horiz ? '.trz-h' : '.trz-v', rutaEl), path = $('.trz-fg', svg);
    if (!path || !path.getTotalLength) return;
    const L = path.getTotalLength(), box = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal, sx = box.width / vb.width, sy = box.height / vb.height;
    const p0 = path.getPointAtLength(L * rp), p1 = path.getPointAtLength(Math.min(L, L * rp + 2));
    const x = p0.x * sx, y = p0.y * sy;
    const ang = Math.atan2((p1.y - p0.y) * sy, (p1.x - p0.x) * sx) * 180 / Math.PI;
    trzCar.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + (horiz ? ang : 90).toFixed(1) + 'deg)';
  }

  function update() {
    ticking = false;
    const sy = window.scrollY, h = vh(), doc = Math.max(1, document.documentElement.scrollHeight - h);
    scrollVel = Math.min(8, scrollVel + Math.abs(sy - lastY) * .06); lastY = sy;
    const pg = clamp(sy / doc);
    html.style.setProperty('--pg', pg.toFixed(4));
    if (meterNum) meterNum.textContent = Math.round(pg * 100) + '%';
    // header
    header.classList.toggle('scrolled', sy > 40);
    if (!menu.classList.contains('open')) {
      if (sy > lastScroll + 6 && sy > 320) header.classList.add('hide'); else if (sy < lastScroll - 4 || sy < 320) header.classList.remove('hide');
    }
    lastScroll = sy;
    // hero
    hp.style.setProperty('--hero-p', clamp(sy / (hp.offsetHeight * .85)).toFixed(3));
    // ciclo
    if (cicloEl) {
      const r = cicloEl.getBoundingClientRect(), total = Math.max(1, r.height - h), p = clamp(-r.top / total);
      cicloEl.style.setProperty('--p', p.toFixed(4));
      setStep(Math.min(4, Math.floor(p * 5)));
    }
    // showroom
    if (showEl) {
      const r = showEl.getBoundingClientRect(), total = Math.max(1, r.height - h), p = clamp(-r.top / total);
      const sp = ease(clamp(p / .6));
      showEl.style.setProperty('--sp', sp.toFixed(4));
      showEl.classList.toggle('tags', p >= .4);
    }
    // ruta
    if (rutaEl) {
      const r = rutaEl.getBoundingClientRect(), rp = clamp((h * .8 - r.top) / (r.height * .9));
      rutaEl.style.setProperty('--rp', rp.toFixed(4)); placeCar(rp);
    }
    // pie
    if (wordmark) { const r = wordmark.getBoundingClientRect(); wordmark.style.setProperty('--fill', clamp((h - r.top) / (h * .55)).toFixed(3)); }
    // galería parallax
    gItems.forEach(g => {
      const r = g.getBoundingClientRect(); if (r.bottom < -50 || r.top > h + 50) return;
      const off = ((r.top + r.height / 2) - h / 2) / h; g.style.setProperty('--py', (clamp(-off, -1, 1) * 22).toFixed(1) + 'px');
    });
  }
  const sched = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', sched, { passive: true });
  window.addEventListener('resize', sched);
  window.addEventListener('load', () => { sched(); setTimeout(sched, 600); });
  update();

  /* ---------- Tilt + spotlight ---------- */
  if (canHover && !reduce) {
    $$('[data-tilt]').forEach(el => {
      const mag = el.classList.contains('ficha') ? 5 : 6;
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.setProperty('--ry', ((x - .5) * mag * 2).toFixed(2)); el.style.setProperty('--rx', (-(y - .5) * mag * 1.6).toFixed(2));
        el.style.setProperty('--mx', (x * 100).toFixed(1) + '%'); el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', () => { el.style.setProperty('--ry', 0); el.style.setProperty('--rx', 0); });
    });
    // botones magnéticos
    $$('[data-magnet]').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        b.style.transform = 'translate(' + clamp(dx * .22, -8, 8).toFixed(1) + 'px,' + clamp(dy * .3, -8, 8).toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  /* ---------- Cursor personalizado ---------- */
  const cur = $('#cursor');
  if (cur && finePtr && !reduce && window.getComputedStyle(cur).display !== 'none') {
    let cx = 0, cy = 0, tx = 0, ty = 0;
    window.addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; cur.classList.add('on'); });
    document.addEventListener('pointerleave', () => cur.classList.remove('on'));
    document.addEventListener('pointerover', e => {
      const t = e.target.closest ? e.target : null; if (!t) return;
      cur.classList.toggle('ver', !!t.closest('[data-cursor]'));
      cur.classList.toggle('big', !t.closest('[data-cursor]') && !!t.closest('a,button,[data-magnet],summary,.node'));
    });
    (function f() { cx += (tx - cx) * .18; cy += (ty - cy) * .18; cur.style.transform = 'translate(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px)'; requestAnimationFrame(f); })();
  }

  /* ---------- Paquetes ---------- */
  const PK = [
    { id: 'sb', n: 'Súper básico', lema: 'Frescura exprés', a: 150, c: 200, nivel: 1, items: ['Aspirado', 'Lavado de tapetes', 'Lavado exterior con champú', 'Secado', 'Limpieza de vidrios', 'Lavado de rines', 'Líquido para llantas'] },
    { id: 'p1', n: 'Paquete 1', lema: 'Limpieza completa de diario', a: 200, c: 300, nivel: 2, items: ['Aspirado', 'Lavado de tapetes', 'Limpieza de puertas', 'Limpieza de tablero', 'Limpieza de vidrios', 'Lavado exterior con champú', 'Lavado de llantas', 'Líquido para llantas', 'Secado'] },
    { id: 'p2', n: 'Paquete 2', lema: 'Cuidado interior + brillo', a: 400, c: 500, nivel: 3, items: ['Aspirado', 'Lavado de tapetes', 'Brocha con líquido especial en portavasos y ventilas del A/C', 'Limpieza de puertas', 'Limpieza de tablero', 'Crema en puertas y tablero', 'Limpieza de vidrios', 'Lavado exterior con champú', 'Secado', 'Líquido para llantas'] },
    { id: 'p3', n: 'Paquete 3', lema: 'Detalle de acabado', a: 800, c: 1000, nivel: 5, items: ['Aspirado', 'Lavado de tapetes', 'Brocha con líquido especial en portavasos y ventilas del A/C', 'Limpieza de puertas', 'Limpieza de tablero', 'Crema en puertas y tablero', 'Limpieza de vidrios', 'Lavado exterior con champú', 'Secado', 'Líquido para llantas con líquido ferroso', 'Molduras de plástico negro revividas', 'Quitagotas y repelente de agua en retrovisores'] },
    { id: 'p4', n: 'Paquete 4', lema: 'Detallado total', a: 1700, c: 2000, nivel: 7, items: ['Aspirado', 'Lavado de tapetes', 'Brocha con líquido especial en portavasos y ventilas del A/C', 'Limpieza de puertas', 'Limpieza de tablero', 'Crema en puertas y tablero', 'Limpieza de vidrios', 'Lavado exterior con champú', 'Secado', 'Líquido para llantas con líquido ferroso', 'Molduras de plástico negro revividas', 'Quitagotas y repelente de agua en retrovisores', 'Limpieza profunda de muebles y cojines', 'Limpieza de cielo'] },
    { id: 'p5', n: 'Paquete 5 · solo interior', lema: 'Interior a fondo', a: 700, c: 900, nivel: 4, items: ['Aspirado', 'Limpieza de tapetes', 'Limpieza de puertas y tablero con crema', 'Limpieza profunda de muebles y cojines', 'Limpieza de cielo'] },
    { id: 'p6', n: 'Paquete 6 · interior + exterior', lema: 'Interior profundo + llantas', a: 1000, c: 1200, nivel: 6, items: ['Aspirado', 'Limpieza de tapetes', 'Limpieza de puertas y tablero con crema', 'Limpieza profunda de muebles y cojines', 'Limpieza de cielo', 'Limpieza exterior', 'Limpieza férrica de llantas', 'Crema para llantas'] }
  ];
  const money = n => '$' + n.toLocaleString('en-US');
  const state = { pkg: 'sb', veh: 'a' };
  const fPrecio = $('#fPrecio'), fNivel = $('#fNivel i') ? $$('#fNivel i') : [], fLista = $('#fLista'), fBtn = $('#fBtn');
  const cmpHead = $$('#cmp thead th'), cmpRows = $$('#cmp tbody tr');

  function roller(el, n) {
    const str = n.toLocaleString('en-US'), key = str.replace(/\d/g, '#');
    if (el.dataset.key !== key) {
      el.dataset.key = key;
      const digits = Array.from({ length: 10 }, (_, i) => '<b>' + i + '</b>').join('');
      el.innerHTML = '<span class="sr-only">' + money(n) + ' pesos mexicanos</span><span class="dgs" aria-hidden="true">$</span>' +
        str.split('').map(c => /\d/.test(c) ? '<span class="dg" aria-hidden="true"><span class="dgr" style="transform:translateY(0)">' + digits + '</span></span>' : '<span class="dgs" aria-hidden="true">' + c + '</span>').join('');
    } else el.firstChild.textContent = money(n) + ' pesos mexicanos';
    const cols = $$('.dgr', el); let k = 0;
    const apply = () => str.split('').forEach(c => { if (/\d/.test(c)) { cols[k++].style.transform = 'translateY(' + (-(+c)) + 'em)'; } });
    if (reduce) { apply(); return; }
    requestAnimationFrame(() => requestAnimationFrame(apply));
  }

  function updatePkg(first) {
    const p = PK.find(x => x.id === state.pkg), price = p[state.veh], vname = state.veh === 'a' ? 'auto' : 'camioneta';
    $('#fLema').textContent = p.lema; $('#fNombre').textContent = p.n;
    $('#fVeh').textContent = vname; $('#ribbon').hidden = p.id !== 'p4';
    roller(fPrecio, price);
    $$('#fNivel i').forEach((i, k) => i.classList.toggle('on', k < p.nivel));
    fLista.innerHTML = p.items.map((t, i) => '<li style="--i:' + i + '">' + t + '</li>').join('');
    setWa(fBtn, 'Hola Car Wash Móvil, quiero el ' + p.n + ' para mi ' + vname + ' (' + money(price) + ').');
    $$('.pk').forEach(b => { const on = b.dataset.pkg === state.pkg; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
    PK.forEach(x => { const el = $('[data-price="' + x.id + '"]'); if (el) el.textContent = money(x[state.veh]); });
    const idx = PK.findIndex(x => x.id === state.pkg) + 1;
    cmpHead.forEach((th, i) => th.classList.toggle('sel', i === idx));
    cmpRows.forEach(r => Array.from(r.children).forEach((c, i) => { if (i > 0) c.classList.toggle('sel', i === idx); }));
    // sincroniza el formulario
    const fp = $('#fPaq'); if (fp && !first) fp.value = state.pkg;
    const rv = $('input[name="veh"][value="' + state.veh + '"]'); if (rv && !first) rv.checked = true;
    updateChip();
  }
  $$('.pk').forEach(b => b.addEventListener('click', () => { state.pkg = b.dataset.pkg; updatePkg(); }));
  const sw = $('#vehSwitch');
  if (sw) $$('button', sw).forEach(b => b.addEventListener('click', () => {
    state.veh = b.dataset.veh; sw.dataset.v = state.veh;
    $$('button', sw).forEach(x => x.setAttribute('aria-checked', x === b));
    updatePkg();
  }));

  /* ---------- Galería + lightbox ---------- */
  const lb = $('#lb'), lbImg = $('#lbImg'), lbCap = $('#lbCap');
  let lbI = 0;
  const gData = gItems.map(g => ({ src: $('img', g).currentSrc || $('img', g).src, alt: $('img', g).alt, cap: $('.g-lbl', g).textContent, el: g, pos: $('img', g).style.objectPosition }));
  function showLb(i, flipFrom) {
    lbI = (i + gData.length) % gData.length; const d = gData[lbI];
    lbImg.src = d.src; lbImg.alt = d.alt; lbCap.textContent = d.cap;
    if (flipFrom && !reduce && lbImg.animate) {
      const go = () => {
        const a = flipFrom, b = lbImg.getBoundingClientRect(); if (!b.width) return;
        lbImg.animate([{ transform: 'translate(' + (a.left - b.left) + 'px,' + (a.top - b.top) + 'px) scale(' + (a.width / b.width) + ',' + (a.height / b.height) + ')', opacity: .5 }, { transform: 'none', opacity: 1 }], { duration: 560, easing: 'cubic-bezier(.2,.7,.2,1)' });
      };
      if (lbImg.complete) go(); else lbImg.onload = go;
    }
  }
  if (lb && lb.showModal) {
    gItems.forEach((g, i) => g.addEventListener('click', () => { const r = $('img', g).getBoundingClientRect(); lb.showModal(); showLb(i, r); }));
    $('#lbX').addEventListener('click', () => lb.close());
    $('#lbPrev').addEventListener('click', () => showLb(lbI - 1));
    $('#lbNext').addEventListener('click', () => showLb(lbI + 1));
    lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
    document.addEventListener('keydown', e => { if (!lb.open) return; if (e.key === 'ArrowLeft') showLb(lbI - 1); if (e.key === 'ArrowRight') showLb(lbI + 1); });
    let sx = 0;
    lb.addEventListener('pointerdown', e => { sx = e.clientX; });
    lb.addEventListener('pointerup', e => { const dx = e.clientX - sx; if (Math.abs(dx) > 60) showLb(lbI + (dx < 0 ? 1 : -1)); });
  } else {
    gItems.forEach(g => g.addEventListener('click', () => window.open($('img', g).src, '_blank', 'noopener')));
  }

  /* ---------- Zonas / radar ---------- */
  const ZONAS = ['Libramiento Sur Poniente', 'Sonterra', 'Tres Cantos', 'Viñedos', 'Av. Peñaflor y condominios aledaños', 'Colonia Satélite'];
  const nodes = $$('.node'), zcs = $$('.zc'), zCta = $('#zCta');
  nodes.forEach(n => {
    const a = +n.style.getPropertyValue('--a'), r = +n.style.getPropertyValue('--r'), rad = a * Math.PI / 180;
    n.style.left = (50 + r / 2 * Math.sin(rad)).toFixed(2) + '%'; n.style.top = (50 - r / 2 * Math.cos(rad)).toFixed(2) + '%';
    n.style.animationDelay = '0s'; $('i', n).style.animationDelay = (a / 360 * 6).toFixed(2) + 's';
  });
  function pickZone(z) {
    zcs.forEach(c => c.classList.toggle('on', +c.dataset.z === z));
    nodes.forEach(n => n.classList.toggle('on', +n.dataset.z === z));
    const span = $('span', zCta);
    if (z >= 0) {
      span.textContent = 'Sí, ¿llegan a ' + ZONAS[z] + '? Quiero agendar';
      setWa(zCta, 'Hola Car Wash Móvil, ¿llegan a ' + ZONAS[z] + ' en Querétaro? Quiero agendar un lavado.');
      const fz = $('#fZona'); if (fz) fz.value = ZONAS[z];
    } else {
      span.textContent = '¿Llegan a mi colonia? Pregúntanos';
      setWa(zCta, 'Hola Car Wash Móvil, estoy en otra zona de Querétaro. ¿Llegan a mi colonia?');
    }
  }
  zcs.forEach(c => c.addEventListener('click', () => pickZone(+c.dataset.z)));
  nodes.forEach(n => n.addEventListener('click', () => pickZone(+n.dataset.z)));

  /* ---------- Formulario → WhatsApp ---------- */
  const form = $('#form'), fMsg = $('#formMsg'), fSend = $('#fSend'), fChip = $('#fChip');
  function updateChip() {
    if (!fChip) return;
    const sel = $('#fPaq').value, v = ($('input[name="veh"]:checked') || {}).value || 'a';
    const p = PK.find(x => x.id === sel);
    fChip.textContent = p ? money(p[v]) : 'A tu medida';
  }
  if (form) {
    if (!waOk) fSend.style.display = 'none';
    $('#fPaq').addEventListener('change', e => { if (PK.find(x => x.id === e.target.value)) { state.pkg = e.target.value; updatePkg(true); } updateChip(); });
    $$('input[name="veh"]').forEach(r => r.addEventListener('change', () => { state.veh = r.value; if (sw) { sw.dataset.v = r.value; $$('button', sw).forEach(x => x.setAttribute('aria-checked', x.dataset.veh === r.value)); } updatePkg(true); }));
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!waOk) return;
      const nom = $('#fNom').value.trim(), fld = $('#fNom').parentElement;
      if (!nom) { fld.classList.add('err'); fMsg.textContent = 'Escribe tu nombre para poder saludarte.'; fMsg.className = 'form-msg bad'; $('#fNom').focus(); return; }
      fld.classList.remove('err'); fMsg.className = 'form-msg';
      const v = $('input[name="veh"]:checked').value === 'a' ? 'auto' : 'camioneta', zona = $('#fZona').value, sel = $('#fPaq').value, p = PK.find(x => x.id === sel), extra = $('#fMsg').value.trim();
      const paq = p ? p.n + ' (' + money(p[v === 'auto' ? 'a' : 'c']) + ')' : 'No sé, recomiéndenme';
      const msg = 'Hola Car Wash Móvil, soy ' + nom + '. Quiero lavar mi ' + v + ' en ' + zona + '. Paquete: ' + paq + '. ' + extra;
      fSend.querySelector('span').textContent = 'Abriendo WhatsApp…';
      fMsg.textContent = '✓ Listo, te llevamos a WhatsApp con tu mensaje.';
      window.open(waUrl(msg.trim()), '_blank', 'noopener');
      setTimeout(() => { fSend.querySelector('span').textContent = 'Enviar por WhatsApp'; }, 3000);
    });
    $('#fNom').addEventListener('input', () => { $('#fNom').parentElement.classList.remove('err'); });
  }

  /* ---------- Botón flotante: burbuja periódica ---------- */
  const bubble = $('#waBubble');
  if (bubble && waOk) {
    const cycle = () => { bubble.classList.add('on'); setTimeout(() => bubble.classList.remove('on'), 6000); };
    setTimeout(() => { cycle(); setInterval(cycle, 20000); }, 4000);
  }

  /* ---------- Ruta SVG: pausa de animaciones si hay movimiento reducido ---------- */
  if (reduce) $$('svg').forEach(s => { if (s.pauseAnimations) s.pauseAnimations(); });

  /* ---------- Estado inicial ---------- */
  updatePkg(true);
  pickZone(-1);
  sched();
})();
