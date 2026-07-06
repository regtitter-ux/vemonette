// Admin panel — vanilla JS, no bundler.
// The bot's HTTPS URL is set via window.__VEMONI_API_BASE__ in index.html.
const API = (window.__VEMONI_API_BASE__ || '').replace(/\/+$/, '') + '/admin';

// ---------- HTTP helpers (credentials: include so the session cookie flows) ----------
async function api(path, opts = {}) {
    let res;
    try {
        res = await fetch(API + path, {
            credentials: 'include',
            headers: opts.body ? { 'Content-Type': 'application/json' } : {},
            ...opts
        });
    } catch (err) {
        // Network-level failure — usually CORS block, DNS miss, or mixed
        // content. Surface it clearly in the console so it's diagnosable
        // from DevTools instead of hanging silently.
        console.error('[admin] fetch failed:', API + path, err);
        throw new Error(`Не могу достучаться до ${API} — открой DevTools → Console/Network, там точная причина (обычно CORS или неверный URL).`);
    }
    let body = null;
    try { body = await res.json(); } catch {}
    return { ok: res.ok, status: res.status, body };
}

console.info('[admin] API base:', API);
const get = (p) => api(p);
const post = (p, obj) => api(p, { method: 'POST', body: obj ? JSON.stringify(obj) : undefined });
const put  = (p, obj) => api(p, { method: 'PUT',  body: JSON.stringify(obj || {}) });
const del  = (p, obj) => api(p, { method: 'DELETE', body: JSON.stringify(obj || {}) });

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));
const relTime = (ms) => {
    if (!ms) return '';
    const diff = Date.now() - ms;
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
};

// ---------- Toasts ----------
let toastT;
function toast(msg, kind = 'ok') {
    const el = $('#toast');
    el.className = `toast ${kind}`;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastT);
    toastT = setTimeout(() => { el.hidden = true; }, 3500);
}

// Delegated "Copy ID" handler — survives every live-refresh re-render.
document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-copy]');
    if (!btn) return;
    navigator.clipboard.writeText(btn.dataset.copy)
        .then(() => toast(`ID скопирован: ${btn.dataset.copy}`))
        .catch(() => toast('Не удалось скопировать', 'err'));
});

// ---------- Login ----------
async function checkAuth() {
    const { ok, body } = await get('/whoami');
    if (ok && body?.authed === true) { currentRole = body.role || 'admin'; return true; }
    return false;
}

// Role of the logged-in user: 'owner' | 'admin'. Owner-only UI is hidden
// for admins.
let currentRole = 'admin';

// Discord OAuth: bounce the browser to the backend, which redirects to
// Discord and back with a session cookie set.
$('#discord-login').addEventListener('click', (e) => {
    e.preventDefault();
    location.href = API + '/oauth/login';
});

// Show a message if the OAuth round-trip bounced us back denied.
if (new URLSearchParams(location.search).get('login') === 'denied') {
    $('#login-err').textContent = 'Доступ запрещён — этого аккаунта нет среди админов.';
    $('#login-err').hidden = false;
    history.replaceState(null, '', location.pathname);
}

$('#logout').addEventListener('click', async () => {
    await post('/logout');
    location.reload();
});

// ---------- Tabs ----------
$$('.tab').forEach((btn) => btn.addEventListener('click', () => {
    $$('.tab').forEach((t) => t.classList.toggle('active', t === btn));
    const target = btn.dataset.tab;
    $$('.pane').forEach((p) => { p.hidden = p.dataset.pane !== target; });
}));

// ---------- App state ----------
let state = null;

async function refresh() {
    const { ok, body } = await get('/state');
    if (!ok) { toast(body?.error || 'Не удалось загрузить состояние', 'err'); return; }
    state = body;
    renderStats();
    renderGlobalAd();
    renderAdStats();
    renderShares();
    renderTemplates();
    renderToggle();
    if (effRole() === 'owner') renderAdmins();
}

// ---------- Admins (owner only) ----------
async function renderAdmins() {
    const { ok, body } = await get('/admins');
    if (!ok) return; // 403 for non-owners — tab is hidden anyway
    const owner = body.owner;
    const rows = [
        `<tr>
           <td><div class="srv-cell"><span>${escapeHtml(owner)}</span><button class="btn-mini copy-id" data-copy="${owner}" title="${owner}">Copy ID</button></div></td>
           <td><span class="chip green">Владелец</span></td>
           <td><span class="muted">—</span></td>
         </tr>`,
        ...body.admins.map((id) => `
         <tr>
           <td><div class="srv-cell"><span>${escapeHtml(id)}</span><button class="btn-mini copy-id" data-copy="${id}" title="${id}">Copy ID</button></div></td>
           <td><span class="chip blue">Админ</span></td>
           <td><button class="btn-mini off" data-admin-del="${escapeHtml(id)}">Убрать</button></td>
         </tr>`)
    ].join('');
    $('#admin-table').innerHTML = `
        <thead><tr><th>Пользователь</th><th>Роль</th><th>Действия</th></tr></thead>
        <tbody>${rows}</tbody>`;
    $$('#admin-table [data-admin-del]').forEach((btn) => {
        btn.onclick = async () => {
            if (!confirm('Убрать этого админа?')) return;
            const { ok, body } = await put('/admins', { userId: btn.dataset.adminDel, remove: true });
            if (ok) { toast('Админ убран'); renderAdmins(); }
            else toast(body?.error || 'Не удалось', 'err');
        };
    });
}

const _adminAddBtn = document.getElementById('admin-add');
if (_adminAddBtn) _adminAddBtn.onclick = async () => {
    const id = prompt('Discord ID нового админа (17–20 цифр):');
    if (!id) return;
    if (!/^\d{17,20}$/.test(id.trim())) { toast('Неверный ID', 'err'); return; }
    const { ok, body } = await put('/admins', { userId: id.trim() });
    if (ok) { toast('Админ добавлен'); renderAdmins(); }
    else toast(body?.error || 'Не удалось', 'err');
};

// Owner can preview the panel as an assigned admin sees it. Real session
// stays owner; this only changes what the UI shows (effective role).
let viewAsAdmin = false;
const effRole = () => (viewAsAdmin ? 'admin' : currentRole);

