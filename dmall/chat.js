/**
 * DMALL public chat — ported from vibecheckbot (chat + emoji/sticker picker + uploads),
 * adapted to the vemoni stack (plain script, buyer session, SSE). One shared room,
 * Discord-style (newest at the bottom). Click a message to reply (ping + snippet).
 * Custom emoji + stickers come from the servers our bots are on. Attachments
 * (image/video/file) + Ctrl+V paste, with NO VIP/boost gate. Realtime via SSE; an
 * unread dot lights the topbar button when a message arrives while the window is closed.
 * Desktop: docked panel on the right. Mobile: full-screen sheet.
 */
(function () {
  'use strict';
  const base = () => window.__VEMONI_API_BASE__ || '';
  const CDN = 'https://cdn.discordapp.com';
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const lang = () => { try { const l = localStorage.getItem('vemoni_lang'); if (l === 'en' || l === 'ru') return l; } catch (_) {} return (navigator.language || '').startsWith('en') ? 'en' : 'ru'; };
  const TXT = {
    en: { title: 'Chat', empty: 'No messages yet. Say hi 👋', placeholder: 'Message…', login: 'Sign in to chat', reply_to: 'Replying to', cancel: 'cancel', del_confirm: 'Delete this message?', failed: 'Something went wrong', member: 'member', del: 'Delete', attach: 'Attach a file', too_big: 'File is too large', photo: 'Photo', video: 'Video', file: 'File',
      p_stickers: 'Stickers', p_emoji: 'Emoji', p_search: 'Search…', p_fav: 'Favorites', p_recent: 'Recent', p_favorite: 'Favorite', p_empty: 'Nothing found',
      typing_one: '{name} is typing…', typing_many: 'Several users are typing…',
      mute: 'Mute', mute10m: '10 minutes', mute1h: '1 hour', mute1d: '1 day', mutePerm: 'Forever', unmute: 'Unmute', purge: 'Delete all messages', muted: 'User muted', unmuted: 'User unmuted', purged: 'Messages deleted', you_muted: 'You are muted and cannot post' },
    ru: { title: 'Чат', empty: 'Пока пусто. Поздоровайтесь 👋', placeholder: 'Сообщение…', login: 'Войдите, чтобы писать', reply_to: 'Ответ', cancel: 'отмена', del_confirm: 'Удалить сообщение?', failed: 'Что-то пошло не так', member: 'участник', del: 'Удалить', attach: 'Прикрепить файл', too_big: 'Файл слишком большой', photo: 'Фото', video: 'Видео', file: 'Файл',
      p_stickers: 'Стикеры', p_emoji: 'Эмодзи', p_search: 'Поиск…', p_fav: 'Избранное', p_recent: 'Недавние', p_favorite: 'В избранное', p_empty: 'Ничего не найдено',
      typing_one: '{name} печатает…', typing_many: 'Несколько человек печатают…',
      mute: 'Замьютить', mute10m: '10 минут', mute1h: '1 час', mute1d: '1 день', mutePerm: 'Навсегда', unmute: 'Снять мьют', purge: 'Удалить все сообщения', muted: 'Пользователь замьючен', unmuted: 'Мьют снят', purged: 'Сообщения удалены', you_muted: 'Вы в мьюте и не можете писать' },
  };
  const t = (k) => (TXT[lang()] && TXT[lang()][k]) || TXT.en[k] || k;

  const SEND_ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 5 16 12 9 19"/></svg>';
  const CLIP_ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5l-8.6 8.6a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.6 1.6 0 0 1-2.3-2.3l7.8-7.8"/></svg>';
  const STICKER_ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h6l7-7V7a3 3 0 0 0-3-3Z"/><path d="M13 20v-4a3 3 0 0 1 3-3h4"/></svg>';
  const EMOJI_ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="1.1" fill="currentColor" stroke="none"/><path d="M8.5 14.5a4 4 0 0 0 7 0"/></svg>';
  const REPLY_ICO = '<svg class="dm-chat-reply-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 7 4 12l5 5"/><path d="M4 12h9a5 5 0 0 1 5 5v1"/></svg>';
  const FILE_ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/></svg>';
  const CLOCK_ICO = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
  const MUTE_ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/></svg>';

  /* --------------------------- state --------------------------- */
  let messages = [], overlay = null, es = null, unread = false, replyTarget = null, sending = false, mounted = false;
  let me = { id: '', staff: false, authed: false };
  let lastSeen = 0; try { lastSeen = Number(localStorage.getItem('dmChatSeen') || 0); } catch (_) {}

  async function api(path, opts) {
    opts = opts || {};
    let tok = ''; try { tok = localStorage.getItem('vemoni_tok') || ''; } catch (_) {}
    const headers = {}; if (tok) headers.Authorization = 'Bearer ' + tok;
    const init = { method: opts.method || 'GET', credentials: 'include', headers };
    if (opts.body !== undefined) { headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(opts.body); }
    let r, d = null;
    try { r = await fetch(base() + path, init); } catch (_) { return { ok: false, status: 0, body: null }; }
    try { d = await r.json(); } catch (_) {}
    return { ok: r.ok, status: r.status, body: d };
  }
  const toast = (msg, kind) => { if (window.toast) window.toast(msg, kind || 'ok'); };

  /* --------------------------- render body --------------------------- */
  // Sticker / attachment / custom-emoji / mention rendering (from vibecheckbot renderChatBody).
  function renderBody(text) {
    const s = String(text == null ? '' : text);
    const att = s.match(/^\[\[(img|vid|file):(\/uploads\/[0-9a-f]{16}\.[a-z0-9]{1,8})(?:\|([^\]]*))?\]\]$/);
    if (att) {
      const kind = att[1], url = base() + att[2];
      if (kind === 'img') return '<img class="dm-chat-att-img" data-lb="' + esc(url) + '" src="' + esc(url) + '" alt="" loading="lazy">';
      if (kind === 'vid') return '<video class="dm-chat-att-vid" src="' + esc(url) + '" controls preload="metadata"></video>';
      let fname = t('file'); try { fname = decodeURIComponent(att[3] || '') || t('file'); } catch (_) {}
      return '<a class="dm-chat-att-file" href="' + esc(url) + '" download="' + esc(fname) + '">' + FILE_ICO + '<span>' + esc(fname) + '</span></a>';
    }
    const st = s.match(/^\[\[sticker:(\d{5,25}):(\d)\]\]$/);
    if (st) {
      const url = CDN + '/stickers/' + st[1] + '.' + (st[2] === '4' ? 'gif' : 'png') + '?size=160';
      return '<img class="dm-chat-sticker" src="' + esc(url) + '" alt="sticker" loading="lazy" onerror="this.remove()">';
    }
    return esc(s)
      .replace(/&lt;(a?):(\w{2,32}):(\d{5,25})&gt;/g, (m, a, name, id) =>
        '<img class="c-emoji" src="' + CDN + '/emojis/' + id + '.' + (a ? 'gif' : 'png') + '?size=44" alt=":' + esc(name) + ':" title=":' + esc(name) + ':" onerror="this.replaceWith(\':' + esc(name) + ':\')">')
      .replace(/&lt;@(\d{17,20})&gt;/g, () => '<span class="dm-chat-mention">@' + t('member') + '</span>');
  }
  const snippet = (s) => {
    const v = String(s == null ? '' : s);
    if (/^\[\[sticker:/.test(v)) return t('p_stickers');
    if (/^\[\[img:/.test(v)) return t('photo');
    if (/^\[\[vid:/.test(v)) return t('video');
    if (/^\[\[file:/.test(v)) return t('file');
    return v.replace(/<a?:(\w{2,32}):\d{5,25}>/g, ':$1:').replace(/\s+/g, ' ').trim();
  };
  const fmtTime = (at) => { try { return new Date(at).toLocaleString(lang() === 'ru' ? 'ru-RU' : 'en-US', { dateStyle: 'short', timeStyle: 'short' }); } catch (_) { return ''; } };

  // Discord-style "jumbo" emoji: when a message is ONLY emoji (custom or unicode) with no other
  // text, enlarge them — bigger the fewer there are, back to normal past ~30 or when mixed with text.
  function emojiScaleClass(text) {
    const s = String(text == null ? '' : text);
    if (/^\[\[/.test(s)) return '';   // attachment/sticker message — not emoji-only text
    let count = 0;
    let rest = s.replace(/<a?:\w{2,32}:\d{5,25}>/g, () => { count++; return ''; });   // custom emoji
    try { rest = rest.replace(/\p{Extended_Pictographic}(️|‍\p{Extended_Pictographic})*/gu, () => { count++; return ''; }); } catch (_) {}   // unicode emoji
    rest = rest.replace(/[\s‍️]/g, '');   // ignore whitespace / joiners / variation selectors
    if (!count || rest.length) return '';   // has other text → normal inline size
    if (count === 1) return ' emoji-only e1';
    if (count <= 3) return ' emoji-only e2';
    if (count <= 6) return ' emoji-only e3';
    if (count <= 15) return ' emoji-only e4';
    if (count <= 30) return ' emoji-only e5';
    return '';
  }

  function avatarHTML(m) {
    if (m.avatar) return '<span class="dm-chat-av"><img src="' + esc(m.avatar) + '" alt="" loading="lazy" onerror="this.remove()"></span>';
    const letter = (String(m.name || '?').trim()[0] || '?').toUpperCase();
    return '<span class="dm-chat-av"><span class="dm-chat-av-txt">' + esc(letter) + '</span></span>';
  }
  function msgHTML(m) {
    const mine = me.id && me.id === String(m.userId);
    const canDel = mine || me.staff;
    const canMute = me.staff && String(m.userId) !== me.id;   // staff can mute others
    const reply = m.reply
      ? '<div class="dm-chat-reply">' + REPLY_ICO + '<span class="dm-chat-reply-name">@' + esc(m.reply.name || t('member')) + '</span> <span class="dm-chat-reply-snip">' + renderBody(m.reply.text) + '</span></div>'
      : '';
    return '<div class="dm-chat-msg" data-msg="' + esc(m.id) + '" data-uid="' + esc(m.userId) + '" data-name="' + esc(m.name || '') + '" data-snip="' + esc(snippet(m.body)) + '">' +
      avatarHTML(m) +
      '<div class="dm-chat-body">' +
        '<div class="dm-chat-head-line">' +
          '<span class="dm-chat-author">' + esc(m.name || t('member')) + '</span>' +
          '<span class="dm-chat-time">' + esc(fmtTime(m.at)) + '</span>' +
          (canMute ? '<button class="dm-chat-mute" data-mute="' + esc(m.userId) + '" data-mname="' + esc(m.name || '') + '" title="' + esc(t('mute')) + '">' + MUTE_ICO + '</button>' : '') +
          (canDel ? '<button class="dm-chat-del" data-del="' + esc(m.id) + '" title="' + esc(t('del')) + '">✕</button>' : '') +
        '</div>' + reply +
        '<div class="dm-chat-text' + emojiScaleClass(m.body) + '">' + renderBody(m.body) + '</div>' +
      '</div>' +
    '</div>';
  }

  /* --------------------------- unread dot --------------------------- */
  const msgTime = (m) => new Date(m.at).getTime();
  function paintDot() { document.querySelectorAll('[data-dm-chat-dot]').forEach((d) => d.classList.toggle('on', unread)); }
  function setUnread(on) { unread = on; paintDot(); }
  function markSeen() {
    if (messages.length) lastSeen = Math.max(lastSeen, msgTime(messages[messages.length - 1]));
    try { localStorage.setItem('dmChatSeen', String(lastSeen)); } catch (_) {}
    setUnread(false);
  }
  function recomputeUnread() {
    const newest = messages[messages.length - 1];
    setUnread(!!(newest && msgTime(newest) > lastSeen && String(newest.userId) !== me.id));
  }

  /* --------------------------- feed --------------------------- */
  const nearBottom = (list) => list.scrollHeight - list.scrollTop - list.clientHeight < 100;
  function renderList() {
    const list = overlay && $('.dm-chat-list', overlay); if (!list) return;
    list.innerHTML = messages.length ? messages.map(msgHTML).join('') : '<div class="dm-chat-empty">' + esc(t('empty')) + '</div>';
    list.scrollTop = list.scrollHeight;
  }
  function onAdd(m) {
    if (!m || messages.some((x) => x.id === m.id)) return;
    messages.push(m);
    if (messages.length > 100) messages = messages.slice(-100);
    if (overlay) {
      const list = $('.dm-chat-list', overlay);
      const stick = nearBottom(list);
      const empty = $('.dm-chat-empty', list); if (empty) empty.remove();
      list.insertAdjacentHTML('beforeend', msgHTML(m));
      if (stick || String(m.userId) === me.id) list.scrollTop = list.scrollHeight;
      markSeen();
    } else if (String(m.userId) !== me.id && msgTime(m) > lastSeen) {
      setUnread(true);
    }
  }
  function onDel(id) {
    messages = messages.filter((m) => m.id !== id);
    const el = overlay && overlay.querySelector('.dm-chat-msg[data-msg="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]');
    if (el) el.remove();
  }
  function onDelUser(userId) {
    const uid = String(userId);
    messages = messages.filter((m) => String(m.userId) !== uid);
    if (overlay) overlay.querySelectorAll('.dm-chat-msg[data-uid="' + (window.CSS && CSS.escape ? CSS.escape(uid) : uid) + '"]').forEach((el) => el.remove());
  }

  /* --------------------------- realtime (SSE + poll fallback) --------------------------- */
  // Apply a fresh full list: append messages we don't have yet, drop ones that vanished.
  function applyList(list) {
    if (!Array.isArray(list)) return;
    const have = new Set(messages.map((m) => m.id));
    for (const m of list) if (m && m.id && !have.has(m.id)) onAdd(m);
    // Reflect deletions made elsewhere (only when the window is open).
    if (overlay) {
      const ids = new Set(list.map((m) => m && m.id));
      for (const m of messages.slice()) if (!ids.has(m.id)) onDel(m.id);
    }
  }
  let pollT = null;
  async function pollOnce() {
    try {
      const r = await fetch(base() + '/order/dmall/chat/list');
      const d = await r.json();
      if (d && Array.isArray(d.messages)) applyList(d.messages);
      if (d && Array.isArray(d.typers)) d.typers.forEach((tp) => onTyping(tp.userId, tp.name));   // "typing…" even when SSE is buffered
    } catch (_) {}
  }
  // Poll runs ALWAYS (not just as an SSE fallback) so messages + the typing indicator update in
  // near-real-time regardless of proxy SSE buffering. SSE stays for instant delivery.
  function startPoll() { if (pollT) return; pollT = setInterval(pollOnce, 4000); }
  function connect() {
    if (es) return;
    startPoll();
    try { es = new EventSource(base() + '/order/dmall/chat/stream'); } catch (_) { return; }
    es.onmessage = (e) => {
      let d; try { d = JSON.parse(e.data); } catch (_) { return; }
      if (d.type === 'init') {
        applyList(Array.isArray(d.messages) ? d.messages : []);
        if (overlay) { renderList(); markSeen(); } else { recomputeUnread(); }
      } else if (d.type === 'add') { onAdd(d.message); }
      else if (d.type === 'del') { onDel(d.id); }
      else if (d.type === 'delUser') { onDelUser(d.userId); }
      else if (d.type === 'typing') { onTyping(d.userId, d.name); }
    };
    es.onerror = () => startPoll();   // stream blocked/buffered (e.g. a proxy) → poll as fallback
    // Whenever the tab becomes visible again, pull once immediately — never wait for a refresh.
    document.addEventListener('visibilitychange', () => { if (!document.hidden) pollOnce(); });
    window.addEventListener('focus', pollOnce);
  }

  /* --------------------------- typing indicator --------------------------- */
  const typers = {};   // userId → { name, until }
  let lastTypingSent = 0, typingTimer = null;
  function emitTyping() {
    const now = Date.now();
    if (now - lastTypingSent < 2500) return;   // throttle: at most once per 2.5s while typing
    lastTypingSent = now;
    api('/order/dmall/chat/typing', { method: 'POST', body: {} });
  }
  function onTyping(userId, name) {
    if (!userId || String(userId) === me.id) return;
    typers[userId] = { name: name || t('member'), until: Date.now() + 4000 };
    renderTyping();
    if (!typingTimer) typingTimer = setInterval(() => { const before = Object.keys(typers).length; const now = Date.now(); for (const id in typers) if (typers[id].until <= now) delete typers[id]; if (Object.keys(typers).length !== before) renderTyping(); if (!Object.keys(typers).length) { clearInterval(typingTimer); typingTimer = null; } }, 1000);
  }
  function renderTyping() {
    const el = overlay && $('[data-typing]', overlay); if (!el) return;
    const now = Date.now();
    const names = Object.values(typers).filter((x) => x.until > now).map((x) => x.name);
    if (!names.length) { el.hidden = true; el.innerHTML = ''; return; }
    el.hidden = false;
    const label = names.length === 1 ? t('typing_one').replace('{name}', names[0]) : t('typing_many');
    el.innerHTML = esc(label.replace(/[.…]+$/, '')) + '<span class="dm-typing-dots"><i></i><i></i><i></i></span>';
  }

  /* --------------------------- reply --------------------------- */
  function setReply(target) {
    replyTarget = target;
    const bar = overlay && $('.dm-chat-replybar', overlay); if (!bar) return;
    if (target) {
      bar.hidden = false;
      $('[data-reply-name]', bar).textContent = '@' + (target.name || t('member'));
      const inp = $('.dm-chat-input', overlay); if (inp) inp.focus();
    } else { bar.hidden = true; }
  }

  /* --------------------------- send --------------------------- */
  async function sendText(text) {
    if (sending || !text) return false;
    sending = true;
    try {
      const reply = replyTarget ? { userId: replyTarget.userId, name: replyTarget.name, text: replyTarget.text } : null;
      const r = await api('/order/dmall/chat', { method: 'POST', body: { text, reply } });
      if (!r.ok) { toast(r.body && r.body.error === 'muted' ? t('you_muted') : ((r.body && r.body.error) || t('failed')), 'err'); return false; }
      return true;
    } finally { sending = false; }
  }

  // Upload a file (image/video/file) then post it as an attachment message. No VIP gate.
  async function uploadAndSend(file) {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) return toast(t('too_big'), 'err');
    let dataUrl;
    try { dataUrl = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); }); }
    catch (_) { return toast(t('failed'), 'err'); }
    const r = await api('/order/dmall/chat/upload', { method: 'POST', body: { dataUrl, name: file.name } });
    if (!r.ok || !r.body || !r.body.url) { toast((r.body && r.body.error) || t('failed'), 'err'); return; }
    const up = r.body;
    const token = up.kind === 'image' ? '[[img:' + up.url + ']]'
      : up.kind === 'video' ? '[[vid:' + up.url + ']]'
      : '[[file:' + up.url + '|' + encodeURIComponent(up.name || t('file')) + ']]';
    if (await sendText(token)) setReply(null);
  }

  /* ===================== emoji / sticker picker (ported) ===================== */
  const RECENT_MAX = 24, FAV_MAX = 100;
  const readLS = (k) => { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch (_) { return []; } };
  const writeLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} };
  const favKey = (type) => 'dmep.fav.' + type, recentKey = (type) => 'dmep.recent.' + type;
  const minItem = (type, it) => type === 'emoji' ? { id: it.id, name: it.name, animated: !!it.animated } : { id: it.id, name: it.name, format: Number(it.format) };
  const itemUrl = (type, it) => it.url || (type === 'emoji' ? CDN + '/emojis/' + it.id + '.' + (it.animated ? 'gif' : 'png') + '?size=48' : CDN + '/stickers/' + it.id + '.' + (it.format === 4 ? 'gif' : 'png'));
  const isFav = (type, id) => readLS(favKey(type)).some((x) => x.id === id);
  function toggleFav(type, it) { const arr = readLS(favKey(type)); const i = arr.findIndex((x) => x.id === it.id); if (i >= 0) arr.splice(i, 1); else arr.unshift(minItem(type, it)); writeLS(favKey(type), arr.slice(0, FAV_MAX)); }
  function pushRecent(type, it) { const arr = readLS(recentKey(type)).filter((x) => x.id !== it.id); arr.unshift(minItem(type, it)); writeLS(recentKey(type), arr.slice(0, RECENT_MAX)); }

  let catCache = null;
  async function getCatalog() {
    if (catCache) return catCache;
    // Public route → plain fetch WITHOUT credentials. (Sending credentials against a
    // wildcard-CORS response makes the browser drop it — that was the "nothing found" bug.)
    try {
      const r = await fetch(base() + '/order/dmall/chat/catalog');
      const d = await r.json();
      if ((d.emojis && d.emojis.length) || (d.stickers && d.stickers.length)) catCache = d;
      return d;
    } catch (_) { return catCache || { emojis: [], stickers: [] }; }
  }

  function createPicker(opts) {
    const el = document.createElement('div');
    el.className = 'dm-ep';
    el.hidden = true;
    el.innerHTML =
      '<div class="dm-ep-tabs">' +
        '<button class="dm-ep-tab" type="button" data-tab="sticker">' + esc(t('p_stickers')) + '</button>' +
        '<button class="dm-ep-tab" type="button" data-tab="emoji">' + esc(t('p_emoji')) + '</button>' +
      '</div>' +
      '<div class="dm-ep-search"><input data-q type="text" placeholder="' + esc(t('p_search')) + '" spellcheck="false"></div>' +
      '<div class="dm-ep-body"><div class="dm-ep-rail" data-rail></div><div class="dm-ep-grid" data-grid></div></div>';
    document.body.append(el);
    const gridEl = $('[data-grid]', el), railEl = $('[data-rail]', el), qEl = $('[data-q]', el);
    let tab = 'emoji', catalog = null, query = '', io = null;

    const itemFromBtn = (b) => b.classList.contains('dm-ep-emoji') ? { id: b.dataset.id, name: b.dataset.name, animated: b.dataset.animated === '1' } : { id: b.dataset.id, name: b.dataset.name, format: Number(b.dataset.format) };
    const initials = (label) => { const s = String(label || '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim(); return esc((s ? s.slice(0, 2) : '#').toUpperCase()); };
    const serverIcon = (g) => '<span class="dm-ep-ini">' + initials(g.label) + '</span>' + (g.icon ? '<img src="' + esc(g.icon) + '" alt="" loading="lazy" onerror="this.remove()">' : '');

    function buildGroups() {
      const q = query.toLowerCase();
      const flt = (items) => q ? items.filter((i) => (i.name || '').toLowerCase().includes(q)) : items;
      const groups = [];
      const fav = flt(readLS(favKey(tab))); if (fav.length) groups.push({ kind: 'fav', label: t('p_fav'), items: fav });
      const recent = flt(readLS(recentKey(tab))); if (recent.length) groups.push({ kind: 'recent', label: t('p_recent'), items: recent });
      for (const g of (tab === 'emoji' ? catalog.emojis : catalog.stickers) || []) { const items = flt(g.items); if (items.length) groups.push({ kind: 'server', label: g.guildName, icon: g.guildIcon, items }); }
      return groups;
    }
    function itemHTML(it) {
      const cls = tab === 'emoji' ? 'dm-ep-emoji' : 'dm-ep-sticker';
      const extra = tab === 'emoji' ? 'data-animated="' + (it.animated ? 1 : 0) + '"' : 'data-format="' + it.format + '"';
      const title = tab === 'emoji' ? ':' + esc(it.name) + ':' : esc(it.name);
      const faved = isFav(tab, it.id) ? ' faved' : '';
      return '<button class="' + cls + faved + '" type="button" data-id="' + it.id + '" data-name="' + esc(it.name) + '" ' + extra + ' title="' + title + '">' +
        '<img data-src="' + esc(itemUrl(tab, it)) + '" alt="" loading="lazy">' +
        '<span class="dm-ep-star" data-fav title="' + esc(t('p_favorite')) + '">★</span></button>';
    }
    function railBtn(g, i) { const inner = g.kind === 'fav' ? '★' : g.kind === 'recent' ? CLOCK_ICO : serverIcon(g); return '<button class="dm-ep-server dm-ep-rail-' + g.kind + '" type="button" data-jump="' + i + '" title="' + esc(g.label) + '">' + inner + '</button>'; }
    function groupHTML(g, i) {
      const head = g.kind === 'server' ? '<span class="dm-ep-head-ico">' + serverIcon(g) + '</span><span>' + esc(g.label) + '</span>' : '<span>' + esc(g.label) + '</span>';
      return '<div class="dm-ep-group" data-group="' + i + '"><div class="dm-ep-group-head dm-ep-head-' + g.kind + '">' + head + '</div><div class="dm-ep-items">' + g.items.map(itemHTML).join('') + '</div></div>';
    }
    function loadGroupImages(group) { for (const img of group.querySelectorAll('img[data-src]')) { img.src = img.dataset.src; img.removeAttribute('data-src'); } }
    function observeGroups() {
      if (io) io.disconnect();
      io = new IntersectionObserver((entries) => { for (const e of entries) { if (!e.isIntersecting) continue; loadGroupImages(e.target); io.unobserve(e.target); } }, { root: gridEl, rootMargin: '300px 0px' });
      gridEl.querySelectorAll('.dm-ep-group').forEach((g) => io.observe(g));
    }
    function render() {
      if (!catalog) return;
      el.querySelectorAll('.dm-ep-tab').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
      const sc = gridEl.scrollTop;
      const groups = buildGroups();
      railEl.innerHTML = groups.map(railBtn).join('');
      gridEl.innerHTML = groups.length ? groups.map(groupHTML).join('') : '<div class="dm-ep-empty">' + esc(t('p_empty')) + '</div>';
      gridEl.scrollTop = sc;
      observeGroups();
    }
    el.addEventListener('click', (e) => {
      const tb = e.target.closest('.dm-ep-tab');
      if (tb) { tab = tb.dataset.tab; query = ''; qEl.value = ''; render(); gridEl.scrollTop = 0; return; }
      const jump = e.target.closest('[data-jump]');
      if (jump) { const target = gridEl.querySelector('.dm-ep-group[data-group="' + jump.dataset.jump + '"]'); if (target) { loadGroupImages(target); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); } return; }
      const star = e.target.closest('[data-fav]');
      if (star) { e.stopPropagation(); const b = star.closest('.dm-ep-emoji, .dm-ep-sticker'); if (b) { toggleFav(tab, itemFromBtn(b)); render(); } return; }
      const btn = e.target.closest('.dm-ep-emoji, .dm-ep-sticker');
      if (btn) { const it = itemFromBtn(btn); pushRecent(tab, it); if (tab === 'emoji') { opts.onEmoji && opts.onEmoji(it); } else { opts.onSticker && opts.onSticker(it); close(); } }
    });
    el.addEventListener('contextmenu', (e) => { const b = e.target.closest('.dm-ep-emoji, .dm-ep-sticker'); if (!b) return; e.preventDefault(); toggleFav(tab, itemFromBtn(b)); render(); });
    qEl.addEventListener('input', (e) => { query = e.target.value.trim(); render(); gridEl.scrollTop = 0; });

    function place(anchor) {
      const r = anchor.getBoundingClientRect();
      const pw = el.offsetWidth || 340, ph = el.offsetHeight || 400;
      let left = Math.min(r.right - pw, innerWidth - pw - 8); if (left < 8) left = 8;
      let top = r.top - ph - 8; if (top < 8) top = Math.min(r.bottom + 8, innerHeight - ph - 8);
      el.style.left = left + 'px'; el.style.top = top + 'px';
    }
    async function openTab(anchor, which) {
      tab = which || 'emoji'; query = ''; qEl.value = '';
      el.querySelectorAll('.dm-ep-tab').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
      // Show the picker immediately; if the catalog isn't loaded yet, show a loading spinner.
      if (!catalog) { railEl.innerHTML = ''; gridEl.innerHTML = '<div class="dm-ep-loading"><span class="dm-ep-spinner"></span></div>'; }
      place(anchor); el.hidden = false;
      catalog = await getCatalog();
      render(); gridEl.scrollTop = 0; place(anchor);
    }
    function close() { el.hidden = true; }
    function toggle(anchor, which) { if (!el.hidden && tab === which) close(); else openTab(anchor, which); }
    addEventListener('pointerdown', (e) => { if (el.hidden) return; if (el.contains(e.target) || e.target.closest('[data-ep-open]')) return; close(); });
    return { toggle, close, el, destroy: () => { if (io) io.disconnect(); el.remove(); } };
  }

  /* --------------------------- rich composer (contenteditable) --------------------------- */
  // The input is a contenteditable so custom emoji render as inline images (like Discord),
  // not as their <:name:id> token text. On send we serialize the DOM back to tokens.
  function isEmptyComposer(el) { return !el.textContent.trim() && !el.querySelector('img'); }
  function refreshEmpty(el) { el.classList.toggle('empty', isEmptyComposer(el)); }
  function emojiChip(em) {
    const img = document.createElement('img');
    img.className = 'ce-emoji';
    img.src = CDN + '/emojis/' + em.id + '.' + (em.animated ? 'gif' : 'png') + '?size=44';
    img.alt = ':' + em.name + ':';
    img.dataset.token = '<' + (em.animated ? 'a' : '') + ':' + em.name + ':' + em.id + '>';
    return img;
  }
  function insertNodeAtCaret(input, node) {
    input.focus();
    const sel = window.getSelection();
    let range;
    if (sel && sel.rangeCount && input.contains(sel.anchorNode)) { range = sel.getRangeAt(0); range.deleteContents(); }
    else { range = document.createRange(); range.selectNodeContents(input); range.collapse(false); }
    range.insertNode(node);
    range.setStartAfter(node); range.collapse(true);
    sel.removeAllRanges(); sel.addRange(range);
    refreshEmpty(input);
  }
  function insertTextAtCaret(input, text) { insertNodeAtCaret(input, document.createTextNode(text)); }
  // Serialize the composer DOM → message text: text nodes as-is, emoji imgs → token, <br>/<div> → newline.
  function readComposer(input) {
    let out = '';
    const walk = (node) => {
      for (const n of node.childNodes) {
        if (n.nodeType === 3) out += n.nodeValue;
        else if (n.nodeName === 'IMG') out += n.dataset.token || '';
        else if (n.nodeName === 'BR') out += '\n';
        else if (n.nodeName === 'DIV' || n.nodeName === 'P') { if (out && !out.endsWith('\n')) out += '\n'; walk(n); }
        else walk(n);
      }
    };
    walk(input);
    return out;
  }
  function clearComposer(input) { input.innerHTML = ''; refreshEmpty(input); }

  /* --------------------------- mute menu (staff) --------------------------- */
  function openMuteMenu(btn, targetId, name) {
    document.querySelector('.dm-mute-menu')?.remove();
    const menu = document.createElement('div');
    menu.className = 'dm-mute-menu';
    const opts = [{ m: 10, label: t('mute10m') }, { m: 60, label: t('mute1h') }, { m: 1440, label: t('mute1d') }, { m: 0, label: t('mutePerm') }];
    menu.innerHTML = '<div class="dm-mute-title">' + esc(name || '') + '</div>' +
      opts.map((o) => '<button type="button" data-min="' + o.m + '">' + esc(o.label) + '</button>').join('') +
      '<button type="button" class="dm-mute-unmute" data-min="-1">' + esc(t('unmute')) + '</button>' +
      '<button type="button" class="dm-mute-purge" data-purge="1">' + esc(t('purge')) + '</button>';
    document.body.append(menu);
    const r = btn.getBoundingClientRect();
    menu.style.top = (r.bottom + 4) + 'px';
    menu.style.left = Math.max(8, Math.min(r.left, innerWidth - menu.offsetWidth - 8)) + 'px';
    menu.addEventListener('click', async (ev) => {
      const purge = ev.target.closest('[data-purge]');
      if (purge) { menu.remove(); const res = await api('/order/dmall/chat/purge', { method: 'POST', body: { userId: targetId } }); toast(res.ok ? t('purged') : t('failed'), res.ok ? 'ok' : 'err'); return; }
      const b = ev.target.closest('[data-min]'); if (!b) return;
      const min = Number(b.dataset.min); menu.remove();
      if (min === -1) { const res = await api('/order/dmall/chat/unmute', { method: 'POST', body: { userId: targetId } }); toast(res.ok ? t('unmuted') : t('failed'), res.ok ? 'ok' : 'err'); }
      else { const res = await api('/order/dmall/chat/mute', { method: 'POST', body: { userId: targetId, minutes: min } }); toast(res.ok ? t('muted') : t('failed'), res.ok ? 'ok' : 'err'); }
    });
    setTimeout(() => document.addEventListener('click', function off(ev) { if (!menu.contains(ev.target)) { menu.remove(); document.removeEventListener('click', off); } }), 0);
  }

  /* --------------------------- lightbox --------------------------- */
  function openLightbox(src) {
    if (!src) return;
    document.querySelector('.dm-chat-lb')?.remove();
    const lb = document.createElement('div');
    lb.className = 'dm-chat-lb';
    lb.innerHTML = '<img class="dm-chat-lb-img" src="' + esc(src) + '" alt=""><button class="dm-chat-lb-close" type="button" aria-label="close">✕</button>';
    document.body.append(lb);
    const kill = () => { lb.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') kill(); };
    lb.addEventListener('click', (e) => { if (!e.target.closest('.dm-chat-lb-img')) kill(); });
    document.addEventListener('keydown', onKey);
  }

  /* --------------------------- window --------------------------- */
  const isDesktop = () => matchMedia('(min-width: 721px)').matches;
  let picker = null;

  function open() {
    if (overlay) return;
    const docked = isDesktop();
    overlay = document.createElement('div');
    overlay.className = 'dm-chat-modal' + (docked ? ' dm-chat-docked' : '');
    overlay.innerHTML =
      '<div class="dm-chat-box">' +
        '<div class="dm-chat-head"><b>' + esc(t('title')) + '</b><button class="dm-chat-close" type="button" data-close aria-label="close">✕</button></div>' +
        '<div class="dm-chat-list"></div>' +
        '<div class="dm-chat-typing" data-typing hidden></div>' +
        '<div class="dm-chat-replybar" hidden>' + esc(t('reply_to')) + ' <b data-reply-name></b><button type="button" data-reply-cancel>' + esc(t('cancel')) + '</button></div>' +
        (me.authed
          ? '<form class="dm-chat-form">' +
              '<input type="file" data-file multiple hidden>' +
              '<div class="dm-chat-inputbar">' +
                '<button type="button" class="dm-chat-tool" data-attach title="' + esc(t('attach')) + '">' + CLIP_ICO + '</button>' +
                '<div class="dm-chat-input empty" contenteditable="true" role="textbox" data-placeholder="' + esc(t('placeholder')) + '"></div>' +
                '<button type="button" class="dm-chat-tool" data-ep-open="sticker" title="' + esc(t('p_stickers')) + '">' + STICKER_ICO + '</button>' +
                '<button type="button" class="dm-chat-tool" data-ep-open="emoji" title="' + esc(t('p_emoji')) + '">' + EMOJI_ICO + '</button>' +
              '</div>' +
              '<button type="submit" class="dm-chat-send">' + SEND_ICO + '</button>' +
            '</form>'
          : '<a class="dm-chat-login" href="/dmall/">' + esc(t('login')) + '</a>') +
      '</div>';
    document.body.appendChild(overlay);

    renderList();
    markSeen();
    renderTyping();

    const input = $('.dm-chat-input', overlay);
    const form = $('.dm-chat-form', overlay);
    const fileInput = $('[data-file]', overlay);

    picker = createPicker({
      onEmoji: (em) => { if (input) insertNodeAtCaret(input, emojiChip(em)); },
      onSticker: async (stk) => { if (await sendText('[[sticker:' + stk.id + ':' + stk.format + ']]')) setReply(null); },
    });

    overlay.addEventListener('click', async (e) => {
      if (e.target === overlay || e.target.closest('[data-close]')) return close();
      if (e.target.closest('[data-reply-cancel]')) return setReply(null);
      const ep = e.target.closest('[data-ep-open]');
      if (ep) { e.preventDefault(); return picker.toggle(ep, ep.dataset.epOpen); }
      if (e.target.closest('[data-attach]')) { e.preventDefault(); return fileInput.click(); }
      const mute = e.target.closest('[data-mute]');
      if (mute) { e.stopPropagation(); return openMuteMenu(mute, mute.dataset.mute, mute.dataset.mname); }
      const del = e.target.closest('[data-del]');
      if (del) { e.stopPropagation(); if (!confirm(t('del_confirm'))) return; await api('/order/dmall/chat/' + encodeURIComponent(del.dataset.del), { method: 'DELETE' }); return; }
      const lb = e.target.closest('[data-lb]');
      if (lb) return openLightbox(lb.getAttribute('data-lb'));
      if (e.target.closest('a, button, img, video, .dm-chat-input')) return;
      const row = e.target.closest('.dm-chat-msg');
      if (row) setReply({ userId: row.dataset.uid, name: row.dataset.name, text: row.dataset.snip });
    });

    if (fileInput) fileInput.addEventListener('change', async () => { const files = [...fileInput.files]; fileInput.value = ''; for (const f of files) await uploadAndSend(f); });

    if (input) {
      input.addEventListener('input', () => { refreshEmpty(input); if (!isEmptyComposer(input)) emitTyping(); });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
        else if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); insertNodeAtCaret(input, document.createElement('br')); }
      });
      // Paste: files/screenshots → upload (no VIP gate); plain text → insert as text (strip rich HTML).
      input.addEventListener('paste', (e) => {
        const dt = e.clipboardData; if (!dt) return;
        const files = [...(dt.files || [])];
        if (!files.length && dt.items) for (const it of dt.items) if (it.kind === 'file') { const f = it.getAsFile(); if (f) files.push(f); }
        if (files.length) { e.preventDefault(); (async () => { for (const f of files) await uploadAndSend(f); })(); return; }
        e.preventDefault();
        insertTextAtCaret(input, dt.getData('text/plain') || '');
      });
      input.focus();
    }
    if (form) form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = readComposer(input).trim();
      if (!text) return;
      if (await sendText(text)) { clearComposer(input); setReply(null); }
    });
  }

  function close() {
    if (picker) { picker.destroy(); picker = null; }
    if (overlay) overlay.remove();
    overlay = null;
    replyTarget = null;
  }

  /* --------------------------- mount --------------------------- */
  async function mount() {
    if (mounted) return; mounted = true;
    const w = await api('/order/whoami');
    if (w.ok && w.body && w.body.authed) me = { id: String(w.body.userId || ''), staff: !!(w.body.isOwner || w.body.isAdmin), authed: true };
    paintDot();
    connect();
    document.addEventListener('click', (e) => { if (e.target.closest('[data-dm-chat-open]')) { e.preventDefault(); open(); } });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();

  // Shared toolkit so other features (tickets) can reuse the exact same emoji/sticker picker and
  // message renderer as the chat — identical look + mechanics.
  try { window.VemoniChatKit = { createPicker, renderBody }; } catch (_) {}
})();
