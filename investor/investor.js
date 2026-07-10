// Investor cabinet — vanilla JS.
const API = (window.__VEMONI_API_BASE__ || '').replace(/\/+$/, '') + '/investor';

async function api(path, opts = {}) {
    let res;
    try {
        res = await fetch(API + path, { credentials: 'include', headers: opts.body ? { 'Content-Type': 'application/json' } : {}, ...opts });
    } catch (err) { throw new Error('Нет связи с сервером'); }
    let body = null; try { body = await res.json(); } catch {}
    return { ok: res.ok, status: res.status, body };
}
const get = (p) => api(p);
const post = (p, o) => api(p, { method: 'POST', body: o ? JSON.stringify(o) : undefined });

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => '$' + Number(n || 0).toFixed(2);
const nf = (n) => Number(n || 0).toLocaleString('ru-RU');
let toastT;
function toast(msg, kind = 'ok') { const el = $('#toast'); el.className = `toast ${kind}`; el.textContent = tr(msg); el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 3500); }

// ---------- Full EN translation (runtime; RU is the source, one-way) ----------
let invLang = localStorage.getItem('vemoni_lang') || ((navigator.language || '').startsWith('en') ? 'en' : 'ru');
if (invLang !== 'en' && invLang !== 'ru') invLang = 'ru';
const WHOLE = {
  'Выйти':'Log out','Вывести':'Withdraw','Инвест-счёт':'Investment account','Отмена':'Cancel',
  'Главная':'Home','Заказы':'Orders','Партнёр':'Partner','Инвест':'Invest','Админка':'Admin'
};
function setupCabNav(isAdmin) {
    const path = location.pathname;
    document.querySelectorAll('.cab-nav [data-cn]').forEach((a) => { if (path.indexOf('/' + a.dataset.cn) === 0) a.classList.add('active'); });
    if (isAdmin) document.querySelectorAll('.cab-nav [data-cn="admin"]').forEach((a) => (a.hidden = false));
}
const TR_RE = [
  [/\$(\d[\d.,]*) за 100/g,'$$$1 per 100'],
  [/(\d+) заходов/g,'$1 joins'],[/(\d+) инвайтов/g,'$1 invites']
];
const TR = {
  'Vemoni · Инвесторам':'Vemoni · Investors','Vemoni · Инвест-кабинет':'Vemoni · Investor cabinet',
  'Войдите через Discord, чтобы открыть инвест-счёт и выкупать инвайты серверов.':'Log in with Discord to open an investment account and buy server invites.',
  'Войти через Discord':'Log in with Discord','Не удалось войти. Попробуйте ещё раз.':'Could not log in. Please try again.','Нет связи с сервером':'No connection to the server',
  '＋ Пополнить':'＋ Top up','Кабинет партнёра':'Partner cabinet','Инвест-кабинет':'Investor cabinet',
  // account cards
  'Свободно':'Available','Вложено сейчас':'Invested now','Возвращено (с +10%)':'Returned (incl. +10%)','Прибыль':'Profit',
  'Инвайтов куплено':'Invites bought','продано':'sold',
  // how it works
  'Как это работает':'How it works',
  'Пополняете инвест-счёт':'Top up the investment account','USDT через CryptoBot — так же, как баланс при заказе рекламы.':'USDT via CryptoBot — just like the balance when ordering ads.',
  'Выкупаете будущие инвайты сервера':'Buy a server’s future invites','Это не для себя, а как вклад.':'Not for your own use — as an investment.','со скидкой к рознице':'at a discount to retail',
  'Сервис продаёт их по рознице':'The service resells them at retail','По мере продажи ваших инвайтов вам возвращается вложенное':'As your invites sell, your stake is returned','Жёсткого срока нет — доход идёт из реальных продаж.':'No fixed deadline — return comes from real sales.',
  'Доход зависит от того, как быстро сервер продаёт заходы — выбирайте активные серверы (смотрите «продаётся заходов» в карточке). Инвайты каждого сервера продаются по очереди в порядке выкупа.':'Your return depends on how fast the server sells joins — pick active servers (see “joins sold” on the card). Each server’s invites sell in order of purchase.',
  // servers
  'Серверы для выкупа':'Servers to invest in','Пока нет серверов с активностью.':'No active servers yet.',
  'Продаётся заходов':'Joins sold','час':'hour','день':'day','неделя':'week','всего':'total',
  'Выкуп':'Buy-in','продажа':'resale','возврат':'return',
  'Выкуп инвайтов':'Buy invites','Ваши инвайты':'Your invites',
  'Куплено':'Bought','Продано':'Sold','Осталось':'Outstanding','Вложено':'Invested','Заработано':'Earned',
  // buy / topup / withdraw
  'Сколько инвайтов выкупить?':'How many invites to buy?','Минимум':'Minimum','Неверное число':'Invalid number',
  'Выкуплено инвайтов':'Invites bought','Недостаточно средств на инвест-счёте. Пополните счёт.':'Not enough on the investment account. Top it up.',
  'Сумма пополнения в $ (минимум':'Top-up amount in $ (min','Счёт создан. Оплатите через CryptoBot — средства зачислятся в течение минуты.':'Invoice created. Pay via CryptoBot — funds credit within a minute.','Оплата временно недоступна':'Payments are temporarily unavailable','Не удалось создать счёт':'Could not create the invoice',
  'Вывести всё свободное на баланс партнёра?':'Withdraw all available to the partner balance?','Переведено на баланс партнёра':'Transferred to the partner balance','Нечего выводить':'Nothing to withdraw',
  'Сервер':'Server','Не удалось':'Failed',
  'Сервер уже занят другим инвестором, станет доступным через':'Taken by another investor, frees up in','Сервер уже занят другим инвестором.':'This server is taken by another investor.','скоро':'soon'
};
const TR_SORTED = Object.keys(TR).sort((a, b) => b.length - a.length).map((k) => [k, TR[k]]);
function tr(s) {
    if (invLang !== 'en' || s == null) return s;
    s = String(s);
    for (const [re, rep] of TR_RE) s = s.replace(re, rep);
    for (const [ru, en] of TR_SORTED) if (s.indexOf(ru) >= 0) s = s.split(ru).join(en);
    return s;
}
function trWhole(t) { const k = t.trim(); if (k && WHOLE[k] !== undefined) return t.replace(k, WHOLE[k]); return tr(t); }
const CYR = /[А-Яа-яЁё]/;
function localizeAll(root) {
    if (invLang !== 'en') return;
    root = root || document.body;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode(n) {
        const tag = n.parentNode && n.parentNode.nodeName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA') return NodeFilter.FILTER_REJECT;
        return CYR.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    } });
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const n of nodes) { const v = trWhole(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; }
    (root.querySelectorAll ? root.querySelectorAll('[placeholder],[title]') : []).forEach((el) => {
        ['placeholder', 'title'].forEach((a) => { const val = el.getAttribute(a); if (val && CYR.test(val)) { const t = tr(val); if (t !== val) el.setAttribute(a, t); } });
    });
}
let _obs;
function startTranslator() {
    document.querySelectorAll('.lang-switch button').forEach((b) => b.classList.toggle('active', b.dataset.lang === invLang));
    document.documentElement.lang = invLang;
    if (invLang !== 'en' || _obs) return;
    const opts = { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title'] };
    localizeAll(document.body);
    _obs = new MutationObserver(() => { _obs.disconnect(); localizeAll(document.body); _obs.observe(document.body, opts); });
    _obs.observe(document.body, opts);
}
document.querySelectorAll('.lang-switch button').forEach((b) => b.addEventListener('click', () => { localStorage.setItem('vemoni_lang', b.dataset.lang); location.reload(); }));
const _confirm = window.confirm.bind(window), _prompt = window.prompt.bind(window);
window.confirm = (m) => _confirm(tr(m));
window.prompt = (m, d) => _prompt(tr(m), d);
startTranslator();

// ---------- Auth ----------
$('#discord-login').addEventListener('click', (e) => { e.preventDefault(); location.href = API + '/oauth/login'; });
if (new URLSearchParams(location.search).get('login') === 'denied') {
    $('#login-err').textContent = 'Не удалось войти. Попробуйте ещё раз.'; $('#login-err').hidden = false;
    history.replaceState(null, '', location.pathname);
}
$('#logout').addEventListener('click', async () => { await post('/logout'); location.reload(); });
async function checkAuth() { const { ok, body } = await get('/whoami'); return (ok && body?.authed === true) ? body : null; }
async function enterApp() { $('#login').hidden = true; $('#app').hidden = false; await load(); setInterval(load, 15000); }

// ---------- Data ----------
let PRICING = { buyPer100: 9, sellPer100: 10, returnRate: 0.10, minInvites: 100, minDays: 30, minDaily: 10 };
let MIN_TOPUP = 5;
function srvIcon(name, url) {
    const initial = esc((String(name || '?')[0] || '?').toUpperCase());
    return url
        ? `<img class="sw-ic" src="${esc(url)}" alt="" onerror="this.outerHTML='<span class=\\'sw-ic sw-ic-fb\\'>${initial}</span>'" />`
        : `<span class="sw-ic sw-ic-fb">${initial}</span>`;
}
async function load() {
    const me = await get('/me');
    if (me.ok) { PRICING = me.body.pricing || PRICING; if (me.body.minTopup) MIN_TOPUP = me.body.minTopup; renderAccount(me.body); }
    const sv = await get('/servers');
    if (sv.ok) { PRICING = sv.body.pricing || PRICING; renderServers(sv.body.servers || []); }
}

function renderAccount(d) {
    const a = d.account || {};
    $('#inv-balance').textContent = money(a.available);
    // how-it-works pricing
    $('#how-buy').textContent = `$${PRICING.buyPer100} за 100`;
    $('#how-sell').textContent = `$${PRICING.sellPer100} за 100`;
    $('#how-ret').textContent = `+${Math.round((PRICING.returnRate || 0.1) * 100)}%`;
    const cards = [
        { k: 'Свободно', v: money(a.available), n: 'можно вывести или вложить' },
        { k: 'Вложено сейчас', v: money(a.invested), n: `${nf(a.outstanding)} инвайтов ждут продажи` },
        { k: 'Возвращено (с +10%)', v: money(a.returned) },
        { k: 'Прибыль', v: money(a.profit), n: `${nf(a.sold)} из ${nf(a.owned)} инвайтов продано` }
    ];
    $('#inv-cards').innerHTML = cards.map((c) =>
        `<div class="pcard"><div class="k">${esc(c.k)}</div><div class="v">${c.v}</div>${c.n ? `<div class="n">${esc(c.n)}</div>` : ''}</div>`
    ).join('');
    $('#inv-withdraw').disabled = !(a.available > 0);
}

function renderServers(list) {
    if (!list.length) { $('#inv-servers').innerHTML = `<div class="muted">Пока нет серверов с достаточной активностью — нужно от ${PRICING.minDaily} проверенных заходов в сутки. Серверы появляются автоматически, как только выходят на этот темп.</div>`; return; }
    $('#inv-servers').innerHTML = list.map(serverCard).join('');
    $('#inv-servers').querySelectorAll('[data-buy]').forEach((b) => b.onclick = () => buy(b.dataset.buy, b.dataset.name, Number(b.dataset.min) || PRICING.minInvites));
}
function flowRow(f) {
    return `<div class="inv-flow muted sm">Продаётся заходов: час <b>${nf(f.hour)}</b> · день <b>${nf(f.day)}</b> · неделя <b>${nf(f.week)}</b> · всего <b>${nf(f.total)}</b></div>`;
}
function serverCard(s) {
    const name = esc(s.name || s.serverId);
    const minInv = Number(s.minInvites) || PRICING.minInvites;
    const price = `<div class="inv-price muted sm">Выкуп $${PRICING.buyPer100}/100 · продажа $${PRICING.sellPer100}/100 · возврат +${Math.round((PRICING.returnRate || 0.1) * 100)}%</div>`;
    const minLine = `<div class="inv-min muted sm">Минимум выкупа: <b>${nf(minInv)}</b> инвайтов (≈ ${PRICING.minDays} дней продаж сервера)</div>`;
    let mine = '';
    if (s.mine) {
        const m = s.mine;
        mine = `
          <div class="inv-mine">
            <div class="inv-mine-h">Ваши инвайты</div>
            <div class="inv-mine-grid">
              <span><span class="muted sm">Куплено</span> <b>${nf(m.owned)}</b></span>
              <span><span class="muted sm">Продано</span> <b>${nf(m.sold)}</b></span>
              <span><span class="muted sm">Осталось</span> <b>${nf(m.outstanding)}</b></span>
              <span><span class="muted sm">Вложено</span> <b>${money(m.invested)}</b></span>
              <span><span class="muted sm">Заработано</span> <b>${money(m.earned)}</b></span>
            </div>
            <div class="inv-mine-win muted sm">Заработано: час ${money(m.earnedWin.hour)} · день ${money(m.earnedWin.day)} · неделя ${money(m.earnedWin.week)}</div>
          </div>`;
    }
    return `
      <div class="vcard">
        <div class="vcard-head">${srvIcon(s.name, s.icon)}<span><b>${name}</b></span></div>
        ${flowRow(s.flow)}
        ${price}
        ${(s.investable !== false && !s.occupied && !s.broken && !s.brokenSince) ? minLine : ''}
        ${mine}
        <div class="vcard-actions">${serverAction(s, name, minInv)}</div>
      </div>`;
}

function fmtEta(sec) {
    sec = Math.max(0, Math.floor(Number(sec) || 0));
    const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    if (d > 0) return `${d}д ${h}ч ${m}м`;
    if (h > 0) return `${h}ч ${m}м ${s}с`;
    if (m > 0) return `${m}м ${s}с`;
    return `${s}с`;
}
function tickTimers() {
    document.querySelectorAll('.inv-timer[data-eta]').forEach((el) => {
        const ts = Number(el.dataset.eta) || 0;
        if (!ts) { el.textContent = 'скоро'; return; }
        el.textContent = '~' + fmtEta(Math.max(0, (ts - Date.now()) / 1000));
    });
}
setInterval(tickTimers, 1000);

function serverAction(s, name, minInv) {
    if (s.broken || s.brokenSince) {
        const etaTs = s.refundEtaSec ? Date.now() + s.refundEtaSec * 1000 : 0;
        const when = s.brokenSince
            ? `Если не восстановится через <b class="inv-timer" data-eta="${etaTs}">${etaTs ? '~' + fmtEta(s.refundEtaSec) : 'скоро'}</b> — вернём $${PRICING.buyPer100}/100 за непроданные инвайты на инвест-счёт.`
            : `После 24ч простоя вернём $${PRICING.buyPer100}/100 за непроданные инвайты на инвест-счёт.`;
        return `<div class="inv-broken">⚠️ Сервер сейчас не работает (нет бота или активной карточки верификации). ${when}</div>`;
    }
    if (s.occupied) {
        const etaTs = s.occupiedEtaSec ? Date.now() + s.occupiedEtaSec * 1000 : 0;
        return `<div class="inv-locked">🔒 Сервер уже занят другим инвестором, станет доступным через <b class="inv-timer" data-eta="${etaTs}">${etaTs ? '~' + fmtEta(s.occupiedEtaSec) : 'скоро'}</b></div>`;
    }
    if (s.investable === false) {
        return `<span class="muted sm">Сейчас ниже порога активности (нужно ≥ ${PRICING.minDaily} заходов/сутки) — выкуп недоступен</span>`;
    }
    return `<button class="btn primary sm" data-buy="${esc(s.serverId)}" data-name="${name}" data-min="${minInv}">Выкуп инвайтов</button>`;
}

async function buy(serverId, name, min) {
    min = Number(min) || PRICING.minInvites;
    const raw = prompt(`Сколько инвайтов выкупить?\nСервер: ${name}\nМинимум: ${nf(min)} инвайтов (≈ ${PRICING.minDays} дней продаж)\nЦена: $${PRICING.buyPer100} за 100`);
    if (raw === null) return;
    const qty = Math.floor(Number(String(raw).replace(/\s/g, '')));
    if (!Number.isFinite(qty) || qty < min) { toast(`Минимум ${nf(min)} инвайтов для этого сервера`, 'err'); return; }
    const { ok, body } = await post('/buy', { serverId, qty });
    if (ok) { toast(`Выкуплено инвайтов: ${nf(qty)} за ${money(body?.cost)}`); load(); }
    else if (body?.error === 'insufficient') toast('Недостаточно средств на инвест-счёте. Пополните счёт.', 'err');
    else if (body?.error === 'min-qty') toast(`Минимум ${nf(body?.min || min)} инвайтов для этого сервера`, 'err');
    else if (body?.error === 'occupied') toast('Сервер уже занят другим инвестором.', 'err');
    else if (body?.error === 'server-broken') toast('Сервер сейчас не работает (нет бота или карточки).', 'err');
    else if (body?.error === 'server-disabled') toast('Этот сервер больше не доступен для выкупа.', 'err');
    else toast(body?.error || 'Не удалось', 'err');
}

$('#inv-topup').onclick = async () => {
    const raw = prompt(`Сумма пополнения в $ (минимум ${MIN_TOPUP}):`);
    if (raw === null) return;
    const amount = Math.floor(Number(String(raw).replace(',', '.')) * 100) / 100;
    if (!Number.isFinite(amount) || amount <= 0) { toast('Неверное число', 'err'); return; }
    const { ok, body } = await post('/topup', { amount });
    if (ok && body?.invoiceUrl) { toast('Счёт создан. Оплатите через CryptoBot — средства зачислятся в течение минуты.'); window.open(body.invoiceUrl, '_blank', 'noopener'); }
    else toast(body?.error === 'min-topup' ? `Минимум $${MIN_TOPUP}` : body?.error === 'Оплата временно недоступна' ? 'Оплата временно недоступна' : 'Не удалось создать счёт', 'err');
};

$('#inv-withdraw').onclick = async () => {
    if (!confirm('Вывести всё свободное на баланс партнёра?')) return;
    const { ok, body } = await post('/withdraw', {});
    if (ok) { toast(`Переведено на баланс партнёра: ${money(body?.amount)}`); load(); }
    else toast(body?.error === 'nothing' ? 'Нечего выводить' : (body?.error || 'Не удалось'), 'err');
};

// ---------- Boot ----------
(async () => { if (await checkAuth()) enterApp(); })();
