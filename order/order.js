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
    nav_home: 'Главная', nav_orders: 'Покупателям', nav_myorders: 'Мои заказы', nav_partner: 'Партнёрам', nav_investor: 'Инвесторам', nav_admin: 'Администраторам',
    wallet_label: 'Баланс',
    topup_prompt: (min) => `Сумма пополнения в $ (минимум ${min})`,
    topup_title: 'Пополнение баланса', topup_ok: 'Пополнить',
    topup_min: (min) => `Минимум $${min}`,
    topup_created: (a) => `Счёт на $${a} создан. Оплатите через CryptoBot — баланс пополнится в течение минуты:`,
    topup_created_web: (a) => `Счёт на $${a} создан. Оплатите с любого криптокошелька — баланс пополнится после подтверждения сети:`,
    topup_choose: (a) => `Пополнение на $${a}. Выберите способ оплаты:`,
    pay_web: 'Крипта (любой кошелёк)', pay_tg: 'CryptoBot (Telegram)', pay_open: 'Открыть оплату', pay_unavail: 'Оплата временно недоступна',
    pay_other: '‹ Другой способ оплаты',
    launched: 'Кампания запущена! 🎉',
    insufficient: (need) => `Недостаточно средств. Пополните ещё на $${need} и повторите.`,
    my_camps: 'Мои кампании',
    tab_active: 'Активные', tab_paused: 'На паузе', tab_finished: 'Завершено',
    tab_all: 'Все заказы', tab_all_done: 'Все завершённые',
    no_all_camps: 'Активных заказов в сети нет.', no_all_done: 'Завершённых заказов нет.',
    q_showing: 'Показывается', q_waiting: (p, tot) => `Место в очереди №${p} из ${tot}`, q_nobot: 'Ждёт бота',
    q_verifier_off: 'Проверка недоступна',
    st_verifier_off: 'Проверка недоступна',
    autopause_warn: 'Кампания на паузе: на вашем сервере больше некому проверять заходы (наш чекер выгнан/забанен или потерял доступ). Верните бота — показ возобновится автоматически. Пока на паузе списаний нет.',
    by_buyer: 'Заказчик:',
    no_active_camps: 'Активных кампаний нет.', no_paused_camps: 'Кампаний на паузе нет.', no_done_camps: 'Завершённых кампаний пока нет.',
    loading: 'Загрузка…', load_error: 'Не удалось загрузить заказы.', retry: 'Повторить',
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
    limit_label: 'Лимит заходов на эту ссылку (необязательно)',
    limit_ph: 'напр. 100 — пусто = без лимита',
    limit_hint: 'По достижении лимита показ встанет на стоп, пока не продолжишь вручную (с той же или новой ссылкой). Пусто — без ограничения, до конца кампании.',
    resume_limit: 'Продолжить',
    st_limit: 'Стоп: лимит', relimit_toast: 'Показ возобновлён', limit_bad: 'Лимит должен быть целым числом больше 0',
    load_warn: 'Высокая загруженность сети — выполнение заказов может занять более суток.',
    link_changed: 'Ссылка обновлена', link_same: 'Это та же ссылка',
    link_nobot: 'На новом сервере нет нашего бота — заходы не проверить. Добавьте бота и повторите.',
    link_hint: 'Новая ссылка должна работать, и на её сервере должен быть наш бот. Прогресс кампании сохранится.',
    paused_toast: 'Кампания на паузе', resumed_toast: 'Кампания возобновлена',
    pin: 'В приоритет', unpin: 'Снять приоритет', pinned: 'Приоритет', pinned_toast: 'Приоритет установлен — заказ показывается первым', unpinned_toast: 'Приоритет снят',
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
    mgr_you: (p) => `Вы менеджер — ваша цена $${p} за 100 заходов.`,
    dma_h: 'Доступ к DMALL',
    dma_desc: 'Пользователи с этими Discord ID получают доступ к разделу DMALL.',
    dma_add: 'Добавить',
    dma_added: 'Доступ выдан', dma_removed: 'Доступ отозван',
    dma_remove: 'Убрать', dma_empty: 'Пока никому не выдан'
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
    nav_home: 'Home', nav_orders: 'For buyers', nav_myorders: 'My orders', nav_partner: 'For partners', nav_investor: 'For investors', nav_admin: 'For admins',
    wallet_label: 'Balance',
    topup_prompt: (min) => `Top-up amount in $ (min ${min})`,
    topup_title: 'Top up balance', topup_ok: 'Top up',
    topup_min: (min) => `Minimum $${min}`,
    topup_created: (a) => `Invoice for $${a} created. Pay via CryptoBot — your balance updates within a minute:`,
    topup_created_web: (a) => `Invoice for $${a} created. Pay from any crypto wallet — your balance updates after network confirmation:`,
    topup_choose: (a) => `Top-up of $${a}. Choose a payment method:`,
    pay_web: 'Crypto (any wallet)', pay_tg: 'CryptoBot (Telegram)', pay_open: 'Open payment', pay_unavail: 'Payment is temporarily unavailable',
    pay_other: '‹ Other payment method',
    launched: 'Campaign launched! 🎉',
    insufficient: (need) => `Not enough balance. Top up $${need} more and try again.`,
    my_camps: 'My campaigns',
    tab_active: 'Active', tab_paused: 'Paused', tab_finished: 'Completed',
    tab_all: 'All orders', tab_all_done: 'All completed',
    no_all_camps: 'No active orders on the network.', no_all_done: 'No completed orders.',
    q_showing: 'Showing', q_waiting: (p, tot) => `Queue position #${p} of ${tot}`, q_nobot: 'Waiting for bot',
    q_verifier_off: 'Checker offline',
    st_verifier_off: 'Checker offline',
    autopause_warn: 'Campaign paused: joins can no longer be verified on your server (our checker was kicked/banned or lost access). Add our bot back — delivery resumes automatically. No charges while paused.',
    by_buyer: 'Buyer:',
    no_active_camps: 'No active campaigns.', no_paused_camps: 'No paused campaigns.', no_done_camps: 'No completed campaigns yet.',
    loading: 'Loading…', load_error: 'Could not load your orders.', retry: 'Retry',
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
    limit_label: 'Join limit for this link (optional)',
    limit_ph: 'e.g. 100 — empty = no limit',
    limit_hint: 'When the limit is reached, delivery stops until you resume manually (with the same or a new link). Empty — no cap, runs to the end of the campaign.',
    resume_limit: 'Resume',
    st_limit: 'Stopped: limit', relimit_toast: 'Delivery resumed', limit_bad: 'Limit must be a whole number greater than 0',
    load_warn: 'High network load — orders may take more than 24 hours to complete.',
    link_changed: 'Link updated', link_same: 'Same link as before',
    link_nobot: "Our bot isn't on the new server — stays can't be verified. Add the bot and try again.",
    link_hint: 'The new link must work and its server must have our bot. Campaign progress is preserved.',
    paused_toast: 'Campaign paused', resumed_toast: 'Campaign resumed',
    pin: 'Prioritize', unpin: 'Unpin', pinned: 'Priority', pinned_toast: 'Priority set — this order shows first', unpinned_toast: 'Priority cleared',
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
    mgr_you: (p) => `You're a manager — your price is $${p} per 100 stays.`,
    dma_h: 'DMALL access',
    dma_desc: 'Users with these Discord IDs get access to the DMALL section.',
    dma_add: 'Add',
    dma_added: 'Access granted', dma_removed: 'Access revoked',
    dma_remove: 'Remove', dma_empty: 'No one yet'
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
let CFG = { pricePer100: 10, minJoins: 1, botInviteUrl: BOT_INVITE_URL };
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
    if (lastCampaigns.length || adminActive.length || adminDone.length) renderCampaigns();
    renderTopup();
    renderLoadBanner();
}