function applyRole() {
    const owner = effRole() === 'owner';
    // Hide owner-only tabs (and the whole preview flow is owner-only itself).
    $$('[data-owner-only]').forEach((el) => { el.hidden = !owner; });
    // Preview banner (with the exit button) shows while previewing.
    $('#view-banner').hidden = !viewAsAdmin;
    // If the current tab is now hidden, fall back to Statistics.
    const activeTab = $('.tab.active');
    if (activeTab && activeTab.hidden) $('.tab[data-tab="stats"]').click();
}

function setViewAsAdmin(on) {
    if (currentRole !== 'owner') return; // only the owner can preview
    viewAsAdmin = on;
    applyRole();
    refresh(); // re-render per effective role (cryptofund button, admins table)
}
const _viewAsBtn = document.getElementById('view-as-admin');
if (_viewAsBtn) _viewAsBtn.onclick = () => setViewAsAdmin(true);
const _viewExitBtn = document.getElementById('view-exit');
if (_viewExitBtn) _viewExitBtn.onclick = () => setViewAsAdmin(false);

async function enterApp() {
    // Belt and suspenders: also force display via inline styles so a stale
    // cached stylesheet (without the [hidden] override) can't keep the
    // login screen stuck on top after login.
    const login = $('#login'), app = $('#app');
    login.hidden = true; login.style.display = 'none';
    app.hidden = false; app.style.display = 'grid';
    applyRole();
    await refresh();
    startLiveRefresh();
}

// ---------- Live refresh ----------
// Poll /state every 3s so numbers stay fresh without a manual reload.
// Guards:
//   - Skip while the browser tab is backgrounded (document.hidden).
//   - Skip while an input/textarea/select is focused so we don't wipe
//     text the user is in the middle of typing (a full refresh rebuilds
//     the editor's textarea and loses caret + unsaved content).
//   - Skip while a modal is open — editing inside a modal shouldn't be
//     interrupted; the next tick after it closes resyncs everything.
const LIVE_REFRESH_MS = 3000;
let liveRefreshT;

function isEditingSomething() {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}
function anyModalOpen() {
    return !$('#bal-modal').hidden || !$('#server-ad-modal').hidden || !$('#cryptofund-modal').hidden;
}
async function liveTick() {
    if (document.hidden || isEditingSomething() || anyModalOpen()) return;
    await refresh();
    // If the Balances tab is currently showing, also refresh its table so
    // its numbers (balance, verifications) stay in sync too.
    const balPane = document.querySelector('.pane[data-pane="balances"]');
    if (balPane && !balPane.hidden) await loadBalances();
}
function startLiveRefresh() {
    clearInterval(liveRefreshT);
    liveRefreshT = setInterval(() => liveTick().catch(() => null), LIVE_REFRESH_MS);
    // Fire an immediate tick when the tab regains visibility so returning
    // to it after a while doesn't leave you staring at stale numbers.
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) liveTick().catch(() => null);
    });
}

// ---------- Render: stats ----------
// Two modes: 'ads' (verifications with an ad shown — gross / net stays,
// the paid-order view) and 'noad' (verifications where NO ad was shown —
// organic activity, a single count to gauge sellable volume next order).
let statMode = 'ads';

function renderStats() {
    const s = state.stats;
    const noad = statMode === 'noad';
    $('#stat-mode-hint').hidden = !noad;

    let cards;
    if (noad) {
        const n = s.noAd || { hour: 0, day: 0, week: 0, month: 0, total: 0 };
        const one = (v) => Number(v).toLocaleString();
        cards = [
            { k: 'Верифаций без рекламы', v: one(n.total) },
            { k: 'За час',   v: one(n.hour) },
            { k: 'За сутки', v: one(n.day) },
            { k: 'За неделю', v: one(n.week) },
            { k: 'За месяц', v: one(n.month) }
        ];
    } else {
        const g = s.gross || s.all;
        // Gross up front, net-still-standing dimmed after the slash.
        const vs = (grossV, netV) =>
            `${Number(grossV).toLocaleString()} <span class="v-sub">/ ${Number(netV).toLocaleString()} stays</span>`;
        cards = [
            { k: 'Всего верифаций', html: vs(g.total, s.all.total) },
            { k: 'За час',   html: vs(g.hour, s.all.hour) },
            { k: 'За сутки', html: vs(g.day, s.all.day) },
            { k: 'За неделю', html: vs(g.week, s.all.week) },
            { k: 'За месяц', html: vs(g.month, s.all.month) }
        ];
    }
    $('#stat-cards').innerHTML = cards.map((c) =>
        `<div class="stat-card"><div class="k">${escapeHtml(c.k)}</div><div class="v">${c.html || escapeHtml(c.v)}</div></div>`
    ).join('');

    // Fast lookup: gid → owner's per-server ad text.
    const adByGid = new Map(state.ads.servers.map((a) => [a.gid, a]));
    const offByGid = state.serverAdsOff || {};

    // In "без рекламы" mode, sort the table by organic volume so the most
    // active servers (best sales candidates) float to the top.
    const guilds = noad
        ? [...s.perGuild].sort((a, b) => (b.noAd?.total || 0) - (a.noAd?.total || 0))
        : s.perGuild;

    const rows = guilds.map((g) => {
        const off = Boolean(offByGid[g.gid]);
        const hasPersonal = adByGid.has(g.gid);
        const chip = off
            ? '<span class="chip red">Выкл</span>'
            : hasPersonal
                ? '<span class="chip blue">Персональная</span>'
                : '<span class="chip">Глобал</span>';
        const kranBtn = off
            ? `<button class="btn-mini off" data-act="kran-on" data-gid="${g.gid}">Кран: Выкл</button>`
            : `<button class="btn-mini on" data-act="kran-off" data-gid="${g.gid}">Кран: Вкл</button>`;
        const adBtn = `<button class="btn-mini" data-act="ad-edit" data-gid="${g.gid}">Реклама…</button>`;
        const ic = g.icon
            ? `<img class="srv-ic" src="${escapeHtml(g.icon)}" alt="" loading="lazy" onerror="this.outerHTML='<span class=\\'srv-ic srv-ic-fallback\\'>${escapeHtml((g.name || '?')[0].toUpperCase())}</span>'" />`
            : `<span class="srv-ic srv-ic-fallback">${escapeHtml((g.name || '?')[0].toUpperCase())}</span>`;

        let cells;
        if (noad) {
            const n = g.noAd || { hour: 0, day: 0, week: 0, month: 0, total: 0 };
            cells = `
                <td class="num">${n.hour}</td>
                <td class="num">${n.day}</td>
                <td class="num">${n.week}</td>
                <td class="num">${n.month}</td>
                <td class="num"><b>${n.total}</b></td>`;
        } else {
            const gr = g.gross || { hour: g.hour, day: g.day, week: g.week, month: g.month, total: g.total };
            const cell = (grossV, netV) => `${grossV} <span class="v-sub">/ ${netV}</span>`;
            cells = `
                <td class="num">${cell(gr.hour, g.hour)}</td>
                <td class="num">${cell(gr.day, g.day)}</td>
                <td class="num">${cell(gr.week, g.week)}</td>
                <td class="num">${cell(gr.month, g.month)}</td>
                <td class="num"><b>${gr.total}</b> <span class="v-sub">/ ${g.total}</span></td>`;
        }
        return `
            <tr>
                <td><div class="srv-cell">${ic}<span>${escapeHtml(g.name || 'Unknown Server')}</span><button class="btn-mini copy-id" data-copy="${g.gid}" title="${g.gid}">Copy ID</button></div></td>
                <td>${chip}</td>
                ${cells}
                <td><div class="actions">${kranBtn} ${adBtn}</div></td>
            </tr>`;
    }).join('');
    $('#stat-table').innerHTML = `
        <thead><tr>
            <th>Сервер</th><th>Реклама</th>
            <th class="num">1h</th><th class="num">1d</th><th class="num">7d</th><th class="num">30d</th><th class="num">Всего</th>
            <th>Действия</th>
        </tr></thead>
        <tbody>${rows || '<tr><td colspan="8" class="muted">Данных пока нет</td></tr>'}</tbody>
    `;
    wireStatsActions();
}

