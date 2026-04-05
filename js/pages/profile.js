/**
 * Profile + order history (API GET /orders when configured).
 */
(function () {
  const rootEl = document.getElementById('profile-orders-root');
  if (!rootEl) return;

  if (typeof userState === 'undefined' || !userState.isLoggedIn || !userState.isLoggedIn()) {
    window.location.href = 'login.html?return=' + encodeURIComponent('profile.html#/profile');
    return;
  }

  const user = userState.getUser();
  if (user) {
    const nameEl = document.getElementById('profile-name');
    const userEl = document.getElementById('profile-username');
    if (nameEl) nameEl.textContent = user.name || user.username || '—';
    if (userEl) userEl.textContent = user.username || '—';
  }

  const logoutBtn = document.getElementById('btn-profile-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      Promise.resolve(userState.logout()).then(function () {
        window.location.href = 'index.html';
      });
    });
  }

  function scrollToHash() {
    var h = location.hash;
    if (h === '#/profile' || h === '#profile') {
      document.getElementById('profile-view')?.scrollIntoView({ behavior: 'smooth' });
    } else if (h === '#/orders' || h === '#order-history' || h === '#/order-history') {
      document.getElementById('order-history')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  window.addEventListener('hashchange', scrollToHash);
  scrollToHash();

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

  function renderOrderRow(order) {
    const date = formatDate(order.date);
    const total = formatPrice(order.total);
    return `
      <tr class="order-row" data-order-id="${escapeHtml(order.id)}">
        <td>${escapeHtml(order.id)}</td>
        <td>${escapeHtml(date)}</td>
        <td>${order.items.length} قلم</td>
        <td><strong>${total}</strong></td>
        <td><button type="button" class="btn btn--secondary btn--sm btn-view-detail">مشاهدهٔ جزئیات</button></td>
      </tr>
    `;
  }

  function renderOrderDetail(order) {
    const date = formatDate(order.date);
    const total = formatPrice(order.total);

    const itemsHtml = order.items
      .map(function (item) {
        const itemTotal = formatPrice(item.price * item.quantity);
        const pdfLink =
          item.pdfUrl && item.pdfUrl !== '#'
            ? `<a href="${escapeHtml(item.pdfUrl)}" target="_blank" class="btn btn--primary btn--sm">📥 دریافت PDF</a>`
            : '<span class="text-muted">PDF موجود نیست</span>';

        return `
        <div class="order-detail-item">
          <div class="order-detail-item__info">
            <h4>${escapeHtml(item.name)}</h4>
            <p>قیمت: ${formatPrice(item.price)} × ${item.quantity} = <strong>${itemTotal}</strong></p>
          </div>
          <div class="order-detail-item__action">
            ${pdfLink}
          </div>
        </div>
      `;
      })
      .join('');

    return `
      <div class="order-detail" data-order-id="${escapeHtml(order.id)}">
        <div class="order-detail__header">
          <h3>جزئیات سفارش: ${escapeHtml(order.id)}</h3>
          <button type="button" class="btn btn--secondary btn--sm btn-close-detail">بستن</button>
        </div>
        <div class="order-detail__info">
          <p><strong>تاریخ:</strong> ${escapeHtml(date)}</p>
          <p><strong>مبلغ کل:</strong> <span class="order-total">${total}</span></p>
        </div>
        <div class="order-detail__items">
          <h4>کتاب‌های خریداری‌شده:</h4>
          ${itemsHtml}
        </div>
      </div>
    `;
  }

  function usesRemoteApi() {
    return (
      typeof CONFIG !== 'undefined' &&
      CONFIG.API_BASE_URL &&
      typeof window.bookStoreApi !== 'undefined'
    );
  }

  function renderOrders(orders) {
    const detailHost = document.getElementById('order-detail-container');
    if (detailHost) detailHost.innerHTML = '';

    if (!orders || orders.length === 0) {
      rootEl.innerHTML = `
        <div class="empty-state">
          <p>هنوز سفارشی ندارید.</p>
          <a href="index.html" class="btn btn--primary">مشاهدهٔ کتاب‌ها</a>
        </div>
      `;
      return;
    }

    rootEl.innerHTML = `
      <table class="orders-table">
        <thead>
          <tr>
            <th>شناسهٔ سفارش</th>
            <th>تاریخ</th>
            <th>تعداد</th>
            <th>مبلغ کل</th>
            <th>عملیات</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map(renderOrderRow).join('')}
        </tbody>
      </table>
    `;

    rootEl.querySelectorAll('.btn-view-detail').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const row = btn.closest('.order-row');
        const orderId = row && row.getAttribute('data-order-id');
        if (orderId) showOrderDetail(orderId);
      });
    });
  }

  function showOrderDetail(orderId) {
    function show(order) {
      if (!order) {
        alert('سفارش یافت نشد.');
        return;
      }
      const container = document.getElementById('order-detail-container');
      if (container) {
        container.innerHTML = renderOrderDetail(order);
        const closeBtn = container.querySelector('.btn-close-detail');
        if (closeBtn) {
          closeBtn.addEventListener('click', function () {
            container.innerHTML = '';
          });
        }
      }
    }

    if (usesRemoteApi()) {
      const u = userState.getUser();
      if (!u || !u.token) {
        alert('برای مشاهدهٔ سفارش‌ها باید با حساب سرور وارد شده باشید.');
        return;
      }
      window.bookStoreApi
        .getOrderById(orderId)
        .then(function (apiOrder) {
          show(window.bookStoreApi.mapOrder(apiOrder));
        })
        .catch(function () {
          alert('سفارش یافت نشد.');
        });
      return;
    }

    if (typeof ordersState === 'undefined' || !ordersState.getOrders) {
      alert('سفارشات در دسترس نیست.');
      return;
    }

    const orders = ordersState.getOrders();
    const order = orders.find(function (o) {
      return o.id === orderId;
    });
    show(order);
  }

  function loadAndRender() {
    if (usesRemoteApi()) {
      const u = userState.getUser();
      if (!u || !u.token) {
        rootEl.innerHTML =
          '<div class="empty-state"><p>برای نمایش سفارش‌های سرور، ابتدا با حسابی که روی سرور معتبر است وارد شوید (توکن API).</p></div>';
        return;
      }
      window.bookStoreApi
        .listOrders()
        .then(function (apiOrders) {
          const mapped = (apiOrders || [])
            .map(function (o) {
              return window.bookStoreApi.mapOrder(o);
            })
            .filter(Boolean);
          renderOrders(mapped);
        })
        .catch(function (err) {
          rootEl.innerHTML =
            '<p class="empty-state">' +
            escapeHtml(err && err.message ? err.message : 'بارگذاری سفارش‌ها ناموفق بود.') +
            '</p>';
        });
      return;
    }

    if (typeof ordersState === 'undefined' || !ordersState.getOrders) {
      rootEl.innerHTML = '<p class="empty-state">سفارشات در دسترس نیست.</p>';
      return;
    }

    renderOrders(ordersState.getOrders());
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
