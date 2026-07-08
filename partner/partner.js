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
    if (ok) render(body);
    loadAdHistory();
}

// ---- Ad history per server ----
let adHist = [];
let adHistSel = null;
async function loadAdHistory() {
    const { ok, body } = await get('/ad-history');
    if (!ok) return;
    renderAdHistory(body.servers || []);
}
function srvIcon(name, url) {
    const initial = esc((String(name || '?')[0] || '?').toUpperCase());
    return url
        ? `<img class="sw-ic" src="${esc(url)}" alt="" onerror="this.outerHTML='<span class=\\'sw-ic sw-ic-fb\\'>${initial}</span>'" />`
        : `<span class="sw-ic sw-ic-fb">${initial}</span>`;
}
function renderAdHistory(servers) {
    adHist = servers;
    const section = $('#adhist-section');
    if (!servers.length) { section.hidden = true; return; }
    section.hidden = false;
    if (!adHistSel || !servers.some((s) => s.guildId === adHistSel)) adHistSel = servers[0].guildId;

    // Server switcher (only when the partner has more than one server).
    const sw = $('#adhist-switch');
    if (servers.length > 1) {
        sw.hidden = false;
        sw.innerHTML = servers.map((s) =>
            `<button class="sw-btn${s.guildId === adHistSel ? ' active' : ''}" data-sv="${esc(s.guildId)}">${srvIcon(s.name, s.icon)}<span>${esc(s.name || s.guildId)}</span></button>`
        ).join('');
        sw.querySelectorAll('[data-sv]').forEach((b) => b.onclick = () => { adHistSel = b.dataset.sv; renderAdHistory(adHist); });
    } else { sw.hidden = true; sw.innerHTML = ''; }

    const s = servers.find((x) => x.guildId === adHistSel) || servers[0];
    $('#adhist-summary').innerHTML =
        `<div class="ah-sum-row">${servers.length === 1 ? `${srvIcon(s.name, s.icon)}<span class="ah-sv-name">${esc(s.name || s.guildId)}</span>` : ''}
          <span class="ah-kpi"><span class="muted sm">Зашло</span> <b>${s.totalJoined}</b></span>
          <span class="ah-kpi"><span class="muted sm">Осталось</span> <b>${s.totalStayed}</b></span>
          <span class="ah-kpi"><span class="muted sm">Ушли</span> <b>${s.totalLeft}</b></span>
          <span class="ah-kpi"><span class="muted sm">Заработано</span> <b>${money(s.totalEarned)}</b></span>
        </div>`;

    const ads = s.ads || [];
    $('#adhist-table').innerHTML = `
      <thead><tr><th>Реклама (сервер)</th><th class="num">Зашло</th><th class="num">Осталось</th><th class="num">Ушли</th><th class="num">Заработано</th><th>Последний показ</th></tr></thead>
      <tbody>${ads.length ? ads.map((a) => `<tr>
        <td>${srvIcon(a.sponsorName, a.sponsorIcon)}<span class="ah-ad-name">${esc(a.sponsorName || a.sponsorGuildId)}</span></td>
        <td class="num">${a.joined}</td>
        <td class="num"><b>${a.stayed}</b></td>
        <td class="num">${a.left || 0}</td>
        <td class="num">${money(a.earned)}</td>
        <td class="muted">${esc(relTime(a.lastAt))}</td>
      </tr>`).join('') : '<tr><td colspan="6" class="muted">Пока не было показов рекламы на этом сервере.</td></tr>'}</tbody>`;
}

function render(d) {
    $('#top-balance').textContent = money(d.balance);
    const boost = d.boosted ? ` <span class="chip amber">🔥 буст ${fmtBoost(d.boostLeftMs)}</span>` : '';
    const cards = [
        { k: 'Баланс', v: money(d.balance), n: d.balance >= (d.minWithdraw || 10) ? 'можно вывести' : `вывод от ${money(d.minWithdraw || 10)}` },
        { k: 'Ставка за заход', v: `$${Number(d.joinRate).toFixed(2)}<span class="muted sm">/100</span>${boost}` },
        { k: 'Заходов оплачено', v: d.standingJoins, n: money(d.standingPaid) + ' начислено' },
        { k: 'Всего выведено', v: money(d.withdrawnDone) }
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
      <tbody>${pg.length ? pg.map((g) => {
          const L = g.left || {};
          // left number = осталось (still standing), right = всего зашло (осталось + вышли)
          const cell = (stayed, leftN, bold) => {
              const joined = (Number(stayed) || 0) + (Number(leftN) || 0);
              const main = bold ? `<b>${stayed}</b>` : `${stayed}`;
              const extra = leftN ? ` <span class="left-n" title="Осталось / всего зашло">/${joined}</span>` : '';
              return `<td class="num">${main}${extra}</td>`;
          };
          return `<tr><td>${esc(g.name || g.guildId)}</td>${cell(g.hour, L.hour)}${cell(g.day, L.day)}${cell(g.week, L.week)}${cell(g.month, L.month)}${cell(g.total, L.total, true)}</tr>`;
      }).join('') : '<tr><td colspan="6" class="muted">Пока нет оплаченных верификаций</td></tr>'}</tbody>`;

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
