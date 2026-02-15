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
    return typeof getQueryParam === 'function' ? getQueryParam('q') : null;
  }

  function renderBook(book) {
    const price = typeof formatPrice === 'function' && window.formatPrice
      ? window.formatPrice(book.price, '€')
      : book.price.toFixed(2);
    const priceDisplay = book.price === 0 ? '<span class="book-price-free">FREE</span>' : price;
    
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
    gridEl.innerHTML = '<p class="empty-state">Searching books…</p>';
  }

  function showError(message) {
    gridEl.innerHTML = '<p class="empty-state">' + escapeHtml(message) + '</p>';
  }

  function showBooks(books, query) {
    if (!books || books.length === 0) {
      const queryText = query ? ` for "${escapeHtml(query)}"` : '';
      gridEl.innerHTML = `
        <div class="empty-state">
          <p>No books found${queryText}.</p>
          <a href="index.html" class="btn btn--primary">Browse All Books</a>
        </div>
      `;
      if (titleEl) {
        titleEl.textContent = query ? `Search results for "${escapeHtml(query)}"` : 'Search results';
      }
      return;
    }

    gridEl.innerHTML = books.map(renderBook).join('');
    
    if (titleEl) {
      const count = books.length;
      titleEl.textContent = query
        ? `Search results for "${escapeHtml(query)}" (${count} ${count === 1 ? 'book' : 'books'})`
        : `All Books (${count})`;
    }
  }

  // Get search query
  const query = getQuery();
  
  showLoading();

  if (typeof mockApi === 'undefined' || !mockApi.searchBooks) {
    showError('Search is not available.');
    return;
  }

  mockApi.searchBooks(query).then(function (books) {
    showBooks(books, query);
  }).catch(function (err) {
    showError('Failed to search books. Please try again.');
    console.error(err);
  });
})();
