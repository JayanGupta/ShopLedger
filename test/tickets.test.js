var assert = require('node:assert/strict');
var test = require('node:test');

var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');
var inventory = require('../lib/inventory');
var orders = require('../lib/orders');
var ledger = require('../lib/ledger');

test('invoice uses checkout HSN tax and capped coupon totals', function () {
  var save10Order = {
    id: 1002,
    items: [
      { id: 1, name: 'Indrayani Basmati Rice 5kg', sku: 'GRN-001', hsn: '1006', price: 640, qty: 1 },
      { id: 4, name: 'Cold-Pressed Sunflower Oil 1L', sku: 'OIL-001', hsn: '1512', price: 190, qty: 2 }
    ],
    coupon: 'SAVE10',
    total: 963.9
  };
  var expectedCheckout = pricing.computeTotals(save10Order.items, save10Order.coupon);
  var actualInvoice = invoice.computeInvoiceFigures(save10Order);

  assert.equal(actualInvoice.subtotal, 1020);
  assert.equal(actualInvoice.discount, 102);
  assert.equal(actualInvoice.tax, 45.9);
  assert.equal(actualInvoice.total, save10Order.total);
  assert.equal(actualInvoice.total, expectedCheckout.total);
  assert.equal(actualInvoice.cgst + actualInvoice.sgst, actualInvoice.tax);
  assert.doesNotMatch(invoice.render(save10Order), /Accountant Reconciliation Notice/);

  var cappedOrder = {
    items: [
      { id: 5, name: 'Cold-Pressed Groundnut Oil 5L', sku: 'OIL-002', hsn: '1508', price: 1120, qty: 2 }
    ],
    coupon: 'SAVE10'
  };
  var expected = pricing.computeTotals(cappedOrder.items, cappedOrder.coupon);
  var actual = invoice.computeInvoiceFigures(cappedOrder);

  assert.equal(actual.discount, 150);
  assert.equal(actual.tax, 104.5);
  assert.equal(actual.total, 2194.5);
  assert.equal(actual.total, expected.total);
  assert.equal(actual.rows[0].lineTax, expected.lines[0].tax);
});

test('inventory allows the exact remaining sellable quantity', function () {
  var products = [{ id: 1, name: 'Ghee', stock: 1, reserved: 0 }];
  assert.deepEqual(inventory.check(products, [{ id: 1, qty: 1 }]), { ok: true });
});

test('cancelling an order restores physical stock without changing reservations', function () {
  var db = {
    products: [{ id: 1, stock: 3, reserved: 1 }],
    orders: [{
      id: 1007,
      status: 'pending',
      paymentMode: 'cash',
      items: [{ id: 1, qty: 2 }]
    }]
  };

  var result = orders.cancel(db, 1007, 'Customer cancelled');

  assert.equal(result.ok, true);
  assert.equal(db.products[0].stock, 5);
  assert.equal(db.products[0].reserved, 1);
});

test('orders sort and filter dates chronologically', function () {
  var db = { orders: [
    { id: 1001, date: '28/12/2021' },
    { id: 1004, date: '30/01/2022' },
    { id: 1007, date: '04/03/2022' },
    { id: 1008, date: '15/03/2022' }
  ] };

  assert.deepEqual(orders.list(db, {}).map(function (order) { return order.id; }), [1008, 1007, 1004, 1001]);
  assert.deepEqual(orders.list(db, { from: '2022-01-01', to: '2022-01-31' }).map(function (order) { return order.id; }), [1004]);
});

test('settlements add numeric string amounts as numbers', function () {
  var db = {
    nextSettlementId: 501,
    customers: [{ id: 7, name: 'Meera Joshi', openingBalance: 450, totalBilled: 1982.01, totalSettled: 1200 }],
    settlements: []
  };

  var result = ledger.recordSettlement(db, 7, '500', 'upi', 'Payment');

  assert.equal(result.ok, true);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
  assert.equal(result.settlement.amount, 500);
});

test('settlements reject non-numeric amounts', function () {
  var db = { customers: [{ id: 7, totalSettled: 100 }], settlements: [], nextSettlementId: 501 };
  var result = ledger.recordSettlement(db, 7, 'not-a-number');
  assert.equal(result.ok, false);
  assert.equal(db.customers[0].totalSettled, 100);
  assert.equal(db.settlements.length, 0);
});
