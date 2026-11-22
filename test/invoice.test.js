var test = require('node:test');
var assert = require('node:assert');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function item(name, sku, hsn, gstRate, price, qty) {
  return { name: name, sku: sku, hsn: hsn, gstRate: gstRate, price: price, qty: qty };
}

function figures(order) {
  return invoice.computeInvoiceFigures(order);
}

function billed(order) {
  return pricing.computeTotals(order.items, order.coupon);
}

test('CURRENT BEHAVIOUR: #1001 invoice uses explicit 5% and 12% GST with no coupon', function () {
  var order = { coupon: '', items: [
    item('Assam CTC Masala Chai 250g', 'BEV-001', '0902', 12, 140, 2),
    item('Unpolished Toor Dal 1kg', 'GRN-002', '0713', 5, 165, 2)
  ] };
  var inv = figures(order);
  var checkout = billed(order);

  assert.deepStrictEqual({ subtotal: inv.subtotal, discount: inv.discount, tax: inv.tax, cgst: inv.cgst, sgst: inv.sgst, total: inv.total },
    { subtotal: 610, discount: 0, tax: 50.1, cgst: 25.05, sgst: 25.05, total: 660.1 });
  assert.deepStrictEqual(inv.rows.map(function (row) { return [row.hsn, row.gstPercent, row.lineTax]; }), [['0902', 12, 33.6], ['0713', 5, 16.5]]);
  assert.deepStrictEqual({ discount: checkout.discount, tax: checkout.tax, total: checkout.total }, { discount: 0, tax: 50.1, total: 660.1 });
});

test('CURRENT BEHAVIOUR: #1002 SAVE10 invoice matches checkout after pre-tax discount', function () {
  var order = { coupon: 'SAVE10', items: [
    item('Indrayani Basmati Rice 5kg', 'GRN-001', '1006', 5, 640, 1),
    item('Cold-Pressed Sunflower Oil 1L', 'OIL-001', '1512', 5, 190, 2)
  ] };
  var inv = figures(order);
  var checkout = billed(order);

  assert.deepStrictEqual({ subtotal: inv.subtotal, discount: inv.discount, tax: inv.tax, cgst: inv.cgst, sgst: inv.sgst, total: inv.total },
    { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 });
  assert.deepStrictEqual({ discount: checkout.discount, tax: checkout.tax, total: checkout.total }, { discount: 102, tax: 45.9, total: 963.9 });
});

test('CURRENT BEHAVIOUR: #1004 SAVE10 invoice applies the 150 rupee discount cap', function () {
  var order = { coupon: 'SAVE10', items: [
    item('Cold-Pressed Groundnut Oil 5L', 'OIL-002', '1508', 5, 1120, 2)
  ] };
  var inv = figures(order);
  var checkout = billed(order);

  assert.deepStrictEqual({ subtotal: inv.subtotal, discount: inv.discount, tax: inv.tax, cgst: inv.cgst, sgst: inv.sgst, total: inv.total },
    { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 });
  assert.deepStrictEqual({ discount: checkout.discount, tax: checkout.tax, total: checkout.total }, { discount: 150, tax: 104.5, total: 2194.5 });
});

test('CURRENT BEHAVIOUR: #1008 all-18-percent, no-coupon invoice matches checkout', function () {
  var order = { coupon: '', items: [
    item('Assam CTC Masala Chai 250g', 'BEV-001', '0902', 18, 140, 1),
    item('Kokum Sherbet Concentrate 750ml', 'BEV-003', '2106', 18, 180, 2)
  ] };
  var inv = figures(order);
  var checkout = billed(order);

  assert.deepStrictEqual({ subtotal: inv.subtotal, discount: inv.discount, tax: inv.tax, cgst: inv.cgst, sgst: inv.sgst, total: inv.total },
    { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 });
  assert.deepStrictEqual({ discount: checkout.discount, tax: checkout.tax, total: checkout.total }, { discount: 0, tax: 90, total: 590 });
});

test('invoice shows the same capped coupon total and GST as checkout', function () {
  var order = { coupon: 'SAVE10', items: [
    item('Cold-Pressed Groundnut Oil 5L', 'OIL-002', '1508', 5, 1120, 2)
  ] };
  var inv = figures(order);
  var checkout = billed(order);

  assert.deepStrictEqual(
    { subtotal: inv.subtotal, discount: inv.discount, tax: inv.tax, cgst: inv.cgst, sgst: inv.sgst, total: inv.total },
    { subtotal: checkout.subtotal, discount: checkout.discount, tax: checkout.tax, cgst: checkout.cgst, sgst: checkout.sgst, total: checkout.total }
  );
});