// Wire the С рекламой / Без рекламы switch (once — it lives outside the
// re-rendered content).
$$('#stat-mode button').forEach((btn) => {
    btn.onclick = () => {
        statMode = btn.dataset.mode;
        $$('#stat-mode button').forEach((b) => b.classList.toggle('active', b === btn));
        if (state) renderStats();
    };
});

function wireStatsActions() {
    $$('#stat-table [data-act]').forEach((btn) => {
        const gid = btn.dataset.gid;
        const act = btn.dataset.act;
        btn.onclick = async () => {
            if (act === 'kran-off' || act === 'kran-on') {
                const off = act === 'kran-off';
                const { ok, body } = await put('/server-ads-off', { gid, off });
                if (ok) { toast(off ? 'Кран сервера закрыт' : 'Кран сервера открыт'); refresh(); }
                else toast(body?.error || 'Не удалось переключить', 'err');
            } else if (act === 'ad-edit') {
                openServerAdModal(gid);
            }
        };
    });
}

// ---------- Global ad editor (moved from the old Ads tab, now under Stats) ----------
function renderGlobalAd() {
    const a = state.ads;
    const stamp = a.defaultAt ? `<span class="muted"> · ${escapeHtml(relTime(a.defaultAt))}</span>` : '';

    // Join-limit row for the global creative — only meaningful when there IS
    // a global ad and it has a resolvable rendered key.
    let limitBlock = '', footer = '';
    if (a.default && a.default.trim() && a.defaultKey) {
        const lim = Number(a.defaultLimit) || 0;
        const cnt = Number(a.defaultCount) || 0;
        const capped = lim > 0 && cnt >= lim;
        const counter = lim > 0
            ? `<span class="chip ${capped ? 'red' : 'green'}">Заходы: ${cnt} / ${lim}${capped ? ' — лимит достигнут, реклама скрыта' : ''}</span>`
            : `<span class="chip">Заходы: ${cnt} · без лимита</span>`;
        limitBlock = `
        <div class="ad-limit-row" data-limit-key="${escapeHtml(a.defaultKey)}">
          ${counter}
          <input type="number" min="0" step="1" data-limit-input placeholder="лимит, 0 = убрать" value="${lim || ''}" />
          <button class="btn-mini" data-limit-save>Сохранить лимит</button>
          <button class="btn-mini off" data-limit-reset title="Обнулить счётчик заходов для новой рекламы">Сбросить счётчик</button>
        </div>`;
        const first = a.defaultFirstAt ? escapeHtml(relTime(a.defaultFirstAt)) : '';
        const last = a.defaultLastAt ? escapeHtml(relTime(a.defaultLastAt)) : '';
        if (first || last) {
            footer = `<div class="ad-stat-foot muted">${first ? `Впервые: ${first}` : ''}${first && last ? ' · ' : ''}${last ? `Последний показ: ${last}` : ''} <span style="opacity:.7">· «Впервые» считается с момента сброса счётчика инвайтов</span></div>`;
        }
    }

    $('#stats-global-ad').innerHTML = `
      <div class="ad-editor" data-editor="ad-global">
        <div class="row">
          <div class="label">Глобальная реклама — показывается на любом сервере, где нет персональной</div>${stamp}
        </div>
        <textarea data-field="text" placeholder="Ссылка-приглашение или готовый текст">${escapeHtml(a.default)}</textarea>
        ${limitBlock}
        <div class="actions">
          <button class="btn primary sm" data-act="save">Сохранить</button>
          <button class="btn danger sm" data-act="del">Очистить</button>
          <span class="spacer" style="flex:1"></span>
          <span class="muted">{link} подставляется из шаблона при показе.</span>
        </div>
        ${footer}
      </div>`;
    const ed = $('[data-editor="ad-global"]');
    ed.querySelector('[data-act="save"]').onclick = async () => {
        const text = ed.querySelector('[data-field="text"]').value;
        const { ok, body } = await put('/ad', { text });
        if (ok) { toast('Глобальная реклама сохранена'); refresh(); }
        else toast(body?.error || 'Не удалось сохранить', 'err');
    };
    ed.querySelector('[data-act="del"]').onclick = async () => {
        if (!confirm('Очистить глобальную рекламу?')) return;
        const { ok, body } = await del('/ad', {});
        if (ok) { toast('Глобальная реклама очищена'); refresh(); }
        else toast(body?.error || 'Не удалось очистить', 'err');
    };
    wireCreativeLimits();
}

