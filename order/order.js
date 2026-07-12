// Buyer order panel — vanilla JS.
const API = (window.__VEMONI_API_BASE__ || '').replace(/\/+$/, '') + '/order';

// ---------- i18n ----------
const DICT = {
  ru: {
    brand: 'Vemoni · Реклама',
    login_hint: 'Войдите через Discord, чтобы заказать рекламу и следить за статистикой.',
    login_btn: 'Войти через Discord',
    login_denied: 'Не удалось войти. Попробуйте ещё раз.',
    alt_or: 'или', alt_toggle: 'Войти по коду', alt_get: 'Получить код', alt_login: 'Войти',
    alt_note: 'Для тех, кто на сервере с нашим ботом — пришлём код в личные сообщения Discord.',
    alt_sent: 'Код отправлен в личные сообщения Discord. Введите его ниже.',
    alt_nodm: 'Не удалось отправить ЛС. Проверьте, что вы на сервере с нашим ботом и что у вас открыты личные сообщения.',
    alt_badid: 'Введите корректный Discord ID.',
    alt_cooldown: (x) => `Новый код можно запросить через ${x}.`,
    alt_badcode: (n) => `Неверный код. Осталось попыток: ${n}.`,
    alt_expired: 'Код истёк — запросите новый.',
    alt_toomany: 'Слишком много попыток — запросите новый код.',
    alt_nocode: 'Сначала запросите код.',
    alt_sending: 'Отправляем…', alt_checking: 'Проверяем…',
    logout: 'Выйти',
    order_h1: 'Новый заказ',
    order_desc: 'Приведём живых участников на ваш сервер — реклама показывается в сети крупных сообществ, оплата только за подтверждённые заходы.',
    label_invite: 'Ссылка-приглашение вашего сервера',
    label_joins: 'Сколько заходов купить',
    price_label: 'Стоимость:',
    buy_btn: 'Запустить кампанию',
    nav_home: 'Главная', nav_orders: 'Покупателям', nav_partner: 'Партнёрам', nav_investor: 'Инвесторам', nav_admin: 'Администраторам',
    wallet_label: 'Баланс',
    topup_prompt: (min) => `Сумма пополнения в $ (минимум ${min}):`,
    topup_min: (min) => `Минимум $${min}`,
    topup_created: (a) => `Счёт на $${a} создан. Оплатите через CryptoBot — баланс пополнится в течение минуты:`,
    launched: 'Кампания запущена! 🎉',
    insufficient: (need) => `Недостаточно средств. Пополните ещё на $${need} и повторите.`,
    my_camps: 'Мои кампании',
    tab_active: 'Активные', tab_finished: 'Завершено',
    no_active_camps: 'Активных кампаний нет.', no_done_camps: 'Завершённых кампаний пока нет.',
    loading: 'Загрузка…',
    rate: (p) => `· $${p} за 100 заходов`,
    invite_bad: 'Вставьте корректную ссылку на Discord-сервер, например https://discord.gg/xxxx',
    invite_min: (n) => `Минимум ${n} заходов`,
    no_link: 'Укажите ссылку на сервер',
    no_conn: 'Нет связи с сервером',
    creating: 'Создаём счёт…',
    order_fail: 'Не удалось создать заказ',
    invoice_ready: (a) => `Счёт на $${a} готов. Оплатите через CryptoBot:`,
    after_pay: 'После оплаты кампания запустится автоматически (в течение минуты).',
    no_camps: 'Заказов пока нет. Оформите первый выше ↑',
    delivered: 'Доставлено:',
    retention: 'Удержание',
    pay: 'Оплатить',
    pause: 'Пауза', resume: 'Возобновить',
    servers_btn: 'Серверы показа',
    change_link: 'Сменить ссылку', save: 'Сохранить', cancel: 'Отмена',
    link_ph: 'https://discord.gg/xxxx',
    link_changed: 'Ссылка обновлена', link_same: 'Это та же ссылка',
    link_nobot: 'На новом сервере нет нашего бота — заходы не проверить. Добавьте бота и повторите.',
    link_hint: 'Новая ссылка должна работать, и на её сервере должен быть наш бот. Прогресс кампании сохранится.',
    paused_toast: 'Кампания на паузе', resumed_toast: 'Кампания возобновлена',
    srv_loading: 'Загрузка…', srv_error: 'Ошибка', srv_empty: 'Пока нет доставленных заходов по серверам.',
    disable: 'Отключить', disabled: 'Выключен',
    srv_off: 'Сервер отключён', srv_on: 'Сервер включён',
    bot_warn: 'Реклама не запустится: на вашем сервере нет нашего бота. Добавьте его — проверка заходов без него невозможна.',
    add_bot: 'Добавить бота',
    st_pending: 'Ожидает оплаты', st_active: 'Активна', st_paused: 'На паузе',
    st_complete: 'Выполнена', st_cancelled: 'Отменена', st_invalid: 'Ссылка недействительна',
    your_server: 'Ваш сервер',
    mgr_h2: 'Менеджеры по продажам',
    mgr_desc: (p, c) => `Менеджеры покупают заходы по $${p} за 100. Свою маржу (~${c}%) они забирают на сделке — покупатели платят им по розничной цене.`,
    mgr_add: 'Добавить',
    mgr_bad_id: 'Введите корректный Discord ID (17–20 цифр)',
    mgr_added: 'Менеджер добавлен', mgr_removed: 'Менеджер удалён',
    mgr_remove: 'Убрать', mgr_empty: 'Менеджеров пока нет',
    mgr_you: (p) => `Вы менеджер — ваша цена $${p} за 100 заходов.`
  },
  en: {
    brand: 'Vemoni · Ads',
    login_hint: 'Log in with Discord to order advertising and track your stats.',
    login_btn: 'Log in with Discord',
    login_denied: "Couldn't log in. Please try again.",
    alt_or: 'or', alt_toggle: 'Log in with a code', alt_get: 'Get code', alt_login: 'Log in',
    alt_note: "For members of a server with our bot — we'll DM the code to you on Discord.",
    alt_sent: 'Code sent to your Discord DMs. Enter it below.',
    alt_nodm: "Couldn't DM you. Make sure you share a server with our bot and your DMs are open.",
    alt_badid: 'Enter a valid Discord ID.',
    alt_cooldown: (x) => `You can request a new code in ${x}.`,
    alt_badcode: (n) => `Wrong code. Attempts left: ${n}.`,
    alt_expired: 'Code expired — request a new one.',
    alt_toomany: 'Too many attempts — request a new code.',
    alt_nocode: 'Request a code first.',
    alt_sending: 'Sending…', alt_checking: 'Checking…',
    logout: 'Log out',
    order_h1: 'New order',
    order_desc: 'We bring real members to your server — your ad runs across a network of large communities, and you only pay for verified stays.',
    label_invite: 'Invite link to your server',
    label_joins: 'How many stays to buy',
    price_label: 'Cost:',
    buy_btn: 'Launch campaign',
    nav_home: 'Home', nav_orders: 'For buyers', nav_partner: 'For partners', nav_investor: 'For investors', nav_admin: 'For admins',
    wallet_label: 'Balance',
    topup_prompt: (min) => `Top-up amount in $ (min ${min}):`,
    topup_min: (min) => `Minimum $${min}`,
    topup_created: (a) => `Invoice for $${a} created. Pay via CryptoBot — your balance updates within a minute:`,
    launched: 'Campaign launched! 🎉',
    insufficient: (need) => `Not enough balance. Top up $${need} more and try again.`,
    my_camps: 'My campaigns',
    tab_active: 'Active', tab_finished: 'Completed',
    no_active_camps: 'No active campaigns.', no_done_camps: 'No completed campaigns yet.',
    loading: 'Loading…',
    rate: (p) => `· $${p} per 100 stays`,
    invite_bad: 'Paste a valid Discord server invite, e.g. https://discord.gg/xxxx',
    invite_min: (n) => `Minimum ${n} stays`,
    no_link: 'Enter your server link',
    no_conn: 'No connection to the server',
    creating: 'Creating invoice…',
    order_fail: "Couldn't create the order",
    invoice_ready: (a) => `Invoice for $${a} is ready. Pay via CryptoBot:`,
    after_pay: 'The campaign starts automatically after payment (within a minute).',
    no_camps: 'No orders yet. Place your first one above ↑',
    delivered: 'Delivered:',
    retention: 'Retention',
    pay: 'Pay',
    pause: 'Pause', resume: 'Resume',
    servers_btn: 'Shown on servers',
    change_link: 'Change link', save: 'Save', cancel: 'Cancel',
    link_ph: 'https://discord.gg/xxxx',
    link_changed: 'Link updated', link_same: 'Same link as before',
    link_nobot: "Our bot isn't on the new server — stays can't be verified. Add the bot and try again.",
    link_hint: 'The new link must work and its server must have our bot. Campaign progress is preserved.',
    paused_toast: 'Campaign paused', resumed_toast: 'Campaign resumed',
    srv_loading: 'Loading…', srv_error: 'Error', srv_empty: 'No delivered stays per server yet.',
    disable: 'Disable', disabled: 'Disabled',
    srv_off: 'Server disabled', srv_on: 'Server enabled',
    bot_warn: "The ad won't run: our bot isn't on your server. Add it — stay verification is impossible without it.",
    add_bot: 'Add the bot',
    st_pending: 'Awaiting payment', st_active: 'Active', st_paused: 'Paused',
    st_complete: 'Completed', st_cancelled: 'Cancelled', st_invalid: 'Invite invalid',
    your_server: 'Your server',
    mgr_h2: 'Sales managers',
    mgr_desc: (p, c) => `Managers buy stays at $${p} per 100. They keep their margin (~${c}%) at the deal — buyers pay them the retail price.`,
    mgr_add: 'Add',
    mgr_bad_id: 'Enter a valid Discord ID (17–20 digits)',
    mgr_added: 'Manager added', mgr_removed: 'Manager removed',
    mgr_remove: 'Remove', mgr_empty: 'No managers yet',
    mgr_you: (p) => `You're a manager — your price is $${p} per 100 stays.`
  }
};
let lang = localStorage.getItem('vemoni_lang') || ((navigator.language || '').startsWith('en') ? 'en' : 'ru');
if (!DICT[lang]) lang = 'ru';
function t(key, ...args) { const v = DICT[lang][key] ?? DICT.ru[key] ?? key; return typeof v === 'function' ? v(...args) : v; }

