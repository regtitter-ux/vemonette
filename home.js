/* DMALL landing page. Lean, self-contained (the old verification homepage + its
   script live frozen under /old-vemoni/). Handles: count-up numbers, EN/RU i18n,
   the account menu (whoami/logout), and the hero broadcast animation. */
(function () {
  'use strict';
  const base = (window.__VEMONI_API_BASE__ || '').replace(/\/+$/, '');

  /* ---------- Count-up numbers ---------- */
  function animateCount(el) {
    const target = +el.dataset.count, prefix = el.dataset.prefix || '', suffix = el.dataset.suffix || '';
    const start = performance.now(), dur = 1600;
    (function tick(now) {
      const p = Math.min(1, (now - start) / dur);
      const val = Math.round(target * (1 - Math.pow(1 - p, 3)));
      el.textContent = prefix + (target >= 1000 ? val.toLocaleString('en-US') : val) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { animateCount(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.5 });
  // The "live recipients" figure = total members across the catalog's servers. Fetch it first
  // (public), set the target, then start observing so the count-up runs to the real number.
  // "Live recipients all-time" = a 4M all-time base + the current live catalog reach.
  const REACH_BASE = 4000000;
  fetch(base + '/order/dmall/reach').then((r) => (r.ok ? r.json() : null)).then((d) => {
    if (d && d.recipients > 0) { const el = document.querySelector('[data-reach]'); if (el) el.dataset.count = REACH_BASE + d.recipients; }
  }).catch(() => {}).finally(() => {
    document.querySelectorAll('[data-count]').forEach((el) => io.observe(el));
  });

  /* ---------- Server feed for the hero globe (owner-managed list from /feed) ---------- */
  function iconUrl(id, icon) { return (!id || !icon) ? null : 'https://cdn.discordapp.com/icons/' + id + '/' + icon + '.png?size=128'; }
  const SERVERS = [
    { name: 'MIKU TAG・CHAT・SOCIAL', color: '#39c5bb', letter: 'M', id: '1369047464073498776', icon: 'dfab23ce3751ac4872b859eac2151ea8' },
    { name: 'YA0I TAG・CHAT・SOCIAL', color: '#e63b7a', letter: 'Y', id: '1369363539332042853', icon: 'a_355f16ede56cb094740b46546eee0a73' },
    { name: 'YURI TAG・CHAT・SOCIAL', color: '#a855f7', letter: 'Y', id: '1369076925389078609', icon: '113818409cc1ab5871354f52a7e36283' },
    { name: 'TETO TAG・CHAT・SOCIAL', color: '#d1004b', letter: 'T', id: '1369106099608748102', icon: 'a_9421492e28203f89f5003ea2ee618537' },
    { name: 'GIFLAND СНГ', color: '#5865f2', letter: 'G', id: '972405591140085791', icon: 'a_096abac0dd6b01694ef7aaceaf24e613' },
    { name: 'Guild Tags | 55k+ Guilds Server Tags', color: '#8b5cf6', letter: 'G', id: '724948162101293056', img: '/assets/gtl.svg' },
    { name: 'Server Tags', color: '#f59e0b', letter: 'S' },
    { name: 'lovecat', color: '#f472b6', letter: 'L' },
    { name: 'Server', color: '#22d3ee', letter: 'S' },
  ];
  let FEED = SERVERS;
  const GLOBE_PAL = ['#39c5bb', '#e63b7a', '#a855f7', '#d1004b', '#5865f2', '#22d3ee', '#8b5cf6', '#f59e0b', '#57f287', '#f472b6', '#5b8def', '#f0902f'];
  (async function loadCatalog() {
    // The globe mirrors the real DMALL catalog (public lots) with each server's live icon.
    try {
      const r = await fetch(base + '/order/dmall/catalog');
      if (r.ok) {
        const d = await r.json();
        if (Array.isArray(d.servers) && d.servers.length) {
          FEED = d.servers.map((s, i) => ({ name: s.name, id: s.id, img: s.icon || null, color: GLOBE_PAL[i % GLOBE_PAL.length], letter: (String(s.name || '?').trim()[0] || '?').toUpperCase() }));
          window.dispatchEvent(new Event('vemoni:feed'));
        }
      }
    } catch (_) {}
  })();

  /* ---------- Hero globe: broadcasts (letters) fly out to catalog servers ----------
     Rotating dotted planet. Buyers send an order into the Vemoni hub; the hub fans
     the broadcast OUT to catalog-server planets as flying letters (not back to the
     buyer). Auto-spins; drag to rotate. Adapted from the original globe. */
  (function globe() {
    const wrap = document.getElementById('viz'), canvas = document.getElementById('flow');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
    const cs = getComputedStyle(document.documentElement);
    const cvv = (v, f) => { const x = cs.getPropertyValue(v).trim(); return x || f; };
    const GREEN = cvv('--green', '#57f287'), BUY = '#86b6ff';
    const logo = new Image(); let logoOk = false; logo.onload = () => { logoOk = true; }; logo.src = '/assets/logo.png';
    const buyerImg = new Image(); let buyerImgOk = false; buyerImg.onload = () => { buyerImgOk = true; }; buyerImg.src = '/assets/suit.png';
    const secureImg = new Image(); let secureImgOk = false; secureImg.onload = () => { secureImgOk = true; }; secureImg.src = '/assets/secure.png';
    let W = 0, H = 0, dpr = 1, cx = 0, cy = 0, R = 0, raf;
    let rotY = 0.5, rotX = -0.32, velY = 0.0016, dragging = false, lastX = 0, lastY = 0, spinVel = velY;

    const NDOTS = 560, dots = [];
    (function () { const g = Math.PI * (3 - Math.sqrt(5)); for (let i = 0; i < NDOTS; i++) { const y = 1 - 2 * (i + 0.5) / NDOTS; const rr = Math.sqrt(1 - y * y); const th = g * i; dots.push([Math.cos(th) * rr, y, Math.sin(th) * rr]); } })();
    const ll = (la, lo) => { la = la * Math.PI / 180; lo = lo * Math.PI / 180; return [Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo)]; };

    const PARTNERS = [], CENTERS = [], BUYERS = [];
    const dist2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
    const nearest = (p, arr) => { let bi = 0, bd = Infinity; arr.forEach((n, i) => { const d = dist2(p, n.p); if (d < bd) { bd = d; bi = i; } }); return arr[bi]; };
    function fibSphere(n) { const pts = [], g = Math.PI * (3 - Math.sqrt(5)); for (let i = 0; i < n; i++) { const y = 1 - 2 * (i + 0.5) / n; const rr = Math.sqrt(Math.max(0, 1 - y * y)); const th = g * i; pts.push([Math.cos(th) * rr, y, Math.sin(th) * rr]); } return pts; }
    function buildNodes() {
      PARTNERS.length = CENTERS.length = BUYERS.length = 0;
      const all = (Array.isArray(FEED) ? FEED : []).filter((s) => s && s.name);
      const pPos = fibSphere(Math.max(1, all.length));
      const cPos = [ll(90, 0), ll(-90, 0), ll(0, 0), ll(0, 180)];
      const bPos = [ll(8, 26), ll(48, -66), ll(-28, 116), ll(64, 6), ll(-56, 44), ll(20, -174), ll(40, 168), ll(-6, -54), ll(30, -118), ll(-46, -20), ll(56, 128), ll(-18, 74)];
      pPos.forEach((p, i) => { const s = all[i] || {}; const src = s.img || iconUrl(s.id, s.icon); const n = { p, color: s.color || GREEN, img: null, src, name: s.name || null, letter: (s.letter || (s.name || '?').trim()[0] || '?').toUpperCase() }; PARTNERS.push(n); if (src) { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => { n.img = im; }; im.src = src; } });
      cPos.forEach((p) => CENTERS.push({ p }));
      bPos.forEach((p) => BUYERS.push({ p, center: null }));
      BUYERS.forEach((bn) => { bn.center = nearest(bn.p, CENTERS); });
    }

    // Particles: order flows buyer -> hub (blue), then the hub fans the broadcast OUT
    // to catalog servers as letters (green). Nothing returns to the buyer.
    const PARTS = [], FLOATS = [];
    function spawn() { if (!BUYERS.length || !CENTERS.length) return; const bn = BUYERS[(Math.random() * BUYERS.length) | 0], c = bn.center; if (!c) return; PARTS.push({ kind: 'in', a: bn.p, b: c.p, ctr: c, t: 0, sp: 0.008 + Math.random() * 0.005, trail: [] }); }
    function fanOut(c) { if (!PARTNERS.length) return; const k = Math.random() < 0.3 ? 2 + ((Math.random() * 3) | 0) : 1; for (let n = 0; n < k; n++) { const pn = PARTNERS[(Math.random() * PARTNERS.length) | 0]; PARTS.push({ kind: 'out', a: c.p, b: pn.p, t: 0, sp: 0.009 + Math.random() * 0.006, trail: [] }); } }

    function rot(v) { const cyw = Math.cos(rotY), syw = Math.sin(rotY); const x = v[0] * cyw + v[2] * syw, z1 = -v[0] * syw + v[2] * cyw, y = v[1]; const cp = Math.cos(rotX), sp = Math.sin(rotX); return [x, y * cp - z1 * sp, y * sp + z1 * cp]; }
    const proj = (v) => [cx + v[0] * R, cy - v[1] * R, v[2]];
    const bez = (a, c, b, t) => { const u = 1 - t; return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1], u * u * a[2] + 2 * u * t * c[2] + t * t * b[2]]; };
    const ctrlR = (a, b, lift) => { const mx = a[0] + b[0], my = a[1] + b[1], mz = a[2] + b[2], ml = Math.hypot(mx, my, mz) || 1; return [mx / ml * lift, my / ml * lift, mz / ml * lift]; };
    function drawArc(a, b, color, alpha, lift) { const c = ctrlR(a, b, lift); let prev = null; for (let s = 0; s <= 20; s++) { const v = rot(bez(a, c, b, s / 20)), p = proj(v); if (prev && v[2] > -0.15) { ctx.strokeStyle = color; ctx.globalAlpha = alpha * (v[2] > 0 ? 1 : 0.35); ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); } prev = p; } }
    // A little envelope glyph (the "letter" being delivered).
    function envelope(px, py, w, color) { const h = w * 0.68, x = px - w / 2, y = py - h / 2; ctx.save(); ctx.fillStyle = color; ctx.strokeStyle = 'rgba(6,16,26,.9)'; ctx.lineJoin = 'round'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.rect(x, y, w, h); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + 0.5, y + 1.5); ctx.lineTo(px, py + h * 0.16); ctx.lineTo(x + w - 0.5, y + 1.5); ctx.stroke(); ctx.restore(); }
    function drawFloat(fl) { const v = rot(fl.p); if (v[2] <= 0.02) return; const p = proj(v); const y = p[1] - 16 - 22 * fl.t; const a = (fl.t < 0.15 ? fl.t / 0.15 : 1 - (fl.t - 0.15) / 0.85) * Math.min(1, v[2] / 0.3); ctx.save(); ctx.globalAlpha = Math.max(0, a); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '800 15px Roboto,system-ui,sans-serif'; ctx.fillStyle = GREEN; ctx.fillText('✓', p[0], y); ctx.restore(); ctx.globalAlpha = 1; }

    function layout() { const r = wrap.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); W = r.width; H = r.height; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); cx = W / 2; cy = H / 2; R = Math.min(W, H) * 0.42; }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      if (!dragging && !reduce) { rotY += spinVel; spinVel += (velY - spinVel) * 0.04; }
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(cx, cy, R * 0.15, cx, cy, R * 1.35); g.addColorStop(0, 'rgba(34,168,240,.12)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.35, 0, 7); ctx.fill(); ctx.restore();
      if (logoOk) { ctx.save(); ctx.globalAlpha = 0.11; const s = R * 0.85; ctx.drawImage(logo, cx - s / 2, cy - s / 2, s, s); ctx.restore(); }
      for (const d of dots) { const v = rot(d), p = proj(v), dep = v[2]; ctx.globalAlpha = dep > 0 ? (0.22 + 0.5 * dep) : (0.05 + 0.1 * (1 + dep)); ctx.fillStyle = dep > 0 ? 'rgb(122,192,255)' : 'rgb(64,104,152)'; ctx.beginPath(); ctx.arc(p[0], p[1], dep > 0 ? (0.7 + 1.0 * dep) : 0.6, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1;
      ctx.save(); ctx.lineCap = 'round'; BUYERS.forEach((b) => { if (b.center) drawArc(b.p, b.center.p, BUY, 0.13, 1.26); }); ctx.restore(); ctx.globalAlpha = 1;

      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = PARTS.length - 1; i >= 0; i--) { const pt = PARTS[i]; pt.t += pt.sp;
        const col = pt.kind === 'in' ? BUY : GREEN;
        const seg = [pt.a, ctrlR(pt.a, pt.b, 1.26), pt.b];
        if (pt.t >= 1) { if (pt.kind === 'in') fanOut(pt.ctr); else { FLOATS.push({ p: pt.b, t: 0 }); if (FLOATS.length > 40) FLOATS.shift(); } PARTS.splice(i, 1); continue; }
        const v = rot(bez(seg[0], seg[1], seg[2], pt.t)), p = proj(v);
        if (pt.kind === 'out') drawArc(pt.a, pt.b, GREEN, 0.1, 1.26);
        if (v[2] > -0.05) {
          pt.trail.push([p[0], p[1]]); if (pt.trail.length > 9) pt.trail.shift();
          const tr = pt.trail; ctx.lineCap = 'round';
          for (let k = 1; k < tr.length; k++) { const a = k / tr.length; ctx.globalAlpha = a * 0.8; ctx.lineWidth = 0.5 + 2.4 * a; ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(tr[k - 1][0], tr[k - 1][1]); ctx.lineTo(tr[k][0], tr[k][1]); ctx.stroke(); }
          ctx.globalAlpha = 1;
          const gg = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], 7); gg.addColorStop(0, col); gg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(p[0], p[1], 7, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p[0], p[1], 1.8, 0, 7); ctx.fill();
          if (v[2] > 0.15) { ctx.save(); ctx.globalAlpha = Math.min(1, (v[2] - 0.15) * 3); ctx.globalCompositeOperation = 'source-over';
            // Buyer -> hub carries money ($); hub -> server carries the broadcast (envelope).
            if (pt.kind === 'in') { ctx.font = '800 18px Roboto,system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = col; ctx.fillText('$', p[0], p[1] - 13); }
            else envelope(p[0], p[1] - 14, 13, col);
            ctx.restore(); ctx.globalAlpha = 1; }
        } else { pt.trail.length = 0; }
      }
      ctx.restore(); ctx.globalAlpha = 1;

      const all = [];
      BUYERS.forEach((n) => all.push({ n, kind: 'b' })); PARTNERS.forEach((n) => all.push({ n, kind: 'p' })); CENTERS.forEach((n) => all.push({ n, kind: 'c' }));
      all.forEach((it) => { it.v = rot(it.n.p); it.p = proj(it.v); it.n._sx = it.p[0]; it.n._sy = it.p[1]; it.n._dep = it.v[2]; });
      all.sort((a, b) => a.v[2] - b.v[2]);
      for (const it of all) { const n = it.n, p = it.p, dep = it.v[2]; if (dep < -0.2) continue; const fade = dep > 0 ? 1 : 0.32;
        if (it.kind === 'b') { const rr = 8; ctx.globalAlpha = fade; if (buyerImgOk) { const s = rr * 2.64; ctx.drawImage(buyerImg, p[0] - s / 2, p[1] - s / 2, s, s); } else { ctx.fillStyle = BUY; ctx.beginPath(); ctx.arc(p[0], p[1] - rr * 0.26, rr * 0.32, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(p[0], p[1] + rr * 0.6, rr * 0.56, Math.PI, 2 * Math.PI); ctx.fill(); } ctx.globalAlpha = 1; }
        else if (it.kind === 'p') { const rr = 13; ctx.globalAlpha = fade; if (n.img) { ctx.save(); ctx.beginPath(); ctx.arc(p[0], p[1], rr, 0, 7); ctx.clip(); ctx.fillStyle = '#0e1a2c'; ctx.fillRect(p[0] - rr, p[1] - rr, rr * 2, rr * 2); ctx.drawImage(n.img, p[0] - rr, p[1] - rr, rr * 2, rr * 2); ctx.restore(); } else { ctx.beginPath(); ctx.arc(p[0], p[1], rr, 0, 7); ctx.fillStyle = n.color; ctx.fill(); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '800 ' + Math.round(rr * 1.15) + 'px Roboto,system-ui,sans-serif'; ctx.fillText(n.letter || '?', p[0], p[1] + 0.5); } ctx.globalAlpha = 1; }
        else { const rr = 11, s = rr * 2.2; ctx.globalAlpha = fade; if (secureImgOk) ctx.drawImage(secureImg, p[0] - s / 2, p[1] - s / 2, s, s); else if (logoOk) ctx.drawImage(logo, p[0] - s / 2, p[1] - s / 2, s, s); ctx.globalAlpha = 1; }
      }
      for (let i = FLOATS.length - 1; i >= 0; i--) { const fl = FLOATS[i]; fl.t += 0.018; if (fl.t >= 1) { FLOATS.splice(i, 1); continue; } drawFloat(fl); }
      if (!reduce && Math.random() < 0.09 && PARTS.length < 22) spawn();
      raf = requestAnimationFrame(draw);
    }

    const rotBy = (dx, dy) => { const vx = dx * 0.006; rotY += vx; rotX += dy * 0.006; rotX = Math.max(-1.15, Math.min(1.15, rotX)); spinVel = Math.max(-0.15, Math.min(0.15, vx)); };
    const stopDrag = () => { dragging = false; wrap.style.cursor = ''; };
    wrap.addEventListener('mousedown', (e) => { if (e.button !== 0) return; e.preventDefault(); dragging = true; lastX = e.clientX; lastY = e.clientY; wrap.style.cursor = 'grabbing'; });
    window.addEventListener('mousemove', (e) => { if (!dragging) return; if (!(e.buttons & 1)) { stopDrag(); return; } rotBy(e.clientX - lastX, e.clientY - lastY); lastX = e.clientX; lastY = e.clientY; });
    window.addEventListener('mouseup', stopDrag); window.addEventListener('blur', stopDrag);
    wrap.addEventListener('mouseenter', () => { if (!dragging) wrap.style.cursor = 'grab'; });
    wrap.addEventListener('touchstart', (e) => { if (e.touches.length !== 1) return; dragging = true; lastX = e.touches[0].clientX; lastY = e.touches[0].clientY; }, { passive: true });
    wrap.addEventListener('touchmove', (e) => { if (!dragging || e.touches.length !== 1) return; const t = e.touches[0]; rotBy(t.clientX - lastX, t.clientY - lastY); lastX = t.clientX; lastY = t.clientY; e.preventDefault(); }, { passive: false });
    const endTouch = () => { dragging = false; }; wrap.addEventListener('touchend', endTouch); wrap.addEventListener('touchcancel', endTouch);

    const tip = document.createElement('div'); tip.className = 'viz-tip'; tip.hidden = true; wrap.appendChild(tip);
    function pickHover(mx, my) { let best = null, bd = Infinity; const scan = (arr, rr) => arr.forEach((n) => { if ((n._dep || -1) <= 0.02) return; const dx = n._sx - mx, dy = n._sy - my, d = dx * dx + dy * dy, hit = (rr + 5) * (rr + 5); if (d < hit && d < bd) { bd = d; best = n; } }); scan(PARTNERS, 13); return best; }
    wrap.addEventListener('mousemove', (e) => {
      if (dragging) { tip.hidden = true; return; }
      const r = canvas.getBoundingClientRect(); const h = pickHover(e.clientX - r.left, e.clientY - r.top);
      if (!h) { tip.hidden = true; wrap.style.cursor = 'grab'; return; }
      tip.textContent = h.name || (document.documentElement.lang === 'ru' ? 'Сервер из каталога' : 'Catalog server');
      tip.style.left = h._sx + 'px'; tip.style.top = (h._sy - 14) + 'px'; tip.hidden = false; wrap.style.cursor = 'pointer';
    });
    wrap.addEventListener('mouseleave', () => { tip.hidden = true; });
    window.addEventListener('resize', () => { cancelAnimationFrame(raf); layout(); draw(); });
    window.addEventListener('vemoni:feed', () => buildNodes());
    requestAnimationFrame(() => { layout(); buildNodes(); for (let i = 0; i < 10; i++) spawn(); draw(); });
  })();

  /* ---------- i18n (EN captured from DOM, RU dict) ---------- */
  const RU = {
    nav_what: 'О сервисе', nav_how: 'Как это работает', nav_numbers: 'Цифры', nav_sell: 'Для продавцов DMALL', nav_faq: 'Вопросы',
    open_dmall: 'Открыть DMALL', nav_login: 'Войти через Discord',
    menu_home: 'Главная', menu_myorders: 'DMALL', menu_partner: 'Партнёрам', menu_admin: 'Администраторам', menu_logout: 'Выйти',
    hero_h1: 'Теперь DMall<br /><span class="grad">доступен каждому</span>',
    hero_sub: 'Представляем dmall-маркетплейс: купля/продажа рассылок для Discord серверов с большим ассортиментом, гибкими настройками и низкими ценами. Вам больше не нужно искать провайдера рассылок — сервис предоставляет ботов и саму услугу рассылки, вам остаётся только выбрать «откуда и куда».',
    hero_cta: 'Открыть DMALL →', hero_cta2: 'Как это работает ↓',
    bc_live: 'в эфире · отправка', bc_active: 'Активна', bc_msg_h: 'Вас приглашают!', bc_msg_p: 'Забирайте роль и участвуйте → discord.gg/vemoni',
    bc_delivered: 'Доставлено', bc_dm: 'Доставлено',
    what_h2: 'Что такое DMALL',
    what_p1: 'DMALL — рассылки в личные сообщения участникам Discord серверов.<br />Наш сервис берёт на себя автоматизацию рутинных задач, а также снижает порог входа на рынок dmall.',
    how_h2: 'Как это работает', how_sub: 'Три шага от сервера до доставленной рассылки.',
    step1_h3: 'Выберите сервер', step1_p: 'Выберите сообщество из каталога. Каждая карточка предварительно проверяется — оформление заказа возможно только на серверах, где рассылка реально доставляется.',
    step2_h3: 'Соберите рассылку', step2_p: 'Напишите сообщение, добавьте кастом-эмодзи, стикеры или медиа, задайте таргетинг и расписание — сразу, через несколько минут или в назначенное время.',
    step3_h3: 'Запуск — оплата за доставленное', step3_p: 'После оформления заказа запускается рассылка сообщений по вашим настройкам.',
    num_h2: 'Цифры', num_p: 'Прозрачная цена, оплата по факту доставки, защита покупателя. Всё важное — в одном месте.',
    check1: 'Большой ассортимент и низкие цены',
    check2: 'Оплата только за доставленные сообщения',
    check3: 'Боты для рассылок и сама услуга рассылки предоставляется сервисом',
    fig_big_label: 'сообщений доставлено за всё время', fig1_label: 'реальных получателей сообщений за всё время', fig2_label: 'выполненных заказов за всё время',
    sell_h2: 'Есть сервер? Выставьте его и зарабатывайте', sell_sub: 'Превратите сообщество в лот — вы задаёте цену и зарабатываете на каждой доставке.',
    sell1_h3: 'Добавьте бота', sell1_p: 'Пригласите нашего бота на сервер с админ-правами — он подключит сообщество к DMALL за пару минут.',
    sell2_h3: 'Задайте цену', sell2_p: 'Создайте лот и укажите цену за 1000 сообщений. Сделайте его публичным для всех или приватным.',
    sell3_h3: 'Зарабатывайте на доставках', sell3_p: 'Когда покупатели делают рассылку на ваш сервер, вам платят за каждое доставленное сообщение — всё видно в кабинете DMALL в реальном времени.',
    faq_h2: 'Частые вопросы',
    faq_q1: 'Как происходит оплата?',
    faq_a1: 'Пополняете баланс на сайте через LTC, оформляете заказ, и платите только за доставленные сообщения.',
    faq_q2: 'Что может содержать сообщение?',
    faq_a2: 'Текст, кастом-эмодзи и стикеры с серверов, где есть наши боты, вложения (картинка, видео или файл) и красивый embed. Живой предпросмотр показывает, как всё будет выглядеть.',
    faq_q3: 'Можно выставить свой сервер?',
    faq_a3: 'Да. Добавьте нашего бота админом, создайте лот и укажите цену за 1000 сообщений. Вы зарабатываете на каждой доставке, которую делают другие покупатели.',
    faq_q4: 'Можно запланировать или остановить рассылку?',
    faq_a4: 'Можно отправить сразу, с задержкой или в назначенные дату и время — и остановить активную рассылку в любой момент. Доставка отслеживается в реальном времени.',
    connect_h2: 'Готовы к рассылке?', connect_p: 'Откройте DMALL, выберите сервер и запускайте,<br />или напишите нам в Discord с любым вопросом.',
    connect_open: 'Открыть DMALL →', connect_btn: 'Сервер поддержки',
    footer_privacy: 'Политика конфиденциальности', footer_terms: 'Условия использования', footer_support: 'Поддержка', footer_rights: 'Все права защищены.',
  };
  const EN = {};
  document.querySelectorAll('[data-i18n]').forEach((el) => { EN[el.dataset.i18n] = el.innerHTML; });
  function setLang(lang) {
    const dict = lang === 'ru' ? RU : EN;
    document.querySelectorAll('[data-i18n]').forEach((el) => { const v = dict[el.dataset.i18n]; if (v != null) el.innerHTML = v; });
    document.documentElement.lang = lang;
    try { localStorage.setItem('vemoni_lang', lang); } catch (_) {}
    document.querySelectorAll('#langSwitch button').forEach((b) => b.classList.toggle('active', b.dataset.lang === lang));
  }
  document.querySelectorAll('#langSwitch button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
  let startLang = 'en';
  try { const s = localStorage.getItem('vemoni_lang'); if (s === 'ru' || s === 'en') startLang = s; } catch (_) {}
  setLang(startLang);

  /* ---------- Account chip + cabinet menu ---------- */
  (function account() {
    const box = document.getElementById('navUser'); if (!box) return;
    const loginBtn = document.querySelector('.nav-login');
    let tok = ''; try { tok = localStorage.getItem('vemoni_tok') || ''; } catch (_) {}
    const headers = {}; if (tok) headers.Authorization = 'Bearer ' + tok;
    const setAuthed = (v) => { try { v ? localStorage.setItem('vemoni_authed', '1') : localStorage.removeItem('vemoni_authed'); } catch (_) {} };
    function bannerFromAvatar(url) {
      const bn = document.getElementById('nmBanner'); if (!bn) return;
      const img = new Image(); img.crossOrigin = 'anonymous';
      img.onload = () => { try {
        const cv = document.createElement('canvas'); cv.width = cv.height = 16;
        const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0, 16, 16);
        const p = cx.getImageData(0, 0, 16, 16).data; let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < p.length; i += 4) { r += p[i]; g += p[i + 1]; b += p[i + 2]; n++; }
        r = (r / n) | 0; g = (g / n) | 0; b = (b / n) | 0; const dk = (v) => (v * 0.62) | 0;
        bn.style.background = 'linear-gradient(135deg, rgb(' + r + ',' + g + ',' + b + '), rgb(' + dk(r) + ',' + dk(g) + ',' + dk(b) + '))';
      } catch (_) {} };
      img.src = url;
    }
    fetch(base + '/partner/whoami', { credentials: 'include', headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d || !d.authed) { setAuthed(false); document.documentElement.classList.remove('pre-auth'); if (loginBtn) loginBtn.style.display = ''; box.hidden = true; return; }
        setAuthed(true);
        if (loginBtn) loginBtn.style.display = 'none';
        const name = d.name || d.username || 'User', letter = (name.trim()[0] || 'U').toUpperCase();
        const av = document.getElementById('navAv');
        if (d.avatar) av.style.backgroundImage = 'url("' + d.avatar + '")'; else av.textContent = letter;
        const nmAv = document.getElementById('nmAv'), nmName = document.getElementById('nmName'), nmUser = document.getElementById('nmUser');
        if (nmName) nmName.textContent = name;
        if (nmUser) nmUser.textContent = d.username ? '@' + d.username : ('ID ' + (d.userId || ''));
        if (nmAv) { if (d.avatar) nmAv.style.backgroundImage = 'url("' + d.avatar + '")'; else nmAv.textContent = letter; }
        const nmBanner = document.getElementById('nmBanner');
        if (nmBanner && d.banner) { nmBanner.style.backgroundImage = 'url("' + d.banner + '")'; nmBanner.style.backgroundSize = 'cover'; nmBanner.style.backgroundPosition = 'center'; }
        else if (d.avatar) bannerFromAvatar(d.avatar);
        if (!(d.isAdmin || d.botfarm)) box.querySelectorAll('[data-admin]').forEach((el) => el.remove());
        box.querySelectorAll('.nm-items a').forEach((a) => { if (a.getAttribute('href') === location.pathname) a.classList.add('active'); });
        box.hidden = false;
        const menu = document.getElementById('navMenu');
        av.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); menu.hidden = !menu.hidden; });
        menu.addEventListener('click', (e) => e.stopPropagation());
        document.addEventListener('click', () => { menu.hidden = true; });
        const lo = document.getElementById('navLogout');
        if (lo) lo.addEventListener('click', async (e) => {
          e.preventDefault();
          try { await fetch(base + '/partner/logout', { method: 'POST', credentials: 'include', headers }); } catch (_) {}
          try { localStorage.removeItem('vemoni_tok'); } catch (_) {}
          setAuthed(false); location.reload();
        });
      })
      .catch(() => {});
  })();
})();
