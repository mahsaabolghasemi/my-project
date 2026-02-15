/**
 * Shared utility functions.
 * Keeps page scripts thin and avoids duplicated logic.
 */

/**
 * Format a number as price (e.g. 19.99 -> "19.99" or "€19.99").
 * @param {number} value
 * @param {string} [currency] - Optional currency symbol or code.
 * @returns {string}
 */
function formatPrice(value, currency = '') {
  if (typeof value !== 'number' || Number.isNaN(value)) return '0.00';
  const formatted = value.toFixed(2);
  return currency ? `${currency} ${formatted}` : formatted;
}

/**
 * Get a single query parameter from the current page URL.
 * @param {string} name - Parameter name (e.g. "q", "id").
 * @returns {string|null}
 */
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

/**
 * Build a URL with query params (e.g. plp.html?q=shoes).
 * @param {string} path - Path or filename (e.g. "plp.html").
 * @param {Record<string, string>} params - Key-value query params.
 * @returns {string}
 */
function buildUrl(path, params = {}) {
  const url = new URL(path, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') url.searchParams.set(key, value);
  });
  return url.pathname + url.search;
}
