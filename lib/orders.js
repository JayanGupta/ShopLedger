var dates = require('./dates');
var inventory = require('./inventory');
var ledger = require('./ledger');

function parseDateValue(value) {
  if (typeof value !== 'string') return null;

  var match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  var day;
  var month;
  var year;

  if (match) {
    day = Number(match[1]);
    month = Number(match[2]);
    year = Number(match[3]);
  } else {
    match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    year = Number(match[1]);
    month = Number(match[2]);
    day = Number(match[3]);
  }

  var timestamp = Date.UTC(year, month - 1, day);
  var date = new Date(timestamp);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return timestamp;
}

exports.add = function (db, orderData) {
  var order = {
    id: db.nextOrderId++,
    date: orderData.date || dates.today(),
    customer: orderData.customer || 'Walk-in',
    customerId: orderData.customerId || null,
    paymentMode: orderData.paymentMode || 'cash',
    status: orderData.status || 'completed',
    items: orderData.items || [],
    coupon: orderData.coupon || '',
    subtotal: orderData.subtotal,
    discount: orderData.discount,
    tax: orderData.tax,
    total: orderData.total
  };

  db.orders.push(order);
  return order;
};

exports.get = function (db, id) {
  for (var i = 0; i < db.orders.length; i++) {
    if (db.orders[i].id == id) return db.orders[i];
  }
  return null;
};

// Added Aug 2021 (Rohit): cancel an order and release its inventory
exports.cancel = function (db, id, reason) {
  var order = exports.get(db, id);
  if (!order) return { ok: false, error: 'Order not found' };
  if (order.status === 'cancelled') {
    return { ok: false, error: 'Order #' + order.id + ' is already cancelled' };
  }

  order.status = 'cancelled';
  order.cancelledAt = dates.today();
  order.cancelReason = reason || 'Cancelled by operator';

  // Return items to stock
  inventory.release(db.products, order.items);

  // If billed to customer khata, reverse the debit on their credit account
  if (order.paymentMode === 'khata' && order.customerId) {
    ledger.reverseOrderDebit(db, order.customerId, order.total);
  }

  return { ok: true, order: order };
};

// Lists orders with optional search, status, and date range filters (newest first)
exports.list = function (db, filters) {
  var opts = filters || {};
  var list = db.orders.slice();

  if (opts.status && opts.status !== 'all') {
    list = list.filter(function (o) {
      return (o.status || 'completed') === opts.status;
    });
  }

  if (opts.search) {
    var q = String(opts.search).toLowerCase().trim();
    list = list.filter(function (o) {
      var idMatch = String(o.id).indexOf(q) !== -1;
      var custMatch = String(o.customer || 'Walk-in').toLowerCase().indexOf(q) !== -1;
      var couponMatch = String(o.coupon || '').toLowerCase().indexOf(q) !== -1;
      return idMatch || custMatch || couponMatch;
    });
  }

  var fromDate = parseDateValue(opts.from);
  if (fromDate !== null) {
    list = list.filter(function (o) {
      var orderDate = parseDateValue(o.date);
      return orderDate !== null && orderDate >= fromDate;
    });
  }

  var toDate = parseDateValue(opts.to);
  if (toDate !== null) {
    list = list.filter(function (o) {
      var orderDate = parseDateValue(o.date);
      return orderDate !== null && orderDate <= toDate;
    });
  }

  // newest first
  return list.sort(function (a, b) {
    var aDate = parseDateValue(a.date);
    var bDate = parseDateValue(b.date);
    if (aDate === null || bDate === null || aDate === bDate) return 0;
    return aDate < bDate ? 1 : -1;
  });
};
