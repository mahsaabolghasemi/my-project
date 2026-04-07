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
    if (typeof window.cart === 'undefined' || !window.cart.getItems) return false;
    const items = window.cart.getItems();
    return items.some((item) => item.id === bookId);
  }

  function renderBook(book) {
    const price = typeof formatPrice === 'function' ? formatPrice(book.price, 'تومان') : book.price.toFixed(2);
    const inCart = isInCart(book.id);
    const priceDisplay = book.price === 0 ? '<span class="book-price-free">رایگان</span>' : price;
    const stockNum = book.stock != null && book.stock !== '' ? Number(book.stock) : null;
    const stockLine =
      stockNum != null && Number.isFinite(stockNum)
        ? `<p class="pdp-stock">موجودی: ${escapeHtml(String(stockNum))} عدد</p>`
        : '';
    const outOfStock = stockNum != null && stockNum <= 0;
    const addDisabled = outOfStock;
    const outOfStockLabel = 'اتمام موجودی';

    return `
      <div class="pdp-container">
        <div class="pdp-image-section">
          <img src="${escapeHtml(book.coverImage)}" alt="${escapeHtml(book.title)}" class="pdp-image" />
        </div>
        <div class="pdp-info-section">
          <h1 class="pdp-title">${escapeHtml(book.title)}</h1>
          <p class="pdp-author">نویسنده: ${escapeHtml(book.author)}</p>
          <div class="pdp-genre">${escapeHtml(book.genre)}</div>
          <div class="pdp-price">${priceDisplay}</div>
          ${stockLine}
          <div class="pdp-description">
            <h2>دربارهٔ این کتاب</h2>
            <p>${escapeHtml(book.description || 'توضیحی موجود نیست.')}</p>
          </div>
          <div class="pdp-actions">
            ${inCart
              ? `<button type="button" class="btn btn--danger btn-remove" data-book-id="${escapeHtml(book.id)}">حذف از سبد</button>`
              : `<button type="button" class="btn btn--primary btn-add" data-book-id="${escapeHtml(book.id)}" ${addDisabled ? 'disabled' : ''}>${outOfStock ? outOfStockLabel : 'افزودن به سبد'}</button>`
            }
            <p class="pdp-note">📚 کتاب الکترونیکی (PDF)</p>
          </div>
        </div>
      </div>
    `;
  }

  function showLoading() {
    rootEl.innerHTML = '<p class="empty-state">در حال بارگذاری جزئیات کتاب…</p>';
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

    if (addBtn && !addBtn.disabled) {
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

  function isLoggedIn() {
    return typeof userState !== 'undefined' && userState.isLoggedIn && userState.isLoggedIn();
  }

  function handleAddToCart(bookId) {
    if (!isLoggedIn()) {
      window.location.href =
        'login.html?return=' + encodeURIComponent('pdp.html?id=' + encodeURIComponent(bookId));
      return;
    }

    if (typeof mockApi === 'undefined' || !mockApi.getBookById) {
      alert('افزودن به سبد ممکن نشد. دوباره تلاش کنید.');
      return;
    }

    mockApi.getBookById(bookId).then(function (book) {
      if (!book) {
        alert('کتاب یافت نشد.');
        return;
      }

      const st = book.stock != null && book.stock !== '' ? Number(book.stock) : null;
      if (st != null && Number.isFinite(st) && st <= 0) {
        alert('این محصول ناموجود است.');
        return;
      }

      if (typeof window.cart === 'undefined' || !window.cart.getItems || !window.cart.add) {
        alert('سبد خرید در دسترس نیست.');
        return;
      }

      var cartItems = window.cart.getItems();
      var line = cartItems.find(function (i) {
        return String(i.id) === String(book.id);
      });
      var curQty = line ? line.quantity : 0;
      if (st != null && Number.isFinite(st) && curQty + 1 > st) {
        alert('تعداد درخواستی بیشتر از موجودی انبار است.');
        return;
      }

      window.cart.add(book, 1).then(function () {
        if (typeof header !== 'undefined' && header.updateBadge) {
          header.updateBadge();
        }
        window.location.href = 'cart.html';
      }).catch(function (err) {
        alert(err && err.message ? err.message : 'افزودن به سبد ناموفق بود.');
      });
    });
  }

  function handleRemoveFromCart(bookId) {
    if (!isLoggedIn()) {
      window.location.href =
        'login.html?return=' + encodeURIComponent('pdp.html?id=' + encodeURIComponent(bookId));
      return;
    }

    if (typeof window.cart === 'undefined' || !window.cart.remove) {
      alert('سبد خرید در دسترس نیست.');
      return;
    }

    window.cart.remove(bookId).then(function () {
      if (typeof header !== 'undefined' && header.updateBadge) {
        header.updateBadge();
      }
      if (typeof mockApi !== 'undefined' && mockApi.getBookById) {
        mockApi.getBookById(bookId).then(function (book) {
          if (book) showBook(book);
        });
      }
    }).catch(function (err) {
      alert(err && err.message ? err.message : 'به‌روزرسانی سبد ناموفق بود.');
    });
  }

  // Load book
  const bookId = getBookId();
  if (!bookId) {
    showError('شناسهٔ کتاب مشخص نیست. از صفحهٔ اصلی یک کتاب انتخاب کنید.');
    return;
  }

  showLoading();

  if (typeof mockApi === 'undefined' || !mockApi.getBookById) {
    showError('API در دسترس نیست.');
    return;
  }

  mockApi.getBookById(bookId).then(function (book) {
    if (!book) {
      showError('این کالا وجود ندارد یا حذف شده است. (۴۰۴)');
      return;
    }
    if (Number(book.isDeleted) === 1) {
      showError('این کالا وجود ندارد یا حذف شده است. (۴۰۴)');
      return;
    }
    showBook(book);
  }).catch(function (err) {
    showError('بارگذاری جزئیات کتاب ناموفق بود. دوباره تلاش کنید.');
    console.error(err);
  });
})();
