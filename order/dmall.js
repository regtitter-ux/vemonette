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
  $$('.dm-mode', modebar).forEach((btn) => {
    btn.addEventListener('click', () => {
      const dm = btn.dataset.mode === 'dmall';
      $$('.dm-mode', modebar).forEach((b) => b.classList.toggle('active', b === btn));
      wrap.classList.toggle('dmall-on', dm);
      dmall.hidden = !dm;
      if (dm && !dmServer) dmall.classList.add('picking');   // choose a server first
      if (bell) bell.hidden = !dm || dmall.classList.contains('picking');
      if (!dm && notif) notif.classList.remove('on');
      window.scrollTo(0, 0);
    });
  });

  /* ---- server picker (pick a server where you're admin before configuring) ----
     Real avatar/banner URLs render when present (from the API later); otherwise
     a colour/gradient + letter placeholder is used. */
  const dmSelName = $('#dm-selname'), dmSelBar = $('#dm-selbar');
  const DM_SERVERS = [
    { name: 'Zombix Online Official', bot: true, online: 14, avatar: '', banner: '', avBg: '#3a2a24', bannerBg: 'linear-gradient(120deg,#c25b1e,#2a211c)' },
    { name: 'Memory', bot: true, online: 9, avatar: '', banner: '', avBg: '#6b5560', bannerBg: 'linear-gradient(120deg,#7a5b6b,#2b2430)' },
    { name: 'inoue', bot: false, avatar: '', banner: '', avBg: '#4a4640', bannerBg: 'linear-gradient(120deg,#b9b2ac,#3a3733)' },
    { name: '💗 🦋 kissing her ♡ ask2dm', bot: true, online: 27, avatar: '', banner: '', icon: '💗', avBg: '#7a3f55', bannerBg: 'linear-gradient(120deg,#8a4a63,#2a1e26)' },
    { name: 'inoue collabs', bot: false, avatar: '', banner: '', avBg: '#3a4256', bannerBg: 'linear-gradient(120deg,#3f4a63,#20242e)' },
    { name: 'matching 🍒 chat · decor · art · g…', bot: true, online: 41, avatar: '', banner: '', icon: '🍒', avBg: '#4a4a4a', bannerBg: 'linear-gradient(120deg,#6b6b6b,#232323)' }
  ];
  const BOT_INVITE = 'https://discord.com/oauth2/authorize?client_id=1525863543310651442&permissions=8&integration_type=0&scope=bot';
  function serverCard(sv) {
    const banner = sv.banner ? "background-image:url('" + esc(sv.banner) + "');background-size:cover;background-position:center" : 'background:' + (sv.bannerBg || 'linear-gradient(120deg,#3a3f4b,#20242e)');
    const av = sv.avatar ? '<img alt="" src="' + esc(sv.avatar) + '">' : esc(sv.icon || (sv.name.trim()[0] || '?'));
    const foot = sv.bot
      ? '<span class="dm-sp-online"><i class="dm-sp-dot"></i> ' + (sv.online != null ? sv.online : '') + ' <span data-dm="members_word">members</span></span>'
      : '<span class="dm-sp-invite" data-dm="invite_caps">INVITE</span>';
    return '<button class="dm-sp-card" data-bot="' + (sv.bot ? 1 : 0) + '" data-id="' + esc(sv.id || '') + '" data-name="' + esc(sv.name) + '">' +
      '<div class="dm-sp-banner" style="' + banner + '"></div>' +
      '<div class="dm-sp-body"><div class="dm-sp-av" style="background:' + (sv.avBg || '#3a4256') + '">' + av + '</div>' +
      '<div class="dm-sp-main"><div class="dm-sp-name">' + esc(sv.name) + '</div><div class="dm-sp-foot">' + foot + '</div></div></div></button>';
  }
  function renderServers(list) {
    const g = $('#dm-sp-grid'); if (!g) return;
    // Servers that already have the bot come first.
    const arr = (list || DM_SERVERS).slice().sort((a, b) => (b.bot ? 1 : 0) - (a.bot ? 1 : 0) || ((b.online || 0) - (a.online || 0)));
    g.innerHTML = arr.map(serverCard).join('');
    dmApplyLang();
  }

  // Load the user's real admin servers from the API; fall back to the sample set.
  async function loadServers() {
    try {
      const base = window.__VEMONI_API_BASE__ || '';
      let tok = ''; try { tok = localStorage.getItem('vemoni_tok') || ''; } catch (_) {}
      const r = await fetch(base + '/order/servers', { credentials: 'include', headers: tok ? { Authorization: 'Bearer ' + tok } : {} });
      if (r.ok) { const b = await r.json(); if (b && Array.isArray(b.servers) && b.servers.length) { renderServers(b.servers); return; } }
    } catch (_) {}
    renderServers(DM_SERVERS);
  }

  const dmGrid = $('#dm-sp-grid');
  if (dmGrid) dmGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.dm-sp-card'); if (!card) return;
    if (card.dataset.bot === '0') {   // bot not on the server yet → invite it
      const id = card.dataset.id;
      window.open(BOT_INVITE + (id ? '&guild_id=' + encodeURIComponent(id) + '&disable_guild_select=true' : ''), '_blank', 'noopener');
      return;
    }
    dmServer = card.dataset.name || '';
    dmServerId = card.dataset.id || '';   // used automatically as the broadcast's target guild
    const avSrc = card.querySelector('.dm-sp-av'); dmServerAv = avSrc ? avSrc.innerHTML : '';
    if (dmSelName) dmSelName.textContent = dmServer;
    { const ss = $('#dm-sum-server'); if (ss) ss.textContent = dmServer; }
    if (dmSelBar) dmSelBar.hidden = false;
    dmall.classList.remove('picking');
    if (bell) bell.hidden = false;
    window.scrollTo(0, 0);
  });
  { const chg = $('#dm-changeserver'); if (chg) chg.addEventListener('click', () => { dmall.classList.add('picking'); if (dmSelBar) dmSelBar.hidden = true; if (bell) bell.hidden = true; window.scrollTo(0, 0); }); }
  { const q = $('#dm-sp-q'); if (q) q.addEventListener('input', () => { const v = q.value.trim().toLowerCase(); $$('#dm-sp-grid .dm-sp-card').forEach((c) => { c.hidden = !!v && !(c.dataset.name || '').toLowerCase().includes(v); }); }); }

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

  /* ---- message count → price ($1 per 1000 messages, billed to the orders balance) ---- */
  const PRICE_PER_1000 = 1;
  function updateLaunchPrice() {
    const inp = $('#dm-l-count'), out = $('#dm-l-price');
    if (!out) return;
    const n = Math.max(0, parseInt((inp && inp.value) || '0', 10) || 0);
    const price = (n / 1000) * PRICE_PER_1000;
    out.textContent = price % 1 === 0 ? '$' + price : '$' + price.toFixed(2);
  }
  $$('.dm-quick button', dmall).forEach((b) => {
    b.addEventListener('click', () => { const inp = $('#dm-l-count'); if (inp) inp.value = b.dataset.amt; updateLaunchPrice(); });
  });
  { const lc = $('#dm-l-count'); if (lc) lc.addEventListener('input', updateLaunchPrice); }
  updateLaunchPrice();

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

  /* ---- notifications panel ---- */
  if (bell && notif) {
    bell.addEventListener('click', () => notif.classList.toggle('on'));
    const close = $('#dm-notif-close'); if (close) close.addEventListener('click', () => notif.classList.remove('on'));
  }

  /* ---- broadcast settings drawer inside the preview card (click to slide) ---- */
  const lToggle = $('#dm-launch-toggle'), lBody = $('#dm-launch-body');
  if (lToggle && lBody) lToggle.addEventListener('click', () => { const open = lBody.hidden; lBody.hidden = !open; lToggle.classList.toggle('open', open); });

  /* ---- broadcast task cards: 10 per page + pager ---- */
  const TASK_PAGE_SIZE = 10;
  let taskPage = 1;
  function renderTaskPage() {
    const box = $('.dm-setup-tasks'); if (!box) return;
    const cards = $$('.camp', box);
    const pages = Math.max(1, Math.ceil(cards.length / TASK_PAGE_SIZE));
    if (taskPage > pages) taskPage = pages;
    cards.forEach((c, i) => { c.hidden = (Math.floor(i / TASK_PAGE_SIZE) + 1) !== taskPage; });
    let pager = box.querySelector('#dm-tasks-pager');
    if (pages <= 1) { if (pager) pager.remove(); return; }
    if (!pager) { pager = document.createElement('div'); pager.id = 'dm-tasks-pager'; pager.className = 'dm-pager'; box.appendChild(pager); }
    pager.innerHTML = '<button class="cp-nav" data-pg="' + (taskPage - 1) + '"' + (taskPage <= 1 ? ' disabled' : '') + '>‹</button><span class="cp-info">' + taskPage + ' / ' + pages + '</span><button class="cp-nav" data-pg="' + (taskPage + 1) + '"' + (taskPage >= pages ? ' disabled' : '') + '>›</button>';
    pager.querySelectorAll('[data-pg]').forEach((b) => b.onclick = () => { const p = +b.dataset.pg; if (p >= 1 && p <= pages) { taskPage = p; renderTaskPage(); } });
  }
  renderTaskPage();

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
    t = t.replace(/\[([^\]\n]+?)\]\(\s*(?:https?:\/\/[^\s)]+|discord\.gg\/[^\s)]+|\{\{LINK\}\})\s*\)/g, (m, txt) => put('<span class="dm-mlink">' + inline(txt) + '</span>'));
    t = t.replace(/\{\{LINK\}\}/g, () => put('<span class="dm-mlink">https://discord.gg/example</span>'));
    t = t.replace(/(https?:\/\/[^\s<]+|discord\.gg\/[^\s<]+)/g, (m) => put('<span class="dm-mlink">' + m + '</span>'));
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
  let saveT;
  function flushSave() { clearTimeout(saveT); try { localStorage.setItem(STORE_KEY, JSON.stringify(collectState())); } catch (_) {} }
  function saveState() { clearTimeout(saveT); saveT = setTimeout(flushSave, 250); }
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
      pick_a:"Choose a", pick_b:"server", search_ph:"Search…", online_members:"Members online:", members_word:"members", invite_caps:"INVITE", change_server:"Change server",
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
      repeats:"Repeats & cooldowns", repeats_p:"The destination link is needed for templates with [[LINK]] and for per-server filters. Cooldowns can be combined: days and hours add up (max 365 days).",
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
      sum_total:"Total messages: 1 000", sum_hint:"Bots are counted by the backend automatically", sum_server:"Server:", sum_exclude:"Member exclusion:", not_set:"not set", sum_bots:"Bots (estimate):", sum_aud:"Audience:", sum_online:"Online:",
      start_broadcast:"Start broadcast", active_hint:"Active broadcasts: 1 — you can start another on a different server",
      st_dm:"DM BROADCAST", bots_on_server:"Bots on server", dm_broadcast:"DM broadcast", running:"Running", sending:"Sending messages",
      dm_active:"Active", dm_paused:"Paused", dm_done:"Completed", dm_error:"Error", sent_word:"Sent", dm_pause:"Pause", dm_resume:"Resume", dm_repeat:"Repeat with the same settings",
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
      pick_a:"Выберите", pick_b:"сервер", search_ph:"Поиск…", online_members:"Участников в сети:", members_word:"участников", invite_caps:"ПРИГЛАСИТЬ", change_server:"Сменить сервер",
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
      repeats:"Повторы и кулдауны", repeats_p:"Ссылка назначения нужна для шаблонов с [[LINK]] и для фильтров по конкретному серверу. Кулдауны можно комбинировать: дни и часы складываются (максимум 365 дней).",
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
      sum_total:"Суммарно сообщений: 1 000", sum_hint:"Ботов посчитает бэкенд автоматически", sum_server:"Сервер:", sum_exclude:"Исключение участников:", not_set:"не задано", sum_bots:"Ботов (оценка):", sum_aud:"Аудитория:", sum_online:"Онлайн:",
      start_broadcast:"Запустить рассылку", active_hint:"Активных рассылок: 1 — можно запустить ещё на другой сервер",
      st_dm:"РАССЫЛКА В ЛС", bots_on_server:"Боты на сервере", dm_broadcast:"Рассылка в ЛС", running:"Идёт", sending:"Отправка сообщений",
      dm_active:"Активна", dm_paused:"Приостановлена", dm_done:"Завершена", dm_error:"Ошибка", sent_word:"Отправлено", dm_pause:"Пауза", dm_resume:"Возобновить", dm_repeat:"Повторить с теми же настройками",
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

  // Delegated so dynamically-added embed field rows also drive the live preview.
  document.addEventListener('input', (e) => { if (e.target.matches('[data-preview]') || e.target.closest('.dm-field-row')) updatePreview(); });
  document.addEventListener('change', (e) => { if (e.target.matches('.ff-inline')) updatePreview(); });

  // Auto-save: any edit anywhere in the Templates panel persists immediately.
  const tplPanel = $('.dm-panel[data-dpanel="templates"]');
  if (tplPanel) { tplPanel.addEventListener('input', () => saveState()); tplPanel.addEventListener('change', () => saveState()); }

  restoreState();
  toggleAddEmbed();
  updatePreview();
  loadServers();
})();