// ---------- Ad statistics — per-CREATIVE (unique rendered text) ----------
// Backend attaches an adKey to every verified.json entry generated with an
// ad shown (see touchCreative in adcreative.js), and returns adCreatives
// aggregated by that key. Same text on many servers → one card summing
// them; different text on one server → separate cards.
function renderAdStats() {
    const list = $('#adstats-list');
    if (!list) return;
    const creatives = Array.isArray(state.adCreatives) ? state.adCreatives : [];

    if (!creatives.length) {
        list.className = 'ad-stat-list';
        list.innerHTML = '<div class="muted">Пока ни одна верификация не была засчитана с рекламой ' +
            '(либо никто не подтвердился, либо все прошли до включения per-creative трекинга).</div>';
        return;
    }

    list.className = 'ad-stat-list';
    list.innerHTML = creatives.map(adCreativeCard).join('');
    wireCreativeLimits();
}

function adCreativeCard(c) {
    const preview = c.text.length > 800 ? c.text.slice(0, 800) + '\n…' : c.text;
    const first = c.firstSeenAt ? escapeHtml(relTime(c.firstSeenAt)) : '';
    const last  = c.lastSeenAt ? escapeHtml(relTime(c.lastSeenAt)) : '';
    const guildChips = c.guilds.slice(0, 8).map((g) =>
        `<span class="chip">${escapeHtml(g.name || 'Unknown')} · ${g.count}</span>`
    ).join(' ');
    const moreGuilds = c.guilds.length > 8 ? ` <span class="muted">…и ещё ${c.guilds.length - 8}</span>` : '';

    const statusChips =
        (c.active ? ' <span class="chip green">Сейчас показывается</span>' : '') +
        (c.joinMode ? ' <span class="chip blue">Проверка на заход</span>' : '');

    // Join-limit controls — only for creatives that are on air AND in
    // join-check mode. Counter is net joins since reset (leavers freed slots).
    let limitBlock = '';
    if (c.active && c.joinMode) {
        const cnt = Number(c.limitCount ?? c.total);
        const capped = c.limit > 0 && cnt >= c.limit;
        const counter = c.limit > 0
            ? `<span class="chip ${capped ? 'red' : 'green'}">Заходы: ${cnt} / ${c.limit}${capped ? ' — лимит достигнут, реклама скрыта' : ''}</span>`
            : `<span class="chip">Заходы: ${cnt} · без лимита</span>`;
        limitBlock = `
        <div class="ad-limit-row" data-limit-key="${escapeHtml(c.key)}">
          ${counter}
          <input type="number" min="0" step="1" data-limit-input placeholder="лимит, 0 = убрать" value="${c.limit || ''}" />
          <button class="btn-mini" data-limit-save>Сохранить лимит</button>
          <button class="btn-mini off" data-limit-reset title="Обнулить счётчик заходов для новой рекламы">Сбросить счётчик</button>
        </div>`;
    }

    return `
      <div class="ad-stat-card">
        <div class="ad-stat-head">
          <div class="ad-stat-badge">
            <span class="chip blue">Креатив</span>
            <strong>#${escapeHtml(c.key)}</strong>
            <span class="gid">на ${c.guilds.length} серв${c.guilds.length === 1 ? 'ере' : 'ерах'}</span>
            ${statusChips}
          </div>
          <div class="ad-stat-numbers">
            <span class="stat-pill"><em>1h</em>${c.hour}</span>
            <span class="stat-pill"><em>1d</em>${c.day}</span>
            <span class="stat-pill"><em>7d</em>${c.week}</span>
            <span class="stat-pill"><em>30d</em>${c.month}</span>
            <span class="stat-pill total"><em>Всего</em>${c.total}</span>
          </div>
        </div>
        <pre class="ad-text-preview">${escapeHtml(preview)}</pre>
        ${limitBlock}
        <div class="ad-stat-foot muted">
          ${guildChips}${moreGuilds}
          ${first ? ` · Впервые: ${first}` : ''}${last ? ` · Последний показ: ${last}` : ''}
        </div>
      </div>`;
}

function wireCreativeLimits() {
    $$('[data-limit-key]').forEach((row) => {
        const key = row.dataset.limitKey;
        row.querySelector('[data-limit-save]').onclick = async () => {
            const raw = row.querySelector('[data-limit-input]').value.trim();
            const limit = raw === '' ? 0 : Math.floor(Number(raw));
            if (!Number.isFinite(limit) || limit < 0) { toast('Лимит — целое число ≥ 0', 'err'); return; }
            const { ok, body } = await put('/creative-limit', { key, limit });
            if (ok) { toast(limit > 0 ? `Лимит ${limit} установлен` : 'Лимит снят'); refresh(); }
            else toast(body?.error || 'Не удалось сохранить лимит', 'err');
        };
        const resetBtn = row.querySelector('[data-limit-reset]');
        if (resetBtn) resetBtn.onclick = async () => {
            const { ok, body } = await post('/creative-reset', { key });
            if (ok) { toast('Счётчик сброшен'); refresh(); }
            else toast(body?.error || 'Не удалось сбросить', 'err');
        };
    });
}

// ---------- Per-server ad editor modal ----------
function openServerAdModal(gid) {
    const ad = state.ads.servers.find((a) => a.gid === gid);
    const guildEntry = state.stats.perGuild.find((g) => g.gid === gid);
    const name = ad?.name || guildEntry?.name || 'Unknown Server';
    const text = ad?.text || '';
    const stamp = ad?.updatedAt ? escapeHtml(relTime(ad.updatedAt)) : '';
    $('#server-ad-modal-body').innerHTML = `
      <div class="modal-body">
        <h2>${escapeHtml(name)} <span class="uid">${escapeHtml(gid)}</span></h2>
        <p class="muted" style="margin-bottom:12px;">
          Персональная реклама этого сервера. Если оставить пустым и удалить — юзеры увидят глобальную.
          ${stamp ? `Последнее обновление: ${stamp}.` : ''}
        </p>
        <div class="setting wide">
          <label>Текст рекламы</label>
          <textarea data-field="server-ad-text" placeholder="Ссылка-приглашение или готовый текст">${escapeHtml(text)}</textarea>
          <div class="actions-row">
            <button class="btn ghost sm" data-act="del" ${text ? '' : 'disabled'}>Удалить</button>
            <button class="btn primary sm" data-act="save">Сохранить</button>
          </div>
        </div>
      </div>`;
    $('#server-ad-modal').hidden = false;

    const saveBtn = $('#server-ad-modal-body [data-act="save"]');
    const delBtn = $('#server-ad-modal-body [data-act="del"]');
    saveBtn.onclick = async () => {
        const newText = $('#server-ad-modal-body [data-field="server-ad-text"]').value;
        const { ok, body } = await put('/ad', { gid, text: newText });
        if (ok) { toast('Реклама сервера сохранена'); $('#server-ad-modal').hidden = true; refresh(); }
        else toast(body?.error || 'Не удалось сохранить', 'err');
    };
    delBtn.onclick = async () => {
        if (!confirm('Удалить персональную рекламу этого сервера? Юзеры будут видеть глобальную.')) return;
        const { ok, body } = await del('/ad', { gid });
        if (ok) { toast('Реклама сервера удалена'); $('#server-ad-modal').hidden = true; refresh(); }
        else toast(body?.error || 'Не удалось удалить', 'err');
    };
}

