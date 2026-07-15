// Admin panel — vanilla JS, no bundler.
// The bot's HTTPS URL is set via window.__VEMONI_API_BASE__ in index.html.
const API = (window.__VEMONI_API_BASE__ || '').replace(/\/+$/, '') + '/admin';

// ---------- i18n (navigation + login chrome; deeper content is RU) ----------
const I18N = {
    ru: { tab_bi: 'Обзор', tab_stats: 'Статистика', tab_adstats: 'Стата рекламы', tab_activity: 'Активность', tab_shares: 'Доли', tab_balances: 'Балансы', tab_templates: 'Шаблоны', tab_toggle: 'Экстренно', tab_feed: 'Лента', tab_lots: 'Лоты', tab_system: 'Система', tab_settings: 'Настройки', tab_admins: 'Админы', nav_home: 'Главная', nav_orders: 'Заказы', nav_partner: 'Партнёр', nav_investor: 'Инвест', logout: 'Выйти', login_hint: 'Войдите через Discord, чтобы получить доступ к панели.', login_btn: 'Войти через Discord' },
    en: { tab_bi: 'Overview', tab_stats: 'Statistics', tab_adstats: 'Ad stats', tab_activity: 'Activity', tab_shares: 'Shares', tab_balances: 'Balances', tab_templates: 'Templates', tab_toggle: 'Emergency', tab_feed: 'Feed', tab_lots: 'Lots', tab_system: 'System', tab_settings: 'Settings', tab_admins: 'Admins', nav_home: 'Home', nav_orders: 'Orders', nav_partner: 'Partner', nav_investor: 'Invest', logout: 'Log out', login_hint: 'Log in with Discord to access the panel.', login_btn: 'Log in with Discord' }
};
let adminLang = localStorage.getItem('vemoni_lang') || ((navigator.language || '').startsWith('en') ? 'en' : 'ru');
if (!I18N[adminLang]) adminLang = 'ru';
function applyAdminLang() {
    document.documentElement.lang = adminLang;
    document.querySelectorAll('[data-i18n]').forEach((el) => { const v = I18N[adminLang][el.dataset.i18n]; if (v) el.textContent = v; });
    document.querySelectorAll('.lang-switch button').forEach((b) => b.classList.toggle('active', b.dataset.lang === adminLang));
}
document.querySelectorAll('.lang-switch button').forEach((b) => b.addEventListener('click', () => {
    localStorage.setItem('vemoni_lang', b.dataset.lang); location.reload();
}));

