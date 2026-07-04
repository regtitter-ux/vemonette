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

// ---------- Login ----------
async function checkAuth() {
    const { ok, body } = await get('/whoami');
    return ok && body?.authed === true;
}

async function tryLogin(code) {
    const { ok, body } = await post('/login', { code });
    if (ok && body?.ok) return true;
    if (body?.error) throw new Error(body.error);
    throw new Error('login failed');
}

$('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = $('#code').value.trim();
    $('#login-err').hidden = true;
    try {
        await tryLogin(code);
        await enterApp();
    } catch (err) {
        $('#login-err').textContent = err.message || 'Не удалось войти';
        $('#login-err').hidden = false;
        $('#code').value = '';
        $('#code').focus();
    }
});

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
    renderTemplates();
    renderToggle();
}

async function enterApp() {
    $('#login').hidden = true;
    $('#app').hidden = false;
    await refresh();
}

// ---------- Render: stats ----------
function renderStats() {
    const s = state.stats;
    const cards = [
        { k: 'Всего верифаций', v: s.all.total.toLocaleString() },
        { k: 'За час',   v: s.all.hour },
        { k: 'За сутки', v: s.all.day },
        { k: 'За неделю', v: s.all.week },
        { k: 'За месяц', v: s.all.month },
        { k: 'Долг сервиса', v: '$' + s.outstanding.toFixed(2) },
        { k: 'Активных балансов', v: s.withBalance }
    ];
    $('#stat-cards').innerHTML = cards.map((c) =>
        `<div class="stat-card"><div class="k">${escapeHtml(c.k)}</div><div class="v">${escapeHtml(c.v)}</div></div>`
    ).join('');

    // Fast lookup: gid → owner's per-server ad text.
    const adByGid = new Map(state.ads.servers.map((a) => [a.gid, a]));
    const offByGid = state.serverAdsOff || {};

    const rows = s.perGuild.map((g) => {
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
        return `
            <tr>
                <td>${escapeHtml(g.name || 'Unknown Server')} <span class="gid">${g.gid}</span></td>
                <td>${chip}</td>
                <td class="num">${g.hour}</td>
                <td class="num">${g.day}</td>
                <td class="num">${g.week}</td>
                <td class="num">${g.month}</td>
                <td class="num"><b>${g.total}</b></td>
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
    $('#stats-global-ad').innerHTML = `
      <div class="ad-editor" data-editor="ad-global">
        <div class="row">
          <div class="label">Глобальная реклама — показывается на любом сервере, где нет персональной</div>${stamp}
        </div>
        <textarea data-field="text" placeholder="Ссылка-приглашение или готовый текст">${escapeHtml(a.default)}</textarea>
        <div class="actions">
          <button class="btn primary sm" data-act="save">Сохранить</button>
          <button class="btn danger sm" data-act="del">Очистить</button>
          <span class="spacer" style="flex:1"></span>
          <span class="muted">{link} подставляется из шаблона при показе.</span>
        </div>
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
