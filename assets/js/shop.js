(function () {
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
    initCountdown();
    initDrawer();
    initFilterAccordion();

    const appRoot = document.querySelector('[data-collection-app]');
    if (!appRoot) return;

    const [products, categories] = await Promise.all([
      fetch('../data/shop-products.json').then((r) => r.json()),
      fetch('../data/shop-categories.json').then((r) => r.json()),
    ]);

    state.products = Array.isArray(products) ? products : [];
    state.categories = Array.isArray(categories) ? categories : [];

    hydrateBrandFilters();
    renderCategoryNav();
    bindCollectionEvents();
    renderCollection();
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
    if (countEl) {
      countEl.textContent = `${sorted.length} product${sorted.length === 1 ? '' : 's'}`;
    }

    const grid = document.querySelector('[data-product-grid]');
    if (grid) {
      grid.classList.toggle('is-list', state.view === 'list');
      grid.innerHTML = pageItems.map((product, index) => renderProductCard(product, index)).join('');
      if (!pageItems.length) {
        grid.innerHTML = '<p>No products match your filters.</p>';
      }
    }

    renderPagination(totalPages);
  }

  function applyFilters(products) {
    return products.filter((product) => {
      const resolvedPrice = getLowestPrice(product);
      const stockLabel = getStockLabel(product.stock);

      const availabilityMatch =
        state.filters.availability.size === 0 || state.filters.availability.has(stockLabel);

      const brandMatch =
        state.filters.brands.size === 0 || state.filters.brands.has(product.brand);

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
      case 'featured':
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
        <div class="product-card__media">
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}" loading="lazy">
        </div>
        <div class="product-card__body">
          <div class="product-card__meta">
            <span class="product-card__brand">${escapeHtml(product.brand || 'Unbranded')}</span>
            ${onSale ? `<span class="badge-sale">-${offPercent}%</span>` : ''}
          </div>
          <h3>${escapeHtml(product.title)}</h3>
          ${product.description ? `<p class="product-card__desc">${escapeHtml(product.description)}</p>` : ''}
          <span class="product-card__stock product-card__stock--${stock}">${formatStockLabel(stock)}</span>
          <div class="product-card__pricing">
            <span class="price-current">${formatMoney(price)}</span>
            ${onSale ? `<span class="price-original">${formatMoney(compareAtPrice)}</span>` : ''}
          </div>
          <button class="product-card__cta product-card__cta--${cta.kind}" ${cta.disabled ? 'disabled' : ''}>${cta.label}</button>
        </div>
      </article>
    `;
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