$('#server-ad-modal-close').addEventListener('click', () => { $('#server-ad-modal').hidden = true; });
$('#server-ad-modal').addEventListener('click', (e) => { if (e.target.id === 'server-ad-modal') $('#server-ad-modal').hidden = true; });

// ---------- Render: shares (доли) ----------
function renderShares() {
    const sh = state.shares;
    if (!sh) return;
    $('#share-price').textContent = `$${sh.salePricePer100} / 100`;

    const p = sh.profit, r = sh.revenue, c = sh.partnerCost, acq = sh.acquiring || { total: 0 };
    const money = (v) => '$' + Number(v || 0).toFixed(2);
    const pctWarn = Math.abs(sh.totalPct - 100) > 0.001;
    const acqPct = Math.round((sh.acquiringRate || 0.03) * 100);
    // Crypto Pay app balance vs service debt (outstanding). When the app
    // balance can't cover what's owed to partners, flag a top-up.
    const cryptoBal = state.cryptoBalance;
    const debt = Number(state.stats?.outstanding) || 0;
    const needTopUp = cryptoBal != null && cryptoBal < debt;

    const cards = [
        { k: 'Чистый доход (всего)', v: money(p.total) },
        { k: 'Доход за день', v: money(p.day) },
        { k: 'Доход за неделю', v: money(p.week) },
        { k: 'Доход за месяц', v: money(p.month) },
        { k: 'Выручка с заходов', v: money(r.total) },
        { k: 'Выплачено партнёрам (заходы)', v: money(c.total) },
        { k: `Эквайринг (${acqPct}%)`, v: money(acq.total) },
        { k: 'Капитализация', sub: 'сумма балансов пользователей', v: money(debt) },
        {
            k: 'Баланс Crypto Pay',
            v: cryptoBal == null ? '—' : money(cryptoBal),
            warn: needTopUp,
            btn: effRole() === 'owner' ? 'cryptofund' : null,  // top-up is owner-only
            note: cryptoBal == null ? 'не настроен' : needTopUp ? `🔴 Пополни: меньше капитализации ${money(debt)}` : '🟢 Хватает на выплаты'
        },
        { k: 'Сумма долей', v: `${sh.totalPct}%`, warn: pctWarn }
    ];
    $('#share-cards').innerHTML = cards.map((cd) => {
        const btn = cd.btn ? ` <button class="card-add" data-card-action="${cd.btn}" title="Пополнить">＋</button>` : '';
        return `<div class="stat-card"><div class="k">${escapeHtml(cd.k)}</div>` +
            `${cd.sub ? `<div class="k" style="margin-top:2px;text-transform:none;letter-spacing:0;font-size:11px;opacity:.75">${escapeHtml(cd.sub)}</div>` : ''}` +
            `<div class="v"${cd.warn ? ' style="color:var(--amber)"' : ''}>${escapeHtml(cd.v)}${btn}</div>` +
            `${cd.note ? `<div class="k" style="margin-top:6px;text-transform:none;letter-spacing:0;font-size:11.5px">${escapeHtml(cd.note)}</div>` : ''}</div>`;
    }).join('');
    const fundBtn = $('#share-cards [data-card-action="cryptofund"]');
    if (fundBtn) fundBtn.onclick = openCryptofundModal;

    // Editing shares is owner-only; admins see the list read-only.
    const canEdit = effRole() === 'owner';
    const rows = sh.holders.map((h) => `
        <tr>
          <td><div class="srv-cell"><span>${escapeHtml(h.username || 'Неизвестный')}</span><button class="btn-mini copy-id" data-copy="${h.userId}" title="${h.userId}">Copy ID</button></div></td>
          <td class="num"><b>${h.pct}%</b></td>
          <td class="num">$${Number(h.balance).toFixed(2)}</td>
          <td class="num">$${Number(h.day).toFixed(2)}</td>
          <td class="num">$${Number(h.week).toFixed(2)}</td>
          <td class="num">$${Number(h.month).toFixed(2)}</td>
          <td class="num">$${Number(h.earnedTotal).toFixed(2)}</td>
          ${canEdit ? `<td>
            <div class="ad-limit-row" data-share-uid="${h.userId}" style="margin:0;padding:6px 8px;background:transparent;border:none;">
              <input type="number" min="0" max="100" step="0.5" data-share-pct value="${h.pct}" style="width:80px" />
              <button class="btn-mini" data-share-save>Сохранить %</button>
              <button class="btn-mini off" data-share-del>Убрать</button>
            </div>
          </td>` : ''}
        </tr>`).join('');
    $('#share-table').innerHTML = `
        <thead><tr>
          <th>Владелец</th><th class="num">Доля</th><th class="num">Баланс</th>
          <th class="num">День</th><th class="num">Неделя</th><th class="num">Месяц</th><th class="num">Всего</th>
          ${canEdit ? '<th>Действия</th>' : ''}
        </tr></thead>
        <tbody>${rows || `<tr><td colspan="${canEdit ? 8 : 7}" class="muted">Долей пока нет</td></tr>`}</tbody>`;
    if (canEdit) wireShareActions();
}

async function saveShare(userId, pct) {
    const { ok, body } = await put('/shares', { userId, pct });
    if (ok) { toast(pct > 0 ? `Доля обновлена: ${pct}%` : 'Владелец убран'); refresh(); }
    else toast(body?.error || 'Не удалось сохранить долю', 'err');
}

