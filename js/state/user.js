/**
 * User state: with API_BASE_URL → login only via POST /auth/login (token required).
 * Without API → whitelist (src/data/users.data.js).
 */
(function () {
  var STORAGE_KEY =
    typeof CONFIG !== 'undefined' ? CONFIG.USER_STORAGE_KEY : 'minishop_user';

  /** @type {{ id: string, email?: string, name?: string, username?: string, token?: string } | null} */
  var currentUser = null;

  function usesRemoteAuth() {
    return (
      typeof CONFIG !== 'undefined' &&
      CONFIG.API_BASE_URL &&
      typeof window.bookStoreApi !== 'undefined'
    );
  }

  function findWhitelistUser(username, password) {
    var list =
      typeof window.MINISHOP_USERS_WHITELIST !== 'undefined' &&
      Array.isArray(window.MINISHOP_USERS_WHITELIST)
        ? window.MINISHOP_USERS_WHITELIST
        : [];
    var u = (username || '').trim();
    return (
      list.find(function (x) {
        return x.username === u && x.password === password;
      }) || null
    );
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.id && parsed.username) {
          currentUser = {
            id: String(parsed.id),
            username: parsed.username,
            name: parsed.name || parsed.username,
            email: parsed.email || parsed.username + '@local',
            token: parsed.token || undefined,
          };
          ensureName();
        }
      }
    } catch (_) {
      currentUser = null;
    }
  }

  function ensureName() {
    if (!currentUser) return;
    if (!currentUser.name && currentUser.username) {
      currentUser.name = currentUser.username;
    }
  }

  function save() {
    try {
      if (currentUser) {
        ensureName();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (_) {}
  }

  function getUser() {
    return currentUser ? Object.assign({}, currentUser) : null;
  }

  function isLoggedIn() {
    return currentUser !== null;
  }

  /**
   * @param {string} username
   * @param {string} password
   * @returns {Promise<{ success: boolean, user?: object, error?: string }>}
   */
  function login(username, password) {
    var trimmed = (username || '').trim();
    if (!trimmed || !password) {
      return Promise.resolve({
        success: false,
        error: 'نام کاربری و رمز عبور الزامی است.',
      });
    }

    if (usesRemoteAuth()) {
      return window.bookStoreApi
        .login(trimmed, password)
        .then(function (data) {
          var token = data && data.token ? String(data.token).trim() : '';
          if (!token) {
            return {
              success: false,
              error: 'سرور توکن معتبر ارسال نکرد. پاسخ ورود را در کنسول بررسی کنید.',
            };
          }
          var u = data.user || {};
          currentUser = {
            id: String(u.id != null ? u.id : trimmed),
            username: u.username != null ? String(u.username) : trimmed,
            name: u.name || u.username || trimmed,
            email: (u.username || trimmed) + '@local',
            token: token,
          };
          ensureName();
          save();
          var merge =
            typeof window.cart !== 'undefined' && window.cart.mergeLocalCartToServer
              ? window.cart.mergeLocalCartToServer()
              : Promise.resolve();
          return merge
            .then(function () {
              return { success: true, user: getUser() };
            })
            .catch(function () {
              return { success: true, user: getUser() };
            });
        })
        .catch(function (err) {
          var msg = err && err.message ? err.message : 'ورود ناموفق بود.';
          return { success: false, error: msg };
        });
    }

    var w = findWhitelistUser(trimmed, password);
    if (!w) {
      return Promise.resolve({
        success: false,
        error: 'کاربری شما مجاز نمیباشد',
      });
    }

    currentUser = {
      id: String(w.id),
      username: w.username,
      name: w.name,
      email: w.username + '@local',
      token: 'mock-' + w.id + '-' + Date.now(),
    };
    ensureName();
    save();

    return Promise.resolve({ success: true, user: getUser() });
  }

  function logout() {
    if (usesRemoteAuth() && currentUser && currentUser.token) {
      return window.bookStoreApi.logoutRemote().finally(function () {
        currentUser = null;
        save();
      });
    }
    currentUser = null;
    save();
    return Promise.resolve();
  }

  load();

  window.userState = { getUser: getUser, isLoggedIn: isLoggedIn, login: login, logout: logout };
})();
