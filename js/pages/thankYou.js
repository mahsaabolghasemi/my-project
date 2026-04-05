/**
 * Thank you page: show purchase success and order details after payment.
 */
(function () {
  const rootEl = document.getElementById('thank-you-root');
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

  function getOrderIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('orderId');
  }

  function formatDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (_) {
      return dateString;
    }
  }

  function renderThankYou(order) {
    if (!order) {
      rootEl.innerHTML = `
        <div class="thank-you-card">
          <h2 class="thank-you-title">از خرید شما متشکریم!</h2>
          <p>سفارش شما با موفقیت ثبت شد.</p>
          <a href="profile.html#order-history" class="btn btn--primary">تاریخچهٔ سفارشات</a>
          <a href="index.html" class="btn btn--secondary">ادامهٔ خرید</a>
        </div>
      `;
      return;
    }

    const date = formatDate(order.date);
    const total = formatPrice(order.total);
    const itemsHtml = order.items.map(function (item) {
      const lineTotal = formatPrice(item.price * item.quantity);
      return `
        <li class="thank-you-item">
          <strong>${escapeHtml(item.name)}</strong> — ${formatPrice(item.price)} × ${item.quantity} = ${lineTotal}
        </li>
      `;
    }).join('');

    rootEl.innerHTML = `
      <div class="thank-you-card">
        <h2 class="thank-you-title">از خرید شما متشکریم!</h2>
        <p class="thank-you-message">خرید شما با موفقیت انجام شد. می‌توانید کتاب‌ها را از تاریخچهٔ سفارشات دریافت کنید.</p>
        <div class="thank-you-order">
          <h3>جزئیات سفارش</h3>
          <p><strong>شناسهٔ سفارش:</strong> ${escapeHtml(order.id)}</p>
          <p><strong>تاریخ:</strong> ${escapeHtml(date)}</p>
          <p><strong>مبلغ کل:</strong> <span class="thank-you-total">${total}</span></p>
          <ul class="thank-you-items">${itemsHtml}</ul>
        </div>
        <div class="thank-you-actions">
          <a href="profile.html#order-history" class="btn btn--primary">تاریخچهٔ سفارشات و دریافت PDF</a>
          <a href="index.html" class="btn btn--secondary">ادامهٔ خرید</a>
        </div>
      </div>
    `;
  }

  var orderId = getOrderIdFromUrl();

  function usesRemoteApi() {
    return (
      typeof CONFIG !== 'undefined' &&
      CONFIG.API_BASE_URL &&
      typeof window.bookStoreApi !== 'undefined'
    );
  }

  function loadLocalFallback() {
    var order = null;
    if (typeof ordersState !== 'undefined' && ordersState.getOrders) {
      var orders = ordersState.getOrders();
      if (orderId) {
        order = orders.find(function (o) {
          return o.id === orderId;
        });
      }
      if (!order && orders.length > 0) {
        order = orders[0];
      }
    }
    renderThankYou(order);
  }

  if (usesRemoteApi() && orderId) {
    var u = typeof userState !== 'undefined' && userState.getUser ? userState.getUser() : null;
    if (u && u.token) {
      window.bookStoreApi
        .getOrderById(orderId)
        .then(function (apiOrder) {
          renderThankYou(window.bookStoreApi.mapOrder(apiOrder));
        })
        .catch(function () {
          loadLocalFallback();
        });
    } else {
      renderThankYou(null);
    }
  } else {
    loadLocalFallback();
  }
})();
