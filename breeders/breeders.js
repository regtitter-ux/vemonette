// "For bot breeders" — reserve user-bot management. Shares the buyer session with
// the order cabinet (routes to /breeders/* and /order/whoami on the API root).
const API = (window.__VEMONI_API_BASE__ || '').replace(/\/+$/, '');

const TOKEN_KEY = 'vemoni_tok';
const getTok = () => { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; } };
const setTok = (v) => { try { v ? localStorage.setItem(TOKEN_KEY, v) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } };
(() => { const m = (location.hash || '').match(/[#&]t=([^&]+)/); if (m) { try { setTok(decodeURIComponent(m[1])); } catch { /* ignore */ } history.replaceState(null, '', location.pathname + location.search); } })();

async function api(path, opts = {}) {
    const headers = opts.body ? { 'Content-Type': 'application/json' } : {};
    const tk = getTok(); if (tk) headers.Authorization = 'Bearer ' + tk;
    let res;
    // Always hit the network — a stale cached whoami (from before the botfarm flag
    // existed) would wrongly read as "no access".
    try { res = await fetch(API + path, { credentials: 'include', cache: 'no-store', ...opts, headers }); }
    catch { throw new Error('Нет связи с сервером'); }
    let body = null; try { body = await res.json(); } catch { /* non-json */ }
    return { ok: res.ok, status: res.status, body };
}
const get = (p) => api(p);
const post = (p, o) => api(p, { method: 'POST', body: JSON.stringify(o || {}) });
const del = (p, o) => api(p, { method: 'DELETE', body: JSON.stringify(o || {}) });

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function relTime(ms) {
    if (!ms) return '—';
    const s = Math.floor((Date.now() - ms) / 1000);
    if (s < 60) return t('just_now');
    if (s < 3600) return `${Math.floor(s / 60)} ${t('min_ago')}`;
    if (s < 86400) return `${Math.floor(s / 3600)} ${t('h_ago')}`;
    return `${Math.floor(s / 86400)} ${t('d_ago')}`;
}
let toastT;
function toast(msg, kind = 'ok') { const el = $('#toast'); el.className = `toast ${kind}`; el.textContent = msg; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 3500); }

// ---------- i18n (RU source + EN) ----------
let lang = localStorage.getItem('vemoni_lang') || ((navigator.language || '').startsWith('en') ? 'en' : 'ru');
if (lang !== 'en' && lang !== 'ru') lang = 'ru';
const EN = {
    brand: 'For bot breeders', login_hint: 'Log in with Discord to manage user-bots.', login_btn: 'Log in with Discord',
    noaccess_title: 'Bot breeders only', noaccess: 'Managing user-bots is available to site owners and anyone they grant access. Ask an owner to add your account.',
    to_orders: '← To orders', to_home: 'Home', your_account: 'Your account',
    nav_home: 'Home', nav_partner: 'Partners', nav_orders: 'My orders', nav_breeders: 'For bot breeders', nav_admin: 'Admins', logout: 'Log out',
    title: 'User-bots for join verification',
    subtitle: 'Connect personal "self-bot" accounts to verify joins on servers without a normal bot. Each card is one account: its status and the join stats it verified.',
    token_ph: 'User-bot token', add: 'Add',
    add_hint: 'The token is checked with Discord on add — a dead one can\'t be added. The token is never shown back.',
    access_title: 'Extra access to this section', access_hint: 'Owners and admins already have access. Here an owner can grant access to other Discord accounts too.',
    grant: 'Grant access',
    just_now: 'just now', min_ago: 'min ago', h_ago: 'h ago', d_ago: 'd ago',
    active: 'active', unavailable: 'unavailable', joined: 'joined', stayed: 'stayed', added_by: 'added by', added: 'added',
    remove: 'Remove', remove_card_q: 'Remove this user-bot card? Its token will be disconnected.', revoke: 'Revoke',
    no_bots: 'No user-bots yet. Add a token above.', no_access_users: 'No extra users — only owners have access.',
    bad_id: 'Enter a valid Discord ID', added_ok: 'User-bot added', removed_ok: 'Card removed', granted_ok: 'Access granted', revoked_ok: 'Access revoked',
    owner_badge: 'you (owner)'
};
function t(k) { return lang === 'en' ? (EN[k] || k) : RU[k]; }
const RU = {
    brand: 'Для ботоводов', login_hint: 'Войдите через Discord, чтобы управлять юзер-ботами.', login_btn: 'Войти через Discord',
    noaccess_title: 'Раздел только для ботоводов', noaccess: 'Доступ к управлению юзер-ботами есть у владельцев, админов и тех, кому его выдали. Попроси владельца добавить твой аккаунт.',
    to_orders: '← К заказам', to_home: 'На главную', your_account: 'Твой аккаунт',
    nav_home: 'Главная', nav_partner: 'Партнёрам', nav_orders: 'Мои заказы', nav_breeders: 'Для ботоводов', nav_admin: 'Администраторам', logout: 'Выйти',
    title: 'Юзер-боты для проверки заходов',
    subtitle: 'Подключай личные аккаунты-«селф-боты» для проверки заходов на серверах без обычного бота. Каждая карточка — отдельный аккаунт: статус и статистика проверенных заходов.',
    token_ph: 'Токен юзер-бота', add: 'Добавить',
    add_hint: 'Токен проверяется у Discord при добавлении — нерабочий добавить нельзя. Токен нигде не показывается обратно.',
    access_title: 'Доп. доступ к разделу', access_hint: 'Владельцы и админы уже имеют доступ. Здесь владелец может выдать доступ и другим Discord-аккаунтам.',
    grant: 'Выдать доступ',
    just_now: 'только что', min_ago: 'мин назад', h_ago: 'ч назад', d_ago: 'дн назад',
    active: 'активен', unavailable: 'недоступен', joined: 'зашли', stayed: 'остались', added_by: 'добавил', added: 'добавлен',
    remove: 'Удалить', remove_card_q: 'Удалить карточку этого юзер-бота? Его токен будет отключён.', revoke: 'Убрать',
    no_bots: 'Юзер-ботов пока нет. Добавь токен выше.', no_access_users: 'Доп. пользователей нет — доступ только у владельцев.',
    bad_id: 'Введите корректный Discord ID', added_ok: 'Юзер-бот добавлен', removed_ok: 'Карточка удалена', granted_ok: 'Доступ выдан', revoked_ok: 'Доступ убран',
    owner_badge: 'вы (владелец)'
};
function applyLang() {
    document.querySelectorAll('[data-i18n]').forEach((el) => { const k = el.getAttribute('data-i18n'); if ((lang === 'en' ? EN[k] : RU[k])) el.textContent = t(k); });
    document.querySelectorAll('[data-i18n-ph]').forEach((el) => { const k = el.getAttribute('data-i18n-ph'); if (lang === 'en' ? EN[k] : RU[k]) el.placeholder = t(k); });
    document.querySelectorAll('.lang-switch button').forEach((b) => b.classList.toggle('active', b.dataset.lang === lang));
    document.documentElement.lang = lang;
}
document.querySelectorAll('.lang-switch button').forEach((b) => b.addEventListener('click', () => { lang = b.dataset.lang; localStorage.setItem('vemoni_lang', lang); applyLang(); if (last) render(last); }));

// ---------- rendering ----------
let last = null;
function statusPill(s) {
    return s === 'unavailable'
        ? `<span class="pill red">● ${t('unavailable')}</span>`
        : `<span class="pill green">● ${t('active')}</span>`;
}
function botCard(b) {
    const name = b.username ? esc(b.username) : ('ID ' + esc(b.id));
    const by = b.addedBy ? ` · ${t('added_by')} <a href="https://discord.com/users/${esc(b.addedBy)}" target="_blank" rel="noopener">${esc(b.addedBy)}</a>` : '';
    return `<div class="card ${b.status === 'unavailable' ? 'off' : ''}">
      <div class="card-head">
        <div class="card-title"><b>${name}</b><span class="uid">${esc(b.id)}</span></div>
        ${statusPill(b.status)}
      </div>
      <div class="stats">
        <div class="stat"><div class="k">${t('joined')}</div><div class="v">${b.joined || 0}</div></div>
        <div class="stat"><div class="k">${t('stayed')}</div><div class="v">${b.stayed || 0}</div></div>
      </div>
      <div class="card-foot">
        <span class="muted sm">${t('added')} ${esc(relTime(b.addedAt))}${by}</span>
        <button class="btn ghost sm danger" data-del="${esc(b.id)}">${t('remove')}</button>
      </div>
    </div>`;
}
function render(d) {
    last = d;
    const box = $('#cards');
    box.innerHTML = (d.bots && d.bots.length) ? d.bots.map(botCard).join('') : `<div class="empty muted">${t('no_bots')}</div>`;
    box.querySelectorAll('[data-del]').forEach((btn) => {
        btn.onclick = async () => {
            if (!confirm(t('remove_card_q'))) return;
            btn.disabled = true;
            const { ok, body } = await del('/breeders/token', { id: btn.dataset.del });
            if (ok) { toast(t('removed_ok')); load(); } else { btn.disabled = false; toast(body?.error || 'Ошибка', 'err'); }
        };
    });

    const sec = $('#accessSection');
    if (d.isOwner) {
        sec.hidden = false;
        const list = d.access || [];
        $('#accessList').innerHTML = list.length
            ? list.map((id) => `<div class="access-row"><a href="https://discord.com/users/${esc(id)}" target="_blank" rel="noopener">${esc(id)}</a><button class="btn ghost sm danger" data-revoke="${esc(id)}">${t('revoke')}</button></div>`).join('')
            : `<div class="muted sm">${t('no_access_users')}</div>`;
        $('#accessList').querySelectorAll('[data-revoke]').forEach((btn) => {
            btn.onclick = async () => {
                btn.disabled = true;
                const { ok, body } = await put('/breeders/access', { userId: btn.dataset.revoke, remove: true });
                if (ok) { toast(t('revoked_ok')); load(); } else { btn.disabled = false; toast(body?.error || 'Ошибка', 'err'); }
            };
        });
    } else sec.hidden = true;
}
const put = (p, o) => api(p, { method: 'PUT', body: JSON.stringify(o || {}) });

async function load() {
    const { ok, body } = await get('/breeders/list');
    if (!ok) { toast(body?.error || 'Ошибка загрузки', 'err'); return; }
    render(body);
}

$('#addBtn').addEventListener('click', async () => {
    const inp = $('#tokenInput');
    const token = (inp.value || '').trim();
    if (!token) return;
    $('#addBtn').disabled = true;
    const { ok, body } = await post('/breeders/token', { token });
    $('#addBtn').disabled = false;
    if (ok) { inp.value = ''; toast(t('added_ok')); load(); }
    else toast(body?.error || 'Не удалось добавить', 'err');
});
$('#tokenInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#addBtn').click(); });

$('#accessAdd').addEventListener('click', async () => {
    const inp = $('#accessInput');
    const id = (inp.value || '').trim();
    if (!/^\d{17,20}$/.test(id)) { toast(t('bad_id'), 'err'); return; }
    const { ok, body } = await put('/breeders/access', { userId: id });
    if (ok) { inp.value = ''; toast(t('granted_ok')); load(); }
    else toast(body?.error || 'Ошибка', 'err');
});

// ---------- nav + auth ----------
function wireNav(who) {
    if (who && who.isAdmin) document.querySelectorAll('.nav-menu [data-cn="admin"]').forEach((a) => (a.hidden = false));
    const name = (who && (who.name || who.username)) || 'User', letter = (String(name).trim()[0] || 'U').toUpperCase();
    const set = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
    set('nmName', name);
    set('nmUser', who && who.username ? '@' + who.username : ('ID ' + ((who && who.userId) || '')));
    const av = document.getElementById('nmAv'), cabAv = document.getElementById('cabAv');
    if (who && who.avatar) { if (av) av.style.backgroundImage = `url("${who.avatar}")`; if (cabAv) cabAv.style.backgroundImage = `url("${who.avatar}")`; }
    else { if (av) av.textContent = letter; if (cabAv) cabAv.textContent = letter; }
    const menu = document.getElementById('navMenu'), b = document.getElementById('cabAv');
    if (menu && !menu.dataset.wired) { menu.dataset.wired = '1';
        const toggle = (e) => { e.stopPropagation(); menu.hidden = !menu.hidden; };
        if (b) b.addEventListener('click', toggle);
        menu.addEventListener('click', (e) => e.stopPropagation());
        document.addEventListener('click', () => { menu.hidden = true; });
    }
    const lg = document.getElementById('logout');
    if (lg) lg.addEventListener('click', async () => { await post('/order/logout').catch(() => null); setTok(''); location.reload(); });
}

$('#discord-login').addEventListener('click', (e) => { e.preventDefault(); location.href = API + '/order/oauth/login'; });

(async () => {
    applyLang();
    let who = null;
    try { const { ok, body } = await get('/order/whoami'); if (ok && body && body.authed) who = body; } catch { /* offline */ }
    if (!who) { $('#login').hidden = false; return; }
    if (!who.botfarm) {
        wireNav(who);
        const gu = $('#gateUser');
        if (gu) gu.innerHTML = `<span class="dot"></span>${t('your_account')}: <b>${esc((who.username ? '@' + who.username : (who.name || '')) || ('ID ' + (who.userId || '')))}</b> · <span class="uid">${esc(who.userId || '')}</span>`;
        $('#noaccess').hidden = false;
        return;
    }
    wireNav(who);
    $('#app').hidden = false;
    load();
    setInterval(load, 30000); // keep status/stats fresh
})();
