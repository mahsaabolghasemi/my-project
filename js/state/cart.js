/**
 * Cart state: in-memory list + optional persistence to localStorage.
 * Single source of truth for cart; all pages use this module to add/remove/read.
 */

const STORAGE_KEY = typeof CONFIG !== 'undefined' ? CONFIG.CART_STORAGE_KEY : 'minishop_cart';

/** @type {Array<{ id: string, name: string, price: number, image?: string, pdfUrl?: string, quantity: number }>} */
let items = [];

/**
 * Load cart from localStorage (if available).
 */
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) items = parsed;
    }
  } catch (_) {
    items = [];
  }
}

/**
 * Save current cart to localStorage.
 */
function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (_) {}
}

/**
 * Get current cart items (copy so callers can't mutate state directly).
 * @returns {Array<{ id: string, name: string, price: number, image?: string, pdfUrl?: string, quantity: number }>}
 */
function getItems() {
  return items.map((item) => ({ ...item }));
}

/**
 * Get total number of units in cart.
 * @returns {number}
 */
function getCount() {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Add a book to cart (or increase quantity if already present).
 * Pass pdfUrl so the order can show purchased PDFs in order history.
 * @param {{ id: string, name: string, title?: string, price: number, image?: string, coverImage?: string, pdfUrl?: string }} book
 * @param {number} [quantity=1]
 */
function add(book, quantity = 1) {
  const name = book.name != null ? book.name : book.title;
  const existing = items.find((i) => i.id === book.id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({
      id: book.id,
      name: name,
      price: book.price,
      image: book.image || book.coverImage,
      pdfUrl: book.pdfUrl,
      quantity,
    });
  }
  save();
}

/**
 * Remove one unit of a product (or remove line if quantity becomes 0).
 * @param {string} productId
 */
function remove(productId) {
  const index = items.findIndex((i) => i.id === productId);
  if (index === -1) return;
  items[index].quantity -= 1;
  if (items[index].quantity <= 0) items.splice(index, 1);
  save();
}

/**
 * Set quantity for a product (0 = remove line).
 * @param {string} productId
 * @param {number} quantity
 */
function setQuantity(productId, quantity) {
  if (quantity <= 0) {
    items = items.filter((i) => i.id !== productId);
  } else {
    const existing = items.find((i) => i.id === productId);
    if (existing) existing.quantity = quantity;
  }
  save();
}

/**
 * Clear cart (e.g. after successful order).
 */
function clear() {
  items = [];
  save();
}

// Load from storage when module is first used (e.g. when script loads).
load();

window.cart = { getItems, getCount, add, remove, setQuantity, clear };