// Thin warning strip: the whole order book would take over a day to deliver at
// the network's recent throughput.
function renderLoadBanner() {
    const el = $('#load-banner'); if (!el) return;
    const on = Boolean(CFG.networkLoad && CFG.networkLoad.overloaded);
    el.hidden = !on;
    if (on) el.innerHTML = `<span class="lb-ico">⚠️</span><span>${esc(t('load_warn'))}</span>`;
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
    if (who && (who.isAdmin || who.isOwner || who.dmall)) { const mb = document.getElementById('dm-modebar'); if (mb) mb.hidden = false; }
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
    setupDmallAccess();
    loadWallet();
    loadCampaigns();
    // Admins/owners: prime the "all orders" counts so the extra tabs show numbers
    // before they're opened.
    if (isAdminView()) { loadAdminCampaigns('active'); loadAdminCampaigns('done'); }
    // Auto-refresh the visible tab, but NOT while the user has an inline panel open
    // (change-link editor / "Shown on servers" list) — re-rendering rebuilds the
    // HTML and would snap the open panel shut. 8s keeps the queue badges live.
    setInterval(() => { if (!anyPanelOpen() && !document.hidden) reloadCurrentTab(); }, 8000);
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
// The top-up payment box is transient and re-rendered on language switch, so its
// state lives here and renderTopup() rebuilds it from the current language.
let topupState = null;
function renderTopup() {
    const box = $('#ord-result');
    if (!box || !topupState) return;
    if (topupState.mode === 'created') {
        box.innerHTML = `
      <div class="pay-box">
        <div style="margin-bottom:8px">${esc(t(topupState.web ? 'topup_created_web' : 'topup_created', topupState.amount.toFixed(2)))}</div>
        <a class="btn primary" href="${esc(topupState.invoiceUrl)}" target="_blank" rel="noopener">${esc(t('pay_open'))}</a>
        <div class="muted sm" style="margin-top:8px;word-break:break-all">${esc(topupState.invoiceUrl)}</div>
      </div>`;
    }
}

// Custom amount modal (replaces the browser prompt). Resolves to a number or null.
function askAmount(min) {
    return new Promise((resolve) => {
        let overlay = $('#tp-modal');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'tp-modal';
            overlay.className = 'tp-overlay';
            overlay.hidden = true;
            overlay.innerHTML =
                '<div class="tp-modal" role="dialog" aria-modal="true">' +
                    '<h3 id="tp-title"></h3>' +
                    '<label id="tp-label" for="tp-input"></label>' +
                    '<input id="tp-input" type="number" step="1" inputmode="numeric" autocomplete="off" />' +
                    '<div class="tp-err" id="tp-err" hidden></div>' +
                    '<div class="tp-actions"><button type="button" class="btn ghost" id="tp-cancel"></button><button type="button" class="btn primary" id="tp-ok"></button></div>' +
                '</div>';
            document.body.appendChild(overlay);
        }
        const input = $('#tp-input'), err = $('#tp-err');
        $('#tp-title').textContent = t('topup_title');
        $('#tp-label').textContent = t('topup_prompt', min);
        $('#tp-cancel').textContent = t('cancel');
        $('#tp-ok').textContent = t('topup_ok');
        input.min = min; input.value = ''; err.hidden = true;
        overlay.hidden = false;
        setTimeout(() => input.focus(), 30);

        function cleanup() { document.removeEventListener('keydown', onKey); overlay.removeEventListener('mousedown', onOverlay); }
        const close = (val) => { overlay.hidden = true; cleanup(); resolve(val); };
        const submit = () => {
            const amount = Math.floor(Number(String(input.value).replace(',', '.')));
            if (!Number.isFinite(amount) || amount < min) { err.textContent = t('topup_min', min); err.hidden = false; input.focus(); return; }
            close(amount);
        };
        const onKey = (e) => { if (e.key === 'Escape') close(null); else if (e.key === 'Enter') { e.preventDefault(); submit(); } };
        const onOverlay = (e) => { if (e.target === overlay) close(null); };
        $('#tp-ok').onclick = submit;
        $('#tp-cancel').onclick = () => close(null);
        document.addEventListener('keydown', onKey);
        overlay.addEventListener('mousedown', onOverlay);
    });
}
$('#wallet-topup').addEventListener('click', async () => {
    const web = WALLET.cryptoWebEnabled, tg = WALLET.cryptoEnabled;
    if (!web && !tg) { toast(t('pay_unavail'), 'err'); return; }
    const amount = await askAmount(WALLET.minTopup || 5);
    if (amount == null) return;
    // Straight to the LTC (any-wallet crypto) invoice; fall back to CryptoBot only if web is off.
    return startTopup(web ? '/wallet/topup/web' : '/wallet/topup', amount);
});
async function startTopup(path, amount) {
    const { ok, body } = await post(path, { amount });
    if (!ok || !body?.invoiceUrl) { toast(errText(body?.error), 'err'); return; }
    topupState = { mode: 'created', amount: Number(body.amount), web: path !== '/wallet/topup', invoiceUrl: body.invoiceUrl };
    renderTopup();
    try { window.open(body.invoiceUrl, '_blank', 'noopener'); } catch (_) {}
}

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

