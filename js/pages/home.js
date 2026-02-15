/**
 * Home page: fetch list of books from mock API and render book grid.
 * Also shows profile section if user is logged in.
 * Header is mounted by header.js (loaded in HTML).
 */
(function () {
  const gridEl = document.getElementById('product-grid');
  const titleEl = document.getElementById('page-title');
  if (!gridEl) return;

  const productGrid = gridEl;

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function renderBook(book) {
    const price = typeof formatPrice === 'function' ? formatPrice(book.price, '€') : book.price.toFixed(2);
    return `
      <article class="product-card">
        <a href="pdp.html?id=${encodeURIComponent(book.id)}" class="product-card__link">
          <img class="product-card__image" src="${escapeHtml(book.coverImage)}" alt="${escapeHtml(book.title)}" loading="lazy" />
          <div class="product-card__body">
            <h2 class="product-card__name">${escapeHtml(book.title)}</h2>
            <p class="product-card__body-meta">${escapeHtml(book.author)}</p>
            <p class="product-card__price">${price}</p>
          </div>
        </a>
      </article>
    `;
  }

  function renderProfileSection() {
    if (typeof userState === 'undefined' || !userState.isLoggedIn || !userState.isLoggedIn()) {
      return '';
    }

    const user = typeof userState !== 'undefined' && userState.getUser ? userState.getUser() : null;
    if (!user) return '';

    const orders = typeof ordersState !== 'undefined' && ordersState.getOrders ? ordersState.getOrders() : [];
    const orderCount = orders.length;

    return `
      <section id="profile" class="profile-section">
        <h2 class="profile-section__title">👤 Your Profile</h2>
        <div class="profile-card">
          <div class="profile-card__info">
            <p><strong>Name:</strong> ${escapeHtml(user.name || 'N/A')}</p>
            <p><strong>Email:</strong> ${escapeHtml(user.email)}</p>
            <p><strong>Orders:</strong> ${orderCount} ${orderCount === 1 ? 'order' : 'orders'}</p>
          </div>
          <div class="profile-card__actions">
            <a href="orders.html" class="btn btn--secondary">View Order History</a>
            <button class="btn btn--danger btn-logout">Logout</button>
          </div>
        </div>
      </section>
    `;
  }

  function showLoading() {
    productGrid.innerHTML = '<p class="empty-state">Loading books…</p>';
  }

  function showError(message) {
    productGrid.innerHTML = '<p class="empty-state">' + escapeHtml(message) + '</p>';
  }

  function showBooks(books) {
    if (!books.length) {
      productGrid.innerHTML = '<p class="empty-state">No books found.</p>';
      return;
    }
    productGrid.innerHTML = books.map(renderBook).join('');

    // Add profile section after books
    const profileHtml = renderProfileSection();
    if (profileHtml) {
      const profileContainer = document.createElement('div');
      profileContainer.innerHTML = profileHtml;
      productGrid.parentElement.appendChild(profileContainer);
      
      // Attach logout handler
      const logoutBtn = profileContainer.querySelector('.btn-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
          if (typeof userState !== 'undefined' && userState.logout) {
            userState.logout();
            // Update header
            if (typeof header !== 'undefined' && header.updateProfile) {
              header.updateProfile();
            }
            // Reload page to refresh profile section
            window.location.reload();
          }
        });
      }
    }
  }

  showLoading();

  if (typeof mockApi === 'undefined') {
    showError('API not available.');
    return;
  }

  mockApi.getBooks().then(showBooks).catch(function (err) {
    showError('Failed to load books. Please try again.');
    console.error(err);
  });
})();
