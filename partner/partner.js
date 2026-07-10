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
function toast(msg, kind = 'ok') { const el = $('#toast'); el.className = `toast ${kind}`; el.textContent = tr(msg); el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 3500); }

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

// ---------- Full EN translation (runtime; RU is the source, one-way) ----------
let partnerLang = localStorage.getItem('vemoni_lang') || ((navigator.language || '').startsWith('en') ? 'en' : 'ru');
if (partnerLang !== 'en' && partnerLang !== 'ru') partnerLang = 'ru';
const WHOLE = {
  'час':'hour','день':'day','неделя':'week','месяц':'month','всего':'total','Воронка':'Funnel',
  'Сервер':'Server','Роль':'Role','Баланс':'Balance','Дата':'Date','Сумма':'Amount','Статус':'Status',
  'Зашло':'Joined','Осталось':'Stayed','Ушли':'Left','Заработано':'Earned','Выйти':'Log out','Отмена':'Cancel','Сохранить':'Save',
  'Главная':'Home','Заказы':'Orders','Партнёр':'Partner','Инвест':'Invest','Админка':'Admin',
  // Activity log
  'Журнал активности':'Activity log','Все типы':'All types','Выдача верификации':'Verification granted',
  'Списания':'Debits','Снятие верификации':'Verification removed','Все причины':'All reasons','Оплачено':'Paid',
  'Рекламы не было':'No ad shown','Уже был на сервере':'Already on server','Уже верифицирован':'Already verified',
  'Участник ушёл':'Member left','Все серверы':'All servers','Всё время':'All time','24 часа':'24 hours',
  '7 дней':'7 days','30 дней':'30 days','Сначала новые':'Newest first','Сначала старые':'Oldest first',
  'Событий не найдено.':'No events found.','Не удалось загрузить журнал.':'Could not load the log.',
  'Выдана верификация':'Verification granted','Выдана верификация · без оплаты':'Verification granted · unpaid',
  'Повторная попытка':'Repeat attempt','Списание':'Debit','Снята верификация':'Verification removed',
  'начислено':'credited','рекламы не было':'no ad','уже был на сервере':'already on server',
  'уже верифицирован':'already verified','участник ушёл':'member left'
};
function setupCabNav(isAdmin) {
    const path = location.pathname;
    document.querySelectorAll('.cab-nav [data-cn]').forEach((a) => { if (path.indexOf('/' + a.dataset.cn) === 0) a.classList.add('active'); });
    if (isAdmin) document.querySelectorAll('.cab-nav [data-cn="admin"]').forEach((a) => (a.hidden = false));
}
const TR_RE = [
  [/только что/g,'just now'],
  [/(\d+) мин назад/g,'$1 min ago'],[/(\d+) ч назад/g,'$1 h ago'],[/(\d+) дн назад/g,'$1 d ago'],
  [/(\d+) ч (\d+) мин/g,'$1 h $2 min'],[/(\d+) мин (\d+) сек/g,'$1 min $2 s'],
  [/(\d+) сек/g,'$1 s'],[/(\d+) мин/g,'$1 min'],[/(\d+)д (\d+)ч/g,'$1d $2h'],[/(\d+)ч\b/g,'$1h'],[/(\d+)д\b/g,'$1d']
];
const TR = {
  'Vemoni · Партнёрам':'Vemoni · Partners','Vemoni · Кабинет партнёра':'Vemoni · Partner cabinet',
  'Войдите через Discord, чтобы видеть баланс, заходы и историю выплат вашего сервера.':'Log in with Discord to see your server’s balance, joins and payout history.',
  'Войти через Discord':'Log in with Discord','Не удалось войти. Попробуйте ещё раз.':'Could not log in. Please try again.','Нет связи с сервером':'No connection to the server',
  // requisites
  'Реквизиты для выплат':'Payout details','Крипто-адрес и сеть, например:':'Crypto address and network, e.g.:','. Без реквизитов вывод невозможен.':'. Without details, withdrawal is not possible.',
  'Реквизиты сохранены':'Requisites saved','Не удалось сохранить':'Could not save','Инвест-кабинет':'Investor cabinet',
  // verifications table
  'Верификации по серверам':'Verifications by server','Пока нет оплаченных верификаций':'No paid verifications yet','Осталось / всего зашло':'Stayed / total joined',
  // main cards
  'можно вывести':'can withdraw','вывод от':'withdraw from','Ставка за заход':'Rate per join','Заходов оплачено':'Joins paid',' начислено':' credited','Всего выведено':'Total withdrawn','буст':'boost',
  // ad history
  'Реклама на ваших серверах':'Ads on your servers',
  'История всех реклам, что показывались на вашем сервере: сколько человек зашло по каждой, сколько осталось и сколько вы на этом заработали.':'History of every ad shown on your server: how many joined via each, how many stayed and how much you earned.',
  'Реклама (сервер)':'Ad (server)','Последний показ':'Last shown','Пока не было показов рекламы на этом сервере.':'No ads have been shown on this server yet.',
  // withdrawals
  'История выплат':'Payout history','выполнен':'completed','в обработке':'processing','Выплат пока не было':'No payouts yet',
  // cards section
  'Мои карточки верификации':'My verification cards','роль по умолчанию':'default role','сообщение':'message','Роль:':'Role:',
  '1. Клик (начали)':'1. Click (started)','2. Заход проверен':'2. Join checked','3. Остались':'3. Stayed',
  'Встряхнуть':'Shake','Владелец…':'Owner…','Роль…':'Role…','Описание…':'Description…','Перепубликовать':'Republish','Сбросить роль':'Reset role','Удалить':'Delete',
  '⏱ Среднее время от клика до проверенного захода: ~':'⏱ Average time from click to checked join: ~',
  // card actions / errors
  'Карточка пересобрана':'Card rebuilt','Карточка перепубликована':'Card republished','Карточка удалена':'Card deleted','Роль сброшена':'Role reset',
  'Владелец изменён':'Owner changed','Роль изменена':'Role changed','Описание обновлено':'Description updated','Неверный ID':'Invalid ID','Неверный ID роли':'Invalid role ID',
  'Удалить старое сообщение и опубликовать карточку заново (владелец и роль сохранятся)?':'Delete the old message and post the card again (owner and role kept)?',
  'Удалить карточку (сообщение бота будет удалено)?':'Delete the card (the bot message will be removed)?',
  'Сбросить роль верификации?\n\nБудет создана НОВАЯ роль с теми же правами, правами на каналах, названием, цветом и иконкой. Старая роль будет удалена у всех участников, а карточка сразу переключится на новую роль.\n\nВсем участникам придётся пройти верификацию заново. Продолжить?':'Reset the verification role?\n\nA NEW role is created with the same permissions, channel overwrites, name, color and icon. The old role is removed from all members, and the card switches to the new role instantly.\n\nEveryone will have to verify again. Continue?',
  'Новый владелец — Discord ID:':'New owner — Discord ID:','Новая роль — ID (пусто = роль по умолчанию «Verified»):':'New role — ID (empty = default “Verified” role):',
  'Вы указываете чужой ID — карточка перестанет быть вашей и пропадёт из кабинета. Продолжить?':'You are entering someone else’s ID — the card will no longer be yours and will disappear from your cabinet. Continue?',
  // card error codes
  'Сообщение не найдено (бот не видит канал?)':'Message not found (bot cannot see the channel?)','Это сообщение не от нашего бота':'This message is not from our bot','Карточка не в списке':'Card not in the list',
  'Это не ваша карточка':'This is not your card','Не удалось определить владельца':'Could not determine the owner','Роль карточки не найдена на сервере':'The card’s role was not found on the server',
  'Сервер недоступен боту':'Server is unavailable to the bot','У бота нет прав (нужно «Управление ролями»)':'Bot lacks permission (needs “Manage Roles”)','Это служебная роль — пересоздать нельзя':'This is a managed role — cannot be recreated',
  'Нельзя сбросить роль @everyone':'Cannot reset the @everyone role','Роль бота ниже этой роли — поднимите роль бота выше':'The bot’s role is below this one — move the bot’s role higher',
  'Не удалось создать новую роль':'Could not create the new role','Не удалось отправить новое сообщение':'Could not send the new message','Ошибка':'Error',
  // desc modal
  'Описание карточки':'Card description','Текст в эмбеде карточки верификации. Пусто — вернётся текст по умолчанию.':'Text in the verification card embed. Empty — the default text returns.'
};
const TR_SORTED = Object.keys(TR).sort((a, b) => b.length - a.length).map((k) => [k, TR[k]]);
function tr(s) {
    if (partnerLang !== 'en' || s == null) return s;
    s = String(s);
    for (const [re, rep] of TR_RE) s = s.replace(re, rep);
    for (const [ru, en] of TR_SORTED) if (s.indexOf(ru) >= 0) s = s.split(ru).join(en);
    return s;
}
function trWhole(t) { const k = t.trim(); if (k && WHOLE[k] !== undefined) return t.replace(k, WHOLE[k]); return tr(t); }
const CYR = /[А-Яа-яЁё]/;
function localizeAll(root) {
    if (partnerLang !== 'en') return;
    root = root || document.body;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode(n) {
        const tag = n.parentNode && n.parentNode.nodeName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA') return NodeFilter.FILTER_REJECT;
        return CYR.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    } });
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const n of nodes) { const v = trWhole(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; }
    (root.querySelectorAll ? root.querySelectorAll('[placeholder],[title]') : []).forEach((el) => {
        ['placeholder', 'title'].forEach((a) => { const val = el.getAttribute(a); if (val && CYR.test(val)) { const t = tr(val); if (t !== val) el.setAttribute(a, t); } });
    });
}
let _obs;
function startTranslator() {
    document.querySelectorAll('.lang-switch button').forEach((b) => b.classList.toggle('active', b.dataset.lang === partnerLang));
    document.documentElement.lang = partnerLang;
    if (partnerLang !== 'en' || _obs) return;
    const opts = { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title'] };
    localizeAll(document.body);
    _obs = new MutationObserver(() => { _obs.disconnect(); localizeAll(document.body); _obs.observe(document.body, opts); });
    _obs.observe(document.body, opts);
}
document.querySelectorAll('.lang-switch button').forEach((b) => b.addEventListener('click', () => { localStorage.setItem('vemoni_lang', b.dataset.lang); location.reload(); }));
const _confirm = window.confirm.bind(window), _prompt = window.prompt.bind(window);
window.confirm = (m) => _confirm(tr(m));
window.prompt = (m, d) => _prompt(tr(m), d);
startTranslator();

// Auth
$('#discord-login').addEventListener('click', (e) => { e.preventDefault(); location.href = API + '/oauth/login'; });
if (new URLSearchParams(location.search).get('login') === 'denied') {
    $('#login-err').textContent = 'Не удалось войти. Попробуйте ещё раз.'; $('#login-err').hidden = false;
    history.replaceState(null, '', location.pathname);
}
$('#logout').addEventListener('click', async () => { await post('/logout'); location.reload(); });

async function checkAuth() { const { ok, body } = await get('/whoami'); return (ok && body?.authed === true) ? body : null; }

async function enterApp() {
    $('#login').hidden = true; $('#app').hidden = false;
    await load();
    setInterval(load, 20000);
}

async function load() {
    const { ok, body } = await get('/me');
    if (ok) render(body);
    loadAdHistory();
    loadCards();
    wirePlogFilters();
    loadActivity();
}

// ---- My verification cards (read-only, same funnel as admin "Экстренно") ----
function fmtSec(s) {
    if (s == null) return '—';
    if (s < 60) return `${s} сек`;
    const m = Math.floor(s / 60), r = s % 60;
    if (m < 60) return r ? `${m} мин ${r} сек` : `${m} мин`;
    const h = Math.floor(m / 60);
    return `${h} ч ${m % 60} мин`;
}
function cardStatRow(label, w) {
    const c = (v) => (v == null ? 0 : v);
    return `<tr><td>${esc(label)}</td><td class="num">${c(w?.hour)}</td><td class="num">${c(w?.day)}</td><td class="num">${c(w?.week)}</td></tr>`;
}
function pcardBlock(c) {
    const st = c.stats || {};
    const role = c.roleName ? '@' + esc(c.roleName) : (c.roleId ? esc(c.roleId) : 'роль по умолчанию');
    const chan = c.channelName ? '#' + esc(c.channelName) : esc(c.channelId || '');
    const link = c.link ? ` · <a href="${esc(c.link)}" target="_blank" rel="noopener">↗ сообщение</a>` : '';
    const avg = c.avgVerifySeconds != null ? ` · ⏱ ~${esc(fmtSec(c.avgVerifySeconds))}` : '';
    return `
      <div class="vcard" data-mid="${esc(c.messageId)}">
        <div class="vcard-head">${srvIcon(c.guildName, c.guildIcon)}<span><b>${esc(c.guildName || 'Сервер')}</b> · ${chan}${link}</span></div>
        <div class="vcard-meta">Роль: ${role}${avg}</div>
        <div class="table-wrap" style="margin-top:12px"><table>
          <thead><tr><th>Воронка</th><th class="num">час</th><th class="num">день</th><th class="num">неделя</th></tr></thead>
          <tbody>
            ${cardStatRow('1. Клик (начали)', st.clicks)}
            ${cardStatRow('2. Заход проверен', st.checked)}
            ${cardStatRow('3. Остались', st.stayed)}
          </tbody>
        </table></div>
        <div class="vcard-actions">
          <button class="btn-mini" data-card="fix">Встряхнуть</button>
          <button class="btn-mini" data-card="owner">Владелец…</button>
          <button class="btn-mini" data-card="role">Роль…</button>
          <button class="btn-mini" data-card="desc">Описание…</button>
          <button class="btn-mini" data-card="republish">Перепубликовать</button>
          <button class="btn-mini off" data-card="reset-role">Сбросить роль</button>
          <button class="btn-mini off" data-card="delete">Удалить</button>
        </div>
      </div>`;
}
let lastPCards = [];
async function loadCards() {
    const { ok, body } = await get('/cards');
    if (!ok) return;
    const list = body.cards || [];
    lastPCards = list;
    const section = $('#vcards-section');
    if (!list.length) { section.hidden = true; return; }
    section.hidden = false;
    const avgEl = $('#vcards-avg');
    if (avgEl) {
        if (body.avgVerifySeconds != null) { avgEl.textContent = `⏱ Среднее время от клика до проверенного захода: ~${fmtSec(body.avgVerifySeconds)}`; avgEl.hidden = false; }
        else avgEl.hidden = true;
    }
    $('#vcards-list').innerHTML = list.map(pcardBlock).join('');
    $('#vcards-list').querySelectorAll('.vcard').forEach((row) => {
        const mid = row.dataset.mid;
        row.querySelectorAll('[data-card]').forEach((b) => b.onclick = () => pcardAction(b.dataset.card, mid));
    });
}

function pcardErr(code) {
    return ({
        'not-found': 'Сообщение не найдено (бот не видит канал?)',
        'not-own-message': 'Это сообщение не от нашего бота',
        'not-tracked': 'Карточка не в списке',
        'not-your-card': 'Это не ваша карточка',
        'no-owner': 'Не удалось определить владельца',
        'no-role': 'Роль карточки не найдена на сервере',
        'no-guild': 'Сервер недоступен боту',
        'no-perms': 'У бота нет прав (нужно «Управление ролями»)',
        'role-managed': 'Это служебная роль — пересоздать нельзя',
        'role-everyone': 'Нельзя сбросить роль @everyone',
        'role-too-high': 'Роль бота ниже этой роли — поднимите роль бота выше',
        'create-failed': 'Не удалось создать новую роль',
        'send-failed': 'Не удалось отправить новое сообщение'
    })[code] || (code || 'Ошибка');
}

async function pcardAction(action, messageId) {
    if (action === 'fix') {
        const { ok, body } = await post('/cards/fix', { messageId });
        toast(ok ? 'Карточка пересобрана' : pcardErr(body?.error), ok ? 'ok' : 'err'); if (ok) loadCards();
    } else if (action === 'republish') {
        if (!confirm('Удалить старое сообщение и опубликовать карточку заново (владелец и роль сохранятся)?')) return;
        const { ok, body } = await post('/cards/republish', { messageId });
        toast(ok ? 'Карточка перепубликована' : pcardErr(body?.error), ok ? 'ok' : 'err'); if (ok) loadCards();
    } else if (action === 'delete') {
        if (!confirm('Удалить карточку (сообщение бота будет удалено)?')) return;
        const { ok, body } = await post('/cards/delete', { messageId });
        toast(ok ? 'Карточка удалена' : pcardErr(body?.error), ok ? 'ok' : 'err'); if (ok) loadCards();
    } else if (action === 'reset-role') {
        if (!confirm('Сбросить роль верификации?\n\nБудет создана НОВАЯ роль с теми же правами, правами на каналах, названием, цветом и иконкой. Старая роль будет удалена у всех участников, а карточка сразу переключится на новую роль.\n\nВсем участникам придётся пройти верификацию заново. Продолжить?')) return;
        const { ok, body } = await post('/cards/reset-role', { messageId });
        toast(ok ? `Роль сброшена${body?.roleName ? ': @' + body.roleName : ''}` : pcardErr(body?.error), ok ? 'ok' : 'err'); if (ok) loadCards();
    } else if (action === 'owner') {
        const raw = prompt('Новый владелец — Discord ID:');
        if (raw === null) return;
        const creatorId = raw.trim();
        if (!creatorId || !/^\d{17,20}$/.test(creatorId)) { toast('Неверный ID', 'err'); return; }
        if (creatorId !== window.__PARTNER_ID__ && !confirm('Вы указываете чужой ID — карточка перестанет быть вашей и пропадёт из кабинета. Продолжить?')) return;
        const { ok, body } = await post('/cards/edit', { messageId, creatorId });
        toast(ok ? 'Владелец изменён' : pcardErr(body?.error), ok ? 'ok' : 'err'); if (ok) loadCards();
    } else if (action === 'role') {
        const raw = prompt('Новая роль — ID (пусто = роль по умолчанию «Verified»):');
        if (raw === null) return;
        const roleId = raw.trim();
        if (roleId && !/^\d{17,20}$/.test(roleId)) { toast('Неверный ID роли', 'err'); return; }
        const { ok, body } = await post('/cards/edit', { messageId, roleId });
        toast(ok ? 'Роль изменена' : pcardErr(body?.error), ok ? 'ok' : 'err'); if (ok) loadCards();
    } else if (action === 'desc') {
        const card = lastPCards.find((c) => c.messageId === messageId);
        openPcardDescModal(messageId, card ? (card.customDescription ? card.description : '') : '');
    }
}

function openPcardDescModal(messageId, desc) {
    const modal = $('#pcard-desc-modal');
    if (!modal) return;
    $('#pcard-desc-input').value = desc || '';
    modal.dataset.mid = messageId;
    modal.hidden = false;
    $('#pcard-desc-input').focus();
}
(() => {
    const modal = document.getElementById('pcard-desc-modal');
    if (!modal) return;
    const close = () => { modal.hidden = true; };
    document.getElementById('pcard-desc-close')?.addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    document.getElementById('pcard-desc-save')?.addEventListener('click', async () => {
        const mid = modal.dataset.mid;
        const description = $('#pcard-desc-input').value;
        const { ok, body } = await post('/cards/edit', { messageId: mid, description });
        if (ok) { close(); toast('Описание обновлено'); loadCards(); }
        else toast(pcardErr(body?.error), 'err');
    });
})();

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

// ---- Activity log (журнал: начисления, списания, выдача/снятие верифки) ----
let plogServers = {};
let plogUserTimer = null;
const PLOG_LABEL = {
    grant_paid: { cls: 'g', title: 'Выдана верификация', tag: 'начислено' },
    grant_no_ad: { cls: 'n', title: 'Выдана верификация · без оплаты', tag: 'рекламы не было' },
    grant_dup_join: { cls: 'n', title: 'Выдана верификация · без оплаты', tag: 'уже был на сервере' },
    grant_already_verified: { cls: 'n', title: 'Повторная попытка', tag: 'уже верифицирован' },
    debit_left: { cls: 'd', title: 'Списание', tag: 'участник ушёл' },
    unverify_left: { cls: 'u', title: 'Снята верификация', tag: 'участник ушёл' }
};
function plogLabel(e) {
    return PLOG_LABEL[`${e.type}_${e.reason}`] || { cls: 'n', title: e.type, tag: e.reason || '' };
}
function plogRow(e, servers) {
    const L = plogLabel(e);
    const amt = e.type === 'debit'
        ? `<span class="plog-amt neg">−${money(e.amount)}</span>`
        : (e.type === 'grant' && e.reason === 'paid' && e.amount ? `<span class="plog-amt pos">+${money(e.amount)}</span>` : '');
    const sv = e.guildId ? (servers[e.guildId] || e.guildId) : '';
    const usr = e.userId ? `<span class="plog-usr">ID ${esc(e.userId)}</span>` : '';
    return `<div class="plog-row plog-${L.cls}">
        <span class="plog-dot"></span>
        <div class="plog-main">
          <div class="plog-title">${esc(L.title)} ${L.tag ? `<span class="plog-tag">${esc(L.tag)}</span>` : ''}</div>
          <div class="plog-sub">${sv ? `<span class="plog-sv">${esc(sv)}</span>` : ''}${usr}</div>
        </div>
        <div class="plog-right">${amt}<span class="plog-time">${esc(relTime(e.ts))}</span></div>
      </div>`;
}
function plogQuery() {
    const v = (id) => ($(id)?.value || '').trim();
    const p = new URLSearchParams();
    for (const [k, id] of [['type', '#plf-type'], ['reason', '#plf-reason'], ['server', '#plf-server'], ['period', '#plf-period'], ['sort', '#plf-sort']]) {
        const val = v(id); if (val) p.set(k, val);
    }
    const u = v('#plf-user'); if (/^\d{17,20}$/.test(u)) p.set('user', u);
    return p.toString();
}
function fillPlogServers(servers) {
    let changed = false;
    for (const [gid, name] of Object.entries(servers || {})) if (!(gid in plogServers)) { plogServers[gid] = name || gid; changed = true; }
    const sel = $('#plf-server');
    if (!sel || !changed) return;
    const cur = sel.value;
    sel.innerHTML = '<option value="">Все серверы</option>' +
        Object.entries(plogServers).map(([gid, name]) => `<option value="${esc(gid)}">${esc(name || gid)}</option>`).join('');
    sel.value = cur;
}
let plogEvents = [], plogServersLast = {}, plogPage = 0;
const PLOG_PER_PAGE = 10;
async function loadActivity() {
    const list = $('#plog-list');
    const { ok, body } = await get('/activity?' + plogQuery());
    if (!ok) { if (list) list.innerHTML = '<div class="muted">Не удалось загрузить журнал.</div>'; $('#plog-pager').hidden = true; return; }
    fillPlogServers(body.servers || {});
    plogEvents = body.events || [];
    plogServersLast = body.servers || {};
    plogPage = 0;
    renderPlogPage();
}
function renderPlogPage() {
    const list = $('#plog-list'); if (!list) return;
    const pages = Math.max(1, Math.ceil(plogEvents.length / PLOG_PER_PAGE));
    if (plogPage > pages - 1) plogPage = pages - 1;
    if (plogPage < 0) plogPage = 0;
    const slice = plogEvents.slice(plogPage * PLOG_PER_PAGE, plogPage * PLOG_PER_PAGE + PLOG_PER_PAGE);
    list.innerHTML = slice.length
        ? slice.map((e) => plogRow(e, plogServersLast)).join('')
        : '<div class="muted">Событий не найдено.</div>';
    const pager = $('#plog-pager');
    if (!pager) return;
    if (plogEvents.length <= PLOG_PER_PAGE) { pager.hidden = true; pager.innerHTML = ''; return; }
    pager.hidden = false;
    pager.innerHTML =
        `<button class="btn ghost sm" id="plog-prev"${plogPage === 0 ? ' disabled' : ''}>← Назад</button>` +
        `<span class="wd-page muted sm">Стр. ${plogPage + 1} из ${pages}</span>` +
        `<button class="btn ghost sm" id="plog-next"${plogPage >= pages - 1 ? ' disabled' : ''}>Вперёд →</button>`;
    const prev = $('#plog-prev'), next = $('#plog-next');
    if (prev) prev.onclick = () => { if (plogPage > 0) { plogPage--; renderPlogPage(); } };
    if (next) next.onclick = () => { if (plogPage < pages - 1) { plogPage++; renderPlogPage(); } };
}
function wirePlogFilters() {
    ['#plf-type', '#plf-reason', '#plf-server', '#plf-period', '#plf-sort'].forEach((id) => {
        const el = $(id); if (el && !el.dataset.wired) { el.dataset.wired = '1'; el.onchange = loadActivity; }
    });
    const u = $('#plf-user');
    if (u && !u.dataset.wired) { u.dataset.wired = '1'; u.oninput = () => { clearTimeout(plogUserTimer); plogUserTimer = setTimeout(loadActivity, 400); }; }
}

function render(d) {
    window.__PARTNER_ID__ = d.userId || window.__PARTNER_ID__;
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

    // Auto-payout on (check or direct transfer) → requisites aren't needed; hide the block.
    const reqSection = $('#p-req-section');
    if (reqSection) reqSection.hidden = Boolean(d.autoPayout || d.autoTransfer);

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

    // Withdrawals — 10 per page, prev/next for the rest.
    lastWithdrawals = d.withdrawals || [];
    renderWithdrawals();
}

let lastWithdrawals = [];
let wdPage = 0;
const WD_PER_PAGE = 10;
function renderWithdrawals() {
    const wds = lastWithdrawals;
    const st = (s) => s === 'completed' ? '<span class="chip green">выполнен</span>' : '<span class="chip amber">в обработке</span>';
    const pages = Math.max(1, Math.ceil(wds.length / WD_PER_PAGE));
    if (wdPage > pages - 1) wdPage = pages - 1;
    if (wdPage < 0) wdPage = 0;
    const slice = wds.slice(wdPage * WD_PER_PAGE, wdPage * WD_PER_PAGE + WD_PER_PAGE);
    $('#p-wd').innerHTML = `
      <thead><tr><th>Дата</th><th class="num">Сумма</th><th>Статус</th></tr></thead>
      <tbody>${slice.length ? slice.map((w) => `<tr><td class="muted">${esc(relTime(w.createdAt))}</td><td class="num">${money(w.amount)}</td><td>${st(w.status)}</td></tr>`).join('') : '<tr><td colspan="3" class="muted">Выплат пока не было</td></tr>'}</tbody>`;
    const pager = $('#p-wd-pager');
    if (!pager) return;
    if (wds.length <= WD_PER_PAGE) { pager.hidden = true; pager.innerHTML = ''; return; }
    pager.hidden = false;
    pager.innerHTML =
        `<button class="btn ghost sm" id="wd-prev"${wdPage === 0 ? ' disabled' : ''}>← Назад</button>` +
        `<span class="wd-page muted sm">Стр. ${wdPage + 1} из ${pages}</span>` +
        `<button class="btn ghost sm" id="wd-next"${wdPage >= pages - 1 ? ' disabled' : ''}>Вперёд →</button>`;
    const prev = $('#wd-prev'), next = $('#wd-next');
    if (prev) prev.onclick = () => { if (wdPage > 0) { wdPage--; renderWithdrawals(); } };
    if (next) next.onclick = () => { if (wdPage < pages - 1) { wdPage++; renderWithdrawals(); } };
}

$('#p-req-save').addEventListener('click', async () => {
    const { ok, body } = await put('/requisites', { requisites: $('#p-req').value });
    if (ok) toast('Реквизиты сохранены'); else toast(body?.error || 'Не удалось сохранить', 'err');
});

// Boot
(async () => { const who = await checkAuth(); if (who) { enterApp(); setupCabNav(who.isAdmin); } })();
