var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function line(id, sku, name, hsn, price, qty) {
  return { id: id, sku: sku, name: name, hsn: hsn, price: price, qty: qty };
}

var tea = line(8, 'BEV-001', 'Assam CTC Masala Chai 250g', '0902', 140, 1);
var rice = line(1, 'GRN-001', 'Indrayani Basmati Rice 5kg', '1006', 640, 1);
var sunflower = line(4, 'OIL-001', 'Cold-Pressed Sunflower Oil 1L', '1512', 190, 2);
var groundnut = line(5, 'OIL-002', 'Cold-Pressed Groundnut Oil 5L', '1508', 1120, 2);
var ghee = line(6, 'DRY-001', 'A2 Gir Cow Ghee 500ml', '0405', 450, 2);
var save10Order = { id: 1002, items: [rice, sunflower], coupon: 'SAVE10' };

function amounts(result) {
  return {
    subtotal: result.subtotal,
    discount: result.discount,
    tax: result.tax,
    total: result.total
  };
}

function check(order, expectedInvoice, expectedCheckout, expectedRates) {
  var printed = invoice.computeInvoiceFigures(order);
  assert.deepEqual(amounts(printed), expectedInvoice);
  assert.deepEqual(amounts(pricing.computeTotals(order.items, order.coupon)), expectedCheckout);
  assert.deepEqual(printed.rows.map(function (row) { return row.gstPercent; }), expectedRates);
}

test('CURRENT BEHAVIOUR: #1001 taxes the 5% dal at 18% on the invoice', function () {
  var order = {
    id: 1001,
    items: [
      Object.assign({}, tea, { qty: 2 }),
      line(2, 'GRN-002', 'Unpolished Toor Dal 1kg', '0713', 165, 2)
    ]
  };
  check(order,
    { subtotal: 610, discount: 0, tax: 109.80, total: 719.80 },
    { subtotal: 610, discount: 0, tax: 66.90, total: 676.90 },
    [18, 18]);
});

test('CURRENT BEHAVIOUR: #1002 invoices GST before applying SAVE10', function () {
  check(save10Order,
    { subtotal: 1020, discount: 120.36, tax: 183.60, total: 1083.24 },
    { subtotal: 1020, discount: 102, tax: 45.90, total: 963.90 },
    [18, 18]);
});

test('CURRENT BEHAVIOUR: #1004 ignores the ₹150 SAVE10 cap', function () {
  check({ id: 1004, items: [groundnut], coupon: 'SAVE10' },
    { subtotal: 2240, discount: 264.32, tax: 403.20, total: 2378.88 },
    { subtotal: 2240, discount: 150, tax: 104.50, total: 2194.50 },
    [18]);
});

test('CURRENT BEHAVIOUR: #1007 invoices both 5% and 12% items at 18%', function () {
  check({ id: 1007, items: [ghee, sunflower] },
    { subtotal: 1280, discount: 0, tax: 230.40, total: 1510.40 },
    { subtotal: 1280, discount: 0, tax: 127, total: 1407 },
    [18, 18]);
});

test('#1008 agrees with checkout for 18% items without a coupon', function () {
  var sherbet = line(12, 'BEV-003', 'Kokum Sherbet Concentrate 750ml', '2106', 180, 2);
  var expected = { subtotal: 500, discount: 0, tax: 90, total: 590 };
  check({ id: 1008, items: [tea, sherbet] }, expected, expected, [18, 18]);
});
