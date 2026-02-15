/**
 * PDP (Product Detail Page): book detail with add/remove to cart.
 * Shows book image, title, author, price, description, and add/remove buttons.
 * For digital books, quantity is always 1.
 */
(function () {
  const rootEl = document.getElementById('pdp-root');
  if (!rootEl) return;

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function getBookId() {
    return typeof getQueryParam === 'function' ? getQueryParam('id') : null;
  }

  function isInCart(bookId) {
    if (typeof cart === 'undefined' || !cart.getItems) return false;
    const items = cart.getItems();
    return items.some((item) => item.id === bookId);
  }

  function renderBook(book) {
    const price = typeof formatPrice === 'function' ? formatPrice(book.price, '€') : book.price.toFixed(2);
    const inCart = isInCart(book.id);
    const priceDisplay = book.price === 0 ? '<span class="book-price-free">FREE</span>' : price;

    return `
      <div class="pdp-container">
        <div class="pdp-image-section">
          <img src="${escapeHtml(book.coverImage)}" alt="${escapeHtml(book.title)}" class="pdp-image" />
        </div>
        <div class="pdp-info-section">
          <h1 class="pdp-title">${escapeHtml(book.title)}</h1>
          <p class="pdp-author">by ${escapeHtml(book.author)}</p>
          <div class="pdp-genre">${escapeHtml(book.genre)}</div>
          <div class="pdp-price">${priceDisplay}</div>
          <div class="pdp-description">
            <h2>About this book</h2>
            <p>${escapeHtml(book.description || 'No description available.')}</p>
          </div>
          <div class="pdp-actions">
            ${inCart
              ? `<button class="btn btn--danger btn-remove" data-book-id="${escapeHtml(book.id)}">Remove from Cart</button>`
              : `<button class="btn btn--primary btn-add" data-book-id="${escapeHtml(book.id)}">Add to Cart</button>`
            }
            <p class="pdp-note">📚 Digital book (PDF) - Quantity: 1</p>
          </div>
        </div>
      </div>
    `;
  }

  function showLoading() {
    rootEl.innerHTML = '<p class="empty-state">Loading book details…</p>';
  }

  function showError(message) {
    rootEl.innerHTML = '<p class="empty-state">' + escapeHtml(message) + '</p>';
  }

  function showBook(book) {
    rootEl.innerHTML = renderBook(book);
    attachEventListeners();
  }

  function attachEventListeners() {
    const addBtn = rootEl.querySelector('.btn-add');
    const removeBtn = rootEl.querySelector('.btn-remove');

    if (addBtn) {
      addBtn.addEventListener('click', function () {
        const bookId = addBtn.getAttribute('data-book-id');
        handleAddToCart(bookId);
      });
    }

    if (removeBtn) {
      removeBtn.addEventListener('click', function () {
        const bookId = removeBtn.getAttribute('data-book-id');
        handleRemoveFromCart(bookId);
      });
    }
  }

  function handleAddToCart(bookId) {
    if (typeof mockApi === 'undefined' || !mockApi.getBookById) {
      alert('Unable to add to cart. Please try again.');
      return;
    }

    mockApi.getBookById(bookId).then(function (book) {
      if (!book) {
        alert('Book not found.');
        return;
      }

      if (typeof cart === 'undefined' || !cart.add) {
        alert('Cart is not available.');
        return;
      }

      cart.add(book, 1);
      
      // Update header badge
      if (typeof header !== 'undefined' && header.updateBadge) {
        header.updateBadge();
      }

      // Re-render to show "Remove" button
      showBook(book);
    });
  }

  function handleRemoveFromCart(bookId) {
    if (typeof cart === 'undefined' || !cart.remove) {
      alert('Cart is not available.');
      return;
    }

    cart.remove(bookId);

    // Update header badge
    if (typeof header !== 'undefined' && header.updateBadge) {
      header.updateBadge();
    }

    // Re-fetch book to re-render with "Add" button
    if (typeof mockApi !== 'undefined' && mockApi.getBookById) {
      mockApi.getBookById(bookId).then(function (book) {
        if (book) showBook(book);
      });
    }
  }

  // Load book
  const bookId = getBookId();
  if (!bookId) {
    showError('No book ID provided. Please select a book from the home page.');
    return;
  }

  showLoading();

  if (typeof mockApi === 'undefined' || !mockApi.getBookById) {
    showError('API not available.');
    return;
  }

  mockApi.getBookById(bookId).then(function (book) {
    if (!book) {
      showError('Book not found.');
      return;
    }
    showBook(book);
  }).catch(function (err) {
    showError('Failed to load book details. Please try again.');
    console.error(err);
  });
})();
