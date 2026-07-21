/* Vemoni owner-only universal search — injected into the header on every page.
   Shows a search box (only for the service owner) that resolves a Discord id to
   a partner cabinet (acting-as) or a server card. Self-contained: styles + auth
   are inlined so it works on any page regardless of that page's own scripts. */
(function () {
  'use strict';
  var BASE = (window.__VEMONI_API_BASE__ || '').replace(/\/+$/, '');
  var LANG = (function () { try { return localStorage.getItem('vemonette-lang') === 'en' ? 'en' : 'ru'; } catch (e) { return 'ru'; } })();
  var T = LANG === 'en'
    ? { ph: 'Search by ID (user / server / message)…', partner: 'Open cabinet', card: 'card', server: 'server', message: 'message', none: 'Nothing found', hint: 'Enter a Discord ID', nodata: 'no data yet', discord: 'Open in Discord' }
    : { ph: 'Поиск по ID (пользователь / сервер / сообщение)…', partner: 'Открыть кабинет', card: 'карточка', server: 'сервер', message: 'сообщение', none: 'Ничего не найдено', hint: 'Введите Discord ID', nodata: 'данных ещё нет', discord: 'Открыть в Discord' };

  function api(path) {
    var headers = {};
    try { var tok = localStorage.getItem('vemoni_tok'); if (tok) headers.Authorization = 'Bearer ' + tok; } catch (e) {}
    return fetch(BASE + path, { credentials: 'include', headers: headers }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  function injectStyles() {
    if (document.getElementById('ownersearch-css')) return;
    var css = ''
      + '.osrch{position:relative;flex:0 1 320px;min-width:150px}'
      + '.osrch input{width:100%;box-sizing:border-box;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);border-radius:9px;color:#e8eefb;font:inherit;font-size:13.5px;padding:8px 12px;outline:none}'
      + '.osrch input:focus{border-color:#5865F2;background:rgba(255,255,255,.07)}'
      + '.osrch input::placeholder{color:#8b98ad}'
      + '.osrch-drop{position:absolute;top:calc(100% + 6px);right:0;left:0;background:#141a26;border:1px solid rgba(255,255,255,.14);border-radius:11px;box-shadow:0 24px 60px -20px rgba(0,0,0,.8);padding:6px;z-index:9999;max-height:60vh;overflow:auto}'
      + '.osrch-row{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:8px;cursor:pointer;text-decoration:none;color:#e8eefb}'
      + '.osrch-row:hover{background:rgba(255,255,255,.07)}'
      + '.osrch-ic{width:30px;height:30px;border-radius:50%;flex:none;object-fit:cover;background:rgba(255,255,255,.08);display:inline-flex;align-items:center;justify-content:center;font-size:15px}'
      + '.osrch-tx{min-width:0;flex:1}'
      + '.osrch-tx b{display:block;font-size:13.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '.osrch-tx span{display:block;font-size:11.5px;color:#8b98ad;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '.osrch-tag{flex:none;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;color:#7cc7ff;background:rgba(34,168,240,.14);border-radius:5px;padding:2px 6px}'
      + '.osrch-dc{flex:none;color:#8b98ad;font-size:12px;padding:4px 6px;border-radius:6px}'
      + '.osrch-dc:hover{color:#7cc7ff;background:rgba(255,255,255,.06)}'
      + '.osrch-empty{padding:12px;color:#8b98ad;font-size:13px;text-align:center}'
      + '@media(max-width:640px){.osrch{flex-basis:150px}}';
    var st = document.createElement('style'); st.id = 'ownersearch-css'; st.textContent = css; document.head.appendChild(st);
  }

  function rowHtml(r) {
    if (r.type === 'partner') {
      var ic = r.avatar ? '<img class="osrch-ic" src="' + esc(r.avatar) + '" alt=""/>' : '<span class="osrch-ic">👤</span>';
      var nm = esc(r.name || r.username || ('ID ' + r.id));
      var sub = (r.username ? '@' + esc(r.username) + ' · ' : '') + 'ID ' + esc(r.id) + (r.hasData ? '' : ' · ' + esc(T.nodata));
      return '<a class="osrch-row" href="' + esc(r.cabinetUrl) + '"><span class="osrch-ic">👤</span><span class="osrch-tx"><b>' + nm + '</b><span>' + sub + '</span></span><span class="osrch-tag">' + esc(T.partner) + '</span></a>';
    }
    // card
    var title = esc(r.guildName || ('ID ' + (r.guildId || '?')));
    var sub2 = (r.ownerName ? esc(T.card) + ' · ' + esc(r.ownerName) : esc(T.card)) + (r.matchedBy === 'message' ? ' · ' + esc(T.message) : '');
    var dc = r.discordUrl ? '<a class="osrch-dc" href="' + esc(r.discordUrl) + '" target="_blank" rel="noopener" title="' + esc(T.discord) + '" onclick="event.stopPropagation()">↗</a>' : '';
    var href = r.cabinetUrl || r.discordUrl || '#';
    return '<a class="osrch-row" href="' + esc(href) + '"><span class="osrch-ic">🗂️</span><span class="osrch-tx"><b>' + title + '</b><span>' + sub2 + '</span></span>' + dc + '<span class="osrch-tag">' + esc(T.server) + '</span></a>';
  }

  function mount(host) {
    injectStyles();
    var box = document.createElement('div'); box.className = 'osrch';
    var input = document.createElement('input');
    input.type = 'search'; input.placeholder = T.ph; input.autocomplete = 'off'; input.spellcheck = false;
    var drop = document.createElement('div'); drop.className = 'osrch-drop'; drop.hidden = true;
    box.appendChild(input); box.appendChild(drop);
    host.insertBefore(box, host.firstChild);

    var timer = null, lastQ = '';
    function render(data) {
      var results = (data && data.results) || [];
      if (!results.length) { drop.innerHTML = '<div class="osrch-empty">' + esc(T.none) + '</div>'; drop.hidden = false; return; }
      drop.innerHTML = results.map(rowHtml).join('');
      drop.hidden = false;
    }
    function run() {
      var q = input.value.replace(/\D/g, '');
      if (q.length < 16) { drop.hidden = true; return; }
      if (q === lastQ) { drop.hidden = false; return; }
      lastQ = q;
      api('/partner/owner-search?q=' + encodeURIComponent(q)).then(render);
    }
    input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(run, 250); });
    input.addEventListener('focus', function () { if (drop.innerHTML) drop.hidden = false; });
    document.addEventListener('click', function (e) { if (!box.contains(e.target)) drop.hidden = true; });
    input.addEventListener('keydown', function (e) { if (e.key === 'Escape') { drop.hidden = true; input.blur(); } });
  }

  function findHost() {
    return document.querySelector('.topbar .top-right')   // partner / order / investor / developers
      || document.querySelector('nav .nav-right')          // buyers
      || document.querySelector('header .nav-actions')     // landing
      || document.querySelector('.topbar')
      || document.querySelector('header');
  }

  function init() {
    var host = findHost();
    if (!host) return;
    api('/partner/whoami').then(function (who) {
      if (who && who.authed && who.isOwner) mount(host);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
