/**
 * Cart page: +/- ، حذف کامل، سقف موجودی
 */
(function () {
  const rootEl = document.getElementById('cart-root');
  if (!rootEl) return;

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatPrice(value) {
    return typeof window.formatPrice === 'function'
      ? window.formatPrice(value, 'تومان')
      : value.toFixed(2);
  }

  function stockLabel(item) {
    if (item.stock == null || item.stock === '') return '';
    return `<p class="cart-item__stock">موجودی انبار: ${escapeHtml(String(item.stock))}</p>`;
  }

  function renderCartItem(item) {
    const price = formatPrice(item.price);
    const total = formatPrice(item.price * item.quantity);
    const max =
      item.stock != null && item.stock !== '' && Number.isFinite(Number(item.stock))
        ? Number(item.stock)
        : Number.POSITIVE_INFINITY;
    const atMax = item.quantity >= max;
    return `
      <div class="cart-item" data-item-id="${escapeHtml(item.id)}">
        <div class="cart-item__image">
          ${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" />` : '<div class="cart-item__placeholder">📚</div>'}
        </div>
        <div class="cart-item__info">
          <h3 class="cart-item__name">${escapeHtml(item.name)}</h3>
          <p class="cart-item__price">${price} × ${item.quantity} = <strong>${total}</strong></p>
          ${stockLabel(item)}
        </div>
        <div class="cart-item__qty" role="group" aria-label="تعداد">
          <button type="button" class="btn btn--secondary btn--sm cart-qty__btn cart-qty__minus" data-item-id="${escapeHtml(item.id)}" aria-label="کم کردن">−</button>
          <span class="cart-qty__value" aria-live="polite">${item.quantity}</span>
          <button type="button" class="btn btn--secondary btn--sm cart-qty__btn cart-qty__plus" data-item-id="${escapeHtml(item.id)}" aria-label="افزودن" ${atMax ? 'disabled' : ''}>+</button>
        </div>
        <div class="cart-item__actions">
          <button type="button" class="btn btn--danger btn--sm btn-remove-line" data-item-id="${escapeHtml(item.id)}">حذف</button>
        </div>
      </div>
    `;
  }

  function renderCart(items) {
    if (!items || items.length === 0) {
      rootEl.innerHTML = `
        <div class="empty-state">
          <p>سبد خرید شما خالی است.</p>
          <a href="index.html" class="btn btn--primary">مشاهدهٔ کتاب‌ها</a>
        </div>
      `;
      return;
    }

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const formattedSubtotal = formatPrice(subtotal);

    rootEl.innerHTML = `
      <div class="cart-items">
        ${items.map(renderCartItem).join('')}
      </div>
      <div class="cart-summary">
        <div class="cart-summary__row">
          <span>جمع جزء:</span>
          <strong>${formattedSubtotal}</strong>
        </div>
        <div class="cart-summary__row cart-summary__total">
          <span>مبلغ قابل پرداخت:</span>
          <strong class="cart-total">${formattedSubtotal}</strong>
        </div>
        <a href="payment.html" class="btn btn--primary btn-continue">ادامه به پرداخت</a>
      </div>
    `;

    attachEventListeners();
  }

  function attachEventListeners() {
    rootEl.querySelectorAll('.cart-qty__minus').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const id = btn.getAttribute('data-item-id');
        if (!id || typeof cart === 'undefined' || !cart.remove) return;
        cart.remove(id).then(function () {
          if (window.header && header.updateBadge) header.updateBadge();
          loadAndRender();
        }).catch(function (err) {
          alert(err && err.message ? err.message : 'به‌روزرسانی سبد ناموفق بود.');
        });
      });
    });

    rootEl.querySelectorAll('.cart-qty__plus').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.disabled) {
          alert('به حداکثر موجودی رسیده‌اید.');
          return;
        }
        const id = btn.getAttribute('data-item-id');
        if (!id || typeof cart === 'undefined' || !cart.incrementQuantity) return;
        cart.incrementQuantity(id).then(function () {
          if (window.header && header.updateBadge) header.updateBadge();
          loadAndRender();
        }).catch(function (err) {
          alert(err && err.message ? err.message : 'موجودی کافی نیست.');
        });
      });
    });

    rootEl.querySelectorAll('.btn-remove-line').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const id = btn.getAttribute('data-item-id');
        if (!id || typeof cart === 'undefined' || !cart.removeLine) return;
        cart.removeLine(id).then(function () {
          if (window.header && header.updateBadge) header.updateBadge();
          loadAndRender();
        }).catch(function (err) {
          alert(err && err.message ? err.message : 'حذف ناموفق بود.');
        });
      });
    });
  }

  function loadAndRender() {
    if (typeof cart === 'undefined' || !cart.getItems) {
      rootEl.innerHTML = '<p class="empty-state">سبد خرید در دسترس نیست.</p>';
      return;
    }

    var enrich = cart.enrichItemsStockIfNeeded ? cart.enrichItemsStockIfNeeded() : Promise.resolve();
    enrich
      .then(function () {
        renderCart(cart.getItems());
      })
      .catch(function () {
        renderCart(cart.getItems());
      });
  }

  function boot() {
    loadAndRender();
  }

  if (typeof cart !== 'undefined' && cart.ready) {
    cart.ready.then(boot).catch(boot);
  } else {
    boot();
  }
})();
