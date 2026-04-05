/**
 * Home page: fetch list of books and render book grid.
 * Header is mounted by header.js (loaded in HTML).
 */
(function () {
  const gridEl = document.getElementById('product-grid');
  const titleEl = document.getElementById('page-title');
  if (!gridEl) return;

  const productGrid = gridEl;

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function renderBook(book) {
    const price = typeof formatPrice === 'function' ? formatPrice(book.price, 'تومان') : book.price.toFixed(2);
    return `
      <article class="product-card">
        <a href="pdp.html?id=${encodeURIComponent(book.id)}" class="product-card__link">
          <img class="product-card__image" src="${escapeHtml(book.coverImage)}" alt="${escapeHtml(book.title)}" loading="lazy" />
          <div class="product-card__body">
            <h2 class="product-card__name">${escapeHtml(book.title)}</h2>
            <p class="product-card__body-meta">${escapeHtml(book.author)}</p>
            <p class="product-card__price">${price}</p>
          </div>
        </a>
      </article>
    `;
  }

  function showLoading() {
    productGrid.innerHTML = '<p class="empty-state">در حال بارگذاری کتاب‌ها…</p>';
  }

  function showError(message) {
    productGrid.innerHTML = '<p class="empty-state">' + escapeHtml(message) + '</p>';
  }

  function showBooks(books) {
    if (!books.length) {
      productGrid.innerHTML = '<p class="empty-state">کتابی یافت نشد.</p>';
      return;
    }
    productGrid.innerHTML = books.map(renderBook).join('');
  }

  showLoading();

  if (typeof mockApi === 'undefined') {
    showError('API در دسترس نیست.');
    return;
  }

  mockApi.getBooks().then(showBooks).catch(function (err) {
    showError('بارگذاری کتاب‌ها ناموفق بود. دوباره تلاش کنید.');
    console.error(err);
  });
})();