// ---------- Full EN translation (runtime) ----------
// The whole panel is authored in Russian. Rather than thread a t() call through
// every one of the hundreds of render sites, we translate the rendered DOM live:
// exact-match for short table cells (WHOLE), substring phrases for the rest (TR),
// a few regex rules for interpolated strings, plus wrapped confirm/prompt/toast.
// A MutationObserver re-translates on every re-render. Switching language reloads
// (translation is one-way; RU is the source), so RU is always pristine.
const WHOLE = {
  'час':'hour','день':'day','неделя':'week','месяц':'month','эта':'this','сек':'s',
  'Всего':'Total','День':'Day','Неделя':'Week','Месяц':'Month','Доля':'Share','Роль':'Role',
  'Баланс':'Balance','Владелец':'Owner','Сервер':'Server','Реклама':'Ad','Действие':'Action',
  'Действия':'Actions','Пользователь':'User','Юзер':'User','Детали':'Details','Кто':'Who','Когда':'When',
  'Выведено':'Withdrawn','Верифаций':'Verifs','Рефералов':'Referrals','Ставка/100':'Rate/100',
  'Все':'All','Положительные':'Positive','Нулевые':'Zero','Отрицательные':'Negative','Настройки':'Settings',
  'Реквизиты':'Requisites','Воронка':'Funnel','Загрузка…':'Loading…','Пока пусто':'Nothing yet','Глобал':'Global',
  'Обзор':'Overview','Статистика':'Statistics','Экстренно':'Emergency','Система':'System','Лента':'Feed',
  'Шаблоны':'Templates','Админы':'Admins','Балансы':'Balances','Кран':'Kill-switch'
};
const TR_RE = [
  [/Лимит (\d+) установлен/g,'Limit $1 set'],
  [/на (\d+) серв(?:ере|ерах)/g,'on $1 server(s)'],
  [/…и ещё (\d+)/g,'…and $1 more'],
  [/(\d+) юзеров/g,'$1 users'],
  [/(\d+) заходов\b/g,'$1 joins'],
  [/(\d+) аккаунтов/g,'$1 accounts'],
  [/(\d+) дн\./g,'$1 d'],
  [/(\d+) шт\b/g,'$1 pcs'],
  [/серв(?:ере|ерах)\b/g,'server(s)']
];
const TR = {
  // login / chrome / banners
  'Войдите через Discord, чтобы получить доступ к панели.':'Log in with Discord to access the panel.',
  'Войти через Discord':'Log in with Discord','Выйти':'Log out',
  'Доступ запрещён — этого аккаунта нет среди админов.':'Access denied — this account is not an admin.',
  '👁 Просмотр от лица админа — часть функций скрыта':'👁 Viewing as an admin — some features are hidden',
  '👁 Просмотр от лица админа':'👁 View as an admin','Выйти из режима':'Exit mode',
  // BI / overview
  'Обзор':'Overview','Ключевые показатели':'Key metrics','Инвентарь рекламы':'Ad inventory','Выручка по неделям':'Revenue by week',
  'Продажи рекламы 30д':'Ad sales 30d','Выручка с заходов 30д':'Join revenue 30d','признаётся по мере доставки':'recognized as delivered',
  'Заходы 7д / 30д':'Joins 7d / 30d','Активные партнёры 7д / 30д':'Active partners 7d / 30d',
  'Отток (клаубэк, 30д)':'Churn (clawback, 30d)','доля ушедших из засчитанных':'share of counted joins that left',
  'Активные кампании':'Active campaigns','Покупатели за 30д':'Buyers 30d','всего':'total',
  'Спрос (не доставлено)':'Demand (undelivered)','сумма остатков активных кампаний':'sum of active campaign remainders',
  'Производительность':'Performance','средняя за 7 дней':'7-day average','Хватит на':'Covers',
  '🔴 перепродажа — заказов больше, чем сеть тянет':'🔴 oversold — more orders than the network can deliver','🟢 в норме':'🟢 healthy',
  'Выручка':'Revenue','Заходы':'Joins',
  // system
  'Мониторинг ботов':'Bot monitoring',
  'Серверы для выкупа инвайтов (инвесторам)':'Servers for invite buy-in (investors)',
  'Серверы появляются у инвесторов автоматически, когда выходят на порог активности (по умолчанию ≥10 проверенных заходов/сутки), и пропадают, если темп падает. Здесь можно принудительно открыть сервер ниже порога — но только если на нём есть активная карточка верификации.':'Servers appear to investors automatically once they reach the activity threshold (default ≥10 verified joins/day) and drop off when the rate falls. Here you can force-open a below-threshold server — but only if it has an active verification card.',
  '— выберите сервер с активной карточкой —':'— pick a server with an active card —','Нет серверов с активными карточками':'No servers with active cards',
  'Пока не добавлено ни одного сервера':'No servers added yet','нет активной карточки':'no active card',
  'Сервер добавлен для выкупа инвайтов':'Server added for invite buy-in','Сервер убран из инвест-списка':'Server removed from the invest list',
  'На сервере нет активной карточки верификации':'The server has no active verification card','Выберите сервер':'Select a server','Не удалось убрать':'Could not remove',
  'Пополнить инвест-счёт, $':'Top up investment account, $','Инвест-счёт пополнен на':'Investment account topped up by','Финансовая сверка':'Financial reconciliation','Бэкапы':'Backups',
  'Сделать бэкап сейчас':'Back up now','Аудит-лог действий':'Action audit log','Ботов онлайн':'Bots online',
  'Бот добавлен на сервер':'Bot added to a server','Бот удалён с сервера':'Bot removed from a server','Создана карточка верификации':'Verification card created','Удалена карточка верификации':'Verification card deleted','↗ ссылка':'↗ link','участников':'members',
  // audit-log filters
  'Все типы':'All types','Боты сети':'Network bots','Боты — все':'Bots — all','Карточки верификации':'Verification cards','Карточки — все':'Cards — all','Создана карточка':'Card created','Удалена карточка':'Card deleted',
  'Всё время':'All time','24 часа':'24 hours','7 дней':'7 days','30 дней':'30 days','Сначала новые':'Newest first','Сначала старые':'Oldest first','ID пользователя':'User ID',
  '🟢 онлайн':'🟢 online','🔴 офлайн':'🔴 offline','Алерты':'Alerts','⚠️ выключены':'⚠️ off',
  'Задайте ALERT_CHANNEL в Railway':'Set ALERT_CHANNEL in Railway',
  'Продажи рекламы (всего)':'Ad sales (total)','за 30д':'30d','Предоплата на кошельках':'Prepaid in wallets',
  'пополнено, ещё не потрачено':'topped up, not yet spent','Оплачено, не доставлено':'Paid, not delivered',
  'в активных кампаниях — распределится по мере доставки':'in active campaigns — distributed as delivered',
  'Долг сервиса (положит. балансы)':'Service debt (positive balances)','Баланс Crypto Pay':'Crypto Pay balance',
  'Платёжеспособность':'Solvency','🔴 не хватает на выплаты':'🔴 not enough for payouts','🟢 хватает':'🟢 enough',
  'Выплачено (завершено)':'Paid out (completed)','Выводы в обработке':'Withdrawals in progress',
  'Начислено за заходы':'Credited for joins','Списано (клаубэк)':'Clawed back','Отрицательные балансы':'Negative balances',
  ' (должны сервису)':' (owe the service)','аккаунтов':'accounts',
  'Последний бэкап:':'Last backup:','локально:':'local:','офсайт:':'off-site:','файлов:':'files:','Офсайт-копия:':'Off-site copy:',
  'Бэкап ещё не запускался в этой сессии (первый — через пару минут после старта). Офсайт-копия:':'No backup has run this session yet (the first runs a couple minutes after start). Off-site copy:',
  'вкл':'on','выкл (задайте BACKUP_CHANNEL)':'off (set BACKUP_CHANNEL)',
  'Бэкап сделан (локально + офсайт)':'Backup done (local + off-site)','Бэкап сделан (локально)':'Backup done (local)',
  'Не удалось сделать бэкап':'Backup failed',
  // stats
  'Статистика':'Statistics','С рекламой':'With ads','Без рекламы':'No ads',
  'Верификации, прошедшие без показа рекламы — органическая активность серверов. Помогает оценить, сколько заходов (stays) можно продать следующим заказом.':'Verifications that ran without showing an ad — organic server activity. It helps estimate how many joins (stays) you can sell in the next order.',
  'Глобальная реклама':'Global ad','Заглушка':'No-ad message',
  'Текст, который бот показывает вместо рекламы, когда её нет — верификация при этом проходит без рекламы. Пусто — будет использован стандартный текст.':'Text the bot shows instead of an ad when there is none — verification still runs ad-free. Empty — the default text is used.',
  'По серверам':'By server','Верифаций без рекламы':'Ad-free verifs','За час':'Past hour','За сутки':'Past 24h','За неделю':'Past week','За месяц':'Past month',
  'Инвайты / чистые':'Invites / clean','чистых':'clean','Данных пока нет':'No data yet','Выкл':'Off','Персональная':'Per-server',
  'Кран: Выкл':'Kill-switch: Off','Кран: Вкл':'Kill-switch: On','Настройки…':'Settings…',
  'Кран сервера закрыт':'Server kill-switch closed','Кран сервера открыт':'Server kill-switch opened','Не удалось переключить':'Could not toggle',
  // ad statistics
  'Стата рекламы':'Ad stats',
  'Каждая карточка — уникальный креатив (готовый рендер текста с подставленной ссылкой).':'Each card is a unique creative (the rendered text with its link filled in).',
  'Учитываются только верификации, где реклама реально была показана; закрытый кран или клики без рекламы в счёт не идут.':'Only verifications where an ad was actually shown are counted; a closed kill-switch or ad-free clicks do not count.',
  'Пока ни одна верификация не была засчитана с рекламой':'No verification has been counted with an ad yet',
  '(либо никто не подтвердился, либо все прошли до включения per-creative трекинга).':'(either nobody verified, or all of them predate per-creative tracking).',
  'Сейчас показывается':'Showing now','Проверка на заход':'Join check','Креатив':'Creative',
  'Заходы:':'Joins:','— лимит достигнут, реклама скрыта':' — limit reached, ad hidden','без лимита':'no limit',
  'лимит, 0 = убрать':'limit, 0 = remove','Сохранить лимит':'Save limit','Сбросить счётчик':'Reset counter',
  'Обнулить счётчик заходов для новой рекламы':'Zero the join counter for a new ad',
  'Впервые:':'First seen:','Последний показ:':'Last shown:','· «Впервые» считается с момента сброса счётчика инвайтов':'· “First seen” counts from the last counter reset',
  'Лимит — целое число ≥ 0':'Limit must be an integer ≥ 0','Лимит снят':'Limit removed','Счётчик сброшен':'Counter reset',
  'Не удалось сохранить лимит':'Could not save the limit','Не удалось сбросить':'Could not reset',
  // global / server ad editor
  'Глобальная реклама — показывается на любом сервере, где нет персональной':'Global ad — shown on any server without a per-server ad',
  'Ссылка-приглашение или готовый текст':'Invite link or ready-made text','Сохранить':'Save','Очистить':'Clear',
  '{link} подставляется из шаблона при показе.':'{link} is inserted from the template on display.',
  'Глобальная реклама сохранена':'Global ad saved','Не удалось сохранить':'Could not save','Очистить глобальную рекламу?':'Clear the global ad?',
  'Глобальная реклама очищена':'Global ad cleared','Не удалось очистить':'Could not clear',
  'Снятие: Выкл':'Clawback: Off','Снятие: Вкл':'Clawback: On','Реклама показывается':'Ad is showing','Реклама не показывается':'Ad is not showing',
  'Снятие средств при выходе (пока реклама не показывается)':'Clawback on leave (while the ad is not showing)',
  'Пока ссылки на этот сервер нет в рекламе партнёров, выход участника <b>не снимает</b> выплату — заход финальный. Как только реклама снова начнёт показываться, снятие возобновится; но ушедшие в период без показа больше не учитываются.':'While this server is not being advertised, a member leaving <b>does not</b> reverse the payout — the join is final. Once the ad shows again, clawback resumes; those who left during the off period are no longer revisited.',
  'Выход участника <b>снимает</b> выплату партнёру обратно (стандартное поведение), даже если реклама сейчас не показывается.':'A member leaving <b>reverses</b> the partner payout (default behavior), even if the ad is not showing now.',
  'Включить снятие':'Enable clawback','Отключить снятие':'Disable clawback',
  'Персональная реклама этого сервера. Если оставить пустым и удалить — юзеры увидят глобальную.':'This server’s own ad. Leave empty and delete — users will see the global one.',
  'Последнее обновление:':'Last updated:','Текст рекламы':'Ad text','Удалить':'Delete',
  'Снятие при выходе (без показа) отключено':'Leave clawback (while off) disabled','Снятие при выходе включено':'Leave clawback enabled',
  'Реклама сервера сохранена':'Server ad saved','Удалить персональную рекламу этого сервера? Юзеры будут видеть глобальную.':'Delete this server’s own ad? Users will see the global one.',
  'Реклама сервера удалена':'Server ad deleted',
  // shares
  'Доли':'Shares','＋ Добавить долю':'＋ Add share',
  '1% доли = 1% чистого дохода сервиса. Доход = продажа заходов (':'1% share = 1% of the service’s net income. Income = join sales (',
  ' с проверкой на заход) минус выплата партнёрам и эквайринг (3% от выплат). Чистая прибыль каждого захода делится по долям и начисляется на баланс — дальше обычная выплата (запрос на вывод от $10 или автовывод).':' with join check) minus partner payouts and acquiring (3% of payouts). Each join’s net profit is split by share and credited to the balance — then the normal payout flow (withdrawal request from $10 or auto-payout).',
  'Владельцы долей':'Shareholders','Чистый доход (всего)':'Net income (total)','Доход за день':'Income today','Доход за неделю':'Income this week','Доход за месяц':'Income this month',
  'Выручка с заходов':'Join revenue','Выплачено партнёрам (заходы)':'Paid to partners (joins)','Эквайринг':'Acquiring',
  'Скидка менеджерам':'Manager discount','маржа менеджеров (розница − их цена)':'manager margin (retail − their price)',
  'Капитализация':'Capitalization','сумма балансов пользователей':'sum of user balances',
  'не настроен':'not configured','🔴 Пополни: меньше капитализации':'🔴 Top up: below capitalization','🟢 Хватает на выплаты':'🟢 Enough for payouts',
  'Пополнить':'Top up','Неизвестный':'Unknown','Сохранить %':'Save %','Убрать':'Remove',
  'Доля обновлена:':'Share updated:','Владелец убран':'Owner removed','Сумма долей превысит 100%. Свободно:':'Total shares would exceed 100%. Available:',
  'Не удалось сохранить долю':'Could not save the share','Доля — число 0..100':'Share must be 0..100','Убрать этого владельца доли?':'Remove this shareholder?',
  'ID пользователя (17–20 цифр):':'User ID (17–20 digits):','Доля в % (0–100):':'Share in % (0–100):',
  // crypto pay modal
  'Пополнить Crypto Pay':'Top up Crypto Pay','Создаётся счёт USDT — оплати его из своего @CryptoBot кошелька, и баланс приложения пополнится (комиссия ~3%).':'A USDT invoice is created — pay it from your @CryptoBot wallet and the app balance tops up (~3% fee).',
  'Сумма, $':'Amount, $','например 50':'e.g. 50','Создать счёт':'Create invoice','Введите сумму больше 0':'Enter an amount above 0',
  'Создаём счёт…':'Creating invoice…','Не удалось создать счёт':'Could not create the invoice',
  'Счёт на $':'Invoice for $',' готов. Оплати по ссылке из @CryptoBot:':' is ready. Pay via the @CryptoBot link:','Copy ссылку':'Copy link',
  'После оплаты баланс обновится в течение ~минуты.':'After payment the balance updates within ~a minute.',
  // templates
  'Шаблоны рекламы':'Ad templates','＋ Шаблон для сервера':'＋ Template for a server',
  'Шаблон подставляется вокруг ссылки':'The template wraps around the','при показе. Меняешь шаблон — обновление сразу видно на всех верификациях, ничего заново не запускать.':'link on display. Change the template — the update shows on all verifications instantly, nothing to re-run.',
  'Глобальный (fallback)':'Global (fallback)','По серверам':'By server','Глобальный шаблон':'Global template',
  'Персональных шаблонов пока нет. Нажми «＋ Шаблон для сервера».':'No per-server templates yet. Click “＋ Template for a server”.',
  'Сбросить':'Reset','Используй':'Use','для подстановки ссылки.':'to insert the link.','Шаблон сохранён':'Template saved',
  'Удалить персональный шаблон этого сервера?':'Delete this server’s template?','Сбросить глобальный шаблон до дефолтного?':'Reset the global template to default?',
  'Удалено':'Deleted','Сброшено':'Reset','Не удалось удалить':'Could not delete',
  'ID сервера (17–20 цифр):':'Server ID (17–20 digits):','Шаблон (используй {link}):':'Template (use {link}):','Добавлено':'Added','Не удалось добавить':'Could not add',
  // kill-switch (toggle pane)
  'Экстренно':'Emergency','Кран рекламы':'Ad kill-switch',
  '🚫 Реклама выключена — верификация без начислений':'🚫 Ads off — verification with no credits','🟢 Реклама включена — работаем в обычном режиме':'🟢 Ads on — running as usual',
  'Последнее изменение:':'Last change:','Реклама выключена':'Ads off','Реклама включена':'Ads on',
  // verification cards
  'Карточки верификации':'Verification cards',
  'Список всех карточек. Если карточка сломалась или работает некорректно — «Встряхнуть» пересоберёт её на месте (владелец и роль сохранятся). Также можно сменить владельца/роль, перепубликовать или удалить. Чтобы добавить карточку, созданную до отслеживания — вставьте ссылку на сообщение (ПКМ по карточке → «Копировать ссылку на сообщение»).':'List of all cards. If a card breaks or misbehaves, “Shake” rebuilds it in place (owner and role kept). You can also change owner/role, republish or delete. To add a card created before tracking — paste the message link (right-click the card → “Copy Message Link”).',
  'Ссылка на сообщение с карточкой…':'Link to the card message…','＋ Добавить по ссылке':'＋ Add by link','🔎 Просканировать серверы':'🔎 Scan servers',
  'Удалённые карточки':'Deleted cards','Проверить сейчас':'Check now',
  'Карточки, удалённые с канала (вручную, ботом или через панель). Статистика сохраняется; видно, кто и когда убрал верификацию (кто — если бот успел заметить удаление через аудит-лог).':'Cards removed from the channel (manually, by the bot, or via the panel). Stats are kept; you can see who removed verification and when (who — if the bot caught the deletion via the audit log).',
  'роль по умолчанию':'default role','сообщение':'message','неизвестно':'unknown','🗑 Удалено':'🗑 Deleted','кем:':'by:',
  'Среднее время от первого клика до проверенного захода':'Average time from first click to a checked join',
  '⏱ Среднее время от клика до проверенного захода (все карточки): ~':'⏱ Average time from click to checked join (all cards): ~',
  'Вернуть':'Restore','Убрать из списка':'Remove from list','Встряхнуть':'Shake','Владелец…':'Owner…','Роль…':'Role…','Описание…':'Description…',
  'Перепубликовать':'Republish','Сбросить роль':'Reset role','Роль:':'Role:',
  '1. Клик (начали)':'1. Click (started)','2. Заход проверен':'2. Join checked','3. Остались':'3. Stayed',
  'Карточек пока нет. Создайте через /verify или добавьте по ссылке выше.':'No cards yet. Create one via /verify or add by link above.','Удалённых карточек нет.':'No deleted cards.',
  'Карточка пересобрана':'Card rebuilt','Удалить старое сообщение и опубликовать карточку заново (владелец и роль сохранятся)?':'Delete the old message and post the card again (owner and role kept)?',
  'Карточка перепубликована':'Card republished','Удалить карточку (сообщение бота будет удалено)?':'Delete the card (the bot message will be removed)?','Карточка удалена':'Card deleted',
  'Новый владелец — Discord ID:':'New owner — Discord ID:','Неверный ID':'Invalid ID','Владелец изменён':'Owner changed',
  'Новая роль — ID (пусто = роль по умолчанию «Verified»):':'New role — ID (empty = default “Verified” role):','Неверный ID роли':'Invalid role ID','Роль изменена':'Role changed',
  'Сбросить роль верификации?':'Reset the verification role?','Роль сброшена':'Role reset',
  'Опубликовать карточку заново в том же канале (владелец и роль сохранятся)?':'Post the card again in the same channel (owner and role kept)?','Карточка возвращена':'Card restored',
  'Окончательно убрать эту карточку из списка удалённых?':'Permanently remove this card from the deleted list?','Убрано из списка':'Removed from list',
  'Описание обновлено':'Description updated','Проверено. Помечено удалённых:':'Checked. Marked deleted:','Не удалось проверить':'Could not check',
  'Вставьте ссылку на сообщение':'Paste the message link','Карточка добавлена':'Card added',
  'Не удалось запустить сканирование':'Could not start the scan','🔎 Сканирование запущено…':'🔎 Scan started…',
  '🔎 Сканирую… каналов:':'🔎 Scanning… channels:',', найдено карточек:':', cards found:','✅ Готово. Просканировано каналов:':'✅ Done. Channels scanned:',', добавлено карточек:':', cards added:','Сканирование завершено: +':'Scan finished: +',
  'Описание карточки':'Card description','Текст под заголовком «Get verified!» — только для этой карточки. Пусто = стандартный текст.':'Text under the “Get verified!” title — for this card only. Empty = default text.',
  'Например: Чтобы получить доступ, пройдите верификацию — нажмите кнопку.':'e.g. To get access, complete verification — click the button.',
  // card error codes
  'Сообщение не найдено (бот не видит канал?)':'Message not found (bot cannot see the channel?)','Это сообщение не от нашего бота':'This message is not from our bot',
  'Это не карточка верификации':'This is not a verification card','Карточка не в списке':'Card not in the list','Карточка не удалена':'Card is not deleted',
  'Не удалось определить владельца':'Could not determine the owner','Бот больше не на сервере':'Bot is no longer on the server','Канал удалён или недоступен':'Channel deleted or unavailable',
  'У бота нет прав (нужно «Управление ролями»)':'Bot lacks permission (needs “Manage Roles”)','Неверная ссылка на сообщение':'Invalid message link','Не удалось отправить новое сообщение':'Could not send the new message',
  'Роль карточки не найдена на сервере':'The card’s role was not found on the server','Сервер недоступен боту':'Server is unavailable to the bot',
  'Это служебная роль (бот/интеграция) — пересоздать нельзя':'This is a managed role (bot/integration) — cannot be recreated','Нельзя сбросить роль @everyone':'Cannot reset the @everyone role',
  'Роль бота ниже этой роли — поднимите роль бота выше':'The bot’s role is below this one — move the bot’s role higher','Не удалось создать новую роль':'Could not create the new role','Ошибка':'Error',
  'Неизвестен владелец карточки':'Card owner is unknown','Бот больше не на этом сервере':'Bot is no longer on this server','Канал удалён или недоступен боту':'Channel deleted or unavailable to the bot',
  'У бота нет прав отправлять сообщения в этот канал':'Bot cannot send messages in this channel','Восстановление сейчас недоступно':'Restore is unavailable right now',
  // feed
  'Лента серверов':'Server feed','Серверы в ленте «Сообщества, которые уже зарабатывают с нами» на главной. Добавьте по ссылке-приглашению — имя, иконка и число участников подтянутся автоматически.':'Servers in the “Communities already earning with us” feed on the home page. Add by invite link — name, icon and member count are pulled automatically.',
  '＋ Добавить сервер':'＋ Add server','Лента пуста':'Feed is empty','Сервер удалён из ленты':'Server removed from the feed',
  'Вставьте ссылку-приглашение':'Paste an invite link','Сервер добавлен в ленту':'Server added to the feed','Этот сервер уже в ленте':'This server is already in the feed','Неверная ссылка-приглашение':'Invalid invite link',
  // admins
  'Админы':'Admins','＋ Добавить админа':'＋ Add admin','👁 Просмотр от лица админа':'👁 View as an admin',
  'Назначенные админы видят всё, кроме вкладок «Шаблоны» и «Балансы», и не могут пополнять Crypto Pay. Владелец проекта задан жёстко и не редактируется.':'Assigned admins see everything except the “Templates” and “Balances” tabs, and cannot top up Crypto Pay. The project owner is fixed and not editable.',
  'Админ':'Admin','Убрать этого админа?':'Remove this admin?','Админ убран':'Admin removed','Не удалось':'Failed',
  'Discord ID нового админа (17–20 цифр):':'Discord ID of the new admin (17–20 digits):','Админ добавлен':'Admin added',
  // no-join-check banner
  '⚠️ <b>Реклама не работает — нет проверки на заход.</b> Ссылка ведёт на сервер, где нет нашего бота, ':'⚠️ <b>Ad is not working — no join check.</b> The link leads to a server without our bot, ',
  'поэтому заход нельзя проверить. Такая реклама <u>не показывается</u>, и верификации проходят ':'so the join cannot be verified. Such an ad is <u>not shown</u>, and verifications run ',
  'без рекламы (без дохода). Добавьте бота на сервер спонсора или исправьте ссылку:':'ad-free (no income). Add the bot to the sponsor server or fix the link:',
  // balances
  'Балансы':'Balances','юзеров':'users','Поиск по ID юзера…':'Search by user ID…',
  'Сорт: баланс':'Sort: balance','Сорт: выведено':'Sort: withdrawn','Сорт: верификации':'Sort: verifications','Сорт: рефералы':'Sort: referrals','Сорт: ставка':'Sort: rate',
  'Не удалось загрузить балансы':'Could not load balances','Реквизиты':'Requisites','Нет реквизитов':'No requisites','Авто-перевод':'Auto-transfer','Авто-чек':'Auto-check','Неизвестный':'Unknown',
  'Бонус по рефералке':'Referral bonus','Ничего не найдено под этот фильтр.':'Nothing found for this filter.',
  'Ошибка загрузки':'Load error','Не удалось сохранить':'Could not save','Введи число с + или -, например +50 или -20':'Enter a number with + or -, e.g. +50 or -20',
  'Баланс изменён на':'Balance changed by','Join bid — число ≥ 0':'Join bid must be a number ≥ 0','Join bid сохранён':'Join bid saved',
  'Авто-вывод по чеку включён':'Check auto-payout enabled','Авто-вывод по чеку выключен':'Check auto-payout disabled',
  'Введите числовой Telegram ID получателя':'Enter the recipient’s numeric Telegram ID','Укажите Telegram ID':'Provide a Telegram ID','Неверный Telegram ID':'Invalid Telegram ID',
  'Прямой авто-вывод включён':'Direct auto-payout enabled','Прямой авто-вывод выключен':'Direct auto-payout disabled',
  'Реквизиты сохранены':'Requisites saved','Список рефералов сохранён':'Referral list saved','Сохранено':'Saved',
  'Юзер':'User','Всего выведено':'Total withdrawn','Реф-бонус в пуле':'Referral bonus in pool','Реферер':'Referrer',
  'Настройки':'Settings','Изменить баланс':'Change balance','Применить':'Apply','Ставка ($/100 заходов)':'Rate ($/100 joins)','бонус':'bonus',
  'Баланс заказов':'Order balance','Изменить баланс заказов':'Change order balance','Баланс заказов изменён на':'Order balance changed by','insufficient wallet balance':'Insufficient order balance',
  'Авто-вывод по чеку (USDT-check)':'Auto-payout by check (USDT-check)','Авто-вывод прямым переводом (USDT, без чека)':'Auto-payout by direct transfer (USDT, no check)',
  'Telegram ID получателя, напр. 123456789':'Recipient Telegram ID, e.g. 123456789',
  'Деньги приходят напрямую в @CryptoBot получателю — без чека и подтверждений. Нужен числовой Telegram ID (не @username; узнать можно через @userinfobot). Имеет приоритет над выводом по чеку.':'Money arrives directly in the recipient’s @CryptoBot — no check, no confirmations. Needs a numeric Telegram ID (not @username; find it via @userinfobot). Takes priority over the check payout.',
  'Приглашённые':'Referred','по одному ID на строку':'one ID per line','Верификации':'Verifications','История выводов':'Withdrawal history','Выводов не было.':'No withdrawals yet.','Пока пусто.':'Nothing yet.',
  // misc / errors / copy
  'Не удалось загрузить состояние':'Could not load state','Не могу достучаться до':'Cannot reach','— открой DevTools → Console/Network, там точная причина (обычно CORS или неверный URL).':' — open DevTools → Console/Network for the exact cause (usually CORS or a wrong URL).',
  'ID скопирован:':'ID copied:','Не удалось скопировать':'Could not copy','Загрузка…':'Loading…',
  'завершено':'completed','выполнен':'completed','в обработке':'processing'
};
const TR_SORTED = Object.keys(TR).sort((a, b) => b.length - a.length).map((k) => [k, TR[k]]);
function tr(s) {
    if (adminLang !== 'en' || s == null) return s;
    s = String(s);
    for (const [re, rep] of TR_RE) s = s.replace(re, rep);
    for (const [ru, en] of TR_SORTED) if (s.indexOf(ru) >= 0) s = s.split(ru).join(en);
    return s;
}
function trWhole(t) { const k = t.trim(); if (k && WHOLE[k] !== undefined) return t.replace(k, WHOLE[k]); return tr(t); }
const CYR = /[А-Яа-яЁё]/;
function localizeAll(root) {
    if (adminLang !== 'en') return;
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
    if (adminLang !== 'en' || _obs) return;
    const opts = { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title'] };
    localizeAll(document.body);
    _obs = new MutationObserver(() => { _obs.disconnect(); localizeAll(document.body); _obs.observe(document.body, opts); });
    _obs.observe(document.body, opts);
}
// Translate native confirm/prompt messages too (they aren't in the DOM).
const _confirm = window.confirm.bind(window), _prompt = window.prompt.bind(window);
window.confirm = (m) => _confirm(tr(m));
window.prompt = (m, d) => _prompt(tr(m), d);

applyAdminLang();
startTranslator();

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
    el.textContent = tr(msg);
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
    renderNoJoinCheckWarning();
    renderStats();
    renderGlobalAd();
    renderFallback();
    renderAdStats();
    renderShares();
    renderTemplates();
    renderToggle();
    if (effRole() === 'owner') { renderAdmins(); renderFeed(); renderCards(); renderSystem(); renderBI(); }
}

