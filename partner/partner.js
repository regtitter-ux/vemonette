// Partner cabinet — vanilla JS.
const API = (window.__VEMONI_API_BASE__ || '').replace(/\/+$/, '') + '/partner';

// Session token (localStorage) — alternative to the cross-site cookie that some
// browsers block; sent as a Bearer header.
const TOKEN_KEY = 'vemoni_tok';
const getTok = () => { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; } };
const setTok = (v) => { try { v ? localStorage.setItem(TOKEN_KEY, v) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } };
(() => { const m = (location.hash || '').match(/[#&]t=([^&]+)/); if (m) { try { setTok(decodeURIComponent(m[1])); } catch { /* ignore */ } history.replaceState(null, '', location.pathname + location.search); } })();

async function api(path, opts = {}) {
    let res;
    const headers = opts.body ? { 'Content-Type': 'application/json' } : {};
    const tk = getTok(); if (tk) headers.Authorization = 'Bearer ' + tk;
    try {
        res = await fetch(API + path, { credentials: 'include', ...opts, headers });
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
  // section tabs
  'Обзор':'Overview','Рекламы':'Ads','Карточки':'Cards','Журнал':'Activity','Выплаты':'Payouts',
  'Пока нет активных реклам и истории показов.':'No active ads or shown-ad history yet.','У вас пока нет карточек верификации.':'You have no verification cards yet.',
  'Главная':'Home','Заказы':'Orders','Партнёр':'Partner','Инвест':'Invest','Админка':'Admin',
  'Партнёрам':'For partners','Покупателям':'For buyers','Инвесторам':'For investors','Администраторам':'For admins',
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
  'уже верифицирован':'already verified','участник ушёл':'member left',
  // granular no-ad reasons (row tags)
  'реклама отключена':'ads disabled','реклама отключена на сервере':'ads disabled on this server',
  'рекламы скрыты':'ads hidden','уже в рекламируемых серверах':'already in advertised servers',
  'лимит показов исчерпан':'display limit reached','нет активных реклам':'no active ads',
  // granular no-ad reasons (filter options)
  'Реклама отключена':'Ads disabled','Отключена на сервере':'Disabled on server','Рекламы скрыты':'Ads hidden',
  'Уже в рекламе':'Already in the ad','Лимит показов':'Display limit','Нет реклам':'No ads',
  // money credits / debits (log rows + filter options)
  'Начисления':'Credits','По сумме':'By amount','Без оплаты':'Unpaid',
  'Оплачено — заход':'Paid — join','Реферальный бонус':'Referral bonus','Вывод из инвестиций':'Investment withdrawal',
  'Возврат выплаты':'Payout refund','Начисление вручную':'Manual credit','Выплата средств':'Payout',
  'Возврат реф. бонуса':'Referral bonus reversed','Списание вручную':'Manual debit','Участник ушёл (возврат)':'Member left (clawback)',
  'Корректировка баланса':'Balance adjustment','Выплата':'Payout',
  '10% с вывода реферала':"10% of referral's withdrawal",'на основной баланс':'to main balance',
  'перевод не прошёл':'transfer failed','начисление вручную':'manual credit','вывод':'withdrawal',
  'заход реферала отменён':'referral join reversed','списание вручную':'manual debit',
  // Referrals tab
  'Рефералы':'Referrals','Рефералов':'Referrals','Активных':'Active','Заработано с рефералов':'Earned from referrals',
  'Ожидает вывода':'Pending withdrawal','выведено':'withdrawn','Сервер:':'Server:','Не удалось загрузить рефералов.':'Could not load referrals.',
  'Приглашайте пользователей — и получайте 10% от каждого их вывода. Ниже — кого вы пригласили и сколько это принесло. Статистика собрана по уже имеющимся данным.':'Invite users and earn 10% of every withdrawal they make. Below is who you invited and how much it brought in. Stats are reconstructed from existing data.',
  'У вас пока нет рефералов. Приглашайте пользователей и получайте 10% с каждого их вывода.':'You have no referrals yet. Invite users and earn 10% of each withdrawal they make.'
};
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
  // active ads + priority / hide
  'Активные рекламы':'Active ads',
  'Рекламы, доступные выбранному серверу. Для каждого сервера отдельно можно: отметить рекламу приоритетной (★), чтобы показывать её первой, пока кампания не завершится или вы не выберете другую; либо скрыть рекламу, чтобы она не показывалась на этом сервере. Без приоритета работает обычное умное распределение.':'Ads available to the selected server. For each server separately you can: mark an ad as priority (★) to show it first until its campaign finishes or you pick another; or hide an ad so it is not shown on that server. Without a priority the normal smart distribution applies.',
  'Приоритет':'Priority','Скрыто':'Hidden','Скрыть':'Hide','Показать':'Show','Сейчас нет активных реклам, доступных этому серверу.':'There are no active ads available to this server right now.',
  'Приоритет установлен':'Priority set','Приоритет снят':'Priority cleared','Эта реклама сейчас недоступна.':'This ad is not available right now.','Не удалось сохранить приоритет.':'Could not save the priority.',
  'Реклама скрыта на этом сервере':'Ad hidden on this server','Реклама снова показывается':'Ad is shown again','Не удалось изменить видимость рекламы.':'Could not change the ad visibility.',
  // activity-log directions (who joined/left which sponsor)
  'зашёл в':'joined','ушёл из':'left from','уже был в':'already in',
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

// ---------- Alternative login: one-time code via Discord DM ----------
(() => {
    const toggle = $('#altToggle'); if (!toggle) return;
    const lang = (localStorage.getItem('vemoni_lang') === 'en') ? 'en' : 'ru';
    const T = ({
        ru: { or: 'или', toggle: 'Войти по коду', get: 'Получить код', login: 'Войти', unit: 'мин',
            note: 'Для тех, кто на сервере с нашим ботом — пришлём код в личные сообщения Discord.',
            sent: 'Код отправлен в личные сообщения Discord. Введите его ниже.',
            nodm: 'Не удалось отправить ЛС. Проверьте, что вы на сервере с нашим ботом и что у вас открыты личные сообщения.',
            badid: 'Введите корректный Discord ID.', sending: 'Отправляем…', checking: 'Проверяем…',
            cooldown: (x) => `Новый код можно запросить через ${x}.`, badcode: (n) => `Неверный код. Осталось попыток: ${n}.`,
            expired: 'Код истёк — запросите новый.', toomany: 'Слишком много попыток — запросите новый код.', nocode: 'Сначала запросите код.' },
        en: { or: 'or', toggle: 'Log in with a code', get: 'Get code', login: 'Log in', unit: 'min',
            note: "For members of a server with our bot — we'll DM the code to you on Discord.",
            sent: 'Code sent to your Discord DMs. Enter it below.',
            nodm: "Couldn't DM you. Make sure you share a server with our bot and your DMs are open.",
            badid: 'Enter a valid Discord ID.', sending: 'Sending…', checking: 'Checking…',
            cooldown: (x) => `You can request a new code in ${x}.`, badcode: (n) => `Wrong code. Attempts left: ${n}.`,
            expired: 'Code expired — request a new one.', toomany: 'Too many attempts — request a new code.', nocode: 'Request a code first.' }
    })[lang];
    $('#altOr').textContent = T.or; toggle.textContent = T.toggle; $('#altNote').textContent = T.note;
    $('#altReq').textContent = T.get; $('#altVerify').textContent = T.login;
    const body = $('#altBody'), msg = $('#altMsg'), step2 = $('#altStep2');
    const idInp = $('#altId'), codeInp = $('#altCode'), reqBtn = $('#altReq'), verBtn = $('#altVerify');
    const showMsg = (txt, kind) => { msg.textContent = txt || ''; msg.className = 'alt-msg ' + (kind || ''); msg.hidden = !txt; };
    const fmtWait = (s) => `${Math.max(1, Math.ceil((s || 3600) / 60))} ${T.unit}`;
    const cleanId = () => (idInp.value || '').replace(/\D/g, '').slice(0, 20);
    toggle.addEventListener('click', () => { const open = body.hidden; body.hidden = !open; toggle.classList.toggle('on', open); if (open) idInp.focus(); });
    reqBtn.addEventListener('click', async () => {
        const uid = cleanId(); if (!/^\d{17,20}$/.test(uid)) { showMsg(T.badid, 'err'); return; }
        reqBtn.disabled = true; showMsg(T.sending, '');
        const { ok, status, body: b } = await post('/code/request', { userId: uid });
        reqBtn.disabled = false;
        if (ok) { step2.hidden = false; showMsg(T.sent, 'ok'); codeInp.focus(); return; }
        if (status === 429) showMsg(T.cooldown(fmtWait(b?.retryAfterSec)), 'err');
        else if (b?.error === 'no-dm') showMsg(T.nodm, 'err');
        else showMsg(T.badid, 'err');
    });
    verBtn.addEventListener('click', async () => {
        const uid = cleanId(), code = (codeInp.value || '').replace(/\D/g, '');
        if (!/^\d{17,20}$/.test(uid)) { showMsg(T.badid, 'err'); return; }
        verBtn.disabled = true; showMsg(T.checking, '');
        const { ok, body: b } = await post('/code/verify', { userId: uid, code });
        verBtn.disabled = false;
        if (ok) { if (b?.token) setTok(b.token); showMsg('', ''); location.reload(); return; }
        const e = b?.error;
        if (e === 'bad-code') showMsg(T.badcode(b?.attemptsLeft ?? 0), 'err');
        else if (e === 'expired') showMsg(T.expired, 'err');
        else if (e === 'too-many') showMsg(T.toomany, 'err');
        else if (e === 'no-code') showMsg(T.nocode, 'err');
        else showMsg(T.badid, 'err');
    });
    idInp.addEventListener('keydown', (e) => { if (e.key === 'Enter') reqBtn.click(); });
    codeInp.addEventListener('keydown', (e) => { if (e.key === 'Enter') verBtn.click(); });
})();
if (new URLSearchParams(location.search).get('login') === 'denied') {
    $('#login-err').textContent = 'Не удалось войти. Попробуйте ещё раз.'; $('#login-err').hidden = false;
    history.replaceState(null, '', location.pathname);
}
// remembers the last known auth state so the next page load can show the app
// immediately instead of flashing the login screen (see the <head> pre-auth script)
const setAuthed = (v) => { try { v ? localStorage.setItem('vemoni_authed', '1') : localStorage.removeItem('vemoni_authed'); } catch (_) {} };
$('#logout').addEventListener('click', async () => { await post('/logout'); setTok(''); setAuthed(false); location.reload(); });

async function checkAuth() { const { ok, body } = await get('/whoami'); return (ok && body?.authed === true) ? body : null; }

async function enterApp() {
    setAuthed(true);
    $('#login').hidden = true; $('#app').hidden = false;
    await load();
    setInterval(load, 20000);
}

// Section tabs: show one category at a time instead of one long scroll.
function wireTabs() {
    const tabs = document.querySelectorAll('#p-tabs .p-tab');
    tabs.forEach((b) => { if (b.dataset.wired) return; b.dataset.wired = '1'; b.onclick = () => {
        tabs.forEach((x) => x.classList.toggle('active', x === b));
        document.querySelectorAll('.p-pane').forEach((p) => p.classList.toggle('active', p.dataset.pane === b.dataset.pane));
    }; });
}
// Per-tab empty placeholders — shown only when that tab's sections are all hidden.
function refreshEmpties() {
    const vis = (id) => { const e = $('#' + id); return e && !e.hidden; };
    const a = $('#ads-empty'); if (a) a.hidden = vis('pads-section') || vis('adhist-section');
    const c = $('#cards-empty'); if (c) c.hidden = vis('vcards-section');
}

async function load() {
    wireTabs();
    const { ok, body } = await get('/me');
    if (ok) render(body);
    loadPartnerAds();
    loadAdHistory();
    loadCards();
    wirePlogFilters();
    loadActivity();
    loadReferrals();
    refreshEmpties();
}

// ---- Referrals: who this partner invited and what they earned (10% of each
// referred user's withdrawals), reconstructed server-side from existing data. ----
async function loadReferrals() {
    const cards = $('#refs-cards'), list = $('#refs-list');
    const { ok, body } = await get('/referrals');
    if (!ok || !body) { if (list) list.innerHTML = '<div class="muted">Не удалось загрузить рефералов.</div>'; return; }
    const pct = Math.round((body.rate || 0.1) * 100);
    if (cards) cards.innerHTML = [
        { k: 'Рефералов', v: body.count },
        { k: 'Активных', v: body.activeCount },
        { k: 'Заработано с рефералов', v: money(body.totalEarned) },
        { k: 'Ожидает вывода', v: money(body.pending) }
    ].map((c) => `<div class="pcard"><div class="k">${esc(c.k)}</div><div class="v">${esc(String(c.v))}</div></div>`).join('');
    const refs = body.referrals || [];
    if (!refs.length) { if (list) list.innerHTML = `<div class="muted">У вас пока нет рефералов. Приглашайте пользователей и получайте ${pct}% с каждого их вывода.</div>`; return; }
    list.innerHTML = '<div class="ref-list">' + refs.map(refRow).join('') + '</div>';
}
function refRow(r) {
    const name = r.name || r.username || ('ID ' + r.userId);
    const letter = (String(name).trim()[0] || '?').toUpperCase();
    const av = r.avatar
        ? `<span class="ref-av" style="background-image:url('${esc(r.avatar)}')"></span>`
        : `<span class="ref-av ref-av-l">${esc(letter)}</span>`;
    const handle = r.username ? '@' + esc(r.username) : ('ID ' + esc(r.userId));
    const f = r.funnel || {};
    const frow = (label, w) => `<tr><td>${label}</td><td class="num">${(w && w.hour) || 0}</td><td class="num">${(w && w.day) || 0}</td><td class="num">${(w && w.week) || 0}</td></tr>`;
    const dim = r.active ? '' : ' ref-idle';
    return `<div class="ref-card${dim}">
        <div class="ref-head">
          ${av}
          <div class="ref-id"><b>${esc(name)}</b><span class="muted sm">${handle}</span></div>
          <div class="ref-earn">+${money(r.earned)}</div>
        </div>
        <div class="ref-meta muted sm"><span>Сервер:</span> <b>${r.server ? esc(r.server) : '—'}</b> · <span>выведено</span> ${money(r.withdrawn)}</div>
        <div class="table-wrap" style="margin-top:10px"><table>
          <thead><tr><th>Воронка</th><th class="num">час</th><th class="num">день</th><th class="num">неделя</th></tr></thead>
          <tbody>
            ${frow('1. Клик (начали)', f.clicks)}
            ${frow('2. Заход проверен', f.checked)}
            ${frow('3. Остались', f.stayed)}
          </tbody>
        </table></div>
      </div>`;
}

// ---- Active ads available to the partner's servers + priority selection ----
let pAds = { priorityCampaign: null, servers: [] };
let pAdsSel = null;
async function loadPartnerAds() {
    const { ok, body } = await get('/ads');
    if (!ok) return;
    pAds = body || { priorityCampaign: null, servers: [] };
    renderPartnerAds();
    refreshEmpties();
}
function renderPartnerAds() {
    const section = $('#pads-section');
    const servers = pAds.servers || [];
    if (!servers.length) { section.hidden = true; return; }
    section.hidden = false;
    if (!pAdsSel || !servers.some((s) => s.guildId === pAdsSel)) pAdsSel = servers[0].guildId;

    // Server switcher (only when the partner has more than one server).
    const sw = $('#pads-switch');
    if (servers.length > 1) {
        sw.hidden = false;
        sw.innerHTML = servers.map((s) =>
            `<button class="sw-btn${s.guildId === pAdsSel ? ' active' : ''}" data-sv="${esc(s.guildId)}">${srvIcon(s.name, s.icon)}<span>${esc(s.name || s.guildId)}</span></button>`
        ).join('');
        sw.querySelectorAll('[data-sv]').forEach((b) => b.onclick = () => { pAdsSel = b.dataset.sv; renderPartnerAds(); });
    } else { sw.hidden = true; sw.innerHTML = ''; }

    const s = servers.find((x) => x.guildId === pAdsSel) || servers[0];
    const ads = s.ads || [];
    $('#pads-list').innerHTML = ads.length ? ads.map((a) => `
      <div class="pad-row${a.isPriority ? ' pad-prio' : ''}${a.isHidden ? ' pad-hidden' : ''}">
        <label class="pad-check" title="Приоритет">
          <input type="checkbox" data-prio="${esc(a.campaignId)}" ${a.isPriority ? 'checked' : ''} ${a.isHidden ? 'disabled' : ''} />
          <span class="pad-star">★</span>
        </label>
        <div class="pad-main">${srvIcon(a.sponsorName, a.sponsorIcon)}<span class="pad-name">${esc(a.sponsorName || a.sponsorGuildId)}</span>${a.isPriority ? '<span class="pad-badge">Приоритет</span>' : ''}${a.isHidden ? '<span class="pad-badge hid">Скрыто</span>' : ''}</div>
        <div class="pad-remain"><b>${a.delivered}/${a.purchased}</b></div>
        <button class="btn-mini${a.isHidden ? '' : ' off'}" data-hide="${esc(a.campaignId)}" data-h="${a.isHidden ? '1' : '0'}">${a.isHidden ? 'Показать' : 'Скрыть'}</button>
      </div>`).join('') : '<div class="muted">Сейчас нет активных реклам, доступных этому серверу.</div>';

    const lockRows = () => $('#pads-list').querySelectorAll('input,button').forEach((x) => (x.disabled = true));

    $('#pads-list').querySelectorAll('[data-prio]').forEach((cb) => cb.onchange = async () => {
        const cid = cb.dataset.prio;
        const makePriority = cb.checked;
        lockRows();
        const { ok, body } = await put('/priority', { guildId: pAdsSel, campaignId: makePriority ? cid : '' });
        if (!ok) toast(body?.error === 'not-available' ? 'Эта реклама сейчас недоступна.' : 'Не удалось сохранить приоритет.', 'err');
        else toast(makePriority ? 'Приоритет установлен' : 'Приоритет снят');
        await loadPartnerAds();
    });

    $('#pads-list').querySelectorAll('[data-hide]').forEach((btn) => btn.onclick = async () => {
        const cid = btn.dataset.hide;
        const nowHidden = btn.dataset.h === '1';
        lockRows();
        const { ok } = await put('/hide', { guildId: pAdsSel, campaignId: cid, hidden: !nowHidden });
        if (!ok) toast('Не удалось изменить видимость рекламы.', 'err');
        else toast(!nowHidden ? 'Реклама скрыта на этом сервере' : 'Реклама снова показывается');
        await loadPartnerAds();
    });
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
    if (!list.length) { section.hidden = true; refreshEmpties(); return; }
    section.hidden = false;
    refreshEmpties();
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
    refreshEmpties();
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
const NOPAY = 'Выдана верификация · без оплаты';
const PLOG_LABEL = {
    grant_paid: { cls: 'g', title: 'Выдана верификация', tag: 'начислено' },
    grant_no_ad: { cls: 'n', title: NOPAY, tag: 'рекламы не было' },
    grant_ads_off: { cls: 'n', title: NOPAY, tag: 'реклама отключена' },
    grant_server_off: { cls: 'n', title: NOPAY, tag: 'реклама отключена на сервере' },
    grant_all_hidden: { cls: 'n', title: NOPAY, tag: 'рекламы скрыты' },
    grant_already_member: { cls: 'n', title: NOPAY, tag: 'уже в рекламируемых серверах' },
    grant_capped: { cls: 'n', title: NOPAY, tag: 'лимит показов исчерпан' },
    grant_no_inventory: { cls: 'n', title: NOPAY, tag: 'нет активных реклам' },
    grant_dup_join: { cls: 'n', title: NOPAY, tag: 'уже был на сервере' },
    grant_already_verified: { cls: 'n', title: 'Повторная попытка', tag: 'уже верифицирован' },
    debit_left: { cls: 'd', title: 'Списание', tag: 'участник ушёл' },
    unverify_left: { cls: 'u', title: 'Снята верификация', tag: 'участник ушёл' },
    // money credits
    credit_referral_bonus: { cls: 'g', title: 'Реферальный бонус', tag: '10% с вывода реферала' },
    credit_invest_withdraw: { cls: 'g', title: 'Вывод из инвестиций', tag: 'на основной баланс' },
    credit_payout_refund: { cls: 'g', title: 'Возврат выплаты', tag: 'перевод не прошёл' },
    credit_admin_credit: { cls: 'g', title: 'Корректировка баланса', tag: 'начисление вручную' },
    // money debits
    debit_payout: { cls: 'd', title: 'Выплата средств', tag: 'вывод' },
    debit_referral_clawback: { cls: 'd', title: 'Возврат реф. бонуса', tag: 'заход реферала отменён' },
    debit_admin_debit: { cls: 'd', title: 'Корректировка баланса', tag: 'списание вручную' }
};
function plogLabel(e) {
    return PLOG_LABEL[`${e.type}_${e.reason}`] || { cls: 'n', title: e.type, tag: e.reason || '' };
}
function plogRow(e, servers, users) {
    const L = plogLabel(e);
    const amt = (e.type === 'debit' && e.amount)
        ? `<span class="plog-amt neg">−${money(e.amount)}</span>`
        : ((e.type === 'credit' || (e.type === 'grant' && e.reason === 'paid')) && e.amount ? `<span class="plog-amt pos">+${money(e.amount)}</span>` : '');
    const sv = e.guildId ? (servers[e.guildId] || e.guildId) : '';
    const uname = e.userId ? (users && users[e.userId]) : '';
    const usr = e.userId ? `<span class="plog-usr">${uname ? `<b>${esc(uname)}</b> · ` : ''}ID ${esc(e.userId)}</span>` : '';
    // Sponsor server the member joined into / left from (where the log knows it),
    // with a direction word so "who + where" reads at a glance.
    const sp = e.sponsorGuildId ? (servers[e.sponsorGuildId] || e.sponsorGuildId) : '';
    const dir = (e.type === 'debit' || e.type === 'unverify') ? 'ушёл из'
        : (e.reason === 'dup_join' || e.reason === 'already_member') ? 'уже был в' : 'зашёл в';
    const spPart = sp ? `<span class="plog-sp">${dir}: ${esc(sp)}</span>` : '';
    return `<div class="plog-row plog-${L.cls}">
        <span class="plog-dot"></span>
        <div class="plog-main">
          <div class="plog-title">${esc(L.title)} ${L.tag ? `<span class="plog-tag">${esc(L.tag)}</span>` : ''}</div>
          <div class="plog-sub">${sv ? `<span class="plog-sv">${esc(sv)}</span>` : ''}${usr}${spPart}</div>
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
let plogEvents = [], plogServersLast = {}, plogUsersLast = {}, plogPage = 0;
const PLOG_PER_PAGE = 10;
async function loadActivity() {
    const list = $('#plog-list');
    const { ok, body } = await get('/activity?' + plogQuery());
    if (!ok) { if (list) list.innerHTML = '<div class="muted">Не удалось загрузить журнал.</div>'; $('#plog-pager').hidden = true; return; }
    fillPlogServers(body.servers || {});
    plogEvents = body.events || [];
    plogServersLast = body.servers || {};
    plogUsersLast = body.users || {};
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
        ? slice.map((e) => plogRow(e, plogServersLast, plogUsersLast)).join('')
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
(async () => {
    const who = await checkAuth();
    if (who) { enterApp(); setupCabNav(who); }
    else { setAuthed(false); document.documentElement.classList.remove('pre-auth'); $('#login').hidden = false; $('#app').hidden = true; }
})();
