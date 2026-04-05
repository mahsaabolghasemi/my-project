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

  function renderCountBadge(count) {
    if (count <= 0) return '';
    return `<span class="nav-badge__count" aria-label="${count} قلم در سبد">${count}</span>`;
  }

  function renderCartBadge() {
    const count = getCartCount();
    return `<a href="cart.html" class="nav-badge nav-badge--cart" aria-label="سبد خرید">
      <span class="nav-badge__icon" aria-hidden="true">🛒</span>
      <span class="nav-badge__label">سبد</span>${renderCountBadge(count)}
    </a>`;
  }

  function renderProfileBadge() {
    const user = getUser();
    if (user) {
      const initial = (user.name || user.username || '?').trim().charAt(0).toUpperCase();
      return `<a href="profile.html#/profile" id="profile-link" class="nav-badge nav-badge--profile nav-badge--profile-avatar" aria-label="پروفایل" title="پروفایل">
        <span class="nav-badge__avatar" aria-hidden="true">${initial}</span>
        <span class="nav-badge__label">پروفایل</span>
      </a>`;
    }
    return `<a href="login.html" id="login-link" class="nav-badge nav-badge--profile" aria-label="ورود">
      <span class="nav-badge__icon" aria-hidden="true">👤</span>
      <span class="nav-badge__label">ورود</span>
    </a>`;
  }

  function getSearchQueryFromUrl() {
    try {
      var params = new URLSearchParams(window.location.search);
      return params.get('q') || '';
    } catch (_) {
      return '';
    }
  }

  function escapeAttr(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function render() {
    const count = getCartCount();
    const searchValue = getSearchQueryFromUrl();
    const searchValueAttr = searchValue ? ' value="' + escapeAttr(searchValue) + '"' : '';
    container.innerHTML = `
      <header class="app-header">
        <div class="app-header__inner">
          <a href="index.html" class="app-header__logo">کتابفروشی</a>
          <form class="app-header__search" action="plp.html" method="get" role="search" aria-label="جستجوی کتاب‌ها">
            <input type="search" name="q" placeholder="جستجوی کتاب‌ها…"${searchValueAttr} autocomplete="off" />
            <button type="submit">جستجو</button>
          </form>
          <nav class="app-header__nav" aria-label="منوی اصلی">
            ${renderCartBadge()}
            ${renderProfileBadge()}
          </nav>
        </div>
      </header>
    `;
  }

  render();

  // Re-render when cart might have changed
  window.header = {
    updateBadge: function () {
      const count = getCartCount();
      const cartBadge = container.querySelector('.nav-badge--cart');
      if (cartBadge) {
        const existingCount = cartBadge.querySelector('.nav-badge__count');
        if (existingCount) existingCount.remove();
        if (count > 0) cartBadge.insertAdjacentHTML('beforeend', renderCountBadge(count));
      }
    },
    updateProfile: function () {
      const nav = container.querySelector('.app-header__nav');
      if (nav) {
        const profileBadge = nav.querySelector('#profile-link, #login-link');
        if (profileBadge) {
          profileBadge.outerHTML = renderProfileBadge();
        }
      }
    },
  };
})();
