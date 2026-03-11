(function () {
  const STORAGE_KEYS = {
    cart: 'shop.cart.v1',
    recent: 'shop.recent.v1',
    newsletter: 'shop.newsletter.v1',
  };

  const state = {
    products: [],
    categories: [],
    filters: {
      availability: new Set(),
      brands: new Set(),
      minPrice: 0,
      maxPrice: 80,
    },
    sort: 'featured',
    view: 'grid',
    page: 1,
    perPage: 6,
  };

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    renderGlobalHeader();
    renderGlobalFooter();
    initCountdown();
    initDrawer();
    initFilterAccordion();
    initNewsletterForm();

    const [products, categories] = await Promise.all([
      safeJsonFetch('../data/shop-products.json', []),
      safeJsonFetch('../data/shop-categories.json', []),
    ]);

    state.products = Array.isArray(products) ? products : [];
    state.categories = Array.isArray(categories) ? categories : [];

    renderCategoryNav();
    updateCartBadges();

    if (document.querySelector('[data-collection-app]')) initCollectionPage();
    if (document.querySelector('[data-product-page]')) initProductPage();
    if (document.querySelector('[data-cart-page]')) initCartPage();
    if (document.querySelector('[data-search-page]')) initSearchPage();
    if (document.querySelector('[data-brand-page]')) initBrandPage();

    renderRecentlyViewed();
  }

  async function safeJsonFetch(url, fallback) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) return fallback;
      return await response.json();
    } catch (error) {
      return fallback;
    }
  }

  function renderGlobalHeader() {
    const slot = document.querySelector('[data-shop-header-slot]');
    if (!slot) return;
    slot.innerHTML = `
      <div class="announcement-bar" data-countdown data-countdown-deadline="2026-01-15T23:59:59Z">
        <div class="shop-container announcement-bar__inner">
          <p>Spring offers end in <strong data-countdown-value>--:--:--</strong></p>
          <a href="./collection.html">Shop now</a>
        </div>
      </div>

      <header class="shop-header">
        <div class="shop-container shop-header__inner">
          <button class="menu-toggle" data-menu-toggle aria-expanded="false" aria-controls="mobile-drawer">Menu</button>
          <a class="shop-brand" href="../index.html">Nizar Store</a>
          <nav class="shop-nav" aria-label="Primary">
            <a href="./collection.html">Shop</a>
            <a href="./search.html">Search</a>
            <a href="./brands.html">Brands</a>
            <a href="./rewards.html">Rewards</a>
          </nav>
          <div class="shop-actions">
            <a href="./contact.html">Login</a>
            <a href="./cart.html" aria-label="Cart">Cart (<span data-cart-count>0</span>)</a>
          </div>
        </div>
      </header>

      <aside id="mobile-drawer" class="mobile-drawer" data-mobile-drawer aria-hidden="true">
        <div class="mobile-drawer__panel">
          <div class="mobile-drawer__head">
            <strong>Browse Categories</strong>
            <button type="button" data-menu-close aria-label="Close menu">✕</button>
          </div>
          <nav class="mobile-drawer__nav" aria-label="Category navigation" data-category-nav></nav>
          <div class="mobile-drawer__links">
            <a href="./collection.html">Shop All</a>
            <a href="./search.html">Search</a>
            <a href="./brands.html">Shop by Brand</a>
            <a href="./rewards.html">Rewards</a>
            <a href="./contact.html">Contact</a>
            <a href="./cart.html">Cart (<span data-cart-count>0</span>)</a>
          </div>
        </div>
      </aside>

      <aside class="cart-drawer" data-cart-drawer aria-hidden="true">
        <div class="cart-drawer__panel">
          <div class="cart-drawer__head">
            <h2>Your cart</h2>
            <button type="button" data-cart-drawer-close aria-label="Close cart">✕</button>
          </div>
          <div data-cart-drawer-items></div>
          <div class="cart-summary">
            <p>Subtotal <strong data-cart-subtotal>$0</strong></p>
            <div class="shipping-progress" data-shipping-progress>
              <p data-shipping-message>Add items to unlock free delivery.</p>
              <div class="shipping-progress__bar"><span data-shipping-progress-bar></span></div>
            </div>
            <a class="cart-drawer__cta" href="./cart.html">View cart</a>
          </div>
        </div>
      </aside>
    `;

    slot.querySelectorAll('a[aria-label="Cart"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        if (link.classList.contains('js-open-drawer')) {
          event.preventDefault();
          openCartDrawer();
        }
      });
    });

    const close = slot.querySelector('[data-cart-drawer-close]');
    const drawer = slot.querySelector('[data-cart-drawer]');
    if (close && drawer) {
      close.addEventListener('click', closeCartDrawer);
      drawer.addEventListener('click', (event) => {
        if (event.target === drawer) closeCartDrawer();
      });
    }
  }

  function renderGlobalFooter() {
    const slot = document.querySelector('[data-shop-footer-slot]');
    if (!slot) return;
    slot.innerHTML = `
      <section class="newsletter" aria-labelledby="newsletter-title">
        <div class="shop-container newsletter__inner">
          <div>
            <h2 id="newsletter-title">Get updates</h2>
            <p>Sign up for product drops, seasonal offers, and release notes.</p>
          </div>
          <form class="newsletter__form" data-newsletter-form>
            <label class="sr-only" for="newsletter-email">Email</label>
            <input id="newsletter-email" type="email" name="email" placeholder="you@example.com" required>
            <button type="submit">Subscribe</button>
          </form>
          <p class="newsletter__feedback" data-newsletter-feedback aria-live="polite"></p>
        </div>
      </section>

      <section class="social-strip">
        <div class="shop-container social-strip__inner">
          <a href="https://github.com/NizarSH98" target="_blank" rel="noopener">GitHub</a>
          <a href="https://www.linkedin.com/in/nizarshehayeb" target="_blank" rel="noopener">LinkedIn</a>
          <a href="mailto:jabernizar98@gmail.com">Email</a>
        </div>
      </section>

      <footer class="shop-footer">
        <div class="shop-container shop-footer__grid">
          <div>
            <h3>Shop</h3>
            <a href="./collection.html">Collection</a>
            <a href="./brands.html">Shop by Brand</a>
            <a href="./search.html">Search</a>
            <a href="./cart.html">Cart</a>
          </div>
          <div>
            <h3>Support</h3>
            <a href="./contact.html">Contact</a>
            <a href="./privacy.html">Privacy Policy</a>
            <a href="./refund.html">Refund Policy</a>
            <a href="./terms.html">Terms of Service</a>
          </div>
          <div>
            <h3>Programs</h3>
            <a href="./rewards.html">Rewards</a>
            <a href="./rewards.html">Promotions</a>
          </div>
        </div>
      </footer>
    `;
  }

  function initCollectionPage() {
    hydrateBrandFilters();
    bindCollectionEvents();
    renderCollection();
  }

  function initProductPage() {
    const slot = document.querySelector('[data-product-slot]');
    if (!slot) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const product = state.products.find((item) => item.id === id) || state.products[0];

    if (!product) {
      slot.innerHTML = '<p>Product not found.</p>';
      return;
    }

    addRecentlyViewed(product.id);
    slot.innerHTML = renderProductDetails(product);

    const addButton = slot.querySelector('[data-add-product]');
    if (addButton) {
      addButton.addEventListener('click', () => {
        addToCart(product.id, 1);
      });
    }
  }

  function initCartPage() {
    const slot = document.querySelector('[data-cart-page-items]');
    if (!slot) return;
    renderCartItems(slot, true);
  }

  function initSearchPage() {
    const input = document.querySelector('[data-search-input]');
    const results = document.querySelector('[data-search-results]');
    if (!input || !results) return;

    const runSearch = () => {
      const q = input.value.trim().toLowerCase();
      const items = state.products.filter((product) => {
        const hay = `${product.title} ${product.brand} ${product.description || ''}`.toLowerCase();
        return hay.includes(q);
      });
      results.innerHTML = items.length
        ? items.map((item, index) => renderProductCard(item, index)).join('')
        : '<p>No matching products found.</p>';
    };

    input.addEventListener('input', runSearch);
    runSearch();
  }

  function initBrandPage() {
    const slot = document.querySelector('[data-brand-grid]');
    if (!slot) return;
    const brands = [...new Set(state.products.map((p) => p.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    slot.innerHTML = brands
      .map((brand) => {
        const count = state.products.filter((p) => p.brand === brand).length;
        return `<a class="brand-card" href="./collection.html?brand=${encodeURIComponent(brand)}"><strong>${escapeHtml(brand)}</strong><span>${count} products</span></a>`;
      })
      .join('');
  }

  function initCountdown() {
    const container = document.querySelector('[data-countdown]');
    const targetEl = document.querySelector('[data-countdown-value]');
    if (!container || !targetEl) return;

    const deadline = new Date(container.getAttribute('data-countdown-deadline')).getTime();
    if (Number.isNaN(deadline)) return;

    const tick = () => {
      const now = Date.now();
      const distance = Math.max(0, deadline - now);
      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      targetEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    tick();
    window.setInterval(tick, 1000);
  }

  function initDrawer() {
    const toggle = document.querySelector('[data-menu-toggle]');
    const closeBtn = document.querySelector('[data-menu-close]');
    const drawer = document.querySelector('[data-mobile-drawer]');
    if (!toggle || !closeBtn || !drawer) return;

    const close = () => {
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };

    const open = () => {
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    };

    toggle.addEventListener('click', () => {
      if (drawer.classList.contains('is-open')) close();
      else open();
    });

    closeBtn.addEventListener('click', close);
    drawer.addEventListener('click', (event) => {
      if (event.target === drawer) close();
    });
  }

  function initFilterAccordion() {
    document.querySelectorAll('[data-accordion]').forEach((group) => {
      const button = group.querySelector('.filter-group__toggle');
      if (!button) return;
      button.addEventListener('click', () => {
        const expanded = button.getAttribute('aria-expanded') === 'true';
        button.setAttribute('aria-expanded', String(!expanded));
        group.classList.toggle('is-collapsed', expanded);
      });
    });
  }

  function initNewsletterForm() {
    const form = document.querySelector('[data-newsletter-form]');
    const feedback = document.querySelector('[data-newsletter-feedback]');
    if (!form || !feedback) return;

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const email = String(formData.get('email') || '').trim();
      if (!email) return;
      localStorage.setItem(STORAGE_KEYS.newsletter, email);
      feedback.textContent = 'Thanks! You are subscribed.';
      form.reset();
    });
  }

  function renderCategoryNav() {
    const nav = document.querySelector('[data-category-nav]');
    if (!nav) return;
    nav.innerHTML = state.categories.map(renderCategoryNode).join('');
  }

  function renderCategoryNode(node) {
    if (!node.children || node.children.length === 0) {
      return `<a href="./collection.html?category=${encodeURIComponent(node.slug)}">${escapeHtml(node.label)}</a>`;
    }

    return `
      <details>
        <summary>${escapeHtml(node.label)}</summary>
        ${node.children.map(renderCategoryNode).join('')}
      </details>
    `;
  }

  function hydrateBrandFilters() {
    const brandSlot = document.querySelector('[data-brand-filters]');
    if (!brandSlot) return;

    const brands = [...new Set(state.products.map((p) => p.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    brandSlot.innerHTML = brands
      .map((brand) => `<label><input type="checkbox" name="brand" value="${escapeHtml(brand)}"> ${escapeHtml(brand)}</label>`)
      .join('');
  }

  function bindCollectionEvents() {
    const params = new URLSearchParams(window.location.search);
    const brandFromUrl = params.get('brand');
    if (brandFromUrl) {
      state.filters.brands.add(brandFromUrl);
      document.querySelectorAll('input[name="brand"]').forEach((input) => {
        if (input.value === brandFromUrl) input.checked = true;
      });
    }

    document.querySelectorAll('input[name="availability"]').forEach((input) => {
      input.addEventListener('change', () => {
        updateSetFromInputs('availability', state.filters.availability);
        state.page = 1;
        renderCollection();
      });
    });

    document.addEventListener('change', (event) => {
      if (event.target && event.target.matches('input[name="brand"]')) {
        updateSetFromInputs('brand', state.filters.brands);
        state.page = 1;
        renderCollection();
      }
    });

    const minInput = document.querySelector('[data-price-min]');
    const maxInput = document.querySelector('[data-price-max]');
    const sortInput = document.querySelector('[data-sort]');

    if (minInput) {
      minInput.addEventListener('input', () => {
        state.filters.minPrice = Number(minInput.value) || 0;
        state.page = 1;
        renderCollection();
      });
    }

    if (maxInput) {
      maxInput.addEventListener('input', () => {
        state.filters.maxPrice = Number(maxInput.value) || 0;
        state.page = 1;
        renderCollection();
      });
    }

    if (sortInput) {
      sortInput.addEventListener('change', () => {
        state.sort = sortInput.value;
        state.page = 1;
        renderCollection();
      });
    }

    document.querySelectorAll('[data-view]').forEach((button) => {
      button.addEventListener('click', () => {
        state.view = button.getAttribute('data-view');
        document.querySelectorAll('[data-view]').forEach((btn) => btn.classList.remove('is-active'));
        button.classList.add('is-active');
        renderCollection();
      });
    });

    const resetButton = document.querySelector('[data-reset-filters]');
    if (resetButton) {
      resetButton.addEventListener('click', () => {
        state.filters.availability.clear();
        state.filters.brands.clear();
        state.filters.minPrice = 0;
        state.filters.maxPrice = 80;
        const min = document.querySelector('[data-price-min]');
        const max = document.querySelector('[data-price-max]');
        if (min) min.value = '0';
        if (max) max.value = '80';
        document.querySelectorAll('input[name="availability"], input[name="brand"]').forEach((input) => {
          input.checked = false;
        });
        state.page = 1;
        renderCollection();
      });
    }
  }

  function updateSetFromInputs(name, targetSet) {
    targetSet.clear();
    document.querySelectorAll(`input[name="${name}"]:checked`).forEach((input) => targetSet.add(input.value));
  }

  function renderCollection() {
    const filtered = applyFilters(state.products);
    const sorted = applySorting(filtered);
    const totalPages = Math.max(1, Math.ceil(sorted.length / state.perPage));
    if (state.page > totalPages) state.page = totalPages;

    const start = (state.page - 1) * state.perPage;
    const pageItems = sorted.slice(start, start + state.perPage);

    const countEl = document.querySelector('[data-results-count]');
    if (countEl) countEl.textContent = `${sorted.length} product${sorted.length === 1 ? '' : 's'}`;

    const grid = document.querySelector('[data-product-grid]');
    if (grid) {
      grid.classList.toggle('is-list', state.view === 'list');
      grid.innerHTML = pageItems.map((product, index) => renderProductCard(product, index)).join('');
      if (!pageItems.length) grid.innerHTML = '<p>No products match your filters.</p>';
    }

    bindAddButtons();
    renderPagination(totalPages);
  }

  function applyFilters(products) {
    return products.filter((product) => {
      const resolvedPrice = getLowestPrice(product);
      const stockLabel = getStockLabel(product.stock);

      const availabilityMatch = state.filters.availability.size === 0 || state.filters.availability.has(stockLabel);
      const brandMatch = state.filters.brands.size === 0 || state.filters.brands.has(product.brand);

      const min = Math.min(state.filters.minPrice, state.filters.maxPrice);
      const max = Math.max(state.filters.minPrice, state.filters.maxPrice);
      const priceMatch = resolvedPrice >= min && resolvedPrice <= max;

      return availabilityMatch && brandMatch && priceMatch;
    });
  }

  function applySorting(products) {
    const copy = [...products];
    switch (state.sort) {
      case 'price-asc':
        return copy.sort((a, b) => getLowestPrice(a) - getLowestPrice(b));
      case 'price-desc':
        return copy.sort((a, b) => getLowestPrice(b) - getLowestPrice(a));
      case 'title-asc':
        return copy.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return copy;
    }
  }

  function renderPagination(totalPages) {
    const root = document.querySelector('[data-pagination]');
    if (!root) return;
    if (totalPages <= 1) {
      root.innerHTML = '';
      return;
    }

    root.innerHTML = '';
    for (let page = 1; page <= totalPages; page += 1) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = String(page);
      if (page === state.page) button.classList.add('is-active');
      button.addEventListener('click', () => {
        state.page = page;
        renderCollection();
      });
      root.appendChild(button);
    }
  }

  function renderProductCard(product, index) {
    const price = getLowestPrice(product);
    const compareAtPrice = Number(product.compareAtPrice) || null;
    const onSale = compareAtPrice && compareAtPrice > price;
    const offPercent = onSale ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0;
    const stock = getStockLabel(product.stock);
    const cta = getCTA(product, stock);

    return `
      <article class="product-card" style="animation-delay:${Math.min(index * 40, 240)}ms">
        <a class="product-card__media" href="./product.html?id=${encodeURIComponent(product.id)}">
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}" loading="lazy">
        </a>
        <div class="product-card__body">
          <div class="product-card__meta">
            <span class="product-card__brand">${escapeHtml(product.brand || 'Unbranded')}</span>
            ${onSale ? `<span class="badge-sale">-${offPercent}%</span>` : ''}
          </div>
          <h3><a href="./product.html?id=${encodeURIComponent(product.id)}">${escapeHtml(product.title)}</a></h3>
          ${product.description ? `<p class="product-card__desc">${escapeHtml(product.description)}</p>` : ''}
          <span class="product-card__stock product-card__stock--${stock}">${formatStockLabel(stock)}</span>
          <div class="product-card__pricing">
            <span class="price-current">${formatMoney(price)}</span>
            ${onSale ? `<span class="price-original">${formatMoney(compareAtPrice)}</span>` : ''}
          </div>
          <button class="product-card__cta product-card__cta--${cta.kind}" data-add-to-cart="${escapeHtml(product.id)}" ${cta.disabled ? 'disabled' : ''}>${cta.label}</button>
        </div>
      </article>
    `;
  }

  function renderProductDetails(product) {
    const price = getLowestPrice(product);
    const stock = getStockLabel(product.stock);
    const cta = getCTA(product, stock);
    const compareAtPrice = Number(product.compareAtPrice) || null;

    return `
      <article class="product-detail">
        <div class="product-detail__media"><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}"></div>
        <div class="product-detail__content">
          <p class="product-card__brand">${escapeHtml(product.brand || '')}</p>
          <h1>${escapeHtml(product.title)}</h1>
          <p>${escapeHtml(product.description || 'Product details coming soon.')}</p>
          <p class="product-card__stock product-card__stock--${stock}">${formatStockLabel(stock)}</p>
          <div class="product-card__pricing">
            <span class="price-current">${formatMoney(price)}</span>
            ${compareAtPrice && compareAtPrice > price ? `<span class="price-original">${formatMoney(compareAtPrice)}</span>` : ''}
          </div>
          <button data-add-product class="product-card__cta product-card__cta--${cta.kind}" ${cta.disabled ? 'disabled' : ''}>${cta.label}</button>
        </div>
      </article>
    `;
  }

  function bindAddButtons() {
    document.querySelectorAll('[data-add-to-cart]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.getAttribute('data-add-to-cart');
        if (!id) return;
        addToCart(id, 1);
      });
    });
  }

  function addToCart(productId, qty) {
    const cart = readStorage(STORAGE_KEYS.cart, []);
    const existing = cart.find((line) => line.productId === productId);
    if (existing) existing.qty += qty;
    else cart.push({ productId, qty });
    localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
    updateCartBadges();
    renderCartDrawer();
  }

  function renderCartDrawer() {
    const slot = document.querySelector('[data-cart-drawer-items]');
    if (!slot) return;
    renderCartItems(slot, false);
  }

  function renderCartItems(slot, fullPage) {
    const cart = readStorage(STORAGE_KEYS.cart, []);
    const lines = cart.map((line) => {
      const product = state.products.find((item) => item.id === line.productId);
      if (!product) return null;
      const price = getLowestPrice(product);
      return {
        ...line,
        product,
        lineTotal: price * line.qty,
      };
    }).filter(Boolean);

    const subtotal = lines.reduce((acc, line) => acc + line.lineTotal, 0);

    if (!lines.length) {
      slot.innerHTML = '<p>Your cart is empty.</p>';
    } else {
      slot.innerHTML = lines.map((line) => `
        <article class="cart-line">
          <img src="${escapeHtml(line.product.image)}" alt="${escapeHtml(line.product.title)}">
          <div>
            <h3>${escapeHtml(line.product.title)}</h3>
            <p>${line.qty} × ${formatMoney(getLowestPrice(line.product))}</p>
          </div>
          <strong>${formatMoney(line.lineTotal)}</strong>
        </article>
      `).join('');
    }

    document.querySelectorAll('[data-cart-subtotal]').forEach((el) => {
      el.textContent = formatMoney(subtotal);
    });

    renderShippingProgress(subtotal);

    if (fullPage) {
      const sum = document.querySelector('[data-cart-page-summary]');
      if (sum) sum.textContent = formatMoney(subtotal);
    }
  }

  function renderShippingProgress(subtotal) {
    const threshold = 75;
    const remain = Math.max(0, threshold - subtotal);
    const percent = Math.min(100, Math.round((subtotal / threshold) * 100));

    document.querySelectorAll('[data-shipping-message]').forEach((el) => {
      el.textContent = remain > 0
        ? `${formatMoney(remain)} away from free delivery.`
        : 'You unlocked free delivery.';
    });

    document.querySelectorAll('[data-shipping-progress-bar]').forEach((bar) => {
      bar.style.width = `${percent}%`;
    });
  }

  function openCartDrawer() {
    const drawer = document.querySelector('[data-cart-drawer]');
    if (!drawer) return;
    renderCartDrawer();
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
  }

  function closeCartDrawer() {
    const drawer = document.querySelector('[data-cart-drawer]');
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
  }

  function updateCartBadges() {
    const cart = readStorage(STORAGE_KEYS.cart, []);
    const count = cart.reduce((acc, line) => acc + (Number(line.qty) || 0), 0);
    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.textContent = String(count);
    });
    renderCartDrawer();
  }

  function addRecentlyViewed(productId) {
    const list = readStorage(STORAGE_KEYS.recent, []);
    const next = [productId, ...list.filter((id) => id !== productId)].slice(0, 8);
    localStorage.setItem(STORAGE_KEYS.recent, JSON.stringify(next));
  }

  function renderRecentlyViewed() {
    const slot = document.querySelector('[data-recently-viewed]');
    if (!slot) return;
    const list = readStorage(STORAGE_KEYS.recent, []);
    const products = list
      .map((id) => state.products.find((p) => p.id === id))
      .filter(Boolean)
      .slice(0, 4);

    if (!products.length) {
      slot.innerHTML = '<p>No recently viewed products yet.</p>';
      return;
    }

    slot.innerHTML = `<div class="product-grid product-grid--recent">${products.map((p, i) => renderProductCard(p, i)).join('')}</div>`;
    bindAddButtons();
  }

  function readStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return Array.isArray(fallback) ? (Array.isArray(parsed) ? parsed : fallback) : parsed;
    } catch (error) {
      return fallback;
    }
  }

  function getLowestPrice(product) {
    if (product.hasVariants && Array.isArray(product.variants) && product.variants.length) {
      const prices = product.variants.map((variant) => Number(variant.price)).filter((value) => Number.isFinite(value));
      if (prices.length) return Math.min(...prices);
    }
    return Number(product.price) || 0;
  }

  function getStockLabel(stock) {
    const qty = Number(stock) || 0;
    if (qty <= 0) return 'sold-out';
    if (qty <= 5) return 'low-stock';
    return 'in-stock';
  }

  function getCTA(product, stockLabel) {
    if (stockLabel === 'sold-out') return { label: 'Sold out', kind: 'sold', disabled: true };
    if (product.hasVariants) return { label: 'Choose options', kind: 'options', disabled: false };
    return { label: 'Add to Bag', kind: 'add', disabled: false };
  }

  function formatStockLabel(value) {
    if (value === 'low-stock') return 'Low stock';
    if (value === 'sold-out') return 'Sold out';
    return 'In stock';
  }

  function formatMoney(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})();
