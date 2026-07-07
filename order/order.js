// Buyer order panel — vanilla JS.
const API = (window.__VEMONI_API_BASE__ || '').replace(/\/+$/, '') + '/order';

async function api(path, opts = {}) {
    let res;
    try {
        res = await fetch(API + path, {
            credentials: 'include',
            headers: opts.body ? { 'Content-Type': 'application/json' } : {},
            ...opts
        });
    } catch (err) {
        console.error('[order] fetch failed', API + path, err);
        throw new Error('Нет связи с сервером');
    }
    let body = null;
    try { body = await res.json(); } catch {}
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
function toast(msg, kind = 'ok') {
    const el = $('#toast'); el.className = `toast ${kind}`; el.textContent = msg; el.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 3500);
}

let CFG = { pricePer100: 10, minJoins: 100 };

// ---------- Auth ----------
$('#discord-login').addEventListener('click', (e) => { e.preventDefault(); location.href = API + '/oauth/login'; });
if (new URLSearchParams(location.search).get('login') === 'denied') {
    $('#login-err').textContent = 'Не удалось войти. Попробуйте ещё раз.';
    $('#login-err').hidden = false;
    history.replaceState(null, '', location.pathname);
}
$('#logout').addEventListener('click', async () => { await post('/logout'); location.reload(); });

async function checkAuth() { const { ok, body } = await get('/whoami'); return ok && body?.authed === true; }

async function enterApp() {
    $('#login').hidden = true;
    $('#app').hidden = false;
    const cfg = await get('/config');
    if (cfg.ok) CFG = cfg.body;
    $('#ord-rate').textContent = `· ${money(CFG.pricePer100)} за 100 заходов`;
    updatePrice();
    loadCampaigns();
    setInterval(loadCampaigns, 15000); // refresh stats
}

// ---------- New order ----------
function updatePrice() {
    const joins = Math.max(0, Math.floor(Number($('#ord-joins').value) || 0));
    $('#ord-price').textContent = money(joins * CFG.pricePer100 / 100);
}
$('#ord-joins').addEventListener('input', updatePrice);

$('#ord-buy').addEventListener('click', async () => {
    const invite = $('#ord-invite').value.trim();
    const joins = Math.floor(Number($('#ord-joins').value));
    if (!invite) { toast('Укажите ссылку на сервер', 'err'); return; }
    if (!Number.isFinite(joins) || joins < CFG.minJoins) { toast(`Минимум ${CFG.minJoins} заходов`, 'err'); return; }
    $('#ord-buy').disabled = true;
    $('#ord-result').innerHTML = '<div class="muted">Создаём счёт…</div>';
    const { ok, body } = await post('/create', { invite, joins });
    $('#ord-buy').disabled = false;
    if (!ok || !body?.invoiceUrl) {
        $('#ord-result').innerHTML = `<div class="err">${esc(body?.error || 'Не удалось создать заказ')}</div>`;
        return;
    }
    $('#ord-result').innerHTML = `
      <div class="pay-box">
        <div style="margin-bottom:8px">Счёт на <b>${money(body.price)}</b> готов. Оплатите через CryptoBot:</div>
        <a href="${esc(body.invoiceUrl)}" target="_blank" rel="noopener">${esc(body.invoiceUrl)}</a>
        <div class="muted sm" style="margin-top:8px">После оплаты кампания запустится автоматически (в течение минуты).</div>
      </div>`;
    loadCampaigns();
});

// ---------- Campaigns ----------
const STATUS = {
    pending_payment: { t: 'Ожидает оплаты', c: 'amber' },
    active: { t: 'Активна', c: 'green' },
    paused: { t: 'На паузе', c: 'amber' },
    complete: { t: 'Выполнена', c: 'blue' },
    cancelled: { t: 'Отменена', c: 'red' }
};

async function loadCampaigns() {
    const { ok, body } = await get('/campaigns');
    if (!ok) return;
    const list = body.campaigns || [];
    if (!list.length) { $('#camp-list').innerHTML = '<div class="muted">Заказов пока нет. Оформите первый выше ↑</div>'; return; }
    $('#camp-list').innerHTML = list.map(campCard).join('');
    wireCampaigns(list);
}

