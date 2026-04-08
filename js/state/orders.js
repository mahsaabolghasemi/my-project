/**
 * Order history state: persisted in localStorage.
 */
(function () {
  var STORAGE_KEY =
    typeof CONFIG !== 'undefined' ? CONFIG.ORDERS_STORAGE_KEY : 'minishop_orders';

  var orders = [];

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) orders = parsed;
      }
    } catch (_) {
      orders = [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch (_) {}
  }

  function getOrders() {
    return orders.map(function (o) {
      return Object.assign({}, o, {
        items: o.items.map(function (i) {
          return Object.assign({}, i);
        }),
      });
    });
  }

  /**
   * @param {Array<{ id: string, name: string, price: number, quantity: number, pdfUrl?: string }>} orderItems
   * @param {number} total
   * @returns {string} order id
   */
  function addOrder(orderItems, total) {
    var id = 'ord_' + Date.now();
    var order = {
      id: id,
      date: new Date().toISOString(),
      items: orderItems.map(function (i) {
        return {
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          pdfUrl: i.pdfUrl,
        };
      }),
      total: total,
    };
    orders.unshift(order);
    save();
    return id;
  }

  load();

  window.ordersState = { getOrders: getOrders, addOrder: addOrder };
})();
