/**
 * App configuration and constants.
 * Single place to change API base URL or feature flags (e.g. when moving from mock to real API).
 */
const CONFIG = {
  /**
   * Book Store API base (OpenAPI). Set e.g. http://localhost:3000 for real login + token.
   * Leave '' to use js/api/mockApi.js only (no backend, no token).
   */
  API_BASE_URL: '',
  /**
   * How the session token is sent. Most backends: "Authorization" + "Bearer " + token.
   * If your server expects the raw token only, set API_AUTH_TOKEN_PREFIX to "".
   * If it uses a custom header (e.g. "token"), set API_AUTH_HEADER to that name and prefix to "".
   */
  API_AUTH_HEADER: 'Authorization',
  API_AUTH_TOKEN_PREFIX: 'Bearer ',
  /** Key used to persist cart in localStorage. */
  CART_STORAGE_KEY: 'minishop_cart',
  /** Key used to persist orders in localStorage. */
  ORDERS_STORAGE_KEY: 'minishop_orders',
  /** Key used to persist user session in localStorage. */
  USER_STORAGE_KEY: 'minishop_user',
};

// Freeze so config is not accidentally mutated.
if (typeof Object.freeze === 'function') {
  Object.freeze(CONFIG);
}
