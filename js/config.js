/**
 * App configuration and constants.
 * Single place to change API base URL or feature flags (e.g. when moving from mock to real API).
 */
const CONFIG = {
  /** Base URL for API. For mock we don't use it; for a real API you'd set it here. */
  API_BASE_URL: '',
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
