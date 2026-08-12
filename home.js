/* DMALL landing page. Lean, self-contained (the old verification homepage + its
   script live frozen under /old-vemoni/). Handles: count-up numbers, EN/RU i18n,
   the account menu (whoami/logout), and the hero broadcast animation. */
(function () {
  'use strict';
  const base = (window.__VEMONI_API_BASE__ || '').replace(/\/+$/, '');

  /* ---------- Count-up numbers ---------- */
  function animateCount(el) {
    const target = +el.dataset.count, prefix = el.dataset.prefix || '', suffix = el.dataset.suffix || '';
    const start = performance.now(), dur = 1600;
    (function tick(now) {
      const p = Math.min(1, (now - start) / dur);
      const val = Math.round(target * (1 - Math.pow(1 - p, 3)));
      el.textContent = prefix + (target >= 1000 ? val.toLocaleString('en-US') : val) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { animateCount(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach((el) => io.observe(el));

  /* ---------- Hero broadcast animation ---------- */
  (function heroBroadcast() {
    const bar = document.getElementById('bcastBar'), num = document.getElementById('bcastNum');
    if (!bar || !num) return;
    const total = 1000;
    function run() {
      const start = performance.now(), dur = 2400;
      (function tick(now) {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        bar.style.width = (eased * 100) + '%';
        num.textContent = Math.round(total * eased).toLocaleString('en-US');
        if (p < 1) requestAnimationFrame(tick);
        else setTimeout(() => { bar.style.transition = 'none'; bar.style.width = '0%'; setTimeout(() => { bar.style.transition = ''; run(); }, 400); }, 2000);
      })(start);
    }
    run();
  })();

  /* ---------- i18n (EN captured from DOM, RU dict) ---------- */
  const RU = {
    nav_what: 'О сервисе', nav_how: 'Как это работает', nav_numbers: 'Цифры', nav_sell: 'Продать сервер', nav_faq: 'Вопросы',
    open_dmall: 'Открыть DMALL', nav_login: 'Войти через Discord',
    menu_home: 'Главная', menu_myorders: 'DMALL', menu_partner: 'Партнёрам', menu_admin: 'Администраторам', menu_logout: 'Выйти',
    hero_h1: 'Рассылки в Discord,<br /><span class="grad">которые доходят до людей</span>',
    hero_sub: 'DMALL — это маркетплейс рассылок: выберите сервер, напишите сообщение и достучитесь до его участников в личку. Платите только за доставленное.',
    hero_cta: 'Открыть DMALL →', hero_cta2: 'Как это работает ↓',
    bc_live: 'в эфире · отправка', bc_active: 'Активна', bc_msg_h: 'Вас приглашают!', bc_msg_p: 'Забирайте роль и участвуйте → discord.gg/vemoni',
    bc_delivered: 'Доставлено', bc_dm: 'Доставлено',
    what_h2: 'Что такое DMALL',
    what_p1: 'DMALL — маркетплейс рассылок в Discord. Покупатели отправляют сообщение прямо участникам выбранного сервера; владельцы серверов выставляют своё сообщество как лот и зарабатывают на каждой доставке. Поддерживаются кастом-эмодзи, стикеры и вложения — и всё это с защитой покупателя: вы платите за доставленные сообщения, а недоставленные возвращаются.',
    how_h2: 'Как это работает', how_sub: 'Три шага от сервера до доставленной рассылки.',
    step1_h3: 'Выберите сервер', step1_p: 'Выберите сообщество из каталога. Каждая карточка предварительно проверяется — вы заходите только туда, где рассылка реально доставляется.',
    step2_h3: 'Соберите рассылку', step2_p: 'Напишите сообщение, добавьте кастом-эмодзи, стикеры или медиа, задайте таргетинг и расписание — сразу, через несколько минут или в назначенное время.',
    step3_h3: 'Запуск — оплата за доставленное', step3_p: 'Сообщения уходят из управляемого пула ботов. Списывается за 1000 доставленных; всё, что не дошло, возвращается автоматически.',
    num_h2: 'Цифры', num_p: 'Прозрачная цена, оплата по факту доставки, защита покупателя. Всё важное — в одном месте.',
    check1: 'Оплата <b>за 1000 доставленных</b> сообщений — не за попытки',
    check2: 'Недоставленные сообщения <b>возвращаются автоматически</b>',
    check3: 'Эмодзи, стикеры и вложения включены',
    fig_big_label: 'сообщений доставлено', fig1_label: 'серверов в каталоге', fig2_label: 'довольных покупателей',
    sell_h2: 'Есть сервер? Выставьте его и зарабатывайте', sell_sub: 'Превратите сообщество в лот — вы задаёте цену и зарабатываете на каждой доставке.',
    sell1_h3: 'Добавьте бота', sell1_p: 'Пригласите нашего бота на сервер с админ-правами — он подключит сообщество к DMALL за пару минут.',
    sell2_h3: 'Задайте цену', sell2_p: 'Создайте лот и укажите цену за 1000 сообщений. Сделайте его публичным для всех или приватным.',
    sell3_h3: 'Зарабатывайте на доставках', sell3_p: 'Когда покупатели делают рассылку на ваш сервер, вам платят за каждое доставленное сообщение — всё видно в кабинете DMALL в реальном времени.',
    faq_h2: 'Частые вопросы',
    faq_q1: 'Как происходит оплата?',
    faq_a1: 'За 1000 доставленных сообщений. Вы пополняете баланс, запускаете рассылку, а после её завершения всё недоставленное возвращается — вы платите только за то, что реально дошло.',
    faq_q2: 'Что может содержать сообщение?',
    faq_a2: 'Текст, кастом-эмодзи и стикеры с серверов, где есть наши боты, вложения (картинка, видео или файл) и красивый embed. Живой предпросмотр показывает, как всё будет выглядеть.',
    faq_q3: 'Можно выставить свой сервер?',
    faq_a3: 'Да. Добавьте нашего бота админом, создайте лот и укажите цену за 1000 сообщений. Вы зарабатываете на каждой доставке, которую делают другие покупатели.',
    faq_q4: 'Можно запланировать или остановить рассылку?',
    faq_a4: 'Можно отправить сразу, с задержкой или в назначенные дату и время — и остановить активную рассылку в любой момент. Доставка отслеживается в реальном времени.',
    connect_h2: 'Готовы к рассылке?', connect_p: 'Откройте DMALL, выберите сервер и запускайте,<br />или напишите нам в Discord с любым вопросом.',
    connect_open: 'Открыть DMALL →', connect_btn: 'Сервер поддержки',
    footer_privacy: 'Политика конфиденциальности', footer_terms: 'Условия использования', footer_support: 'Поддержка', footer_rights: 'Все права защищены.',
  };
  const EN = {};
  document.querySelectorAll('[data-i18n]').forEach((el) => { EN[el.dataset.i18n] = el.innerHTML; });
  function setLang(lang) {
    const dict = lang === 'ru' ? RU : EN;
    document.querySelectorAll('[data-i18n]').forEach((el) => { const v = dict[el.dataset.i18n]; if (v != null) el.innerHTML = v; });
    document.documentElement.lang = lang;
    try { localStorage.setItem('vemoni_lang', lang); } catch (_) {}
    document.querySelectorAll('#langSwitch button').forEach((b) => b.classList.toggle('active', b.dataset.lang === lang));
  }
  document.querySelectorAll('#langSwitch button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
  let startLang = 'en';
  try { const s = localStorage.getItem('vemoni_lang'); if (s === 'ru' || s === 'en') startLang = s; } catch (_) {}
  setLang(startLang);

  /* ---------- Account chip + cabinet menu ---------- */
  (function account() {
    const box = document.getElementById('navUser'); if (!box) return;
    const loginBtn = document.querySelector('.nav-login');
    let tok = ''; try { tok = localStorage.getItem('vemoni_tok') || ''; } catch (_) {}
    const headers = {}; if (tok) headers.Authorization = 'Bearer ' + tok;
    const setAuthed = (v) => { try { v ? localStorage.setItem('vemoni_authed', '1') : localStorage.removeItem('vemoni_authed'); } catch (_) {} };
    function bannerFromAvatar(url) {
      const bn = document.getElementById('nmBanner'); if (!bn) return;
      const img = new Image(); img.crossOrigin = 'anonymous';
      img.onload = () => { try {
        const cv = document.createElement('canvas'); cv.width = cv.height = 16;
        const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0, 16, 16);
        const p = cx.getImageData(0, 0, 16, 16).data; let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < p.length; i += 4) { r += p[i]; g += p[i + 1]; b += p[i + 2]; n++; }
        r = (r / n) | 0; g = (g / n) | 0; b = (b / n) | 0; const dk = (v) => (v * 0.62) | 0;
        bn.style.background = 'linear-gradient(135deg, rgb(' + r + ',' + g + ',' + b + '), rgb(' + dk(r) + ',' + dk(g) + ',' + dk(b) + '))';
      } catch (_) {} };
      img.src = url;
    }
    fetch(base + '/partner/whoami', { credentials: 'include', headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d || !d.authed) { setAuthed(false); document.documentElement.classList.remove('pre-auth'); if (loginBtn) loginBtn.style.display = ''; box.hidden = true; return; }
        setAuthed(true);
        if (loginBtn) loginBtn.style.display = 'none';
        const name = d.name || d.username || 'User', letter = (name.trim()[0] || 'U').toUpperCase();
        const av = document.getElementById('navAv');
        if (d.avatar) av.style.backgroundImage = 'url("' + d.avatar + '")'; else av.textContent = letter;
        const nmAv = document.getElementById('nmAv'), nmName = document.getElementById('nmName'), nmUser = document.getElementById('nmUser');
        if (nmName) nmName.textContent = name;
        if (nmUser) nmUser.textContent = d.username ? '@' + d.username : ('ID ' + (d.userId || ''));
        if (nmAv) { if (d.avatar) nmAv.style.backgroundImage = 'url("' + d.avatar + '")'; else nmAv.textContent = letter; }
        const nmBanner = document.getElementById('nmBanner');
        if (nmBanner && d.banner) { nmBanner.style.backgroundImage = 'url("' + d.banner + '")'; nmBanner.style.backgroundSize = 'cover'; nmBanner.style.backgroundPosition = 'center'; }
        else if (d.avatar) bannerFromAvatar(d.avatar);
        if (!(d.isAdmin || d.botfarm)) box.querySelectorAll('[data-admin]').forEach((el) => el.remove());
        box.querySelectorAll('.nm-items a').forEach((a) => { if (a.getAttribute('href') === location.pathname) a.classList.add('active'); });
        box.hidden = false;
        const menu = document.getElementById('navMenu');
        av.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); menu.hidden = !menu.hidden; });
        menu.addEventListener('click', (e) => e.stopPropagation());
        document.addEventListener('click', () => { menu.hidden = true; });
        const lo = document.getElementById('navLogout');
        if (lo) lo.addEventListener('click', async (e) => {
          e.preventDefault();
          try { await fetch(base + '/partner/logout', { method: 'POST', credentials: 'include', headers }); } catch (_) {}
          try { localStorage.removeItem('vemoni_tok'); } catch (_) {}
          setAuthed(false); location.reload();
        });
      })
      .catch(() => {});
  })();
})();