// ---------- DMALL access (owner grants users access to the DMALL console) ----------
function setupDmallAccess() {
    const card = $('#dm-access-card');
    if (!card) return;
    if (!CFG.isOwner) { card.hidden = true; return; }
    card.hidden = false;
    loadDmallAccess();
    const addBtn = $('#dm-access-add');
    if (addBtn && !addBtn._wired) {
        addBtn._wired = true;
        addBtn.onclick = async () => {
            const id = $('#dm-access-id').value.trim();
            if (!/^\d{17,20}$/.test(id)) { toast(t('mgr_bad_id'), 'err'); return; }
            const { ok, body } = await put('/dmall-access', { userId: id });
            if (ok) { $('#dm-access-id').value = ''; toast(t('dma_added')); renderDmallAccess(body.users); }
            else toast(body?.error || 'error', 'err');
        };
    }
}
async function loadDmallAccess() {
    const { ok, body } = await get('/dmall-access');
    if (!ok) return;
    renderDmallAccess(body.users || []);
}
function renderDmallAccess(list) {
    const box = $('#dm-access-list');
    if (!box) return;
    if (!list.length) { box.innerHTML = `<div class="dma-empty">${esc(t('dma_empty'))}</div>`; return; }
    box.innerHTML = list.map((id) =>
        `<div class="dma-row"><span class="dma-uid">${esc(id)}</span><button class="dm-btn danger sm" data-dma-del="${esc(id)}">${esc(t('dma_remove'))}</button></div>`
    ).join('');
    box.querySelectorAll('[data-dma-del]').forEach((b) => b.onclick = async () => {
        const { ok, body } = await put('/dmall-access', { userId: b.dataset.dmaDel, remove: true });
        if (ok) { toast(t('dma_removed')); renderDmallAccess(body.users); }
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
    if (c.status === 'active' && c.autoPaused) return { t: t('st_verifier_off'), c: 'red' };
    if (c.status === 'active' && c.paused) return { t: t('st_paused'), c: 'amber' };
    if (c.status === 'active' && c.limitReached) return { t: t('st_limit'), c: 'amber' };
    return ({
        pending_payment: { t: t('st_pending'), c: 'amber' },
        active: { t: t('st_active'), c: 'green' },
        complete: { t: t('st_complete'), c: 'blue' },
        cancelled: { t: t('st_cancelled'), c: 'red' },
        invalid: { t: t('st_invalid'), c: 'red' }
    })[c.status] || { t: c.status, c: '' };
}

let adminActive = [], adminDone = [];
// Owner, assigned admins AND sales managers get the two "all orders" views —
// that's where the service-side priority pin is set.
const isAdminView = () => Boolean(CFG.isAdmin || CFG.isOwner || CFG.isManager);

async function loadCampaigns() {
    let ok = false, body = null;
    try { ({ ok, body } = await get('/campaigns')); } catch { ok = false; }
    // Never leave the list stuck on "Загрузка…": on failure show a retry, unless
    // we already have data (a transient poll error shouldn't wipe the list).
    if (!ok) { if (!lastCampaigns.length) showCampError(); return; }
    lastCampaigns = body.campaigns || [];
    renderCampaigns();
}
// Admin/owner: every buyer's orders (scope 'active' | 'done').
async function loadAdminCampaigns(scope) {
    let ok = false, body = null;
    try { ({ ok, body } = await get('/all-campaigns?scope=' + scope)); } catch { ok = false; }
    if (!ok) { if (!adminActive.length && !adminDone.length) showCampError(); return; }
    if (scope === 'done') adminDone = body.campaigns || []; else adminActive = body.campaigns || [];
    renderCampaigns();
}
// A load error placeholder with a retry button (so a slow/failed fetch never
// looks like an eternal spinner).
function showCampError() {
    const box = $('#camp-list'); if (!box) return;
    box.innerHTML = `<div class="muted">${esc(t('load_error'))} <button class="btn-mini" id="camp-retry">${esc(t('retry'))}</button></div>`;
    const r = $('#camp-retry'); if (r) r.onclick = () => { box.innerHTML = `<div class="muted">${esc(t('loading'))}</div>`; reloadCurrentTab(); };
}
// Refresh whatever the visible tab shows — used by the real-time poll and after edits.
function reloadCurrentTab() {
    if (campTab === 'all') return loadAdminCampaigns('active');
    if (campTab === 'all-done') return loadAdminCampaigns('done');
    return loadCampaigns();
}

let campTab = 'active';
let campPage = 1;
const CAMP_PAGE_SIZE = 10;
function campPagerHtml(pages, cur) {
    if (pages <= 1) return '';
    return `<div class="camp-pager"><button class="cp-nav" data-camppage="${cur - 1}" ${cur <= 1 ? 'disabled' : ''}>‹</button><span class="cp-info">${cur} / ${pages}</span><button class="cp-nav" data-camppage="${cur + 1}" ${cur >= pages ? 'disabled' : ''}>›</button></div>`;
}
function renderCampaigns() {
    const tabs = $('#camp-tabs');
    const box = $('#camp-list');
    const admin = isAdminView();
    const running = lastCampaigns.filter((c) => c.status === 'active' && !c.paused);
    const paused = lastCampaigns.filter((c) => c.status === 'active' && c.paused);
    const finished = lastCampaigns.filter((c) => c.status !== 'active');

    // A non-admin with no orders at all: the simple empty state, no tabs.
    if (!admin && !lastCampaigns.length) { if (tabs) tabs.hidden = true; box.innerHTML = `<div class="muted">${esc(t('no_camps'))}</div>`; return; }
    if ((campTab === 'all' || campTab === 'all-done') && !admin) campTab = 'active';
    if (campTab === 'finished' && !finished.length && !admin) campTab = 'active';

    if (tabs) {
        tabs.hidden = false;
        const btn = (key, id, n) => `<button data-camptab="${id}" class="${campTab === id ? 'active' : ''}">${esc(t(key))} <span class="cnt">${n}</span></button>`;
        let html = btn('tab_active', 'active', running.length) + btn('tab_paused', 'paused', paused.length) + btn('tab_finished', 'finished', finished.length);
        if (admin) html += btn('tab_all', 'all', adminActive.length) + btn('tab_all_done', 'all-done', adminDone.length);
        tabs.innerHTML = html;
        tabs.querySelectorAll('[data-camptab]').forEach((b) => b.onclick = () => {
            campTab = b.dataset.camptab;
            campPage = 1;
            if (campTab === 'all') loadAdminCampaigns('active');
            else if (campTab === 'all-done') loadAdminCampaigns('done');
            else renderCampaigns();
        });
    }

    const shown = campTab === 'all' ? adminActive
        : campTab === 'all-done' ? adminDone
        : campTab === 'finished' ? finished
        : campTab === 'paused' ? paused : running;
    if (!shown.length) {
        const empty = campTab === 'all' ? t('no_all_camps') : campTab === 'all-done' ? t('no_all_done')
            : campTab === 'finished' ? t('no_done_camps') : campTab === 'paused' ? t('no_paused_camps') : t('no_active_camps');
        box.innerHTML = `<div class="muted">${esc(empty)}</div>`;
        return;
    }
    const pages = Math.max(1, Math.ceil(shown.length / CAMP_PAGE_SIZE));
    if (campPage > pages) campPage = pages;
    const pageItems = shown.slice((campPage - 1) * CAMP_PAGE_SIZE, campPage * CAMP_PAGE_SIZE);
    box.innerHTML = pageItems.map(campCard).join('') + campPagerHtml(pages, campPage);
    wireCampaigns(pageItems);
    box.querySelectorAll('[data-camppage]').forEach((b) => b.onclick = () => {
        const p = +b.dataset.camppage;
        if (p >= 1 && p <= pages && p !== campPage) { campPage = p; renderCampaigns(); window.scrollTo({ top: box.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' }); }
    });
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
    const botWarn = c.autoPaused ? `
        <div class="warn">
          ⚠️ ${esc(t('autopause_warn'))}
          <a class="btn-mini" href="${esc(CFG.botInviteUrl || '#')}" target="_blank" rel="noopener">${esc(t('add_bot'))}</a>
        </div>`
        : needBot ? `
        <div class="warn">
          ⚠️ ${esc(t('bot_warn'))}
          <a class="btn-mini" href="${esc(CFG.botInviteUrl || '#')}" target="_blank" rel="noopener">${esc(t('add_bot'))}</a>
        </div>` : '';
    const canManage = c.status === 'active';
    const pauseBtn = canManage ? `<button class="btn-mini ${c.paused ? 'off' : 'on'}" data-pause="${c.id}">${esc(c.paused ? t('resume') : t('pause'))}</button>` : '';
    const resumeLimitBtn = (canManage && c.limitReached && !c.paused) ? `<button class="btn-mini on" data-resumelimit="${c.id}">${esc(t('resume_limit'))}</button>` : '';
    const linkBtn = canManage ? `<button class="btn-mini" data-editlink="${c.id}">${esc(t('change_link'))}</button>` : '';
    const srvBtn = (c.status === 'active' || c.status === 'complete') ? `<button class="btn-mini" data-servers="${c.id}">${esc(t('servers_btn'))}</button>` : '';
    // Service priority pin (only in the "all orders" staff view, active orders):
    // pins one campaign to the front of the queue network-wide. Partner per-server
    // pins still override it in delivery.
    const prioBtn = (c.admin && c.status === 'active')
        ? `<button class="btn-mini ${c.pinned ? 'on' : ''}" data-prio="${c.id}" data-pinned="${c.pinned ? '1' : '0'}">${c.pinned ? '★ ' + esc(t('unpin')) : '☆ ' + esc(t('pin'))}</button>`
        : '';
    const limitCounter = c.linkLimit ? `<div class="camp-linklimit${c.limitReached ? ' reached' : ''}">${c.linkDelivered}/${c.linkLimit}</div>` : '';
    // Live queue badge: is this order being shown in verifications now, or waiting.
    const q = c.queue;
    let queueBadge = '';
    if (q && q.state === 'showing') queueBadge = `<span class="qbadge showing"><span class="qdot"></span>${esc(t('q_showing'))}</span>`;
    else if (q && q.state === 'waiting') queueBadge = `<span class="qbadge waiting"><span class="qdot"></span>${esc(t('q_waiting', q.position, q.total))}</span>`;
    else if (q && q.state === 'no_bot') queueBadge = `<span class="qbadge nobot"><span class="qdot"></span>${esc(t('q_nobot'))}</span>`;
    else if (q && q.state === 'verifier_off') queueBadge = `<span class="qbadge nobot"><span class="qdot"></span>${esc(t('q_verifier_off'))}</span>`;
    // Admin view only: who the order belongs to.
    const buyerRow = c.admin ? `<div class="camp-buyer muted sm">${esc(t('by_buyer'))} <b>${esc(c.buyerName || c.buyerId || '—')}</b></div>` : '';
    return `
      <div class="camp" data-id="${c.id}">
        <div class="camp-head">
          <div>
            <div class="camp-title">${esc(c.serverName || t('your_server'))}</div>
            <div class="camp-sub">${esc(c.invite)}</div>
            ${limitCounter}
            ${buyerRow}
          </div>
          <span class="camp-chips">${c.pinned ? `<span class="chip pin">★ ${esc(t('pinned'))}</span>` : ''}${queueBadge}<span class="chip ${st.c}">${esc(st.t)}</span></span>
        </div>
        ${botWarn}
        <div class="progress"><i style="width:${pct}%"></i></div>
        <div class="camp-nums"><span>${esc(t('delivered'))} <b>${c.delivered}</b> / ${c.purchased}</span><span>${money(c.price)}</span></div>
        ${retentionRow(c.retention)}
        <div class="camp-actions">${payLink}${prioBtn}${pauseBtn}${resumeLimitBtn}${linkBtn}${srvBtn}</div>
        <div class="link-edit" data-link-edit="${c.id}" hidden>
          <input type="text" class="link-input" data-link-input="${c.id}" value="${esc(c.invite)}" placeholder="${esc(t('link_ph'))}" />
          <label class="limit-label muted sm">${esc(t('limit_label'))}</label>
          <input type="number" min="1" step="1" class="link-input limit-input" data-limit-input="${c.id}" value="${c.linkLimit || ''}" placeholder="${esc(t('limit_ph'))}" />
          <div class="link-row">
            <button class="btn-mini on" data-link-save="${c.id}">${esc(t('save'))}</button>
            <button class="btn-mini" data-link-cancel="${c.id}">${esc(t('cancel'))}</button>
          </div>
          <div class="link-hint muted sm">${esc(t('link_hint'))}</div>
          <div class="link-hint muted sm">${esc(t('limit_hint'))}</div>
        </div>
        <div class="srv-list" data-srv-list="${c.id}" hidden></div>
      </div>`;
}

function wireCampaigns(list) {
    $$('#camp-list [data-pause]').forEach((b) => b.onclick = async () => {
        const c = list.find((x) => x.id === b.dataset.pause);
        const { ok } = await post(`/campaigns/${b.dataset.pause}/pause`, { paused: !c.paused });
        if (ok) { toast(!c.paused ? t('paused_toast') : t('resumed_toast')); reloadCurrentTab(); }
    });
    // Service priority pin (staff, all-orders view): toggle this campaign as the
    // global front-of-queue pin. Sending an empty id clears the pin.
    $$('#camp-list [data-prio]').forEach((b) => b.onclick = async () => {
        const pinned = b.dataset.pinned === '1';
        b.disabled = true;
        const { ok, body } = await put('/priority', { campaignId: pinned ? '' : b.dataset.prio });
        b.disabled = false;
        if (ok) { toast(pinned ? t('unpinned_toast') : t('pinned_toast')); reloadCurrentTab(); }
        else toast(errText(body?.error), 'err');
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
    // Resume a campaign that auto-stopped on its per-link limit — re-arm the same
    // link + same cap (a fresh window from the current delivered count).
    $$('#camp-list [data-resumelimit]').forEach((b) => b.onclick = async () => {
        const cur = list.find((x) => x.id === b.dataset.resumelimit);
        if (!cur) return;
        b.disabled = true;
        const { ok, body } = await put(`/campaigns/${cur.id}/invite`, { invite: cur.invite, limit: cur.linkLimit || 0 });
        b.disabled = false;
        if (ok) { toast(t('relimit_toast')); reloadCurrentTab(); }
        else toast(errText(body?.error), 'err');
    });
    $$('#camp-list [data-link-save]').forEach((b) => b.onclick = async () => {
        const id = b.dataset.linkSave;
        const input = $(`[data-link-input="${id}"]`);
        const val = (input?.value || '').trim();
        const code = parseInvite(val);
        if (!code) { toast(t('invite_bad'), 'err'); return; }
        const rawLim = ($(`[data-limit-input="${id}"]`)?.value || '').trim();
        const limit = rawLim === '' ? 0 : Math.floor(Number(rawLim));
        if (rawLim !== '' && !(limit > 0)) { toast(t('limit_bad'), 'err'); return; }
        const cur = list.find((x) => x.id === id);
        const sameLink = cur && `https://discord.gg/${code}` === cur.invite;
        const sameLimit = cur && (Number(cur.linkLimit) || 0) === limit;
        // Nothing changed and not currently stopped → no-op. (When stopped on a
        // limit, re-saving the same values intentionally re-arms/resumes it.)
        if (sameLink && sameLimit && !(cur && cur.limitReached)) { toast(t('link_same')); return; }
        b.disabled = true;
        const { ok, body } = await put(`/campaigns/${id}/invite`, { invite: `https://discord.gg/${code}`, limit });
        b.disabled = false;
        if (ok) { toast(t('link_changed')); reloadCurrentTab(); }
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
    // Admin only: `(N)` = how many were delivered here via the EXTRA bonus ad
    // (partner not paid). Backend sends `extra` only to admins.
    const extra = (s.extra != null && s.extra > 0) ? ` <span class="srv-extra" title="через экстра-рекламу">(${s.extra})</span>` : '';
    return `<div class="srv-row">${ic}<span class="srv-name">${esc(s.name || 'Server')} </span><span class="srv-count">${s.count}${extra}</span>${btn}</div>`;
}

// ---------- Boot ----------
applyLang();
(async () => {
    const who = await checkAuth();
    if (who) { enterApp(); setupCabNav(who); }
    else { setAuthed(false); document.documentElement.classList.remove('pre-auth'); $('#login').hidden = false; $('#app').hidden = true; }
})();
