var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

var orders = {
  1001: {
    coupon: '',
    items: [
      { name: 'Assam CTC Masala Chai 250g', sku: 'BEV-001', hsn: '0902', price: 140, qty: 2 },
      { name: 'Unpolished Toor Dal 1kg', sku: 'GRN-002', hsn: '0713', price: 165, qty: 2 }
    ]
  },
  1002: {
    coupon: 'SAVE10',
    items: [
      { name: 'Indrayani Basmati Rice 5kg', sku: 'GRN-001', hsn: '1006', price: 640, qty: 1 },
      { name: 'Cold-Pressed Sunflower Oil 1L', sku: 'OIL-001', hsn: '1512', price: 190, qty: 2 }
    ]
  },
  1004: {
    coupon: 'SAVE10',
    items: [
      { name: 'Cold-Pressed Groundnut Oil 5L', sku: 'OIL-002', hsn: '1508', price: 1120, qty: 2 }
    ]
  },
  1008: {
    coupon: '',
    items: [
      { name: 'Assam CTC Masala Chai 250g', sku: 'BEV-001', hsn: '0902', price: 140, qty: 1 },
      { name: 'Kokum Sherbet Concentrate 750ml', sku: 'BEV-003', hsn: '2106', price: 180, qty: 2 }
    ]
  }
};

function figures(id) {
  var order = orders[id];
  return {
    invoice: invoice.computeInvoiceFigures(order),
    checkout: pricing.computeTotals(order.items, order.coupon)
  };
}

test('CORRECT BEHAVIOUR: #1001 invoice uses each HSN GST slab', function () {
  var result = figures(1001);
  assert.deepEqual(
    { subtotal: result.invoice.subtotal, discount: result.invoice.discount, tax: result.invoice.tax, total: result.invoice.total },
    { subtotal: 610, discount: 0, tax: 66.9, total: 676.9 }
  );
  assert.equal(result.invoice.rows[1].gstPercent, 5);
  assert.deepEqual(
    { tax: result.checkout.tax, total: result.checkout.total },
    { tax: 66.9, total: 676.9 }
  );
});

test('CORRECT BEHAVIOUR: #1002 applies SAVE10 before HSN GST', function () {
  var result = figures(1002);
  assert.deepEqual(
    { subtotal: result.invoice.subtotal, discount: result.invoice.discount, tax: result.invoice.tax, total: result.invoice.total },
    { subtotal: 1020, discount: 102, tax: 45.9, total: 963.9 }
  );
  assert.deepEqual(
    { discount: result.checkout.discount, tax: result.checkout.tax, total: result.checkout.total },
    { discount: 102, tax: 45.9, total: 963.9 }
  );
});

test('CORRECT BEHAVIOUR: #1004 respects the SAVE10 ₹150 cap before GST', function () {
  var result = figures(1004);
  assert.deepEqual(
    { subtotal: result.invoice.subtotal, discount: result.invoice.discount, tax: result.invoice.tax, total: result.invoice.total },
    { subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5 }
  );
  assert.deepEqual(
    { discount: result.checkout.discount, tax: result.checkout.tax, total: result.checkout.total },
    { discount: 150, tax: 104.5, total: 2194.5 }
  );
});

test('CURRENT BEHAVIOUR: #1008 invoice matches checkout for all-18%-GST items without a coupon', function () {
  var result = figures(1008);
  assert.deepEqual(
    { subtotal: result.invoice.subtotal, discount: result.invoice.discount, tax: result.invoice.tax, total: result.invoice.total },
    { subtotal: 500, discount: 0, tax: 90, total: 590 }
  );
  assert.deepEqual(
    { subtotal: result.checkout.subtotal, discount: result.checkout.discount, tax: result.checkout.tax, total: result.checkout.total },
    { subtotal: 500, discount: 0, tax: 90, total: 590 }
  );
});

test('#1002 invoice matches the checkout calculation with SAVE10 applied before HSN GST', function () {
  var result = figures(1002);
  assert.deepEqual(
    { subtotal: result.invoice.subtotal, discount: result.invoice.discount, tax: result.invoice.tax, total: result.invoice.total },
    { subtotal: result.checkout.subtotal, discount: result.checkout.discount, tax: result.checkout.tax, total: result.checkout.total }
  );
});
