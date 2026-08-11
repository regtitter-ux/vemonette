/**
 * DMALL public chat — ported from vibecheckbot's chat, adapted to the vemoni stack
 * (plain script, buyer session, SSE). One shared room, Discord-style (newest at the
 * bottom). Click a message to reply (ping + snippet). Realtime via SSE; an unread dot
 * lights on the topbar button when a new message arrives while the window is closed.
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
    en: { title: 'Chat', empty: 'No messages yet. Say hi 👋', placeholder: 'Message…', login: 'Sign in to chat', reply_to: 'Replying to', cancel: 'cancel', del_confirm: 'Delete this message?', failed: 'Something went wrong', member: 'member', del: 'Delete' },
    ru: { title: 'Чат', empty: 'Пока пусто. Поздоровайтесь 👋', placeholder: 'Сообщение…', login: 'Войдите, чтобы писать', reply_to: 'Ответ', cancel: 'отмена', del_confirm: 'Удалить сообщение?', failed: 'Что-то пошло не так', member: 'участник', del: 'Удалить' },
  };
  const t = (k) => (TXT[lang()] && TXT[lang()][k]) || TXT.en[k] || k;

  const SEND_ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 5 16 12 9 19"/></svg>';
  const REPLY_ICO = '<svg class="dm-chat-reply-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 7 4 12l5 5"/><path d="M4 12h9a5 5 0 0 1 5 5v1"/></svg>';
  const EMOJIS = ['😀', '😂', '😊', '😍', '😎', '🤔', '😅', '😉', '🙌', '👍', '👎', '🔥', '💯', '🎉', '❤️', '👀', '🙏', '💪', '✅', '❌', '⚡', '💰', '🚀', '😭', '😡', '🤝', '👋', '💬', '⭐', '🥳', '😴', '🤷'];

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

  /* --------------------------- render helpers --------------------------- */
  // Text → HTML: custom Discord emoji <:name:id> → image; pings <@id> → @name.
  function renderBody(text) {
    return esc(String(text == null ? '' : text))
      .replace(/&lt;(a?):(\w{2,32}):(\d{5,25})&gt;/g, (m, a, name, id) =>
        '<img class="c-emoji" src="' + CDN + '/emojis/' + id + '.' + (a ? 'gif' : 'png') + '?size=44" alt=":' + esc(name) + ':" onerror="this.replaceWith(\':' + esc(name) + ':\')">')
      .replace(/&lt;@(\d{17,20})&gt;/g, () => '<span class="dm-chat-mention">@' + t('member') + '</span>');
  }
  const snippet = (s) => String(s == null ? '' : s).replace(/<a?:(\w{2,32}):\d{5,25}>/g, ':$1:').replace(/\s+/g, ' ').trim();
  const fmtTime = (at) => { try { return new Date(at).toLocaleString(lang() === 'ru' ? 'ru-RU' : 'en-US', { dateStyle: 'short', timeStyle: 'short' }); } catch (_) { return ''; } };

  function avatarHTML(m) {
    if (m.avatar) return '<span class="dm-chat-av"><img src="' + esc(m.avatar) + '" alt="" loading="lazy" onerror="this.remove()"></span>';
    const letter = (String(m.name || '?').trim()[0] || '?').toUpperCase();
    return '<span class="dm-chat-av"><span class="dm-chat-av-txt">' + esc(letter) + '</span></span>';
  }

  function msgHTML(m) {
    const mine = me.id && me.id === String(m.userId);
    const canDel = mine || me.staff;
    const reply = m.reply
      ? '<div class="dm-chat-reply">' + REPLY_ICO + '<span class="dm-chat-reply-name">@' + esc(m.reply.name || t('member')) + '</span> <span class="dm-chat-reply-snip">' + renderBody(m.reply.text) + '</span></div>'
      : '';
    return '<div class="dm-chat-msg" data-msg="' + esc(m.id) + '" data-uid="' + esc(m.userId) + '" data-name="' + esc(m.name || '') + '" data-snip="' + esc(snippet(m.body)) + '">' +
      avatarHTML(m) +
      '<div class="dm-chat-body">' +
        '<div class="dm-chat-head-line">' +
          '<span class="dm-chat-author">' + esc(m.name || t('member')) + '</span>' +
          '<span class="dm-chat-time">' + esc(fmtTime(m.at)) + '</span>' +
          (canDel ? '<button class="dm-chat-del" data-del="' + esc(m.id) + '" title="' + esc(t('del')) + '">✕</button>' : '') +
        '</div>' +
        reply +
        '<div class="dm-chat-text">' + renderBody(m.body) + '</div>' +
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
  const nearBottom = (list) => list.scrollHeight - list.scrollTop - list.clientHeight < 80;
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

  /* --------------------------- SSE --------------------------- */
  function connect() {
    if (es) return;
    try { es = new EventSource(base() + '/order/dmall/chat/stream'); } catch (_) { return; }
    es.onmessage = (e) => {
      let d; try { d = JSON.parse(e.data); } catch (_) { return; }
      if (d.type === 'init') {
        messages = Array.isArray(d.messages) ? d.messages : [];
        if (overlay) { renderList(); markSeen(); } else { recomputeUnread(); }
      } else if (d.type === 'add') { onAdd(d.message); }
      else if (d.type === 'del') { onDel(d.id); }
    };
    // EventSource auto-reconnects; silent errors are fine.
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
      if (!r.ok) { if (window.toast) window.toast((r.body && r.body.error) || t('failed'), 'err'); return false; }
      return true;
    } finally { sending = false; }
  }

  /* --------------------------- emoji palette --------------------------- */
  function toggleEmoji(btn, input) {
    const open = document.querySelector('.dm-chat-emoji-pop');
    if (open) { open.remove(); return; }
    const pop = document.createElement('div');
    pop.className = 'dm-chat-emoji-pop';
    pop.innerHTML = EMOJIS.map((e) => '<button type="button" data-e="' + e + '">' + e + '</button>').join('');
    document.body.appendChild(pop);
    const r = btn.getBoundingClientRect();
    pop.style.left = Math.max(8, Math.min(r.left, innerWidth - pop.offsetWidth - 8)) + 'px';
    pop.style.top = (r.top - pop.offsetHeight - 6) + 'px';
    pop.addEventListener('mousedown', (ev) => {
      const b = ev.target.closest('[data-e]'); if (!b) return;
      ev.preventDefault();
      const s = input.selectionStart || input.value.length;
      input.value = input.value.slice(0, s) + b.dataset.e + input.value.slice(input.selectionEnd || s);
      input.focus(); autosize(input); pop.remove();
    });
    setTimeout(() => document.addEventListener('click', function off(ev) {
      if (!pop.contains(ev.target) && ev.target !== btn) { pop.remove(); document.removeEventListener('click', off); }
    }), 0);
  }

  function autosize(el) { el.style.height = 'auto'; el.style.height = Math.min(120, el.scrollHeight) + 'px'; }

  /* --------------------------- window --------------------------- */
  const isDesktop = () => matchMedia('(min-width: 721px)').matches;

  function open() {
    if (overlay) return;
    const docked = isDesktop();
    overlay = document.createElement('div');
    overlay.className = 'dm-chat-modal' + (docked ? ' dm-chat-docked' : '');
    overlay.innerHTML =
      '<div class="dm-chat-box">' +
        '<div class="dm-chat-head"><b>' + esc(t('title')) + '</b><button class="dm-chat-close" type="button" data-close aria-label="close">✕</button></div>' +
        '<div class="dm-chat-list"></div>' +
        '<div class="dm-chat-replybar" hidden>' + esc(t('reply_to')) + ' <b data-reply-name></b><button type="button" data-reply-cancel>' + esc(t('cancel')) + '</button></div>' +
        (me.authed
          ? '<form class="dm-chat-form">' +
              '<div class="dm-chat-inputbar">' +
                '<button type="button" class="dm-chat-emoji-btn" data-emoji title="emoji">😊</button>' +
                '<textarea class="dm-chat-input" rows="1" placeholder="' + esc(t('placeholder')) + '"></textarea>' +
              '</div>' +
              '<button type="submit" class="dm-chat-send">' + SEND_ICO + '</button>' +
            '</form>'
          : '<a class="dm-chat-login" href="/dmall/">' + esc(t('login')) + '</a>') +
      '</div>';
    document.body.appendChild(overlay);

    renderList();
    markSeen();

    const input = $('.dm-chat-input', overlay);
    const form = $('.dm-chat-form', overlay);

    overlay.addEventListener('click', async (e) => {
      // Backdrop (mobile) or close button.
      if (e.target === overlay || e.target.closest('[data-close]')) return close();
      if (e.target.closest('[data-reply-cancel]')) return setReply(null);
      const emoji = e.target.closest('[data-emoji]');
      if (emoji) { e.preventDefault(); return toggleEmoji(emoji, input); }
      const del = e.target.closest('[data-del]');
      if (del) {
        e.stopPropagation();
        if (!confirm(t('del_confirm'))) return;
        await api('/order/dmall/chat/' + encodeURIComponent(del.dataset.del), { method: 'DELETE' });
        return;
      }
      // Click a message (not a link/button) → reply.
      if (e.target.closest('a, button, img, .dm-chat-input')) return;
      const row = e.target.closest('.dm-chat-msg');
      if (row) setReply({ userId: row.dataset.uid, name: row.dataset.name, text: row.dataset.snip });
    });

    if (input) {
      input.addEventListener('input', () => autosize(input));
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
      });
      input.focus();
    }
    if (form) form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = (input.value || '').trim();
      if (!text) return;
      if (await sendText(text)) { input.value = ''; autosize(input); setReply(null); }
    });
  }

  function close() {
    document.querySelector('.dm-chat-emoji-pop')?.remove();
    if (overlay) overlay.remove();
    overlay = null;
    replyTarget = null;
  }

  /* --------------------------- mount --------------------------- */
  async function mount() {
    if (mounted) return; mounted = true;
    // Who am I? (id + staff) — decides "mine"/delete rights and login state.
    const w = await api('/order/whoami');
    if (w.ok && w.body && w.body.authed) {
      me = { id: String(w.body.userId || ''), staff: !!(w.body.isOwner || w.body.isAdmin), authed: true };
    }
    paintDot();
    connect();
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-dm-chat-open]')) { e.preventDefault(); open(); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