function wireShareActions() {
    $$('#share-table [data-share-uid]').forEach((row) => {
        const uid = row.dataset.shareUid;
        row.querySelector('[data-share-save]').onclick = () => {
            const pct = Number(row.querySelector('[data-share-pct]').value);
            if (!Number.isFinite(pct) || pct < 0 || pct > 100) { toast('Доля — число 0..100', 'err'); return; }
            saveShare(uid, pct);
        };
        row.querySelector('[data-share-del]').onclick = () => {
            if (!confirm('Убрать этого владельца доли?')) return;
            saveShare(uid, 0);
        };
    });
}

$('#share-add').onclick = () => {
    const uid = prompt('ID пользователя (17–20 цифр):');
    if (!uid) return;
    if (!/^\d{17,20}$/.test(uid.trim())) { toast('Неверный ID', 'err'); return; }
    const pctRaw = prompt('Доля в % (0–100):');
    if (pctRaw === null) return;
    const pct = Number(pctRaw.replace(',', '.'));
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) { toast('Доля — число 0..100', 'err'); return; }
    saveShare(uid.trim(), pct);
};

// ---------- Crypto Pay top-up modal ----------
function openCryptofundModal() {
    $('#cryptofund-amount').value = '';
    $('#cryptofund-result').innerHTML = '';
    $('#cryptofund-modal').hidden = false;
    $('#cryptofund-amount').focus();
}
$('#cryptofund-close').addEventListener('click', () => { $('#cryptofund-modal').hidden = true; });
$('#cryptofund-modal').addEventListener('click', (e) => { if (e.target.id === 'cryptofund-modal') $('#cryptofund-modal').hidden = true; });
$('#cryptofund-create').addEventListener('click', async () => {
    const amount = Number($('#cryptofund-amount').value.replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) { toast('Введите сумму больше 0', 'err'); return; }
    $('#cryptofund-result').innerHTML = '<span class="muted">Создаём счёт…</span>';
    const { ok, body } = await post('/cryptofund', { amount });
    if (!ok || !body?.url) {
        $('#cryptofund-result').innerHTML = `<span style="color:var(--red)">${escapeHtml(body?.error || 'Не удалось создать счёт')}</span>`;
        return;
    }
    $('#cryptofund-result').innerHTML = `
      <div class="req" style="margin-top:6px">
        <div class="muted" style="margin-bottom:8px">Счёт на $${escapeHtml(body.amount)} готов. Оплати по ссылке из @CryptoBot:</div>
        <a href="${escapeHtml(body.url)}" target="_blank" rel="noopener" style="color:var(--blue-2);word-break:break-all">${escapeHtml(body.url)}</a>
        <div class="actions-row" style="margin-top:10px">
          <button class="btn-mini" data-copy="${escapeHtml(body.url)}">Copy ссылку</button>
        </div>
      </div>
      <div class="muted" style="margin-top:8px;font-size:12px">После оплаты баланс обновится в течение ~минуты.</div>`;
});

// ---------- Render: templates ----------
function renderTemplates() {
    const t = state.templates;
    $('#tpl-global').innerHTML = tplEditor({ gid: null, text: t.default, isGlobal: true });
    $('#tpl-servers').innerHTML = t.servers.length
        ? t.servers.map((s) => `<div class="card">${tplEditor({ gid: s.gid, name: s.name, text: s.text })}</div>`).join('')
        : '<div class="muted">Персональных шаблонов пока нет. Нажми «＋ Шаблон для сервера».</div>';

    wireTplEditors();
}

function tplEditor({ gid, name, text, isGlobal }) {
    const label = isGlobal ? 'Глобальный шаблон' : (name || 'Unknown Server');
    const gidChip = isGlobal ? '' : `<span class="gid">${escapeHtml(gid)}</span>`;
    const gidInput = isGlobal ? '' : `<input type="hidden" data-field="gid" value="${escapeHtml(gid)}" />`;
    const idAttr = `data-editor="tpl" data-key="${escapeHtml(gid || 'global')}"`;
    return `
      <div class="tpl-editor" ${idAttr}>
        <div class="row">
          <div class="label">${escapeHtml(label)}</div>${gidChip}
        </div>
        <textarea data-field="text" placeholder="# Заголовок&#10;- Строка&#10;Ссылка сюда: {link}">${escapeHtml(text)}</textarea>
        ${gidInput}
        <div class="actions">
          <button class="btn primary sm" data-act="save">Сохранить</button>
          ${isGlobal ? '<button class="btn danger sm" data-act="del">Сбросить</button>'
                     : '<button class="btn danger sm" data-act="del">Удалить</button>'}
          <span class="spacer"></span>
          <span class="muted">Используй <code>{link}</code> для подстановки ссылки.</span>
        </div>
      </div>`;
}

function wireTplEditors() {
    $$('[data-editor="tpl"]').forEach((ed) => {
        ed.querySelector('[data-act="save"]').onclick = async () => {
            const gidEl = ed.querySelector('[data-field="gid"]');
            const text = ed.querySelector('[data-field="text"]').value;
            const payload = { text };
            if (gidEl) payload.gid = gidEl.value;
            const { ok, body } = await put('/template', payload);
            if (ok) { toast('Шаблон сохранён'); refresh(); }
            else toast(body?.error || 'Не удалось сохранить', 'err');
        };
        ed.querySelector('[data-act="del"]').onclick = async () => {
            const gidEl = ed.querySelector('[data-field="gid"]');
            const msg = gidEl ? 'Удалить персональный шаблон этого сервера?' : 'Сбросить глобальный шаблон до дефолтного?';
            if (!confirm(msg)) return;
            const { ok, body } = await del('/template', { gid: gidEl ? gidEl.value : null });
            if (ok) { toast(gidEl ? 'Удалено' : 'Сброшено'); refresh(); }
            else toast(body?.error || 'Не удалось удалить', 'err');
        };
    });
}

$('#tpl-add').onclick = () => {
    const gid = prompt('ID сервера (17–20 цифр):');
    if (!gid) return;
    if (!/^\d{17,20}$/.test(gid.trim())) { toast('Неверный ID', 'err'); return; }
    const text = prompt('Шаблон (используй {link}):') || '';
    put('/template', { gid: gid.trim(), text }).then(({ ok, body }) => {
        if (ok) { toast('Добавлено'); refresh(); }
        else toast(body?.error || 'Не удалось добавить', 'err');
    });
};

