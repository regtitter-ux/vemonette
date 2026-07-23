/* Vemoni owner-only universal search — injected into the header on every page.
   Owner-only: resolves a Discord id to a partner cabinet (acting-as) or a server
   card. Self-contained (styles + auth inlined). Centered in the header, real
   avatars, optimistic instant cabinet row, keyboard nav. */
(function () {
  'use strict';
  var BASE = (window.__VEMONI_API_BASE__ || '').replace(/\/+$/, '');
  var LANG = (function () { try { return localStorage.getItem('vemonette-lang') === 'en' ? 'en' : 'ru'; } catch (e) { return 'ru'; } })();
  var T = LANG === 'en'
    ? { ph: 'Search by Discord ID…', partner: 'Cabinet', card: 'card', server: 'server', message: 'message', none: 'Nothing found', nodata: 'no data yet', discord: 'Open in Discord', searching: 'Searching…' }
    : { ph: 'Поиск по Discord ID…', partner: 'Кабинет', card: 'карточка', server: 'сервер', message: 'сообщение', none: 'Ничего не найдено', nodata: 'данных ещё нет', discord: 'Открыть в Discord', searching: 'Ищем…' };

  function api(path, signal) {
    var headers = {};
    try { var tok = localStorage.getItem('vemoni_tok'); if (tok) headers.Authorization = 'Bearer ' + tok; } catch (e) {}
    return fetch(BASE + path, { credentials: 'include', headers: headers, signal: signal }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  function avatarHtml(url, fallbackChar, square) {
    var cls = 'osrch-ic' + (square ? ' sq' : '');
    if (url) return '<img class="' + cls + '" src="' + esc(url) + '" alt="" referrerpolicy="no-referrer" onerror="this.outerHTML=\'<span class=&quot;' + cls + '&quot;>' + esc(fallbackChar) + '</span>\'"/>';
    return '<span class="' + cls + '">' + esc(fallbackChar) + '</span>';
  }

  function injectStyles() {
    if (document.getElementById('ownersearch-css')) return;
    var css = [
      '.osrch{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(400px,42vw);z-index:60}',
      '.osrch-wrap{position:relative;display:flex;align-items:center}',
      '.osrch-mg{position:absolute;left:13px;top:50%;transform:translateY(-50%);pointer-events:none;color:#8b98ad;display:flex}',
      '.osrch input{width:100%;box-sizing:border-box;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:12px;color:#e8eefb;font:inherit;font-size:13.5px;padding:9px 32px 9px 37px;outline:none;transition:border-color .15s,background .15s,box-shadow .15s}',
      '.osrch input:focus{border-color:#5865F2;background:rgba(88,101,242,.08);box-shadow:0 0 0 3px rgba(88,101,242,.16)}',
      '.osrch input::placeholder{color:#8b98ad}',
      '.osrch input::-webkit-search-cancel-button{display:none}',
      '.osrch-clear{position:absolute;right:8px;top:50%;transform:translateY(-50%);cursor:pointer;color:#8b98ad;width:20px;height:20px;border-radius:50%;display:none;align-items:center;justify-content:center;font-size:16px;line-height:1;border:0;background:transparent;padding:0}',
      '.osrch-clear:hover{color:#e8eefb;background:rgba(255,255,255,.1)}',
      '.osrch.has-val .osrch-clear{display:inline-flex}',
      '.osrch-drop{position:absolute;top:calc(100% + 8px);right:0;left:0;background:#161d2b;border:1px solid rgba(255,255,255,.12);border-radius:14px;box-shadow:0 30px 70px -24px rgba(0,0,0,.85),0 2px 10px rgba(0,0,0,.4);padding:6px;z-index:9999;max-height:min(62vh,440px);overflow:auto;animation:osrch-in .15s cubic-bezier(.2,.8,.2,1)}',
      '@keyframes osrch-in{from{opacity:0;transform:translateY(-7px)}to{opacity:1;transform:none}}',
      '.osrch-row{display:flex;align-items:center;gap:11px;padding:9px 10px;border-radius:10px;cursor:pointer;text-decoration:none;color:#e8eefb;transition:background .12s}',
      '.osrch-row:hover,.osrch-row.sel{background:rgba(88,101,242,.15)}',
      '.osrch-ic{width:34px;height:34px;border-radius:50%;flex:none;object-fit:cover;background:rgba(255,255,255,.08);display:inline-flex;align-items:center;justify-content:center;font-size:16px;border:1px solid rgba(255,255,255,.09)}',
      '.osrch-ic.sq{border-radius:9px}',
      '.osrch-tx{min-width:0;flex:1}',
      '.osrch-tx b{display:block;font-size:13.5px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.osrch-tx span{display:block;font-size:11.5px;color:#8b98ad;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px}',
      '.osrch-tag{flex:none;font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;padding:3px 7px;border-radius:7px}',
      '.osrch-tag.p{color:#8ff0b4;background:rgba(87,242,135,.14)}',
      '.osrch-tag.s{color:#7cc7ff;background:rgba(34,168,240,.14)}',
      '.osrch-dc{flex:none;color:#8b98ad;font-size:14px;padding:5px 8px;border-radius:8px;text-decoration:none}',
      '.osrch-dc:hover{color:#7cc7ff;background:rgba(255,255,255,.08)}',
      '.osrch-empty{padding:15px 12px;color:#8b98ad;font-size:13px;text-align:center}',
      '.osrch-spin{width:18px;height:18px;border:2px solid rgba(255,255,255,.15);border-top-color:#5865F2;border-radius:50%;animation:osrch-rot .6s linear infinite}',
      '.osrch-load{display:flex;align-items:center;justify-content:center;gap:9px;padding:14px;color:#8b98ad;font-size:12.5px}',
      '@keyframes osrch-rot{to{transform:rotate(360deg)}}',
      '@media(max-width:760px){.osrch{width:min(300px,44vw)}}',
      '@media(max-width:560px){.osrch{display:none}}'
    ].join('');
    var st = document.createElement('style'); st.id = 'ownersearch-css'; st.textContent = css; document.head.appendChild(st);
  }

  var MG = '<svg class="osrch-mg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';

  function rowHtml(r) {
    if (r.type === 'partner') {
      var nm = esc(r.name || r.username || ('ID ' + r.id));
      var sub = (r.username ? '@' + esc(r.username) + ' · ' : '') + 'ID ' + esc(r.id) + (r.hasData ? '' : ' · ' + esc(T.nodata));
      return '<a class="osrch-row" href="' + esc(r.cabinetUrl) + '" data-i>' + avatarHtml(r.avatar, '👤', false)
        + '<span class="osrch-tx"><b>' + nm + '</b><span>' + sub + '</span></span><span class="osrch-tag p">' + esc(T.partner) + '</span></a>';
    }
    var title = esc(r.guildName || ('ID ' + (r.guildId || '?')));
    var sub2 = (r.ownerName ? esc(T.card) + ' · ' + esc(r.ownerName) : esc(T.card)) + (r.matchedBy === 'message' ? ' · ' + esc(T.message) : '');
    var dc = r.discordUrl ? '<a class="osrch-dc" href="' + esc(r.discordUrl) + '" target="_blank" rel="noopener" title="' + esc(T.discord) + '" onclick="event.stopPropagation()">↗</a>' : '';
    var href = r.cabinetUrl || r.discordUrl || '#';
    return '<a class="osrch-row" href="' + esc(href) + '" data-i>' + avatarHtml(r.guildIcon || r.ownerAvatar, '🗂️', true)
      + '<span class="osrch-tx"><b>' + title + '</b><span>' + sub2 + '</span></span>' + dc + '<span class="osrch-tag s">' + esc(T.server) + '</span></a>';
  }

  function mount(topbar) {
    injectStyles();
    if (getComputedStyle(topbar).position === 'static') topbar.style.position = 'relative';
    var box = document.createElement('div'); box.className = 'osrch';
    box.innerHTML = '<div class="osrch-wrap">' + MG
      + '<input type="search" autocomplete="off" spellcheck="false" placeholder="' + esc(T.ph) + '"/>'
      + '<button class="osrch-clear" tabindex="-1" aria-label="clear">×</button></div>'
      + '<div class="osrch-drop" hidden></div>';
    topbar.appendChild(box);
    var input = box.querySelector('input');
    var clear = box.querySelector('.osrch-clear');
    var drop = box.querySelector('.osrch-drop');

    var timer = null, lastQ = '', ctrl = null, sel = -1;
    function digits() { return input.value.replace(/\D/g, ''); }
    function setVal() { box.classList.toggle('has-val', !!input.value); }

    function showLoading(q) {
      // optimistic: any valid id opens a cabinet — render it instantly, enrich on response.
      drop.innerHTML = rowHtml({ type: 'partner', id: q, cabinetUrl: '/partner/?as=' + q, hasData: true })
        + '<div class="osrch-load"><span class="osrch-spin"></span>' + esc(T.searching) + '</div>';
      drop.hidden = false; sel = -1;
    }
    function render(data) {
      var results = (data && data.results) || [];
      drop.innerHTML = results.length ? results.map(rowHtml).join('') : '<div class="osrch-empty">' + esc(T.none) + '</div>';
      drop.hidden = false; sel = -1;
    }
    function run() {
      var q = digits();
      if (q.length < 16) { drop.hidden = true; lastQ = ''; return; }
      if (q === lastQ && drop.innerHTML) { drop.hidden = false; return; }
      lastQ = q;
      if (ctrl) ctrl.abort();
      ctrl = new AbortController();
      showLoading(q);
      api('/partner/owner-search?q=' + encodeURIComponent(q), ctrl.signal).then(function (d) { if (digits() === q) render(d); });
    }
    function move(d) {
      var rows = drop.querySelectorAll('.osrch-row'); if (!rows.length) return;
      if (sel >= 0 && rows[sel]) rows[sel].classList.remove('sel');
      sel = (sel + d + rows.length) % rows.length;
      rows[sel].classList.add('sel'); rows[sel].scrollIntoView({ block: 'nearest' });
    }

    input.addEventListener('input', function () { setVal(); clearTimeout(timer); timer = setTimeout(run, 120); });
    input.addEventListener('focus', function () { if (drop.innerHTML && digits().length >= 16) drop.hidden = false; });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter') { var rows = drop.querySelectorAll('.osrch-row'); if (sel >= 0 && rows[sel]) rows[sel].click(); }
      else if (e.key === 'Escape') { drop.hidden = true; input.blur(); }
    });
    clear.addEventListener('click', function () { input.value = ''; setVal(); drop.hidden = true; lastQ = ''; input.focus(); });
    document.addEventListener('click', function (e) { if (!box.contains(e.target)) drop.hidden = true; });
  }

  function findTopbar() {
    return document.querySelector('.topbar')
      || document.querySelector('header nav') || document.querySelector('nav')
      || document.querySelector('header');
  }

  function init() {
    var topbar = findTopbar();
    if (!topbar) return;
    api('/partner/whoami').then(function (who) { if (who && who.authed && who.isOwner) mount(topbar); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
