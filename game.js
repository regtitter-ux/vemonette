/* ===========================================================================
   Vemoni onboarding mini-game — a guided, Discord-accurate emulation.
   7 quests: create a role, create a channel, lock it, run /verify, pass
   verification, run /bal + set payout details, then watch #logs hit 200 checks
   and receive the payout DM. Self-contained; EN/RU follows the page language.
   =========================================================================== */
(function () {
  const root = document.getElementById('dgGame');
  if (!root) return;

  const RU = document.documentElement.lang === 'ru';
  const T = RU ? {
    server: 'Ваш сервер', sponsor: 'Anime Lounge', you: 'Вы', bot: 'Vemoni',
    general: 'основной', online: 'В сети', bots: 'Боты', membersRole: 'участники',
    welcomeTitle: (n) => `Добро пожаловать на\n${n}!`, welcomeSub: 'Это самое начало легендарного сервера. Пройдите квесты слева.',
    questN: (n) => `Квест ${n} / 7`, done: 'Готово',
    hints: {
      1: 'Нажмите на <b>название сервера</b> вверху → <b>Настройки сервера</b> → вкладка <b>Роли</b> → <b>Создать роль</b>. Придумайте ей название.',
      2: 'Наведите на <b>ТЕКСТОВЫЕ КАНАЛЫ</b> и нажмите <b>＋</b>, чтобы создать канал для верификации.',
      3: 'Откройте настройки канала #{ch} (шестерёнка) → <b>Права доступа</b>. Отключите просмотр для <b>@everyone</b> и добавьте роль {role} с доступом.',
      4: 'Зайдите в канал <b>#{ch}</b>, откройте поле ввода и вызовите команду <b>/verify</b>, выбрав роль {role}.',
      5: 'Нажмите <b>Пройти верификацию</b>, зайдите на сервер спонсора и подтвердите — вы получите роль {role}.',
      6: 'Вызовите команду <b>/bal</b> и нажмите <b>Изменить реквизиты</b>, укажите крипто-адрес для выплат.',
      7: 'Откройте канал <b>#{logs}</b> и следите, как участники проходят проверку. На <b>200</b> проверках придёт выплата.'
    },
    menu_settings: 'Настройки сервера',
    set_title: 'Настройки сервера', set_roles: 'Роли', set_createRole: 'Создать роль',
    role_name: 'Название роли', role_color: 'Цвет роли', role_default: 'Verified',
    create: 'Создать', cancel: 'Отмена', save: 'Сохранить', done_btn: 'Готово',
    ch_create_title: 'Создать канал', ch_type: 'Тип канала', ch_text: 'Текстовый канал',
    ch_name: 'Название канала', ch_default: 'verify',
    chset_title: (c) => `Настройки #${c}`, perms: 'Права доступа',
    perm_view: 'Просматривать канал', perm_view_d: 'Позволяет видеть этот канал.',
    perm_add: 'Добавить участников или роли', everyone: '@everyone',
    verif_title: 'Пройдите верификацию!', verif_desc: 'Чтобы получить полный доступ к серверу, пройдите верификацию. Нажмите кнопку ниже.',
    verif_btn: 'Пройти верификацию',
    eph_only: 'Видно только вам', eph_lead: 'Чтобы верифицироваться, зайдите на сервер спонсора и нажмите кнопку ещё раз.',
    join_btn: (s) => `Зайти на ${s} ↗`, joined: 'Вы зашли на сервер спонсора. Нажмите ещё раз, чтобы завершить.',
    verify_again: 'Завершить верификацию',
    verified_ok: (r) => `✅ Готово! Вам выдана роль ${r}. Теперь вы верифицированы.`,
    cmd_verify_d: 'Опубликовать карточку верификации', cmd_bal_d: 'Баланс и реквизиты для выплат',
    pick_role: 'Выберите роль',
    bal_title: 'Ваш баланс', bal_balance: 'Баланс', bal_reqs: 'Реквизиты для выплат', bal_notset: 'Не указаны',
    bal_edit: 'Изменить реквизиты', reqs_title: 'Реквизиты для выплат', reqs_ph: 'USDT TRC20 (адрес)',
    reqs_saved: 'Реквизиты сохранены',
    logs_line: (u, r) => `${u} прошёл(ла) верификацию — выдана роль ${r}`,
    logs_count: 'проверок',
    dm_title: 'Успешный вывод', dm_body: (a) => `Ваш вывод <span class="amt">${a}</span> выполнен. Средства отправлены на указанные реквизиты. Спасибо, что вы с Vemoni! 🎉`,
    win_title: 'Вы прошли все квесты!', win_sub: 'Именно так это и работает у настоящих партнёров: настроил один раз — и получаешь выплаты.',
    win_cta: 'Стать партнёром →', restart: '↻ Сыграть заново',
    names: ['sian', 'Pino', 'Zeii', 'mika', 'Kettu', 'Nova', 'Frost', 'Luna', 'Koda', 'Vex', 'Milo', 'Rin', 'Yuki', 'Onyx', 'Wren', 'Nori', 'Kai', 'Juno', 'Remy', 'Kova', 'Ash', 'Fenn', 'Poko', 'Nyx']
  } : {
    server: 'Your Server', sponsor: 'Anime Lounge', you: 'You', bot: 'Vemoni',
    general: 'general', online: 'Online', bots: 'Bots', membersRole: 'members',
    welcomeTitle: (n) => `Welcome to\n${n}!`, welcomeSub: 'This is the start of your legendary server. Work through the quests on the left.',
    questN: (n) => `Quest ${n} / 7`, done: 'Done',
    hints: {
      1: 'Click the <b>server name</b> at the top → <b>Server Settings</b> → <b>Roles</b> tab → <b>Create Role</b>. Give it a name.',
      2: 'Hover <b>TEXT CHANNELS</b> and click <b>＋</b> to create a channel where members will verify.',
      3: 'Open #{ch} settings (the gear) → <b>Permissions</b>. Turn off View Channel for <b>@everyone</b> and add the role {role} with access.',
      4: 'Go to <b>#{ch}</b>, open the message box and run the <b>/verify</b> command, choosing the {role} role.',
      5: 'Click <b>Start Verification</b>, join the sponsor server and confirm — you\'ll get the {role} role.',
      6: 'Run the <b>/bal</b> command and click <b>Edit details</b>, then add a crypto address for payouts.',
      7: 'Open <b>#{logs}</b> and watch members verify. At <b>200</b> checks your payout arrives.'
    },
    menu_settings: 'Server Settings',
    set_title: 'Server Settings', set_roles: 'Roles', set_createRole: 'Create Role',
    role_name: 'Role Name', role_color: 'Role Color', role_default: 'Verified',
    create: 'Create', cancel: 'Cancel', save: 'Save', done_btn: 'Done',
    ch_create_title: 'Create Channel', ch_type: 'Channel Type', ch_text: 'Text',
    ch_name: 'Channel Name', ch_default: 'verify',
    chset_title: (c) => `#${c} settings`, perms: 'Permissions',
    perm_view: 'View Channel', perm_view_d: 'Allows members to view this channel.',
    perm_add: 'Add members or roles', everyone: '@everyone',
    verif_title: 'Get verified!', verif_desc: 'To gain full access to the server, complete verification. Click the button below.',
    verif_btn: 'Start Verification',
    eph_only: 'Only you can see this', eph_lead: 'To verify, join the sponsor server and tap the button again.',
    join_btn: (s) => `Join ${s} ↗`, joined: 'You joined the sponsor server. Click again to finish.',
    verify_again: 'Finish verification',
    verified_ok: (r) => `✅ Done! You were granted the ${r} role. You're now verified.`,
    cmd_verify_d: 'Post the verification card', cmd_bal_d: 'Balance and payout details',
    pick_role: 'Pick a role',
    bal_title: 'Your balance', bal_balance: 'Balance', bal_reqs: 'Payment details', bal_notset: 'Not set',
    bal_edit: 'Edit details', reqs_title: 'Payment details', reqs_ph: 'USDT TRC20 (address)',
    reqs_saved: 'Details saved',
    logs_line: (u, r) => `${u} passed verification — granted ${r}`,
    logs_count: 'checks',
    dm_title: 'Withdrawal complete', dm_body: (a) => `Your withdrawal of <span class="amt">${a}</span> has been completed. Funds were sent to your saved details. Thanks for being with Vemoni! 🎉`,
    win_title: 'You cleared every quest!', win_sub: 'This is exactly how real partners run it: set it up once, then get paid.',
    win_cta: 'Become a partner →', restart: '↻ Play again',
    names: ['sian', 'Pino', 'Zeii', 'mika', 'Kettu', 'Nova', 'Frost', 'Luna', 'Koda', 'Vex', 'Milo', 'Rin', 'Yuki', 'Onyx', 'Wren', 'Nori', 'Kai', 'Juno', 'Remy', 'Kova', 'Ash', 'Fenn', 'Poko', 'Nyx']
  };

  const ROLE_COLORS = ['#5865f2', '#57f287', '#eb459e', '#faa61a', '#3ba55d', '#f23f43', '#00b0f4', '#9b59b6'];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const initials = (s) => (String(s || '?').trim()[0] || '?').toUpperCase();

  // ---- state ----
  let S, timers = [];
  function reset() {
    timers.forEach(clearInterval); timers.forEach(clearTimeout); timers = [];
    S = {
      quest: 1, roleName: '', roleColor: ROLE_COLORS[1],
      channel: '', logs: RU ? 'логи' : 'logs',
      everyoneDenied: false, roleAllowed: false,
      verified: false, requisites: '', checks: 0,
      sponsorJoined: false, cur: 'general',
      channels: {
        general: { name: T.general, locked: false, msgs: 'welcome' }
      },
      members: T.names.slice(0, 6)
    };
  }

  // ---------- rendering ----------
  function frame() {
    root.innerHTML = `
    <button class="dg-restart" id="dgRestart">${esc(T.restart)}</button>
    <div class="dg-hud">
      <div class="dg-counter"><span class="qn" id="dgQn">${esc(T.questN(1))}</span></div>
      <div class="dg-hint"><div class="ht">◆ ${RU ? 'Задание' : 'Objective'}</div><div class="hb" id="dgHint"></div></div>
    </div>
    <div class="dg-scale">
      <div class="dg-rail" id="dgRail"></div>
      <div class="dg-side">
        <div class="dg-shead" id="dgShead">${esc(T.server)} <span class="chev">▾</span></div>
        <div class="dg-chans" id="dgChans"></div>
        <div class="dg-userbar"><div class="av">${esc(initials(T.you))}</div><div class="who"><b>${esc(T.you)}</b><small>#0001</small></div></div>
      </div>
      <div class="dg-main">
        <div class="dg-topbar" id="dgTop"></div>
        <div class="dg-feed" id="dgFeed"></div>
        <div class="dg-composer" id="dgComposer">
          <div class="dg-input" id="dgInput"><span class="plus">＋</span><span class="ph" id="dgPh">${RU ? 'Написать в' : 'Message'} #${esc(T.general)}</span><span class="tools">＠ 🎁 GIF 😀</span></div>
        </div>
      </div>
      <div class="dg-members" id="dgMembers"></div>
    </div>`;
    root.querySelector('#dgRestart').onclick = () => start();
    renderRail(); renderChans(); renderMembers(); openChannel('general');
  }

  function renderRail() {
    const rail = root.querySelector('#dgRail');
    let h = `<div class="dg-guild home" title="Home"><svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 3.3 5.5 3.1v.1L12 11.6 6.5 8.5 12 5.3Z"/></svg></div><div class="dg-rail-sep"></div>`;
    h += `<div class="dg-guild active" title="${esc(T.server)}">${esc(initials(T.server))}</div>`;
    if (S.sponsorJoined) h += `<div class="dg-guild" id="dgSponsorGuild" title="${esc(T.sponsor)}">${esc(initials(T.sponsor))}</div>`;
    h += `<div class="dg-guild add" title="Add">＋</div>`;
    rail.innerHTML = h;
  }

  function renderChans() {
    const box = root.querySelector('#dgChans');
    const cat = `<div class="dg-cat">${RU ? 'ТЕКСТОВЫЕ КАНАЛЫ' : 'TEXT CHANNELS'} <span class="add" id="dgAddChan">＋</span></div>`;
    let items = '';
    for (const id of Object.keys(S.channels)) {
      const c = S.channels[id];
      items += `<div class="dg-chan${S.cur === id ? ' active' : ''}" data-ch="${id}">
        <span class="hash">${c.locked ? '🔒' : '#'}</span><span class="nm">${esc(c.name)}</span>
        <span class="gear" data-gear="${id}">⚙</span></div>`;
    }
    box.innerHTML = cat + items;
    box.querySelector('#dgAddChan').onclick = (e) => { e.stopPropagation(); onAddChannel(); };
    box.querySelectorAll('[data-ch]').forEach((el) => el.onclick = () => openChannel(el.dataset.ch));
    box.querySelectorAll('[data-gear]').forEach((el) => el.onclick = (e) => { e.stopPropagation(); onChannelSettings(el.dataset.gear); });
  }

  function renderMembers() {
    const box = root.querySelector('#dgMembers');
    const roleGroup = S.roleName
      ? `<div class="dg-mgroup" style="color:${S.roleColor}">${esc(S.roleName)} — 1</div>
         <div class="dg-member roled"><div class="av" style="background:${S.roleColor}">${esc(initials(T.you))}<span class="st"></span></div><div class="nm" style="color:${S.roleColor}">${esc(T.you)}</div></div>`
      : '';
    const online = S.members.map((n) => {
      const c = ROLE_COLORS[(n.charCodeAt(0)) % ROLE_COLORS.length];
      return `<div class="dg-member"><div class="av" style="background:${c}">${esc(initials(n))}<span class="st"></span></div><div class="nm">${esc(n)}</div></div>`;
    }).join('');
    const youOnline = S.roleName ? '' : `<div class="dg-member"><div class="av">${esc(initials(T.you))}<span class="st"></span></div><div class="nm">${esc(T.you)}</div></div>`;
    box.innerHTML = `
      <div class="dg-mgroup">${esc(T.bots)} — 1</div>
      <div class="dg-member"><div class="av" style="background:#5865f2"><img src="/assets/logo.png" alt=""/><span class="st"></span></div><div class="nm" style="color:#a7b0ff">${esc(T.bot)}</div></div>
      ${roleGroup}
      <div class="dg-mgroup">${esc(T.online)} — ${S.members.length + (S.roleName ? 0 : 1)}</div>
      ${youOnline}${online}`;
  }

  function botAvatar() { return `<div class="av"><img src="/assets/logo.png" alt=""/></div>`; }
  function botHead(ts) { return `<div class="mh"><span class="nm bot-nm">${esc(T.bot)}</span><span class="dg-bot-tag"><span class="ck">✓</span> ${RU ? 'БОТ' : 'BOT'}</span><span class="ts">${ts || (RU ? 'сегодня' : 'today') + ', 17:29'}</span></div>`; }

  function openChannel(id) {
    S.cur = id;
    const c = S.channels[id]; if (!c) return;
    renderChans();
    const top = root.querySelector('#dgTop');
    top.innerHTML = `<span class="hash">${c.locked ? '🔒' : '#'}</span> ${esc(c.name)}` +
      (id === 'logs' ? `<span class="dg-logcount">✓ <b id="dgCount">${S.checks}</b> / 200 ${esc(T.logs_count)}</span>` : '');
    root.querySelector('#dgPh').innerHTML = `${RU ? 'Написать в' : 'Message'} #${esc(c.name)}`;
    renderFeed();
    // re-arm the active quest so highlights land on the right (freshly rendered) nodes
    if (S._armCurrent) S._armCurrent();
  }

  function renderFeed() {
    const feed = root.querySelector('#dgFeed');
    const c = S.channels[S.cur];
    if (c.msgs === 'welcome') {
      feed.innerHTML = `<div class="dg-welcome"><div class="wic">#</div><h2>${esc(T.welcomeTitle(c.name)).replace('\n', '<br>')}</h2><p>${esc(T.welcomeSub)}</p></div>`;
      return;
    }
    feed.innerHTML = (c.msgs || []).map(renderMsg).join('');
    feed.scrollTop = feed.scrollHeight;
    wireFeed(feed);
  }
  function pushMsg(id, m) { const c = S.channels[id]; if (c.msgs === 'welcome' || !c.msgs) c.msgs = []; c.msgs.push(m); if (S.cur === id) renderFeed(); }

  function renderMsg(m) {
    if (m.type === 'sys') return `<div class="dg-sys"><span class="plus">＋</span> ${m.html}</div>`;
    const av = m.bot ? botAvatar() : `<div class="av"${m.color ? ` style="background:${m.color}"` : ''}>${esc(initials(m.user || T.you))}</div>`;
    const head = m.bot ? botHead(m.ts) : `<div class="mh"><span class="nm"${m.color ? ` style="color:${m.color}"` : ''}>${esc(m.user || T.you)}</span><span class="ts">${m.ts || (RU ? 'сегодня' : 'today') + ', 17:31'}</span></div>`;
    return `<div class="dg-msg">${av}<div class="bd">${head}<div class="tx">${m.html}</div>${m.extra || ''}</div></div>`;
  }
  function wireFeed(feed) {
    feed.querySelectorAll('[data-act]').forEach((b) => b.onclick = () => ACTS[b.dataset.act] && ACTS[b.dataset.act](b));
  }

  // ---------- HUD ----------
  function chip() { return `<span class="rolechip"><span class="dot" style="background:${S.roleColor}"></span>@${esc(S.roleName || T.role_default)}</span>`; }
  function setHint(n) {
    root.querySelector('#dgQn').textContent = T.questN(n);
    let h = T.hints[n] || '';
    h = h.replace('{ch}', esc(S.channel || T.ch_default)).replace('{logs}', esc(S.logs)).replace(/\{role\}/g, chip());
    root.querySelector('#dgHint').innerHTML = h;
  }
  function clearHL() { root.querySelectorAll('.dg-hl').forEach((e) => e.classList.remove('dg-hl')); }
  function hl(sel) { const e = typeof sel === 'string' ? root.querySelector(sel) : sel; if (e) e.classList.add('dg-hl'); return e; }

  // ---------- modals ----------
  function modal(html, wide) {
    closeModal();
    const bg = document.createElement('div');
    bg.className = 'dg-modal-bg'; bg.id = 'dgModal';
    bg.innerHTML = `<div class="dg-modal${wide ? ' wide' : ''}">${html}</div>`;
    root.appendChild(bg);
    return bg;
  }
  function closeModal() { const m = root.querySelector('#dgModal'); if (m) m.remove(); }

  // ---------- quest flow ----------
  function goQuest(n) {
    S.quest = n; clearHL(); S._armCurrent = null;
    setHint(n);
    ({ 1: q1, 2: q2, 3: q3, 4: q4, 5: q5, 6: q6, 7: q7 })[n]();
  }

  // Q1 — create a role
  function q1() {
    const arm = () => { clearHL(); hl('#dgShead'); };
    S._armCurrent = arm; arm();
    root.querySelector('#dgShead').onclick = openServerMenu;
  }
  function openServerMenu() {
    if (S.quest !== 1) return;
    const bg = modal(`
      <div class="dg-modal-h"><h3>${esc(T.set_title)}</h3></div>
      <div class="dg-modal-b"><div class="dg-set-nav" style="width:auto;background:transparent;padding:0">
        <div class="it active" id="dgOpenRoles">🏷 ${esc(T.set_roles)}</div>
      </div></div>`);
    hl('#dgOpenRoles');
    root.querySelector('#dgOpenRoles').onclick = openRolesSettings;
  }
  function openRolesSettings() {
    modal(`
      <div class="dg-set-nav"><div class="sec">${esc(T.set_title)}</div>
        <div class="it active">${esc(T.set_roles)}</div>
      </div>
      <div class="dg-set-body">
        <span class="dg-x" id="dgSetX">×</span>
        <h3>${esc(T.set_roles)}</h3>
        <button class="dg-btn" id="dgCreateRole">${esc(T.set_createRole)}</button>
        <div id="dgRoleEditor"></div>
      </div>`, true);
    root.querySelector('#dgSetX').onclick = () => { closeModal(); if (S._armCurrent) S._armCurrent(); };
    hl('#dgCreateRole');
    root.querySelector('#dgCreateRole').onclick = () => {
      clearHL();
      const ed = root.querySelector('#dgRoleEditor');
      ed.innerHTML = `
        <div class="dg-label">${esc(T.role_name)}</div>
        <input class="dg-field" id="dgRoleName" maxlength="24" placeholder="${esc(T.role_default)}" value="${esc(T.role_default)}" />
        <div class="dg-label">${esc(T.role_color)}</div>
        <div class="dg-swatches" id="dgSw">${ROLE_COLORS.map((c, i) => `<span class="dg-sw${i === 1 ? ' sel' : ''}" data-c="${c}" style="background:${c}"></span>`).join('')}</div>`;
      const inp = root.querySelector('#dgRoleName');
      inp.focus(); inp.select();
      root.querySelectorAll('#dgSw .dg-sw').forEach((s) => s.onclick = () => {
        root.querySelectorAll('#dgSw .dg-sw').forEach((x) => x.classList.remove('sel'));
        s.classList.add('sel'); S.roleColor = s.dataset.c; setHint(1);
      });
      // footer create button
      const foot = document.createElement('div'); foot.className = 'dg-modal-f';
      foot.innerHTML = `<button class="dg-btn" id="dgRoleSave">${esc(T.create)}</button>`;
      root.querySelector('#dgModal .dg-modal').appendChild(foot);
      hl('#dgRoleSave');
      root.querySelector('#dgRoleSave').onclick = () => {
        S.roleName = (inp.value || '').trim() || T.role_default;
        renderMembers(); closeModal(); goQuest(2);
      };
    };
  }

  // Q2 — create a channel
  function q2() {
    const arm = () => { clearHL(); hl('#dgAddChan'); };
    S._armCurrent = arm; arm();
  }
  function onAddChannel() {
    if (S.quest !== 2) return;
    modal(`
      <div class="dg-modal-h"><h3>${esc(T.ch_create_title)}</h3></div>
      <div class="dg-modal-b">
        <div class="dg-label">${esc(T.ch_type)}</div>
        <div class="dg-role-row"><span class="hash" style="font-size:20px">#</span> <b style="color:#fff">${esc(T.ch_text)}</b></div>
        <div class="dg-label">${esc(T.ch_name)}</div>
        <input class="dg-field" id="dgChName" maxlength="20" value="${esc(T.ch_default)}" />
      </div>
      <div class="dg-modal-f"><button class="dg-btn sec" id="dgChCancel">${esc(T.cancel)}</button><button class="dg-btn" id="dgChCreate">${esc(T.create)}</button></div>`);
    const inp = root.querySelector('#dgChName'); inp.focus(); inp.select();
    root.querySelector('#dgChCancel').onclick = closeModal;
    hl('#dgChCreate');
    root.querySelector('#dgChCreate').onclick = () => {
      let nm = (inp.value || '').trim().toLowerCase().replace(/\s+/g, '-') || T.ch_default;
      S.channel = nm;
      S.channels[nm] = { name: nm, locked: false, msgs: [] };
      closeModal(); renderChans(); goQuest(3);
    };
  }

  // Q3 — lock the channel
  function q3() {
    const arm = () => { clearHL(); const g = root.querySelector(`[data-gear="${S.channel}"]`); if (g) hl(g); };
    S._armCurrent = arm; arm();
  }
  function onChannelSettings(id) {
    if (S.quest !== 3 || id !== S.channel) return;
    drawPerms();
  }
  function drawPerms() {
    const roleAllowRow = S.roleAllowed ? `
      <div class="dg-perm">
        <div class="pl"><b style="color:${S.roleColor}">@${esc(S.roleName)}</b><small>${esc(T.perm_view_d)}</small></div>
        <div class="dg-toggle on"></div>
      </div>` : '';
    modal(`
      <div class="dg-set-nav"><div class="sec">${esc(T.chset_title(S.channel))}</div>
        <div class="it active">${esc(T.perms)}</div>
      </div>
      <div class="dg-set-body">
        <span class="dg-x" id="dgSetX">×</span>
        <h3>${esc(T.perms)}</h3>
        <div class="dg-perm">
          <div class="pl"><b>${esc(T.everyone)}</b><small>${esc(T.perm_view)}</small></div>
          <div class="dg-toggle ${S.everyoneDenied ? 'deny' : 'on'}" id="dgEvery"></div>
        </div>
        <div class="dg-perm-add" id="dgAddRole">＋ ${esc(T.perm_add)}</div>
        ${roleAllowRow}
        <div id="dgPermFoot"></div>
      </div>`, true);
    root.querySelector('#dgSetX').onclick = () => { closeModal(); if (S._armCurrent) S._armCurrent(); };
    const every = root.querySelector('#dgEvery');
    const addRole = root.querySelector('#dgAddRole');

    function refreshHints() {
      clearHL();
      if (!S.everyoneDenied) { hl(every); return; }
      if (!S.roleAllowed) { hl(addRole); return; }
      // both done -> show Done
      let foot = root.querySelector('#dgModal .dg-modal-f');
      if (!foot) {
        foot = document.createElement('div'); foot.className = 'dg-modal-f';
        foot.innerHTML = `<button class="dg-btn green" id="dgPermDone">${esc(T.done_btn)}</button>`;
        root.querySelector('#dgModal .dg-modal').appendChild(foot);
        root.querySelector('#dgPermDone').onclick = () => {
          S.channels[S.channel].locked = true; closeModal(); renderChans(); goQuest(4);
        };
      }
      hl('#dgPermDone');
    }
    every.onclick = () => { S.everyoneDenied = true; every.classList.remove('on'); every.classList.add('deny'); refreshHints(); };
    addRole.onclick = () => { if (!S.everyoneDenied) return; S.roleAllowed = true; drawPerms(); };
    refreshHints();
  }

  // Q4 — /verify
  function q4() {
    const arm = () => {
      clearHL();
      if (S.cur !== S.channel) { const el = root.querySelector(`[data-ch="${S.channel}"]`); if (el) hl(el); return; }
      hl('#dgInput');
    };
    S._armCurrent = arm; arm();
    root.querySelector('#dgInput').onclick = () => { if (S.quest === 4 && S.cur === S.channel) openSlash('verify'); };
  }
  function openSlash(only) {
    closeSlash();
    const cmds = [
      { n: 'verify', arg: RU ? '[роль]' : '[role]', d: T.cmd_verify_d },
      { n: 'bal', arg: '', d: T.cmd_bal_d }
    ].filter((c) => !only || c.n === only || (only === 'both'));
    const pop = document.createElement('div');
    pop.className = 'dg-slash'; pop.id = 'dgSlash';
    pop.innerHTML = `<div class="dg-slash-head">${RU ? 'КОМАНДЫ' : 'COMMANDS'} — ${esc(T.bot)}</div>` +
      cmds.map((c) => `<div class="dg-slash-item" data-cmd="${c.n}"><div class="ci">/</div><div class="cn">/${c.n}<span class="arg">${esc(c.arg)}</span></div><div class="cd">${esc(c.d)}</div></div>`).join('');
    root.querySelector('#dgComposer').appendChild(pop);
    root.querySelector('#dgPh').innerHTML = `<span class="typed">/${only && only !== 'both' ? only : ''}</span>`;
    pop.querySelectorAll('[data-cmd]').forEach((it) => it.onclick = () => { closeSlash(); (it.dataset.cmd === 'verify' ? pickRole : runBal)(); });
    // highlight the intended command
    clearHL();
    const want = pop.querySelector(`[data-cmd="${only && only !== 'both' ? only : 'verify'}"]`);
    if (want) hl(want);
  }
  function closeSlash() { const s = root.querySelector('#dgSlash'); if (s) s.remove(); const ph = root.querySelector('#dgPh'); }
  function pickRole() {
    const pop = document.createElement('div');
    pop.className = 'dg-pick'; pop.id = 'dgPick';
    pop.innerHTML = `<div class="ph">${esc(T.pick_role)}</div><div class="opt" id="dgPickRole"><span class="dot" style="background:${S.roleColor}"></span>@${esc(S.roleName)}</div>`;
    root.querySelector('#dgComposer').appendChild(pop);
    clearHL(); hl('#dgPickRole');
    root.querySelector('#dgPickRole').onclick = () => {
      pop.remove(); root.querySelector('#dgPh').innerHTML = `${RU ? 'Написать в' : 'Message'} #${esc(S.channel)}`;
      // post the verification card
      pushMsg(S.channel, {
        bot: true,
        html: `${RU ? 'Карточка верификации опубликована.' : 'Verification card posted.'}`,
        extra: verifCardEmbed()
      });
      goQuest(5);
    };
  }
  function verifCardEmbed() {
    return `<div class="dg-embed blurple">
      <div class="eauthor"><img src="/assets/logo.png" alt=""/> ${esc(T.bot)}</div>
      <div class="etitle">${esc(T.verif_title)}</div>
      <div class="edesc">${esc(T.verif_desc)}</div>
      <div class="dg-embed-btns"><button class="dg-btn green" data-act="startVerify">🔐 ${esc(T.verif_btn)}</button></div>
    </div>`;
  }

  // Q5 — pass verification
  function q5() {
    const arm = () => { clearHL(); if (S.cur !== S.channel) { const el = root.querySelector(`[data-ch="${S.channel}"]`); if (el) hl(el); return; } const b = root.querySelector('[data-act="startVerify"]'); if (b) hl(b); };
    S._armCurrent = arm; arm();
  }

  // Q6 — /bal + requisites
  function q6() {
    const arm = () => { clearHL(); hl('#dgInput'); };
    S._armCurrent = arm; arm();
    root.querySelector('#dgInput').onclick = () => { if (S.quest === 6) openSlash('bal'); };
  }
  function runBal() {
    root.querySelector('#dgPh').innerHTML = `${RU ? 'Написать в' : 'Message'} #${esc(S.channels[S.cur].name)}`;
    pushMsg(S.cur, { bot: true, html: `<span style="color:#949ba4;font-size:13px">${RU ? 'использовал' : 'used'} <span class="dg-cmd">/bal</span></span>`, extra: balEmbed() });
    clearHL();
    setTimeout(() => { const b = root.querySelector('[data-act="editReq"]'); if (b) hl(b); }, 30);
  }
  function balEmbed() {
    const reqs = S.requisites ? esc(S.requisites) : `<i style="color:#949ba4">${esc(T.bal_notset)}</i>`;
    return `<div class="dg-embed">
      <div class="eauthor"><img src="/assets/logo.png" alt=""/> ${esc(T.bal_title)}</div>
      <div class="efield"><b>${esc(T.bal_balance)}</b><span>$0.00</span></div>
      <div class="efield"><b>${esc(T.bal_reqs)}</b><span id="dgReqVal">${reqs}</span></div>
      <div class="dg-embed-btns"><button class="dg-btn sec" data-act="editReq">✎ ${esc(T.bal_edit)}</button></div>
    </div>`;
  }

  // Q7 — logs to 200 + payout DM
  function q7() {
    if (!S.channels.logs) { S.channels.logs = { name: S.logs, locked: false, msgs: [] }; renderChans(); }
    const arm = () => { clearHL(); const el = root.querySelector('[data-ch="logs"]'); if (el) hl(el); };
    S._armCurrent = arm; arm();
  }
  function startLogs() {
    clearHL();
    let i = 0;
    const tick = setInterval(() => {
      // append a log line
      const u = T.names[i % T.names.length]; i++;
      const col = ROLE_COLORS[u.charCodeAt(0) % ROLE_COLORS.length];
      pushMsg('logs', { bot: true, ts: '', html: `<span style="color:#3ba55d">✓</span> ${esc(T.logs_line(`<b style="color:${col}">${esc(u)}</b>`, `<span style="color:${S.roleColor}">@${esc(S.roleName)}</span>`))}` });
      const c = S.channels.logs.msgs; if (c.length > 24) c.shift();
      // bump the counter a bit faster than the lines (~200 in ~14s)
      S.checks = Math.min(200, S.checks + 4 + Math.floor(Math.random() * 4));
      const cn = root.querySelector('#dgCount'); if (cn) cn.textContent = S.checks;
      if (S.checks >= 200) { clearInterval(tick); payout(); }
    }, 380);
    timers.push(tick);
  }
  function payout() {
    const dm = document.createElement('div');
    dm.className = 'dg-dm'; dm.id = 'dgDM';
    dm.innerHTML = `
      <div class="dg-dm-h"><div class="av"><img src="/assets/logo.png" alt=""/></div><div><b>${esc(T.bot)}</b><small>${esc(T.dm_title)}</small></div></div>
      <div class="dg-dm-b">${T.dm_body('$10.00')}</div>`;
    root.appendChild(dm);
    requestAnimationFrame(() => dm.classList.add('show'));
    setTimeout(win, 2600);
  }
  function win() {
    const w = document.createElement('div');
    w.className = 'dg-win';
    w.innerHTML = `<div class="dg-win-card"><div class="em">🎉</div><h2>${esc(T.win_title)}</h2><p>${esc(T.win_sub)}</p>
      <a class="dg-btn green" href="/partner/" style="text-decoration:none;padding:11px 20px;display:inline-block">${esc(T.win_cta)}</a>
      <div style="margin-top:14px"><button class="dg-restart" style="position:static" id="dgWinRestart">${esc(T.restart)}</button></div></div>`;
    root.appendChild(w);
    w.querySelector('#dgWinRestart').onclick = () => start();
  }

  // ---------- action handlers (feed buttons) ----------
  const ACTS = {
    startVerify() {
      const feed = root.querySelector('#dgFeed');
      // ephemeral ad
      const eph = document.createElement('div');
      eph.className = 'dg-eph'; eph.id = 'dgEph';
      eph.innerHTML = ephAd();
      feed.appendChild(eph); feed.scrollTop = feed.scrollHeight;
      wireFeed(feed);
      clearHL(); const jb = eph.querySelector('[data-act="joinSponsor"]'); if (jb) hl(jb);
    },
    joinSponsor(b) {
      S.sponsorJoined = true; renderRail();
      const g = root.querySelector('#dgSponsorGuild'); if (g) { g.style.transform = 'scale(.4)'; requestAnimationFrame(() => { g.style.transition = 'transform .4s'; g.style.transform = 'scale(1)'; }); }
      const eph = root.querySelector('#dgEph');
      eph.innerHTML = `<div class="tx">${esc(T.joined)}</div><div class="dg-embed-btns"><button class="dg-btn green" data-act="finishVerify">✅ ${esc(T.verify_again)}</button></div><div class="ephtag">👁 ${esc(T.eph_only)}</div>`;
      wireFeed(eph.parentElement || root.querySelector('#dgFeed'));
      // fallback: wire directly
      const fb = eph.querySelector('[data-act="finishVerify"]'); if (fb) fb.onclick = () => ACTS.finishVerify(fb);
      clearHL(); if (fb) hl(fb);
    },
    finishVerify() {
      S.verified = true; renderMembers();
      const eph = root.querySelector('#dgEph');
      if (eph) eph.innerHTML = `<div class="tx">${esc(T.verified_ok(S.roleName))}</div><div class="ephtag">👁 ${esc(T.eph_only)}</div>`;
      goQuest(6);
    },
    editReq() {
      modal(`
        <div class="dg-modal-h"><h3>${esc(T.reqs_title)}</h3></div>
        <div class="dg-modal-b"><input class="dg-field" id="dgReq" placeholder="${esc(T.reqs_ph)}" value="TR7NHq...x9Kd" /></div>
        <div class="dg-modal-f"><button class="dg-btn sec" id="dgReqCancel">${esc(T.cancel)}</button><button class="dg-btn green" id="dgReqSave">${esc(T.save)}</button></div>`);
      const inp = root.querySelector('#dgReq'); inp.focus(); inp.select();
      root.querySelector('#dgReqCancel').onclick = closeModal;
      clearHL(); hl('#dgReqSave');
      root.querySelector('#dgReqSave').onclick = () => {
        S.requisites = (inp.value || '').trim() || 'TR7NHq...x9Kd';
        closeModal();
        const v = root.querySelector('#dgReqVal'); if (v) v.textContent = S.requisites;
        goQuest(7);
      };
    }
  };
  function ephAd() {
    return `<div class="ephtag" style="margin:0 0 6px">🔐 ${esc(T.bot)}</div>
      <div class="tx">${esc(T.eph_lead)}</div>
      <div class="dg-embed" style="margin-top:8px">
        <div class="eauthor">${esc(T.sponsor)}</div>
        <div class="edesc">discord.gg/${(T.sponsor).toLowerCase().replace(/\s+/g, '')}</div>
        <div class="dg-embed-btns"><button class="dg-btn" data-act="joinSponsor">${esc(T.join_btn(T.sponsor))}</button></div>
      </div>
      <div class="ephtag">👁 ${esc(T.eph_only)}</div>`;
  }

  // openChannel special-cases: entering #logs starts the run; slash on input for q4/q6
  const _openChannel = openChannel;
  openChannel = function (id) {
    _openChannel(id);
    if (id === 'logs' && S.quest === 7 && S.checks === 0) startLogs();
  };

  // ---------- boot ----------
  function start() {
    root.querySelectorAll('.dg-win, .dg-dm').forEach((e) => e.remove());
    reset(); frame(); goQuest(1);
  }
  start();
})();