// ---------- Render: toggle ----------
function renderToggle() {
    $('#ads-off').checked = state.adsOff;
    $('#switch-state').textContent = state.adsOff ? '🚫 Реклама выключена — верификация без начислений' : '🟢 Реклама включена — работаем в обычном режиме';
    $('#switch-since').textContent = state.adsOffAt ? `Последнее изменение: ${relTime(state.adsOffAt)}` : '';
}

$('#ads-off').addEventListener('change', async (e) => {
    const off = e.target.checked;
    const { ok, body } = await put('/ads-off', { off });
    if (ok) { toast(off ? 'Реклама выключена' : 'Реклама включена'); refresh(); }
    else { e.target.checked = !off; toast(body?.error || 'Не удалось переключить', 'err'); }
});

// ---------- Balances ----------
const balFilters = { q: '', has: 'all', sort: 'balance', dir: 'desc' };
let balDebounce;

function renderBalTotal(total) {
    $('#bal-total').textContent = total != null ? `· ${total} юзеров` : '';
}

async function loadBalances() {
    const qs = new URLSearchParams(balFilters).toString();
    const { ok, body } = await get('/balances?' + qs);
    if (!ok) { toast(body?.error || 'Не удалось загрузить балансы', 'err'); return; }
    renderBalTotal(body.total);
    renderBalTable(body.users);
}

function renderBalTable(users) {
    const rows = users.map((u) => {
        const bChip = u.balance > 0 ? 'green' : u.balance < 0 ? 'red' : '';
        const reqBadge = u.hasRequisites ? '<span class="chip green">Реквизиты</span>' : '<span class="chip">Нет реквизитов</span>';
        const auto = u.autoPayout ? '<span class="chip blue">Auto</span>' : '';
        return `
          <tr class="clickable" data-uid="${escapeHtml(u.userId)}">
            <td>
              <span class="uid">${escapeHtml(u.userId)}</span><br>
              ${reqBadge} ${auto}
            </td>
            <td class="num"><span class="chip ${bChip}">$${u.balance.toFixed(2)}</span></td>
            <td class="num">$${u.withdrawnTotal.toFixed(2)}</td>
            <td class="num">${u.verifications.toLocaleString()}</td>
            <td class="num">${u.referralsCount}</td>
            <td class="num">$${u.bid.toFixed(2)}</td>
          </tr>`;
    }).join('');
    $('#bal-table').innerHTML = `
      <thead><tr>
        <th>Юзер</th>
        <th class="num">Баланс</th>
        <th class="num">Выведено</th>
        <th class="num">Верифаций</th>
        <th class="num">Рефералов</th>
        <th class="num">Bid</th>
      </tr></thead>
      <tbody>${rows || '<tr><td colspan="6" class="muted">Ничего не найдено под этот фильтр.</td></tr>'}</tbody>`;
    $$('#bal-table tr[data-uid]').forEach((tr) => {
        tr.onclick = () => openBalDetail(tr.dataset.uid);
    });
}

let currentDetailUserId = null;

async function openBalDetail(userId) {
    $('#bal-modal-body').innerHTML = '<div class="modal-body muted">Загрузка…</div>';
    $('#bal-modal').hidden = false;
    currentDetailUserId = userId;
    const { ok, body } = await get('/balances/' + encodeURIComponent(userId));
    if (!ok) {
        $('#bal-modal-body').innerHTML = `<div class="modal-body">${escapeHtml(body?.error || 'Ошибка загрузки')}</div>`;
        return;
    }
    $('#bal-modal-body').innerHTML = balDetailHtml(body);
    wireBalDetailControls(userId);
}

// PUT one field, reload the detail on success, refresh the list underneath.
async function editBalanceField(userId, field, payload, successMsg) {
    const { ok, body } = await put(`/balances/${encodeURIComponent(userId)}/${field}`, payload);
    if (!ok) { toast(body?.error || 'Не удалось сохранить', 'err'); return false; }
    toast(successMsg || 'Сохранено');
    await openBalDetail(userId);   // re-render with fresh data
    loadBalances();                // refresh the table underneath
    return true;
}

function wireBalDetailControls(userId) {
    const apply = (act) => {
        const btn = $(`[data-edit-act="${act}"]`);
        return btn;
    };

    const balBtn = apply('balance');
    if (balBtn) balBtn.onclick = () => {
        const raw = $('[data-edit="balance"]').value.trim().replace(',', '.');
        const m = raw.match(/^([+-])\s*(\d+(?:\.\d+)?)$/);
        if (!m) { toast('Введи число с + или -, например +50 или -20', 'err'); return; }
        const delta = (m[1] === '-' ? -1 : 1) * Number(m[2]);
        editBalanceField(userId, 'balance', { delta }, `Баланс изменён на ${m[1]}$${m[2]}`);
    };

    const bidBtn = apply('bid');
    if (bidBtn) bidBtn.onclick = () => {
        const bid = Number($('[data-edit="bid"]').value.replace(',', '.'));
        if (!Number.isFinite(bid) || bid < 0) { toast('Bid — число ≥ 0', 'err'); return; }
        editBalanceField(userId, 'bid', { bid }, 'Bid сохранён');
    };

    const jbidBtn = apply('joinbid');
    if (jbidBtn) jbidBtn.onclick = () => {
        const joinBid = Number($('[data-edit="joinBid"]').value.replace(',', '.'));
        if (!Number.isFinite(joinBid) || joinBid < 0) { toast('Join bid — число ≥ 0', 'err'); return; }
        editBalanceField(userId, 'joinbid', { joinBid }, 'Join bid сохранён');
    };

    const autoCb = $('[data-edit="autoPayout"]');
    if (autoCb) autoCb.onchange = async (e) => {
        const off = !e.target.checked;
        const { ok, body } = await put(`/balances/${encodeURIComponent(userId)}/autopayout`, { autoPayout: e.target.checked });
        if (!ok) { e.target.checked = off; toast(body?.error || 'Не удалось переключить', 'err'); return; }
        toast(e.target.checked ? 'Auto-payout включён' : 'Auto-payout выключен');
        loadBalances();
    };

    const reqBtn = apply('requisites');
    if (reqBtn) reqBtn.onclick = () => {
        const requisites = $('[data-edit="requisites"]').value;
        editBalanceField(userId, 'requisites', { requisites }, 'Реквизиты сохранены');
    };

    const refsBtn = apply('referrals');
    if (refsBtn) refsBtn.onclick = () => {
        const refs = $('[data-edit="referrals"]').value
            .split(/[\s,]+/).map((x) => x.trim()).filter(Boolean);
        editBalanceField(userId, 'referrals', { referrals: refs }, 'Список рефералов сохранён');
    };
}

