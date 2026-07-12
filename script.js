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
  const topHTML = FEED.map(cardHTML).join('');
  const bottomHTML = [...FEED].reverse().map(cardHTML).join('');
  rowTop.innerHTML = topHTML + topHTML;
  rowBottom.innerHTML = bottomHTML + bottomHTML;
}
renderFeedRows(); // instant render with the built-in fallback

/* Load the owner-managed feed from the API (falls back to SERVERS on error). */
async function loadManagedFeed() {
  try {
    const base = (window.__VEMONI_API_BASE__ || '').replace(/\/+$/, '');
    const r = await fetch(base + '/feed');
    if (r.ok) {
      const d = await r.json();
      if (Array.isArray(d.servers) && d.servers.length) { FEED = d.servers; renderFeedRows(); }
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
  menu_partner: 'Кабинет партнёра', menu_order: 'Кабинет покупателя', menu_invest: 'Кабинет инвестора', menu_admin: 'Админка', menu_logout: 'Выйти',
  viz_buyers: 'Покупатели', viz_partners: 'Партнёры',
  stat1_label: 'Уже выплачено партнёрам',
  stat2_label: 'довольных покупателей',
  stat3_label: 'продано заходов',
  what_h2: 'Что такое Vemoni',
  what_p1: 'Vemoni создаёт персонального бота-верификатора для крупных Discord-серверов: участники проходят проверку в два клика, а вы получаете оплату за успешные проверки',
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
  faq_a1: 'Нет. Это та же стандартная верификация в два клика, но с одной короткой рекламной строкой перед доступом. Никаких принудительных переходов, и лишних шагов для пользователя',
  faq_q2: 'Как считаются клики?',
  faq_a2: 'Засчитываются полностью завершённые верификации, когда пользователь увидел рекламу, и получил роль проверенного.',
  faq_q3: 'Когда и как я получаю выплату?',
  faq_a3: 'Автоматически. Как только баланс достигает $10, создаётся запрос на вывод по вашим реквизитам — карта, крипта или кошелёк.',
  faq_q4: 'Что мне нужно делать?',
  faq_a4: 'После настройки — один раз опубликовать карточку верификации командой /verify (role). Всё остальное (проверка, реклама, подсчёт и выплаты) бот делает сам.',
  connect_h2: 'Остались вопросы?',
  connect_p: 'Свяжитесь с нами в Discord<br />Спрашивайте что угодно: настройка, сроки, нюансы.',
  connect_btn: 'Сервер поддержки',
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

/* ---------- Hero flow visualization (partner version) ----------
   Payments stream from buyers (left) through the Vemoni hub to partner servers
   (right); each partner shows a live counter of what it earned from Vemoni.
   Vizceral/sFlow-style: particles ride quadratic Bézier curves; additive-glow
   bloom + tapered trails for a neon, alive feel. */
(function () {
  const wrap = document.getElementById('viz'), canvas = document.getElementById('flow');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const cs = getComputedStyle(document.documentElement);
  const cv = (v, f) => { const x = cs.getPropertyValue(v).trim(); return x || f; };
  const BLUE = cv('--blue-2', '#5cc8ff'), GREEN = cv('--green', '#57f287'), RED = cv('--red', '#ed4245');
  const logo = new Image(); let logoOk = false; logo.onload = () => { logoOk = true; }; logo.src = 'assets/logo.png';
  let W = 0, H = 0, dpr = 1, sources = [], hub = {}, dests = [], parts = [], acc = 0, t = 0, raf;
  const PAY = 0.05, TRAIL = 9;

  function layout() {
    const r = wrap.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Symmetric layout: hub at ~0.40, buyers and partners the same distance
    // (0.30·W) either side, so the connection lines mirror; the partner pills
    // extend right so the whole composition sits centered in the card.
    const lx = W * 0.10, ns = 6;
    sources = []; for (let i = 0; i < ns; i++) sources.push({ x: lx, y: H * (0.10 + 0.80 * (i / (ns - 1))), r: 6.5, ph: Math.random() * 6.28 });
    hub = { x: W * 0.40, y: H * 0.5, r: 30 };
    const dx = W * 0.70, nd = 5;
    if (dests.length !== nd) { dests = []; for (let i = 0; i < nd; i++) dests.push({ earned: 20 + Math.random() * 220, ph: Math.random() * 6.28, pulse: 0 }); }
    for (let i = 0; i < nd; i++) { dests[i].x = dx; dests[i].y = H * (0.12 + 0.76 * (i / (nd - 1))); dests[i].r = 8.5; }
  }
  const ctrl = (a, b, bend) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 + bend });
  const qbez = (p0, cx, cy, p1, tt) => { const u = 1 - tt; return { x: u * u * p0.x + 2 * u * tt * cx + tt * tt * p1.x, y: u * u * p0.y + 2 * u * tt * cy + tt * tt * p1.y }; };
  const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };

  function spawn() {
    const s = sources[(Math.random() * sources.length) | 0];
    const di = (Math.random() * dests.length) | 0;
    const c = ctrl(s, hub, (s.y - hub.y) * 0.18);
    parts.push({ s, di, bad: Math.random() < 0.10, leg: 0, t: 0, sp: 0.0092 + Math.random() * 0.005, cx: c.x, cy: c.y, trail: [], die: 0 });
  }
  function glow(x, y, r, c, a) { ctx.globalAlpha = a; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, c); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
  function gradLink(a, cx, cy, b, c0, c1, w) { const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y); g.addColorStop(0, c0); g.addColorStop(1, c1); ctx.strokeStyle = g; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(cx, cy, b.x, b.y); ctx.stroke(); }

  function draw() {
    t += 0.016; ctx.clearRect(0, 0, W, H); ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    // base connection lines (subtle)
    ctx.globalCompositeOperation = 'source-over';
    sources.forEach(s => { const c = ctrl(s, hub, (s.y - hub.y) * 0.12); gradLink(s, c.x, c.y, hub, 'rgba(92,200,255,.03)', 'rgba(92,200,255,.20)', 1.1); });
    dests.forEach(d => { const c = ctrl(hub, d, (d.y - hub.y) * 0.06); gradLink(hub, c.x, c.y, d, 'rgba(92,200,255,.18)', 'rgba(87,242,135,.34)', 1.3); });

    // additive glow layer (bloom)
    ctx.globalCompositeOperation = 'lighter';
    glow(hub.x, hub.y, 120, 'rgba(34,168,240,.16)', 1);
    sources.forEach(s => glow(s.x, s.y, 26, 'rgba(92,200,255,.14)', 1));
    dests.forEach(d => glow(d.x, d.y, 30, 'rgba(87,242,135,.16)', 1));

    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i], d = dests[p.di];
      if (p.die > 0) { const dx = hub.x + (1 - p.die) * 8, dy = hub.y + (1 - p.die) * 26; glow(dx, dy, 12, RED, p.die * .8); p.die -= 0.05; if (p.die <= 0) parts.splice(i, 1); continue; }
      p.t += p.sp * (p.leg === 1 ? 1.25 : 1);
      let pos;
      if (p.leg === 0) { pos = qbez(p.s, p.cx, p.cy, hub, Math.min(1, p.t)); if (p.t >= 1) { if (p.bad) { p.die = 1; continue; } p.leg = 1; p.t = 0; const c = ctrl(hub, d, (d.y - hub.y) * 0.06); p.cx = c.x; p.cy = c.y; } }
      else { pos = qbez(hub, p.cx, p.cy, d, Math.min(1, p.t)); if (p.t >= 1) { d.earned += PAY; d.pulse = 1; parts.splice(i, 1); continue; } }
      p.trail.push({ x: pos.x, y: pos.y }); if (p.trail.length > TRAIL) p.trail.shift();
      const col = p.leg === 0 ? BLUE : GREEN, tr = p.trail;
      for (let k = 1; k < tr.length; k++) { const a = k / tr.length; ctx.globalAlpha = a * 0.85; ctx.lineWidth = 0.5 + 2.6 * a; ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(tr[k - 1].x, tr[k - 1].y); ctx.lineTo(tr[k].x, tr[k].y); ctx.stroke(); }
      ctx.globalAlpha = 1;
      glow(pos.x, pos.y, 8, col, .9);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(pos.x, pos.y, 1.9, 0, 7); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    // source nodes (buyers)
    sources.forEach(s => { const pl = 1 + Math.sin(t * 1.6 + s.ph) * 0.12;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r * pl, 0, 7); ctx.fillStyle = '#0c1526'; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(92,200,255,.7)'; ctx.stroke();
      ctx.beginPath(); ctx.arc(s.x, s.y, 2, 0, 7); ctx.fillStyle = BLUE; ctx.fill();
    });

    // hub (Vemoni)
    ctx.beginPath(); ctx.arc(hub.x, hub.y, hub.r, 0, 7); ctx.fillStyle = '#0a1322'; ctx.fill();
    ctx.beginPath(); ctx.arc(hub.x, hub.y, hub.r, 0, 7); ctx.lineWidth = 1.4; ctx.strokeStyle = 'rgba(34,168,240,.32)'; ctx.stroke();
    ctx.beginPath(); ctx.arc(hub.x, hub.y, hub.r + 5, t * 0.8, t * 0.8 + 1.5); ctx.strokeStyle = BLUE; ctx.lineWidth = 2.2; ctx.stroke();
    ctx.beginPath(); ctx.arc(hub.x, hub.y, hub.r + 5, t * 0.8 + Math.PI, t * 0.8 + Math.PI + 1.0); ctx.strokeStyle = 'rgba(92,200,255,.5)'; ctx.lineWidth = 2.2; ctx.stroke();
    ctx.beginPath(); ctx.arc(hub.x, hub.y, hub.r + 11, -t * 0.5, -t * 0.5 + 0.7); ctx.strokeStyle = 'rgba(87,242,135,.45)'; ctx.lineWidth = 1.8; ctx.stroke();
    if (logoOk) { const s = hub.r * 1.3; ctx.save(); ctx.beginPath(); ctx.arc(hub.x, hub.y, hub.r - 7, 0, 7); ctx.clip(); ctx.drawImage(logo, hub.x - s / 2, hub.y - s / 2, s, s); ctx.restore(); }

    // partner nodes + earnings pills
    ctx.textBaseline = 'middle';
    dests.forEach(d => {
      if (d.pulse > 0) { ctx.beginPath(); ctx.arc(d.x, d.y, d.r + (1 - d.pulse) * 15, 0, 7); ctx.strokeStyle = 'rgba(87,242,135,' + (d.pulse * .55) + ')'; ctx.lineWidth = 2; ctx.stroke(); d.pulse -= 0.045; if (d.pulse < 0) d.pulse = 0; }
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 7); ctx.fillStyle = '#0a1a13'; ctx.fill();
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 7); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(87,242,135,.6)'; ctx.stroke();
      ctx.beginPath(); ctx.arc(d.x, d.y, 2, 0, 7); ctx.fillStyle = GREEN; ctx.fill();
      ctx.font = '800 12.5px Roboto,system-ui,sans-serif';
      const txt = '$' + d.earned.toFixed(2), tw = ctx.measureText(txt).width;
      const cx = d.x + d.r + 10, cw = tw + 18, ch = 22;
      rr(cx, d.y - ch / 2, cw, ch, 11); ctx.fillStyle = 'rgba(87,242,135,.10)'; ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(87,242,135,.3)'; ctx.stroke();
      ctx.textAlign = 'left'; ctx.fillStyle = GREEN; ctx.fillText(txt, cx + 9, d.y + .5);
    });
    ctx.textBaseline = 'alphabetic';

    acc++; if (acc >= 7 && parts.length < 46) { acc = 0; spawn(); }
    if (!reduce) raf = requestAnimationFrame(draw);
  }
  window.addEventListener('resize', () => { cancelAnimationFrame(raf); layout(); draw(); });
  requestAnimationFrame(() => { layout(); if (reduce) { for (let i = 0; i < 10; i++) spawn(); } draw(); });
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
  fetch(base + '/partner/whoami', { credentials: 'include', headers })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (!d || !d.authed) return;
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
      // Discord-style: no real banner → tint it from the avatar's dominant colour
      if (d.avatar) bannerFromAvatar(d.avatar);
      if (!d.isAdmin) box.querySelectorAll('[data-admin]').forEach((el) => el.remove());
      box.hidden = false;
      const menu = document.getElementById('navMenu');
      const toggle = (e) => { e.preventDefault(); e.stopPropagation(); menu.hidden = !menu.hidden; };
      document.getElementById('navBurger').addEventListener('click', toggle);
      av.addEventListener('click', toggle);
      menu.addEventListener('click', (e) => e.stopPropagation());
      document.addEventListener('click', () => { menu.hidden = true; });
      const lo = document.getElementById('navLogout');
      if (lo) lo.addEventListener('click', async (e) => {
        e.preventDefault();
        try { await fetch(base + '/partner/logout', { method: 'POST', credentials: 'include', headers }); } catch (_) {}
        try { localStorage.removeItem('vemoni_tok'); } catch (_) {}
        location.reload();
      });
    })
    .catch(() => {});
})();
