/**
 * User state: login/logout, user details.
 * Persisted in localStorage so user stays logged in across page refreshes.
 */

const STORAGE_KEY = typeof CONFIG !== 'undefined' ? CONFIG.USER_STORAGE_KEY : 'minishop_user';

/** @type {{ id: string, email: string, name: string } | null} */
let currentUser = null;

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id && parsed.email) {
        currentUser = parsed;
      }
    }
  } catch (_) {
    currentUser = null;
  }
}

function save() {
  try {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (_) {}
}

/**
 * Get current logged-in user.
 * @returns {{ id: string, email: string, name: string } | null}
 */
function getUser() {
  return currentUser ? { ...currentUser } : null;
}

/**
 * Check if user is logged in.
 * @returns {boolean}
 */
function isLoggedIn() {
  return currentUser !== null;
}

/**
 * Login a user.
 * @param {string} email
 * @param {string} password - Not validated in mock; in real app would verify with backend.
 * @returns {Promise<{ success: boolean, user?: { id: string, email: string, name: string }, error?: string }>}
 */
function login(email, password) {
  return new Promise(function (resolve) {
    // Simulate API delay
    setTimeout(function () {
      if (!email || !password) {
        resolve({ success: false, error: 'Email and password are required.' });
        return;
      }

      // Mock: accept any email/password, create user
      const name = email.split('@')[0] || 'User';
      currentUser = {
        id: 'user_' + Date.now(),
        email: email,
        name: name,
      };
      save();
      resolve({ success: true, user: { ...currentUser } });
    }, 300);
  });
}

/**
 * Logout current user.
 */
function logout() {
  currentUser = null;
  save();
}

load();

window.userState = { getUser, isLoggedIn, login, logout };