// ---------- Overview / BI tab (#12) + inventory (#8) ----------
async function renderBI() {
    const { ok, body } = await get('/bi');
    if (!ok) return;
    const m = (v) => '$' + Number(v || 0).toFixed(2);
    const card = (k, v, note, warn) =>
        `<div class="stat-card"><div class="k">${escapeHtml(k)}</div><div class="v"${warn ? ' style="color:var(--red)"' : ''}>${escapeHtml(String(v))}</div>${note ? `<div class="k" style="margin-top:6px;text-transform:none;letter-spacing:0;font-size:11.5px">${escapeHtml(note)}</div>` : ''}</div>`;
    const kpi = $('#bi-kpi');
    if (kpi) kpi.innerHTML = [
        card('Продажи рекламы 30д', m(body.adSales?.month), `всего ${m(body.adSales?.total)} · ${body.adSales?.count || 0} шт`),
        card('Выручка с заходов 30д', m(body.revenue30), 'признаётся по мере доставки'),
        card('Заходы 7д / 30д', `${body.joins7} / ${body.joins30}`),
        card('Активные партнёры 7д / 30д', `${body.activePartners7} / ${body.activePartners30}`),
        card('Отток (клаубэк, 30д)', `${body.churnPct}%`, 'доля ушедших из засчитанных', body.churnPct > 30),
        card('Активные кампании', body.activeCampaigns),
        card('Покупатели за 30д', body.buyers30)
    ].join('');
    const inv = body.inventory || {};
    const invBox = $('#bi-inventory');
    if (invBox) invBox.innerHTML = [
        card('Спрос (не доставлено)', `${inv.demand} заходов`, 'сумма остатков активных кампаний'),
        card('Производительность', `${inv.capacityPerDay}/день`, 'средняя за 7 дней'),
        card('Хватит на', inv.coverageDays == null ? '—' : `${inv.coverageDays} дн.`, inv.oversold ? '🔴 перепродажа — заказов больше, чем сеть тянет' : '🟢 в норме', inv.oversold)
    ].join('');
    const weeksBox = $('#bi-weeks');
    if (weeksBox) {
        const w = body.weeks || [];
        const head = w.map((_, i) => `<th class="num">${i === w.length - 1 ? 'эта' : '-' + (w.length - 1 - i) + 'н'}</th>`).join('');
        weeksBox.innerHTML = `<thead><tr><th></th>${head}</tr></thead><tbody>
            <tr><td>Выручка</td>${w.map((x) => `<td class="num">${m(x.revenue)}</td>`).join('')}</tr>
            <tr><td>Заходы</td>${w.map((x) => `<td class="num">${x.joins}</td>`).join('')}</tr>
        </tbody>`;
    }
}

// ---------- System tab: monitoring, reconciliation, backups, audit ----------
function fmtDur(ms) {
    ms = Number(ms) || 0;
    const s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
    if (d) return `${d}д ${h}ч`;
    if (h) return `${h}ч ${m}м`;
    return `${m}м`;
}
async function renderSystem() {
    const [h, f] = await Promise.all([get('/health'), get('/finance')]);
    if (h.ok) { renderSysBots(h.body); renderSysBackup(h.body.backup, h.body.alertChannel); }
    if (f.ok) renderSysFinance(f.body);
    wireAuditFilters();
    loadAuditLog();
    renderInvestServers();
}

// Admin audit log with filters (by action type, period, sort, user).
function auditQuery() {
    const v = (id) => ($(id)?.value || '').trim();
    const p = new URLSearchParams({ limit: '300' });
    for (const [k, id] of [['action', '#af-action'], ['period', '#af-period'], ['sort', '#af-sort']]) { const val = v(id); if (val) p.set(k, val); }
    const u = v('#af-user'); if (/^\d{17,20}$/.test(u)) p.set('user', u);
    return p.toString();
}
let _auditUserTimer = null;
async function loadAuditLog() {
    const { ok, body } = await get('/audit?' + auditQuery());
    if (ok) renderSysAudit(body.entries || []);
}
function wireAuditFilters() {
    ['#af-action', '#af-period', '#af-sort'].forEach((id) => { const el = $(id); if (el && !el.dataset.wired) { el.dataset.wired = '1'; el.onchange = loadAuditLog; } });
    const u = $('#af-user'); if (u && !u.dataset.wired) { u.dataset.wired = '1'; u.oninput = () => { clearTimeout(_auditUserTimer); _auditUserTimer = setTimeout(loadAuditLog, 350); }; }
}

