/* ---------- Server feed data (fallback numbers from web research + API) ---------- */
const SERVERS = [
  { code: 'mikutag', name: 'MIKU TAG・CHAT・SOCIAL', members: 230357, color: '#39c5bb', accent: 'linear-gradient(150deg,#39c5bb,#2f8f9c)', letter: 'M', id: '1369047464073498776', icon: 'dfab23ce3751ac4872b859eac2151ea8' },
  { code: 'yaoitag', name: 'YA0I TAG・CHAT・SOCIAL', members: 175561, color: '#e63b7a', accent: 'linear-gradient(150deg,#e63b7a,#7c2d6b)', letter: 'Y', id: '1369363539332042853', icon: 'a_355f16ede56cb094740b46546eee0a73' },
  { code: 'tagyuri', name: 'YURI TAG・CHAT・SOCIAL', members: 132614, color: '#a855f7', accent: 'linear-gradient(150deg,#a855f7,#5b2ea6)', letter: 'Y', id: '1369076925389078609', icon: '113818409cc1ab5871354f52a7e36283' },
  { code: 'teto', name: 'TETO TAG・CHAT・SOCIAL', members: 65274, color: '#d1004b', accent: 'linear-gradient(150deg,#d1004b,#7a0030)', letter: 'T', id: '1369106099608748102', icon: 'a_9421492e28203f89f5003ea2ee618537' },
  { code: 'ggif', name: 'GIFLAND СНГ', members: 50897, color: '#5865f2', accent: 'linear-gradient(150deg,#5865f2,#333a99)', letter: 'G', id: '972405591140085791', icon: 'a_096abac0dd6b01694ef7aaceaf24e613' },
  { name: 'Guild Tags | 55k+ Guilds Server Tags', members: 71156, color: '#8b5cf6', accent: 'linear-gradient(150deg,#8b5cf6,#4c2d8f)', letter: 'G', id: '724948162101293056', link: 'https://top.gg/discord/servers/724948162101293056', img: 'assets/gtl.svg' },
  { code: 'S7ftaq8qN', name: 'Server Tags', members: null, color: '#f59e0b', accent: 'linear-gradient(150deg,#f59e0b,#a85d06)', letter: 'S' },
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
    ? `<span class="scard-ic"><img src="${src}" alt="" loading="lazy" onerror="const p=this.parentElement;p.style.background='${s.accent}';p.textContent='${s.letter}'" /></span>`
    : `<span class="scard-ic" style="background:${s.accent}">${s.letter}</span>`;
  return `
    <div class="scard" data-code="${s.code || s.id}">
      ${ic}
      <div class="scard-info">
        <div class="scard-name">${s.name}</div>
        <div class="scard-members"><span class="online-dot">●</span> <span data-role="members">${fmt(s.members)} members</span></div>
      </div>
    </div>`;
}

/* Two rows (top scrolls left, bottom scrolls right), each duplicated for a seamless loop */
const rowTop = document.getElementById('rowTop');
const rowBottom = document.getElementById('rowBottom');
const topHTML = SERVERS.map(cardHTML).join('');
const bottomHTML = [...SERVERS].reverse().map(cardHTML).join('');
rowTop.innerHTML = topHTML + topHTML;
rowBottom.innerHTML = bottomHTML + bottomHTML;

