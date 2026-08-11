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
  let dmServer = null, dmServerId = null, dmServerAv = '';   // the server the broadcast is configured for (from the picker)
  const apiEl = $('#dmapi');
  const cabEl = $('#dmcab');
  let apiDocsLoaded = false;
  async function loadApiDocs() {
    if (apiDocsLoaded) return; apiDocsLoaded = true;
    const gen = $('#dmapi-gen'), copy = $('#dmapi-copy'), kv = $('#dmapi-keyval');
    try {
      const base = window.__VEMONI_API_BASE__ || '';
      const tok = localStorage.getItem('vemoni_tok') || '';
      const r = await fetch(base + '/order/dmall/apikey', { credentials: 'include', headers: tok ? { Authorization: 'Bearer ' + tok } : {} });
      if (!r.ok) { apiDocsLoaded = false; return; }   // non-owner: docs still render, no key/buttons (allow retry)
      const d = await r.json();
      if (d.base) { const el = $('#dmapi-base'); if (el) el.textContent = d.base; }
      if (kv) kv.textContent = d.key ? d.key : dmT('ak_unset');
      if (gen) gen.hidden = false;                    // owner → can (re)generate the key here
      if (copy) copy.hidden = !d.key;
    } catch (_) { apiDocsLoaded = false; }
  }
  { const gen = $('#dmapi-gen'); if (gen) gen.addEventListener('click', async () => {
      if (!confirm(dmT('ak_confirm'))) return;
      gen.disabled = true;
      try {
        const base = window.__VEMONI_API_BASE__ || '';
        const tok = localStorage.getItem('vemoni_tok') || '';
        const r = await fetch(base + '/order/dmall/apikey/generate', { method: 'POST', credentials: 'include', headers: Object.assign({ 'Content-Type': 'application/json' }, tok ? { Authorization: 'Bearer ' + tok } : {}), body: '{}' });
        const d = await r.json().catch(() => ({}));
        if (r.ok && d.key) { const kv = $('#dmapi-keyval'); if (kv) kv.textContent = d.key; const cp = $('#dmapi-copy'); if (cp) cp.hidden = false; }
        else alert(dmT('ak_fail') + ' ' + (d.error || r.status));
      } catch (_) { alert(dmT('ak_net')); }
      finally { gen.disabled = false; }
  }); }
  { const copy = $('#dmapi-copy'); if (copy) copy.addEventListener('click', () => {
      const kv = $('#dmapi-keyval'); const v = kv ? (kv.textContent || '').trim() : '';
      if (!/^dmall_/.test(v)) return;
      try { navigator.clipboard.writeText(v); copy.textContent = dmT('ak_copied'); setTimeout(() => { copy.textContent = dmT('ak_copy'); }, 1500); } catch (_) {}
  }); }
  $$('.dm-mode', modebar).forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      // Stays (join-buying) and API are staff-only; the public gets DMALL + Cabinet.
      if ((mode === 'stays' || mode === 'api') && !window.__VEMONI_DM_STAFF__) return;
      const dm = mode === 'dmall', api = mode === 'api', cab = mode === 'cab';
      $$('.dm-mode', modebar).forEach((b) => b.classList.toggle('active', b === btn));
      wrap.classList.toggle('dmall-on', dm || api || cab);   // hide the Stays view for all non-Stays modes
      dmall.hidden = !dm;
      if (apiEl) apiEl.hidden = !api;
      if (cabEl) cabEl.hidden = !cab;
      if (api) loadApiDocs();
      if (cab) loadCabinet();
      if (dm) { loadLots(); loadTasks(); }                 // refresh real servers + broadcasts on open
      if (dm && !dmServer) dmall.classList.add('picking');   // choose a server first
      if (bell) bell.hidden = !dm || dmall.classList.contains('picking');
      { const sb = $('#dm-selbar'); if (sb) sb.hidden = !dm || !dmServer || dmall.classList.contains('picking'); }
      if (!dm && notif) notif.classList.remove('on');
      window.scrollTo(0, 0);
    });
  });

  /* ---- server picker (pick a server where you're admin before configuring) ----
     Real avatar/banner URLs render when present (from the API later); otherwise
     a colour/gradient + letter placeholder is used. */
  const dmSelName = $('#dm-selname'), dmSelBar = $('#dm-selbar');
  const BOT_INVITE = 'https://discord.com/oauth2/authorize?client_id=1525863543310651442&permissions=8&integration_type=0&scope=bot';
  let dmServiceFee = 1;
  let dmLotPrice1k = 1;   // effective price per 1k for the SELECTED target (own lot / no lot → just the service fee)

  // Picker = a "+" cell (add a server) + one card per lot. Clicking a lot selects it as
  // the broadcast target; clicking "+" opens the create-lot modal.
  function lotCard(l) {
    const name = l.serverName || l.serverId;
    const av = (String(name).trim()[0] || '?').toUpperCase();
    const badges = (l.mine ? '<span class="dm-lot-badge" data-dm="lot_mine">yours</span>' : '')
      + (l.private ? '<span class="dm-lot-badge dm-lot-badge-priv" data-dm="lot_private">private</span>' : '');
    // Owner-only "⋮" menu (bottom-right): edit · make private/public · delete.
    const priv = l.private ? '1' : '';
    const menu = l.mine ? (
      '<span class="dm-lot-menu-btn" data-lot-menu="' + esc(l.id) + '" role="button" tabindex="0" title="' + esc(dmT('lot_menu')) + '"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="12" cy="19" r="1.9"/></svg></span>' +
      '<span class="dm-lot-menu" data-lot-menu-for="' + esc(l.id) + '">' +
        '<span class="dm-lot-mi" data-lot-edit="' + esc(l.id) + '" data-dm="lot_edit">Edit</span>' +
        '<span class="dm-lot-mi" data-lot-priv="' + esc(l.id) + '" data-priv="' + priv + '" data-dm="' + (l.private ? 'lot_make_public' : 'lot_make_private') + '">' + (l.private ? 'Make public' : 'Make private') + '</span>' +
        '<span class="dm-lot-mi dm-lot-mi-del" data-lot-del="' + esc(l.id) + '" data-dm="lot_delete">Delete</span>' +
      '</span>'
    ) : '';
    // Members and the price are each an unbreakable unit; the price wraps to its own line as a
    // WHOLE ("$5.00 / 1000 messages") instead of splitting mid-phrase when the card is narrow.
    const memPart = l.memberCount ? '<span class="dm-sp-mem">' + Number(l.memberCount).toLocaleString() + ' <span data-dm="members_word">members</span> ·</span>' : '';
    const pricePart = '<span class="dm-sp-price">$' + Number(l.userPricePer1k || 0).toFixed(2) + '<span data-dm="per1k"> / 1000 messages</span></span>';
    // Real server icon/banner when available; letter tile / gradient otherwise.
    const bannerStyle = l.banner ? "background-image:url('" + esc(l.banner) + "');background-size:cover;background-position:center" : 'background:linear-gradient(120deg,#3a3f6b,#20242e)';
    const avInner = l.icon ? '<img src="' + esc(l.icon) + '" alt="" loading="lazy">' : esc(av);
    const avStyle = l.icon ? '' : ' style="background:#3a4256"';
    // Lifetime per-server stats (successful broadcasts · delivered) — always shown, zeros until
    // the server has history.
    const runsDone = Number(l.runsDone) || 0, delivered = Number(l.delivered) || 0;
    const statsHtml = '<div class="dm-sp-stats"><span class="dm-sp-mem">' + runsDone.toLocaleString() + ' <span data-dm="runs_done_word">broadcasts</span> ·</span> <span class="dm-sp-mem">' + delivered.toLocaleString() + ' <span data-dm="delivered_word">messages delivered</span></span></div>';
    return '<button class="dm-sp-card dm-lot-card" data-lot="' + esc(l.id) + '" data-server="' + esc(l.serverId) + '" data-name="' + esc(name) + '" data-price="' + Number(l.userPricePer1k || 0) + '" data-mine="' + (l.mine ? '1' : '') + '">' +
      '<div class="dm-sp-banner" style="' + bannerStyle + '"><div class="dm-sp-scrim"></div><div class="dm-sp-topline"><div class="dm-sp-title">' + esc(name) + '</div>' + (badges ? '<div class="dm-sp-badges">' + badges + '</div>' : '') + '</div></div>' +
      '<div class="dm-sp-body"><div class="dm-sp-av"' + avStyle + '>' + avInner + '</div>' +
        '<div class="dm-sp-foot"><span class="dm-sp-online">' + memPart + pricePart + '</span></div>' +
        statsHtml +
      '</div>' + menu + '</button>';
  }
  function plusCell() {
    return '<button class="dm-sp-card dm-sp-add" id="dm-sp-add"><div class="dm-sp-add-inner"><span class="dm-sp-plus"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></span><span data-dm="lot_add">Add a server</span></div></button>';
  }
  function renderLots(lots) {
    const g = $('#dm-sp-grid'); if (!g) return;
    g.innerHTML = plusCell() + (Array.isArray(lots) ? lots : []).map(lotCard).join('');
    dmApplyLang();
  }
  let dmLots = [];
  async function loadLots() {
    const g = $('#dm-sp-grid'); if (g && !g.querySelector('.dm-sp-card')) renderLots([]);   // show "+" instantly
    const r = await dmApi('/order/dmall/lots');
    if (r.ok && r.body && r.body.serviceFeePer1k != null) dmServiceFee = Number(r.body.serviceFeePer1k) || 1;
    dmLots = (r.ok && r.body && Array.isArray(r.body.lots)) ? r.body.lots : [];
    renderLots(dmLots);
  }
  // Toggle a lot's privacy (private = visible only to its owner).
  async function dmSetLotPrivate(id, makePrivate) {
    const r = await dmApi('/order/dmall/lot', { method: 'POST', body: { id: id, private: !!makePrivate } });
    if (r.ok) { if (window.toast) window.toast(dmT(makePrivate ? 'lot_now_private' : 'lot_now_public'), 'ok'); loadLots(); }
    else if (window.toast) window.toast(dmT('lot_fail'), 'err');
  }
  // Open the modal in edit mode for one of the caller's lots.
  function dmEditLot(id) {
    const lot = (dmLots || []).find((l) => l && l.id === id);
    if (lot) openLotModal(lot);
  }

  /* ---- DMALL cabinet (dashboard): top stats + order history + earnings journal ---- */
  function cabDate(ts) {
    if (!ts) return '';
    try { return new Date(ts).toLocaleString(dmLang() === 'ru' ? 'ru-RU' : 'en-US', { dateStyle: 'short', timeStyle: 'short' }); } catch (_) { return ''; }
  }
  function cabAv(o) {
    const nm = o.serverName || o.serverId || '?';
    const letter = (String(nm).trim()[0] || '?').toUpperCase();
    return o.icon
      ? '<span class="dmc-av"><img src="' + esc(o.icon) + '" alt="" loading="lazy"/></span>'
      : '<span class="dmc-av dmc-av-txt">' + esc(letter) + '</span>';
  }
  function cabOrderRow(o) {
    const st = o.status === 'settled' ? dmT('cab_st_settled') : dmT('cab_st_active');
    const refunded = (Number(o.refunded) || 0) > 0 ? ' · <span class="dmc-refund">' + dmT('cab_refunded') + ' $' + Number(o.refunded).toFixed(2) + '</span>' : '';
    return '<div class="dmc-row"><div class="dmc-row-l">' + cabAv(o) +
      '<div class="dmc-row-main"><div class="dmc-row-t">' + esc(o.serverName || o.serverId || '') + '</div>' +
      '<div class="dmc-row-sub">' + esc(cabDate(o.createdAt)) + ' · ' + dmT('cab_delivered') + ' ' + (Number(o.delivered) || 0).toLocaleString() + ' / ' + (Number(o.count) || 0).toLocaleString() + '</div></div></div>' +
      '<div class="dmc-row-r"><div class="dmc-amt">$' + (Number(o.net) || 0).toFixed(2) + '</div><div class="dmc-badge">' + esc(st) + refunded + '</div></div></div>';
  }
  function cabEarnRow(e) {
    const sign = e.type === 'debit' ? '−' : '+';
    const cls = e.type === 'debit' ? 'dmc-neg' : 'dmc-pos';
    return '<div class="dmc-row"><div class="dmc-row-l"><div class="dmc-row-main"><div class="dmc-row-t">' + esc(e.serverName || e.guildId || '') + '</div>' +
      '<div class="dmc-row-sub">' + esc(cabDate(e.ts)) + ' · ' + dmT('cab_lot_income') + '</div></div></div>' +
      '<div class="dmc-row-r"><div class="dmc-amt ' + cls + '">' + sign + '$' + (Number(e.amount) || 0).toFixed(2) + '</div></div></div>';
  }
  async function loadCabinet() {
    const r = await dmApi('/order/dmall/cabinet');
    const d = (r.ok && r.body) ? r.body : { stats: {}, orders: [], earnings: [] };
    const s = d.stats || {};
    const setv = (id, v) => { const el = $(id); if (el) el.textContent = v; };
    setv('#dmc-spent', '$' + (Number(s.spent) || 0).toFixed(2));
    setv('#dmc-sent', (Number(s.sent) || 0).toLocaleString());
    setv('#dmc-runs', (Number(s.runs) || 0).toLocaleString());
    setv('#dmc-earn', '$' + (Number(s.earnings) || 0).toFixed(2));
    setv('#dmc-balance', '$' + (Number(s.balance) || 0).toFixed(2));
    const ob = $('#dmc-orders');
    if (ob) { const rows = d.orders || []; ob.innerHTML = rows.length ? rows.map(cabOrderRow).join('') : '<div class="dmc-empty" data-dm="cab_empty_orders">No orders yet.</div>'; }
    const eb = $('#dmc-earnings');
    if (eb) { const rows = d.earnings || []; eb.innerHTML = rows.length ? rows.map(cabEarnRow).join('') : '<div class="dmc-empty" data-dm="cab_empty_earn">No earnings yet.</div>'; }
    dmApplyLang();
  }

  function closeLotMenus() {
    $$('#dm-sp-grid .dm-lot-menu.open').forEach((m) => m.classList.remove('open'));
    $$('#dm-sp-grid .dm-lot-menu-btn.on').forEach((b) => b.classList.remove('on'));
  }
  function toggleLotMenu(id) {
    const menu = document.querySelector('.dm-lot-menu[data-lot-menu-for="' + id + '"]');
    const btn = document.querySelector('.dm-lot-menu-btn[data-lot-menu="' + id + '"]');
    const willOpen = menu && !menu.classList.contains('open');
    closeLotMenus();
    if (willOpen) { menu.classList.add('open'); if (btn) btn.classList.add('on'); }
  }
  // Close any open lot menu when clicking elsewhere.
  document.addEventListener('click', (e) => { if (!e.target.closest('.dm-lot-menu, .dm-lot-menu-btn')) closeLotMenus(); });

  const dmGrid = $('#dm-sp-grid');
  if (dmGrid) dmGrid.addEventListener('click', (e) => {
    const menuBtn = e.target.closest('[data-lot-menu]');
    if (menuBtn) { e.preventDefault(); e.stopPropagation(); toggleLotMenu(menuBtn.dataset.lotMenu); return; }
    const edit = e.target.closest('[data-lot-edit]');
    if (edit) { e.preventDefault(); e.stopPropagation(); closeLotMenus(); dmEditLot(edit.dataset.lotEdit); return; }
    const privItem = e.target.closest('[data-lot-priv]');
    if (privItem) { e.preventDefault(); e.stopPropagation(); closeLotMenus(); dmSetLotPrivate(privItem.dataset.lotPriv, privItem.dataset.priv !== '1'); return; }
    const del = e.target.closest('[data-lot-del]');
    if (del) { e.preventDefault(); e.stopPropagation(); closeLotMenus(); dmDeleteLot(del.dataset.lotDel); return; }
    if (e.target.closest('#dm-sp-add')) { openLotModal(); return; }
    const card = e.target.closest('.dm-lot-card'); if (!card) return;
    dmServer = card.dataset.name || '';
    dmServerId = card.dataset.server || '';
    // Broadcasting to your OWN lot costs only the service fee; someone else's lot costs their price + fee.
    dmLotPrice1k = (card.dataset.mine === '1') ? dmServiceFee : (Number(card.dataset.price) || dmServiceFee);
    const avSrc = card.querySelector('.dm-sp-av'); dmServerAv = avSrc ? avSrc.innerHTML : '';
    if (dmSelName) dmSelName.textContent = dmServer;
    { const ss = $('#dm-sum-server'); if (ss) ss.textContent = dmServer; }
    if (dmSelBar) dmSelBar.hidden = false;
    dmall.classList.remove('picking');
    if (bell) bell.hidden = false;
    updateLaunchPrice();
    window.scrollTo(0, 0);
  });
  { const chg = $('#dm-changeserver'); if (chg) chg.addEventListener('click', () => { dmall.classList.add('picking'); if (dmSelBar) dmSelBar.hidden = true; if (bell) bell.hidden = true; window.scrollTo(0, 0); }); }
  { const q = $('#dm-sp-q'); if (q) q.addEventListener('input', () => { const v = q.value.trim().toLowerCase(); $$('#dm-sp-grid .dm-lot-card').forEach((c) => { c.hidden = !!v && !(c.dataset.name || '').toLowerCase().includes(v); }); }); }

  async function dmDeleteLot(id) {
    if (!confirm(dmT('lot_del_confirm'))) return;
    const r = await dmApi('/order/dmall/lot', { method: 'DELETE', body: { id } });
    if (r.ok) loadLots();
  }

  /* ---- create-lot modal: add a server (id + price per 1000 messages) ---- */
  const lotModal = $('#dm-lot-modal');
  function lotFoot() {
    const foot = $('#dm-lot-foot'); if (!foot) return;
    const price = Math.max(0, Number(($('#dm-lot-price') || {}).value) || 0);
    const total = (price + dmServiceFee).toFixed(2);
    foot.innerHTML = dmT('lot_foot_total') + ' <b>$' + total + '</b>' + dmT('lot_foot_per1k')
      + ' <span class="dm-mut">($' + price.toFixed(2) + ' ' + dmT('lot_foot_yours') + ' + $' + dmServiceFee.toFixed(2) + ' ' + dmT('lot_foot_service') + ')</span>'
      + '<div class="dm-lot-note">' + dmT('lot_foot_note').replace('{fee}', '$' + dmServiceFee.toFixed(2)) + '</div>';
  }
  let dmEditLotId = null;
  function openLotModal(lot) {
    if (!lotModal) return;
    dmEditLotId = lot ? lot.id : null;
    const inv = $('#dm-lot-invite'); if (inv) inv.href = BOT_INVITE;
    const st = $('#dm-lot-status'); if (st) { st.hidden = true; st.textContent = ''; }
    const si = $('#dm-lot-server'), pi = $('#dm-lot-price');
    const h2 = lotModal.querySelector('h2'), go = $('#dm-lot-create');
    if (lot) {
      // Edit mode: server is fixed (the lot's identity); only the price changes.
      if (si) { si.value = lot.serverId || ''; si.readOnly = true; si.classList.add('dm-ro'); }
      if (pi) pi.value = Number(lot.pricePer1k || 0);
      if (h2) h2.setAttribute('data-dm', 'lot_edit_title');
      if (go) go.setAttribute('data-dm', 'lot_save');
      lotModal.classList.add('editing');
    } else {
      if (si) { si.value = ''; si.readOnly = false; si.classList.remove('dm-ro'); }
      if (pi) pi.value = 0;
      if (h2) h2.setAttribute('data-dm', 'lot_title');
      if (go) go.setAttribute('data-dm', 'lot_create');
      lotModal.classList.remove('editing');
    }
    lotFoot(); lotModal.hidden = false; dmApplyLang();
  }
  function closeLotModal() { if (lotModal) lotModal.hidden = true; }
  { const c = $('#dm-lot-close'); if (c) c.addEventListener('click', closeLotModal); }
  if (lotModal) lotModal.addEventListener('click', (e) => { if (e.target === lotModal) closeLotModal(); });
  { const p = $('#dm-lot-price'); if (p) p.addEventListener('input', lotFoot); }
  { const go = $('#dm-lot-create'); if (go) go.addEventListener('click', async () => {
      const sid = ((($('#dm-lot-server') || {}).value) || '').trim();
      const price = Math.max(0, Number(($('#dm-lot-price') || {}).value) || 0);
      const st = $('#dm-lot-status'); const setSt = (cls, m) => { if (st) { st.hidden = false; st.className = 'dm-lot-status ' + cls; st.textContent = m; } };
      // Edit mode → just update the price (no server change, no bot re-check).
      if (dmEditLotId) {
        go.disabled = true; setSt('pending', dmT('lot_saving'));
        const r = await dmApi('/order/dmall/lot', { method: 'POST', body: { id: dmEditLotId, pricePer1k: price } });
        go.disabled = false;
        if (r.ok && r.body && r.body.lot) { closeLotModal(); loadLots(); }
        else setSt('err', (r.body && r.body.error) || dmT('lot_fail'));
        return;
      }
      if (!/^\d{17,20}$/.test(sid)) { setSt('err', dmT('lot_bad_id')); return; }
      go.disabled = true; setSt('pending', dmT('lot_checking'));
      const r = await dmApi('/order/dmall/lot', { method: 'POST', body: { serverId: sid, pricePer1k: price } });
      go.disabled = false;
      if (r.ok && r.body && r.body.lot) { closeLotModal(); const si = $('#dm-lot-server'); if (si) si.value = ''; loadLots(); }
      else if (r.body && r.body.error === 'bot-not-on-server') setSt('err', dmT('lot_no_bot'));
      else setSt('err', (r.body && r.body.error) || dmT('lot_fail'));
    }); }

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
      updatePreview(); saveState();
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

  /* ---- message count → price (per-1k rate of the selected target, billed to the orders balance) ---- */
  function updateLaunchPrice() {
    const inp = $('#dm-l-count'), out = $('#dm-l-price');
    const n = Math.max(0, parseInt((inp && inp.value) || '0', 10) || 0);
    { const sc = $('#dm-sum-count'); if (sc) sc.textContent = n.toLocaleString(); }   // keep the summary in sync
    if (!out) return;
    // Staff only get the service fee waived — they still pay the lot creator's price. Everyone
    // else pays the full selected-target rate ($/1k × count/1000).
    const base = dmLotPrice1k || dmServiceFee;
    const rate = window.__VEMONI_DM_STAFF__ ? Math.max(0, base - dmServiceFee) : base;
    const price = (n / 1000) * rate;
    out.textContent = price % 1 === 0 ? '$' + price : '$' + price.toFixed(2);
  }
  $$('.dm-quick button', dmall).forEach((b) => {
    b.addEventListener('click', () => { const inp = $('#dm-l-count'); if (inp) inp.value = b.dataset.amt; updateLaunchPrice(); });
  });
  { const lc = $('#dm-l-count'); if (lc) lc.addEventListener('input', updateLaunchPrice); }

  /* ---- scheduled start: Immediately / In N minutes / At date-time ---- */
  let dmSchedMode = 'now';
  $$('#dm-sched-seg .dm-seg-btn').forEach((b) => b.addEventListener('click', () => {
    dmSchedMode = b.dataset.sched || 'now';
    $$('#dm-sched-seg .dm-seg-btn').forEach((x) => x.classList.toggle('active', x === b));
    const inEl = $('#dm-sched-in'), atEl = $('#dm-sched-at');
    if (inEl) inEl.hidden = dmSchedMode !== 'in';
    if (atEl) atEl.hidden = dmSchedMode !== 'at';
  }));
  // '' → immediate, an ISO string → scheduled, null → invalid (past / empty date).
  function dmScheduledStartISO() {
    if (dmSchedMode === 'in') {
      const m = Math.max(1, parseInt(($('#dm-sched-mins') || {}).value || '0', 10) || 0);
      return new Date(Date.now() + m * 60000).toISOString();
    }
    if (dmSchedMode === 'at') {
      const v = (($('#dm-sched-dt') || {}).value || '').trim();
      if (!v) return null;
      const t = new Date(v).getTime();
      if (!t || t < Date.now() + 30000) return null;   // empty / in the past / too soon
      return new Date(t).toISOString();
    }
    return '';
  }

  /* ---- DMALL operator wiring: helpers + the real launch flow ---- */
  // Thin JSON fetch to OUR backend proxy (which injects the secret operator key). Never
  // returns the operator key to the browser.
  async function dmApi(path, opts) {
    opts = opts || {};
    const base = window.__VEMONI_API_BASE__ || '';
    let tok = ''; try { tok = localStorage.getItem('vemoni_tok') || ''; } catch (_) {}
    const headers = {}; if (tok) headers.Authorization = 'Bearer ' + tok;
    const init = { method: opts.method || 'GET', credentials: 'include', headers };
    if (opts.body !== undefined) { headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(opts.body); }
    if (opts.idem) headers['Idempotency-Key'] = opts.idem;
    let r, d = null;
    try { r = await fetch(base + path, init); } catch (_) { return { ok: false, status: 0, body: null }; }
    try { d = await r.json(); } catch (_) {}
    return { ok: r.ok, status: r.status, body: d };
  }
  function dmSetStatus(cls, msg) { const st = $('#dm-launch-status'); if (st) { st.hidden = false; st.className = 'dm-launch-status ' + cls; st.textContent = msg; } }
  function dmParseColor(v) { v = String(v || '').trim().replace(/^#/, ''); if (/^[0-9a-f]{6}$/i.test(v)) return parseInt(v, 16); const n = parseInt(v, 10); return Number.isFinite(n) ? n : null; }
  function dmMapPriority(p) { p = String(p || ''); return p === 'online_only' ? 'online_only' : p === 'offline_only' ? 'offline_only' : 'any'; }
  function dmIdList(v) { return [...new Set(String(v || '').split(/[^\d]+/).filter((x) => /^\d{17,20}$/.test(x)))]; }
  // Map the shell's collected state into the operator template payload (+ bot profile).
  function dmBuildPayload(state, avatarRef) {
    const f = state.fields || {};
    const embeds = (state.embeds || []).map((e) => {
      const em = {};
      if (e.title) em.title = e.title;
      if (e.url) em.url = e.url;
      if (e.desc) em.description = e.desc;
      const col = dmParseColor(e.color); if (col != null) em.color = col;
      if (e.image) em.image = { url: e.image };
      if (e.thumb) em.thumbnail = { url: e.thumb };
      if (e.author) { em.author = { name: e.author }; if (e.authorurl) em.author.url = e.authorurl; if (e.authoricon) em.author.icon_url = e.authoricon; }
      if (e.footer) { em.footer = { text: e.footer }; if (e.footericon) em.footer.icon_url = e.footericon; }
      if (e.timestamp) em.timestamp = e.timestamp;
      return em;
    }).filter((em) => Object.keys(em).length);
    const components = (state.embeds || []).filter((e) => e.btnlabel && e.btnurl).map((e) => ({ label: e.btnlabel, url: e.btnurl }));
    // The operator requires embeds/components to be arrays (empty is fine), so always send them.
    const payload = { content: String(f.content || ''), embeds: embeds, components: components };
    const bp = {};
    if (f.setName && f.username) bp.username = f.username;
    if (f.setAvatar) { if (avatarRef) bp.avatar = avatarRef; else if (f.avatarUrl) bp.avatar = f.avatarUrl; }
    const out = { name: 'DMALL ' + new Date().toISOString().slice(0, 16).replace('T', ' '), payload };
    if (Object.keys(bp).length) out.bot_profile = bp;
    return out;
  }
  // Localize the operator's "why incomplete" reason: prefer a mapped reason_code, else the
  // operator's own label (RU) / error_summary (EN) based on the current locale.
  function dmReason(run) {
    const c = (run.completion && run.completion.reason_code) || run.reasonCode || '';
    const map = { queue_exhausted: 'reason_queue', ran_out_of_bots: 'reason_bots', dm_stalled: 'reason_stalled', mutual_guild_blocked: 'reason_mutual' };
    if (c && map[c]) return dmT(map[c]);
    const ru = (run.completion && run.completion.reason_label_ru) || run.reasonRu || run.status_detail || '';
    const en = run.error_summary || run.reasonEn || '';
    return dmLang() === 'ru' ? (ru || en) : (en || ru);
  }
  // Poll a run until it reaches a terminal state, streaming progress to the status line.
  function dmPollRun(id) {
    let stop = false;
    async function tick() {
      if (stop) return;
      const r = await dmApi('/order/dmall/op/runs/' + encodeURIComponent(id));
      if (r.ok && r.body && r.body.run) {
        const run = r.body.run, live = r.body.live || {};
        const sent = run.messages_sent || 0, lim = run.message_limit || 0;
        const phase = live.phase_label || run.worker_phase_label || '';
        const label = dmT('rs_' + run.status) || run.status;
        const done = ['completed', 'failed', 'stopped'].includes(run.status);
        // On finish with under-delivery, add the localized reason (why not all were sent).
        const why = (done && sent < lim) ? ' · ' + dmT('why_incomplete') + ' ' + dmReason(run) : (!done && phase ? ' · ' + phase : '');
        dmSetStatus(run.status === 'failed' ? 'err' : (['completed'].includes(run.status) ? 'ok' : 'pending'),
          dmT('bcast_word') + ' ' + id + ' · ' + label + ' · ' + sent + '/' + lim + why);
        if (['completed', 'failed', 'stopped'].includes(run.status)) { stop = true; dmActiveRun = null; const sb = $('#dm-launch-stop'); if (sb) sb.hidden = true; return; }
      }
      setTimeout(tick, 4000);
    }
    tick();
  }
  let dmActiveRun = null;
  let dmLaunching = false;   // re-entrancy guard: one launch at a time (blocks accidental double-submit)
  async function launchBroadcast() {
    if (dmLaunching) return;
    if (!dmServerId) { dmSetStatus('err', dmT('l_pick_server')); return; }
    const count = Math.floor(Number(($('#dm-l-count') || {}).value) || 0);
    if (!count || count < 1) { dmSetStatus('err', dmT('l_count_req')); return; }
    const state = collectState();
    if (!String(state.fields.content || '').trim() && !(state.embeds || []).length) { dmSetStatus('err', dmT('l_need_content')); return; }
    const schedISO = dmScheduledStartISO();   // '' = immediate, ISO = scheduled, null = invalid
    if (schedISO === null) { dmSetStatus('err', dmT('sched_bad')); return; }
    dmLaunching = true;
    const go = $('#dm-launch-go'); if (go) go.disabled = true;
    try {
      dmSetStatus('pending', dmT('l_preparing'));
      // 1. Upload a picked avatar file (data-URL) → operator ref.
      let avatarRef = '';
      const avEl = document.getElementById('dm-av-prev');
      const avData = avEl && avEl.dataset ? avEl.dataset.url : '';
      if (state.fields.setAvatar && avData && /^data:/.test(avData)) {
        const ct = (avData.match(/^data:([^;]+)/) || [])[1] || 'image/png';
        const up = await dmApi('/order/dmall/op/avatars', { method: 'POST', body: { data: avData.split(',')[1], content_type: ct } });
        if (up.ok && up.body && (up.body.avatar || up.body.ref)) avatarRef = up.body.avatar || up.body.ref;
      }
      // 2. Create the operator template from the composed message.
      dmSetStatus('pending', dmT('l_creating_tpl'));
      const tpl = await dmApi('/order/dmall/op/templates', { method: 'POST', body: dmBuildPayload(state, avatarRef) });
      if (!tpl.ok || !tpl.body || !tpl.body.template) { dmSetStatus('err', dmT('l_tpl_err') + ' ' + ((tpl.body && (tpl.body.message || tpl.body.error)) || tpl.status)); return; }
      const templateId = tpl.body.template.id;
      // 3. If the message uses {{LINK}}, the operator needs a destination link.
      let destLink = '';
      if (/\{\{LINK\}\}/.test(String(state.fields.content || ''))) {
        destLink = (window.prompt(dmT('l_link_prompt')) || '').trim();
        if (!destLink) { dmSetStatus('err', dmT('l_link_req')); return; }
      }
      // 4. Create the run (the backend charges the wallet here).
      dmSetStatus('pending', dmT('l_launching'));
      const runBody = {
        template_id: templateId,
        server_ids: [dmServerId],
        message_limit: count,
        targeting: { audience: 'all', online_priority: dmMapPriority(state.fields.priority), exclude_ids: dmIdList(state.fields.excludeIds) },
        options: {}
      };
      if (state.fields.coolG) runBody.options.recency_cooldown_hours = (Math.max(0, parseInt(state.fields.coolGd || 0, 10)) * 24) + Math.max(0, parseInt(state.fields.coolGh || 0, 10));
      // exclude_destination_duplicates only works WITH a destination link (it dedups people
      // already in that server), so only enable it when a {{LINK}} destination is present.
      if (destLink) { runBody.destination_link = destLink; runBody.options.exclude_destination_duplicates = true; }
      if (schedISO) runBody.scheduled_start_at = schedISO;   // delayed start (operator schedules it)
      // Stable within a 5s window so an accidental double-submit collapses to ONE run
      // (the backend also de-dupes on this key to avoid a double charge).
      const idem = 'dmall-' + dmServerId + '-' + count + '-' + Math.floor(Date.now() / 5000);
      const run = await dmApi('/order/dmall/op/runs', { method: 'POST', body: runBody, idem });
      if (run.status === 402) { dmSetStatus('err', dmT('l_need_funds') + ' $' + (run.body && run.body.price != null ? run.body.price : '?') + ' · ' + dmT('l_balance') + ' $' + (run.body && run.body.balance != null ? run.body.balance : '?')); return; }
      if (run.status === 403) { dmSetStatus('err', dmT('l_no_access')); return; }
      if (!run.ok || !run.body || !run.body.run) { dmSetStatus('err', dmT('l_run_err') + ' ' + ((run.body && (run.body.message || run.body.error)) || run.status)); return; }
      const runId = run.body.run.id;
      dmActiveRun = runId;
      const sb = $('#dm-launch-stop'); if (sb) sb.hidden = false;
      const chargedTxt = run.body.charged ? ' · ' + dmT('l_charged') + ' $' + run.body.charged : '';
      if (schedISO) {
        // Scheduled: don't tight-poll (it could sit queued for hours); just confirm + refresh the list.
        const when = (() => { try { return new Date(schedISO).toLocaleString(dmLang() === 'ru' ? 'ru-RU' : 'en-US', { dateStyle: 'short', timeStyle: 'short' }); } catch (_) { return ''; } })();
        dmSetStatus('ok', dmT('l_scheduled') + ' ' + when + chargedTxt);
      } else {
        dmSetStatus('ok', dmT('l_started') + ' ' + runId + chargedTxt);
        dmPollRun(runId);
      }
      loadTasks();
    } catch (e) { dmSetStatus('err', dmT('l_net_err')); }
    finally { dmLaunching = false; if (go) go.disabled = false; }
  }
  // Stop button (revealed once a run is live).
  { const sb = $('#dm-launch-stop'); if (sb) sb.addEventListener('click', async () => { if (!dmActiveRun) return; sb.disabled = true; const r = await dmApi('/order/dmall/op/runs/' + encodeURIComponent(dmActiveRun) + '/stop', { method: 'POST' }); sb.disabled = false; if (r.ok) dmSetStatus('pending', dmT('l_stopping')); }); }
  { const go = $('#dm-launch-go'); if (go) go.addEventListener('click', launchBroadcast); }
  updateLaunchPrice();

  /* ---- cooldown cap: total (days×24 + hours) ≤ 365 days; auto-reset if exceeded ---- */
  const MAX_COOLDOWN_H = 365 * 24;
  $$('.dm-cool-row').forEach((row) => {
    const inps = row.querySelectorAll('input');
    if (inps.length < 2) return;
    inps.forEach((i) => { i.setAttribute('inputmode', 'numeric'); i.setAttribute('min', '0'); });
    const clamp = () => {
      const d = Math.max(0, parseInt(inps[0].value || '0', 10) || 0);
      const h = Math.max(0, parseInt(inps[1].value || '0', 10) || 0);
      if (d * 24 + h > MAX_COOLDOWN_H) { inps[0].value = '365'; inps[1].value = '0'; }
    };
    inps.forEach((i) => i.addEventListener('input', clamp));
  });

  /* ---- repeatable embed fields (Discohook-style) ---- */
  const FIELD_ROW = '<div class="dm-field-row">' +
    '<input class="dm-input ff-name" data-dm-ph="field_name" placeholder="Field name" />' +
    '<input class="dm-input ff-value" data-dm-ph="field_value" placeholder="Field value" />' +
    '<label class="dm-inline-lbl"><input type="checkbox" class="ff-inline" /> <span data-dm="inline">Inline</span></label>' +
    '<button type="button" class="dm-field-del" title="Remove">✕</button>' +
    '</div>';
  const fieldsBox = $('#dm-fields'), addFieldBtn = $('#dm-add-field');
  if (addFieldBtn && fieldsBox) addFieldBtn.addEventListener('click', () => { fieldsBox.insertAdjacentHTML('beforeend', FIELD_ROW); dmApplyLang(); });
  if (fieldsBox) fieldsBox.addEventListener('click', (e) => { const d = e.target.closest('.dm-field-del'); if (d) { d.closest('.dm-field-row').remove(); updatePreview(); } });

  /* ---- username character counter (Discohook-style) ---- */
  const counter = (inId, cntId, max) => { const i = $(inId), c = $(cntId); if (i && c) { const upd = () => { c.textContent = i.value.length + '/' + max; }; i.addEventListener('input', upd); upd(); } };
  counter('#dm-t-username', '#dm-username-count', 80);
  counter('#dm-t-content', '#dm-content-count', 2000);

  /* ---- collapsible embeds (Discohook-style) ---- */
  const embedsBox = $('#dm-embeds'), addEmbedBtn = $('#dm-add-embed');
  const EMBED_BLOCK =
    '<div class="dm-embed-block">' +
      '<div class="dm-eb-head">' +
        '<div class="dm-eb-title2"><span data-dm="embed_n">Embed</span> <span class="dm-eb-num">1</span></div>' +
        '<div class="dm-eb-actions"><button type="button" class="dm-eb-del" title="Remove">✕</button></div>' +
      '</div>' +
      '<div class="dm-eb-body">' +
        '<div class="dm-eb-sec"><button type="button" class="dm-eb-sec-h"><span class="dm-eb-caret">▸</span> <span data-dm="sec_author">Author</span></button><div class="dm-eb-sec-body" hidden>' +
          '<div class="dm-field"><label class="dm-label">author.name <span class="eb-count" data-max="256">0/256</span></label><input class="dm-input eb-author" maxlength="256" /></div>' +
          '<div class="dm-two"><div class="dm-field"><label class="dm-label">author.url</label><input class="dm-input eb-authorurl" placeholder="{{LINK}}" /></div><div class="dm-field"><label class="dm-label">author.icon_url</label><input class="dm-input eb-authoricon" placeholder="https://…" /></div></div>' +
        '</div></div>' +
        '<div class="dm-eb-sec"><button type="button" class="dm-eb-sec-h"><span class="dm-eb-caret">▸</span> <span data-dm="sec_body">Body</span></button><div class="dm-eb-sec-body" hidden>' +
          '<div class="dm-field"><label class="dm-label">title <span class="eb-count" data-max="256">0/256</span></label><input class="dm-input eb-title" maxlength="256" /></div>' +
          '<div class="dm-field"><label class="dm-label">description <span class="eb-count" data-max="4096">0/4096</span></label><textarea class="dm-textarea eb-desc" maxlength="4096"></textarea></div>' +
          '<div class="dm-two"><div class="dm-field"><label class="dm-label">url</label><input class="dm-input eb-url" placeholder="{{LINK}}" /></div><div class="dm-field"><label class="dm-label">color</label><div class="dm-color-row"><input class="dm-input eb-color" placeholder="#rrggbb" value="#5865f2" /><input type="color" class="dm-swatch eb-colorpick" value="#5865f2" /></div></div></div>' +
        '</div></div>' +
        '<div class="dm-eb-sec"><button type="button" class="dm-eb-sec-h"><span class="dm-eb-caret">▸</span> <span data-dm="sec_images">Images</span></button><div class="dm-eb-sec-body" hidden>' +
          '<div class="dm-field"><label class="dm-label">image.url</label><input class="dm-input eb-image" placeholder="https://…" /></div>' +
          '<div class="dm-field"><label class="dm-label">thumbnail.url</label><input class="dm-input eb-thumb" placeholder="https://…" /></div>' +
        '</div></div>' +
        '<div class="dm-eb-sec"><button type="button" class="dm-eb-sec-h"><span class="dm-eb-caret">▸</span> <span data-dm="sec_footer">Footer</span></button><div class="dm-eb-sec-body" hidden>' +
          '<div class="dm-field"><label class="dm-label">footer.text <span class="eb-count" data-max="2048">0/2048</span></label><input class="dm-input eb-footer" maxlength="2048" /></div>' +
          '<div class="dm-two"><div class="dm-field"><label class="dm-label">timestamp</label><input class="dm-input eb-timestamp" placeholder="YYYY-MM-DD hh:mm" /></div><div class="dm-field"><label class="dm-label">footer.icon_url</label><input class="dm-input eb-footericon" placeholder="https://…" /></div></div>' +
        '</div></div>' +
        '<div class="dm-eb-sec"><button type="button" class="dm-eb-sec-h"><span class="dm-eb-caret">▸</span> <span data-dm="button_link">Button (link)</span></button><div class="dm-eb-sec-body" hidden>' +
          '<div class="dm-field"><label class="dm-label">label</label><input class="dm-input eb-btnlabel" placeholder="Check" /></div>' +
          '<div class="dm-field"><label class="dm-label">url</label><input class="dm-input eb-btnurl" placeholder="{{LINK}}" /></div>' +
          '<div class="dm-field"><label class="dm-label">emoji</label><input class="dm-input eb-btnemoji" placeholder="🎁" /></div>' +
        '</div></div>' +
      '</div>' +
    '</div>';
  const renumberEmbeds = () => $$('#dm-embeds .dm-eb-num').forEach((el, i) => { el.textContent = i + 1; });
  // Only one embed is added via the button — hide it while an embed exists.
  const toggleAddEmbed = () => { if (addEmbedBtn) addEmbedBtn.hidden = $$('#dm-embeds .dm-embed-block').length > 0; };
  function addEmbed() { embedsBox.insertAdjacentHTML('beforeend', EMBED_BLOCK); renumberEmbeds(); toggleAddEmbed(); dmApplyLang(); updatePreview(); return embedsBox.lastElementChild; }
  if (addEmbedBtn && embedsBox) addEmbedBtn.addEventListener('click', () => { addEmbed(); saveState(); });
  if (embedsBox) {
    embedsBox.addEventListener('click', (e) => {
      const del = e.target.closest('.dm-eb-del'), sh = e.target.closest('.dm-eb-sec-h');
      if (del) { del.closest('.dm-embed-block').remove(); renumberEmbeds(); toggleAddEmbed(); updatePreview(); saveState(); return; }
      if (sh) { const body = sh.nextElementSibling, was = body.hidden; body.hidden = !was; sh.querySelector('.dm-eb-caret').textContent = was ? '▾' : '▸'; }
    });
    embedsBox.addEventListener('input', (e) => {
      const inp = e.target, field = inp.closest('.dm-field');
      if (field) { const c = field.querySelector('.eb-count'); if (c && c.dataset.max) c.textContent = inp.value.length + '/' + c.dataset.max; }
      if (inp.classList.contains('eb-colorpick')) { const tx = inp.closest('.dm-embed-block').querySelector('.eb-color'); if (tx) tx.value = inp.value; }
      else if (inp.classList.contains('eb-color') && /^#[0-9a-f]{6}$/i.test(inp.value)) { const pk = inp.closest('.dm-embed-block').querySelector('.eb-colorpick'); if (pk) pk.value = inp.value; }
      updatePreview();
    });
  }

  /* ---- notifications: synthesized live from run status transitions ---- */
  let dmNotifs = [], dmSeenStatus = {}, dmUnread = 0, dmNotifPrimed = false;
  const N_BELL_SVG = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/></svg>';
  function dmTimeAgo(ts) {
    const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (s < 60) return dmT('just_now');
    const m = Math.floor(s / 60); if (m < 60) return m + ' ' + dmT('min_ago');
    const h = Math.floor(m / 60); if (h < 24) return h + ' ' + dmT('hr_ago');
    return Math.floor(h / 24) + ' ' + dmT('day_ago');
  }
  function renderNotifs() {
    const box = $('#dm-notif-list'); if (!box) return;
    box.innerHTML = dmNotifs.length
      ? dmNotifs.map((n) => '<div class="dm-nitem"><div class="dm-n-ic">' + N_BELL_SVG + '</div><div class="dm-n-body"><div class="dm-n-txt">' + esc(n.text) + '</div><div class="dm-n-time">' + esc(dmTimeAgo(n.ts)) + '</div></div></div>').join('')
      : '<div class="dm-notif-empty" data-dm="no_notifs">No notifications yet.</div>';
    if (bell) { const dot = bell.querySelector('.dm-nbell-dot'); if (dmUnread > 0) { if (!dot) { const d = document.createElement('span'); d.className = 'dm-nbell-dot'; bell.appendChild(d); } } else if (dot) dot.remove(); }
    dmApplyLang();
  }
  function pushNotif(text) {
    dmNotifs.unshift({ id: 'n' + Date.now() + Math.random().toString(36).slice(2, 6), text, ts: Date.now() });
    if (dmNotifs.length > 60) dmNotifs = dmNotifs.slice(0, 60);
    dmUnread++;
    renderNotifs();
  }
  if (bell && notif) {
    bell.addEventListener('click', () => { notif.classList.toggle('on'); if (notif.classList.contains('on')) { dmUnread = 0; renderNotifs(); } });
    const close = $('#dm-notif-close'); if (close) close.addEventListener('click', () => notif.classList.remove('on'));
  }
  // renderNotifs() moved to boot (needs DM_TXT initialized first)
  // Poll runs while the DMALL console is open, so status changes surface as notifications.
  setInterval(() => { if (dmall && !dmall.hidden) loadTasks(); }, 15000);

  /* ---- broadcast settings drawer inside the preview card (click to slide) ---- */
  const lToggle = $('#dm-launch-toggle'), lBody = $('#dm-launch-body');
  if (lToggle && lBody) lToggle.addEventListener('click', () => { const open = lBody.hidden; lBody.hidden = !open; lToggle.classList.toggle('open', open); });

  /* ---- broadcast tasks: REAL runs from the operator (Active/Paused/Completed) ---- */
  const TASK_PAGE_SIZE = 10;
  let taskPage = 1, taskFilter = 'active', taskRuns = [];
  function runGroup(s) { return (s === 'completed' || s === 'failed' || s === 'stopped') ? 'done' : (s === 'paused' ? 'paused' : 'active'); }
  function runChip(s) {
    return ({ running: ['green', 'dm_active'], queued: ['green', 'dm_active'], completed: ['blue', 'dm_done'], failed: ['red', 'dm_error'], stopped: ['amber', 'dm_paused'], paused: ['amber', 'dm_paused'] })[s] || ['green', 'dm_active'];
  }
  // A round server avatar (icon) or a letter tile when there's no icon.
  function dmSrvAv(s) {
    const nm = s.name || s.id || '?';
    const letter = (String(nm).trim()[0] || '?').toUpperCase();
    return s.icon
      ? '<span class="dm-flow-av"><img src="' + esc(s.icon) + '" alt="" loading="lazy"/></span>'
      : '<span class="dm-flow-av dm-flow-av-txt">' + esc(letter) + '</span>';
  }
  // The "from → to" row: source server(s) with avatar + name, then the destination server
  // (name + invite, no avatar — our bot isn't there so we can't fetch its icon).
  function dmFlowRow(run) {
    const src = (Array.isArray(run.servers) && run.servers.length)
      ? run.servers
      : (Array.isArray(run.server_ids) ? run.server_ids.map((id) => ({ id: id, name: '', icon: null })) : []);
    const from = src.map((s) => '<span class="dm-flow-srv" title="' + esc(s.name || s.id) + '">' + dmSrvAv(s) + '<span class="dm-flow-name">' + esc(s.name || s.id) + '</span></span>').join('<span class="dm-flow-plus">+</span>');
    const d = run.destination;
    const to = d ? '<span class="dm-flow-arrow">→</span><span class="dm-flow-srv dm-flow-dest" title="' + esc((d.name || '') + ' ' + (d.url || '')) + '"><span class="dm-flow-name">' + esc(d.name || d.url || '') + '</span>' + (d.url ? '<span class="dm-flow-link">' + esc(String(d.url).replace(/^https?:\/\//, '')) + '</span>' : '') + '</span>' : '';
    return (from || to) ? '<div class="dm-flow">' + from + to + '</div>' : '';
  }
  function runCard(run) {
    const sent = Number(run.messages_sent || 0), lim = Number(run.message_limit || 0);
    const pct = lim > 0 ? Math.min(100, Math.round((sent / lim) * 100)) : (run.status === 'completed' ? 100 : 0);
    const ch = runChip(run.status);
    const title = run.title || ('#' + String(run.id || '').slice(0, 8));
    // Stop lives in the same bottom-right slot as "Repeat" on finished cards.
    const stopBtn = (run.status === 'running' || run.status === 'queued')
      ? '<div class="camp-actions dm-actions-right"><button class="btn-mini dm-stop-btn" data-run-stop="' + esc(run.id) + '">' + esc(dmT('run_stop')) + '</button></div>' : '';
    const done = run.status === 'completed' || run.status === 'failed' || run.status === 'stopped';
    // Why not fully delivered (operator's RU reason), shown only when sent < requested.
    const reasonHtml = (done && sent < lim)
      ? '<div class="dm-run-reason">' + esc(dmT('why_incomplete')) + ' ' + esc(dmReason(run)) + '</div>' : '';
    // Finished runs get a "Repeat" button → re-launches the same broadcast (same settings).
    const repeatBtn = done
      ? '<div class="camp-actions dm-actions-right"><button class="btn-mini" data-run-repeat="' + esc(run.id) + '" title="' + esc(dmT('dm_repeat')) + '">' + esc(dmT('repeat_run')) + '</button></div>' : '';
    return '<div class="camp" data-run="' + esc(run.id) + '">' +
      '<div class="camp-head"><div class="camp-headmain"><div class="camp-title">' + esc(title) + '</div>' + dmFlowRow(run) + '</div>' +
      '<span class="camp-chips"><span class="chip ' + ch[0] + '" data-dm="' + ch[1] + '">status</span></span></div>' +
      '<div class="progress"><i style="width:' + pct + '%"></i></div>' +
      '<div class="camp-nums"><span>' + esc(dmT('sent_word')) + ' <b>' + sent.toLocaleString() + '</b> / ' + lim.toLocaleString() + '</span></div>' +
      reasonHtml + stopBtn + repeatBtn + '</div>';
  }
  function renderTasks() {
    const box = $('#dm-task-list'); if (!box) return;
    const buckets = { active: [], paused: [], done: [] };
    (Array.isArray(taskRuns) ? taskRuns : []).forEach((r) => { if (r && r.id) buckets[runGroup(r.status)].push(r); });
    const ca = $('#dm-tc-active'); if (ca) ca.textContent = buckets.active.length;
    const cp = $('#dm-tc-paused'); if (cp) cp.textContent = buckets.paused.length;
    const cd = $('#dm-tc-done'); if (cd) cd.textContent = buckets.done.length;
    const shown = buckets[taskFilter] || buckets.active;
    const pages = Math.max(1, Math.ceil(shown.length / TASK_PAGE_SIZE));
    if (taskPage > pages) taskPage = pages;
    const slice = shown.slice((taskPage - 1) * TASK_PAGE_SIZE, taskPage * TASK_PAGE_SIZE);
    if (!slice.length) { box.innerHTML = '<div class="dm-sp-empty" data-dm="no_tasks">No broadcasts yet.</div>'; dmApplyLang(); return; }
    let html = slice.map(runCard).join('');
    if (pages > 1) html += '<div id="dm-tasks-pager" class="dm-pager"><button class="cp-nav" data-pg="' + (taskPage - 1) + '"' + (taskPage <= 1 ? ' disabled' : '') + '>‹</button><span class="cp-info">' + taskPage + ' / ' + pages + '</span><button class="cp-nav" data-pg="' + (taskPage + 1) + '"' + (taskPage >= pages ? ' disabled' : '') + '>›</button></div>';
    box.innerHTML = html;
    box.querySelectorAll('[data-pg]').forEach((b) => b.onclick = () => { const p = +b.dataset.pg; if (p >= 1 && p <= pages) { taskPage = p; renderTasks(); } });
    box.querySelectorAll('[data-run-stop]').forEach((b) => b.onclick = async () => { b.disabled = true; await dmApi('/order/dmall/op/runs/' + encodeURIComponent(b.dataset.runStop) + '/stop', { method: 'POST' }); setTimeout(loadTasks, 900); });
    box.querySelectorAll('[data-run-repeat]').forEach((b) => b.onclick = async () => {
      const srcId = b.dataset.runRepeat;
      const notify = (msg, kind) => { if (window.toast) window.toast(msg, kind || 'ok'); pushNotif(msg); };
      b.disabled = true;
      notify(dmT('repeat_pending'), 'ok');
      try {
        const r = await dmApi('/order/dmall/op/runs/' + encodeURIComponent(srcId) + '/repeat', { method: 'POST' });
        if (r.status === 402) { b.disabled = false; notify(dmT('l_need_funds') + ' $' + (r.body && r.body.price != null ? r.body.price : '?') + ' · ' + dmT('l_balance') + ' $' + (r.body && r.body.balance != null ? r.body.balance : '?'), 'err'); return; }
        if (!r.ok || !r.body || !r.body.run || !r.body.run.id) { b.disabled = false; notify((r.body && r.body.error === 'no-stored-settings') ? dmT('repeat_unavail') : (dmT('l_run_err') + ' ' + ((r.body && (r.body.message || r.body.error)) || r.status)), 'err'); return; }
        const newId = r.body.run.id;
        // Show the new run in "Active" IMMEDIATELY (optimistic), copying the source run's numbers.
        const src = (taskRuns || []).find((x) => x && x.id === srcId) || {};
        taskRuns = [{ id: newId, status: 'queued', messages_sent: 0, message_limit: src.message_limit || 0, server_ids: src.server_ids || [], servers: src.servers || [], destination: src.destination || null, title: src.title }].concat(taskRuns || []);
        dmSeenStatus[newId] = 'queued';
        taskFilter = 'active'; taskPage = 1;
        $$('#dm-task-tabs button').forEach((x) => x.classList.toggle('active', x.dataset.dtaskt === 'active'));
        renderTasks();
        notify(dmT('repeat_started') + ' #' + String(newId).slice(0, 8) + (r.body.charged ? ' · ' + dmT('l_charged') + ' $' + r.body.charged : ''), 'ok');
        dmActiveRun = newId; dmPollRun(newId);
        setTimeout(loadTasks, 1500);   // reconcile with the operator's real list
      } catch (e) { b.disabled = false; notify(dmT('l_net_err'), 'err'); }
    });
    dmApplyLang();
  }
  async function loadTasks() {
    const r = await dmApi('/order/dmall/op/runs?limit=100');
    const runs = (r.ok && r.body) ? (Array.isArray(r.body.runs) ? r.body.runs : (Array.isArray(r.body.data) ? r.body.data : [])) : [];
    // Live notifications: emit when a run we've already seen reaches a terminal state.
    // The first pass only records baseline statuses (dmNotifPrimed), so we don't spam
    // notifications for runs that were already finished before the console was opened.
    runs.forEach((run) => {
      if (!run || !run.id) return;
      const prev = dmSeenStatus[run.id], st = run.status;
      if (dmNotifPrimed && prev && prev !== st && (st === 'completed' || st === 'failed' || st === 'stopped')) {
        pushNotif(dmT('bcast_word') + ' #' + String(run.id).slice(0, 8) + ' — ' + dmT('st_' + st) + ' (' + (run.messages_sent || 0) + '/' + (run.message_limit || 0) + ')');
      }
      dmSeenStatus[run.id] = st;
    });
    dmNotifPrimed = true;
    taskRuns = runs;
    renderTasks();
  }
  $$('#dm-task-tabs button').forEach((b) => b.addEventListener('click', () => {
    taskFilter = b.dataset.dtaskt; taskPage = 1;
    $$('#dm-task-tabs button').forEach((x) => x.classList.toggle('active', x === b));
    renderTasks();
  }));
  // renderTasks() moved to boot (needs DM_TXT initialized first)

  /* ---- "Пример" — fill the content with a sample message (no embed) ---- */
  const EXAMPLE_MSG = '# 🎉 <@USER_ID> YOU WON 10x Yearly Nitro / 100k Robux / 100x Decors 🎉\n\n[**Join and Be Active In Chat to Claim!**]( https://discord.gg/your-link )\nNot Active = No Reward \nIt is mandatory to stay in the server';
  const exBtn = $('#dm-example');
  if (exBtn) exBtn.addEventListener('click', () => {
    const c = $('#dm-t-content'); if (!c) return;
    c.value = EXAMPLE_MSG;
    const cc = $('#dm-content-count'); if (cc) cc.textContent = c.value.length + '/2000';
    updatePreview(); saveState();
  });

  /* ---- live Discord preview ---- */
  const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // Inline Discord markdown (operates on already-escaped text): bold/italic/
  // underline/strikethrough/spoiler, incl. combinations.
  const inline = (t) => t
    .replace(/\*\*\*([\s\S]+?)\*\*\*/g, '<b><i>$1</i></b>')
    .replace(/\*\*([\s\S]+?)\*\*/g, '<b>$1</b>')
    .replace(/__([\s\S]+?)__/g, '<u>$1</u>')
    .replace(/~~([\s\S]+?)~~/g, '<s>$1</s>')
    .replace(/\|\|([\s\S]+?)\|\|/g, '<span class="dm-spoiler">$1</span>')
    .replace(/(^|[^*])\*(?!\s)([^*\n]+?)\*(?!\*)/g, '$1<i>$2</i>')
    .replace(/(^|[^_\w])_(?!\s)([^_\n]+?)_(?![_\w])/g, '$1<i>$2</i>');

  // Full message renderer — an exact-ish copy of how Discord shows the message.
  const fmt = (s) => {
    let t = esc(s);
    const stash = [];
    const put = (h) => { stash.push(h); return '\u0000' + (stash.length - 1) + '\u0000'; };
    // code first (protected from other formatting)
    t = t.replace(/```(?:[a-zA-Z0-9+#.\-]*\n)?([\s\S]*?)```/g, (m, c) => put('<pre class="dm-code">' + c.replace(/\n$/, '') + '</pre>'));
    t = t.replace(/`([^`\n]+?)`/g, (m, c) => put('<code class="dm-inline-code">' + c + '</code>'));
    // links & mentions (stashed so inner text isn't re-parsed)
    const href = (u) => (/^https?:/i.test(u) ? u : 'https://' + u);
    t = t.replace(/\[([^\]\n]+?)\]\(\s*(https?:\/\/[^\s)]+|discord\.gg\/[^\s)]+|\{\{LINK\}\})\s*\)/g, (m, txt, u) => put('<a class="dm-mlink" href="' + (u === '{{LINK}}' ? 'https://discord.gg/example' : href(u)) + '" target="_blank" rel="noopener">' + inline(txt) + '</a>'));
    t = t.replace(/\{\{LINK\}\}/g, () => put('<a class="dm-mlink" href="https://discord.gg/example" target="_blank" rel="noopener">https://discord.gg/example</a>'));
    t = t.replace(/(https?:\/\/[^\s<]+|discord\.gg\/[^\s<]+)/g, (m) => put('<a class="dm-mlink" href="' + href(m) + '" target="_blank" rel="noopener">' + m + '</a>'));
    t = t.replace(/&lt;a?:(\w+):\d+&gt;/g, ':$1:');
    t = t.replace(/&lt;@&amp;\d+&gt;/g, () => put('<span class="dm-mention">@role</span>'));
    t = t.replace(/&lt;@!?(?:USER_ID|USERNAME|DISPLAY_NAME|\d+)&gt;/g, () => put('<span class="dm-mention">@user</span>'));
    t = t.replace(/&lt;#\d+&gt;/g, () => put('<span class="dm-mention">#channel</span>'));
    // block-level
    t = t.replace(/^(#{1,3})\s+(.+)$/gm, (m, h, x) => '<div class="dm-h dm-h' + h.length + '">' + x + '</div>');
    t = t.replace(/^-#\s+(.+)$/gm, '<div class="dm-subtext">$1</div>');
    t = t.replace(/(?:^&gt;\s?.*(?:\n|$))+/gm, (blk) => '<blockquote class="dm-quote">' + blk.replace(/^&gt;\s?/gm, '').replace(/\n+$/, '') + '</blockquote>\n');
    t = t.replace(/^[-*]\s+(.+)$/gm, '<div class="dm-li">• $1</div>');
    t = t.replace(/^(\d+)\.\s+(.+)$/gm, '<div class="dm-li">$1. $2</div>');
    // inline formatting across the rest
    t = inline(t);
    // newlines (blocks manage their own spacing)
    t = t.replace(/(<\/(?:div|blockquote|pre)>)\n/g, '$1');
    t = t.replace(/\n/g, '<br>');
    return t.replace(/\u0000(\d+)\u0000/g, (m, i) => stash[+i]);
  };
  const val = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
  const url = (id) => { const el = document.getElementById(id); return el ? (el.dataset.url || '') : ''; };
  const checked = (sel) => { const el = $(sel); return !!(el && el.checked); };

  const fmtTs = (v) => { if (!v) return ''; try { const d = new Date(String(v).replace(' ', 'T')); if (isNaN(d)) return v; return d.toLocaleString(); } catch (_) { return v; } };

  function buildEmbed(block) {
    const g = (sel) => { const el = block.querySelector(sel); return el ? el.value.trim() : ''; };
    const author = g('.eb-author'), authorIcon = g('.eb-authoricon');
    const title = g('.eb-title'), titleUrl = g('.eb-url');
    const desc = g('.eb-desc'), footer = g('.eb-footer'), footerIcon = g('.eb-footericon');
    const ts = g('.eb-timestamp'), image = g('.eb-image'), thumb = g('.eb-thumb');
    const color = /^#[0-9a-f]{6}$/i.test(g('.eb-color')) ? g('.eb-color') : '#5865f2';
    const btnLbl = g('.eb-btnlabel'), btnEmoji = g('.eb-btnemoji');
    const hasEmbed = author || title || desc || footer || image || thumb;
    if (!hasEmbed && !btnLbl) return '';
    const footLine = (footer || ts) ? '<div class="dm-embed-foot">' + (footerIcon ? '<img class="dm-ef-ic" alt="" src="' + esc(footerIcon) + '">' : '') + esc(footer) + (footer && ts ? ' • ' : '') + (ts ? esc(fmtTs(ts)) : '') + '</div>' : '';
    const embedHtml = hasEmbed ? ('<div class="dm-embed" style="border-left-color:' + color + '"><div class="dm-embed-main">' +
      (author ? '<div class="dm-embed-author">' + (authorIcon ? '<img class="dm-ea-ic" alt="" src="' + esc(authorIcon) + '">' : '') + esc(author) + '</div>' : '') +
      (title ? '<div class="dm-embed-title">' + (titleUrl ? '<span class="dm-mlink">' + esc(title) + '</span>' : esc(title)) + '</div>' : '') +
      (desc ? '<div class="dm-embed-desc">' + fmt(desc) + '</div>' : '') +
      (image ? '<img class="dm-embed-img" alt="" src="' + esc(image) + '">' : '') +
      footLine +
      '</div>' + (thumb ? '<div class="dm-embed-th"><img alt="" src="' + esc(thumb) + '"></div>' : '') + '</div>') : '';
    const btn = btnLbl ? '<button class="dm-btn-discord">' + (btnEmoji ? esc(btnEmoji) + ' ' : '') + esc(btnLbl) + ' ↗</button>' : '';
    return embedHtml + btn;
  }

  const preview = $('#dm-preview');
  function updatePreview() {
    if (!preview) return;
    const content = val('dm-t-content');
    const name = (checked('[data-reveal="dm-rv-name"]') && val('dm-t-username')) || 'Newspaper';
    const avUrl = checked('[data-reveal="dm-rv-av"]') ? (val('dm-t-avatarurl') || url('dm-av-prev')) : '';
    const embeds = $$('#dm-embeds .dm-embed-block').map(buildEmbed).filter(Boolean).join('');
    if (!content && !embeds) {
      preview.className = 'dm-preview empty';
      preview.innerHTML = '<span data-dm="preview_empty">' + dmT('preview_empty') + '</span>';
      return;
    }
    preview.className = 'dm-preview';
    const av = avUrl ? '<img alt="" src="' + esc(avUrl) + '">' : '';
    preview.innerHTML =
      '<div class="dm-msg"><div class="dm-av">' + av + '</div><div class="dm-mbody">' +
        '<div class="dm-mhead"><span class="dm-mname">' + esc(name) + '</span><span class="dm-app">APP</span><span class="dm-mtime">Today at 8:48 PM</span></div>' +
        (content ? '<div class="dm-mtext">' + fmt(content) + '</div>' : '') +
        embeds +
      '</div></div>';
  }

  /* ---- auto-save: persist the whole template on every change (localStorage;
         the backend hook goes here later). No explicit save/confirm needed. ---- */
  const STORE_KEY = 'dmall_tpl';
  const raw = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };
  const EMBED_KEYS = ['author', 'authorurl', 'authoricon', 'title', 'url', 'desc', 'color', 'image', 'thumb', 'footer', 'timestamp', 'footericon', 'btnlabel', 'btnurl', 'btnemoji'];
  function collectState() {
    const fields = {};
    $$('#dmall [data-save]').forEach((el) => { fields[el.dataset.save] = el.type === 'checkbox' ? el.checked : el.value; });
    return {
      fields,
      embeds: $$('#dm-embeds .dm-embed-block').map((b) => {
        const o = {}; EMBED_KEYS.forEach((k) => { const el = b.querySelector('.eb-' + k); o[k] = el ? el.value : ''; }); return o;
      })
    };
  }
  let saveT, dmSaveToastT, dmReady = false;
  function flushSave() { clearTimeout(saveT); try { localStorage.setItem(STORE_KEY, JSON.stringify(collectState())); } catch (_) {} }
  function saveState() {
    clearTimeout(saveT); saveT = setTimeout(flushSave, 250);
    // A small "settings saved" toast, debounced so a burst of edits shows just one.
    if (dmReady) { clearTimeout(dmSaveToastT); dmSaveToastT = setTimeout(() => { if (window.toast) window.toast(dmT('settings_saved'), 'ok'); }, 700); }
  }
  // Persist immediately when leaving the page, so nothing is lost inside the debounce window.
  window.addEventListener('pagehide', flushSave);
  window.addEventListener('beforeunload', flushSave);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushSave(); });
  function refreshCounters() {
    const set = (id, cid, max) => { const i = $(id), c = $(cid); if (i && c) c.textContent = i.value.length + '/' + max; };
    set('#dm-t-content', '#dm-content-count', 2000); set('#dm-t-username', '#dm-username-count', 80);
    $$('#dm-embeds .eb-count').forEach((c) => { const f = c.closest('.dm-field'), inp = f && f.querySelector('input,textarea'); if (inp && c.dataset.max) c.textContent = inp.value.length + '/' + c.dataset.max; });
  }
  function restoreState() {
    let st; try { st = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (_) {}
    if (!st) return;
    const fields = st.fields || {};
    $$('#dmall [data-save]').forEach((el) => {
      const k = el.dataset.save; if (!(k in fields)) return;
      const v = fields[k];
      if (el.type === 'checkbox') {
        el.checked = !!v;
        if (el.dataset.reveal) { const box = document.getElementById(el.dataset.reveal); if (box) box.classList.toggle('on', !!v); }
      } else { el.value = v == null ? '' : v; }
    });
    (st.embeds || []).forEach((em) => {
      const b = addEmbed();
      EMBED_KEYS.forEach((k) => { const el = b.querySelector('.eb-' + k); if (el && em[k] != null) el.value = em[k]; });
      const pk = b.querySelector('.eb-colorpick'); if (pk && /^#[0-9a-f]{6}$/i.test(em.color || '')) pk.value = em.color;
    });
    refreshCounters();
    updateLaunchPrice();
  }

  /* ---- i18n for the DMALL subtree (RU/EN), applied on load + on language switch ---- */
  const DM_TXT = {
    en: {
      tab_templates:"Setup", tab_launch:"Launch", tab_tasks:"Tasks", tab_stats:"Stats", for_word:"for",
      pick_a:"Choose a", pick_b:"server", pick_sub:"Pick a server to broadcast to, or add your own.", search_ph:"Search…", online_members:"Members online:", members_word:"members", runs_done_word:"broadcasts", delivered_word:"messages delivered", invite_caps:"INVITE", change_server:"Change server",
      new_tpl:"Configure message", example:"Example", f_name:"Name", recipient:"Recipient:", link_lbl:"Link:", embed_h:"Embed",
      fields:"Fields", add_field:"＋ Add field", inline:"Inline", field_name:"Field name", field_value:"Field value",
      embeds_h:"Embeds", add_embed:"＋ Add Embed", embed_n:"Embed", sec_author:"Author", sec_body:"Body", sec_images:"Images", sec_footer:"Footer",
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
      repeats:"Repeats & cooldowns", repeats_p:"Cooldowns can be combined: days and hours add up (max 365 days).",
      dest_link:"Destination link", dest_hint:"The template has [[LINK]] — enter an invite or external URL",
      dedup_t:"Dedup by target", dedup_t_sub:"Don't send to those who already joined this server or link<br>Enter the destination link above.",
      cool_g:"Global cooldown", cool_g_sub:"Don't send if the member received any ad within the period below",
      within_last:"within the last", days:"d", hours:"h",
      cool_t:"Cooldown by target", cool_t_sub:"Don't send if they already got a broadcast for this server/link within the period below",
      server_h:"Server for the DMALL broadcast", server_p:"Choose an assigned server or enter a new guild — a new one needs an OAuth channel; the selfbot must be on the server.",
      assigned_server:"Assigned server", opt_choose_id:"— Choose or enter an ID below —", guild_id:"Server ID (guild)", guild_id_hint:"Enter the server ID",
      exclude_h:"Exclude the server's members", exclude_p:"Optional: if you specify a server, its guild_members won't enter the broadcast queue. Without an ID, no exclusion is applied.",
      exclude_server:"Server to exclude", opt_choose_server:"— Choose a server —",
      whom_h:"Who to send to", whom_p:"All members, only roles, or specific IDs. Role/member exclusions apply after the audience filter. Link dedup is separate, in the block above.",
      audience:"Audience", aud_all:"All members", aud_roles:"Only roles", aud_ids:"Specific IDs", exclude_members:"Exclude members or roles from the broadcast (IDs)",
      online_prio:"Priority by online status", no_prio:"No priority", online_first:"Online first, then offline", offline_first:"Offline first, then online", online_only:"Online only", offline_only:"Offline only",
      bot_pool:"Bot pool", leave_after:"Leave the server after the broadcast", leave_after_sub:"All bots that took part in this broadcast will leave the server when it ends",
      poolbox:"<b>115</b> free of 3 755 in the pool<div class=\"dm-poolsub\">7 busy · 3 633 invalid · 3 294 in quarantine</div>",
      msg_count:"Message count", how_many:"How many messages to send", bots_needed:"Bots needed: <b>2</b>",
      sum_total:"Total messages:", sum_hint:"Bots are counted by the backend automatically", sum_server:"Server:", sum_exclude:"Exclusions:", not_set:"not set", sum_bots:"Bots (estimate):", sum_aud:"Audience:", sum_online:"Online:",
      start_broadcast:"Start broadcast", stop_broadcast:"Stop broadcast", no_admin_servers:"You have no servers where you are an owner or admin. Connect Discord so we can load your servers.", connect_discord:"Connect Discord", viewas_lbl:"Test: act as account", viewas_go:"Act as", viewas_clear:"Reset", viewas_now:"Testing as:", viewas_bad:"Enter a valid Discord ID (17-20 digits).", viewas_empty:"No captured servers for account", viewas_empty2:"That account must log in via Discord (Connect Discord) once so we can see its servers.", lot_add:"Add a server", lot_mine:"yours", per1k:" / 1000 messages", lot_title:"Add a server", lot_desc:"Add the bot to your server and give it admin rights — it connects DMALL. Then enter the server ID and your price per 1000 messages.", lot_invite:"＋ Add the bot to your server", lot_server:"Server ID", lot_price:"Your price per 1000 messages, $", lot_create:"Check & create", lot_foot_total:"Final price for users:", lot_foot_per1k:" per 1000 messages", lot_foot_yours:"yours", lot_foot_service:"service", lot_foot_note:"You (the lot creator) pay only the service fee ({fee}/1000) if you run DMALL on your own server.", lot_bad_id:"Enter a valid server ID (17-20 digits).", lot_checking:"Checking the bot on the server…", lot_no_bot:"The bot is not on this server. Add it (with admin) first.", lot_fail:"Could not create the lot.", lot_del_confirm:"Remove this server?", lot_menu:"Menu", lot_edit:"Edit", lot_make_private:"Make private", lot_make_public:"Make public", lot_delete:"Delete", lot_private:"private", lot_edit_title:"Edit lot", lot_save:"Save", lot_saving:"Saving…", lot_now_private:"Lot is now private — only you can see it", lot_now_public:"Lot is now public", side_dmall:"DMALL", side_cabinet:"Cabinet", side_api:"API", cab_title:"Cabinet", cab_lead:"Your DMALL stats, order history and earnings.", cab_spent:"Spent", cab_sent:"Messages sent", cab_runs:"Broadcasts", cab_earn:"Earnings", cab_balance:"Balance", cab_orders:"Order history", cab_journal:"Earnings journal", cab_empty_orders:"No orders yet.", cab_empty_earn:"No earnings yet.", cab_st_active:"active", cab_st_settled:"settled", cab_refunded:"refunded", cab_delivered:"delivered", cab_lot_income:"lot income", no_tasks:"No broadcasts yet.", no_notifs:"No notifications yet.", bcast_word:"Broadcast", why_incomplete:"Reason:", st_completed:"completed", st_failed:"failed", st_stopped:"stopped",
      rs_queued:"queued", rs_running:"running", rs_completed:"completed", rs_failed:"failed", rs_stopped:"stopped",
      l_pick_server:"Choose a server to broadcast to first", l_count_req:"Enter the number of messages", l_need_content:"Add text or an embed", l_preparing:"Preparing…", l_creating_tpl:"Creating template…", l_tpl_err:"Template:", l_link_prompt:"The message contains {{LINK}} — paste the destination link (https://discord.gg/… or a URL):", l_link_req:"A destination link is required for {{LINK}}", l_launching:"Starting the broadcast…", l_need_funds:"Insufficient funds, need", l_balance:"balance", l_no_access:"No DMALL access", l_run_err:"Start:", l_started:"Broadcast started ✓", l_charged:"charged", l_net_err:"Network unavailable, please try again", l_stopping:"Stop requested…", sched_h:"Scheduled start", sched_now:"Immediately", sched_in:"In N minutes", sched_at:"At date/time", minutes_word:"minutes", sched_bad:"Pick a valid start time in the future", l_scheduled:"Broadcast scheduled for", settings_saved:"Settings saved",
      ak_unset:"not set — click “Generate new”", ak_confirm:"Generate a new key? The old one stops working immediately — update it in the external service.", ak_fail:"Failed:", ak_net:"Network unavailable", ak_copied:"Copied ✓", ak_copy:"Copy",
      reason_queue:"recipient queue exhausted — the server has fewer reachable members than requested", reason_bots:"ran out of sending bots", reason_stalled:"sending stalled", reason_mutual:"no mutual server to DM these members", just_now:"just now", min_ago:"min ago", hr_ago:"h ago", day_ago:"d ago", active_hint:"Active broadcasts: 1 — you can start another on a different server",
      st_dm:"DM BROADCAST", bots_on_server:"Bots on server", dm_broadcast:"DM broadcast", running:"Running", sending:"Sending messages",
      dm_active:"Active", dm_paused:"Paused", dm_done:"Completed", dm_error:"Error", dm_tab_active:"Active", dm_tab_paused:"Paused", dm_tab_done:"Completed", sent_word:"Sent", dm_pause:"Pause", dm_resume:"Resume", run_stop:"Stop", dm_repeat:"Repeat with the same settings", repeat_run:"Repeat", repeat_unavail:"Settings for this broadcast aren't available to repeat", repeat_pending:"Starting the repeat…", repeat_started:"Repeat started — a new broadcast is now in Active:",
      note1:"From the server: 90 119 · queued 87 420", route_from:"From:", route_to:"To:", route_to1:"To #1:", route_to2:"To #2:", stop:"Stop",
      st_err:"ERROR", bots_k:"Bots", done:"Done", note3:"From the server: 90 115 · queued 87 416", msg_short:"Msg.", retry:"Retry", st_stop:"STOPPED",
      err1:"Failed to add bots to the server: no permissions or wrong oauth_channel_id. Check bot-add permissions and OAuth.",
      task_aud:"<b>Audience</b> All members · Online first, then offline", stats_soon:"Stats — coming soon.",
      notifications:"Notifications", open_broadcasts:"Go to the broadcast", time1:"2 minutes ago", time2:"An hour ago",
      notif1:"Broadcast: bot <b>Bot #3704</b> was kicked from «matching · chat · decor · art · guilds · games · giveaways · tags · emojis». It wasn't us — the broadcast continues, connecting a replacement.",
      notif2:"Broadcast: bot <b>Bot #3537</b> was kicked from «/admiring ♡ giveaways , social & guilds». It wasn't us — the broadcast continues, connecting a replacement.",
      notif3:"Broadcast: bot <b>Bot #3539</b> was kicked from «/admiring ♡ giveaways , social & guilds». It wasn't us — the broadcast continues, connecting a replacement.",
      ph_upload:"https://… or upload a file below", ph_ids:"Member or role IDs — comma-separated or one per line"
    },
    ru: {
      tab_templates:"Setup", tab_launch:"Запуск", tab_tasks:"Задачи", tab_stats:"Статистика", for_word:"за",
      pick_a:"Выберите", pick_b:"сервер", pick_sub:"Выберите сервер для рассылки или добавьте свой.", search_ph:"Поиск…", online_members:"Участников в сети:", members_word:"участников", runs_done_word:"рассылок", delivered_word:"сообщений доставлено", invite_caps:"ПРИГЛАСИТЬ", change_server:"Сменить сервер",
      new_tpl:"Настроить сообщение", example:"Пример", f_name:"Название", recipient:"Получатель:", link_lbl:"Ссылка:", embed_h:"Эмбед",
      fields:"Поля", add_field:"＋ Добавить поле", inline:"В строку", field_name:"Название поля", field_value:"Значение поля",
      embeds_h:"Эмбеды", add_embed:"＋ Добавить эмбед", embed_n:"Эмбед", sec_author:"Автор", sec_body:"Основное", sec_images:"Изображения", sec_footer:"Подвал",
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
      repeats:"Повторы и кулдауны", repeats_p:"Кулдауны можно комбинировать: дни и часы складываются (максимум 365 дней).",
      dest_link:"Ссылка назначения", dest_hint:"В шаблоне есть [[LINK]] — укажите инвайт или внешний URL",
      dedup_t:"Дедуп по таргету", dedup_t_sub:"Не слать тем, кто уже попал на этот сервер или ссылку<br>Укажите ссылку назначения выше.",
      cool_g:"Глобальный кулдаун", cool_g_sub:"Не слать, если участник получал любую рекламу за период ниже",
      within_last:"за последние", days:"дн.", hours:"ч.",
      cool_t:"Кулдаун по таргету", cool_t_sub:"Не слать, если уже получал рассылку на этот сервер/ссылку за период ниже",
      server_h:"Сервер для проведения DMALL", server_p:"Выберите назначенный сервер или укажите новый guild — для нового нужен OAuth-канал; селфбот должен быть на сервере.",
      assigned_server:"Назначенный сервер", opt_choose_id:"— Выберите или укажите ID ниже —", guild_id:"ID сервера (guild)", guild_id_hint:"Введите ID сервера",
      exclude_h:"Исключение участников сервера", exclude_p:"Необязательно: если указать сервер, его участники из guild_members не попадут в очередь рассылки. Без ID исключения не применяется.",
      exclude_server:"Сервер для исключения", opt_choose_server:"— Выберите сервер —",
      whom_h:"Кому отправлять", whom_p:"Все участники, только роли или конкретные ID. Исключение по ролям и участникам применяется после фильтра аудитории. Дедуп по ссылке — отдельно, в блоке выше.",
      audience:"Аудитория", aud_all:"Все участники", aud_roles:"Только роли", aud_ids:"Конкретные ID", exclude_members:"Исключить из рассылки участников или роли (ID)",
      online_prio:"Приоритет по онлайн-статусу", no_prio:"Без приоритета", online_first:"Сначала в сети, потом офлайн", offline_first:"Сначала офлайн, потом в сети", online_only:"Только в сети", offline_only:"Только офлайн",
      bot_pool:"Пул ботов", leave_after:"Выйти с сервера после рассылки", leave_after_sub:"Все боты, которые участвовали в этой рассылке, покинут сервер по её окончании",
      poolbox:"<b>115</b> свободных из 3 755 в пуле<div class=\"dm-poolsub\">7 занято · 3 633 инвалидных · 3 294 в карантине</div>",
      msg_count:"Количество сообщений", how_many:"Сколько сообщений отправить", bots_needed:"Ботов нужно: <b>2</b>",
      sum_total:"Суммарно сообщений:", sum_hint:"Ботов посчитает бэкенд автоматически", sum_server:"Сервер:", sum_exclude:"Исключения:", not_set:"не задано", sum_bots:"Ботов (оценка):", sum_aud:"Аудитория:", sum_online:"Онлайн:",
      start_broadcast:"Запустить рассылку", stop_broadcast:"Остановить рассылку", no_admin_servers:"У вас нет серверов, где вы владелец или админ. Подключите Discord, чтобы мы подтянули ваши серверы.", connect_discord:"Подключить Discord", viewas_lbl:"Тест: войти как аккаунт", viewas_go:"Войти как", viewas_clear:"Сбросить", viewas_now:"Тестируешь как:", viewas_bad:"Введите корректный Discord ID (17–20 цифр).", viewas_empty:"Нет захваченных серверов у аккаунта", viewas_empty2:"Этот аккаунт должен один раз войти через Discord (Connect Discord), чтобы мы увидели его серверы.", lot_add:"Добавить сервер", lot_mine:"ваш", per1k:" / 1000 сообщений", lot_title:"Добавить сервер", lot_desc:"Добавьте бота на свой сервер и дайте ему админ-права — он подключит DMALL. Затем укажите ID сервера и вашу цену за 1000 сообщений.", lot_invite:"＋ Добавить бота на сервер", lot_server:"ID сервера", lot_price:"Ваша цена за 1000 сообщений, $", lot_create:"Проверить и создать", lot_foot_total:"Итоговая цена для покупателей:", lot_foot_per1k:" за 1000 сообщений", lot_foot_yours:"ваша", lot_foot_service:"сервис", lot_foot_note:"Вы (создатель лота) платите только сервисный сбор ({fee}/1000), если сами запускаете DMALL на своём сервере.", lot_bad_id:"Введите корректный ID сервера (17–20 цифр).", lot_checking:"Проверяю бота на сервере…", lot_no_bot:"Бота нет на этом сервере. Сначала добавьте его (с админ-правами).", lot_fail:"Не удалось создать лот.", lot_del_confirm:"Убрать этот сервер?", lot_menu:"Меню", lot_edit:"Редактировать", lot_make_private:"Сделать приватным", lot_make_public:"Сделать публичным", lot_delete:"Удалить", lot_private:"приватный", lot_edit_title:"Редактировать лот", lot_save:"Сохранить", lot_saving:"Сохранение…", lot_now_private:"Лот теперь приватный — виден только вам", lot_now_public:"Лот теперь публичный", side_dmall:"DMALL", side_cabinet:"Кабинет", side_api:"API", cab_title:"Кабинет", cab_lead:"Ваша статистика DMALL, история заказов и начисления.", cab_spent:"Потрачено", cab_sent:"Сообщений отправлено", cab_runs:"Рассылок", cab_earn:"Начислено", cab_balance:"Баланс", cab_orders:"История заказов", cab_journal:"Журнал начислений", cab_empty_orders:"Пока нет заказов.", cab_empty_earn:"Пока нет начислений.", cab_st_active:"активен", cab_st_settled:"завершён", cab_refunded:"возврат", cab_delivered:"доставлено", cab_lot_income:"доход с лота", no_tasks:"Пока нет рассылок.", no_notifs:"Пока нет уведомлений.", bcast_word:"Рассылка", why_incomplete:"Причина:", st_completed:"завершена", st_failed:"ошибка", st_stopped:"остановлена",
      rs_queued:"в очереди", rs_running:"идёт", rs_completed:"завершено", rs_failed:"ошибка", rs_stopped:"остановлено",
      l_pick_server:"Сначала выберите сервер рассылки", l_count_req:"Укажите количество сообщений", l_need_content:"Добавьте текст или эмбед", l_preparing:"Подготовка…", l_creating_tpl:"Создание шаблона…", l_tpl_err:"Шаблон:", l_link_prompt:"Сообщение содержит {{LINK}} — вставьте ссылку назначения (https://discord.gg/… или URL):", l_link_req:"Нужна ссылка назначения для {{LINK}}", l_launching:"Запуск рассылки…", l_need_funds:"Недостаточно средств, нужно", l_balance:"баланс", l_no_access:"Нет доступа к DMALL", l_run_err:"Запуск:", l_started:"Рассылка запущена ✓", l_charged:"списано", l_net_err:"Сеть недоступна, попробуйте ещё раз", l_stopping:"Остановка запрошена…", sched_h:"Отложенный старт", sched_now:"Сразу", sched_in:"Через N минут", sched_at:"В дату/время", minutes_word:"минут", sched_bad:"Выберите корректное время старта в будущем", l_scheduled:"Рассылка запланирована на", settings_saved:"Настройки сохранены",
      ak_unset:"не задан — нажмите «Сгенерировать новый»", ak_confirm:"Сгенерировать новый ключ? Старый перестанет работать сразу — обновите его во внешнем сервисе.", ak_fail:"Не удалось:", ak_net:"Сеть недоступна", ak_copied:"Скопировано ✓", ak_copy:"Копировать",
      reason_queue:"очередь получателей исчерпана — на сервере меньше доступных для ЛС людей, чем заказано", reason_bots:"закончились боты-отправители", reason_stalled:"отправка застопорилась", reason_mutual:"нет общего сервера, чтобы написать этим участникам", just_now:"только что", min_ago:"мин назад", hr_ago:"ч назад", day_ago:"дн назад", active_hint:"Активных рассылок: 1 — можно запустить ещё на другой сервер",
      st_dm:"РАССЫЛКА В ЛС", bots_on_server:"Боты на сервере", dm_broadcast:"Рассылка в ЛС", running:"Идёт", sending:"Отправка сообщений",
      dm_active:"Активна", dm_paused:"Приостановлена", dm_done:"Завершена", dm_error:"Ошибка", dm_tab_active:"Активные", dm_tab_paused:"На паузе", dm_tab_done:"Завершённые", sent_word:"Отправлено", dm_pause:"Пауза", dm_resume:"Возобновить", run_stop:"Стоп", dm_repeat:"Повторить с теми же настройками", repeat_run:"Повторить", repeat_unavail:"Настройки этой рассылки недоступны для повтора", repeat_pending:"Запускаю повтор…", repeat_started:"Повтор запущен — новая рассылка в разделе «Активные»:",
      note1:"С сервера: 90 119 · в очереди 87 420", route_from:"Откуда:", route_to:"Куда:", route_to1:"Куда №1:", route_to2:"Куда №2:", stop:"Стоп",
      st_err:"ОШИБКА", bots_k:"Боты", done:"Готово", note3:"С сервера: 90 115 · в очереди 87 416", msg_short:"Сообщ.", retry:"Повторить", st_stop:"ОСТАНОВЛЕНА",
      err1:"Не удалось добавить ботов на сервер: нет прав или неверный oauth_channel_id. Проверьте права на добавление ботов и OAuth.",
      task_aud:"<b>Аудитория</b> Все участники · Сначала в сети, потом офлайн", stats_soon:"Статистика — скоро.",
      notifications:"Уведомления", open_broadcasts:"Перейти к рассылке", time1:"2 минуты назад", time2:"Час назад",
      notif1:"Рассылка: бота <b>Bot #3704</b> кикнули с сервера «matching · chat · decor · art · guilds · games · giveaways · tags · emojis». Это сделали не мы — рассылка продолжается, подключаем замену.",
      notif2:"Рассылка: бота <b>Bot #3537</b> кикнули с сервера «/admiring ♡ giveaways , social & guilds». Это сделали не мы — рассылка продолжается, подключаем замену.",
      notif3:"Рассылка: бота <b>Bot #3539</b> кикнули с сервера «/admiring ♡ giveaways , social & guilds». Это сделали не мы — рассылка продолжается, подключаем замену.",
      ph_upload:"https://… или загрузите файл ниже", ph_ids:"ID участников или ролей — через запятую или с новой строки"
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
  setTimeout(dmApplyLang, 250);   // belt-and-suspenders: re-translate once the DOM is settled

  // Delegated so dynamically-added embed field rows also drive the live preview.
  document.addEventListener('input', (e) => { if (e.target.matches('[data-preview]') || e.target.closest('.dm-field-row')) updatePreview(); });
  document.addEventListener('change', (e) => { if (e.target.matches('.ff-inline')) updatePreview(); });

  // Auto-save: any edit to a real setting (message fields, embeds, fields, launch params)
  // persists immediately and shows the "settings saved" toast. The server-picker search box
  // has no [data-save], so typing there doesn't count as a settings change.
  { const dmRoot = $('#dmall');
    const onDmEdit = (e) => { const t = e.target; if (t.closest('[data-save]') || t.closest('.dm-embed-block') || t.closest('.dm-field-row')) saveState(); };
    if (dmRoot) { dmRoot.addEventListener('input', onDmEdit); dmRoot.addEventListener('change', onDmEdit); } }

  restoreState();
  renderNotifs();
  renderTasks();
  toggleAddEmbed();
  updatePreview();
  loadLots();
  dmReady = true;   // from here on, user edits show the "settings saved" toast
})();