// ---- Invest-servers (owner-only): servers investors may buy invites of ----
async function renderInvestServers() {
    const box = $('#invest-servers-table'), sel = $('#invest-add-select');
    if (!box || !sel) return;
    const { ok, body } = await get('/invest-servers');
    if (!ok) return;
    const cands = body.candidates || [], enabled = body.enabled || [];
    sel.innerHTML = cands.length
        ? '<option value="">— выберите сервер с активной карточкой —</option>' + cands.map((c) => `<option value="${escapeHtml(c.serverId)}">${escapeHtml(c.name || c.serverId)}</option>`).join('')
        : '<option value="">Нет серверов с активными карточками</option>';
    box.innerHTML = `
      <thead><tr><th>Сервер</th><th>Действие</th></tr></thead>
      <tbody>${enabled.length ? enabled.map((s) => `
        <tr><td>${escapeHtml(s.name || s.serverId)} <span class="gid">${escapeHtml(s.serverId)}</span>${s.hasCard ? '' : ' <span class="chip red">нет активной карточки</span>'}</td>
        <td><button class="btn-mini off" data-invest-del="${escapeHtml(s.serverId)}">Убрать</button></td></tr>`).join('')
        : '<tr><td colspan="2" class="muted">Пока не добавлено ни одного сервера</td></tr>'}</tbody>`;
    box.querySelectorAll('[data-invest-del]').forEach((b) => b.onclick = async () => {
        const { ok } = await del('/invest-servers', { serverId: b.dataset.investDel });
        if (ok) { toast('Сервер убран из инвест-списка'); renderInvestServers(); }
        else toast('Не удалось убрать', 'err');
    });
}
const _investAddBtn = document.getElementById('invest-add');
if (_investAddBtn) _investAddBtn.onclick = async () => {
    const serverId = $('#invest-add-select').value;
    if (!serverId) { toast('Выберите сервер', 'err'); return; }
    const { ok, body } = await post('/invest-servers', { serverId });
    if (ok) { toast('Сервер добавлен для выкупа инвайтов'); renderInvestServers(); }
    else toast(body?.error === 'no-active-card' ? 'На сервере нет активной карточки верификации' : (body?.error || 'Не удалось добавить'), 'err');
};
function renderSysBots(b) {
    const box = $('#sys-bots'); if (!box) return;
    const cards = [{ k: 'Ботов онлайн', v: `${b.online} / ${b.total}`, warn: b.online < b.total }]
        .concat((b.bots || []).map((bot) => ({
            k: escapeHtml(bot.tag || bot.id || '—'),
            v: bot.online ? '🟢 онлайн' : '🔴 офлайн',
            warn: !bot.online,
            note: `ping ${bot.ping < 0 ? '—' : bot.ping + 'мс'} · серверов ${bot.guilds} · аптайм ${fmtDur(bot.uptimeMs)}`
        })));
    box.innerHTML = cards.map((c) =>
        `<div class="stat-card"><div class="k">${c.k}</div><div class="v"${c.warn ? ' style="color:var(--red)"' : ''}>${escapeHtml(c.v)}</div>${c.note ? `<div class="k" style="margin-top:6px;text-transform:none;letter-spacing:0;font-size:11.5px">${escapeHtml(c.note)}</div>` : ''}</div>`
    ).join('');
    if (!b.alertChannel) box.innerHTML += `<div class="stat-card" style="border-color:rgba(245,179,0,.4)"><div class="k">Алерты</div><div class="v" style="color:var(--amber);font-size:14px">⚠️ выключены</div><div class="k" style="margin-top:6px;text-transform:none;letter-spacing:0;font-size:11.5px">Задайте ALERT_CHANNEL в Railway</div></div>`;
}
function renderSysFinance(f) {
    const box = $('#sys-finance'); if (!box) return;
    const m = (v) => '$' + Number(v || 0).toFixed(2);
    const cards = [
        { k: 'Продажи рекламы (всего)', v: m(f.adSales?.total), note: `за 30д ${m(f.adSales?.month)} · ${f.adSales?.count || 0} шт` },
        { k: 'Предоплата на кошельках', v: m(f.walletsHeld), note: 'пополнено, ещё не потрачено' },
        { k: 'Оплачено, не доставлено', v: m(f.prepaidUndelivered), note: 'в активных кампаниях — распределится по мере доставки' },
        { k: 'Долг сервиса (положит. балансы)', v: m(f.owed), note: `${f.accountsOwed} аккаунтов` },
        { k: 'Баланс Crypto Pay', v: f.cryptoBalance == null ? '—' : m(f.cryptoBalance) },
        { k: 'Платёжеспособность', v: f.solvency == null ? '—' : m(f.solvency), warn: f.solvent === false, note: f.solvent === false ? '🔴 не хватает на выплаты' : f.solvent === true ? '🟢 хватает' : '' },
        { k: 'Выплачено (завершено)', v: m(f.withdrawnDone) },
        { k: 'Выводы в обработке', v: m(f.withdrawnPending) },
        { k: 'Начислено за заходы', v: m(f.paidOutJoins) },
        { k: 'Списано (клаубэк)', v: m(f.clawedBack) },
        { k: 'Отрицательные балансы', v: m(f.negative), note: `${f.accountsNeg} аккаунтов (должны сервису)` }
    ];
    box.innerHTML = cards.map((c) =>
        `<div class="stat-card"><div class="k">${escapeHtml(c.k)}</div><div class="v"${c.warn ? ' style="color:var(--red)"' : ''}>${escapeHtml(c.v)}</div>${c.note ? `<div class="k" style="margin-top:6px;text-transform:none;letter-spacing:0;font-size:11.5px">${escapeHtml(c.note)}</div>` : ''}</div>`
    ).join('');
}
function renderSysBackup(bk, alertOn) {
    const box = $('#sys-backup'); if (!box) return;
    const last = bk?.last;
    const off = bk?.offsite ? 'вкл' : 'выкл (задайте BACKUP_CHANNEL)';
    box.innerHTML = last
        ? `Последний бэкап: <b>${escapeHtml(relTime(last.at))}</b> · локально: ${last.local ? '✅' : '❌'} · офсайт: ${last.offsite ? '✅' : '❌'} · файлов: ${last.files}. Офсайт-копия: ${off}.`
        : `Бэкап ещё не запускался в этой сессии (первый — через пару минут после старта). Офсайт-копия: ${off}.`;
}
const AUDIT_LABEL = {
    'bot.join': 'Бот добавлен на сервер',
    'bot.leave': 'Бот удалён с сервера',
    'card.create': 'Создана карточка верификации',
    'card.delete': 'Удалена карточка верификации'
};
function renderSysAudit(entries) {
    const box = $('#sys-audit'); if (!box) return;
    // linkify server/card URLs in the detail (escape first, then wrap URLs)
    const linkify = (s) => escapeHtml(String(s || '')).replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">↗ ссылка</a>');
    const actCell = (a) => AUDIT_LABEL[a]
        ? `${escapeHtml(AUDIT_LABEL[a])} <code class="muted">${escapeHtml(a)}</code>`
        : `<code>${escapeHtml(a)}</code>`;
    const rows = entries.map((e) => `
        <tr>
          <td class="muted" style="white-space:nowrap">${escapeHtml(relTime(e.ts))}</td>
          <td>${escapeHtml(e.userName || e.userId || '—')}</td>
          <td>${actCell(e.action)}</td>
          <td class="muted">${linkify(e.detail)}</td>
        </tr>`).join('');
    box.innerHTML = `<thead><tr><th>Когда</th><th>Кто</th><th>Действие</th><th>Детали</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="4" class="muted">Пока пусто</td></tr>'}</tbody>`;
}
const _sysBackupBtn = document.getElementById('sys-backup-now');
if (_sysBackupBtn) _sysBackupBtn.onclick = async () => {
    _sysBackupBtn.disabled = true;
    const { ok, body } = await post('/backup');
    _sysBackupBtn.disabled = false;
    if (ok) { toast(body?.result?.offsite ? 'Бэкап сделан (локально + офсайт)' : 'Бэкап сделан (локально)'); renderSystem(); }
    else toast('Не удалось сделать бэкап', 'err');
};

// ---------- Verification cards (owner only, "Экстренно" tab) ----------
function cardGuildIcon(c) {
    const letter = escapeHtml(((c.guildName || '?')[0] || '?').toUpperCase());
    return c.guildIcon
        ? `<img class="srv-ic" src="${escapeHtml(c.guildIcon)}" alt="" loading="lazy" onerror="this.outerHTML='<span class=\\'srv-ic srv-ic-fallback\\'>${letter}</span>'" />`
        : `<span class="srv-ic srv-ic-fallback">${letter}</span>`;
}
function statRow(label, w) {
    w = w || { hour: 0, day: 0, week: 0 };
    return `<tr><td>${escapeHtml(label)}</td><td class="num">${w.hour}</td><td class="num">${w.day}</td><td class="num">${w.week}</td></tr>`;
}
function fmtSec(s) {
    if (s == null) return '—';
    s = Math.round(s);
    return s >= 60 ? `${Math.floor(s / 60)}м ${s % 60}с` : `${s}с`;
}
// ---------- Fallback ("Заглушка") text editor ----------
function renderFallback() {
    const box = $('#stats-fallback');
    if (!box) return;
    const val = (state && typeof state.fallbackText === 'string') ? state.fallbackText : '';
    box.innerHTML = `
      <div class="setting wide">
        <textarea data-field="fallback" placeholder="Например: Отлично! Теперь нажмите кнопку ещё раз, чтобы открыть доступ к серверу.">${escapeHtml(val)}</textarea>
        <div class="actions-row"><button class="btn primary sm" id="fallback-save">Сохранить</button></div>
      </div>`;
    $('#fallback-save').onclick = async () => {
        const text = box.querySelector('[data-field="fallback"]').value;
        const { ok, body } = await put('/fallback', { text });
        toast(ok ? 'Заглушка сохранена' : (body?.error || 'Не удалось сохранить'), ok ? 'ok' : 'err');
    };
}

function cardBlock(c, deleted) {
    const st = c.stats || {};
    const owner = c.creatorName ? `${escapeHtml(c.creatorName)}` : escapeHtml(c.creatorId || '—');
    const role = c.roleName ? `@${escapeHtml(c.roleName)}` : (c.roleId ? `<code>${escapeHtml(c.roleId)}</code>` : '<span class="muted">роль по умолчанию</span>');
    const chan = c.channelName ? `#${escapeHtml(c.channelName)}` : escapeHtml(c.channelId || '');
    const link = c.link ? ` · <a href="${escapeHtml(c.link)}" target="_blank" rel="noopener">↗ сообщение</a>` : '';
    const avg = c.avgVerifySeconds != null ? ` · <span title="Среднее время от первого клика до проверенного захода">⏱ ~${escapeHtml(fmtSec(c.avgVerifySeconds))}</span>` : '';
    const who = c.deletedByName ? escapeHtml(c.deletedByName) : (c.deletedBy ? escapeHtml(c.deletedBy) : 'неизвестно');
    const delMeta = deleted
        ? `<div class="cardrow-meta" style="color:#ff9a9c">🗑 Удалено ${escapeHtml(relTime(c.deletedAt))} · кем: <b>${who}</b></div>`
        : '';
    const restoreBtn = c.canRestore
        ? `<button class="btn-mini ok" data-card="restore">Вернуть</button>`
        : `<button class="btn-mini" data-card="restore" disabled title="${escapeHtml(restoreReasonText(c.restoreReason))}">Вернуть</button>`;
    const actions = deleted
        ? `${restoreBtn}<button class="btn-mini off" data-card="purge">Убрать из списка</button>`
        : `<button class="btn-mini" data-card="fix">Встряхнуть</button>
           <button class="btn-mini" data-card="owner">Владелец…</button>
           <button class="btn-mini" data-card="role">Роль…</button>
           <button class="btn-mini" data-card="desc">Описание…</button>
           <button class="btn-mini" data-card="republish">Перепубликовать</button>
           <button class="btn-mini off" data-card="reset-role">Сбросить роль</button>
           <button class="btn-mini off" data-card="delete">Удалить</button>`;
    return `
      <div class="cardrow${deleted ? ' deleted' : ''}" data-mid="${escapeHtml(c.messageId)}">
        <div class="cardrow-head">${cardGuildIcon(c)}<span><b>${escapeHtml(c.guildName || 'Unknown Server')}</b> · ${chan}${link}</span></div>
        <div class="cardrow-meta">
          Владелец: <b>${owner}</b> <button class="btn-mini copy-id" data-copy="${escapeHtml(c.creatorId || '')}">Copy ID</button>
          · Роль: ${role}${avg}
        </div>
        ${delMeta}
        <div class="table-wrap"><table class="card-stats">
          <thead><tr><th>Воронка</th><th class="num">час</th><th class="num">день</th><th class="num">неделя</th></tr></thead>
          <tbody>
            ${statRow('1. Клик (начали)', st.clicks)}
            ${statRow('2. Заход проверен', st.checked)}
            ${statRow('3. Остались', st.stayed)}
          </tbody>
        </table></div>
        <div class="cardrow-actions">${actions}</div>
      </div>`;
}
let lastCardsAll = [];
async function renderCards() {
    const { ok, body } = await get('/cards');
    if (!ok) return;
    const active = body.cards || [];
    const deleted = body.deletedCards || [];
    lastCardsAll = [...active, ...deleted];
    const avgEl = $('#cards-avg');
    if (avgEl) {
        if (body.avgVerifySeconds != null) { avgEl.textContent = `⏱ Среднее время от клика до проверенного захода (все карточки): ~${fmtSec(body.avgVerifySeconds)}`; avgEl.hidden = false; }
        else avgEl.hidden = true;
    }
    const box = $('#cards-list');
    box.innerHTML = active.length ? active.map((c) => cardBlock(c, false)).join('')
        : '<div class="muted">Карточек пока нет. Создайте через /verify или добавьте по ссылке выше.</div>';
    const dbox = $('#cards-deleted-list');
    if (dbox) dbox.innerHTML = deleted.length ? deleted.map((c) => cardBlock(c, true)).join('')
        : '<div class="muted">Удалённых карточек нет.</div>';
    [box, dbox].forEach((container) => container && container.querySelectorAll('.cardrow').forEach((row) => {
        const mid = row.dataset.mid;
        row.querySelectorAll('[data-card]').forEach((b) => b.onclick = () => cardAction(b.dataset.card, mid));
    }));
}

async function cardAction(action, messageId) {
    if (action === 'fix') {
        const { ok, body } = await post('/cards/fix', { messageId });
        toast(ok ? 'Карточка пересобрана' : (cardErr(body?.error)), ok ? 'ok' : 'err'); if (ok) renderCards();
    } else if (action === 'republish') {
        if (!confirm('Удалить старое сообщение и опубликовать карточку заново (владелец и роль сохранятся)?')) return;
        const { ok, body } = await post('/cards/republish', { messageId });
        toast(ok ? 'Карточка перепубликована' : cardErr(body?.error), ok ? 'ok' : 'err'); if (ok) renderCards();
    } else if (action === 'delete') {
        if (!confirm('Удалить карточку (сообщение бота будет удалено)?')) return;
        const { ok, body } = await post('/cards/delete', { messageId });
        toast(ok ? 'Карточка удалена' : cardErr(body?.error), ok ? 'ok' : 'err'); if (ok) renderCards();
    } else if (action === 'owner') {
        const raw = prompt('Новый владелец — Discord ID:');
        if (raw === null) return; // отмена / клик мимо — ничего не меняем
        const creatorId = raw.trim();
        if (!creatorId || !/^\d{17,20}$/.test(creatorId)) { toast('Неверный ID', 'err'); return; }
        const { ok, body } = await post('/cards/edit', { messageId, creatorId });
        toast(ok ? 'Владелец изменён' : cardErr(body?.error), ok ? 'ok' : 'err'); if (ok) renderCards();
    } else if (action === 'role') {
        const raw = prompt('Новая роль — ID (пусто = роль по умолчанию «Verified»):');
        if (raw === null) return; // отмена / клик мимо — ничего не меняем
        const roleId = raw.trim();
        if (roleId && !/^\d{17,20}$/.test(roleId)) { toast('Неверный ID роли', 'err'); return; }
        const { ok, body } = await post('/cards/edit', { messageId, roleId });
        toast(ok ? 'Роль изменена' : cardErr(body?.error), ok ? 'ok' : 'err'); if (ok) renderCards();
    } else if (action === 'desc') {
        const card = lastCardsAll.find((c) => c.messageId === messageId);
        openCardDescModal(messageId, card ? (card.description || '') : '');
    } else if (action === 'reset-role') {
        if (!confirm('Сбросить роль верификации?\n\nБудет создана НОВАЯ роль с теми же правами, правами на каналах, названием, цветом и иконкой. Старая роль будет удалена у всех участников, а карточка сразу переключится на новую роль.\n\nВсем участникам придётся пройти верификацию заново. Продолжить?')) return;
        const { ok, body } = await post('/cards/reset-role', { messageId });
        toast(ok ? `Роль сброшена${body?.roleName ? ': @' + body.roleName : ''}` : cardErr(body?.error), ok ? 'ok' : 'err');
        if (ok) renderCards();
    } else if (action === 'restore') {
        if (!confirm('Опубликовать карточку заново в том же канале (владелец и роль сохранятся)?')) return;
        const { ok, body } = await post('/cards/restore', { messageId });
        toast(ok ? 'Карточка возвращена' : cardErr(body?.error), ok ? 'ok' : 'err'); if (ok) renderCards();
    } else if (action === 'purge') {
        if (!confirm('Окончательно убрать эту карточку из списка удалённых?')) return;
        const { ok } = await post('/cards/purge', { messageId });
        if (ok) { toast('Убрано из списка'); renderCards(); }
    }
}