/* Try to refresh counts live from the visitor's browser (Discord invite API allows CORS). */
async function refreshLive() {
  await Promise.all(SERVERS.map(async (s) => {
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
refreshLive();

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
    else if (target >= 1000) text = prefix + val.toLocaleString('en-US');
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
  nav_what: 'О сервисе', nav_how: 'Как это работает', nav_numbers: 'Цифры', nav_faq: 'Вопросы', nav_contact: 'Связаться',
  hero_pill: 'Двухминутный обзор для будущих партнёров',
  hero_h1: 'Верификация,<br /><span class="grad">за которую платят</span>',
  hero_sub: 'Краткий и честный обзор: что делает Vemonette, как это работает и какие за этим цифры.',
  hero_cta: 'Читать ↓',
  stat1_label: 'Уже выплачено партнёрам',
  stat2_label: 'Фиксированно за 100 кликов',
  stat3_label: 'продано кликов',
  what_h2: 'Что такое Vemonette',
  what_p1: 'Vemonette создаёт персонального бота-верификатора для крупных Discord-серверов: участники проходят проверку в два клика, а вы получаете оплату за показы рекламы',
  what_p2: '',
  chip1: '🛡️ Защищает сервер', chip2: '⚡ Два клика для участников', chip3: '💸 Платит за клики',
  how_h2: 'Как это работает',
  how_sub: 'Три шага — дальше всё само.',
  step1_h3: 'Настраиваем бота',
  step1_p: 'Создаём и хостим бота-верификатора под ваш сервер. Бесплатно, около 10 минут, ничего поддерживать не нужно.',
  step2_h3: 'Участники проходят верификацию',
  step2_p: 'Клик, короткое рекламное сообщение, ещё клик. Привычный им сценарий — без лишних шагов.',
  step3_h3: 'Вы зарабатываете автоматически',
  step3_p: '$1 за каждые 100 подтверждённых кликов. На $10 бот сам создаёт запрос на вывод по вашим реквизитам.',
  how_note: 'Вот обе стороны в действии:',
  sim1_badge: 'Что видят участники', sim1_h3: 'Прохождение верификации',
  sim1_p: 'Участник кликает, видит короткое сообщение, подтверждает — и получает доступ.',
  sim2_badge: 'Что контролируете вы',
  sim2_h3: 'Команда <code>/verification</code> и баланс',
  sim2_p: 'Один раз публикуете карточку верификации, затем следите за балансом через <code>/bal</code>.',
  num_h2: 'Цифры',
  num_p: 'Фиксированная ставка, прозрачный подсчёт, прямые выплаты. Всё важное — в одном месте.',
  check1: '<b>$1</b> за 100 подтверждённых кликов — фиксированно, без уровней и мелкого шрифта',
  check2: 'Запрос на вывод создаётся автоматически, как только у вас <b>$10</b>',
  check3: 'Считаются только реальные, завершённые верификации',
  check4: 'Вывод на карту, крипту или кошелёк',
  fig_big_label: 'выплачено партнёрам', fig1_label: 'продано кликов', fig2_label: 'за 100 кликов',
  servers_h2: 'Сообщества, которые уже с нами',
  faq_h2: 'Частые вопросы партнёров',
  faq_q1: 'Не будет ли это раздражать участников?',
  faq_a1: 'Нет. Это та же верификация в два клика, с одной короткой рекламной строкой перед доступом. Никаких принудительных переходов, спама и лишних шагов сверх того, что и так нужно для проверки.',
  faq_q2: 'Как считаются клики?',
  faq_a2: 'Только завершённые верификации, в которых реально была показана реклама.',
  faq_q3: 'Когда и как я получаю выплату?',
  faq_a3: 'Автоматически. Как только баланс достигает $10, создаётся запрос на вывод по вашим реквизитам — карта, крипта или кошелёк.',
  faq_q4: 'Что мне нужно делать?',
  faq_a4: 'После настройки — один раз опубликовать карточку верификации. Всё остальное (проверка, реклама, подсчёт и выплаты) бот делает сам.',
  faq_q5: 'Достаточно ли большой у меня сервер?',
  faq_a5: 'Всё зависит от реальных заходов, так что активные сообщества выигрывают больше — но жёсткого минимума нет.',
  connect_h2: 'Если звучит полезно',
  connect_p: 'Проще всего — короткий разговор без обязательств. Спрашивайте что угодно: настройка, сроки, нюансы.',
  connect_btn: 'Написать в Discord — @allanwdc',
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
    { step: 0, wait: 1200, act: () => { reset(); setCmd('/verification', true); } }, // typing command
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
