/**
 * User state: with API_BASE_URL → login only via POST /auth/login (token required).
 * Without API → whitelist (src/data/users.data.js).
 */

/** Must be unique per file — duplicate `const` names across classic scripts break the whole page. */
const USER_STATE_STORAGE_KEY = typeof CONFIG !== 'undefined' ? CONFIG.USER_STORAGE_KEY : 'minishop_user';

/** @type {{ id: string, email?: string, name?: string, username?: string, token?: string } | null} */
let currentUser = null;

function usesRemoteAuth() {
  return (
    typeof CONFIG !== 'undefined' &&
    CONFIG.API_BASE_URL &&
    typeof window.bookStoreApi !== 'undefined'
  );
}

function findWhitelistUser(username, password) {
  const list =
    typeof window.MINISHOP_USERS_WHITELIST !== 'undefined' && Array.isArray(window.MINISHOP_USERS_WHITELIST)
      ? window.MINISHOP_USERS_WHITELIST
      : [];
  const u = (username || '').trim();
  return list.find(function (x) {
    return x.username === u && x.password === password;
  }) || null;
}

function load() {
  try {
    const raw = localStorage.getItem(USER_STATE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
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
      localStorage.setItem(USER_STATE_STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(USER_STATE_STORAGE_KEY);
    }
  } catch (_) {}
}

/**
 * @returns {{ id: string, email: string, name: string, username?: string, token?: string } | null}
 */
function getUser() {
  return currentUser ? { ...currentUser } : null;
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
  const trimmed = (username || '').trim();
  if (!trimmed || !password) {
    return Promise.resolve({ success: false, error: 'نام کاربری و رمز عبور الزامی است.' });
  }

  if (usesRemoteAuth()) {
    return window.bookStoreApi
      .login(trimmed, password)
      .then(function (data) {
        var token = data && data.token ? String(data.token).trim() : '';
        if (!token) {
          return { success: false, error: 'سرور توکن معتبر ارسال نکرد. پاسخ ورود را در کنسول بررسی کنید.' };
        }
        const u = data.user || {};
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

  const w = findWhitelistUser(trimmed, password);
  if (!w) {
    return Promise.resolve({ success: false, error: 'کاربری شما مجاز نمیباشد' });
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

window.userState = { getUser, isLoggedIn, login, logout };