function openCardDescModal(messageId, desc) {
    const modal = $('#card-desc-modal');
    if (!modal) return;
    $('#card-desc-input').value = desc || '';
    modal.dataset.mid = messageId;
    modal.hidden = false;
    $('#card-desc-input').focus();
}
(() => {
    const modal = document.getElementById('card-desc-modal');
    if (!modal) return;
    const close = () => { modal.hidden = true; };
    document.getElementById('card-desc-close')?.addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    document.getElementById('card-desc-save')?.addEventListener('click', async () => {
        const mid = modal.dataset.mid;
        const description = $('#card-desc-input').value;
        const { ok, body } = await post('/cards/edit', { messageId: mid, description });
        if (ok) { close(); toast('Описание обновлено'); renderCards(); }
        else toast(cardErr(body?.error), 'err');
    });
})();

const _cardVerifyBtn = document.getElementById('card-verify');
if (_cardVerifyBtn) _cardVerifyBtn.onclick = async () => {
    _cardVerifyBtn.disabled = true;
    const { ok, body } = await post('/cards/verify');
    _cardVerifyBtn.disabled = false;
    if (ok) { toast(`Проверено. Помечено удалённых: ${body?.marked || 0}`); renderCards(); }
    else toast('Не удалось проверить', 'err');
};

function cardErr(code) {
    return ({
        'not-found': 'Сообщение не найдено (бот не видит канал?)',
        'not-own-message': 'Это сообщение не от нашего бота',
        'not-a-card': 'Это не карточка верификации',
        'not-tracked': 'Карточка не в списке',
        'not-deleted': 'Карточка не удалена',
        'no-owner': 'Не удалось определить владельца',
        'no-bot': 'Бот больше не на сервере',
        'no-channel': 'Канал удалён или недоступен',
        'no-perms': 'У бота нет прав (нужно «Управление ролями»)',
        'bad-ref': 'Неверная ссылка на сообщение',
        'send-failed': 'Не удалось отправить новое сообщение',
        'no-role': 'Роль карточки не найдена на сервере',
        'no-guild': 'Сервер недоступен боту',
        'role-managed': 'Это служебная роль (бот/интеграция) — пересоздать нельзя',
        'role-everyone': 'Нельзя сбросить роль @everyone',
        'role-too-high': 'Роль бота ниже этой роли — поднимите роль бота выше',
        'create-failed': 'Не удалось создать новую роль'
    })[code] || (code || 'Ошибка');
}

// Why a deleted card's "Вернуть" button is disabled (button tooltip).
function restoreReasonText(reason) {
    return ({
        'no-owner': 'Неизвестен владелец карточки',
        'no-bot': 'Бот больше не на этом сервере',
        'no-channel': 'Канал удалён или недоступен боту',
        'no-perms': 'У бота нет прав отправлять сообщения в этот канал',
        'not-deleted': 'Карточка не удалена'
    })[reason] || 'Восстановление сейчас недоступно';
}

const _cardRegBtn = document.getElementById('card-register');
if (_cardRegBtn) _cardRegBtn.onclick = async () => {
    const inp = $('#card-ref');
    const ref = (inp.value || '').trim();
    if (!ref) { toast('Вставьте ссылку на сообщение', 'err'); return; }
    const { ok, body } = await post('/cards/register', { ref });
    if (ok) { inp.value = ''; toast('Карточка добавлена'); renderCards(); }
    else toast(cardErr(body?.error), 'err');
};

let cardScanPoll = null;
const _cardScanBtn = document.getElementById('card-scan');
if (_cardScanBtn) _cardScanBtn.onclick = async () => {
    const status = $('#card-scan-status');
    const { ok } = await post('/cards/scan');
    if (!ok) { toast('Не удалось запустить сканирование', 'err'); return; }
    status.hidden = false;
    status.textContent = '🔎 Сканирование запущено…';
    clearInterval(cardScanPoll);
    cardScanPoll = setInterval(async () => {
        const { ok, body } = await get('/cards/scan');
        if (!ok) return;
        const s = body.scan || {};
        if (s.running) {
            status.textContent = `🔎 Сканирую… каналов: ${s.scannedChannels || 0}, найдено карточек: ${s.found || 0}`;
        } else {
            clearInterval(cardScanPoll);
            status.textContent = `✅ Готово. Просканировано каналов: ${s.scannedChannels || 0}, добавлено карточек: ${s.found || 0}`;
            toast(`Сканирование завершено: +${s.found || 0}`);
            renderCards();
            setTimeout(() => { status.hidden = true; }, 8000);
        }
    }, 2500);
};

// ---------- Home-page server feed (owner only) ----------
function feedIcon(s) {
    const url = s.img || (s.id && s.icon
        ? `https://cdn.discordapp.com/icons/${s.id}/${s.icon}.png?size=64` // static png: broken animated .gif icons render fine as png
        : null);
    const letter = escapeHtml(((s.letter || s.name || '?')[0] || '?').toUpperCase());
    const bg = s.color || '#5865f2';
    return url
        ? `<img class="srv-ic" src="${escapeHtml(url)}" alt="" loading="lazy" onerror="this.outerHTML='<span class=\\'srv-ic srv-ic-fallback\\' style=\\'background:${bg}\\'>${letter}</span>'" />`
        : `<span class="srv-ic srv-ic-fallback" style="background:${bg}">${letter}</span>`;
}

async function renderFeed() {
    const { ok, body } = await get('/feed');
    if (!ok) return;
    const list = body.servers || [];
    const rows = list.map((s) => {
        const sub = s.code ? `discord.gg/${escapeHtml(s.code)}` : (s.id ? escapeHtml(s.id) : '');
        const keyAttr = s.code ? `data-feed-code="${escapeHtml(s.code)}"` : `data-feed-id="${escapeHtml(s.id)}"`;
        return `
          <tr>
            <td><div class="srv-cell">${feedIcon(s)}<span>${escapeHtml(s.name || 'Server')}</span></div>${sub ? `<div class="muted" style="font-size:11.5px;margin-top:3px">${sub}</div>` : ''}</td>
            <td><button class="btn-mini off" ${keyAttr}>Удалить</button></td>
          </tr>`;
    }).join('');
    $('#feed-table').innerHTML = `
        <thead><tr><th>Сервер</th><th>Действие</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="2" class="muted">Лента пуста</td></tr>'}</tbody>`;
    $$('#feed-table [data-feed-code], #feed-table [data-feed-id]').forEach((b) => b.onclick = async () => {
        const payload = b.dataset.feedCode ? { code: b.dataset.feedCode } : { id: b.dataset.feedId };
        const { ok } = await del('/feed', payload);
        if (ok) { toast('Сервер удалён из ленты'); renderFeed(); }
        else toast('Не удалось удалить', 'err');
    });
}

const _feedAddBtn = document.getElementById('feed-add');
if (_feedAddBtn) _feedAddBtn.onclick = async () => {
    const inp = $('#feed-invite');
    const invite = (inp.value || '').trim();
    if (!invite) { toast('Вставьте ссылку-приглашение', 'err'); return; }
    const { ok, body } = await post('/feed', { invite });
    if (ok) { inp.value = ''; toast('Сервер добавлен в ленту'); renderFeed(); }
    else toast(body?.error === 'exists' ? 'Этот сервер уже в ленте'
        : body?.error === 'bad-invite' ? 'Неверная ссылка-приглашение'
        : (body?.error || 'Не удалось добавить'), 'err');
};

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
    wireVChart(); loadVChart(); startVChart();
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
    return !$('#bal-modal').hidden || !$('#server-ad-modal').hidden || !$('#cryptofund-modal').hidden
        || !$('#card-desc-modal').hidden;
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

