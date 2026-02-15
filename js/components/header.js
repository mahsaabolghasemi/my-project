/**
 * Shared header: logo, search form (books), cart link with badge, profile/login link.
 * Renders into an element with id "header-container".
 * Search form submits to plp.html?q=<query> so PLP can show results.
 */
(function () {
  const container = document.getElementById('header-container');
  if (!container) return;

  function getCartCount() {
    return typeof cart !== 'undefined' && cart.getCount ? cart.getCount() : 0;
  }

  function getUser() {
    return typeof userState !== 'undefined' && userState.getUser ? userState.getUser() : null;
  }

  function isLoggedIn() {
    return typeof userState !== 'undefined' && userState.isLoggedIn ? userState.isLoggedIn() : false;
  }

  function renderBadge(count) {
    if (count <= 0) return '';
    return `<span class="badge" data-count="${count}" aria-label="${count} items in cart">${count}</span>`;
  }

  function renderProfileLink() {
    const user = getUser();
    if (user) {
      return `<a href="index.html#profile" id="profile-link" aria-label="Profile">👤 ${user.name || user.email}</a>`;
    }
    return `<a href="login.html" id="login-link" aria-label="Login">Login</a>`;
  }

  function render() {
    const count = getCartCount();
    container.innerHTML = `
      <header class="app-header">
        <div class="app-header__inner">
          <a href="index.html" class="app-header__logo">MiniBookstore</a>
          <form class="app-header__search" action="plp.html" method="get" role="search" aria-label="Search books">
            <input type="search" name="q" placeholder="Search books…" value="" autocomplete="off" />
            <button type="submit">Search</button>
          </form>
          <nav class="app-header__nav" aria-label="Main navigation">
            <a href="cart.html" aria-label="Cart">Cart ${renderBadge(count)}</a>
            ${renderProfileLink()}
          </nav>
        </div>
      </header>
    `;
  }

  render();

  // Re-render when cart might have changed
  window.header = {
    updateBadge: function () {
      const badge = container.querySelector('.badge');
      const count = getCartCount();
      const cartLink = container.querySelector('.app-header__nav a[href="cart.html"]');
      if (cartLink) {
        const existingBadge = cartLink.querySelector('.badge');
        if (existingBadge) existingBadge.remove();
        if (count > 0) cartLink.insertAdjacentHTML('beforeend', ' ' + renderBadge(count).trim());
      }
    },
    updateProfile: function () {
      const nav = container.querySelector('.app-header__nav');
      if (nav) {
        const profileLink = nav.querySelector('#profile-link, #login-link');
        if (profileLink) {
          profileLink.outerHTML = renderProfileLink();
        }
      }
    },
  };
})();
