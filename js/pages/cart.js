/**
 * Cart page: list cart items, show total, remove items, continue to payment.
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
      ? window.formatPrice(value, '€')
      : value.toFixed(2);
  }

  function renderCartItem(item) {
    const price = formatPrice(item.price);
    const total = formatPrice(item.price * item.quantity);
    return `
      <div class="cart-item" data-item-id="${escapeHtml(item.id)}">
        <div class="cart-item__image">
          ${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" />` : '<div class="cart-item__placeholder">📚</div>'}
        </div>
        <div class="cart-item__info">
          <h3 class="cart-item__name">${escapeHtml(item.name)}</h3>
          <p class="cart-item__price">${price} × ${item.quantity} = <strong>${total}</strong></p>
        </div>
        <div class="cart-item__actions">
          <button class="btn btn--danger btn--sm btn-remove-item" data-item-id="${escapeHtml(item.id)}">Remove</button>
        </div>
      </div>
    `;
  }

  function renderCart(items) {
    if (!items || items.length === 0) {
      rootEl.innerHTML = `
        <div class="empty-state">
          <p>Your cart is empty.</p>
          <a href="index.html" class="btn btn--primary">Browse Books</a>
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
          <span>Subtotal:</span>
          <strong>${formattedSubtotal}</strong>
        </div>
        <div class="cart-summary__row cart-summary__total">
          <span>Total:</span>
          <strong class="cart-total">${formattedSubtotal}</strong>
        </div>
        <a href="payment.html" class="btn btn--primary btn-continue">Continue to Payment</a>
      </div>
    `;

    attachEventListeners();
  }

  function attachEventListeners() {
    const removeButtons = rootEl.querySelectorAll('.btn-remove-item');
    removeButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const itemId = btn.getAttribute('data-item-id');
        handleRemoveItem(itemId);
      });
    });
  }

  function handleRemoveItem(itemId) {
    if (typeof cart === 'undefined' || !cart.remove) {
      alert('Cart is not available.');
      return;
    }

    cart.remove(itemId);

    // Update header badge
    if (typeof header !== 'undefined' && header.updateBadge) {
      header.updateBadge();
    }

    // Re-render cart
    loadAndRender();
  }

  function loadAndRender() {
    if (typeof cart === 'undefined' || !cart.getItems) {
      rootEl.innerHTML = '<p class="empty-state">Cart is not available.</p>';
      return;
    }

    const items = cart.getItems();
    renderCart(items);
  }

  // Load and render cart on page load
  loadAndRender();
})();