// Top-of-panel warning: on-air ads whose invite points to a server with no
// network bot → no join-check, paid as plain clicks instead of confirmed joins.
function renderNoJoinCheckWarning() {
    const el = $('#nojoincheck-banner');
    if (!el) return;
    const list = Array.isArray(state?.noJoinCheckAds) ? state.noJoinCheckAds : [];
    if (!list.length) { el.hidden = true; el.innerHTML = ''; return; }
    const items = list.slice(0, 5).map((a) => {
        const snippet = (a.text || '').replace(/\s+/g, ' ').trim().slice(0, 80);
        return `<li><b>${escapeHtml(snippet)}${a.text && a.text.length > 80 ? '…' : ''}</b></li>`;
    }).join('');
    const more = list.length > 5 ? `<li class="muted">…и ещё ${list.length - 5}</li>` : '';
    el.innerHTML =
        `⚠️ <b>Реклама не работает — нет проверки на заход.</b> Ссылка ведёт на сервер, где нет нашего бота, ` +
        `поэтому заход нельзя проверить. Такая реклама <u>не показывается</u>, и верификации проходят ` +
        `без рекламы (без дохода). Добавьте бота на сервер спонсора или исправьте ссылку:<ul>${items}${more}</ul>`;
    el.hidden = false;
}

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
        // Invites (all paid joins) up front; clean still-standing joins after
        // the slash (leavers are clawed back — the clean number matches the
        // balance).
        const vs = (invites, clean) =>
            `${Number(invites).toLocaleString()} <span class="v-sub">/ ${Number(clean).toLocaleString()} чистых</span>`;
        cards = [
            { k: 'Инвайты / чистые', html: vs(g.total, s.all.total) },
            { k: 'За час',   html: vs(g.hour, s.all.hour) },
            { k: 'За сутки', html: vs(g.day, s.all.day) },
            { k: 'За неделю', html: vs(g.week, s.all.week) },
            { k: 'За месяц', html: vs(g.month, s.all.month) }
        ];
    }
    $('#stat-cards').innerHTML = cards.map((c) =>
        `<div class="stat-card"><div class="k">${escapeHtml(c.k)}</div><div class="v">${c.html || escapeHtml(c.v)}</div></div>`
    ).join('');

    // One Vemoni-wide funnel card (same three stages as a partner card, summed
    // across every server): first click → join verified → still on the server.
    const nf = state.networkFunnel;
    const nfBox = $('#vemoni-funnel');
    if (nfBox && nf) {
        const frow = (label, w) => `<tr><td>${escapeHtml(label)}</td><td class="num">${(w && w.hour) || 0}</td><td class="num">${(w && w.day) || 0}</td><td class="num">${(w && w.week) || 0}</td></tr>`;
        nfBox.innerHTML = `
          <div class="ref-card vemoni-card">
            <div class="ref-head">
              <img class="ref-av vemoni-av" src="/assets/logo.png" alt="Vemoni" />
              <div class="ref-id"><b>Vemoni · вся сеть</b><span class="muted sm">${Number(nf.servers || 0).toLocaleString()} серверов</span></div>
            </div>
            <div class="table-wrap" style="margin-top:10px"><table>
              <thead><tr><th>Воронка</th><th class="num">час</th><th class="num">день</th><th class="num">неделя</th></tr></thead>
              <tbody>
                ${frow('1. Клик (начали)', nf.clicks)}
                ${frow('2. Заход проверен', nf.checked)}
                ${frow('3. Остались', nf.stayed)}
              </tbody>
            </table></div>
          </div>`;
    } else if (nfBox) { nfBox.innerHTML = ''; }

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
        const adBtn = `<button class="btn-mini" data-act="ad-edit" data-gid="${g.gid}">Настройки…</button>`;
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
            // Invites (all paid joins) / clean joins still standing.
            const cell = (invites, clean) => `${invites} <span class="v-sub">/ ${clean}</span>`;
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

    // Owner-only: keep-payouts-after-completion toggle for this server.
    const isOwner = effRole() === 'owner';
    const clawOff = Boolean((state.clawbackOffAfterComplete || {})[gid]);
    const showing = Boolean(guildEntry?.adShowing);
    let clawBlock = '';
    if (isOwner) {
        const chip = clawOff
            ? '<span class="chip red">Снятие: Выкл</span>'
            : '<span class="chip green">Снятие: Вкл</span>';
        const statusHint = showing
            ? '<span class="chip blue">Реклама показывается</span>'
            : '<span class="chip">Реклама не показывается</span>';
        clawBlock = `
        <div class="setting wide" style="margin-top:16px;border-top:1px solid rgba(255,255,255,.08);padding-top:14px;">
          <label>Снятие средств при выходе (пока реклама не показывается)</label>
          <p class="muted" style="margin:4px 0 10px;">
            ${clawOff
                ? 'Пока ссылки на этот сервер нет в рекламе партнёров, выход участника <b>не снимает</b> выплату — заход финальный. Как только реклама снова начнёт показываться, снятие возобновится; но ушедшие в период без показа больше не учитываются.'
                : 'Выход участника <b>снимает</b> выплату партнёру обратно (стандартное поведение), даже если реклама сейчас не показывается.'}
          </p>
          <div class="actions-row" style="align-items:center;gap:10px;">
            ${chip} ${statusHint}
            <button class="btn-mini ${clawOff ? 'off' : 'on'}" data-act="claw-toggle">
              ${clawOff ? 'Включить снятие' : 'Отключить снятие'}
            </button>
          </div>
        </div>`;
    }

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
        ${clawBlock}
      </div>`;
    $('#server-ad-modal').hidden = false;

    if (isOwner) {
        const clawBtn = $('#server-ad-modal-body [data-act="claw-toggle"]');
        if (clawBtn) clawBtn.onclick = async () => {
            const newOff = !clawOff;
            const { ok, body } = await put('/leave-clawback-off', { gid, off: newOff });
            if (ok) {
                state.clawbackOffAfterComplete = state.clawbackOffAfterComplete || {};
                if (newOff) state.clawbackOffAfterComplete[gid] = true;
                else delete state.clawbackOffAfterComplete[gid];
                toast(newOff ? 'Снятие при выходе (без показа) отключено' : 'Снятие при выходе включено');
                openServerAdModal(gid);
                refresh();
            } else toast(body?.error || 'Не удалось переключить', 'err');
        };
    }

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
    const mgr = sh.managerCost || { total: 0 };
    const money = (v) => '$' + Number(v || 0).toFixed(2);
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
        { k: 'Скидка менеджерам', sub: 'маржа менеджеров (розница − их цена)', v: money(mgr.total) },
        { k: 'Капитализация', sub: 'сумма балансов пользователей', v: money(debt) },
        {
            k: 'Баланс Crypto Pay',
            v: cryptoBal == null ? '—' : money(cryptoBal),
            warn: needTopUp,
            btn: effRole() === 'owner' ? 'cryptofund' : null,  // top-up is owner-only
            note: cryptoBal == null ? 'не настроен' : needTopUp ? `🔴 Пополни: меньше капитализации ${money(debt)}` : '🟢 Хватает на выплаты'
        }
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
    else if (body?.error === 'exceeds-100') toast(`Сумма долей превысит 100%. Свободно: ${body.available}%`, 'err');
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
        const auto = u.autoLtc ? '<span class="chip green">Авто-LTC</span>'
            : u.autoTransfer ? '<span class="chip blue">Авто-перевод</span>'
            : u.autoPayout ? '<span class="chip blue">Авто-чек</span>' : '';
        const name = u.username || 'Неизвестный';
        // Join-check rate ($ per 100 joins). Boosted users show time left.
        const rate = `$${Number(u.joinRate ?? u.joinBid ?? 5).toFixed(2)}`;
        const boostChip = u.boosted
            ? ` <span class="chip amber" title="Бонус по рефералке">🔥 ${fmtBoostLeft(u.boostLeftMs)}</span>`
            : '';
        return `
          <tr class="clickable" data-uid="${escapeHtml(u.userId)}">
            <td>
              <div class="srv-cell"><span>${escapeHtml(name)}</span><button class="btn-mini copy-id" data-copy="${escapeHtml(u.userId)}" title="${escapeHtml(u.userId)}">Copy ID</button></div>
              <div style="margin-top:4px">${reqBadge} ${auto}</div>
            </td>
            <td class="num"><span class="chip ${bChip}">$${u.balance.toFixed(2)}</span></td>
            <td class="num">$${u.withdrawnTotal.toFixed(2)}</td>
            <td class="num">${u.verifications.toLocaleString()}</td>
            <td class="num">${u.referralsCount}</td>
            <td class="num">${rate}${boostChip}</td>
          </tr>`;
    }).join('');
    $('#bal-table').innerHTML = `
      <thead><tr>
        <th>Юзер</th>
        <th class="num">Баланс</th>
        <th class="num">Выведено</th>
        <th class="num">Верифаций</th>
        <th class="num">Рефералов</th>
        <th class="num">Ставка/100</th>
      </tr></thead>
      <tbody>${rows || '<tr><td colspan="6" class="muted">Ничего не найдено под этот фильтр.</td></tr>'}</tbody>`;
    $$('#bal-table tr[data-uid]').forEach((tr) => {
        // Don't open the detail when the Copy ID button was clicked.
        tr.onclick = (e) => { if (e.target.closest('[data-copy]')) return; openBalDetail(tr.dataset.uid); };
    });
}

// "165ч" / "2д 5ч" left of a referral boost.
function fmtBoostLeft(ms) {
    const h = Math.max(0, Math.ceil((Number(ms) || 0) / 3600000));
    if (h >= 24) { const d = Math.floor(h / 24); return `${d}д ${h % 24}ч`; }
    return `${h}ч`;
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

    const walBtn = apply('wallet');
    if (walBtn) walBtn.onclick = () => {
        const raw = $('[data-edit="wallet"]').value.trim().replace(',', '.');
        const m = raw.match(/^([+-])\s*(\d+(?:\.\d+)?)$/);
        if (!m) { toast('Введи число с + или -, например +50 или -20', 'err'); return; }
        const delta = (m[1] === '-' ? -1 : 1) * Number(m[2]);
        editBalanceField(userId, 'wallet', { delta }, `Баланс заказов изменён на ${m[1]}$${m[2]}`);
    };

    const jbidBtn = apply('joinbid');
    if (jbidBtn) jbidBtn.onclick = () => {
        const joinBid = Number($('[data-edit="joinBid"]').value.replace(',', '.'));
        if (!Number.isFinite(joinBid) || joinBid < 0) { toast('Join bid — число ≥ 0', 'err'); return; }
        editBalanceField(userId, 'joinbid', { joinBid }, 'Join bid сохранён');
    };

    const invBtn = apply('investtopup');
    if (invBtn) invBtn.onclick = () => {
        const amount = Number(String($('[data-edit="investTopup"]').value).replace(',', '.'));
        if (!Number.isFinite(amount) || amount <= 0) { toast('Введите сумму больше 0', 'err'); return; }
        editBalanceField(userId, 'investtopup', { amount }, `Инвест-счёт пополнен на $${amount}`);
    };

    const autoCb = $('[data-edit="autoPayout"]');
    if (autoCb) autoCb.onchange = async (e) => {
        const off = !e.target.checked;
        const { ok, body } = await put(`/balances/${encodeURIComponent(userId)}/autopayout`, { autoPayout: e.target.checked });
        if (!ok) { e.target.checked = off; toast(body?.error || 'Не удалось переключить', 'err'); return; }
        toast(e.target.checked ? 'Авто-вывод по чеку включён' : 'Авто-вывод по чеку выключен');
        loadBalances();
    };

    const transferBtn = $('[data-edit-act="autotransfer"]');
    if (transferBtn) transferBtn.onclick = async () => {
        const autoTransfer = $('[data-edit="autoTransfer"]').checked;
        const tgUserId = $('[data-edit="tgUserId"]').value.trim();
        if (autoTransfer && !/^\d{5,15}$/.test(tgUserId)) { toast('Введите числовой Telegram ID получателя', 'err'); return; }
        const { ok, body } = await put(`/balances/${encodeURIComponent(userId)}/autotransfer`, { autoTransfer, tgUserId });
        if (!ok) {
            const msg = body?.error === 'tg-id-required' ? 'Укажите Telegram ID' : body?.error === 'bad-tg-id' ? 'Неверный Telegram ID' : (body?.error || 'Не удалось сохранить');
            toast(msg, 'err'); return;
        }
        toast(autoTransfer ? 'Прямой авто-вывод включён' : 'Прямой авто-вывод выключен');
    };
    const ltcBtn = $('[data-edit-act="autoltc"]');
    if (ltcBtn) ltcBtn.onclick = async () => {
        const autoLtc = $('[data-edit="autoLtc"]').checked;
        const ltcAddress = $('[data-edit="ltcAddress"]').value.trim();
        if (autoLtc && !ltcAddress) { toast('Укажите LTC-адрес партнёра', 'err'); return; }
        const { ok, body } = await put(`/balances/${encodeURIComponent(userId)}/autoltc`, { autoLtc, ltcAddress });
        if (!ok) {
            const err = body?.error === 'bad-ltc-address' ? 'Некорректный LTC-адрес'
                : body?.error === 'ltc-address-required' ? 'Сначала укажите LTC-адрес'
                : (body?.error || 'Не удалось сохранить');
            toast(err, 'err');
            return;
        }
        if (autoLtc && body?.payoutReady === false) toast('Включено, но выплаты NOWPayments не настроены (email/пароль)', 'err');
        else toast(autoLtc ? 'Авто-вывод в LTC включён' : 'Авто-вывод в LTC выключен');
        loadBalances();
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
          ${kv('Баланс заказов', money(u.walletBalance || 0))}
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
            <label>Изменить баланс заказов</label>
            <input type="text" data-edit="wallet" placeholder="+50 или -20" />
            <div class="actions-row"><button class="btn primary sm" data-edit-act="wallet">Применить</button></div>
          </div>
          <div class="setting">
            <label>Ставка ($/100 заходов)${u.boosted ? ` · <span class="chip amber">🔥 бонус ${fmtBoostLeft(u.boostLeftMs)}</span>` : ''}</label>
            <input type="number" step="0.01" min="0" data-edit="joinBid" value="${Number(u.joinBid).toFixed(2)}" />
            <div class="actions-row"><button class="btn primary sm" data-edit-act="joinbid">Сохранить</button></div>
          </div>
          <div class="setting">
            <label>Пополнить инвест-счёт, $</label>
            <input type="number" step="1" min="0" data-edit="investTopup" placeholder="например 50" />
            <div class="actions-row"><button class="btn primary sm" data-edit-act="investtopup">Пополнить</button></div>
          </div>
          <div class="setting autopay">
            <label>Авто-вывод по чеку (USDT-check)</label>
            <label class="switch positive">
              <input type="checkbox" data-edit="autoPayout" ${u.autoPayout ? 'checked' : ''} />
              <span class="slider"></span>
            </label>
          </div>
          <div class="setting wide">
            <div class="setting autopay" style="padding:0;border:none;background:transparent;">
              <label>Авто-вывод прямым переводом (USDT, без чека)</label>
              <label class="switch positive">
                <input type="checkbox" data-edit="autoTransfer" ${u.autoTransfer ? 'checked' : ''} />
                <span class="slider"></span>
              </label>
            </div>
            <div class="actions-row" style="gap:8px;margin-top:8px;">
              <input type="text" data-edit="tgUserId" placeholder="Telegram ID получателя, напр. 123456789" value="${escapeHtml(u.tgUserId || '')}" style="flex:1;" />
              <button class="btn primary sm" data-edit-act="autotransfer">Сохранить</button>
            </div>
            <div class="muted" style="font-size:11.5px;margin-top:6px">Деньги приходят напрямую в @CryptoBot получателю — без чека и подтверждений. Нужен числовой Telegram ID (не @username; узнать можно через @userinfobot). Имеет приоритет над выводом по чеку.</div>
          </div>
          <div class="setting wide">
            <div class="setting autopay" style="padding:0;border:none;background:transparent;">
              <label>Авто-вывод в LTC на адрес партнёра (NOWPayments)</label>
              <label class="switch positive">
                <input type="checkbox" data-edit="autoLtc" ${u.autoLtc ? 'checked' : ''} />
                <span class="slider"></span>
              </label>
            </div>
            <div class="actions-row" style="gap:8px;margin-top:8px;">
              <input type="text" data-edit="ltcAddress" placeholder="LTC-адрес партнёра, напр. ltc1q… или L…" value="${escapeHtml(u.ltcAddress || '')}" style="flex:1;" />
              <button class="btn primary sm" data-edit-act="autoltc">Сохранить</button>
            </div>
            <div class="muted" style="font-size:11.5px;margin-top:6px">При достижении порога баланс автоматически уходит в LTC на этот адрес. Сумма конвертируется из $ по курсу NOWPayments. Имеет приоритет над остальными авто-режимами. Требует заполненных «NOWPayments: email/пароль» в Настройках, а у самого NOWPayments — отключённых 2FA на выплаты и белого списка адресов.</div>
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

// ---------- Lots / auctions ----------
async function renderLots() {
    const box = $('#lots-list'); if (!box) return;
    const { ok, body } = await get('/lots');
    if (!ok) { box.innerHTML = '<div class="muted">Не удалось загрузить лоты.</div>'; return; }
    const tpl = $('#lot-template');
    if (tpl && document.activeElement !== tpl) tpl.value = body.template || '';
    const list = body.lots || [];
    box.innerHTML = list.length ? list.map(lotCard).join('') : '<div class="muted">Пока нет лотов. Запустите первый выше.</div>';
}
const _lotTplSave = document.getElementById('lot-template-save');
if (_lotTplSave) _lotTplSave.onclick = async () => {
    _lotTplSave.disabled = true;
    const { ok, body } = await put('/lots/template', { text: $('#lot-template').value });
    _lotTplSave.disabled = false;
    if (ok) { toast('Сообщение сохранено ✓'); if (body?.template != null) $('#lot-template').value = body.template; }
    else toast(body?.error || 'Не удалось сохранить', 'err');
};
function lotCard(l) {
    const active = l.status === 'active';
    const chLink = l.guildId && l.channelId ? `https://discord.com/channels/${l.guildId}/${l.channelId}` : null;
    const status = active ? '<span class="chip amber">активен</span>' : '<span class="chip">закрыт</span>';
    const result = l.status === 'closed'
        ? (l.winnerBid > 0 ? `🏆 <b>${escapeHtml(l.winnerName || ('ID ' + l.winnerId))}</b> — <b>$${l.winnerBid}</b>` : 'закрыт без ставок')
        : (l.highest > 0 ? `текущая ставка: <b>$${l.highest}</b>${l.highestBidderName ? ' · ' + escapeHtml(l.highestBidderName) : ''}` : 'ставок ещё нет');
    const bids = (l.bids || []).slice().reverse()
        .map((b) => `<div class="lot-bid"><span>${escapeHtml(b.name || ('ID ' + b.userId))}</span> <b>$${b.amount}</b> <span class="muted sm">${escapeHtml(relTime(b.ts))}</span></div>`).join('');
    return `<div class="lot-card">
        <div class="lot-head"><span class="lot-title">💹 ${l.stays} stays ${status}</span>${chLink ? ` <a class="btn ghost sm" href="${chLink}" target="_blank" rel="noopener">↗ канал</a>` : ''}</div>
        <div class="lot-meta muted sm">старт $${l.start} · шаг $${l.step} · ставок: ${l.bidsCount} · ${escapeHtml(relTime(l.createdAt))}</div>
        <div class="lot-result">${result}</div>
        ${bids ? `<details class="lot-bids"><summary>Ставки (${l.bidsCount})</summary>${bids}</details>` : ''}
      </div>`;
}
const _lotLaunch = document.getElementById('lot-launch');
if (_lotLaunch) _lotLaunch.onclick = async () => {
    const stays = Number($('#lot-stays').value), start = Number($('#lot-start').value), step = Number($('#lot-step').value);
    if (!(stays > 0) || !(start > 0) || !(step > 0)) { toast('Заполни кол-во stays, начальную цену и шаг (числа > 0)', 'err'); return; }
    _lotLaunch.disabled = true;
    const { ok, body } = await post('/lots', { stays, start, step });
    _lotLaunch.disabled = false;
    if (ok) { toast('Лот запущен ✓'); $('#lot-stays').value = ''; $('#lot-start').value = ''; $('#lot-step').value = ''; renderLots(); }
    else if (body?.error === 'no-bot-on-guild' || body?.error === 'no-guild') toast('Ни один бот не находится на аукционном сервере.', 'err');
    else if (body?.error === 'channel-failed') toast('Не удалось создать канал: ' + (body?.detail || ''), 'err');
    else toast(body?.error || 'Не удалось запустить лот', 'err');
};
const _lotsTab = document.querySelector('[data-tab="lots"]');
if (_lotsTab) _lotsTab.addEventListener('click', renderLots);