// Map short backend error codes to localized text.
function errText(code) {
    return ({ 'bad-invite': t('invite_bad'), 'min-joins': t('invite_min', CFG.minJoins), 'invoice-failed': t('order_fail'), 'min-topup': t('topup_min', (typeof WALLET !== 'undefined' && WALLET.minTopup) || 5), 'no-bot': t('link_nobot'), 'not-active': t('order_fail') })[code] || code || t('order_fail');
}

// ---------- HTTP ----------
// Session token (localStorage) — an alternative to the cross-site cookie, which
// some browsers block as a third-party cookie. Sent as a Bearer header.
const TOKEN_KEY = 'vemoni_tok';
const getTok = () => { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; } };
const setTok = (v) => { try { v ? localStorage.setItem(TOKEN_KEY, v) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } };
// Capture a token handed back by the OAuth redirect fragment (#t=…), then clean the URL.
(() => { const m = (location.hash || '').match(/[#&]t=([^&]+)/); if (m) { try { setTok(decodeURIComponent(m[1])); } catch { /* ignore */ } history.replaceState(null, '', location.pathname + location.search); } })();

async function api(path, opts = {}) {
    let res;
    const headers = opts.body ? { 'Content-Type': 'application/json' } : {};
    const tk = getTok(); if (tk) headers.Authorization = 'Bearer ' + tk;
    try {
        res = await fetch(API + path, { credentials: 'include', ...opts, headers });
    } catch (err) { console.error('[order] fetch failed', API + path, err); throw new Error(t('no_conn')); }
    let body = null; try { body = await res.json(); } catch {}
    return { ok: res.ok, status: res.status, body };
}
const get = (p) => api(p);
const post = (p, o) => api(p, { method: 'POST', body: o ? JSON.stringify(o) : undefined });
const put = (p, o) => api(p, { method: 'PUT', body: JSON.stringify(o || {}) });

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => '$' + Number(n || 0).toFixed(2);

let toastT;
function toast(msg, kind = 'ok') { const el = $('#toast'); el.className = `toast ${kind}`; el.textContent = msg; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 3500); }

const BOT_INVITE_URL = 'https://discord.com/oauth2/authorize?client_id=1522609323090509905&permissions=2048&integration_type=0&scope=bot';
let CFG = { pricePer100: 10, minJoins: 100, botInviteUrl: BOT_INVITE_URL };
let lastCampaigns = [];

// Warning shown when the pasted server has no bot — includes a one-click invite link.
function noBotWarnHtml() {
    const url = CFG.botInviteUrl && CFG.botInviteUrl !== '#' ? CFG.botInviteUrl : BOT_INVITE_URL;
    return `<div class="err">${esc(t('link_nobot'))} <a class="btn-mini" href="${esc(url)}" target="_blank" rel="noopener">${esc(t('add_bot'))}</a></div>`;
}

// Apply translations to static [data-i18n] nodes + dynamic bits.
function applyLang() {
    document.documentElement.lang = lang;
    $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $$('.lang-switch button').forEach((b) => b.classList.toggle('active', b.dataset.lang === lang));
    $('#ord-rate').textContent = t('rate', CFG.pricePer100);
    const note = $('#mgr-note');
    if (note && CFG.isManager) note.textContent = t('mgr_you', CFG.pricePer100);
    const mgrCard = $('#mgr-card');
    if (CFG.isOwner && mgrCard && !mgrCard.hidden) loadManagers();
    if (lastCampaigns.length) renderCampaigns(lastCampaigns);
}
$$('.lang-switch button').forEach((b) => b.addEventListener('click', () => { lang = b.dataset.lang; localStorage.setItem('vemoni_lang', lang); applyLang(); }));

// ---------- Alternative login: one-time code via Discord DM ----------
(() => {
    const toggle = $('#altToggle'); if (!toggle) return;
    const body = $('#altBody'), msg = $('#altMsg'), step2 = $('#altStep2');
    const idInp = $('#altId'), codeInp = $('#altCode'), reqBtn = $('#altReq'), verBtn = $('#altVerify');
    const showMsg = (text, kind) => { msg.textContent = text || ''; msg.className = 'alt-msg ' + (kind || ''); msg.hidden = !text; };
    const fmtWait = (sec) => `${Math.max(1, Math.ceil((sec || 3600) / 60))} ${lang === 'en' ? 'min' : 'мин'}`;
    const cleanId = () => (idInp.value || '').replace(/\D/g, '').slice(0, 20);
    toggle.addEventListener('click', () => { const open = body.hidden; body.hidden = !open; toggle.classList.toggle('on', open); if (open) idInp.focus(); });
    reqBtn.addEventListener('click', async () => {
        const uid = cleanId();
        if (!/^\d{17,20}$/.test(uid)) { showMsg(t('alt_badid'), 'err'); return; }
        reqBtn.disabled = true; showMsg(t('alt_sending'), '');
        const { ok, status, body: b } = await post('/code/request', { userId: uid });
        reqBtn.disabled = false;
        if (ok) { step2.hidden = false; showMsg(t('alt_sent'), 'ok'); codeInp.focus(); return; }
        if (status === 429) showMsg(t('alt_cooldown', fmtWait(b?.retryAfterSec)), 'err');
        else if (b?.error === 'no-dm') showMsg(t('alt_nodm'), 'err');
        else showMsg(t('alt_badid'), 'err');
    });
    verBtn.addEventListener('click', async () => {
        const uid = cleanId(); const code = (codeInp.value || '').replace(/\D/g, '');
        if (!/^\d{17,20}$/.test(uid)) { showMsg(t('alt_badid'), 'err'); return; }
        verBtn.disabled = true; showMsg(t('alt_checking'), '');
        const { ok, body: b } = await post('/code/verify', { userId: uid, code });
        verBtn.disabled = false;
        if (ok) { if (b?.token) setTok(b.token); showMsg('', ''); location.reload(); return; }
        const e = b?.error;
        if (e === 'bad-code') showMsg(t('alt_badcode', b?.attemptsLeft ?? 0), 'err');
        else if (e === 'expired') showMsg(t('alt_expired'), 'err');
        else if (e === 'too-many') showMsg(t('alt_toomany'), 'err');
        else if (e === 'no-code') showMsg(t('alt_nocode'), 'err');
        else showMsg(t('alt_badid'), 'err');
    });
    idInp.addEventListener('keydown', (e) => { if (e.key === 'Enter') reqBtn.click(); });
    codeInp.addEventListener('keydown', (e) => { if (e.key === 'Enter') verBtn.click(); });
})();

// ---------- Strict invite parsing ----------
// Accepts a clean discord invite ONLY (no surrounding text). Returns the code or null.
function parseInvite(input) {
    const s = String(input || '').trim();
    const m = s.match(/^(?:https?:\/\/)?(?:www\.)?(?:discord\.gg|discord(?:app)?\.com\/invite)\/([a-z0-9-]{2,32})$/i)
        || s.match(/^([a-z0-9-]{2,32})$/i);
    return m ? m[1] : null;
}

// ---------- Auth ----------
$('#discord-login').addEventListener('click', (e) => { e.preventDefault(); location.href = API + '/oauth/login'; });
if (new URLSearchParams(location.search).get('login') === 'denied') {
    $('#login-err').textContent = t('login_denied'); $('#login-err').hidden = false;
    history.replaceState(null, '', location.pathname);
}
const setAuthed = (v) => { try { v ? localStorage.setItem('vemoni_authed', '1') : localStorage.removeItem('vemoni_authed'); } catch (_) {} };
$('#logout').addEventListener('click', async () => { await post('/logout'); setTok(''); setAuthed(false); location.reload(); });
async function checkAuth() { const { ok, body } = await get('/whoami'); return (ok && body?.authed === true) ? body : null; }
function bannerFromAvatar(url) {
    const bn = document.getElementById('nmBanner'); if (!bn || !url) return;
    const img = new Image(); img.crossOrigin = 'anonymous';
    img.onload = () => { try {
        const cv = document.createElement('canvas'); cv.width = cv.height = 16;
        const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0, 16, 16);
        const p = cx.getImageData(0, 0, 16, 16).data; let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < p.length; i += 4) { r += p[i]; g += p[i + 1]; b += p[i + 2]; n++; }
        r = (r / n) | 0; g = (g / n) | 0; b = (b / n) | 0; const dk = (v) => (v * 0.62) | 0;
        bn.style.background = 'linear-gradient(135deg,rgb(' + r + ',' + g + ',' + b + '),rgb(' + dk(r) + ',' + dk(g) + ',' + dk(b) + '))';
    } catch (_) {} };
    img.src = url;
}
function setupCabNav(who) {
    const path = location.pathname;
    document.querySelectorAll('.nav-menu [data-cn]').forEach((a) => { if (path.indexOf('/' + a.dataset.cn) === 0) a.classList.add('active'); });
    if (who && who.isAdmin) document.querySelectorAll('.nav-menu [data-cn="admin"]').forEach((a) => (a.hidden = false));
    if (who) {
        const name = who.name || who.username || 'User', letter = (String(name).trim()[0] || 'U').toUpperCase();
        const nmAv = document.getElementById('nmAv'), nmName = document.getElementById('nmName'), nmUser = document.getElementById('nmUser');
        if (nmName) nmName.textContent = name;
        if (nmUser) nmUser.textContent = who.username ? '@' + who.username : ('ID ' + (who.userId || ''));
        if (nmAv) { if (who.avatar) nmAv.style.backgroundImage = 'url("' + who.avatar + '")'; else nmAv.textContent = letter; }
        const cabAv = document.getElementById('cabAv');
        if (cabAv) { if (who.avatar) cabAv.style.backgroundImage = 'url("' + who.avatar + '")'; else cabAv.textContent = letter; }
        const nmBanner = document.getElementById('nmBanner');
        if (nmBanner && who.banner) { nmBanner.style.backgroundImage = 'url("' + who.banner + '")'; nmBanner.style.backgroundSize = 'cover'; nmBanner.style.backgroundPosition = 'center'; }
        else if (who.avatar) bannerFromAvatar(who.avatar);
    }
    const b = document.getElementById('cabBurger'), av = document.getElementById('cabAv'), menu = document.getElementById('navMenu');
    if (menu && !menu.dataset.wired) { menu.dataset.wired = '1';
        const toggle = (e) => { e.stopPropagation(); menu.hidden = !menu.hidden; };
        if (b) b.addEventListener('click', toggle);
        if (av) av.addEventListener('click', toggle);
        menu.addEventListener('click', (e) => e.stopPropagation());
        document.addEventListener('click', () => { menu.hidden = true; });
    }
}

async function enterApp() {
    setAuthed(true);
    $('#login').hidden = true; $('#app').hidden = false;
    const cfg = await get('/config'); if (cfg.ok) CFG = cfg.body;
    applyLang();
    updatePrice();
    setupManagers();
    loadWallet();
    loadCampaigns();
    // Auto-refresh, but NOT while the user has an inline panel open (change-link
    // editor or the "Shown on servers" list) — re-rendering the list rebuilds its
    // HTML and would snap the open panel shut under the user.
    setInterval(() => { if (!anyPanelOpen()) loadCampaigns(); }, 15000);
    setInterval(loadWallet, 15000);
}
function anyPanelOpen() {
    return !!document.querySelector('#camp-list [data-link-edit]:not([hidden]), #camp-list [data-srv-list]:not([hidden])');
}

// ---------- Wallet ----------
let WALLET = { balance: 0, minTopup: 5 };
async function loadWallet() {
    const { ok, body } = await get('/wallet');
    if (!ok) return;
    WALLET = body;
    $('#wallet-balance').textContent = money(body.balance);
}
$('#wallet-topup').addEventListener('click', async () => {
    const raw = prompt(t('topup_prompt', WALLET.minTopup || 5));
    if (raw === null) return;
    const amount = Math.floor(Number(String(raw).replace(',', '.')));
    if (!Number.isFinite(amount) || amount < (WALLET.minTopup || 5)) { toast(t('topup_min', WALLET.minTopup || 5), 'err'); return; }
    const { ok, body } = await post('/wallet/topup', { amount });
    if (!ok || !body?.invoiceUrl) { toast(errText(body?.error), 'err'); return; }
    $('#ord-result').innerHTML = `
      <div class="pay-box">
        <div style="margin-bottom:8px">${esc(t('topup_created', Number(body.amount).toFixed(2)))}</div>
        <a href="${esc(body.invoiceUrl)}" target="_blank" rel="noopener">${esc(body.invoiceUrl)}</a>
      </div>`;
});

// ---------- Managers (owner sees management; managers see their price note) ----------
function setupManagers() {
    const note = $('#mgr-note');
    if (note) {
        if (CFG.isManager) { note.textContent = t('mgr_you', CFG.pricePer100); note.hidden = false; }
        else note.hidden = true;
    }
    const card = $('#mgr-card');
    if (!card) return;
    if (!CFG.isOwner) { card.hidden = true; return; }
    card.hidden = false;
    loadManagers();
    const addBtn = $('#mgr-add');
    if (addBtn && !addBtn._wired) {
        addBtn._wired = true;
        addBtn.onclick = async () => {
            const id = $('#mgr-id').value.trim();
            if (!/^\d{17,20}$/.test(id)) { toast(t('mgr_bad_id'), 'err'); return; }
            const { ok, body } = await put('/managers', { userId: id });
            if (ok) { $('#mgr-id').value = ''; toast(t('mgr_added')); renderManagers(body.managers, body); }
            else toast(body?.error || 'error', 'err');
        };
    }
}

async function loadManagers() {
    const { ok, body } = await get('/managers');
    if (!ok) return;
    $('#mgr-desc').textContent = t('mgr_desc', body.pricePer100, Math.round((body.commissionRate || 0) * 100));
    renderManagers(body.managers || [], body);
}

function renderManagers(list, meta) {
    const box = $('#mgr-list');
    if (!list.length) { box.innerHTML = `<div class="muted sm">${esc(t('mgr_empty'))}</div>`; return; }
    box.innerHTML = list.map((id) =>
        `<div class="mgr-row"><span class="mgr-uid">${esc(id)}</span><button class="btn-mini off" data-mgr-del="${esc(id)}">${esc(t('mgr_remove'))}</button></div>`
    ).join('');
    box.querySelectorAll('[data-mgr-del]').forEach((b) => b.onclick = async () => {
        const { ok, body } = await put('/managers', { userId: b.dataset.mgrDel, remove: true });
        if (ok) { toast(t('mgr_removed')); renderManagers(body.managers, meta); }
        else toast(body?.error || 'error', 'err');
    });
}

// ---------- New order ----------
function updatePrice() {
    const joins = Math.max(0, Math.floor(Number($('#ord-joins').value) || 0));
    $('#ord-price').textContent = money(joins * CFG.pricePer100 / 100);
}
$('#ord-joins').addEventListener('input', updatePrice);
$('#ord-invite').addEventListener('input', () => {
    const el = $('#invite-err'); const v = $('#ord-invite').value.trim();
    if (v && !parseInvite(v)) { el.textContent = t('invite_bad'); el.hidden = false; }
    else el.hidden = true;
});

$('#ord-buy').addEventListener('click', async () => {
    const code = parseInvite($('#ord-invite').value);
    const joins = Math.floor(Number($('#ord-joins').value));
    if (!$('#ord-invite').value.trim()) { toast(t('no_link'), 'err'); return; }
    if (!code) { $('#invite-err').textContent = t('invite_bad'); $('#invite-err').hidden = false; toast(t('invite_bad'), 'err'); return; }
    if (!Number.isFinite(joins) || joins < CFG.minJoins) { toast(t('invite_min', CFG.minJoins), 'err'); return; }
    $('#ord-buy').disabled = true;
    $('#ord-result').innerHTML = `<div class="muted">${esc(t('creating'))}</div>`;
    const { ok, status, body } = await post('/create', { invite: `https://discord.gg/${code}`, joins });
    $('#ord-buy').disabled = false;
    if (status === 402 || body?.error === 'insufficient') {
        const need = Number(body?.shortfall ?? Math.max(0, (body?.price || 0) - (body?.balance || 0))).toFixed(2);
        $('#ord-result').innerHTML = `<div class="err">${esc(t('insufficient', need))}</div>`;
        loadWallet();
        return;
    }
    if (!ok || !body?.campaign) {
        if (body?.error === 'no-bot') { $('#ord-result').innerHTML = noBotWarnHtml(); return; }
        $('#ord-result').innerHTML = `<div class="err">${esc(errText(body?.error))}</div>`; return;
    }
    $('#ord-result').innerHTML = `<div class="pay-box">✅ ${esc(t('launched'))}</div>`;
    loadWallet();
    loadCampaigns();
});

// ---------- Campaigns ----------
function statusOf(c) {
    if (c.status === 'active' && c.paused) return { t: t('st_paused'), c: 'amber' };
    return ({
        pending_payment: { t: t('st_pending'), c: 'amber' },
        active: { t: t('st_active'), c: 'green' },
        complete: { t: t('st_complete'), c: 'blue' },
        cancelled: { t: t('st_cancelled'), c: 'red' },
        invalid: { t: t('st_invalid'), c: 'red' }
    })[c.status] || { t: c.status, c: '' };
}

async function loadCampaigns() {
    const { ok, body } = await get('/campaigns');
    if (!ok) return;
    lastCampaigns = body.campaigns || [];
    renderCampaigns(lastCampaigns);
}

let campTab = 'active';
function renderCampaigns(list) {
    const tabs = $('#camp-tabs');
    const box = $('#camp-list');
    if (!list.length) { if (tabs) tabs.hidden = true; box.innerHTML = `<div class="muted">${esc(t('no_camps'))}</div>`; return; }

    // Split into running (active/paused) and finished (completed/cancelled/invalid).
    const active = list.filter((c) => c.status === 'active');
    const finished = list.filter((c) => c.status !== 'active');
    if (campTab === 'finished' && !finished.length) campTab = 'active';

    if (tabs) {
        tabs.hidden = false;
        const btn = (key, id, n) => `<button data-camptab="${id}" class="${campTab === id ? 'active' : ''}">${esc(t(key))} <span class="cnt">${n}</span></button>`;
        tabs.innerHTML = btn('tab_active', 'active', active.length) + btn('tab_finished', 'finished', finished.length);
        tabs.querySelectorAll('[data-camptab]').forEach((b) => b.onclick = () => { campTab = b.dataset.camptab; renderCampaigns(lastCampaigns); });
    }

    const shown = campTab === 'finished' ? finished : active;
    if (!shown.length) { box.innerHTML = `<div class="muted">${esc(campTab === 'finished' ? t('no_done_camps') : t('no_active_camps'))}</div>`; return; }
    box.innerHTML = shown.map(campCard).join('');
    wireCampaigns(shown);
}

function retentionRow(r) {
    if (!r || (r.d1 == null && r.d7 == null && r.d30 == null)) return '';
    const c = (v) => v == null ? '—' : `${v}%`;
    return `<div class="camp-ret muted sm">${esc(t('retention'))}: 1д ${c(r.d1)} · 7д ${c(r.d7)} · 30д ${c(r.d30)}</div>`;
}
function campCard(c) {
    const st = statusOf(c);
    const pct = c.purchased ? Math.min(100, Math.round(c.delivered / c.purchased * 100)) : 0;
    const payLink = c.status === 'pending_payment' && c.invoiceUrl
        ? `<a class="btn-mini" href="${esc(c.invoiceUrl)}" target="_blank" rel="noopener">${esc(t('pay'))}</a>` : '';
    const needBot = c.botPresent === false && c.status !== 'complete' && c.status !== 'cancelled';
    const botWarn = needBot ? `
        <div class="warn">
          ⚠️ ${esc(t('bot_warn'))}
          <a class="btn-mini" href="${esc(CFG.botInviteUrl || '#')}" target="_blank" rel="noopener">${esc(t('add_bot'))}</a>
        </div>` : '';
    const canManage = c.status === 'active';
    const pauseBtn = canManage ? `<button class="btn-mini ${c.paused ? 'off' : 'on'}" data-pause="${c.id}">${esc(c.paused ? t('resume') : t('pause'))}</button>` : '';
    const linkBtn = canManage ? `<button class="btn-mini" data-editlink="${c.id}">${esc(t('change_link'))}</button>` : '';
    const srvBtn = (c.status === 'active' || c.status === 'complete') ? `<button class="btn-mini" data-servers="${c.id}">${esc(t('servers_btn'))}</button>` : '';
    return `
      <div class="camp" data-id="${c.id}">
        <div class="camp-head">
          <div>
            <div class="camp-title">${esc(c.serverName || t('your_server'))}</div>
            <div class="camp-sub">${esc(c.invite)}</div>
          </div>
          <span class="chip ${st.c}">${esc(st.t)}</span>
        </div>
        ${botWarn}
        <div class="progress"><i style="width:${pct}%"></i></div>
        <div class="camp-nums"><span>${esc(t('delivered'))} <b>${c.delivered}</b> / ${c.purchased}</span><span>${money(c.price)}</span></div>
        ${retentionRow(c.retention)}
        <div class="camp-actions">${payLink}${pauseBtn}${linkBtn}${srvBtn}</div>
        <div class="link-edit" data-link-edit="${c.id}" hidden>
          <input type="text" class="link-input" data-link-input="${c.id}" value="${esc(c.invite)}" placeholder="${esc(t('link_ph'))}" />
          <div class="link-row">
            <button class="btn-mini on" data-link-save="${c.id}">${esc(t('save'))}</button>
            <button class="btn-mini" data-link-cancel="${c.id}">${esc(t('cancel'))}</button>
          </div>
          <div class="link-hint muted sm">${esc(t('link_hint'))}</div>
        </div>
        <div class="srv-list" data-srv-list="${c.id}" hidden></div>
      </div>`;
}

function wireCampaigns(list) {
    $$('#camp-list [data-pause]').forEach((b) => b.onclick = async () => {
        const c = list.find((x) => x.id === b.dataset.pause);
        const { ok } = await post(`/campaigns/${b.dataset.pause}/pause`, { paused: !c.paused });
        if (ok) { toast(!c.paused ? t('paused_toast') : t('resumed_toast')); loadCampaigns(); }
    });
    // Change the invite link mid-flight — toggle inline editor, then save.
    $$('#camp-list [data-editlink]').forEach((b) => b.onclick = () => {
        const box = $(`[data-link-edit="${b.dataset.editlink}"]`);
        if (!box) return;
        box.hidden = !box.hidden;
        if (!box.hidden) $(`[data-link-input="${b.dataset.editlink}"]`)?.focus();
    });
    $$('#camp-list [data-link-cancel]').forEach((b) => b.onclick = () => {
        const box = $(`[data-link-edit="${b.dataset.linkCancel}"]`); if (box) box.hidden = true;
    });
    $$('#camp-list [data-link-save]').forEach((b) => b.onclick = async () => {
        const id = b.dataset.linkSave;
        const input = $(`[data-link-input="${id}"]`);
        const val = (input?.value || '').trim();
        const code = parseInvite(val);
        if (!code) { toast(t('invite_bad'), 'err'); return; }
        const cur = list.find((x) => x.id === id);
        if (cur && `https://discord.gg/${code}` === cur.invite) { toast(t('link_same')); return; }
        b.disabled = true;
        const { ok, body } = await put(`/campaigns/${id}/invite`, { invite: `https://discord.gg/${code}` });
        b.disabled = false;
        if (ok) { toast(t('link_changed')); loadCampaigns(); }
        else if (body?.error === 'no-bot') {
            const box = $(`[data-link-edit="${id}"]`);
            if (box) {
                let w = box.querySelector('.nobot-w');
                if (!w) { w = document.createElement('div'); w.className = 'nobot-w'; box.appendChild(w); }
                w.innerHTML = noBotWarnHtml();
            }
            toast(t('link_nobot'), 'err');
        }
        else toast(errText(body?.error), 'err');
    });
    $$('#camp-list [data-servers]').forEach((b) => b.onclick = async () => {
        const id = b.dataset.servers; const box = $(`[data-srv-list="${id}"]`);
        if (!box.hidden) { box.hidden = true; return; }
        box.hidden = false; box.innerHTML = `<div class="muted sm">${esc(t('srv_loading'))}</div>`;
        const { ok, body } = await get(`/campaigns/${id}/servers`);
        if (!ok) { box.innerHTML = `<div class="err sm">${esc(t('srv_error'))}</div>`; return; }
        const servers = body.servers || [];
        box.innerHTML = servers.length ? servers.map((s) => srvRow(id, s)).join('') : `<div class="muted sm">${esc(t('srv_empty'))}</div>`;
        box.querySelectorAll('[data-toggle]').forEach((btn) => btn.onclick = async () => {
            const disable = btn.dataset.state === 'on';
            const { ok } = await put(`/campaigns/${id}/server`, { gid: btn.dataset.toggle, disabled: disable });
            if (ok) { toast(disable ? t('srv_off') : t('srv_on')); b.click(); b.click(); }
        });
    });
}

function srvRow(campId, s) {
    const ic = s.icon
        ? `<img class="srv-ic" src="${esc(s.icon)}" alt="" onerror="this.outerHTML='<span class=\\'srv-ic srv-ic-fb\\'>${esc((s.name || '?')[0].toUpperCase())}</span>'" />`
        : `<span class="srv-ic srv-ic-fb">${esc((s.name || '?')[0].toUpperCase())}</span>`;
    const btn = s.disabled
        ? `<button class="btn-mini off" data-toggle="${s.gid}" data-state="off">${esc(t('disabled'))}</button>`
        : `<button class="btn-mini" data-toggle="${s.gid}" data-state="on">${esc(t('disable'))}</button>`;
    return `<div class="srv-row">${ic}<span class="srv-name">${esc(s.name || 'Server')} </span><span class="srv-count">${s.count}</span>${btn}</div>`;
}

// ---------- Boot ----------
applyLang();
(async () => {
    const who = await checkAuth();
    if (who) { enterApp(); setupCabNav(who); }
    else { setAuthed(false); document.documentElement.classList.remove('pre-auth'); $('#login').hidden = false; $('#app').hidden = true; }
})();
