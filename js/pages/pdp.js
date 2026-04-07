/**
 * PDP (Product Detail Page): book detail with quantity counter for add-to-cart.
 */
(function () {
  const rootEl = document.getElementById('pdp-root');
  if (!rootEl) return;

  var currentBookData = null;

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function getBookId() {
    return typeof getQueryParam === 'function' ? getQueryParam('id') : null;
  }

  function getCartQty(bookId) {
    if (typeof window.cart === 'undefined' || !window.cart.getItems) return 0;
    var line = window.cart.getItems().find(function (i) { return i.id === bookId; });
    return line ? line.quantity : 0;
  }

  function renderBook(book) {
    var price = typeof formatPrice === 'function' ? formatPrice(book.price, 'تومان') : book.price.toFixed(2);
    var priceDisplay = book.price === 0 ? '<span class="book-price-free">رایگان</span>' : price;
    var stockNum = book.stock != null && book.stock !== '' ? Number(book.stock) : null;
    var stockLine =
      stockNum != null && Number.isFinite(stockNum)
        ? '<p class="pdp-stock">موجودی: ' + escapeHtml(String(stockNum)) + ' عدد</p>'
        : '';
    var outOfStock = stockNum != null && stockNum <= 0;
    var cartQty = getCartQty(book.id);
    var maxStock = stockNum != null && Number.isFinite(stockNum) ? stockNum : Number.MAX_SAFE_INTEGER;

    var actionsHtml;
    if (outOfStock) {
      actionsHtml = '<button type="button" class="btn btn--primary" disabled>اتمام موجودی</button>';
    } else if (cartQty > 0) {
      actionsHtml =
        '<div class="pdp-qty-control" role="group" aria-label="تعداد در سبد">' +
          '<button type="button" class="btn btn--secondary btn--sm pdp-qty__btn pdp-qty__minus" data-book-id="' + escapeHtml(book.id) + '" aria-label="کم کردن">' +
            (cartQty === 1 ? '🗑' : '−') +
          '</button>' +
          '<span class="pdp-qty__value" aria-live="polite">' + cartQty + '</span>' +
          '<button type="button" class="btn btn--secondary btn--sm pdp-qty__btn pdp-qty__plus" data-book-id="' + escapeHtml(book.id) + '" aria-label="افزودن"' +
            (cartQty >= maxStock ? ' disabled' : '') +
          '>+</button>' +
        '</div>' +
        '<button type="button" class="btn btn--danger btn--sm btn-remove-all" data-book-id="' + escapeHtml(book.id) + '">حذف کامل از سبد</button>';
    } else {
      actionsHtml =
        '<div class="pdp-qty-control" role="group" aria-label="انتخاب تعداد">' +
          '<button type="button" class="btn btn--secondary btn--sm pdp-qty__btn pdp-qty__minus-initial" aria-label="کم کردن" disabled>−</button>' +
          '<span class="pdp-qty__value pdp-qty__initial-value" aria-live="polite">1</span>' +
          '<button type="button" class="btn btn--secondary btn--sm pdp-qty__btn pdp-qty__plus-initial" aria-label="افزودن"' +
            (1 >= maxStock ? ' disabled' : '') +
          '>+</button>' +
        '</div>' +
        '<button type="button" class="btn btn--primary btn-add" data-book-id="' + escapeHtml(book.id) + '">افزودن به سبد</button>';
    }

    return '' +
      '<div class="pdp-container">' +
        '<div class="pdp-image-section">' +
          '<img src="' + escapeHtml(book.coverImage) + '" alt="' + escapeHtml(book.title) + '" class="pdp-image" />' +
        '</div>' +
        '<div class="pdp-info-section">' +
          '<h1 class="pdp-title">' + escapeHtml(book.title) + '</h1>' +
          '<p class="pdp-author">نویسنده: ' + escapeHtml(book.author) + '</p>' +
          '<div class="pdp-genre">' + escapeHtml(book.genre) + '</div>' +
          '<div class="pdp-price">' + priceDisplay + '</div>' +
          stockLine +
          '<div class="pdp-description">' +
            '<h2>دربارهٔ این کتاب</h2>' +
            '<p>' + escapeHtml(book.description || 'توضیحی موجود نیست.') + '</p>' +
          '</div>' +
          '<div class="pdp-actions">' +
            actionsHtml +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function showLoading() {
    rootEl.innerHTML = '<p class="empty-state">در حال بارگذاری جزئیات کتاب…</p>';
  }

  function showError(message) {
    rootEl.innerHTML = '<p class="empty-state">' + escapeHtml(message) + '</p>';
  }

  function refreshView() {
    if (!currentBookData) return;
    rootEl.innerHTML = renderBook(currentBookData);
    attachEventListeners();
  }

  function attachEventListeners() {
    var initialQty = 1;
    var stockNum = currentBookData && currentBookData.stock != null && currentBookData.stock !== ''
      ? Number(currentBookData.stock) : Number.MAX_SAFE_INTEGER;
    var maxStock = Number.isFinite(stockNum) && stockNum >= 0 ? stockNum : Number.MAX_SAFE_INTEGER;

    var minusInitial = rootEl.querySelector('.pdp-qty__minus-initial');
    var plusInitial = rootEl.querySelector('.pdp-qty__plus-initial');
    var initialValueEl = rootEl.querySelector('.pdp-qty__initial-value');

    if (minusInitial && plusInitial && initialValueEl) {
      plusInitial.addEventListener('click', function () {
        if (initialQty < maxStock) {
          initialQty++;
          initialValueEl.textContent = initialQty;
          minusInitial.disabled = false;
          if (initialQty >= maxStock) plusInitial.disabled = true;
        }
      });
      minusInitial.addEventListener('click', function () {
        if (initialQty > 1) {
          initialQty--;
          initialValueEl.textContent = initialQty;
          plusInitial.disabled = (initialQty >= maxStock);
          if (initialQty <= 1) minusInitial.disabled = true;
        }
      });
    }

    var addBtn = rootEl.querySelector('.btn-add');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        var qty = initialValueEl ? parseInt(initialValueEl.textContent, 10) || 1 : 1;
        handleAddToCart(addBtn.getAttribute('data-book-id'), qty);
      });
    }

    var minusBtn = rootEl.querySelector('.pdp-qty__minus');
    if (minusBtn) {
      minusBtn.addEventListener('click', function () {
        handleDecrease(minusBtn.getAttribute('data-book-id'));
      });
    }

    var plusBtn = rootEl.querySelector('.pdp-qty__plus');
    if (plusBtn && !plusBtn.disabled) {
      plusBtn.addEventListener('click', function () {
        handleIncrease(plusBtn.getAttribute('data-book-id'));
      });
    }

    var removeAllBtn = rootEl.querySelector('.btn-remove-all');
    if (removeAllBtn) {
      removeAllBtn.addEventListener('click', function () {
        handleRemoveAll(removeAllBtn.getAttribute('data-book-id'));
      });
    }
  }

  function isLoggedIn() {
    return typeof userState !== 'undefined' && userState.isLoggedIn && userState.isLoggedIn();
  }

  function updateBadge() {
    if (typeof header !== 'undefined' && header.updateBadge) header.updateBadge();
  }

  function handleAddToCart(bookId, qty) {
    if (!isLoggedIn()) {
      window.location.href =
        'login.html?return=' + encodeURIComponent('pdp.html?id=' + encodeURIComponent(bookId));
      return;
    }

    if (!currentBookData) {
      alert('کتاب بارگذاری نشده است.');
      return;
    }

    if (typeof window.cart === 'undefined' || !window.cart.add) {
      alert('سبد خرید در دسترس نیست.');
      return;
    }

    window.cart.add(currentBookData, qty).then(function () {
      updateBadge();
      refreshView();
    }).catch(function (err) {
      alert(err && err.message ? err.message : 'افزودن به سبد ناموفق بود.');
    });
  }

  function handleIncrease(bookId) {
    if (!isLoggedIn()) return;
    if (typeof window.cart === 'undefined' || !window.cart.incrementQuantity) return;
    window.cart.incrementQuantity(bookId).then(function () {
      updateBadge();
      refreshView();
    }).catch(function (err) {
      alert(err && err.message ? err.message : 'موجودی کافی نیست.');
    });
  }

  function handleDecrease(bookId) {
    if (!isLoggedIn()) return;
    if (typeof window.cart === 'undefined' || !window.cart.remove) return;
    window.cart.remove(bookId).then(function () {
      updateBadge();
      refreshView();
    }).catch(function (err) {
      alert(err && err.message ? err.message : 'به‌روزرسانی سبد ناموفق بود.');
    });
  }

  function handleRemoveAll(bookId) {
    if (!isLoggedIn()) return;
    if (typeof window.cart === 'undefined' || !window.cart.removeLine) return;
    window.cart.removeLine(bookId).then(function () {
      updateBadge();
      refreshView();
    }).catch(function (err) {
      alert(err && err.message ? err.message : 'حذف ناموفق بود.');
    });
  }

  var bookId = getBookId();
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
    currentBookData = book;
    refreshView();
  }).catch(function (err) {
    showError('بارگذاری جزئیات کتاب ناموفق بود. دوباره تلاش کنید.');
    console.error(err);
  });
})();
