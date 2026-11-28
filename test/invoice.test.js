// Characterization tests for Ticket 1 — invoice vs checkout totals.
// These tests pin what the code does TODAY, including behaviour that
// looks wrong. They use in-memory orders modelled on real orders
// #1001, #1002, #1004 and #1008. They never read or write data/db.json.
//
// Run with: node --test
//
// Summary table (characterization, as first written before the fix):
//   test name                                              | what it pinned                                                      | looked wrong
//   CURRENT BEHAVIOUR: invoice for #1001 taxes all at 18%  | invoice ignores HSN slabs when gstRate is absent (tax ₹109.80)      | yes
//   CURRENT BEHAVIOUR: invoice for #1002 (SAVE10)          | invoice tax ₹183.60, discount on subtotal+tax ₹120.36, total ₹1,083.24 | yes
//   CURRENT BEHAVIOUR: invoice for #1004 ignores ₹150 cap  | invoice discount ₹264.32 instead of capped ₹150                     | yes
//   invoice for #1008 matches checkout                     | all-18% order with no coupon: both total ₹590.00                    | no
//   checkout (pricing) figures for the same orders         | the billed amounts the invoice should reproduce                     | no
// After the fix, the three CURRENT BEHAVIOUR tests were updated to pin
// the corrected figures, and a final test asserts the invoice matches
// checkout for every modelled order.

var test = require('node:test');
var assert = require('node:assert');

var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

// In-memory orders modelled on the real orders in data/db.json.
// Line items carry exactly the fields the stored orders carry:
// id, sku, name, hsn, price, qty — note there is NO gstRate field.
var ORDER_1001 = {
  id: 1001,
  coupon: null,
  items: [
    { id: 8, sku: 'BEV-001', name: 'Assam CTC Masala Chai 250g', hsn: '0902', price: 140, qty: 2 },
    { id: 2, sku: 'GRN-002', name: 'Unpolished Toor Dal 1kg', hsn: '0713', price: 165, qty: 2 }
  ]
};

var ORDER_1002 = {
  id: 1002,
  coupon: 'SAVE10',
  items: [
    { id: 1, sku: 'GRN-001', name: 'Indrayani Basmati Rice 5kg', hsn: '1006', price: 640, qty: 1 },
    { id: 4, sku: 'OIL-001', name: 'Cold-Pressed Sunflower Oil 1L', hsn: '1512', price: 190, qty: 2 }
  ]
};

var ORDER_1004 = {
  id: 1004,
  coupon: 'SAVE10',
  items: [
    { id: 5, sku: 'OIL-002', name: 'Cold-Pressed Groundnut Oil 5L', hsn: '1508', price: 1120, qty: 2 }
  ]
};

var ORDER_1008 = {
  id: 1008,
  coupon: null,
  items: [
    { id: 8, sku: 'BEV-001', name: 'Assam CTC Masala Chai 250g', hsn: '0902', price: 140, qty: 1 },
    { id: 12, sku: 'BEV-003', name: 'Kokum Sherbet Concentrate 750ml', hsn: '2106', price: 180, qty: 2 }
  ]
};

// The three tests below were updated after the Ticket 1 fix. They
// originally pinned the buggy invoice figures as CURRENT BEHAVIOUR
// (tax ₹109.80 / total ₹719.80 for #1001; tax ₹183.60, discount ₹120.36,
// total ₹1,083.24 for #1002; discount ₹264.32, total ₹2,378.88 for
// #1004). They now pin the corrected figures, which equal checkout.

test('invoice for #1001 taxes each line at its HSN slab (18% chai, 5% dal)', function () {
  var fig = invoice.computeInvoiceFigures(ORDER_1001);
  assert.strictEqual(fig.subtotal, 610);
  assert.strictEqual(fig.discount, 0);
  assert.strictEqual(fig.tax, 66.90);
  assert.strictEqual(fig.total, 676.90);
});

test('invoice for #1002 (SAVE10) discounts the subtotal and taxes the post-discount value', function () {
  var fig = invoice.computeInvoiceFigures(ORDER_1002);
  assert.strictEqual(fig.subtotal, 1020);
  assert.strictEqual(fig.discount, 102);
  assert.strictEqual(fig.tax, 45.90);
  assert.strictEqual(fig.total, 963.90);
});

test('invoice for #1004 applies the SAVE10 max-discount cap of ₹150', function () {
  var fig = invoice.computeInvoiceFigures(ORDER_1004);
  assert.strictEqual(fig.subtotal, 2240);
  assert.strictEqual(fig.discount, 150);
  assert.strictEqual(fig.tax, 104.50);
  assert.strictEqual(fig.total, 2194.50);
});

test('invoice for #1008 (all 18%, no coupon) matches checkout today', function () {
  var fig = invoice.computeInvoiceFigures(ORDER_1008);
  var billed = pricing.computeTotals(ORDER_1008.items, ORDER_1008.coupon);
  assert.strictEqual(fig.subtotal, 500);
  assert.strictEqual(fig.tax, 90);
  assert.strictEqual(fig.total, 590);
  assert.strictEqual(fig.total, billed.total);
});

test('checkout (pricing) figures for the modelled orders are the billed amounts', function () {
  var b1001 = pricing.computeTotals(ORDER_1001.items, ORDER_1001.coupon);
  assert.strictEqual(b1001.tax, 66.90);
  assert.strictEqual(b1001.total, 676.90);

  var b1002 = pricing.computeTotals(ORDER_1002.items, ORDER_1002.coupon);
  assert.strictEqual(b1002.discount, 102);
  assert.strictEqual(b1002.tax, 45.90);
  assert.strictEqual(b1002.total, 963.90);

  var b1004 = pricing.computeTotals(ORDER_1004.items, ORDER_1004.coupon);
  assert.strictEqual(b1004.discount, 150);
  assert.strictEqual(b1004.tax, 104.50);
  assert.strictEqual(b1004.total, 2194.50);
});

test('invoice figures match checkout figures for every modelled order', function () {
  [ORDER_1001, ORDER_1002, ORDER_1004, ORDER_1008].forEach(function (order) {
    var fig = invoice.computeInvoiceFigures(order);
    var billed = pricing.computeTotals(order.items, order.coupon);
    assert.strictEqual(fig.subtotal, billed.subtotal, 'subtotal, order ' + order.id);
    assert.strictEqual(fig.discount, billed.discount, 'discount, order ' + order.id);
    assert.strictEqual(fig.tax, billed.tax, 'tax, order ' + order.id);
    assert.strictEqual(fig.total, billed.total, 'total, order ' + order.id);
  });
});
