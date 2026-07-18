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
      preview.innerHTML = '<span>Предпросмотр появится здесь</span>';
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

  $$('#dmall [data-preview]').forEach((el) => el.addEventListener('input', updatePreview));
  updatePreview();
})();
