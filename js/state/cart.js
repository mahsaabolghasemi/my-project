/**
 * Cart: localStorage for guests; Book Store API /cart when logged in with token + API_BASE_URL.
 */

/** Must be unique per file — duplicate `const` names across classic scripts break the whole page. */
const CART_STATE_STORAGE_KEY = typeof CONFIG !== 'undefined' ? CONFIG.CART_STORAGE_KEY : 'minishop_cart';

/** @type {Array<{ id: string, name: string, price: number, image?: string, pdfUrl?: string, quantity: number, stock?: number }>} */
let items = [];

function usesRemoteCart() {
  return (
    typeof CONFIG !== 'undefined' &&
    CONFIG.API_BASE_URL &&
    typeof window.bookStoreApi !== 'undefined' &&
    typeof userState !== 'undefined' &&
    userState.isLoggedIn &&
    userState.isLoggedIn() &&
    userState.getUser &&
    userState.getUser() &&
    userState.getUser().token
  );
}

function effectiveStock(line) {
  if (line.stock == null || line.stock === '') return Number.MAX_SAFE_INTEGER;
  const n = Number(line.stock);
  return Number.isFinite(n) && n >= 0 ? n : Number.MAX_SAFE_INTEGER;
}

function load() {
  try {
    if (typeof userState !== 'undefined' && userState.isLoggedIn && !userState.isLoggedIn()) {
      items = [];
      return;
    }
    if (usesRemoteCart()) {
      items = [];
      return;
    }
    const raw = localStorage.getItem(CART_STATE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) items = parsed;
    }
  } catch (_) {
    items = [];
  }
}

function save() {
  if (usesRemoteCart()) return;
  if (typeof userState !== 'undefined' && userState.isLoggedIn && !userState.isLoggedIn()) return;
  try {
    localStorage.setItem(CART_STATE_STORAGE_KEY, JSON.stringify(items));
  } catch (_) {}
}

function getItems() {
  return items.map(function (item) {
    return { ...item };
  });
}

function getCount() {
  return items.reduce(function (sum, item) {
    return sum + item.quantity;
  }, 0);
}

/**
 * @param {{ id: string, name?: string, title?: string, price: number, image?: string, coverImage?: string, pdfUrl?: string, stock?: number }} book
 * @param {number} [quantity=1]
 * @returns {Promise<void>}
 */
function add(book, quantity) {
  if (
    typeof userState === 'undefined' ||
    !userState.isLoggedIn ||
    !userState.isLoggedIn()
  ) {
    return Promise.reject(new Error('برای افزودن به سبد ابتدا وارد شوید.'));
  }

  const qty = quantity == null || quantity < 1 ? 1 : quantity;
  const name = book.name != null ? book.name : book.title;
  var rawStock = book.stock != null && book.stock !== '' ? Number(book.stock) : NaN;
  var stockCap = Number.isFinite(rawStock) && rawStock >= 0 ? rawStock : Number.MAX_SAFE_INTEGER;

  if (usesRemoteCart()) {
    return window.bookStoreApi.addToCart(book.id, qty).then(function (cart) {
      items = window.bookStoreApi.mapCartPayload(cart);
      return enrichItemsStockIfNeeded();
    });
  }

  const existing = items.find(function (i) {
    return i.id === book.id;
  });
  const nextQty = (existing ? existing.quantity : 0) + qty;
  if (nextQty > stockCap) {
    return Promise.reject(new Error('موجودی کافی نیست؛ حداکثر ' + stockCap + ' عدد مجاز است.'));
  }

  if (existing) {
    existing.quantity += qty;
    if (book.stock != null) existing.stock = Number(book.stock);
  } else {
    items.push({
      id: book.id,
      name: name,
      price: book.price,
      image: book.image || book.coverImage,
      pdfUrl: book.pdfUrl,
      quantity: qty,
      stock: book.stock != null ? Number(book.stock) : undefined,
    });
  }
  save();
  return Promise.resolve();
}

/**
 * @param {string} productId
 * @returns {Promise<void>}
 */
function remove(productId) {
  if (usesRemoteCart()) {
    const line = items.find(function (i) {
      return i.id === productId;
    });
    if (!line) return Promise.resolve();
    var next = line.quantity - 1;
    if (next <= 0) {
      return window.bookStoreApi.deleteCartItem(productId).then(function (cart) {
        items = window.bookStoreApi.mapCartPayload(cart);
        return enrichItemsStockIfNeeded();
      });
    }
    return window.bookStoreApi.updateCartItem(productId, next).then(function (cart) {
      items = window.bookStoreApi.mapCartPayload(cart);
      return enrichItemsStockIfNeeded();
    });
  }

  const index = items.findIndex(function (i) {
    return i.id === productId;
  });
  if (index === -1) return Promise.resolve();
  items[index].quantity -= 1;
  if (items[index].quantity <= 0) items.splice(index, 1);
  save();
  return Promise.resolve();
}

