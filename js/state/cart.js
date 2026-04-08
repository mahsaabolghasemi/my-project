/**
 * Cart: localStorage for guests; Book Store API /cart when logged in with token + API_BASE_URL.
 */
(function () {
  var STORAGE_KEY =
    typeof CONFIG !== 'undefined' ? CONFIG.CART_STORAGE_KEY : 'minishop_cart';

  /** @type {Array<{ id: string, name: string, price: number, image?: string, pdfUrl?: string, quantity: number, stock?: number }>} */
  var items = [];

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
    var n = Number(line.stock);
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
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (_) {}
  }

  function getItems() {
    return items.map(function (item) {
      return Object.assign({}, item);
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

    var qty = quantity == null || quantity < 1 ? 1 : quantity;
    var name = book.name != null ? book.name : book.title;
    var rawStock = book.stock != null && book.stock !== '' ? Number(book.stock) : NaN;
    var stockCap = Number.isFinite(rawStock) && rawStock >= 0 ? rawStock : Number.MAX_SAFE_INTEGER;

    if (usesRemoteCart()) {
      return window.bookStoreApi.addToCart(book.id, qty).then(function (cart) {
        items = window.bookStoreApi.mapCartPayload(cart);
        return enrichItemsStockIfNeeded();
      });
    }

    var existing = items.find(function (i) {
      return i.id === book.id;
    });
    var nextQty = (existing ? existing.quantity : 0) + qty;
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

  function remove(productId) {
    if (usesRemoteCart()) {
      var line = items.find(function (i) {
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

    var index = items.findIndex(function (i) {
      return i.id === productId;
    });
    if (index === -1) return Promise.resolve();
    items[index].quantity -= 1;
    if (items[index].quantity <= 0) items.splice(index, 1);
    save();
    return Promise.resolve();
  }

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

  function setQuantity(productId, quantity) {
    var line = items.find(function (i) {
      return i.id === productId;
    });
    var max = line ? effectiveStock(line) : Number.MAX_SAFE_INTEGER;
    var q = Math.min(Math.max(0, quantity), max);

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
      var existing = items.find(function (i) {
        return i.id === productId;
      });
      if (existing) existing.quantity = q;
    }
    save();
    return Promise.resolve();
  }

  function incrementQuantity(productId) {
    var line = items.find(function (i) {
      return i.id === productId;
    });
    if (!line) return Promise.resolve();
    var max = effectiveStock(line);
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
        var max = effectiveStock(item);
        if (item.quantity > max) item.quantity = max;
      });
      if (!usesRemoteCart()) save();
    });
  }

  function mergeLocalCartToServer() {
    if (typeof CONFIG === 'undefined' || !CONFIG.API_BASE_URL || !window.bookStoreApi) {
      return Promise.resolve();
    }
    var u = userState.getUser();
    if (!u || !u.token) return Promise.resolve();
    var snapshot = items.map(function (i) {
      return Object.assign({}, i);
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
})();
