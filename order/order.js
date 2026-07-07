// Buyer order panel — vanilla JS.
const API = (window.__VEMONI_API_BASE__ || '').replace(/\/+$/, '') + '/order';

// ---------- i18n ----------
const DICT = {
  ru: {
    brand: 'Vemoni · Реклама',
    login_hint: 'Войдите через Discord, чтобы заказать рекламу и следить за статистикой.',
    login_btn: 'Войти через Discord',
    login_denied: 'Не удалось войти. Попробуйте ещё раз.',
    logout: 'Выйти',
    order_h1: 'Новый заказ',
    order_desc: 'Приведём живых участников на ваш сервер — реклама показывается в сети крупных сообществ, оплата только за подтверждённые заходы.',
    label_invite: 'Ссылка-приглашение вашего сервера',
    label_joins: 'Сколько заходов купить',
    price_label: 'К оплате:',
    buy_btn: 'Оплатить через CryptoBot',
    my_camps: 'Мои кампании',
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
    pay: 'Оплатить',
    pause: 'Пауза', resume: 'Возобновить',
    servers_btn: 'Серверы показа',
    paused_toast: 'Кампания на паузе', resumed_toast: 'Кампания возобновлена',
    srv_loading: 'Загрузка…', srv_error: 'Ошибка', srv_empty: 'Пока нет доставленных заходов по серверам.',
    disable: 'Отключить', disabled: 'Выключен',
    srv_off: 'Сервер отключён', srv_on: 'Сервер включён',
    bot_warn: 'Реклама не запустится: на вашем сервере нет нашего бота. Добавьте его — проверка заходов без него невозможна.',
    add_bot: 'Добавить бота',
    st_pending: 'Ожидает оплаты', st_active: 'Активна', st_paused: 'На паузе',
    st_complete: 'Выполнена', st_cancelled: 'Отменена', st_invalid: 'Ссылка недействительна',
    your_server: 'Ваш сервер'
  },
  en: {
    brand: 'Vemoni · Ads',
    login_hint: 'Log in with Discord to order advertising and track your stats.',
    login_btn: 'Log in with Discord',
    login_denied: "Couldn't log in. Please try again.",
    logout: 'Log out',
    order_h1: 'New order',
    order_desc: 'We bring real members to your server — your ad runs across a network of large communities, and you only pay for verified joins.',
    label_invite: 'Invite link to your server',
    label_joins: 'How many joins to buy',
    price_label: 'Total:',
    buy_btn: 'Pay via CryptoBot',
    my_camps: 'My campaigns',
    loading: 'Loading…',
    rate: (p) => `· $${p} per 100 joins`,
    invite_bad: 'Paste a valid Discord server invite, e.g. https://discord.gg/xxxx',
    invite_min: (n) => `Minimum ${n} joins`,
    no_link: 'Enter your server link',
    no_conn: 'No connection to the server',
    creating: 'Creating invoice…',
    order_fail: "Couldn't create the order",
    invoice_ready: (a) => `Invoice for $${a} is ready. Pay via CryptoBot:`,
    after_pay: 'The campaign starts automatically after payment (within a minute).',
    no_camps: 'No orders yet. Place your first one above ↑',
    delivered: 'Delivered:',
    pay: 'Pay',
    pause: 'Pause', resume: 'Resume',
    servers_btn: 'Shown on servers',
    paused_toast: 'Campaign paused', resumed_toast: 'Campaign resumed',
    srv_loading: 'Loading…', srv_error: 'Error', srv_empty: 'No delivered joins per server yet.',
    disable: 'Disable', disabled: 'Disabled',
    srv_off: 'Server disabled', srv_on: 'Server enabled',
    bot_warn: "The ad won't run: our bot isn't on your server. Add it — join verification is impossible without it.",
    add_bot: 'Add the bot',
    st_pending: 'Awaiting payment', st_active: 'Active', st_paused: 'Paused',
    st_complete: 'Completed', st_cancelled: 'Cancelled', st_invalid: 'Invite invalid',
    your_server: 'Your server'
  }
};
let lang = localStorage.getItem('vemoni_lang') || ((navigator.language || '').startsWith('en') ? 'en' : 'ru');
if (!DICT[lang]) lang = 'ru';
function t(key, ...args) { const v = DICT[lang][key] ?? DICT.ru[key] ?? key; return typeof v === 'function' ? v(...args) : v; }

// Map short backend error codes to localized text.
function errText(code) {
    return ({ 'bad-invite': t('invite_bad'), 'min-joins': t('invite_min', CFG.minJoins), 'invoice-failed': t('order_fail') })[code] || code || t('order_fail');
}

// ---------- HTTP ----------
async function api(path, opts = {}) {
    let res;
    try {
        res = await fetch(API + path, { credentials: 'include', headers: opts.body ? { 'Content-Type': 'application/json' } : {}, ...opts });
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

let CFG = { pricePer100: 10, minJoins: 100, botInviteUrl: '#' };
let lastCampaigns = [];

// Apply translations to static [data-i18n] nodes + dynamic bits.
function applyLang() {
    document.documentElement.lang = lang;
    $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $$('.lang-switch button').forEach((b) => b.classList.toggle('active', b.dataset.lang === lang));
    $('#ord-rate').textContent = t('rate', CFG.pricePer100);
    if (lastCampaigns.length) renderCampaigns(lastCampaigns);
}
$$('.lang-switch button').forEach((b) => b.addEventListener('click', () => { lang = b.dataset.lang; localStorage.setItem('vemoni_lang', lang); applyLang(); }));

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
$('#logout').addEventListener('click', async () => { await post('/logout'); location.reload(); });
async function checkAuth() { const { ok, body } = await get('/whoami'); return ok && body?.authed === true; }

async function enterApp() {
    $('#login').hidden = true; $('#app').hidden = false;
    const cfg = await get('/config'); if (cfg.ok) CFG = cfg.body;
    applyLang();
    updatePrice();
    loadCampaigns();
    setInterval(loadCampaigns, 15000);
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
    const { ok, body } = await post('/create', { invite: `https://discord.gg/${code}`, joins });
    $('#ord-buy').disabled = false;
    if (!ok || !body?.invoiceUrl) { $('#ord-result').innerHTML = `<div class="err">${esc(errText(body?.error))}</div>`; return; }
    $('#ord-result').innerHTML = `
      <div class="pay-box">
        <div style="margin-bottom:8px">${esc(t('invoice_ready', Number(body.price).toFixed(2)))}</div>
        <a href="${esc(body.invoiceUrl)}" target="_blank" rel="noopener">${esc(body.invoiceUrl)}</a>
        <div class="muted sm" style="margin-top:8px">${esc(t('after_pay'))}</div>
      </div>`;
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

function renderCampaigns(list) {
    if (!list.length) { $('#camp-list').innerHTML = `<div class="muted">${esc(t('no_camps'))}</div>`; return; }
    $('#camp-list').innerHTML = list.map(campCard).join('');
    wireCampaigns(list);
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
        <div class="camp-actions">${payLink}${pauseBtn}${srvBtn}</div>
        <div class="srv-list" data-srv-list="${c.id}" hidden></div>
      </div>`;
}

function wireCampaigns(list) {
    $$('#camp-list [data-pause]').forEach((b) => b.onclick = async () => {
        const c = list.find((x) => x.id === b.dataset.pause);
        const { ok } = await post(`/campaigns/${b.dataset.pause}/pause`, { paused: !c.paused });
        if (ok) { toast(!c.paused ? t('paused_toast') : t('resumed_toast')); loadCampaigns(); }
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
(async () => { if (await checkAuth()) enterApp(); })();
