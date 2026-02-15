/**
 * Order history: list orders, click row to see details (including purchased PDFs).
 */
(function () {
  const rootEl = document.getElementById('orders-root');
  if (!rootEl) return;

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatPrice(value) {
    return typeof window.formatPrice === 'function'
      ? window.formatPrice(value, '€')
      : value.toFixed(2);
  }

  function formatDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
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
        <td>${order.items.length} ${order.items.length === 1 ? 'item' : 'items'}</td>
        <td><strong>${total}</strong></td>
        <td><button class="btn btn--secondary btn--sm btn-view-detail">View Details</button></td>
      </tr>
    `;
  }

  function renderOrderDetail(order) {
    const date = formatDate(order.date);
    const total = formatPrice(order.total);
    
    const itemsHtml = order.items.map(function (item) {
      const itemTotal = formatPrice(item.price * item.quantity);
      const pdfLink = item.pdfUrl && item.pdfUrl !== '#'
        ? `<a href="${escapeHtml(item.pdfUrl)}" target="_blank" class="btn btn--primary btn--sm">📥 Download PDF</a>`
        : '<span class="text-muted">PDF not available</span>';
      
      return `
        <div class="order-detail-item">
          <div class="order-detail-item__info">
            <h4>${escapeHtml(item.name)}</h4>
            <p>Price: ${formatPrice(item.price)} × ${item.quantity} = <strong>${itemTotal}</strong></p>
          </div>
          <div class="order-detail-item__action">
            ${pdfLink}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="order-detail" data-order-id="${escapeHtml(order.id)}">
        <div class="order-detail__header">
          <h3>Order Details: ${escapeHtml(order.id)}</h3>
          <button class="btn btn--secondary btn--sm btn-close-detail">Close</button>
        </div>
        <div class="order-detail__info">
          <p><strong>Date:</strong> ${escapeHtml(date)}</p>
          <p><strong>Total:</strong> <span class="order-total">${total}</span></p>
        </div>
        <div class="order-detail__items">
          <h4>Purchased Books:</h4>
          ${itemsHtml}
        </div>
      </div>
    `;
  }

  function renderOrders(orders) {
    if (!orders || orders.length === 0) {
      rootEl.innerHTML = `
        <div class="empty-state">
          <p>You have no orders yet.</p>
          <a href="index.html" class="btn btn--primary">Browse Books</a>
        </div>
      `;
      return;
    }

    rootEl.innerHTML = `
      <table class="orders-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Date</th>
            <th>Items</th>
            <th>Total</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map(renderOrderRow).join('')}
        </tbody>
      </table>
      <div id="order-detail-container"></div>
    `;

    attachEventListeners();
  }

  function attachEventListeners() {
    const viewButtons = rootEl.querySelectorAll('.btn-view-detail');
    viewButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const row = btn.closest('.order-row');
        const orderId = row.getAttribute('data-order-id');
        showOrderDetail(orderId);
      });
    });
  }

  function showOrderDetail(orderId) {
    if (typeof ordersState === 'undefined' || !ordersState.getOrders) {
      alert('Orders are not available.');
      return;
    }

    const orders = ordersState.getOrders();
    const order = orders.find(function (o) { return o.id === orderId; });

    if (!order) {
      alert('Order not found.');
      return;
    }

    const container = document.getElementById('order-detail-container');
    if (container) {
      container.innerHTML = renderOrderDetail(order);

      // Attach close button handler
      const closeBtn = container.querySelector('.btn-close-detail');
      if (closeBtn) {
        closeBtn.addEventListener('click', function () {
          container.innerHTML = '';
        });
      }
    }
  }

  function loadAndRender() {
    if (typeof ordersState === 'undefined' || !ordersState.getOrders) {
      rootEl.innerHTML = '<p class="empty-state">Orders are not available.</p>';
      return;
    }

    const orders = ordersState.getOrders();
    renderOrders(orders);
  }

  // Load and render orders on page load
  loadAndRender();
})();
