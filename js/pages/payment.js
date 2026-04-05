/**
 * Payment page: show order summary, simulate payment, then redirect to thank-you.
 */
(function () {
  const rootEl = document.getElementById('payment-root');
  if (!rootEl) return;

  function usesRemoteApi() {
    return (
      typeof CONFIG !== 'undefined' &&
      CONFIG.API_BASE_URL &&
      typeof window.bookStoreApi !== 'undefined'
    );
  }

  if (usesRemoteApi()) {
    const u = typeof userState !== 'undefined' && userState.getUser ? userState.getUser() : null;
    if (!u || !u.token) {
      window.location.href = 'login.html?return=' + encodeURIComponent('payment.html');
      return;
    }
  }

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

  function renderPaymentPage(items, total) {
    const formattedTotal = formatPrice(total);
    const itemsHtml = items.map(function (item) {
      const lineTotal = formatPrice(item.price * item.quantity);
      return `
        <div class="cart-item payment-item">
          <div class="cart-item__info">
            <h3 class="cart-item__name">${escapeHtml(item.name)}</h3>
            <p class="cart-item__price">${formatPrice(item.price)} × ${item.quantity} = ${lineTotal}</p>
          </div>
        </div>
      `;
    }).join('');

    rootEl.innerHTML = `
      <div class="payment-summary">
        <h2>خلاصهٔ سفارش</h2>
        <div class="payment-items">
          ${itemsHtml}
        </div>
        <div class="cart-summary">
          <div class="cart-summary__row cart-summary__total">
            <span>مبلغ قابل پرداخت:</span>
            <strong class="cart-total">${formattedTotal}</strong>
          </div>
          <button type="button" class="btn btn--primary btn-place-order" id="btn-place-order">
            ثبت سفارش (پرداخت آزمایشی)
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-place-order').addEventListener('click', handlePlaceOrder);
  }

  function handlePlaceOrder() {
    if (typeof cart === 'undefined' || !cart.getItems) {
      alert('سبد خرید در دسترس نیست.');
      return;
    }

    const items = cart.getItems();
    if (!items || items.length === 0) {
      alert('سبد خرید شما خالی است. ابتدا کتاب اضافه کنید.');
      window.location.href = 'index.html';
      return;
    }

    if (usesRemoteApi()) {
      const btn = document.getElementById('btn-place-order');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'در حال ثبت سفارش…';
      }
      window.bookStoreApi
        .createOrder()
        .then(function (data) {
          const oid = data.order && data.order.id != null ? String(data.order.id) : '';
          if (cart.syncFromServerIfNeeded) {
            return cart.syncFromServerIfNeeded().then(function () {
              return oid;
            });
          }
          return oid;
        })
        .then(function (oid) {
          window.location.href = 'thank-you.html?orderId=' + encodeURIComponent(oid || '');
        })
        .catch(function (err) {
          alert(err && err.message ? err.message : 'ثبت سفارش ناموفق بود.');
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'ثبت سفارش (پرداخت آزمایشی)';
          }
        });
      return;
    }

    if (typeof ordersState === 'undefined' || !ordersState.addOrder || !cart.clear) {
      alert('سرویس سفارشات در دسترس نیست.');
      return;
    }

    const total = items.reduce(function (sum, item) {
      return sum + item.price * item.quantity;
    }, 0);

    const orderItems = items.map(function (item) {
      return {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        pdfUrl: item.pdfUrl,
      };
    });

    const orderId = ordersState.addOrder(orderItems, total);
    cart.clear();

    window.location.href = 'thank-you.html?orderId=' + encodeURIComponent(orderId);
  }

  function showEmpty() {
    rootEl.innerHTML = `
      <div class="empty-state">
        <p>سبد خرید شما خالی است. ابتدا کتاب اضافه کنید.</p>
        <a href="index.html" class="btn btn--primary">مشاهدهٔ کتاب‌ها</a>
      </div>
    `;
  }

  function initPaymentView() {
    if (typeof cart === 'undefined' || !cart.getItems) {
      rootEl.innerHTML = '<p class="empty-state">سبد خرید در دسترس نیست.</p>';
      return;
    }

    const items = cart.getItems();
    if (!items || items.length === 0) {
      showEmpty();
      return;
    }

    const total = items.reduce(function (sum, item) {
      return sum + item.price * item.quantity;
    }, 0);

    renderPaymentPage(items, total);
  }

  if (typeof cart !== 'undefined' && cart.ready) {
    cart.ready.then(initPaymentView).catch(initPaymentView);
  } else {
    initPaymentView();
  }
})();
