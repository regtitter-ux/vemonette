// Admin panel — vanilla JS, no bundler.
// The bot's HTTPS URL is set via window.__VEMONI_API_BASE__ in index.html.
const API = (window.__VEMONI_API_BASE__ || '').replace(/\/+$/, '') + '/admin';

// ---------- HTTP helpers (credentials: include so the session cookie flows) ----------
async function api(path, opts = {}) {
    const res = await fetch(API + path, {
        credentials: 'include',
        headers: opts.body ? { 'Content-Type': 'application/json' } : {},
        ...opts
    });
    let body = null;
    try { body = await res.json(); } catch {}
    return { ok: res.ok, status: res.status, body };
}
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
    renderAds();
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

    const rows = s.perGuild.map((g) => `
        <tr>
            <td>${escapeHtml(g.name || 'Unknown Server')} <span class="gid">${g.gid}</span></td>
            <td class="num">${g.hour}</td>
            <td class="num">${g.day}</td>
            <td class="num">${g.week}</td>
            <td class="num">${g.month}</td>
            <td class="num"><b>${g.total}</b></td>
        </tr>`).join('');
    $('#stat-table').innerHTML = `
        <thead><tr>
            <th>Сервер</th><th class="num">1h</th><th class="num">1d</th><th class="num">7d</th><th class="num">30d</th><th class="num">Всего</th>
        </tr></thead>
        <tbody>${rows || '<tr><td colspan="6" class="muted">Данных пока нет</td></tr>'}</tbody>
    `;
}

// ---------- Render: ads ----------
function renderAds() {
    const a = state.ads;
    $('#ad-global').innerHTML = adEditor({ gid: null, text: a.default, updatedAt: a.defaultAt, isGlobal: true });
    $('#ad-servers').innerHTML = a.servers.length
        ? a.servers.map((s) => `<div class="card">${adEditor({ gid: s.gid, name: s.name, text: s.text, updatedAt: s.updatedAt })}</div>`).join('')
        : '<div class="muted">Нет per-server реклам. Нажми «＋ Реклама для сервера».</div>';

    wireAdEditors();
}

function adEditor({ gid, name, text, updatedAt, isGlobal }) {
    const label = isGlobal ? 'Глобальная реклама' : (name || 'Unknown Server');
    const gidChip = isGlobal ? '' : `<span class="gid">${escapeHtml(gid)}</span>`;
    const gidInput = isGlobal ? '' : `<input type="hidden" data-field="gid" value="${escapeHtml(gid)}" />`;
    const stamp = updatedAt ? `<span class="muted"> · ${escapeHtml(relTime(updatedAt))}</span>` : '';
    const idAttr = `data-editor="ad" data-key="${escapeHtml(gid || 'global')}"`;
    return `
      <div class="ad-editor" ${idAttr}>
        <div class="row">
          <div class="label">${escapeHtml(label)}</div>${gidChip}${stamp}
        </div>
        <textarea data-field="text" placeholder="Ссылка-приглашение или готовый текст">${escapeHtml(text)}</textarea>
        ${gidInput}
        <div class="actions">
          <button class="btn primary sm" data-act="save">Сохранить</button>
          ${isGlobal ? '' : '<button class="btn danger sm" data-act="del">Удалить</button>'}
          <span class="spacer"></span>
          <span class="muted" data-field="hint">{link} подставляется из шаблона при показе.</span>
        </div>
      </div>`;
}

function wireAdEditors() {
    $$('[data-editor="ad"]').forEach((ed) => {
        ed.querySelector('[data-act="save"]').onclick = async () => {
            const gidEl = ed.querySelector('[data-field="gid"]');
            const text = ed.querySelector('[data-field="text"]').value;
            const payload = { text };
            if (gidEl) payload.gid = gidEl.value;
            const { ok, body } = await put('/ad', payload);
            if (ok) { toast('Реклама сохранена'); refresh(); }
            else toast(body?.error || 'Не удалось сохранить', 'err');
        };
        const delBtn = ed.querySelector('[data-act="del"]');
        if (delBtn) delBtn.onclick = async () => {
            const gidEl = ed.querySelector('[data-field="gid"]');
            if (!confirm('Удалить рекламу для этого сервера?')) return;
            const { ok, body } = await del('/ad', { gid: gidEl ? gidEl.value : null });
            if (ok) { toast('Удалено'); refresh(); }
            else toast(body?.error || 'Не удалось удалить', 'err');
        };
    });
}

$('#ad-add').onclick = () => {
    const gid = prompt('ID сервера (17–20 цифр):');
    if (!gid) return;
    if (!/^\d{17,20}$/.test(gid.trim())) { toast('Неверный ID', 'err'); return; }
    const text = prompt('Реклама (ссылка или готовый текст):') || '';
    put('/ad', { gid: gid.trim(), text }).then(({ ok, body }) => {
        if (ok) { toast('Добавлено'); refresh(); }
        else toast(body?.error || 'Не удалось добавить', 'err');
    });
};

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

// ---------- Boot ----------
(async () => {
    if (await checkAuth()) enterApp();
})();
