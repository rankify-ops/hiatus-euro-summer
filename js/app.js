/* Hiatus Collection: shared UI (header, mega menu, cart drawer, cards, scenes). Plain JS, no build step. */
(() => {
  const H = window.HIATUS;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const money = n => '$' + n.toFixed(2).replace(/\.00$/, '');
  const byHandle = h => H.products.find(p => p.handle === h);

  const I = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 8h16M4 16h16"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2.8 2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 17l-5.8 3.3 1.4-6.4-4.9-4.4 6.5-.7L12 2.8Z"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 5v14M5 12h14"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m5 12 5 5 9-10"/></svg>'
  };
  const stars = (n = 5) => `<span class="stars" aria-label="${n} out of 5 stars">${I.star.repeat(n)}</span>`;
  const totalReviews = H.products.reduce((a, p) => a + p.reviews, 0);

  /* ---------- Header + mega menu + mobile sheet ---------- */
  function header(active) {
    const navItem = (k, label) => `<a href="collection.html?c=${k}" class="${active === k ? 'active' : ''}">${label}</a>`;
    const tiles = [['rings', 'Rings', 'unearthed-stacker'], ['bracelets', 'Bracelets', 'unearthed-cuff'], ['necklaces', 'Necklaces', 'sun-worshiper-pendant']]
      .map(([k, l, h]) => `<a class="tile" href="collection.html?c=${k}"><img src="${byHandle(h).cutout}" alt=""><span class="kicker">${H.products.filter(p => p.category === k).length} pieces</span><b>${l}</b></a>`).join('');
    const msg = [`Free express shipping on AU orders over $${H.freeShipping}`, '925 Sterling Silver', 'Ring Size Guarantee: one free size exchange', `Rated 5.0 from ${totalReviews} reviews`, 'Free ring sizer, we cover the cost'];
    const line = msg.map(m => `<span><i class="sq"></i>${m}</span>`).join('');
    document.body.insertAdjacentHTML('afterbegin', `
      <div class="topbar" role="region" aria-label="Store announcements"><div class="marquee">${line}${line}</div></div>
      <header class="header glass" id="hdr">
        <button class="icon-btn menu-btn" id="menuBtn" aria-label="Open menu" aria-expanded="false">${I.menu}</button>
        <a class="logo" href="index.html" aria-label="Hiatus Collection home"><img src="assets/logo-black.png" alt=""><b>HIATUS</b></a>
        <nav class="nav" aria-label="Main">
          <button type="button" id="shopBtn" aria-expanded="false" aria-controls="mega">Shop</button>
          ${navItem('rings', 'Rings')}${navItem('bracelets', 'Bracelets')}${navItem('necklaces', 'Necklaces')}
          <a href="${H.store}/pages/ring-size-guarantee">Sizing</a>
        </nav>
        <div class="hdr-actions">
          <button class="icon-btn hide-sm" aria-label="Search">${I.search}</button>
          <a class="icon-btn hide-sm" href="${H.store}/account" aria-label="Account">${I.user}</a>
          <button class="icon-btn" id="bagBtn" aria-label="Open bag">${I.bag}<span class="bag-count" id="bagCount"></span></button>
        </div>
      </header>
      <div class="mega glass" id="mega" aria-hidden="true">${tiles}
        <div class="promo"><span class="kicker">Not sure of your size?</span>
          <div class="display" style="font-size:30px">Free ring sizer.<br>We cover the cost.</div>
          <a class="btn btn-ink" href="collection.html?c=rings"><span>Shop rings ${I.arrow}</span></a></div>
      </div>
      <div class="sheet glass" id="sheet" aria-hidden="true">
        <a href="collection.html?c=all">Shop all ${I.arrow}</a>
        <a href="collection.html?c=rings">Rings ${I.arrow}</a>
        <a href="collection.html?c=bracelets">Bracelets ${I.arrow}</a>
        <a href="collection.html?c=necklaces">Necklaces ${I.arrow}</a>
      </div>`);
    const hdr = $('#hdr');

    const mega = $('#mega'), shopBtn = $('#shopBtn');
    let t;
    const setMega = open => { mega.classList.toggle('open', open); shopBtn.setAttribute('aria-expanded', open); mega.setAttribute('aria-hidden', !open); };
    shopBtn.addEventListener('click', () => setMega(!mega.classList.contains('open')));
    [shopBtn, mega].forEach(el => {
      el.addEventListener('mouseenter', () => { clearTimeout(t); setMega(true); });
      el.addEventListener('mouseleave', () => { t = setTimeout(() => setMega(false), 180); });
    });
    const sheet = $('#sheet'), menuBtn = $('#menuBtn');
    menuBtn.addEventListener('click', () => {
      const o = !sheet.classList.contains('open');
      sheet.classList.toggle('open', o); menuBtn.setAttribute('aria-expanded', o); sheet.setAttribute('aria-hidden', !o);
      menuBtn.innerHTML = o ? I.close : I.menu;
    });
    const onScroll = () => { const s = scrollY > 40; hdr.classList.toggle('scrolled', s); document.documentElement.classList.toggle('is-scrolled', s); };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { setMega(false); cart.close(); } });
  }

  /* ---------- Footer ---------- */
  function footer() {
    document.body.insertAdjacentHTML('beforeend', `
      <footer class="footer"><div class="wrap">
        <div class="cols">
          <div><img src="assets/logo-white.png" alt="Hiatus Collection" style="height:44px">
            <div class="big">Silver that wears in,<br>not out.</div>
            <span class="kicker">hello@hiatuscollection.com.au</span></div>
          <div><h4>Shop</h4><ul><li><a href="collection.html?c=all">All jewellery</a></li><li><a href="collection.html?c=rings">Rings</a></li><li><a href="collection.html?c=bracelets">Bracelets</a></li><li><a href="collection.html?c=necklaces">Necklaces</a></li></ul></div>
          <div><h4>Help</h4><ul><li><a href="${H.store}/policies/shipping-policy">Shipping</a></li><li><a href="${H.store}/policies/refund-policy">Returns</a></li><li><a href="${H.store}/pages/ring-size-guarantee">Ring Size Guarantee</a></li><li><a href="${H.store}/products/free-ring-sizer">Free ring sizer</a></li></ul></div>
          <div><h4>Follow</h4><ul><li><a href="https://www.instagram.com/hiatuscollection/">Instagram</a></li><li><a href="https://www.tiktok.com/@hiatuscollection">TikTok</a></li></ul></div>
        </div>
        <div class="base"><span>© ${new Date().getFullYear()} Hiatus Collection. 925 Sterling Silver.</span><span>Prices in AUD</span></div>
      </div></footer>
      <div class="scrim" id="scrim"></div>
      <aside class="drawer glass" id="drawer" aria-label="Your bag" aria-hidden="true">
        <div class="drawer-hd"><div class="display">Your bag</div><button class="icon-btn" id="closeBag" aria-label="Close bag">${I.close}</button></div>
        <div class="ship" id="ship"></div>
        <div class="lines" id="lines"></div>
        <div class="drawer-ft"><div class="tot"><span>Subtotal</span><span id="subtotal">$0</span></div>
          <a class="btn btn-primary btn-block" id="checkout" href="#"><span>Secure checkout ${I.arrow}</span></a>
          <small>Dispatched within 5–7 business days · Tracking emailed</small></div>
      </aside>
      <div class="toast glass" id="toast" role="status"></div>`);
  }

  /* ---------- Cart (localStorage; checkout builds a real Shopify cart permalink) ---------- */
  const cart = {
    key: 'hiatus-bag',
    items: [],
    load() { try { this.items = JSON.parse(localStorage.getItem(this.key)) || []; } catch { this.items = []; } },
    save() { try { localStorage.setItem(this.key, JSON.stringify(this.items)); } catch {} this.render(); },
    add(handle, variantId, qty = 1) {
      const p = byHandle(handle); const v = p.variants.find(v => v.id == variantId) || p.variants[0];
      const ex = this.items.find(i => i.id === v.id);
      ex ? ex.qty += qty : this.items.push({ id: v.id, handle, qty });
      this.save(); this.open();
    },
    set(id, qty) { this.items = this.items.map(i => i.id === id ? { ...i, qty } : i).filter(i => i.qty > 0); this.save(); },
    total() { return this.items.reduce((a, i) => a + byHandle(i.handle).price * i.qty, 0); },
    render() {
      const n = this.items.reduce((a, i) => a + i.qty, 0);
      $('#bagCount').textContent = n || '';
      const tot = this.total(), left = H.freeShipping - tot;
      $('#ship').innerHTML = (left > 0
        ? `You're <b>${money(left)}</b> away from free express shipping`
        : `${I.check.replace('<svg', '<svg width="14" style="vertical-align:-2px"')} You've unlocked <b>free express shipping</b>`)
        + `<div class="bar"><i style="width:${Math.min(100, tot / H.freeShipping * 100)}%"></i></div>`;
      $('#lines').innerHTML = this.items.length ? this.items.map(i => {
        const p = byHandle(i.handle), v = p.variants.find(v => v.id === i.id);
        return `<div class="line"><a class="th" href="product.html?p=${p.handle}"><img src="${p.cutout}" alt=""></a>
          <div><div class="t">${p.title}</div><div class="v">${v.title === 'Default Title' ? '925 Sterling Silver' : v.title}</div>
          <div class="qty"><button data-q="${i.id}" data-d="-1" aria-label="Decrease">−</button><span>${i.qty}</span><button data-q="${i.id}" data-d="1" aria-label="Increase">+</button></div></div>
          <div class="p">${money(p.price * i.qty)}</div></div>`;
      }).join('') : `<div class="empty"><div class="display h3" style="margin-bottom:10px">Nothing here yet</div>Start with a best seller.<br><br><a class="btn btn-glass" href="collection.html?c=all"><span>Shop all ${I.arrow}</span></a></div>`;
      $('#subtotal').textContent = money(tot);
      $('#checkout').href = this.items.length ? `${H.store}/cart/${this.items.map(i => i.id + ':' + i.qty).join(',')}` : 'collection.html?c=all';
    },
    open() { $('#drawer').classList.add('open'); $('#scrim').classList.add('open'); $('#drawer').setAttribute('aria-hidden', 'false'); },
    close() { $('#drawer')?.classList.remove('open'); $('#scrim')?.classList.remove('open'); $('#drawer')?.setAttribute('aria-hidden', 'true'); }
  };

  /* ---------- Product card ---------- */
  function card(p, i = 0, badge) {
    const sized = p.variants.length > 1;
    return `<article class="card glass rv-slide">
      <a class="jbox" href="product.html?p=${p.handle}" aria-label="${p.title}">
        <span class="glow"></span><span class="shadow delay-${i % 4}"></span>
        <img class="piece delay-${i % 4}" src="${p.cutout}" alt="${p.title} in 925 sterling silver" loading="lazy">
        <img class="alt" src="${p.images[0]}" alt="" loading="lazy">
        ${badge ? `<span class="chip badge"><i class="sq"></i>${badge}</span>` : ''}
        <button class="quick" data-quick="${p.handle}" type="button">${sized ? 'Choose size' : 'Quick add'} ${I.plus.replace('<svg', '<svg width="14"')}</button>
      </a>
      <div class="meta"><div class="row"><a class="name" href="product.html?p=${p.handle}">${p.title}</a><span class="price">${money(p.price)}</span></div>
        <div class="sub">${stars()} <span>${p.reviews} reviews</span></div></div>
    </article>`;
  }

  /* ---------- Scenes: fixed backgrounds that crossfade as sections enter ---------- */
  function scenes() {
    const secs = $$('[data-scene]');
    const urls = [...new Set(secs.map(s => s.dataset.scene))];
    if (!urls.length) return;
    const wrap = document.createElement('div'); wrap.className = 'scenes';
    wrap.innerHTML = urls.map((u, i) => `<div class="scene${i ? '' : ' on'}" data-u="${u}" style="background-image:url('${u}')"></div>`).join('');
    document.body.prepend(wrap);
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      $$('.scene', wrap).forEach(s => s.classList.toggle('on', s.dataset.u === e.target.dataset.scene));
    }), { rootMargin: '-45% 0px -45% 0px' });
    secs.forEach(s => io.observe(s));
  }

  /* ---------- Reveal on scroll (below the fold) ---------- */
  function reveals() {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    $$('.rv').forEach(el => io.observe(el));
  }

  function toast(html) {
    const t = $('#toast'); t.innerHTML = html; t.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2400);
  }

  /* ---------- Delegated clicks ---------- */
  document.addEventListener('click', e => {
    const q = e.target.closest('[data-quick]');
    if (q) {
      e.preventDefault();
      const p = byHandle(q.dataset.quick);
      if (p.variants.length > 1) location.href = `product.html?p=${p.handle}#size`;
      else cart.add(p.handle, p.variants[0].id);
      return;
    }
    const d = e.target.closest('[data-q]');
    if (d) { const it = cart.items.find(i => i.id == d.dataset.q); cart.set(it.id, it.qty + +d.dataset.d); return; }
    if (e.target.closest('#bagBtn')) cart.open();
    if (e.target.closest('#closeBag') || e.target.id === 'scrim') cart.close();
  });

  window.HX = {
    $, $$, I, money, stars, byHandle, card, cart, toast, totalReviews,
    init({ active } = {}) { header(active); footer(); scenes(); cart.load(); cart.render(); setTimeout(reveals); /* after the page script has rendered its content */ }
  };
})();