// ---------- Verification activity chart (Statistics) ----------
// The three funnel stages are drawn together as separate lines; any of them can be
// toggled off. Server chips SCOPE the chart (default: every carded server). With
// exactly one stage left on, the picked servers split into their own lines so you
// can compare them — that is the only case where the line count can exceed three.
let vRange = 'day';
const vSel = new Set();                 // scoped servers (empty = all)
const VMETRICS = [
    { k: 'clicks', label: '1. Клик (начали)', short: 'клик', color: '#8b5cf6' },
    { k: 'checked', label: '2. Заход проверен', short: 'заход', color: '#22a8f0' },
    { k: 'stayed', label: '3. Остались', short: 'остались', color: '#34c759' }
];
const vOn = { clicks: true, checked: true, stayed: true };
let vData = null;
let vHover = -1;
let vTimer = null;
const VPAL = ['#22a8f0', '#e63b7a', '#a855f7', '#39c5bb', '#f59e0b', '#22d3ee', '#f472b6', '#8b5cf6'];
const vColor = (i) => VPAL[i % VPAL.length];
const VPAD = { l: 44, r: 12, t: 12, b: 26 };
const vOnList = () => VMETRICS.filter((m) => vOn[m.k]);

async function loadVChart() {
    const qs = '/verif-series?range=' + encodeURIComponent(vRange) + (vSel.size ? '&servers=' + [...vSel].join(',') : '');
    let r;
    try { r = await get(qs); } catch { return; }
    if (!r.ok || !r.body) return;
    vData = r.body;
    // Drop picks for servers with no data in this range, then refetch unscoped rows.
    const live = new Set((vData.servers || []).map((s) => s.gid));
    let changed = false;
    for (const g of [...vSel]) if (!live.has(g)) { vSel.delete(g); changed = true; }
    if (changed) return loadVChart();
    renderVMetrics(); renderVServers(); drawVChart();
}

// Compare mode = exactly one stage on + at least one server picked.
function vCompare() { return vOnList().length === 1 && vSel.size > 0 && ((vData && vData.perServer) || []).length > 0; }

function vLines() {
    if (!vData) return [];
    const on = vOnList();
    if (!on.length) return [];
    if (vCompare()) {
        const m = on[0];
        return vData.perServer.map((s, i) => ({ data: s[m.k] || [], color: vColor(i), width: 2, name: s.name + ' · ' + m.short }));
    }
    return on.map((m) => ({ data: (vData.totals || {})[m.k] || [], color: m.color, width: 2, name: m.label }));
}

function renderVMetrics() {
    const box = $('#vchart-metrics'); if (!box) return;
    box.innerHTML = VMETRICS.map((m) =>
        `<button class="vmchip${vOn[m.k] ? ' active' : ''}" data-vm="${m.k}" style="--vc:${m.color}"><span class="vchip-dot" style="background:${m.color}"></span><span>${escapeHtml(m.label)}</span></button>`
    ).join('');
    box.querySelectorAll('[data-vm]').forEach((b) => b.onclick = () => {
        const k = b.dataset.vm;
        if (vOn[k] && vOnList().length === 1) return;   // keep at least one line on screen
        vOn[k] = !vOn[k];
        renderVMetrics(); drawVChart();
    });
    const note = $('#vchart-note');
    if (note) {
        const show = vOn.clicks && (vRange === 'month' || vRange === 'all');
        note.hidden = !show;
        if (show) note.textContent = 'Клики хранятся 7 дней — на длинных диапазонах линия «Клик» до этого срока будет пустой.';
    }
}

function renderVServers() {
    const box = $('#vchart-servers'); if (!box || !vData) return;
    const items = (vData.servers || []).slice(0, 30);
    box.innerHTML =
        `<button class="vchip${vSel.size === 0 ? ' active' : ''}" data-vsrv="__all" style="--vc:#22a8f0"><span class="vchip-dot" style="background:#22a8f0"></span><span>Все серверы</span></button>` +
        items.map((s, i) => {
            const ic = s.icon
                ? `<img src="${escapeHtml(s.icon)}" alt="" loading="lazy" onerror="this.remove()" />`
                : `<span class="vchip-dot" style="background:${vColor(i)}"></span>`;
            const tip = `${s.name} — клик ${s.clicks} · заход ${s.checked} · остались ${s.stayed}`;
            return `<button class="vchip${vSel.has(s.gid) ? ' active' : ''}" data-vsrv="${escapeHtml(s.gid)}" style="--vc:${vColor(i)}" title="${escapeHtml(tip)}">${ic}<span>${escapeHtml(s.name)}</span><i>${s.checked}</i></button>`;
        }).join('');
    box.querySelectorAll('[data-vsrv]').forEach((b) => b.onclick = () => {
        const g = b.dataset.vsrv;
        if (g === '__all') vSel.clear();
        else if (vSel.has(g)) vSel.delete(g);
        else if (vSel.size < 8) vSel.add(g);
        else { toast('Максимум 8 серверов для сравнения', 'err'); return; }
        loadVChart();   // scope changed → per-server rows come from the backend
    });
}

function vNiceStep(max) {
    const raw = Math.max(1, max) / 4;
    const p = Math.pow(10, Math.floor(Math.log10(Math.max(1, raw))));
    return (([1, 2, 5, 10].find((k) => k * p >= raw)) || 10) * p;
}
function vBucketDate(i) { return new Date((vData.from || 0) + i * (vData.bucketMs || 0)); }
function vLabel(i) {
    const d = vBucketDate(i);
    const p2 = (x) => String(x).padStart(2, '0');
    if (vData.range === 'day') return p2(d.getHours()) + ':' + p2(d.getMinutes());
    if (vData.range === 'week') return p2(d.getDate()) + '.' + p2(d.getMonth() + 1) + ' ' + p2(d.getHours()) + 'ч';
    return p2(d.getDate()) + '.' + p2(d.getMonth() + 1);
}

function drawVChart() {
    const cv = $('#vchart'); if (!cv || !vData) return;
    const wrap = cv.parentElement;
    const cssW = Math.max(320, wrap.clientWidth), cssH = 260;
    const dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(cssW * dpr); cv.height = Math.round(cssH * dpr);
    cv.style.width = cssW + 'px'; cv.style.height = cssH + 'px';
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const W = cssW - VPAD.l - VPAD.r, H = cssH - VPAD.t - VPAD.b;
    const n = vData.points || 0;
    if (!n) return;
    const lines = vLines();
    const maxV = Math.max(1, ...lines.map((l) => Math.max(0, ...(l.data || [0]))));
    const step = vNiceStep(maxV);
    const top = Math.max(step, Math.ceil(maxV / step) * step);
    const X = (i) => VPAD.l + (n <= 1 ? W / 2 : (i / (n - 1)) * W);
    const Y = (v) => VPAD.t + H - (v / top) * H;

    ctx.font = '11px system-ui, -apple-system, sans-serif';
    ctx.textBaseline = 'middle'; ctx.textAlign = 'right';
    for (let v = 0; v <= top + 0.001; v += step) {
        const y = Y(v);
        ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(VPAD.l, y); ctx.lineTo(VPAD.l + W, y); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.4)';
        ctx.fillText(String(Math.round(v)), VPAD.l - 6, y);
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const ticks = Math.min(6, n);
    for (let k = 0; k < ticks; k++) {
        const i = Math.round((k / Math.max(1, ticks - 1)) * (n - 1));
        ctx.fillStyle = 'rgba(255,255,255,.4)';
        ctx.fillText(vLabel(i), Math.min(cssW - 18, Math.max(18, X(i))), VPAD.t + H + 6);
    }
    for (const l of lines) {
        ctx.beginPath(); ctx.lineWidth = l.width; ctx.strokeStyle = l.color;
        for (let i = 0; i < n; i++) { const px = X(i), py = Y(l.data[i] || 0); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
        ctx.stroke();
    }
    if (vHover >= 0 && vHover < n) {
        ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(X(vHover), VPAD.t); ctx.lineTo(X(vHover), VPAD.t + H); ctx.stroke();
        for (const l of lines) {
            ctx.fillStyle = l.color;
            ctx.beginPath(); ctx.arc(X(vHover), Y(l.data[vHover] || 0), 3.2, 0, Math.PI * 2); ctx.fill();
        }
    }
    // Tiles describe ONE stage (named on the label) so the numbers are unambiguous:
    // the join stage when it's on, else whichever stage is.
    const prim = (vOn.checked && VMETRICS[1]) || vOnList()[0] || VMETRICS[1];
    const arr = vCompare() ? ((lines[0] && lines[0].data) || []) : ((vData.totals || {})[prim.k] || []);
    const peak = arr.length ? Math.max(...arr) : 0;
    const avg = arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : 0;
    const pk = $('#vchart-peak'), av = $('#vchart-avg');
    const pl = $('#vtile-peak-l'), al = $('#vtile-avg-l');
    if (pk) pk.textContent = Math.round(peak).toLocaleString();
    if (av) av.textContent = (Math.round(avg * 10) / 10).toLocaleString();
    if (pl) pl.textContent = 'пик · ' + (vCompare() ? prim.short : prim.short);
    if (al) al.textContent = 'средний · ' + prim.short;
}

function showVTip(clientX, clientY) {
    const tp = $('#vchart-tip'); if (!tp || !vData || vHover < 0) return;
    const d = vBucketDate(vHover);
    const p2 = (x) => String(x).padStart(2, '0');
    const when = (vData.range === 'month' || vData.range === 'all')
        ? `${p2(d.getDate())}.${p2(d.getMonth() + 1)}.${d.getFullYear()}`
        : `${p2(d.getDate())}.${p2(d.getMonth() + 1)} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
    const rows = vLines().map((l) => [l.name, l.data[vHover] || 0, l.color]);
    tp.innerHTML = `<div class="vtip-t">${escapeHtml(when)}</div>` + rows.map(([nm, v, c]) =>
        `<div class="vtip-r"><i style="background:${c}"></i><span>${escapeHtml(nm)}</span><b>${v}</b></div>`).join('');
    tp.hidden = false;
    const wrap = document.querySelector('.vchart-wrap');
    const wr = wrap.getBoundingClientRect();
    let left = clientX - wr.left + 14;
    if (left + tp.offsetWidth > wr.width) left = clientX - wr.left - tp.offsetWidth - 14;
    tp.style.left = Math.max(0, left) + 'px';
    tp.style.top = Math.max(0, Math.min(wr.height - tp.offsetHeight, clientY - wr.top - 10)) + 'px';
}

function wireVChart() {
    const cv = $('#vchart');
    if (cv && !cv._wired) {
        cv._wired = true;
        cv.addEventListener('mousemove', (e) => {
            if (!vData || !vData.points) return;
            const r = cv.getBoundingClientRect();
            const W = r.width - VPAD.l - VPAD.r;
            const rel = (e.clientX - r.left - VPAD.l) / Math.max(1, W);
            vHover = Math.max(0, Math.min(vData.points - 1, Math.round(rel * (vData.points - 1))));
            drawVChart(); showVTip(e.clientX, e.clientY);
        });
        cv.addEventListener('mouseleave', () => {
            vHover = -1; drawVChart();
            const tp = $('#vchart-tip'); if (tp) tp.hidden = true;
        });
    }
    $$('[data-vrange]').forEach((b) => {
        if (b._wired) return; b._wired = true;
        b.onclick = () => {
            vRange = b.dataset.vrange;
            $$('[data-vrange]').forEach((x) => x.classList.toggle('active', x === b));
            loadVChart();
        };
    });
    if (!window._vResize) { window._vResize = true; window.addEventListener('resize', () => drawVChart()); }
}

// Live: refresh while the Statistics pane is actually on screen.
function startVChart() {
    clearInterval(vTimer);
    vTimer = setInterval(() => {
        const pane = document.querySelector('.pane[data-pane="stats"]');
        if (!pane || pane.hidden || document.hidden) return;
        loadVChart();
    }, 10000);
}

// ---------- Settings (runtime config, owner only) ----------
// Secrets are masked in the normal view; "Показать" pulls the real value on demand.
function cfgSecretRow(f) {
    if (!f.set) return '';
    return `<div class="cfg-srow">
        <button type="button" class="btn-mini cfg-reveal" data-cfg-reveal="${f.key}">Показать${f.type === 'multiline' ? ' токены' : ''}</button>
        <label class="cfg-clear muted sm"><input type="checkbox" data-cfg-clear="${f.key}" /> очистить</label>
      </div>`;
}
function cfgFieldHtml(f) {
    const help = f.help ? `<div class="cfg-help muted sm">${escapeHtml(f.help)}</div>` : '';
    const badge = f.overridden ? '<span class="cfg-badge">переопределено</span>' : '';
    const live = f.live ? '<span class="cfg-badge live">сразу</span>' : '';
    let control;
    if (f.type === 'multiline') {
        const ph = f.set ? 'Задано (скрыто). Нажми «Показать токены» или вставь заново, чтобы заменить.' : 'Пусто — по одному значению в строке';
        control = `<textarea class="cfg-input" rows="4" data-cfg-key="${f.key}" data-secret="1" placeholder="${escapeHtml(ph)}"></textarea>` + cfgSecretRow(f);
    } else if (f.secret) {
        const ph = f.set ? '•••••••• (задано)' : (f.def ? 'по умолчанию: ' + f.def : 'не задано');
        control = `<input class="cfg-input" type="password" autocomplete="new-password" data-cfg-key="${f.key}" data-secret="1" placeholder="${escapeHtml(ph)}" />` + cfgSecretRow(f);
    } else {
        const ph = f.def ? 'по умолчанию: ' + f.def : '';
        const num = f.type === 'number' ? ' step="any"' : '';
        control = `<input class="cfg-input" type="${f.type === 'number' ? 'number' : 'text'}"${num} data-cfg-key="${f.key}" value="${escapeHtml(f.value || '')}" placeholder="${escapeHtml(ph)}" />`;
    }
    return `<div class="cfg-field"><label class="cfg-label">${escapeHtml(f.label)} ${badge}${live}</label>${control}${help}</div>`;
}
async function renderSettings() {
    const box = $('#cfg-list'); if (!box) return;
    let ok, body;
    try { ({ ok, body } = await get('/config')); }
    catch (e) { box.innerHTML = '<div class="muted">Не удалось загрузить настройки — вероятно, нужен передеплой бэкенда (Railway). Открой DevTools → Network для деталей.</div>'; return; }
    if (!ok) { box.innerHTML = `<div class="muted">Не удалось загрузить настройки (${body?.error || 'ошибка'}). Возможно, требуется передеплой бэкенда.</div>`; return; }
    const cats = body.categories || [];
    box.innerHTML = cats.map((c) => `
      <div class="cfg-cat">
        <h2>${escapeHtml(c.cat)}</h2>
        <div class="cfg-grid">${c.fields.map(cfgFieldHtml).join('')}</div>
        ${c.cat.startsWith('Селф-боты') ? cfgReserveHtml(body.reserve) : ''}
      </div>`).join('');
    wireCfgReveal();
}

// What the reserve account(s) actually cover right now — a dead/expired token
// shows up here immediately as a missing server.
function cfgReserveHtml(r) {
    if (!r) return '';
    if (!r.enabled) return `<div class="cfg-reserve muted sm">Резерв выключен — токены не заданы.</div>`;
    const list = (r.guilds || []);
    const mode = r.gateway ? 'gateway' : 'REST';
    return `<div class="cfg-reserve">
        <div class="cfg-res-h">Резерв активен · <b>${escapeHtml(mode)}</b> · покрыто серверов: <b>${list.length}</b></div>
        ${list.length
            ? `<div class="cfg-res-list">${list.map((g) => `<span class="cfg-res-g" title="${escapeHtml(g.id)}">${escapeHtml(g.name)}</span>`).join('')}</div>`
            : `<div class="muted sm">Ни одного сервера. Если аккаунт куда-то зашёл, а сервера тут нет — токен скорее всего невалиден (в логах: «a token is unauthorized/expired»).</div>`}
        <div class="muted sm">Кампания запустится только на сервере из этого списка (или где есть наш бот).</div>
      </div>`;
}

function wireCfgReveal() {
    $$('#cfg-list [data-cfg-reveal]').forEach((b) => b.onclick = async () => {
        const key = b.dataset.cfgReveal;
        const el = document.querySelector(`#cfg-list [data-cfg-key="${key}"]`);
        if (!el) return;
        if (b.dataset.shown === '1') {                       // hide again
            el.value = '';
            if (el.tagName === 'INPUT') el.type = 'password';
            b.dataset.shown = ''; b.textContent = 'Показать' + (el.tagName === 'TEXTAREA' ? ' токены' : '');
            return;
        }
        b.disabled = true;
        let r;
        try { r = await get('/config/reveal?key=' + encodeURIComponent(key)); }
        catch { b.disabled = false; toast('Не удалось получить значение', 'err'); return; }
        b.disabled = false;
        if (!r.ok) { toast((r.body && r.body.error) || 'Не удалось получить значение', 'err'); return; }
        el.value = (r.body && r.body.value) || '';
        if (el.tagName === 'INPUT') el.type = 'text';
        b.dataset.shown = '1'; b.textContent = 'Скрыть';
    });
}
const _cfgSave = document.getElementById('cfg-save');
if (_cfgSave) _cfgSave.onclick = async () => {
    const values = {};
    $$('#cfg-list [data-cfg-key]').forEach((el) => {
        const key = el.dataset.cfgKey;
        if (el.dataset.secret === '1') {
            const clear = document.querySelector(`#cfg-list [data-cfg-clear="${key}"]`);
            if (clear && clear.checked) values[key] = '';
            else if (el.value.trim() !== '') values[key] = el.value.trim();
        } else {
            values[key] = el.value;
        }
    });
    _cfgSave.disabled = true;
    const { ok, body } = await put('/config', { values });
    _cfgSave.disabled = false;
    const st = $('#cfg-status');
    if (ok) { toast('Настройки сохранены ✓'); if (st) st.textContent = 'Сохранено. Часть настроек применится после перезапуска.'; renderSettings(); }
    else if (body?.error === 'bad-tokens') {
        // Nothing was saved — name the offending lines so they can be fixed.
        const lines = (body.bad || []).map((b) => `строка ${b.line}${b.id ? ` (id ${b.id})` : ''} — ${b.reason}`).join('; ');
        const msg = `Не сохранено: нерабочие токены → ${lines}${body.okCount ? `. Рабочих: ${body.okCount}` : ''}`;
        toast('Нерабочие токены — не сохранено', 'err');
        if (st) st.textContent = msg;
    }
    else if (body?.error === 'token-check-failed') { toast('Не удалось проверить токены — попробуй ещё раз', 'err'); }
    else toast(body?.error || 'Не удалось сохранить', 'err');
};
const _cfgRestart = document.getElementById('cfg-restart');
if (_cfgRestart) _cfgRestart.onclick = async () => {
    if (!confirm('Перезапустить сервис, чтобы применить настройки? Боты кратко переподключатся.')) return;
    _cfgRestart.disabled = true;
    const { ok } = await post('/config/restart');
    const st = $('#cfg-status');
    if (st) st.textContent = ok ? 'Перезапуск… обнови страницу через ~20 сек.' : '';
    toast(ok ? 'Перезапуск запущен' : 'Не удалось', ok ? 'ok' : 'err');
};
const _settingsTab = document.querySelector('[data-tab="settings"]');
if (_settingsTab) _settingsTab.addEventListener('click', renderSettings);
// Redraw the activity chart when the Statistics tab becomes visible (canvas can't
// size itself while its pane is hidden).
const _statsTab = document.querySelector('[data-tab="stats"]');
if (_statsTab) _statsTab.addEventListener('click', () => { wireVChart(); loadVChart(); });