function campCard(c) {
    const st = STATUS[c.paused && c.status === 'active' ? 'paused' : c.status] || { t: c.status, c: '' };
    const pct = c.purchased ? Math.min(100, Math.round(c.delivered / c.purchased * 100)) : 0;
    const payLink = c.status === 'pending_payment' && c.invoiceUrl
        ? `<a class="btn-mini" href="${esc(c.invoiceUrl)}" target="_blank" rel="noopener">Оплатить</a>` : '';
    // Strict requirement: no network bot on the buyer's server → the campaign
    // cannot run. Show a blocking warning until they add it.
    const needBot = c.botPresent === false && c.status !== 'complete' && c.status !== 'cancelled';
    const botWarn = needBot ? `
        <div class="warn">
          ⚠️ Реклама не запустится: на вашем сервере нет нашего бота. Добавьте его — проверка заходов без него невозможна.
          <a class="btn-mini" href="${esc(CFG.botInviteUrl || '#')}" target="_blank" rel="noopener">Добавить бота</a>
        </div>` : '';
    const canManage = c.status === 'active';
    const pauseBtn = canManage
        ? `<button class="btn-mini ${c.paused ? 'off' : 'on'}" data-pause="${c.id}">${c.paused ? 'Возобновить' : 'Пауза'}</button>` : '';
    const srvBtn = (c.status === 'active' || c.status === 'complete')
        ? `<button class="btn-mini" data-servers="${c.id}">Серверы показа</button>` : '';
    return `
      <div class="camp" data-id="${c.id}">
        <div class="camp-head">
          <div>
            <div class="camp-title">${esc(c.serverName || 'Ваш сервер')}</div>
            <div class="camp-sub">${esc(c.invite)}</div>
          </div>
          <span class="chip ${st.c}">${esc(st.t)}</span>
        </div>
        ${botWarn}
        <div class="progress"><i style="width:${pct}%"></i></div>
        <div class="camp-nums"><span>Доставлено: <b>${c.delivered}</b> / ${c.purchased}</span><span>${money(c.price)}</span></div>
        <div class="camp-actions">${payLink}${pauseBtn}${srvBtn}</div>
        <div class="srv-list" data-srv-list="${c.id}" hidden></div>
      </div>`;
}

function wireCampaigns(list) {
    $$('#camp-list [data-pause]').forEach((b) => b.onclick = async () => {
        const id = b.dataset.pause;
        const c = list.find((x) => x.id === id);
        const { ok } = await post(`/campaigns/${id}/pause`, { paused: !c.paused });
        if (ok) { toast(!c.paused ? 'Кампания на паузе' : 'Кампания возобновлена'); loadCampaigns(); }
    });
    $$('#camp-list [data-servers]').forEach((b) => b.onclick = async () => {
        const id = b.dataset.servers;
        const box = $(`[data-srv-list="${id}"]`);
        if (!box.hidden) { box.hidden = true; return; }
        box.hidden = false; box.innerHTML = '<div class="muted sm">Загрузка…</div>';
        const { ok, body } = await get(`/campaigns/${id}/servers`);
        if (!ok) { box.innerHTML = '<div class="err sm">Ошибка</div>'; return; }
        const servers = body.servers || [];
        box.innerHTML = servers.length ? servers.map((s) => srvRow(id, s)).join('')
            : '<div class="muted sm">Пока нет доставленных заходов по серверам.</div>';
        box.querySelectorAll('[data-toggle]').forEach((btn) => btn.onclick = async () => {
            const gid = btn.dataset.toggle;
            const disable = btn.dataset.state === 'on';
            const { ok } = await put(`/campaigns/${id}/server`, { gid, disabled: disable });
            if (ok) { toast(disable ? 'Сервер отключён' : 'Сервер включён'); b.click(); b.click(); }
        });
    });
}

function srvRow(campId, s) {
    const ic = s.icon
        ? `<img class="srv-ic" src="${esc(s.icon)}" alt="" onerror="this.outerHTML='<span class=\\'srv-ic srv-ic-fb\\'>${esc((s.name || '?')[0].toUpperCase())}</span>'" />`
        : `<span class="srv-ic srv-ic-fb">${esc((s.name || '?')[0].toUpperCase())}</span>`;
    const btn = s.disabled
        ? `<button class="btn-mini off" data-toggle="${s.gid}" data-state="off">Выключен</button>`
        : `<button class="btn-mini" data-toggle="${s.gid}" data-state="on">Отключить</button>`;
    return `<div class="srv-row">${ic}<span class="srv-name">${esc(s.name || 'Сервер')} </span><span class="srv-count">${s.count}</span>${btn}</div>`;
}

// ---------- Boot ----------
(async () => { if (await checkAuth()) enterApp(); })();
