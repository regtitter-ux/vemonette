/* ---------- Server feed data (fallback numbers from web research + API) ---------- */
const SERVERS = [
  { code: 'mikutag', name: 'MIKU TAG・CHAT・SOCIAL', members: 230357, color: '#39c5bb', accent: 'linear-gradient(150deg,#39c5bb,#2f8f9c)', letter: 'M', id: '1369047464073498776', icon: 'dfab23ce3751ac4872b859eac2151ea8' },
  { code: 'yaoitag', name: 'YA0I TAG・CHAT・SOCIAL', members: 175561, color: '#e63b7a', accent: 'linear-gradient(150deg,#e63b7a,#7c2d6b)', letter: 'Y', id: '1369363539332042853', icon: 'a_355f16ede56cb094740b46546eee0a73' },
  { code: 'tagyuri', name: 'YURI TAG・CHAT・SOCIAL', members: 132614, color: '#a855f7', accent: 'linear-gradient(150deg,#a855f7,#5b2ea6)', letter: 'Y', id: '1369076925389078609', icon: '113818409cc1ab5871354f52a7e36283' },
  { code: 'teto', name: 'TETO TAG・CHAT・SOCIAL', members: 65274, color: '#d1004b', accent: 'linear-gradient(150deg,#d1004b,#7a0030)', letter: 'T', id: '1369106099608748102', icon: 'a_9421492e28203f89f5003ea2ee618537' },
  { code: 'ggif', name: 'GIFLAND СНГ', members: 50897, color: '#5865f2', accent: 'linear-gradient(150deg,#5865f2,#333a99)', letter: 'G', id: '972405591140085791', icon: 'a_096abac0dd6b01694ef7aaceaf24e613' },
  { name: 'Guild Tags | 55k+ Guilds Server Tags', members: 71156, color: '#8b5cf6', accent: 'linear-gradient(150deg,#8b5cf6,#4c2d8f)', letter: 'G', id: '724948162101293056', link: 'https://top.gg/discord/servers/724948162101293056', img: 'assets/gtl.svg' },
  { code: 'S7ftaq8qN', name: 'Server Tags', members: null, color: '#f59e0b', accent: 'linear-gradient(150deg,#f59e0b,#a85d06)', letter: 'S' },
  { code: 'lovecat', name: 'lovecat', members: null, color: '#f472b6', accent: 'linear-gradient(150deg,#f472b6,#8f2d5c)', letter: 'L' },
  { code: '9eAUqwcuC', name: 'Server', members: null, color: '#22d3ee', accent: 'linear-gradient(150deg,#22d3ee,#0e6d80)', letter: 'S' },
];

const fmt = (n) => (n == null ? '—' : n.toLocaleString('en-US'));

const BADGE = '<svg viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function iconUrl(id, icon) {
  if (!id || !icon) return null;
  const ext = icon.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/icons/${id}/${icon}.${ext}?size=128`;
}

function cardHTML(s) {
  const src = s.img || iconUrl(s.id, s.icon);
  // image fills the icon; if it fails to load, fall back to the coloured letter
  const ic = src
    ? `<span class="scard-ic"><img src="${src}" alt="" loading="lazy" decoding="async" onerror="const p=this.parentElement;p.style.background='${s.color}';p.textContent='${s.letter}'" /></span>`
    : `<span class="scard-ic" style="background:${s.color}">${s.letter}</span>`;
  return `
    <div class="scard" data-code="${s.code || s.id}">
      ${ic}
      <div class="scard-info">
        <div class="scard-name">${s.name}</div>
        <div class="scard-members"><span class="online-dot">●</span> <span data-role="members">${fmt(s.members)} members</span></div>
      </div>
    </div>`;
}

/* Two rows (top scrolls left, bottom scrolls right), each duplicated for a
   seamless loop. FEED is the owner-managed list from the API; the hardcoded
   SERVERS above is the offline fallback so the feed is never empty. */
const rowTop = document.getElementById('rowTop');
const rowBottom = document.getElementById('rowBottom');
let FEED = SERVERS;
function renderFeedRows() {
  // Split the servers between the two rows so no server appears in both at once;
  // each row's cards are duplicated for a seamless -50% scroll loop.
  const top = FEED.filter((_, i) => i % 2 === 0);
  const bot = FEED.filter((_, i) => i % 2 === 1);
  const loop = (list) => { const one = (list.length ? list : FEED).map(cardHTML).join(''); return one + one; };
  rowTop.innerHTML = loop(top);
  rowBottom.innerHTML = loop([...bot].reverse());
}
renderFeedRows(); // instant render with the built-in fallback

/* Load the owner-managed feed from the API (falls back to SERVERS on error). */
async function loadManagedFeed() {
  try {
    const base = (window.__VEMONI_API_BASE__ || '').replace(/\/+$/, '');
    const r = await fetch(base + '/feed');
    if (r.ok) {
      const d = await r.json();
      if (Array.isArray(d.servers) && d.servers.length) { FEED = d.servers; renderFeedRows(); try { window.dispatchEvent(new Event('vemoni:feed')); } catch (_) {} }
    }
  } catch (_) { /* offline / API down → keep the fallback list */ }
}

/* Try to refresh counts live from the visitor's browser (Discord invite API allows CORS). */
async function refreshLive() {
  await Promise.all(FEED.map(async (s) => {
    if (!s.code) return; // no discord.gg invite (e.g. top.gg-linked) -> keep static data
    try {
      const r = await fetch(`https://discord.com/api/v9/invites/${s.code}?with_counts=true`);
      if (!r.ok) return;
      const d = await r.json();
      const members = d.approximate_member_count;
      const g = d.guild || {};
      const img = iconUrl(g.id, g.icon);
      document.querySelectorAll(`.scard[data-code="${s.code}"]`).forEach((card) => {
        if (members != null) card.querySelector('[data-role="members"]').textContent = `${fmt(members)} members`;
        if (g.name) card.querySelector('.scard-name').textContent = g.name;
        if (img) {
          const holder = card.querySelector('.scard-ic');
          holder.style.background = 'transparent';
          holder.innerHTML = `<img src="${img}" alt="" />`;
        }
      });
    } catch (_) { /* offline / blocked → keep fallback numbers */ }
  }));
}

