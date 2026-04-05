/**
 * Order history state: persisted in localStorage.
 * After payment we push an order here. Each item includes pdfUrl so order detail
 * can show "Download PDF" for purchased books (digital delivery, no shipping).
 */

/** Must be unique per file — duplicate `const` names across classic scripts break the whole page. */
const ORDERS_STATE_STORAGE_KEY = typeof CONFIG !== 'undefined' ? CONFIG.ORDERS_STORAGE_KEY : 'minishop_orders';

/** @type {Array<{ id: string, date: string, items: Array<{ id: string, name: string, price: number, quantity: number, pdfUrl?: string }>, total: number }>} */
let orders = [];

function load() {
  try {
    const raw = localStorage.getItem(ORDERS_STATE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) orders = parsed;
    }
  } catch (_) {
    orders = [];
  }
}

function save() {
  try {
    localStorage.setItem(ORDERS_STATE_STORAGE_KEY, JSON.stringify(orders));
  } catch (_) {}
}

/**
 * @returns {Array<{ id: string, date: string, items: Array<{ id: string, name: string, price: number, quantity: number, pdfUrl?: string }>, total: number }>}
 */
function getOrders() {
  return orders.map((o) => ({ ...o, items: o.items.map((i) => ({ ...i })) }));
}

/**
 * Add a new order (e.g. after successful payment).
 * Items should include pdfUrl so order detail can show purchased PDFs.
 * @param {Array<{ id: string, name: string, price: number, quantity: number, pdfUrl?: string }>} items
 * @param {number} total
 * @returns {string} order id
 */
function addOrder(items, total) {
  const id = 'ord_' + Date.now();
  const order = {
    id,
    date: new Date().toISOString(),
    items: items.map((i) => ({
      id: i.id,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      pdfUrl: i.pdfUrl,
    })),
    total,
  };
  orders.unshift(order);
  save();
  return id;
}

load();

window.ordersState = { getOrders, addOrder };
