/* ===========================================================================
   DMALL console — shell interactions only (no backend yet).
   The real API is wired later; everything here is client-side UI glue:
   mode switch, tab switch, placeholder insertion, reveals, live preview.
   =========================================================================== */
(function () {
  'use strict';
  const $  = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  const modebar = $('#dm-modebar');
  const wrap    = modebar ? modebar.closest('.wrap') : null;
  const dmall   = $('#dmall');
  const bell    = $('#dm-nbell');
  const notif   = $('#dm-notif');
  if (!modebar || !dmall || !wrap) return;
  // Visibility of the whole mode bar is gated to admins by order.js.

  /* ---- ad-mode switch: Stays (orders) vs DMALL (broadcast console) ---- */
  $$('.dm-mode', modebar).forEach((btn) => {
    btn.addEventListener('click', () => {
      const dm = btn.dataset.mode === 'dmall';
      $$('.dm-mode', modebar).forEach((b) => b.classList.toggle('active', b === btn));
      wrap.classList.toggle('dmall-on', dm);
      dmall.hidden = !dm;
      if (bell) bell.hidden = !dm;
      if (!dm && notif) notif.classList.remove('on');
      window.scrollTo(0, 0);
    });
  });

  /* ---- DMALL tab switch ---- */
  $$('.dm-tab', dmall).forEach((tab) => {
    tab.addEventListener('click', () => {
      const key = tab.dataset.dtab;
      $$('.dm-tab', dmall).forEach((t) => t.classList.toggle('active', t === tab));
      $$('.dm-panel', dmall).forEach((p) => p.classList.toggle('active', p.dataset.dpanel === key));
    });
  });

  /* ---- placeholder-insert chips ---- */
  $$('.dm-chip[data-insert]', dmall).forEach((chip) => {
    chip.addEventListener('click', () => {
      const el = document.getElementById(chip.dataset.target);
      if (!el) return;
      const token = chip.textContent; // already the literal <@USER_ID> etc.
      const s = el.selectionStart ?? el.value.length;
      const e = el.selectionEnd ?? el.value.length;
      el.value = el.value.slice(0, s) + token + el.value.slice(e);
      const pos = s + token.length;
      el.focus();
      try { el.setSelectionRange(pos, pos); } catch (_) {}
      updatePreview();
    });
  });

  /* ---- checkbox reveals (bot profile) ---- */
  $$('.dm-check input[data-reveal]', dmall).forEach((cb) => {
    cb.addEventListener('change', () => {
      const box = document.getElementById(cb.dataset.reveal);
      if (box) box.classList.toggle('on', cb.checked);
      updatePreview();
    });
  });

  /* ---- color picker <-> text field ---- */
  const colorText = $('#dm-t-color'), colorPick = $('#dm-t-colorpick'), swatch = colorPick;
  const syncSwatch = (v) => { if (swatch) swatch.value = /^#[0-9a-f]{6}$/i.test(v) ? v : '#5865f2'; };
  if (colorPick) colorPick.addEventListener('input', () => { if (colorText) colorText.value = colorPick.value; updatePreview(); });
  if (colorText) colorText.addEventListener('input', () => { syncSwatch(colorText.value.trim()); updatePreview(); });

  /* ---- file pickers: local preview only (no upload here) ---- */
  $$('.dm-upload', dmall).forEach((box) => {
    const btn = $('.dm-file-btn', box), th = $('.dm-upload-th', box);
    if (!btn || !th) return;
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/png,image/jpeg,image/webp,image/gif'; input.hidden = true;
    box.appendChild(input);
    btn.addEventListener('click', () => input.click());
    input.addEventListener('change', () => {
      const f = input.files && input.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => { th.innerHTML = '<img alt="" src="' + r.result + '">'; th.dataset.url = r.result; updatePreview(); };
      r.readAsDataURL(f);
    });
  });

  /* ---- quick amount buttons ---- */
  $$('.dm-quick button', dmall).forEach((b) => {
    b.addEventListener('click', () => { const inp = $('#dm-l-count'); if (inp) inp.value = b.dataset.amt; });
  });

  /* ---- notifications panel ---- */
  if (bell && notif) {
    bell.addEventListener('click', () => notif.classList.toggle('on'));
    const close = $('#dm-notif-close'); if (close) close.addEventListener('click', () => notif.classList.remove('on'));
  }

  /* ---- "Пример Nitro" — fill sample content ---- */
  const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  const ex = $('#dm-example');
  if (ex) ex.addEventListener('click', () => {
    setVal('dm-t-name', 'Nitro / Robux giveaway');
    setVal('dm-t-content', 'Congratulations <@USER_ID> 🎉\nYou can take part in a big gws on the server {{LINK}}');
    setVal('dm-t-author', '100$ NITRO BOOST YEARLY / 10K ROBUX / 10X DECOR');
    setVal('dm-t-desc', 'Click 🎉 button to enter!\nWinners: 1');
    setVal('dm-t-color', '#5865f2'); syncSwatch('#5865f2');
    setVal('dm-t-btnlabel', 'Participate');
    setVal('dm-t-btnemoji', '🎉');
    updatePreview();
  });

  /* ---- live Discord preview ---- */
  const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = (s) => {
    let t = esc(s);
    t = t.replace(/&lt;@(?:USER_ID|USERNAME|DISPLAY_NAME)&gt;/g, '<span class="dm-mention">@user</span>');
    t = t.replace(/\{\{LINK\}\}/g, '<span class="dm-mlink">https://discord.gg/example</span>');
    t = t.replace(/(https?:\/\/[^\s<]+|discord\.gg\/[^\s<]+)/g, '<span class="dm-mlink">$1</span>');
    return t.replace(/\n/g, '<br>');
  };
  const val = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
  const url = (id) => { const el = document.getElementById(id); return el ? (el.dataset.url || '') : ''; };
  const checked = (sel) => { const el = $(sel); return !!(el && el.checked); };

  const preview = $('#dm-preview');
  function updatePreview() {
    if (!preview) return;
    const content = val('dm-t-content');
    const author  = val('dm-t-author'), desc = val('dm-t-desc'), footer = val('dm-t-footer');
    const thumb   = val('dm-t-thumb')  || url('dm-thumb-prev');
    const image   = val('dm-t-image')  || url('dm-image-prev');
    const color   = /^#[0-9a-f]{6}$/i.test(val('dm-t-color')) ? val('dm-t-color') : '#5865f2';
    const btnLbl  = val('dm-t-btnlabel'), btnEmoji = val('dm-t-btnemoji');
    const name    = (checked('#dm-rv-name input') && val('dm-t-username')) || 'Newspaper';
    const avUrl   = checked('#dm-rv-av input') ? url('dm-av-prev') : '';

    const hasEmbed = author || desc || footer || thumb || image;
    if (!content && !hasEmbed && !btnLbl) {
      preview.className = 'dm-preview empty';
      preview.innerHTML = '<span data-dm="preview_empty">' + dmT('preview_empty') + '</span>';
      return;
    }
    preview.className = 'dm-preview';
    let embed = '';
    if (hasEmbed) {
      embed = '<div class="dm-embed" style="border-left-color:' + color + '"><div class="dm-embed-main">' +
        (author ? '<div class="dm-embed-author">' + esc(author) + '</div>' : '') +
        (desc ? '<div class="dm-embed-desc">' + fmt(desc) + '</div>' : '') +
        (footer ? '<div class="dm-embed-foot">' + esc(footer) + '</div>' : '') +
        (image ? '<img class="dm-embed-img" alt="" src="' + esc(image) + '">' : '') +
        '</div>' + (thumb ? '<div class="dm-embed-th"><img alt="" src="' + esc(thumb) + '"></div>' : '') + '</div>';
    }
    const btn = btnLbl ? '<button class="dm-btn-discord">' + (btnEmoji ? esc(btnEmoji) + ' ' : '') + esc(btnLbl) + ' ↗</button>' : '';
    const av = avUrl ? '<img alt="" src="' + esc(avUrl) + '">' : '';
    preview.innerHTML =
      '<div class="dm-msg"><div class="dm-av">' + av + '</div><div class="dm-mbody">' +
        '<div class="dm-mhead"><span class="dm-mname">' + esc(name) + '</span><span class="dm-app">APP</span><span class="dm-mtime">Today at 8:48 PM</span></div>' +
        (content ? '<div class="dm-mtext">' + fmt(content) + '</div>' : '') +
        embed + btn +
      '</div></div>';
  }

  /* ---- i18n for the DMALL subtree (RU/EN), applied on load + on language switch ---- */
  const DM_TXT = {
    en: {
      tab_templates:"Templates", tab_launch:"Launch", tab_tasks:"Tasks", tab_stats:"Stats",
      new_tpl:"New template", example:"Nitro example", f_name:"Name", recipient:"Recipient:", link_lbl:"Link:", embed_h:"Embed",
      choose_file:"Choose file", upload_hint:"PNG, JPEG, WEBP or GIF up to 8 MB · external URL or server upload",
      bot_profile:"Bot profile", bot_profile_p:"Name, avatar and custom status are applied on the bot's first connection to a broadcast (once per run). Discord — no more than ~1 name change per hour.",
      set_name:"Set bot name", saved_as:"Saved as “Newspaper”", set_avatar:"Set avatar", set_status:"Set custom status", status_hint:"16/128 · empty = keep presence",
      button_link:"Button (link)", create_tpl:"Create template", cancel:"Cancel",
      preview:"Preview", preview_empty:"Preview will appear here", saved_tpls:"Saved templates", edit:"Edit", duplicate:"Duplicate", delete:"Delete template",
      meta1:"with button · author · avatar · bot «Newspaper» · status «Important Notice» · 17.07.26, 18:15",
      meta2:"with button · author · avatar · bot «Newspaper» · status «Important Notice» · 13.07.26, 21:31",
      meta3:"with button · author · avatar · bot «Newspaper» · status «Important Notice» · 11.06.26, 11:11",
      meta4:"with button · avatar · bot «Gregory» · status «Important Notice» · 05.06.26, 15:03",
      meta5:"status «Official message from Discord» · 31.05.26, 15:44",
      meta6:"with button · avatar · bot «Discord» · status «Official message from Discord» · 30.05.26, 17:57",
      meta7:"status «Official message from Discord» · 30.05.26, 16:11",
      tpl_title5:"You've been granted **Administrator** on the server", tpl_title6:"You've been invited to chat", tpl_title7:"Want free robux? Th",
      launch_h:"Start a broadcast", msg_tpl:"Message template",
      repeats:"Repeats & cooldowns", repeats_p:"The destination link is needed for templates with [[LINK]] and for per-server filters. Cooldowns can be combined: days and hours add up (max 365 days).",
      dest_link:"Destination link", dest_hint:"The template has [[LINK]] — enter an invite or external URL",
      dedup_t:"Dedup by target", dedup_t_sub:"Don't send to those who already joined this server or link<br>Enter the destination link above.",
      cool_g:"Global cooldown", cool_g_sub:"Don't send if the member received any ad within the period below",
      within_last:"within the last", days:"d", hours:"h",
      cool_t:"Cooldown by target", cool_t_sub:"Don't send if they already got a broadcast for this server/link within the period below",
      server_h:"Server", server_p:"Choose an assigned server or enter a new guild — a new one needs an OAuth channel; the selfbot must be on the server.",
      assigned_server:"Assigned server", opt_choose_id:"— Choose or enter an ID below —", guild_id:"Server ID (guild)", guild_id_hint:"Enter the server ID",
      exclude_h:"Exclude the server's members", exclude_p:"Optional: if you specify a server, its guild_members won't enter the broadcast queue. Without an ID, no exclusion is applied.",
      exclude_server:"Server to exclude", opt_choose_server:"— Choose a server —",
      whom_h:"Who to send to", whom_p:"All members, only roles, or specific IDs. Role/member exclusions apply after the audience filter. Link dedup is separate, in the block above.",
      audience:"Audience", aud_all:"All members", aud_roles:"Only roles", aud_ids:"Specific IDs", exclude_members:"Exclude members (IDs)",
      online_prio:"Priority by online status", no_prio:"No priority", online_first:"Online first, then offline",
      bot_pool:"Bot pool", leave_after:"Leave the server after the broadcast", leave_after_sub:"All bots that took part in this broadcast will leave the server when it ends",
      poolbox:"<b>115</b> free of 3 755 in the pool<div class=\"dm-poolsub\">7 busy · 3 633 invalid · 3 294 in quarantine</div>",
      msg_count:"Message count", how_many:"How many messages to send", bots_needed:"Bots needed: <b>2</b>",
      sum_total:"Total messages: 1 000", sum_hint:"Bots are counted by the backend automatically", sum_server:"Server:", sum_exclude:"Member exclusion:", not_set:"not set", sum_bots:"Bots (estimate):", sum_aud:"Audience:", sum_online:"Online:",
      start_broadcast:"Start broadcast", active_hint:"Active broadcasts: 1 — you can start another on a different server",
      st_dm:"DM BROADCAST", bots_on_server:"Bots on server", dm_broadcast:"DM broadcast", running:"Running", sending:"Sending messages",
      note1:"From the server: 90 119 · queued 87 420", route_from:"From", route_to:"→ TO", stop:"Stop",
      st_err:"ERROR", bots_k:"Bots", done:"Done", note3:"From the server: 90 115 · queued 87 416", msg_short:"Msg.", retry:"Retry", st_stop:"STOPPED",
      err1:"Failed to add bots to the server: no permissions or wrong oauth_channel_id. Check bot-add permissions and OAuth.",
      task_aud:"<b>Audience</b> All members · Online first, then offline", stats_soon:"Stats — coming soon.",
      notifications:"Notifications", open_broadcasts:"Open broadcasts", time1:"2 minutes ago", time2:"An hour ago",
      notif1:"Broadcast: bot <b>Bot #3704</b> was kicked from «matching · chat · decor · art · guilds · games · giveaways · tags · emojis». It wasn't us — the broadcast continues, connecting a replacement.",
      notif2:"Broadcast: bot <b>Bot #3537</b> was kicked from «/admiring ♡ giveaways , social & guilds». It wasn't us — the broadcast continues, connecting a replacement.",
      notif3:"Broadcast: bot <b>Bot #3539</b> was kicked from «/admiring ♡ giveaways , social & guilds». It wasn't us — the broadcast continues, connecting a replacement.",
      ph_upload:"https://… or upload a file below", ph_ids:"IDs comma-separated or one per line"
    },
    ru: {
      tab_templates:"Шаблоны", tab_launch:"Запуск", tab_tasks:"Задачи", tab_stats:"Статистика",
      new_tpl:"Новый шаблон", example:"Пример Nitro", f_name:"Название", recipient:"Получатель:", link_lbl:"Ссылка:", embed_h:"Эмбед",
      choose_file:"Выбрать файл", upload_hint:"PNG, JPEG, WEBP или GIF до 8 МБ · внешний URL или загрузка на сервер",
      bot_profile:"Профиль бота", bot_profile_p:"Имя, аватар и custom status выставляются при первом подключении бота к рассылке (один раз за run). Discord — не чаще ~1 смены имени в час.",
      set_name:"Установить имя бота", saved_as:"Сохранится как «Newspaper»", set_avatar:"Установить аватар", set_status:"Установить кастомный статус", status_hint:"16/128 · пусто = не менять presence",
      button_link:"Кнопка (link)", create_tpl:"Создать шаблон", cancel:"Отмена",
      preview:"Предпросмотр", preview_empty:"Предпросмотр появится здесь", saved_tpls:"Сохранённые шаблоны", edit:"Изменить", duplicate:"Дублировать", delete:"Удалить шаблон",
      meta1:"с кнопкой · author · аватар · бот «Newspaper» · статус «Important Notice» · 17.07.26, 18:15",
      meta2:"с кнопкой · author · аватар · бот «Newspaper» · статус «Important Notice» · 13.07.26, 21:31",
      meta3:"с кнопкой · author · аватар · бот «Newspaper» · статус «Important Notice» · 11.06.26, 11:11",
      meta4:"с кнопкой · аватар · бот «Gregory» · статус «Important Notice» · 05.06.26, 15:03",
      meta5:"статус «Официальное сообщение от Discord» · 31.05.26, 15:44",
      meta6:"с кнопкой · аватар · бот «Discord» · статус «Официальное сообщение от Discord» · 30.05.26, 17:57",
      meta7:"статус «Официальное сообщение от Discord» · 30.05.26, 16:11",
      tpl_title5:"Вам были выданы права **Администратора** на сервере", tpl_title6:"Вы были приглашены пообщаться", tpl_title7:"Хочешь получить халявные робуксы? То",
      launch_h:"Запуск рассылки", msg_tpl:"Шаблон сообщения",
      repeats:"Повторы и кулдауны", repeats_p:"Ссылка назначения нужна для шаблонов с [[LINK]] и для фильтров по конкретному серверу. Кулдауны можно комбинировать: дни и часы складываются (максимум 365 дней).",
      dest_link:"Ссылка назначения", dest_hint:"В шаблоне есть [[LINK]] — укажите инвайт или внешний URL",
      dedup_t:"Дедуп по таргету", dedup_t_sub:"Не слать тем, кто уже попал на этот сервер или ссылку<br>Укажите ссылку назначения выше.",
      cool_g:"Глобальный кулдаун", cool_g_sub:"Не слать, если участник получал любую рекламу за период ниже",
      within_last:"за последние", days:"дн.", hours:"ч.",
      cool_t:"Кулдаун по таргету", cool_t_sub:"Не слать, если уже получал рассылку на этот сервер/ссылку за период ниже",
      server_h:"Сервер", server_p:"Выберите назначенный сервер или укажите новый guild — для нового нужен OAuth-канал; селфбот должен быть на сервере.",
      assigned_server:"Назначенный сервер", opt_choose_id:"— Выберите или укажите ID ниже —", guild_id:"ID сервера (guild)", guild_id_hint:"Введите ID сервера",
      exclude_h:"Исключение участников сервера", exclude_p:"Необязательно: если указать сервер, его участники из guild_members не попадут в очередь рассылки. Без ID исключения не применяется.",
      exclude_server:"Сервер для исключения", opt_choose_server:"— Выберите сервер —",
      whom_h:"Кому отправлять", whom_p:"Все участники, только роли или конкретные ID. Исключение по ролям и участникам применяется после фильтра аудитории. Дедуп по ссылке — отдельно, в блоке выше.",
      audience:"Аудитория", aud_all:"Все участники", aud_roles:"Только роли", aud_ids:"Конкретные ID", exclude_members:"Исключить участников (ID)",
      online_prio:"Приоритет по онлайн-статусу", no_prio:"Без приоритета", online_first:"Сначала в сети, потом офлайн",
      bot_pool:"Пул ботов", leave_after:"Выйти с сервера после рассылки", leave_after_sub:"Все боты, которые участвовали в этой рассылке, покинут сервер по её окончании",
      poolbox:"<b>115</b> свободных из 3 755 в пуле<div class=\"dm-poolsub\">7 занято · 3 633 инвалидных · 3 294 в карантине</div>",
      msg_count:"Количество сообщений", how_many:"Сколько сообщений отправить", bots_needed:"Ботов нужно: <b>2</b>",
      sum_total:"Суммарно сообщений: 1 000", sum_hint:"Ботов посчитает бэкенд автоматически", sum_server:"Сервер:", sum_exclude:"Исключение участников:", not_set:"не задано", sum_bots:"Ботов (оценка):", sum_aud:"Аудитория:", sum_online:"Онлайн:",
      start_broadcast:"Запустить рассылку", active_hint:"Активных рассылок: 1 — можно запустить ещё на другой сервер",
      st_dm:"РАССЫЛКА В ЛС", bots_on_server:"Боты на сервере", dm_broadcast:"Рассылка в ЛС", running:"Идёт", sending:"Отправка сообщений",
      note1:"С сервера: 90 119 · в очереди 87 420", route_from:"С", route_to:"→ КУДА", stop:"Стоп",
      st_err:"ОШИБКА", bots_k:"Боты", done:"Готово", note3:"С сервера: 90 115 · в очереди 87 416", msg_short:"Сообщ.", retry:"Повторить", st_stop:"ОСТАНОВЛЕНА",
      err1:"Не удалось добавить ботов на сервер: нет прав или неверный oauth_channel_id. Проверьте права на добавление ботов и OAuth.",
      task_aud:"<b>Аудитория</b> Все участники · Сначала в сети, потом офлайн", stats_soon:"Статистика — скоро.",
      notifications:"Уведомления", open_broadcasts:"Открыть рассылки", time1:"2 минуты назад", time2:"Час назад",
      notif1:"Рассылка: бота <b>Bot #3704</b> кикнули с сервера «matching · chat · decor · art · guilds · games · giveaways · tags · emojis». Это сделали не мы — рассылка продолжается, подключаем замену.",
      notif2:"Рассылка: бота <b>Bot #3537</b> кикнули с сервера «/admiring ♡ giveaways , social & guilds». Это сделали не мы — рассылка продолжается, подключаем замену.",
      notif3:"Рассылка: бота <b>Bot #3539</b> кикнули с сервера «/admiring ♡ giveaways , social & guilds». Это сделали не мы — рассылка продолжается, подключаем замену.",
      ph_upload:"https://… или загрузите файл ниже", ph_ids:"ID через запятую или с новой строки"
    }
  };
  const dmLang = () => { try { const l = localStorage.getItem('vemoni_lang'); if (l === 'en' || l === 'ru') return l; } catch (_) {} return (navigator.language || '').startsWith('en') ? 'en' : 'ru'; };
  const dmT = (k) => { const d = DM_TXT[dmLang()] || DM_TXT.en; return d[k] != null ? d[k] : (DM_TXT.en[k] != null ? DM_TXT.en[k] : ''); };
  function dmApplyLang() {
    const d = DM_TXT[dmLang()] || DM_TXT.en, f = DM_TXT.en;
    document.querySelectorAll('[data-dm]').forEach((el) => { const v = d[el.dataset.dm] ?? f[el.dataset.dm]; if (v != null) el.textContent = v; });
    document.querySelectorAll('[data-dm-html]').forEach((el) => { const v = d[el.dataset.dmHtml] ?? f[el.dataset.dmHtml]; if (v != null) el.innerHTML = v; });
    document.querySelectorAll('[data-dm-ph]').forEach((el) => { const v = d[el.dataset.dmPh] ?? f[el.dataset.dmPh]; if (v != null) el.placeholder = v; });
  }
  $$('.lang-switch button').forEach((b) => b.addEventListener('click', () => setTimeout(dmApplyLang, 0)));
  dmApplyLang();

  $$('#dmall [data-preview]').forEach((el) => el.addEventListener('input', updatePreview));
  updatePreview();
})();