/* Load the managed feed, then refresh live counts once the page is idle. */
(async () => {
  await loadManagedFeed();
  if ('requestIdleCallback' in window) requestIdleCallback(() => refreshLive(), { timeout: 3000 });
  else setTimeout(refreshLive, 1000);
})();

/* ---------- Count-up numbers ---------- */
function animateCount(el) {
  const target = +el.dataset.count;
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  const dur = 1600;
  const start = performance.now();
  function tick(now) {
    const p = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    let val = Math.round(target * eased);
    let text;
    if (suffix === 'k+') text = prefix + Math.round(val / 1000) + 'k+';
    else if (target >= 1000) text = prefix + val.toLocaleString('en-US') + suffix;
    else text = prefix + val + suffix;
    el.textContent = text;
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) { animateCount(e.target); io.unobserve(e.target); }
  });
}, { threshold: 0.5 });
document.querySelectorAll('[data-count]').forEach((el) => io.observe(el));

/* ---------- i18n (EN / RU) ---------- */
const RU = {
  nav_what: 'О сервисе', nav_how: 'Как это работает', nav_numbers: 'Цифры', nav_buyers: 'Покупателям', nav_faq: 'Вопросы', nav_contact: 'Связаться',
  hero_pill: 'Двухминутный обзор для будущих партнёров',
  hero_h1: 'Верификация,<br /><span class="grad">за которую вам платят</span>',
  hero_sub: 'Краткий обзор: что делает Vemoni, как это работает и какие за этим цифры.',
  hero_cta: 'Читать ↓',
  invite_bot: 'Добавить бота', nav_login: 'Войти через Discord',
  menu_home: 'Главная', menu_partner: 'Партнёрам', menu_order: 'Покупателям', menu_invest: 'Инвесторам', menu_admin: 'Администраторам', menu_logout: 'Выйти',
  viz_buyers: 'Покупатели', viz_partners: 'Партнёры',
  stat1_label: 'Уже выплачено партнёрам',
  stat2_label: 'довольных покупателей',
  stat3_label: 'продано заходов',
  what_h2: 'Что такое Vemoni',
  what_p1: 'Vemoni создаёт персонального бота-верификатора для крупных Discord-серверов: участники проходят проверку в два клика, а вы получаете оплату за успешные верификации',
  how_h2: 'Как это работает',
  how_sub: 'Три шага — дальше всё само.',
  step1_h3: 'Настраиваем бота',
  step1_p: 'Пригласите публичного бота, либо запросите у нас персонального под ваш сервер. Бесплатно, около 10 минут, хостинг и поддержка от нас.',
  step2_h3: 'Участники проходят верификацию',
  step2_p: 'Клик, переход на сервер спонсора, ещё клик - получение роли проверенного.',
  step3_h3: 'Вы зарабатываете автоматически',
  step3_p: '$5 за каждые 100 успешных проверок. На $10 бот сам создаёт запрос на вывод по вашим реквизитам.',
  how_note: 'Вот обе стороны в действии:',
  sim1_badge: 'Что видят участники', sim1_h3: 'Прохождение верификации',
  sim1_p: 'Участник кликает, видит короткое сообщение, подтверждает — и получает доступ.',
  sim2_badge: 'Что контролируете вы',
  sim2_h3: 'Команда <code>/verify</code> и баланс',
  sim2_p: 'Один раз публикуете карточку верификации, затем следите за балансом через <code>/bal</code>.',
  num_h2: 'Цифры',
  num_p: 'Фиксированная ставка, прозрачный подсчёт, прямые выплаты. Всё важное — в одном месте.',
  check1: '<b>$5</b> за 100 успешных проверок',
  check2: 'Запрос на вывод создаётся автоматически, как только у вас <b>$10</b>',
  check4: 'Вывод любым удобным способом',
  fig_big_label: 'выплачено партнёрам', fig1_label: 'продано заходов', fig2_label: 'довольных покупателей',
  servers_h2: 'Сообщества, которые уже зарабатывают с нами',
  faq_h2: 'Частые вопросы партнёров',
  faq_q1: 'Не будет ли это раздражать участников?',
  faq_a1: 'Нет. Это привычная для человека верификация в два клика, с нативной рекламной интеграцией в процессе проверки',
  faq_q2: 'Как считаются клики?',
  faq_a2: 'Засчитываются полностью завершённые верификации, когда пользователь увидел рекламу, и получил роль проверенного.',
  faq_q3: 'Когда и как я получаю выплату?',
  faq_a3: 'Автоматически. Как только баланс достигает $10, создаётся запрос на вывод по вашим реквизитам.',
  faq_q4: 'Что мне нужно делать?',
  faq_a4: 'После добавления бота — используйте команду /verify (role). Всё остальное (проверка, реклама, подсчёт и выплаты) бот делает сам.',
  connect_h2: 'Остались вопросы?',
  connect_p: 'Свяжитесь с нами в Discord<br />Спрашивайте что угодно: настройка, сроки, нюансы.',
  connect_btn: 'Сервер поддержки',
  footer_privacy: 'Политика конфиденциальности', footer_terms: 'Условия использования', footer_support: 'Поддержка', footer_rights: 'Все права защищены.',
};