// ---------- Activity log across all partners ----------
const ALOG_ESC = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ALOG_MONEY = (n) => '$' + Number(n || 0).toFixed(2);
const ALOG_NOPAY = 'Выдана верификация · без оплаты';
const ALOG_LABEL = {
    grant_paid: { cls: 'g', title: 'Выдана верификация', tag: 'начислено' },
    grant_no_ad: { cls: 'n', title: ALOG_NOPAY, tag: 'рекламы не было' },
    grant_ads_off: { cls: 'n', title: ALOG_NOPAY, tag: 'реклама отключена' },
    grant_server_off: { cls: 'n', title: ALOG_NOPAY, tag: 'реклама отключена на сервере' },
    grant_all_hidden: { cls: 'n', title: ALOG_NOPAY, tag: 'реклама скрыта партнёром' },
    grant_already_member: { cls: 'n', title: ALOG_NOPAY, tag: 'уже в рекламируемых серверах' },
    grant_capped: { cls: 'n', title: ALOG_NOPAY, tag: 'лимит показов исчерпан' },
    grant_no_inventory: { cls: 'n', title: ALOG_NOPAY, tag: 'нет активных реклам' },
    grant_dup_join: { cls: 'n', title: ALOG_NOPAY, tag: 'уже был на сервере' },
    grant_already_verified: { cls: 'n', title: 'Повторная попытка', tag: 'уже верифицирован' },
    debit_left: { cls: 'd', title: 'Списание', tag: 'участник ушёл' },
    unverify_left: { cls: 'u', title: 'Снята верификация', tag: 'участник ушёл' }
};
let alogTimer = null;
function alogQuery() {
    const v = (id) => ($(id)?.value || '').trim();
    const p = new URLSearchParams();
    for (const [k, id] of [['type', '#alf-type'], ['reason', '#alf-reason'], ['period', '#alf-period'], ['sort', '#alf-sort']]) { const val = v(id); if (val) p.set(k, val); }
    for (const [k, id] of [['partner', '#alf-partner'], ['user', '#alf-user'], ['server', '#alf-server']]) { const val = v(id); if (/^\d{17,20}$/.test(val)) p.set(k, val); }
    return p.toString();
}
function alogRow(e, maps) {
    const L = ALOG_LABEL[`${e.type}_${e.reason}`] || { cls: 'n', title: e.type, tag: e.reason || '' };
    const amt = e.type === 'debit' ? `<span class="plog-amt neg">−${ALOG_MONEY(e.amount)}</span>`
        : (e.type === 'grant' && e.reason === 'paid' && e.amount ? `<span class="plog-amt pos">+${ALOG_MONEY(e.amount)}</span>` : '');
    const partner = e.creatorId ? `<span class="plog-sv">Партнёр: ${ALOG_ESC(maps.partners[e.creatorId] || e.creatorId)}</span>` : '';
    const sv = e.guildId ? `<span class="plog-sv">${ALOG_ESC(maps.servers[e.guildId] || e.guildId)}</span>` : '';
    const usr = e.userId ? `<span class="plog-usr">${ALOG_ESC(maps.users[e.userId] || ('ID ' + e.userId))}</span>` : '';
    // Sponsor server the member joined into / left from (where known).
    const spDir = (e.type === 'debit' || e.type === 'unverify') ? 'ушёл из'
        : (e.reason === 'dup_join' || e.reason === 'already_member') ? 'уже был в' : 'зашёл в';
    const sp = e.sponsorGuildId ? `<span class="plog-sp">${spDir}: ${ALOG_ESC(maps.servers[e.sponsorGuildId] || e.sponsorGuildId)}</span>` : '';
    return `<div class="plog-row plog-${L.cls}">
      <span class="plog-dot"></span>
      <div class="plog-main">
        <div class="plog-title">${ALOG_ESC(L.title)} ${L.tag ? `<span class="plog-tag">${ALOG_ESC(L.tag)}</span>` : ''}</div>
        <div class="plog-sub">${partner}${sv}${usr}${sp}</div>
      </div>
      <div class="plog-right">${amt}<span class="plog-time">${ALOG_ESC(relTime(e.ts))}</span></div>
    </div>`;
}
let alogEvents = [], alogMaps = { servers: {}, users: {}, partners: {} }, alogPage = 0;
const ALOG_PER_PAGE = 10;
async function loadActivityLog() {
    const list = $('#alog-list');
    const { ok, body } = await get('/activity?' + alogQuery());
    if (!ok) { if (list) list.innerHTML = '<div class="muted">Не удалось загрузить журнал.</div>'; const pg = $('#alog-pager'); if (pg) pg.hidden = true; return; }
    alogEvents = body.events || [];
    alogMaps = { servers: body.servers || {}, users: body.users || {}, partners: body.partners || {} };
    alogPage = 0;
    renderAlogPage();
}
function renderAlogPage() {
    const list = $('#alog-list'); if (!list) return;
    const pages = Math.max(1, Math.ceil(alogEvents.length / ALOG_PER_PAGE));
    if (alogPage > pages - 1) alogPage = pages - 1;
    if (alogPage < 0) alogPage = 0;
    const slice = alogEvents.slice(alogPage * ALOG_PER_PAGE, alogPage * ALOG_PER_PAGE + ALOG_PER_PAGE);
    list.innerHTML = slice.length ? slice.map((e) => alogRow(e, alogMaps)).join('') : '<div class="muted">Событий не найдено.</div>';
    const pager = $('#alog-pager');
    if (!pager) return;
    if (alogEvents.length <= ALOG_PER_PAGE) { pager.hidden = true; pager.innerHTML = ''; return; }
    pager.hidden = false;
    pager.innerHTML =
        `<button class="btn ghost sm" id="alog-prev"${alogPage === 0 ? ' disabled' : ''}>← Назад</button>` +
        `<span class="wd-page muted sm">Стр. ${alogPage + 1} из ${pages}</span>` +
        `<button class="btn ghost sm" id="alog-next"${alogPage >= pages - 1 ? ' disabled' : ''}>Вперёд →</button>`;
    const prev = $('#alog-prev'), next = $('#alog-next');
    if (prev) prev.onclick = () => { if (alogPage > 0) { alogPage--; renderAlogPage(); } };
    if (next) next.onclick = () => { if (alogPage < pages - 1) { alogPage++; renderAlogPage(); } };
}
['#alf-type', '#alf-reason', '#alf-period', '#alf-sort'].forEach((id) => { const el = $(id); if (el) el.addEventListener('change', loadActivityLog); });
['#alf-partner', '#alf-user', '#alf-server'].forEach((id) => { const el = $(id); if (el) el.addEventListener('input', () => { clearTimeout(alogTimer); alogTimer = setTimeout(loadActivityLog, 400); }); });
const alfReset = $('#alf-reset');
if (alfReset) alfReset.addEventListener('click', () => { ['#alf-partner', '#alf-user', '#alf-server', '#alf-type', '#alf-reason', '#alf-period', '#alf-sort'].forEach((id) => { const el = $(id); if (el) el.value = ''; }); loadActivityLog(); });
const actTab = document.querySelector('[data-tab="activity"]');
if (actTab) actTab.addEventListener('click', loadActivityLog);

// ---------- Boot ----------
(async () => {
    if (await checkAuth()) enterApp();
})();
