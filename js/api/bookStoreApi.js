/**
 * Book Store API client (OpenAPI-compatible).
 * Expects CONFIG.API_BASE_URL (no trailing slash required).
 * Authenticated requests send Authorization: Bearer <token> by default.
 */

(function () {
  function baseUrl() {
    return (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL
      ? String(CONFIG.API_BASE_URL)
      : ''
    ).replace(/\/$/, '');
  }

  function authHeaderValue(token) {
    if (!token) return null;
    const prefix =
      typeof CONFIG !== 'undefined' && CONFIG.API_AUTH_TOKEN_PREFIX != null
        ? CONFIG.API_AUTH_TOKEN_PREFIX
        : 'Bearer ';
    return prefix ? prefix.replace(/\s+$/, '') + ' ' + token : token;
  }

  function authHeaders(token) {
    const name =
      typeof CONFIG !== 'undefined' && CONFIG.API_AUTH_HEADER
        ? CONFIG.API_AUTH_HEADER
        : 'Authorization';
    const h = { 'Content-Type': 'application/json' };
    const v = authHeaderValue(token);
    if (v) h[name] = v;
    return h;
  }

  function getToken() {
    if (typeof userState === 'undefined' || !userState.getUser) return null;
    const u = userState.getUser();
    return u && u.token ? u.token : null;
  }

  async function parseBody(res) {
    const text = await res.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch (_) {
      return {};
    }
  }

  /**
   * API may return snake_case (is_deleted) per OpenAPI Book schema.
   */
  function rawDeletedFlag(b) {
    if (!b) return 0;
    var v = b.is_deleted != null ? b.is_deleted : b.isDeleted;
    return Number(v) === 1 ? 1 : 0;
  }

  function normalizeBook(b) {
    if (!b) return null;
    if (rawDeletedFlag(b) === 1) return null;
    const root = baseUrl();
    const id = String(b.id);
    let coverImage = b.image || '';
    if (coverImage && !/^https?:\/\//i.test(coverImage)) {
      coverImage = root + '/' + String(coverImage).replace(/^\//, '');
    }
    if (!coverImage) {
      coverImage = 'https://placehold.co/400x600/cccccc/666666?text=Book';
    }
    return {
      id: id,
      title: b.title,
      author: b.author,
      price: Number(b.price) || 0,
      coverImage: coverImage,
      genre: b.category || '',
      description: b.description || '',
      pdfUrl: '#',
      stock: typeof b.stock === 'number' ? b.stock : b.stock != null ? Number(b.stock) : undefined,
      isDeleted: rawDeletedFlag(b),
    };
  }

  /**
   * LoginResponse: { message, token, user } — some servers use access_token or nest data.
   */
  function extractLoginPayload(data) {
    if (!data || typeof data !== 'object') {
      return { token: null, user: {}, message: '' };
    }
    var token =
      data.token ||
      data.access_token ||
      data.accessToken ||
      data.sessionToken ||
      (data.data && (data.data.token || data.data.access_token));
    if (token != null && token !== '') {
      token = String(token).trim();
    } else {
      token = null;
    }
    var user = data.user;
    if (!user && data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
      user = data.data.user || data.data;
    }
    if (!user || typeof user !== 'object') {
      user = {};
    }
    if (user && Object.keys(user).length === 0 && (data.id != null || data.username)) {
      user = { id: data.id, username: data.username };
    }
    return {
      token: token,
      user: user,
      message: data.message || '',
    };
  }

  function mapCartPayload(apiCart) {
    if (!apiCart || !Array.isArray(apiCart.items)) return [];
    return apiCart.items.map(function (line) {
      return {
        id: String(line.bookId),
        name: line.title,
        price: Number(line.price) || 0,
        quantity: Number(line.quantity) || 0,
        image: undefined,
        pdfUrl: '#',
      };
    });
  }

  function mapOrder(apiOrder) {
    if (!apiOrder) return null;
    return {
      id: String(apiOrder.id),
      date: apiOrder.createdAt || new Date().toISOString(),
      total: Number(apiOrder.grandTotal) || 0,
      items: (apiOrder.items || []).map(function (i) {
        return {
          id: String(i.bookId),
          name: i.title,
          price: Number(i.price) || 0,
          quantity: Number(i.quantity) || 0,
          pdfUrl: '#',
        };
      }),
    };
  }

  var FETCH_TIMEOUT_MS = 15000;

  function fetchWithTimeout(url, options) {
    var controller = new AbortController();
    var timerId = setTimeout(function () { controller.abort(); }, FETCH_TIMEOUT_MS);
    var opts = Object.assign({}, options, { signal: controller.signal });
    return fetch(url, opts)
      .then(function (res) { clearTimeout(timerId); return res; })
      .catch(function (err) {
        clearTimeout(timerId);
        if (err && err.name === 'AbortError') {
          throw new Error('سرور پاسخ نمی‌دهد. اتصال شبکه را بررسی کنید.');
        }
        throw new Error('خطای شبکه: سرور در دسترس نیست.');
      });
  }

  /**
   * @param {string} username
   * @param {string} password
   */
  function login(username, password) {
    return fetchWithTimeout(baseUrl() + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ username: username, password: password }),
    }).then(async function (res) {
      const data = await parseBody(res);
      if (!res.ok) {
        throw new Error(data.message || 'ورود ناموفق بود.');
      }
      const parsed = extractLoginPayload(data);
      if (!parsed.token) {
        console.warn('[bookStoreApi] Login 200 but no token in response:', data);
      }
      return parsed;
    });
  }

  function logoutRemote() {
    const t = getToken();
    if (!t) return Promise.resolve();
    return fetchWithTimeout(baseUrl() + '/auth/logout', {
      method: 'POST',
      headers: authHeaders(t),
    }).then(function () {});
  }

  function getBooks() {
    return fetch(baseUrl() + '/books')
      .then(async function (res) {
        const data = await parseBody(res);
        if (!res.ok) {
          throw new Error(data.message || 'بارگذاری کتاب‌ها ناموفق بود.');
        }
        const list = data.data;
        if (!Array.isArray(list)) return [];
        return list.map(normalizeBook).filter(Boolean);
      });
  }

  function searchBooks(query) {
    var q = (query || '').trim();
    var url = baseUrl() + '/books';
    if (q) url += '?q=' + encodeURIComponent(q);
    return fetch(url).then(async function (res) {
      if (res.status === 404) return [];
      const data = await parseBody(res);
      if (!res.ok) {
        throw new Error(data.message || 'جستجو ناموفق بود.');
      }
      const list = data.data;
      if (!Array.isArray(list)) return [];
      return list.map(normalizeBook).filter(Boolean);
    });
  }

  function getBookById(id) {
    return fetch(baseUrl() + '/books/' + encodeURIComponent(id))
      .then(async function (res) {
        if (res.status === 404) return null;
        const data = await parseBody(res);
        if (!res.ok) {
          throw new Error(data.message || 'کتاب یافت نشد.');
        }
        return normalizeBook(data.data);
      });
  }

  function getCart() {
    const t = getToken();
    if (!t) return Promise.reject(new Error('نیاز به ورود'));
    return fetch(baseUrl() + '/cart', { headers: authHeaders(t) }).then(async function (res) {
      const data = await parseBody(res);
      if (!res.ok) {
        throw new Error(data.message || 'سبد در دسترس نیست.');
      }
      return data.cart;
    });
  }

  function addToCart(bookId, quantity) {
    const t = getToken();
    if (!t) return Promise.reject(new Error('نیاز به ورود'));
    return fetch(baseUrl() + '/cart', {
      method: 'POST',
      headers: authHeaders(t),
      body: JSON.stringify({ bookId: Number(bookId), quantity: quantity }),
    }).then(async function (res) {
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data.message || 'افزودن به سبد ناموفق بود.');
      return data.cart;
    });
  }

  function updateCartItem(bookId, quantity) {
    const t = getToken();
    if (!t) return Promise.reject(new Error('نیاز به ورود'));
    return fetch(baseUrl() + '/cart/' + encodeURIComponent(bookId), {
      method: 'PUT',
      headers: authHeaders(t),
      body: JSON.stringify({ quantity: quantity }),
    }).then(async function (res) {
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data.message || 'به‌روزرسانی سبد ناموفق بود.');
      return data.cart;
    });
  }

  function deleteCartItem(bookId) {
    const t = getToken();
    if (!t) return Promise.reject(new Error('نیاز به ورود'));
    return fetch(baseUrl() + '/cart/' + encodeURIComponent(bookId), {
      method: 'DELETE',
      headers: authHeaders(t),
    }).then(async function (res) {
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data.message || 'حذف از سبد ناموفق بود.');
      return data.cart;
    });
  }

  function createOrder() {
    const t = getToken();
    if (!t) return Promise.reject(new Error('نیاز به ورود'));
    return fetch(baseUrl() + '/orders', {
      method: 'POST',
      headers: authHeaders(t),
    }).then(async function (res) {
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data.message || 'ثبت سفارش ناموفق بود.');
      return data;
    });
  }

  function listOrders() {
    const t = getToken();
    if (!t) return Promise.reject(new Error('نیاز به ورود'));
    return fetch(baseUrl() + '/orders', { headers: authHeaders(t) }).then(async function (res) {
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data.message || 'دریافت سفارش‌ها ناموفق بود.');
      return Array.isArray(data.orders) ? data.orders : [];
    });
  }

  function getOrderById(orderId) {
    const t = getToken();
    if (!t) return Promise.reject(new Error('نیاز به ورود'));
    return fetch(baseUrl() + '/orders/' + encodeURIComponent(orderId), {
      headers: authHeaders(t),
    }).then(async function (res) {
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data.message || 'سفارش یافت نشد.');
      return data.order;
    });
  }

  window.bookStoreApi = {
    baseUrl: baseUrl,
    extractLoginPayload: extractLoginPayload,
    normalizeBook: normalizeBook,
    mapCartPayload: mapCartPayload,
    mapOrder: mapOrder,
    login: login,
    logoutRemote: logoutRemote,
    getBooks: getBooks,
    searchBooks: searchBooks,
    getBookById: getBookById,
    getCart: getCart,
    addToCart: addToCart,
    updateCartItem: updateCartItem,
    deleteCartItem: deleteCartItem,
    createOrder: createOrder,
    listOrders: listOrders,
    getOrderById: getOrderById,
  };
})();