function balDetailHtml(u) {
    const kv = (k, v, mono) => `<div class="kv"><span class="k">${escapeHtml(k)}</span><span class="v${mono ? ' mono' : ''}">${escapeHtml(v)}</span></div>`;
    const money = (n) => '$' + Number(n || 0).toFixed(2);

    const perGuild = u.verifications.perGuild.length
        ? u.verifications.perGuild.map((g) => `
            <tr>
              <td>${escapeHtml(g.name || 'Unknown Server')} <span class="gid">${g.gid}</span></td>
              <td class="num">${g.hour}</td>
              <td class="num">${g.day}</td>
              <td class="num">${g.week}</td>
              <td class="num">${g.month}</td>
              <td class="num"><b>${g.total}</b></td>
            </tr>`).join('')
        : '<tr><td colspan="6" class="muted">Пока пусто.</td></tr>';

    const wdList = u.withdrawals.length
        ? u.withdrawals.map((w) => `
            <div class="wd-row ${escapeHtml(w.status)}">
              <div>
                <span class="chip ${w.status === 'completed' ? 'green' : 'chip'}">${escapeHtml(w.status)}</span>
                ${w.method ? `<span class="muted"> · ${escapeHtml(w.method)}</span>` : ''}
                ${w.requisites ? `<div class="muted" style="font-size:12px;margin-top:4px;font-family:ui-monospace,Menlo,monospace;">${escapeHtml(w.requisites.slice(0, 100))}</div>` : ''}
              </div>
              <div class="amount">${money(w.amount)}</div>
              <div class="date">${escapeHtml(relTime(w.completedAt || w.createdAt))}</div>
            </div>`).join('')
        : '<div class="muted">Выводов не было.</div>';

    return `
      <div class="modal-body">
        <h2>Юзер <span class="uid">${escapeHtml(u.userId)}</span></h2>

        <div class="kv-grid">
          ${kv('Баланс', money(u.balance))}
          ${kv('Всего выведено', money(u.withdrawnTotal))}
          ${kv('Реф-бонус в пуле', money(u.refBonusAccrued))}
          ${kv('Реферер', u.referrer || '—', true)}
          ${kv('Bot ID', u.botId || '—', true)}
        </div>

        <h3>Настройки</h3>
        <div class="settings-grid">
          <div class="setting">
            <label>Изменить баланс</label>
            <input type="text" data-edit="balance" placeholder="+50 или -20" />
            <div class="actions-row"><button class="btn primary sm" data-edit-act="balance">Применить</button></div>
          </div>
          <div class="setting">
            <label>Bid ($/100 clicks)</label>
            <input type="number" step="0.01" min="0" data-edit="bid" value="${u.bid.toFixed(2)}" />
            <div class="actions-row"><button class="btn primary sm" data-edit-act="bid">Сохранить</button></div>
          </div>
          <div class="setting">
            <label>Join bid ($/100 joins)</label>
            <input type="number" step="0.01" min="0" data-edit="joinBid" value="${u.joinBid.toFixed(2)}" />
            <div class="actions-row"><button class="btn primary sm" data-edit-act="joinbid">Сохранить</button></div>
          </div>
          <div class="setting autopay">
            <label>Auto-payout (USDT-check)</label>
            <label class="switch positive">
              <input type="checkbox" data-edit="autoPayout" ${u.autoPayout ? 'checked' : ''} />
              <span class="slider"></span>
            </label>
          </div>
          <div class="setting wide">
            <label>Реквизиты</label>
            <textarea data-edit="requisites" placeholder="USDT ERC20 0x…">${escapeHtml(u.requisites)}</textarea>
            <div class="actions-row"><button class="btn primary sm" data-edit-act="requisites">Сохранить</button></div>
          </div>
          <div class="setting wide">
            <label>Приглашённые (${u.referrals.length}) — по одному ID на строку</label>
            <textarea data-edit="referrals" placeholder="743913502997086219&#10;833442190427684914">${escapeHtml(u.referrals.join('\n'))}</textarea>
            <div class="actions-row"><button class="btn primary sm" data-edit-act="referrals">Сохранить</button></div>
          </div>
        </div>

        <h3>Верификации ${u.verifications.all.total.toLocaleString()} · час ${u.verifications.all.hour} · день ${u.verifications.all.day} · неделя ${u.verifications.all.week} · месяц ${u.verifications.all.month}</h3>
        <div class="table-wrap"><table class="stat-table">
          <thead><tr>
            <th>Сервер</th><th class="num">1h</th><th class="num">1d</th><th class="num">7d</th><th class="num">30d</th><th class="num">Всего</th>
          </tr></thead>
          <tbody>${perGuild}</tbody>
        </table></div>

        <h3>История выводов</h3>
        ${wdList}
      </div>`;
}

$('#bal-q').addEventListener('input', (e) => {
    balFilters.q = e.target.value.trim();
    clearTimeout(balDebounce);
    balDebounce = setTimeout(loadBalances, 250);
});
$('#bal-has').addEventListener('change', (e) => { balFilters.has = e.target.value; loadBalances(); });
$('#bal-sort').addEventListener('change', (e) => { balFilters.sort = e.target.value; loadBalances(); });
$('#bal-dir').addEventListener('click', (e) => {
    const btn = e.currentTarget;
    const next = btn.dataset.dir === 'desc' ? 'asc' : 'desc';
    btn.dataset.dir = next;
    btn.textContent = next === 'desc' ? '↓ desc' : '↑ asc';
    balFilters.dir = next;
    loadBalances();
});
$('#bal-modal-close').addEventListener('click', () => { $('#bal-modal').hidden = true; });
$('#bal-modal').addEventListener('click', (e) => { if (e.target.id === 'bal-modal') $('#bal-modal').hidden = true; });

// Load balances when the tab is first opened, and re-fetch on every open so
// numbers stay fresh without a full page refresh.
document.querySelector('[data-tab="balances"]').addEventListener('click', loadBalances);

// ---------- Boot ----------
(async () => {
    if (await checkAuth()) enterApp();
})();
