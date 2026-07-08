// Partner cabinet — vanilla JS.
const API = (window.__VEMONI_API_BASE__ || '').replace(/\/+$/, '') + '/partner';

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
const put = (p, o) => api(p, { method: 'PUT', body: JSON.stringify(o || {}) });

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => '$' + Number(n || 0).toFixed(2);
let toastT;
function toast(msg, kind = 'ok') { const el = $('#toast'); el.className = `toast ${kind}`; el.textContent = msg; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 3500); }

function fmtBoost(ms) {
    const h = Math.max(0, Math.ceil((Number(ms) || 0) / 3600000));
    return h >= 24 ? `${Math.floor(h / 24)}д ${h % 24}ч` : `${h}ч`;
}
function relTime(ms) {
    if (!ms) return '—';
    const s = Math.floor((Date.now() - ms) / 1000);
    if (s < 60) return 'только что';
    if (s < 3600) return `${Math.floor(s / 60)} мин назад`;
    if (s < 86400) return `${Math.floor(s / 3600)} ч назад`;
    return `${Math.floor(s / 86400)} дн назад`;
}

// Auth
$('#discord-login').addEventListener('click', (e) => { e.preventDefault(); location.href = API + '/oauth/login'; });
if (new URLSearchParams(location.search).get('login') === 'denied') {
    $('#login-err').textContent = 'Не удалось войти. Попробуйте ещё раз.'; $('#login-err').hidden = false;
    history.replaceState(null, '', location.pathname);
}
$('#logout').addEventListener('click', async () => { await post('/logout'); location.reload(); });

async function checkAuth() { const { ok, body } = await get('/whoami'); return ok && body?.authed === true; }

async function enterApp() {
    $('#login').hidden = true; $('#app').hidden = false;
    await load();
    setInterval(load, 20000);
}

async function load() {
    const { ok, body } = await get('/me');
    if (!ok) return;
    render(body);
}

function render(d) {
    $('#top-balance').textContent = money(d.balance);
    const boost = d.boosted ? ` <span class="chip amber">🔥 буст ${fmtBoost(d.boostLeftMs)}</span>` : '';
    const cards = [
        { k: 'Баланс', v: money(d.balance), n: d.balance >= (d.minWithdraw || 10) ? 'можно вывести' : `вывод от ${money(d.minWithdraw || 10)}` },
        { k: 'Ставка за заход', v: `$${Number(d.joinRate).toFixed(2)}<span class="muted sm">/100</span>${boost}` },
        { k: 'Заходов засчитано', v: d.standingJoins, n: money(d.standingPaid) + ' начислено' },
        { k: 'Ушло (списано)', v: d.clawedJoins, n: '−' + money(d.clawedAmount) },
        { k: 'Всего выведено', v: money(d.withdrawnDone) },
        { k: 'Автовывод', v: d.autoPayout ? '🟢 вкл' : '⚪ выкл' }
    ];
    $('#p-cards').innerHTML = cards.map((c) =>
        `<div class="pcard"><div class="k">${esc(c.k)}</div><div class="v">${c.v}</div>${c.n ? `<div class="n">${esc(c.n)}</div>` : ''}</div>`
    ).join('');

    // Requisites (don't clobber while the user is editing)
    const reqEl = $('#p-req');
    if (document.activeElement !== reqEl) reqEl.value = d.requisites || '';

    // Verifications
    const pg = d.verifications?.perGuild || [];
    $('#p-verif').innerHTML = `
      <thead><tr><th>Сервер</th><th class="num">час</th><th class="num">день</th><th class="num">неделя</th><th class="num">месяц</th><th class="num">всего</th></tr></thead>
      <tbody>${pg.length ? pg.map((g) => `<tr><td>${esc(g.name || g.guildId)}</td><td class="num">${g.hour}</td><td class="num">${g.day}</td><td class="num">${g.week}</td><td class="num">${g.month}</td><td class="num"><b>${g.total}</b></td></tr>`).join('') : '<tr><td colspan="6" class="muted">Пока нет оплаченных верификаций</td></tr>'}</tbody>`;

    // Withdrawals
    const wds = d.withdrawals || [];
    const st = (s) => s === 'completed' ? '<span class="chip green">выполнен</span>' : '<span class="chip amber">в обработке</span>';
    $('#p-wd').innerHTML = `
      <thead><tr><th>Дата</th><th class="num">Сумма</th><th>Статус</th></tr></thead>
      <tbody>${wds.length ? wds.map((w) => `<tr><td class="muted">${esc(relTime(w.createdAt))}</td><td class="num">${money(w.amount)}</td><td>${st(w.status)}</td></tr>`).join('') : '<tr><td colspan="3" class="muted">Выплат пока не было</td></tr>'}</tbody>`;
}

$('#p-req-save').addEventListener('click', async () => {
    const { ok, body } = await put('/requisites', { requisites: $('#p-req').value });
    if (ok) toast('Реквизиты сохранены'); else toast(body?.error || 'Не удалось сохранить', 'err');
});

// Boot
(async () => { if (await checkAuth()) enterApp(); })();