/**
 * حذف کامل یک خط از سبد
 * @param {string} productId
 * @returns {Promise<void>}
 */
function removeLine(productId) {
  if (usesRemoteCart()) {
    return window.bookStoreApi.deleteCartItem(productId).then(function (cart) {
      items = window.bookStoreApi.mapCartPayload(cart);
      return enrichItemsStockIfNeeded();
    });
  }
  items = items.filter(function (i) {
    return i.id !== productId;
  });
  save();
  return Promise.resolve();
}

/**
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<void>}
 */
function setQuantity(productId, quantity) {
  const line = items.find(function (i) {
    return i.id === productId;
  });
  const max = line ? effectiveStock(line) : Number.MAX_SAFE_INTEGER;
  const q = Math.min(Math.max(0, quantity), max);

  if (usesRemoteCart()) {
    if (q <= 0) {
      return window.bookStoreApi.deleteCartItem(productId).then(function (cart) {
        items = window.bookStoreApi.mapCartPayload(cart);
        return enrichItemsStockIfNeeded();
      });
    }
    return window.bookStoreApi.updateCartItem(productId, q).then(function (cart) {
      items = window.bookStoreApi.mapCartPayload(cart);
      return enrichItemsStockIfNeeded();
    });
  }

  if (q <= 0) {
    items = items.filter(function (i) {
      return i.id !== productId;
    });
  } else {
    const existing = items.find(function (i) {
      return i.id === productId;
    });
    if (existing) existing.quantity = q;
  }
  save();
  return Promise.resolve();
}

/**
 * افزایش یک واحد با رعایت سقف موجودی
 * @param {string} productId
 * @returns {Promise<void>}
 */
function incrementQuantity(productId) {
  const line = items.find(function (i) {
    return i.id === productId;
  });
  if (!line) return Promise.resolve();
  const max = effectiveStock(line);
  if (line.quantity >= max) {
    return Promise.reject(new Error('به حداکثر موجودی رسیده‌اید.'));
  }
  return setQuantity(productId, line.quantity + 1);
}

function clear() {
  items = [];
  save();
}

function syncFromServerIfNeeded() {
  if (!usesRemoteCart()) return Promise.resolve();
  return window.bookStoreApi
    .getCart()
    .then(function (cart) {
      items = window.bookStoreApi.mapCartPayload(cart);
      return enrichItemsStockIfNeeded();
    })
    .catch(function () {
      items = [];
    });
}

/**
 * پر کردن فیلد stock برای آیتم‌های سبد از API (برای سقف موجودی در UI)
 * @returns {Promise<void>}
 */
function enrichItemsStockIfNeeded() {
  if (typeof CONFIG === 'undefined' || !CONFIG.API_BASE_URL || !window.bookStoreApi) {
    return Promise.resolve();
  }
  return Promise.all(
    items.map(function (item) {
      return window.bookStoreApi.getBookById(item.id).then(function (book) {
        if (book && book.stock != null) {
          item.stock = book.stock;
        }
      });
    })
  ).then(function () {
    items.forEach(function (item) {
      const max = effectiveStock(item);
      if (item.quantity > max) item.quantity = max;
    });
    if (!usesRemoteCart()) save();
  });
}

function mergeLocalCartToServer() {
  if (typeof CONFIG === 'undefined' || !CONFIG.API_BASE_URL || !window.bookStoreApi) {
    return Promise.resolve();
  }
  const u = userState.getUser();
  if (!u || !u.token) return Promise.resolve();
  const snapshot = items.map(function (i) {
    return { ...i };
  });
  if (snapshot.length === 0) return syncFromServerIfNeeded();
  return snapshot
    .reduce(function (chain, line) {
      return chain.then(function () {
        return window.bookStoreApi.addToCart(line.id, line.quantity);
      });
    }, Promise.resolve())
    .then(function () {
      return syncFromServerIfNeeded();
    })
    .catch(function () {
      return syncFromServerIfNeeded();
    });
}

load();

var cartReady = Promise.resolve();
if (typeof window !== 'undefined' && usesRemoteCart()) {
  cartReady = syncFromServerIfNeeded()
    .then(function () {
      if (window.header && header.updateBadge) header.updateBadge();
    })
    .catch(function () {});
}

window.cart = {
  getItems: getItems,
  getCount: getCount,
  add: add,
  remove: remove,
  removeLine: removeLine,
  setQuantity: setQuantity,
  incrementQuantity: incrementQuantity,
  clear: clear,
  syncFromServerIfNeeded: syncFromServerIfNeeded,
  enrichItemsStockIfNeeded: enrichItemsStockIfNeeded,
  mergeLocalCartToServer: mergeLocalCartToServer,
  ready: cartReady,
};
