/**
 * PLP (Product Listing Page): search results.
 * Reads ?q= query param and shows matching books.
 */
(function () {
  const gridEl = document.getElementById('product-grid');
  const titleEl = document.getElementById('page-title');
  if (!gridEl) return;

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function getQuery() {
    var params = new URLSearchParams(window.location.search);
    return params.get('q');
  }

  function renderBook(book) {
    const price = typeof formatPrice === 'function' && window.formatPrice
      ? window.formatPrice(book.price, 'تومان')
      : book.price.toFixed(2);
    const priceDisplay = book.price === 0 ? '<span class="book-price-free">رایگان</span>' : price;
    
    return `
      <article class="product-card">
        <a href="pdp.html?id=${encodeURIComponent(book.id)}" class="product-card__link">
          <img class="product-card__image" src="${escapeHtml(book.coverImage)}" alt="${escapeHtml(book.title)}" loading="lazy" />
          <div class="product-card__body">
            <h2 class="product-card__name">${escapeHtml(book.title)}</h2>
            <p class="product-card__body-meta">${escapeHtml(book.author)}</p>
            <p class="product-card__price">${priceDisplay}</p>
          </div>
        </a>
      </article>
    `;
  }

  function showLoading() {
    gridEl.innerHTML = '<p class="empty-state">در حال جستجو…</p>';
  }

  function showError(message) {
    gridEl.innerHTML = '<p class="empty-state">' + escapeHtml(message) + '</p>';
  }

  function showBooks(books, query) {
    if (!books || books.length === 0) {
      const queryText = query ? ` برای «${escapeHtml(query)}»` : '';
      gridEl.innerHTML = `
        <div class="empty-state">
          <p>کتابی یافت نشد${queryText}.</p>
          <a href="index.html" class="btn btn--primary">مشاهدهٔ همهٔ کتاب‌ها</a>
        </div>
      `;
      if (titleEl) {
        titleEl.textContent = query ? `نتیجهٔ جستجو برای «${escapeHtml(query)}»` : 'نتیجهٔ جستجو';
      }
      return;
    }

    gridEl.innerHTML = books.map(renderBook).join('');
    
    if (titleEl) {
      const count = books.length;
      titleEl.textContent = query
        ? `نتیجهٔ جستجو برای «${escapeHtml(query)}» (${count} کتاب)`
        : `همهٔ کتاب‌ها (${count})`;
    }
  }

  // Get search query
  const query = getQuery();
  
  showLoading();

  if (typeof mockApi === 'undefined' || !mockApi.searchBooks) {
    showError('جستجو در دسترس نیست.');
    return;
  }

  mockApi.searchBooks(query).then(function (books) {
    showBooks(books, query);
  }).catch(function (err) {
    showError('جستجو ناموفق بود. دوباره تلاش کنید.');
    console.error(err);
  });
})();