// Capture the original English content once, then translate on demand.
const EN = {};
document.querySelectorAll('[data-i18n]').forEach((el) => { EN[el.dataset.i18n] = el.innerHTML; });

function setLang(lang) {
  const dict = lang === 'ru' ? RU : EN;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const v = dict[el.dataset.i18n];
    if (v == null) return;
    el.innerHTML = v;
    el.style.display = v === '' ? 'none' : ''; // hide items with no translation
  });
  document.documentElement.lang = lang;
  try { localStorage.setItem('vemonette-lang', lang); } catch (_) {}
  document.querySelectorAll('#langSwitch button').forEach((b) => b.classList.toggle('active', b.dataset.lang === lang));
}

document.querySelectorAll('#langSwitch button').forEach((b) => {
  b.addEventListener('click', () => setLang(b.dataset.lang));
});

// Default to English; only honour an explicit choice the user made before.
let startLang = 'en';
try {
  const saved = localStorage.getItem('vemonette-lang');
  if (saved === 'ru' || saved === 'en') startLang = saved;
} catch (_) {}
setLang(startLang);

/* ---------- Nav scroll-spy: highlight the section in view ---------- */
(function scrollSpy() {
  const links = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  const targets = links.map((a) => ({ a, sec: document.querySelector(a.getAttribute('href')) })).filter((t) => t.sec);
  if (!targets.length) return;
  function update() {
    let current = targets[0];
    for (const t of targets) {
      if (t.sec.getBoundingClientRect().top <= 120) current = t;
    }
    links.forEach((a) => a.classList.toggle('active', a === current.a));
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

/* ---------- Simulation 1: user verification ---------- */
(function verifySim() {
  const root = document.getElementById('simVerify');
  if (!root) return;
  const body = root.querySelector('.dsc-body'); // cursor's positioned ancestor
  const cursor = document.getElementById('cursor1');
  const btn = document.getElementById('verifBtn');

  // Place the cursor at the centre of a target element (accurate, layout-based).
  const moveTo = (el) => {
    const d = body.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    cursor.style.left = (r.left - d.left + r.width / 2) + 'px';
    cursor.style.top = (r.top - d.top + r.height / 2) + 'px';
  };
  const idle = () => {
    const d = body.getBoundingClientRect();
    cursor.style.left = (d.width * 0.82) + 'px';
    cursor.style.top = (d.height * 0.82) + 'px';
  };
  const press = () => {
    cursor.classList.add('click');
    btn.classList.add('pressed');
    setTimeout(() => { cursor.classList.remove('click'); btn.classList.remove('pressed'); }, 380);
  };

  const timeline = [
    { step: 0, wait: 1000, act: idle },
    { step: 1, wait: 780, act: () => moveTo(btn) },
    { step: 1, wait: 520, act: press },
    { step: 2, wait: 2400, act: idle },          // ad shown
    { step: 3, wait: 780, act: () => moveTo(btn) },
    { step: 3, wait: 520, act: press },
    { step: 4, wait: 2600, act: idle },          // success + role
  ];

  let i = 0;
  function run() {
    const t = timeline[i];
    root.setAttribute('data-step', t.step);
    if (t.act) t.act();
    i = (i + 1) % timeline.length;
    setTimeout(run, t.wait);
  }
  // Start once layout/fonts have settled so cursor targeting is accurate.
  requestAnimationFrame(() => setTimeout(run, 300));
})();

/* ---------- Simulation 2: admin /verification -> /bal -> DM payout ---------- */
(function adminSim() {
  const root = document.getElementById('simAdmin');
  if (!root) return;
  const body = root.querySelector('.dsc-body');
  const bar = root.querySelector('.dsc-bar');
  const chip = document.getElementById('cmdChip');
  const opt = document.getElementById('cmdOpt');
  const balValue = document.getElementById('balValue');
  const toast = document.getElementById('dmToast');
  const cursor = document.getElementById('cursorAdmin');

  // display-toggle so a hidden option doesn't reserve space (keeps the caret tight)
  const setCmd = (cmd, withOpt) => { chip.textContent = cmd; chip.style.display = ''; opt.style.display = withOpt ? '' : 'none'; };
  const clearCmd = () => { chip.style.display = 'none'; opt.style.display = 'none'; };

  const moveTo = (el) => {
    const d = body.getBoundingClientRect(), r = el.getBoundingClientRect();
    cursor.style.left = (r.left - d.left + r.width / 2) + 'px';
    cursor.style.top = (r.top - d.top + r.height / 2) + 'px';
  };
  const idle = () => { const d = body.getBoundingClientRect(); cursor.style.left = (d.width * 0.85) + 'px'; cursor.style.top = (d.height * 0.9) + 'px'; };
  const press = () => { cursor.classList.add('click'); setTimeout(() => cursor.classList.remove('click'), 380); };

  const barServer = () => { bar.innerHTML = '<span class="hash">#</span> welcome'; };
  const barDM = () => { bar.innerHTML = '<span class="hash">@</span> Verification'; };

  let tickIv;
  function tickBalance() {
    let v = 9.0;
    balValue.textContent = '$9.00';
    clearInterval(tickIv);
    tickIv = setInterval(() => {
      v = Math.round((v + 0.1) * 100) / 100;
      balValue.textContent = '$' + v.toFixed(2);
      if (v >= 10) { // hit the $10 threshold -> withdrawal filed, balance resets to $0
        clearInterval(tickIv);
        setTimeout(() => { balValue.textContent = '$0.00'; }, 650);
      }
    }, 190);
  }

  const reset = () => { toast.classList.remove('shown'); barServer(); clearCmd(); idle(); };

  const timeline = [
    { step: 0, wait: 1200, act: () => { reset(); setCmd('/verify', true); } }, // typing command
    { step: 1, wait: 1300, act: null },                                              // command shown
    { step: 2, wait: 2300, act: clearCmd },                                          // card posted (scene A)
    { step: 3, wait: 1200, act: () => setCmd('/bal', false) },                       // typing /bal
    { step: 4, wait: 3100, act: () => { clearCmd(); tickBalance(); } },              // balance grows 9 -> 10, resets to 0
    { step: 5, wait: 1500, act: () => { toast.classList.add('shown'); moveTo(toast); } }, // DM notification + reach
    { step: 5, wait: 560, act: press },                                              // click the notification
    { step: 6, wait: 3600, act: () => { toast.classList.remove('shown'); barDM(); } }, // open DM (scene C)
  ];

  let i = 0;
  function run() {
    const t = timeline[i];
    root.setAttribute('data-step', t.step);
    if (t.act) t.act();
    i = (i + 1) % timeline.length;
    setTimeout(run, t.wait);
  }
  clearCmd();
  requestAnimationFrame(() => setTimeout(run, 320));
})();

/* ---------- Hero globe visualization ----------
   Rotating dotted planet. Buyers send money into scattered Vemoni verification
   centres; each centre then distributes it out to partner servers. Auto-spins;
   hold the RIGHT mouse button and drag to rotate. Original canvas code. */
(function () {
  const wrap = document.getElementById('viz'), canvas = document.getElementById('flow');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const cs = getComputedStyle(document.documentElement);
  const cvv = (v, f) => { const x = cs.getPropertyValue(v).trim(); return x || f; };
  const BLUE = cvv('--blue-2', '#5cc8ff'), GREEN = cvv('--green', '#57f287'), BUY = '#86b6ff', TRAFFIC = '#b9a3ff';
  const logo = new Image(); let logoOk = false; logo.onload = () => { logoOk = true; }; logo.src = 'assets/logo.png';
  let W = 0, H = 0, dpr = 1, cx = 0, cy = 0, R = 0, raf;
  let rotY = 0.5, rotX = -0.32, velY = 0.0016, dragging = false, lastX = 0, lastY = 0;
  let spinVel = velY; // current spin speed; eases back to velY after a manual drag

  const NDOTS = 560, dots = [];
  (function () { const g = Math.PI * (3 - Math.sqrt(5)); for (let i = 0; i < NDOTS; i++) { const y = 1 - 2 * (i + 0.5) / NDOTS; const rr = Math.sqrt(1 - y * y); const th = g * i; dots.push([Math.cos(th) * rr, y, Math.sin(th) * rr]); } })();
  const ll = (la, lo) => { la = la * Math.PI / 180; lo = lo * Math.PI / 180; return [Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo)]; };

  const PARTNERS = [], CENTERS = [], BUYERS = [];
  const dist2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
  const nearest = (p, arr) => { let bi = 0, bd = Infinity; arr.forEach((n, i) => { const d = dist2(p, n.p); if (d < bd) { bd = d; bi = i; } }); return arr[bi]; };
  function buildNodes() {
    PARTNERS.length = CENTERS.length = BUYERS.length = 0;
    // partner avatars come from the server feed — prefer entries that actually
    // have an icon so every partner shows a real avatar
    const all = (typeof FEED !== 'undefined' && Array.isArray(FEED) ? FEED : []).filter((s) => s && s.name);
    const withIcon = all.filter((s) => s.img || (s.id && s.icon));
    const feed = withIcon.length ? withIcon : all;
    const pPos = [ll(34, -40), ll(-16, 46), ll(52, 96), ll(2, 156), ll(-42, -104), ll(24, -150), ll(-30, 8), ll(62, -20), ll(10, 118), ll(-58, 130)];
    const cPos = [ll(16, -8), ll(-10, 90), ll(44, -100), ll(-38, 152), ll(0, 40)];
    const bPos = [ll(8, 26), ll(48, -66), ll(-28, 116), ll(64, 6), ll(-56, 44), ll(20, -174), ll(40, 168), ll(-6, -54), ll(30, -118), ll(-46, -20), ll(56, 128), ll(-18, 74)];
    pPos.forEach((p, i) => { const s = feed[i % Math.max(1, feed.length)] || {}; const src = s.img || (typeof iconUrl === 'function' ? iconUrl(s.id, s.icon) : null); const n = { p, color: s.color || GREEN, img: null, src, name: s.name || null }; PARTNERS.push(n); if (src) { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => { n.img = im; }; im.src = src; } });
    cPos.forEach((p) => CENTERS.push({ p }));
    bPos.forEach((p) => BUYERS.push({ p, center: null }));
    BUYERS.forEach((bn) => { bn.center = nearest(bn.p, CENTERS); });
  }

  // particles: money flows buyer -> centre (blue), then the centre fans out to
  // random partners (green) — periodically to several at once
  const PARTS = [];
  function spawn() {
    if (!BUYERS.length || !CENTERS.length) return;
    const bn = BUYERS[(Math.random() * BUYERS.length) | 0], c = bn.center; if (!c) return;
    PARTS.push({ kind: 'in', a: bn.p, b: c.p, ctr: c, t: 0, sp: 0.008 + Math.random() * 0.005, trail: [] });
  }
  function fanOut(c) {
    if (!PARTNERS.length) return;
    const k = Math.random() < 0.3 ? 2 + ((Math.random() * 3) | 0) : 1; // sometimes several partners at once
    for (let n = 0; n < k; n++) {
      const pn = PARTNERS[(Math.random() * PARTNERS.length) | 0];
      PARTS.push({ kind: 'out', a: c.p, b: pn.p, t: 0, sp: 0.009 + Math.random() * 0.006, trail: [] });
    }
  }
  // once a partner is paid, it sends traffic back the other way: partner -> centre -> buyer
  function sendTraffic(partnerPoint) { if (!CENTERS.length) return; const c = nearest(partnerPoint, CENTERS); PARTS.push({ kind: 'ret1', a: partnerPoint, b: c.p, ctr: c, t: 0, sp: 0.009 + Math.random() * 0.005, trail: [] }); }
  function trafficToBuyer(c) { if (!BUYERS.length) return; const bn = BUYERS[(Math.random() * BUYERS.length) | 0]; PARTS.push({ kind: 'ret2', a: c.p, b: bn.p, t: 0, sp: 0.009 + Math.random() * 0.005, trail: [] }); }

  function rot(v) {
    const cyw = Math.cos(rotY), syw = Math.sin(rotY);
    const x = v[0] * cyw + v[2] * syw, z1 = -v[0] * syw + v[2] * cyw, y = v[1];
    const cp = Math.cos(rotX), sp = Math.sin(rotX);
    return [x, y * cp - z1 * sp, y * sp + z1 * cp];
  }
  const proj = (v) => [cx + v[0] * R, cy - v[1] * R, v[2]];
  const bez = (a, c, b, t) => { const u = 1 - t; return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1], u * u * a[2] + 2 * u * t * c[2] + t * t * b[2]]; };
  const ctrlR = (a, b, lift) => { const mx = a[0] + b[0], my = a[1] + b[1], mz = a[2] + b[2], ml = Math.hypot(mx, my, mz) || 1; return [mx / ml * lift, my / ml * lift, mz / ml * lift]; };
  function drawArc(a, b, color, alpha, lift) { const c = ctrlR(a, b, lift); let prev = null; for (let s = 0; s <= 20; s++) { const v = rot(bez(a, c, b, s / 20)), p = proj(v); if (prev && v[2] > -0.15) { ctx.strokeStyle = color; ctx.globalAlpha = alpha * (v[2] > 0 ? 1 : 0.35); ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); } prev = p; } }
  function userGlyph(px, py, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(px, py - r * 0.26, r * 0.32, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(px, py + r * 0.6, r * 0.56, Math.PI, 2 * Math.PI); ctx.closePath(); ctx.fill();
  }
  // floating "+$0.5" over a paid partner / "+👤" over a buyer that received a join
  const FLOATS = [];
  function drawFloat(fl) {
    const v = rot(fl.p); if (v[2] <= 0.02) return; const p = proj(v);
    const y = p[1] - 16 - 24 * fl.t;
    const a = (fl.t < 0.15 ? fl.t / 0.15 : 1 - (fl.t - 0.15) / 0.85) * Math.min(1, v[2] / 0.3);
    ctx.save(); ctx.globalAlpha = Math.max(0, a); ctx.textBaseline = 'middle'; ctx.font = '800 12px Roboto,system-ui,sans-serif';
    if (fl.kind === 'money') { ctx.textAlign = 'center'; ctx.fillStyle = GREEN; ctx.fillText('+$', p[0], y); }
    else { ctx.textAlign = 'left'; ctx.fillStyle = BUY; ctx.fillText('+', p[0] - 8, y); userGlyph(p[0] + 4, y, 5, BUY); }
    ctx.restore(); ctx.globalAlpha = 1;
  }

  function layout() {
    const r = wrap.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = W / 2; cy = H / 2; R = Math.min(W, H) * 0.42;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    if (!dragging && !reduce) { rotY += spinVel; spinVel += (velY - spinVel) * 0.04; } // ease momentum back to the base speed

    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(cx, cy, R * 0.15, cx, cy, R * 1.35);
    g.addColorStop(0, 'rgba(34,168,240,.12)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.35, 0, 7); ctx.fill();
    ctx.restore();

    if (logoOk) { ctx.save(); ctx.globalAlpha = 0.11; const s = R * 0.85; ctx.drawImage(logo, cx - s / 2, cy - s / 2, s, s); ctx.restore(); }

    for (const d of dots) { const v = rot(d), p = proj(v), dep = v[2];
      ctx.globalAlpha = dep > 0 ? (0.22 + 0.5 * dep) : (0.05 + 0.1 * (1 + dep));
      ctx.fillStyle = dep > 0 ? 'rgb(122,192,255)' : 'rgb(64,104,152)';
      ctx.beginPath(); ctx.arc(p[0], p[1], dep > 0 ? (0.7 + 1.0 * dep) : 0.6, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // network lines: buyers -> centres are blue (money in); centre -> partner
    // lines are green and traced live by the travelling particles below
    ctx.save(); ctx.lineCap = 'round';
    BUYERS.forEach((b) => { if (b.center) drawArc(b.p, b.center.p, BUY, 0.13, 1.26); });
    ctx.restore(); ctx.globalAlpha = 1;

    // travelling money particles: buyer -> centre (blue), centre -> partner (green)
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = PARTS.length - 1; i >= 0; i--) { const pt = PARTS[i]; pt.t += pt.sp;
      const money = pt.kind === 'in' || pt.kind === 'out';
      const col = pt.kind === 'in' ? BUY : pt.kind === 'out' ? GREEN : TRAFFIC;
      const seg = [pt.a, ctrlR(pt.a, pt.b, 1.26), pt.b];
      if (pt.t >= 1) {
        if (pt.kind === 'in') fanOut(pt.ctr);
        else if (pt.kind === 'out') { sendTraffic(pt.b); FLOATS.push({ p: pt.b, kind: 'money', t: 0 }); }
        else if (pt.kind === 'ret1') trafficToBuyer(pt.ctr);
        else if (pt.kind === 'ret2') FLOATS.push({ p: pt.b, kind: 'user', t: 0 });
        if (FLOATS.length > 40) FLOATS.shift();
        PARTS.splice(i, 1); continue;
      }
      const v = rot(bez(seg[0], seg[1], seg[2], pt.t)), p = proj(v);
      if (!money) drawArc(pt.a, pt.b, TRAFFIC, 0.1, 1.26); // trace the return traffic line
      else if (pt.kind === 'out') drawArc(pt.a, pt.b, GREEN, 0.1, 1.26); // trace the fan-out line while it travels
      if (v[2] > -0.05) {
        pt.trail.push([p[0], p[1]]); if (pt.trail.length > 9) pt.trail.shift();
        const tr = pt.trail; ctx.lineCap = 'round';
        for (let k = 1; k < tr.length; k++) { const a = k / tr.length; ctx.globalAlpha = a * 0.8; ctx.lineWidth = 0.5 + 2.4 * a; ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(tr[k - 1][0], tr[k - 1][1]); ctx.lineTo(tr[k][0], tr[k][1]); ctx.stroke(); }
        ctx.globalAlpha = 1;
        const gg = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], 7); gg.addColorStop(0, col); gg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(p[0], p[1], 7, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p[0], p[1], 1.8, 0, 7); ctx.fill();
        if (v[2] > 0.15) { ctx.save(); ctx.globalAlpha = Math.min(1, (v[2] - 0.15) * 3);
          if (money) { ctx.font = '800 9px Roboto,system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = col; ctx.fillText('$', p[0], p[1] - 9); }
          else { userGlyph(p[0], p[1] - 10, 5, TRAFFIC); } // traffic = a member travelling to the buyer
          ctx.restore(); ctx.globalAlpha = 1; }
      } else { pt.trail.length = 0; }
    }
    ctx.restore(); ctx.globalAlpha = 1;

    // nodes, back-to-front
    const all = [];
    BUYERS.forEach((n) => all.push({ n, kind: 'b' }));
    PARTNERS.forEach((n) => all.push({ n, kind: 'p' }));
    CENTERS.forEach((n) => all.push({ n, kind: 'c' }));
    all.forEach((it) => { it.v = rot(it.n.p); it.p = proj(it.v); it.n._sx = it.p[0]; it.n._sy = it.p[1]; it.n._dep = it.v[2]; it.n._kind = it.kind; });
    all.sort((a, b) => a.v[2] - b.v[2]);
    for (const it of all) { const n = it.n, v = it.v, p = it.p, dep = v[2]; if (dep < -0.2) continue;
      const fade = dep > 0 ? 1 : 0.32;
      if (it.kind === 'b') {
        const rr = 8;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.7 * fade;
        const gg = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], rr * 2); gg.addColorStop(0, BUY); gg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(p[0], p[1], rr * 2, 0, 7); ctx.fill(); ctx.restore();
        ctx.globalAlpha = fade;
        ctx.beginPath(); ctx.arc(p[0], p[1], rr, 0, 7); ctx.fillStyle = '#0c1526'; ctx.fill();
        ctx.beginPath(); ctx.arc(p[0], p[1], rr, 0, 7); ctx.lineWidth = 1.4; ctx.strokeStyle = 'rgba(134,182,255,.7)'; ctx.stroke();
        userGlyph(p[0], p[1], rr, BUY);
        ctx.globalAlpha = 1;
      } else if (it.kind === 'p') {
        const rr = 13; ctx.globalAlpha = fade;
        if (n.img) { ctx.save(); ctx.beginPath(); ctx.arc(p[0], p[1], rr, 0, 7); ctx.clip(); ctx.fillStyle = '#0e1a2c'; ctx.fillRect(p[0] - rr, p[1] - rr, rr * 2, rr * 2); ctx.drawImage(n.img, p[0] - rr, p[1] - rr, rr * 2, rr * 2); ctx.restore(); } // opaque backing so transparent (SVG) avatars don't shimmer over the starfield
        else { ctx.beginPath(); ctx.arc(p[0], p[1], rr, 0, 7); ctx.fillStyle = '#0a1a13'; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = n.color; ctx.stroke(); ctx.beginPath(); ctx.arc(p[0], p[1], 2, 0, 7); ctx.fillStyle = n.color; ctx.fill(); }
        ctx.globalAlpha = 1;
      } else {
        const rr = 11;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.9 * fade;
        const gg = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], rr * 2.4); gg.addColorStop(0, 'rgba(34,168,240,.5)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(p[0], p[1], rr * 2.4, 0, 7); ctx.fill(); ctx.restore();
        ctx.globalAlpha = fade;
        ctx.beginPath(); ctx.arc(p[0], p[1], rr, 0, 7); ctx.fillStyle = '#0a1420'; ctx.fill();
        ctx.beginPath(); ctx.arc(p[0], p[1], rr, 0, 7); ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(92,200,255,.75)'; ctx.stroke();
        if (logoOk) { const s = rr * 1.4; ctx.save(); ctx.beginPath(); ctx.arc(p[0], p[1], rr - 3, 0, 7); ctx.clip(); ctx.drawImage(logo, p[0] - s / 2, p[1] - s / 2, s, s); ctx.restore(); }
        ctx.globalAlpha = 1;
      }
    }

    for (let i = FLOATS.length - 1; i >= 0; i--) { const fl = FLOATS[i]; fl.t += 0.018; if (fl.t >= 1) { FLOATS.splice(i, 1); continue; } drawFloat(fl); }

    if (!reduce && Math.random() < 0.09 && PARTS.length < 22) spawn();
    raf = requestAnimationFrame(draw);
  }

  // rotate by dragging with the left mouse button (tracked on window so a fast
  // drag outside the canvas keeps working), or with one finger on touch
  const rotBy = (dx, dy) => { const vx = dx * 0.006; rotY += vx; rotX += dy * 0.006; rotX = Math.max(-1.15, Math.min(1.15, rotX)); spinVel = Math.max(-0.15, Math.min(0.15, vx)); };
  const stopDrag = () => { dragging = false; wrap.style.cursor = ''; };
  wrap.addEventListener('mousedown', (e) => { if (e.button !== 0) return; e.preventDefault(); dragging = true; lastX = e.clientX; lastY = e.clientY; wrap.style.cursor = 'grabbing'; });
  window.addEventListener('mousemove', (e) => { if (!dragging) return; if (!(e.buttons & 1)) { stopDrag(); return; } rotBy(e.clientX - lastX, e.clientY - lastY); lastX = e.clientX; lastY = e.clientY; });
  window.addEventListener('mouseup', stopDrag);
  window.addEventListener('blur', stopDrag);
  wrap.addEventListener('mouseenter', () => { if (!dragging) wrap.style.cursor = 'grab'; });
  wrap.addEventListener('touchstart', (e) => { if (e.touches.length !== 1) return; dragging = true; lastX = e.touches[0].clientX; lastY = e.touches[0].clientY; }, { passive: true });
  wrap.addEventListener('touchmove', (e) => { if (!dragging || e.touches.length !== 1) return; const t = e.touches[0]; rotBy(t.clientX - lastX, t.clientY - lastY); lastX = t.clientX; lastY = t.clientY; e.preventDefault(); }, { passive: false });
  const endTouch = () => { dragging = false; };
  wrap.addEventListener('touchend', endTouch); wrap.addEventListener('touchcancel', endTouch);

  // hover tooltips: server name on partner avatars, role labels on buyers/centres
  const tip = document.createElement('div'); tip.className = 'viz-tip'; tip.hidden = true; wrap.appendChild(tip);
  const LABELS = { b: { ru: 'Покупатель рекламы', en: 'Ad buyer' }, c: { ru: 'Бот-верификатор', en: 'Verification bot' } };
  function pickHover(mx, my) {
    let best = null, bd = Infinity;
    const scan = (arr, kind, rr) => arr.forEach((n) => { if ((n._dep || -1) <= 0.02) return; const dx = n._sx - mx, dy = n._sy - my, d = dx * dx + dy * dy, hit = (rr + 5) * (rr + 5); if (d < hit && d < bd) { bd = d; best = { n, kind }; } });
    scan(PARTNERS, 'p', 13); scan(CENTERS, 'c', 11); scan(BUYERS, 'b', 8);
    return best;
  }
  wrap.addEventListener('mousemove', (e) => {
    if (dragging) { tip.hidden = true; return; }
    const r = canvas.getBoundingClientRect(); const h = pickHover(e.clientX - r.left, e.clientY - r.top);
    if (!h) { tip.hidden = true; if (!dragging) wrap.style.cursor = 'grab'; return; }
    const lng = document.documentElement.lang === 'ru' ? 'ru' : 'en';
    tip.textContent = h.kind === 'p' ? (h.n.name || (lng === 'ru' ? 'Сервер-партнёр' : 'Partner server')) : LABELS[h.kind][lng];
    tip.style.left = h.n._sx + 'px'; tip.style.top = (h.n._sy - 14) + 'px'; tip.hidden = false;
    wrap.style.cursor = 'pointer';
  });
  wrap.addEventListener('mouseleave', () => { tip.hidden = true; });

  window.addEventListener('resize', () => { cancelAnimationFrame(raf); layout(); draw(); });
  window.addEventListener('vemoni:feed', () => buildNodes()); // real avatars once the managed feed loads
  requestAnimationFrame(() => { layout(); buildNodes(); for (let i = 0; i < 10; i++) spawn(); draw(); });
})();
/* ---------- Logged-in user chip + cabinet menu (main page) ---------- */
(function () {
  const box = document.getElementById('navUser'); if (!box) return;
  const loginBtn = document.querySelector('.nav-login');
  const base = (window.__VEMONI_API_BASE__ || '').replace(/\/+$/, '');
  let tok = ''; try { tok = localStorage.getItem('vemoni_tok') || ''; } catch (_) {}
  const headers = {}; if (tok) headers.Authorization = 'Bearer ' + tok;
  // Average the avatar to a dominant colour and use it as a Discord-style banner.
  function bannerFromAvatar(url) {
    const bn = document.getElementById('nmBanner'); if (!bn) return;
    const img = new Image(); img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const cv = document.createElement('canvas'); cv.width = cv.height = 16;
        const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0, 16, 16);
        const p = cx.getImageData(0, 0, 16, 16).data;
        let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < p.length; i += 4) { r += p[i]; g += p[i + 1]; b += p[i + 2]; n++; }
        r = (r / n) | 0; g = (g / n) | 0; b = (b / n) | 0;
        const dk = (v) => (v * 0.62) | 0;
        bn.style.background = 'linear-gradient(135deg, rgb(' + r + ',' + g + ',' + b + '), rgb(' + dk(r) + ',' + dk(g) + ',' + dk(b) + '))';
      } catch (_) { /* tainted / decode fail → keep the default banner */ }
    };
    img.src = url;
  }
  const setAuthed = (v) => { try { v ? localStorage.setItem('vemoni_authed', '1') : localStorage.removeItem('vemoni_authed'); } catch (_) {} };
  fetch(base + '/partner/whoami', { credentials: 'include', headers })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (!d || !d.authed) { // stale optimistic state → reveal the login button again
        setAuthed(false); document.documentElement.classList.remove('pre-auth');
        if (loginBtn) loginBtn.style.display = ''; box.hidden = true; return;
      }
      setAuthed(true);
      if (loginBtn) loginBtn.style.display = 'none';
      const name = d.name || d.username || 'User';
      const letter = (name.trim()[0] || 'U').toUpperCase();
      const av = document.getElementById('navAv');
      if (d.avatar) { av.style.backgroundImage = 'url("' + d.avatar + '")'; }
      else { av.textContent = letter; }
      // profile header inside the menu
      const nmAv = document.getElementById('nmAv'), nmName = document.getElementById('nmName'), nmUser = document.getElementById('nmUser');
      if (nmName) nmName.textContent = name;
      if (nmUser) nmUser.textContent = d.username ? '@' + d.username : ('ID ' + (d.userId || ''));
      if (nmAv) { if (d.avatar) nmAv.style.backgroundImage = 'url("' + d.avatar + '")'; else nmAv.textContent = letter; }
      // real Discord banner if the user has one; otherwise tint from avatar colour
      const nmBanner = document.getElementById('nmBanner');
      if (nmBanner && d.banner) { nmBanner.style.backgroundImage = 'url("' + d.banner + '")'; nmBanner.style.backgroundSize = 'cover'; nmBanner.style.backgroundPosition = 'center'; }
      else if (d.avatar) bannerFromAvatar(d.avatar);
      if (!d.isAdmin) box.querySelectorAll('[data-admin]').forEach((el) => el.remove());
      // highlight the section the user is currently on
      box.querySelectorAll('.nm-items a').forEach((a) => { if (a.getAttribute('href') === location.pathname) a.classList.add('active'); });
      box.hidden = false;
      const menu = document.getElementById('navMenu');
      const toggle = (e) => { e.preventDefault(); e.stopPropagation(); menu.hidden = !menu.hidden; };
      av.addEventListener('click', toggle);
      menu.addEventListener('click', (e) => e.stopPropagation());
      document.addEventListener('click', () => { menu.hidden = true; });
      const lo = document.getElementById('navLogout');
      if (lo) lo.addEventListener('click', async (e) => {
        e.preventDefault();
        try { await fetch(base + '/partner/logout', { method: 'POST', credentials: 'include', headers }); } catch (_) {}
        try { localStorage.removeItem('vemoni_tok'); } catch (_) {}
        setAuthed(false);
        location.reload();
      });
    })
    .catch(() => {});
})();
