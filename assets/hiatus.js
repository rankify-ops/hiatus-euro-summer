/* Hiatus theme behaviour: header, search, cart drawer, quick add, wishlist, tabs, product page */
(function () {
  'use strict';
  var H = window.Hiatus || {};
  var R = H.routes || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- money ---------- */
  function money(cents) {
    var fmt = H.moneyFormat || '${{amount}}';
    var v = (cents / 100);
    var amount = v.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    var noDec = Math.round(v).toLocaleString('en-AU');
    return fmt.replace(/\{\{\s*(\w+)\s*\}\}/, function (_, k) { return k.indexOf('no_decimals') > -1 ? noDec : amount; });
  }

  /* ---------- toast ---------- */
  var tt;
  function toast(m) { var t = $('#toast'); if (!t) return; t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(function () { t.classList.remove('on'); }, 2200); }
  H.toast = toast;

  /* ---------- scrim / drawers ---------- */
  var scrim = $('#scrim');
  function anyOpen() { return $$('.drawer.on').length > 0; }
  function openDrawer(el) { $$('.drawer.on').forEach(function (d) { if (d !== el) closeDrawer(d); }); el.classList.add('on'); el.setAttribute('aria-hidden', 'false'); scrim && scrim.classList.add('on'); }
  function closeDrawer(el) { el.classList.remove('on'); el.setAttribute('aria-hidden', 'true'); if (!anyOpen() && scrim) scrim.classList.remove('on'); }
  function cartEl() { return $('#drawer'); }
  function openCart() { var d = cartEl(); if (d) openDrawer(d); }
  function closeCart() { var d = cartEl(); if (d) closeDrawer(d); }
  scrim && scrim.addEventListener('click', function () { $$('.drawer.on').forEach(closeDrawer); });

  /* ---------- cart (AJAX + section rendering) ---------- */
  function refreshCart() {
    var d = cartEl(); if (d) d.classList.add('is-loading');
    return fetch(R.root + '?sections=cart-drawer', { credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (data) {
      var html = data['cart-drawer']; if (!html) return;
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var fresh = doc.querySelector('#drawer'); var cur = cartEl();
      if (fresh && cur) {
        ['#lines', '#foot', '#shipBar'].forEach(function (s) { var a = cur.querySelector(s), b = fresh.querySelector(s); if (a && b) a.innerHTML = b.innerHTML; });
        var n = +fresh.getAttribute('data-count') || 0; cur.setAttribute('data-count', n);
        var c = $('#cartCount'); if (c) { c.textContent = n; c.hidden = n === 0; }
      }
    }).catch(function () {}).then(function () { var d2 = cartEl(); if (d2) d2.classList.remove('is-loading'); });
  }
  function addItems(items) {
    return fetch(R.cartAdd + '.js', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ items: items })
    }).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw j; return j; }); });
  }
  function addVariant(id, qty, title, quiet) {
    return addItems([{ id: +id, quantity: qty || 1 }]).then(function () {
      return refreshCart().then(function () { if (!quiet) { toast((title || 'Added') + ' added to your bag'); openCart(); } });
    }).catch(function (e) { toast((e && (e.description || e.message)) || 'Could not add that to your bag'); throw e; });
  }
  H.addVariant = addVariant;
  function changeLine(key, qty) {
    var d = cartEl(); if (d) d.classList.add('is-loading');
    return fetch(R.cartChange + '.js', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: key, quantity: qty }) })
      .then(refreshCart);
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('button,a'); if (!t) return;
    if (t.id === 'cartBtn' && cartEl()) { e.preventDefault(); openCart(); return; }
    if (t.id === 'closeCart' || t.id === 'continueShopping') { closeCart(); return; }
    if (t.hasAttribute('data-qty')) { e.preventDefault(); changeLine(t.getAttribute('data-qty'), Math.max(0, +t.getAttribute('data-to'))); return; }
    if (t.hasAttribute('data-addvariant')) { e.preventDefault(); addVariant(t.getAttribute('data-addvariant'), 1, t.getAttribute('data-title')); return; }
    if (t.id === 'addUpsell') { e.preventDefault(); t.classList.add('added'); t.textContent = '✓ Added'; return; }
  });

  /* ---------- header: scrolled state, menu ---------- */
  var hero = $('.hero-photo') || $('.bf-hh');
  function onScroll() { document.body.classList.toggle('scrolled', !hero || scrollY > hero.offsetHeight - 90); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  var menuBtn = $('#menuBtn');
  var mobileMenu = $('#mobileMenu');
  function openMobMenu() { var tb = $('.topbar'); var hs = $('.hdr-shell'); var h = (tb ? tb.offsetHeight : 0) + (hs ? hs.offsetHeight : 0); document.documentElement.style.setProperty('--hdr-h', h + 'px'); mobileMenu.hidden = false; document.body.style.overflow = 'hidden'; document.body.classList.add('menu-open'); menuBtn.setAttribute('aria-expanded', 'true'); }
  function closeMobMenu() { mobileMenu.hidden = true; document.body.style.overflow = ''; document.body.classList.remove('menu-open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', function () { if (mobileMenu.hidden) openMobMenu(); else closeMobMenu(); });
  }

  /* ---------- weather ---------- */
  (function () {
    var w = H.weather || {}; var t = $('#wxTime'), tp = $('#wxTemp'); if (!t) return;
    function tick() { try { t.textContent = new Intl.DateTimeFormat('en-AU', { timeZone: w.tz || 'Australia/Brisbane', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()); } catch (e) {} }
    tick(); setInterval(tick, 15000);
    function wx() {
      fetch('https://api.open-meteo.com/v1/forecast?latitude=' + parseFloat(w.lat) + '&longitude=' + parseFloat(w.lon) + '&current=temperature_2m&timezone=' + encodeURIComponent(w.tz || 'Australia/Brisbane'))
        .then(function (r) { return r.json(); }).then(function (d) { if (d && d.current && d.current.temperature_2m != null) tp.textContent = Math.round(d.current.temperature_2m) + '°C'; }).catch(function () {});
    }
    wx(); setInterval(wx, 600000);
  })();

  /* ---------- search (predictive) ---------- */
  (function () {
    var hdr = $('.hdr'), inp = $('#srchIn'), res = $('#srchRes'); if (!hdr || !inp || !res) return;
    var sel = -1, list = [], timer, ctl;
    function fit() {
      if (innerWidth <= 1000) return;
      var nav = $('#nav'), tools = $('.hdr-tools'); if (!nav || !tools) return;
      var room = tools.getBoundingClientRect().right - 90 - nav.getBoundingClientRect().right - 20;
      if (room >= 240) { hdr.classList.remove('srch-wide'); hdr.style.setProperty('--srch-w', Math.min(room, 340) + 'px'); }
      else { hdr.classList.add('srch-wide'); hdr.style.setProperty('--srch-w', 'min(420px,40vw)'); }
    }
    function open() { fit(); hdr.classList.add('searching'); setTimeout(function () { inp.focus(); }, 30); }
    function close() { hdr.classList.remove('searching'); res.hidden = true; inp.value = ''; sel = -1; list = []; }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function draw() {
      var q = inp.value.trim();
      var h = list.map(function (p, i) {
        var img = p.featured_image && p.featured_image.url ? p.featured_image.url + (p.featured_image.url.indexOf('?') > -1 ? '&' : '?') + 'width=120' : (p.image || '');
        return '<a href="' + p.url + '" class="' + (i === sel ? 'on' : '') + '">' + (img ? '<img src="' + img + '" alt="">' : '') + '<span><b>' + esc(p.title) + '</b><small>' + esc(p.type || '') + (p.price ? ' · ' + esc(money(Math.round(parseFloat(p.price) * 100))) : '') + '</small></span></a>';
      }).join('');
      if (!list.length) h = '<div class="srch-none">No pieces match “' + esc(q) + '”</div>';
      h += '<a class="srch-all" href="' + R.search + '?type=product&q=' + encodeURIComponent(q) + '">View all results</a>';
      res.innerHTML = h; res.hidden = false;
    }
    function query() {
      var q = inp.value.trim(); if (!q) { res.hidden = true; list = []; return; }
      if (ctl) ctl.abort(); ctl = window.AbortController ? new AbortController() : null;
      fetch(R.predictive + '.json?q=' + encodeURIComponent(q) + '&resources[type]=product&resources[limit]=6', { signal: ctl ? ctl.signal : undefined })
        .then(function (r) { return r.json(); }).then(function (d) { list = (d.resources && d.resources.results && d.resources.results.products) || []; sel = -1; draw(); }).catch(function () {});
    }
    $$('[data-search]').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); (hdr.classList.contains('searching') && innerWidth <= 1000) ? close() : open(); }); });
    var x = $('#srchClose'); x && x.addEventListener('click', function (e) { e.stopPropagation(); close(); });
    inp.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(query, 180); });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { close(); return; }
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && list.length) { e.preventDefault(); sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length; draw(); return; }
      if (e.key === 'Enter' && sel > -1 && list[sel]) { e.preventDefault(); location.href = list[sel].url; }
    });
    document.addEventListener('click', function (e) { if (hdr.classList.contains('searching') && !e.target.closest('.srch') && !e.target.closest('[data-search]')) close(); });
    addEventListener('resize', fit);
  })();

  /* ---------- product cards: image arrows, quick add, size popup ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('button'); if (!t) return;
    if (t.hasAttribute('data-cimg')) {
      e.preventDefault(); var c = t.closest('.card'); var imgs = []; try { imgs = JSON.parse(c.getAttribute('data-imgs') || '[]'); } catch (x) {}
      if (!imgs.length) return; var i = ((+c.getAttribute('data-idx') || 0) + (+t.getAttribute('data-cimg')) + imgs.length) % imgs.length;
      c.setAttribute('data-idx', i); var im = c.querySelector('.shot'); if (im) { im.removeAttribute('srcset'); im.src = imgs[i]; im.classList.toggle('life', i > 0); }
      $$('.card-dots i', c).forEach(function (d, k) { d.classList.toggle('on', k === i); }); return;
    }
    if (t.hasAttribute('data-cardqa')) {
      e.preventDefault(); var v = t.getAttribute('data-variant');
      if (v) { addVariant(v, 1, t.getAttribute('data-title')); return; }
      var card = t.closest('.card'); var o = !card.classList.contains('open');
      $$('.card.open').forEach(function (x) { x.classList.remove('open'); }); card.classList.toggle('open', o); return;
    }
    if (t.hasAttribute('data-cardvariant')) {
      e.preventDefault(); var cd = t.closest('.card'); cd && cd.classList.remove('open');
      addVariant(t.getAttribute('data-cardvariant'), 1, t.getAttribute('data-title')); return;
    }
  });

  /* ---------- home tabs ---------- */
  function placeTabInd() { var a = $('.tab[aria-selected="true"]'), i = $('.tab-ind'); if (!a || !i) return; i.style.width = a.offsetWidth + 'px'; i.style.transform = 'translateX(' + a.offsetLeft + 'px)'; }
  function tabScroll() {
    var w = $('.tabs-wrap'), t = $('.tab[aria-selected="true"]'); if (!w || !t) return;
    var first = $('.tab'); if (t === first) { w.scrollLeft = 0; return; }
    if (t.offsetLeft < w.scrollLeft || t.offsetLeft + t.offsetWidth > w.scrollLeft + w.clientWidth) w.scrollTo({ left: Math.max(0, t.offsetLeft - 24), behavior: 'smooth' });
  }
  function selectTab(btn) {
    $$('.tab', btn.closest('.tabs')).forEach(function (b) { var on = b === btn; b.setAttribute('aria-selected', on); var p = document.getElementById(b.getAttribute('aria-controls')); if (p) p.hidden = !on; });
    placeTabInd(); setTimeout(tabScroll, 40); fitGrids();
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('.tab'); if (t) { selectTab(t); return; }
    var s = e.target.closest('[data-tosale]');
    if (s && $('#shop-tabs')) {
      e.preventDefault(); var g = $('.tabs-wrap'); var hh = ($('.hdr') || { offsetHeight: 70 }).offsetHeight + 28;
      if (g) scrollTo({ top: g.getBoundingClientRect().top + scrollY - hh, behavior: 'smooth' });
      var f = $('.tab'); if (f && f.getAttribute('aria-selected') !== 'true') selectTab(f);
    }
  });
  addEventListener('resize', placeTabInd);
  document.fonts && document.fonts.ready.then(placeTabInd);
  setTimeout(placeTabInd, 50);

  /* ---------- trust panel sits half over the hero ---------- */
  function fitTrust() { $$('.trust-wrap:not(.pdp-trust)').forEach(function (w) { var p = w.querySelector('.trust4'); if (p) w.style.marginTop = (-p.offsetHeight / 2) + 'px'; }); }
  addEventListener('resize', fitTrust); setTimeout(fitTrust, 30); addEventListener('load', fitTrust);

  /* ---------- grids: fewer cards than columns sit left at normal size ---------- */
  function fitGrids() {
    $$('main#view .grid, main#view .coll-grid').forEach(function (g) {
      if (g.hidden) return;
      var n = g.querySelectorAll(':scope > .card').length; if (!n) return;
      ['grid-template-columns', 'width', 'margin-left', 'margin-right'].forEach(function (p) { g.style.removeProperty(p); });
      var cols = getComputedStyle(g).gridTemplateColumns.split(' ').length;
      if (n < cols) {
        var cw = g.getBoundingClientRect().width / cols;
        g.style.setProperty('grid-template-columns', 'repeat(' + n + ',' + cw + 'px)', 'important');
        g.style.setProperty('width', (cw * n) + 'px', 'important');
        g.style.setProperty('margin-left', '0', 'important'); g.style.setProperty('margin-right', 'auto', 'important');
      }
    });
  }
  var fgq; addEventListener('resize', function () { cancelAnimationFrame(fgq); fgq = requestAnimationFrame(fitGrids); }); fitGrids();

  /* ---------- collection sort ---------- */
  document.addEventListener('change', function (e) {
    if (e.target.matches('[data-sort]')) { var u = new URL(location.href); u.searchParams.set('sort_by', e.target.value); u.searchParams.delete('page'); location.href = u.toString(); }
  });

  /* ---------- product page ---------- */
  (function () {
    var form = $('#pdpForm'); if (!form) return;
    var idIn = $('#pdpVariant'), need = $('#need'), qty = 1;
    var addBtn = $('#addBtn'), add2 = $('#addBtn2');
    function setNeed(m) { if (need) need.textContent = m || ''; }
    document.addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t) return;
      if (t.classList.contains('size') && t.hasAttribute('data-variant')) {
        var wasOn = t.getAttribute('aria-pressed') === 'true';
        $$('.size[data-variant]').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        if (wasOn) { idIn.value = ''; var sv2 = $('#sizeVal'); if (sv2) sv2.textContent = 'Select'; setNeed(''); if (history.replaceState) { var u2 = new URL(location.href); u2.searchParams.delete('variant'); history.replaceState(null, '', u2.toString()); } return; }
        t.setAttribute('aria-pressed', 'true');
        idIn.value = t.getAttribute('data-variant');
        var sv = $('#sizeVal'); if (sv) sv.textContent = t.getAttribute('data-label') + (t.hasAttribute('data-pre') ? ' · Pre-order' : '');
        var p = +t.getAttribute('data-price'), c = +t.getAttribute('data-compare');
        var pr = $('#pdpPrice'); if (pr) { var _html = (c > p ? '<span class="sale-now">' + money(p) + '</span><s>' + money(c) + '</s>' : money(p)) + ' ' + (H.currency || ''); if (c > p) { var _sv = (c - p), _pct = Math.round(_sv / c * 100); _html += '<span class="sale-badges"><span class="sale-badge">Save ' + money(_sv) + '</span><span class="sale-badge">' + _pct + '% OFF</span></span>'; } pr.innerHTML = _html; }
        var atcTop = addBtn && addBtn.querySelector('.atc-top');
        if (atcTop) atcTop.innerHTML = 'ADD TO CART &bull; ' + (c > p ? '<s class="atc-was">' + money(c) + '</s> ' : '') + money(p) + ' ' + (H.currency || '');
        var addSub = $('#addSub');
        if (addSub) addSub.innerHTML = t.hasAttribute('data-pre') ? '<span class="atc-dot" style="background:#f59e0b"></span><b>PRE-ORDER</b> : SHIPS LATER' : '<span class="atc-dot"></span><b>IN STOCK</b> : READY TO SHIP';
        var ins = $('#pdpInst'); if (ins) ins.textContent = money(Math.round(p / 4));
        setNeed('');
        var d = t.closest('details'); if (d) setTimeout(function () { d.open = false; fitBuy(); }, 180);
        if (history.replaceState) { var u = new URL(location.href); u.searchParams.set('variant', idIn.value); history.replaceState(null, '', u.toString()); }
        return;
      }
      if (t.id === 'qMinus' || t.id === 'qPlus') { qty = Math.max(1, Math.min(9, qty + (t.id === 'qPlus' ? 1 : -1))); $('#qOut').textContent = qty; $('#pdpQty').value = qty; return; }
      if (t.id === 'buyNow') {
        if (!idIn.value) { setNeed('Pick your size to continue.'); openSizes(); return; }
        t.disabled = true; addItems([{ id: +idIn.value, quantity: qty }]).then(function () { location.href = '/checkout'; }).catch(function (x) { t.disabled = false; toast((x && x.description) || 'Could not start checkout'); });
        return;
      }
      if (t.id === 'addBtn2') { e.preventDefault(); submit(); return; }
      if (t.hasAttribute('data-sizeguide')) { e.preventDefault(); e.stopPropagation(); $('#sg').hidden = false; $('#sgScrim').hidden = false; return; }
    });
    function openSizes() { var d = $('.opt-size'); if (d) { d.open = true; var s = $('.sizes'); s && s.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }
    function submit() {
      if (!idIn.value) { setNeed('Pick your size to add this to your bag.'); openSizes(); return; }
      addBtn && (addBtn.disabled = true);
      addVariant(idIn.value, qty, ($('.pdp h1') || {}).textContent).catch(function () {}).then(function () { addBtn && (addBtn.disabled = false); });
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); submit(); });

    // preselect ?variant=
    var vid = new URL(location.href).searchParams.get('variant');
    if (vid) { var b = $('.size[data-variant="' + vid + '"]'); if (b && !b.disabled) b.click(); }

    // sticky buy card top
    function fitBuy() { var b = $('.pdp .buy'); if (!b) return; var hh = innerWidth > 1080 ? 96 : 0; b.style.setProperty('--buy-top', Math.min(hh, innerHeight - b.offsetHeight - 20) + 'px'); }
    addEventListener('resize', fitBuy); document.addEventListener('toggle', fitBuy, true); setTimeout(fitBuy, 60); addEventListener('load', fitBuy);

    // sticky mobile bar: hidden until the main add-to-cart has been seen then scrolled out of view
    var bar = $('.mobile-buy');
    if (bar && addBtn && 'IntersectionObserver' in window) {
      bar.classList.add('mb-hide');
      var seen = false;
      new IntersectionObserver(function (es) { es.forEach(function (x) {
        if (x.isIntersecting) { seen = true; bar.classList.add('mb-hide'); }
        else if (seen) { bar.classList.remove('mb-hide'); }
      }); }, { threshold: 0 }).observe(addBtn);
    }

    // gallery thumbs on mobile swipe
    var media = $('.pdp-media');
    if (media) {
      media.addEventListener('scroll', function () { var i = Math.round(media.scrollLeft / media.clientWidth); $$('.pm-th').forEach(function (d, k) { d.classList.toggle('on', k === i); }); }, { passive: true });
      document.addEventListener('click', function (e) { var th = e.target.closest('.pm-th'); if (!th || !media) return; var idx = +th.dataset.slide; var figs = $$('.pdp-media .pm'); if (figs[idx]) figs[idx].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' }); });
    }

    // force HD video sources
    $$('.pm-vid video').forEach(function (v) {
      var sources = v.querySelectorAll('source');
      if (sources.length > 1) {
        var best = sources[sources.length - 1];
        v.src = best.src;
        sources.forEach(function (s) { s.remove(); });
        v.load();
      }
      v.setAttribute('playsinline', '');
      v.play().catch(function () {});
    });

    // assure popups
    var assureData = {
      warranty: { title: 'Lifetime warranty', body: 'Every Hiatus piece is backed by a lifetime warranty against defects in materials and workmanship. If something goes wrong, we’ll repair or replace it — no questions asked.' },
      shipping: { title: 'Free express shipping', body: 'All Australian orders over $149 ship free via express post. In-stock orders are dispatched within 5–7 business days and typically arrive in 1–3 days after dispatch.' },
      exchanges: { title: 'Exchanges within 14 days', body: 'Changed your mind? Full-price items can be exchanged unworn within 14 days of delivery. Rings include our Ring Size Guarantee — one free size exchange within 14 days.' }
    };
    document.addEventListener('click', function (e) {
      var card = e.target.closest('.assure-card');
      if (card) {
        var key = card.dataset.assure;
        var d = assureData[key]; if (!d) return;
        var modal = $('#assureModal');
        $('#assureIcon').innerHTML = card.querySelector('svg').outerHTML;
        $('#assureTitle').textContent = d.title;
        $('#assureBody').textContent = d.body;
        modal.hidden = false;
        document.body.style.overflow = 'hidden';
        return;
      }
      var modal = $('#assureModal');
      if (!modal || modal.hidden) return;
      if (e.target.closest('.assure-modal-close') || e.target === modal) {
        modal.hidden = true;
        document.body.style.overflow = '';
      }
    });

    // reviews jump
    document.addEventListener('click', function (e) { var a = e.target.closest('[data-toreviews]'); if (!a) return; var r = $('#reviews'); if (r) { e.preventDefault(); r.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
  })();

  /* ---------- size guide ---------- */
  function closeSG() { var a = $('#sg'), b = $('#sgScrim'); if (a) a.hidden = true; if (b) b.hidden = true; }
  document.addEventListener('click', function (e) { if (e.target.closest('[data-sgclose]') || e.target.id === 'sgScrim') { closeSG(); } });

  /* ---------- info popovers ---------- */
  (function () {
    function closeAll(except) { $$('.info-note:not([hidden])').forEach(function (n) { if (n !== except) { n.hidden = true; var b = $('[aria-controls="' + n.id + '"]'); b && b.setAttribute('aria-expanded', 'false'); } }); }
    document.addEventListener('click', function (e) {
      var b = e.target.closest('.info-i');
      if (b) {
        e.preventDefault(); var n = document.getElementById(b.getAttribute('aria-controls')); if (!n) return;
        var open = n.hidden; closeAll(n); n.hidden = !open; b.setAttribute('aria-expanded', open);
        if (open) requestAnimationFrame(function () { var row = n.parentElement.getBoundingClientRect(), br = b.getBoundingClientRect(); n.style.setProperty('--arrow-r', Math.max(12, row.right - (br.left + br.width / 2) - 5) + 'px'); });
        return;
      }
      if (!e.target.closest('.info-note')) closeAll(null);
    });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(null); });
  })();

  /* ---------- image lightbox ---------- */
  (function () {
    var lb = $('#lb'); if (!lb) return; var list = [], i = 0;
    function show(n) { i = (n + list.length) % list.length; $('#lbImg').src = list[i]; $('#lbCount').textContent = (i + 1) + ' / ' + list.length; }
    function open(n) { list = $$('.pdp-media .pm:not(.pm-vid) img').map(function (im) { return im.currentSrc || im.src; }); if (!list.length) return; show(n); lb.hidden = false; document.body.style.overflow = 'hidden'; $('#lbClose').focus(); }
    function close() { lb.hidden = true; document.body.style.overflow = ''; }
    document.addEventListener('click', function (e) {
      var fig = e.target.closest('.pdp-media .pm'); if (fig && !fig.classList.contains('pm-vid')) { open($$('.pdp-media .pm:not(.pm-vid)').indexOf(fig)); return; }
      if (e.target.closest('#lbClose') || e.target.id === 'lbImg' || e.target.id === 'lb') { close(); return; }
      if (e.target.closest('#lbPrev')) { show(i - 1); return; } if (e.target.closest('#lbNext')) { show(i + 1); }
    });
    addEventListener('keydown', function (e) { if (lb.hidden) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') show(i - 1); if (e.key === 'ArrowRight') show(i + 1); });
    var sx = null; lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) { if (sx == null) return; var d = e.changedTouches[0].clientX - sx; if (Math.abs(d) > 40) show(i + (d < 0 ? 1 : -1)); sx = null; });
  })();

  /* ---------- wishlist (saved on this device) ---------- */
  (function () {
    var KEY = 'hiatus-wish', RIB = '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" d="M19 21l-7-6.5L5 21V3.5h14Z"/></svg>';
    var wish = []; try { wish = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { wish = []; }
    var cache = {}, picked = {}, drawer = $('#wishDrawer');
    function store() { try { localStorage.setItem(KEY, JSON.stringify(wish)); } catch (e) {} }
    function has(h) { return wish.indexOf(h) > -1; }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function get(h) { if (cache[h]) return Promise.resolve(cache[h]); return fetch(R.root + 'products/' + h + '.js').then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (p) { cache[h] = p; return p; }); }
    function sync() {
      $$('[data-wish]').forEach(function (b) { var on = has(b.getAttribute('data-wish')); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); if (b.classList.contains('wish-pdp')) { var s = b.querySelector('span'); if (s) s.textContent = on ? 'Saved to wishlist' : 'Save to wishlist'; } });
      $$('[data-wishopen]').forEach(function (b) { b.classList.toggle('on', wish.length > 0); var c = b.querySelector('.wish-count'); if (!c) { c = document.createElement('span'); c.className = 'wish-count'; b.appendChild(c); } c.textContent = wish.length; c.hidden = !wish.length; });
    }
    function sizeLbl(t) { var m = t.match(/^(\d+)\s*\(/); if (m) return 'US ' + m[1]; return t.replace(' - (', ' ').replace(')', '').replace(' Inches', '"'); }
    function line(p) {
      var multi = p.variants.length > 1, sel = picked[p.handle] || '';
      var img = p.featured_image ? p.featured_image.replace(/(\.\w+)(\?|$)/, '$1$2') : '';
      return '<div class="wline" data-wl="' + p.handle + '"><a class="ph" href="' + p.url + '" data-wishclose>' + (img ? '<img src="' + img + (img.indexOf('?') > -1 ? '&' : '?') + 'width=240" alt="">' : '') + '</a><div>' +
        '<div class="top"><a class="n" href="' + p.url + '" data-wishclose>' + esc(p.title) + '</a><span class="pr">' + (p.price > 0 ? money(p.price) : 'Free') + '</span></div>' +
        '<div class="acts">' + (multi ? '<select data-wsize="' + p.handle + '" aria-label="Size for ' + esc(p.title) + '"><option value="">Size</option>' + p.variants.map(function (v) { return '<option' + (String(v.id) === String(sel) ? ' selected' : '') + ' value="' + v.id + '"' + (v.available ? '' : ' disabled') + '>' + esc(sizeLbl(v.title)) + (v.available ? '' : ' (sold out)') + '</option>'; }).join('') + '</select>' : '') +
        '<button type="button" class="add" data-wadd="' + p.handle + '">Add to bag</button><button type="button" class="rmw" data-wrm="' + p.handle + '">Remove</button></div></div></div>';
    }
    function render() {
      var L = $('#wishLines'), F = $('#wishFoot'); if (!L) return;
      if (!wish.length) { L.innerHTML = '<div class="empty">' + RIB + '<span>Nothing saved yet.<br>Tap the ribbon on any piece to keep it here.</span><a class="btn btn-glass" href="' + R.collections + '/all" data-wishclose>Shop the collection</a></div>'; F.innerHTML = ''; return; }
      Promise.all(wish.map(function (h) { return get(h).catch(function () { return null; }); })).then(function (ps) {
        var ok = ps.filter(Boolean); wish = ok.map(function (p) { return p.handle; }); store(); sync();
        L.innerHTML = ok.map(line).join('');
        F.innerHTML = ok.length ? '<button type="button" class="btn-all" data-waddall>Add all to bag</button><small>Saved on this device</small>' : '';
      });
    }
    function variantFor(h) { var p = cache[h]; if (!p) return null; if (p.variants.length === 1) return p.variants[0].available ? p.variants[0].id : null; return picked[h] || null; }
    function open() { render(); if (drawer) openDrawer(drawer); }
    function close() { if (drawer) closeDrawer(drawer); }
    function toggle(h, title) { if (has(h)) { wish.splice(wish.indexOf(h), 1); toast((title || 'Piece') + ' removed from your wishlist'); } else { wish.unshift(h); toast((title || 'Piece') + ' saved to your wishlist'); } store(); sync(); }
    document.addEventListener('click', function (e) {
      var t = e.target;
      var o = t.closest('[data-wishopen]'); if (o) { e.preventDefault(); e.stopPropagation(); open(); return; }
      var w = t.closest('[data-wish]'); if (w) { e.preventDefault(); e.stopPropagation(); var card = w.closest('.card'); var ti = card ? (card.querySelector('.card-title') || {}).textContent : ($('.pdp h1') || {}).textContent; toggle(w.getAttribute('data-wish'), ti && ti.trim()); return; }
      if (t.closest('[data-wishclose]')) { close(); return; }
      var a = t.closest('[data-wadd]');
      if (a) {
        e.preventDefault(); e.stopPropagation(); var h = a.getAttribute('data-wadd'), id = variantFor(h);
        if (!id) { var r = $('[data-wl="' + h + '"]'); if (r) { r.classList.add('need'); var s = r.querySelector('select'); s && s.focus(); } toast('Pick a size first'); return; }
        addVariant(id, 1, cache[h].title, true).then(function () { wish.splice(wish.indexOf(h), 1); store(); sync(); close(); toast(cache[h].title + ' moved to your bag'); openCart(); }).catch(function () {});
        return;
      }
      var rm = t.closest('[data-wrm]'); if (rm) { e.preventDefault(); e.stopPropagation(); wish.splice(wish.indexOf(rm.getAttribute('data-wrm')), 1); store(); sync(); render(); return; }
      if (t.closest('[data-waddall]')) {
        e.preventDefault(); e.stopPropagation();
        var items = [], moved = [], left = 0;
        wish.forEach(function (h) { var id = variantFor(h); if (id) { items.push({ id: +id, quantity: 1 }); moved.push(h); } else { left++; var r = $('[data-wl="' + h + '"]'); r && r.classList.add('need'); } });
        if (!items.length) { toast('Pick a size for each piece first'); return; }
        addItems(items).then(refreshCart).then(function () {
          wish = wish.filter(function (h) { return moved.indexOf(h) < 0; }); store(); sync();
          if (left) { render(); toast(moved.length + ' added. Pick sizes for the rest'); } else { close(); toast('All moved to your bag'); openCart(); }
        }).catch(function (x) { toast((x && x.description) || 'Could not add those'); });
      }
    }, true);
    document.addEventListener('change', function (e) { var s = e.target.closest('[data-wsize]'); if (s) { picked[s.getAttribute('data-wsize')] = s.value; var r = s.closest('.wline'); r && r.classList.remove('need'); } });
    sync();
  })();

  /* ---------- collection info modal ---------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-coll-info]');
    if (btn) { var m = $('#collInfoSilver'); if (m) m.hidden = false; return; }
    var cls = e.target.closest('.coll-info-close');
    if (cls) { var m = cls.closest('.coll-info-modal'); if (m) m.hidden = true; return; }
    if (e.target.classList && e.target.classList.contains('coll-info-modal')) { e.target.hidden = true; return; }
  });

  /* ---------- filter / sort panels ---------- */
  (function () {
    var filterBtn = $('#filterBtn'), sortBtn = $('#sortBtn');
    var filterPanel = $('#filterPanel'), sortPanel = $('#sortPanel');
    function openPanel(p) { if (p) p.hidden = false; }
    function closePanel(p) { if (p) p.hidden = true; }
    if (filterBtn && filterPanel) filterBtn.addEventListener('click', function () { openPanel(filterPanel); });
    if (sortBtn && sortPanel) sortBtn.addEventListener('click', function () { openPanel(sortPanel); });
    document.addEventListener('click', function (e) {
      if (e.target.closest('.fp-panel-close')) { var p = e.target.closest('.fp-panel'); if (p) closePanel(p); return; }
      if (e.target.classList && e.target.classList.contains('fp-panel')) { closePanel(e.target); return; }
      var sv = e.target.closest('[data-sort-val]');
      if (sv) {
        var val = sv.getAttribute('data-sort-val');
        var url = new URL(window.location.href);
        url.searchParams.set('sort_by', val);
        window.location.href = url.toString();
      }
    });
  })();

  /* ---------- escape closes everything ---------- */
  addEventListener('keydown', function (e) { if (e.key === 'Escape') { $$('.drawer.on').forEach(closeDrawer); closeSG(); $$('.card.open').forEach(function (c) { c.classList.remove('open'); }); var ci = $('#collInfoSilver'); if (ci) ci.hidden = true; $$('.fp-panel').forEach(function (p) { p.hidden = true; }); if (typeof closeMobMenu === 'function' && mobileMenu && !mobileMenu.hidden) closeMobMenu(); } });
  document.addEventListener('click', function (e) { if (!e.target.closest('.card')) $$('.card.open').forEach(function (c) { c.classList.remove('open'); }); });
})();
