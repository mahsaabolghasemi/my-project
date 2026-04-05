/**
 * App configuration and constants.
 * Single place to change API base URL or feature flags (e.g. when moving from mock to real API).
 */
const CONFIG = {
  /**
   * Book Store API base. Example (LAN dev server): http://192.168.9.183:3000
   * Leave empty to use the in-browser mock (js/api/mockApi.js).
   */
  API_BASE_URL: '',
  /** Header name for the session token (default Authorization). */
  API_AUTH_HEADER: 'Authorization',
  /** Prefix before the token (default "Bearer "). Set to "" to send the raw token. */
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
