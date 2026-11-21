var test = require('node:test');
var assert = require('node:assert').strict;
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

test('CURRENT BEHAVIOUR: #1001 invoice uses the 5% and 12% checkout HSN slabs', function () {
  // Stored checkout lines carry HSN but omit the resolved GST rate.
  var items = [
    { id: 1, name: 'Rice', price: 200, qty: 2, hsn: '1006' },
    { id: 2, name: 'Ghee', price: 300, qty: 1, hsn: '0405' }
  ];
  var coupon = '';
  var figures = invoice.computeInvoiceFigures({ items, coupon });
  var checkout = pricing.computeTotals(items, coupon);

  assert.deepEqual(figures, {
    subtotal: 700, discount: 0, tax: 56, cgst: 28, sgst: 28, total: 756,
    rows: [
      { name: 'Rice', sku: '-', hsn: '1006', qty: 2, price: 200, gstPercent: 5, line: 400, lineTax: 20 },
      { name: 'Ghee', sku: '-', hsn: '0405', qty: 1, price: 300, gstPercent: 12, line: 300, lineTax: 36 }
    ]
  });
  assert.deepEqual(checkout.lines.map(function (line) { return line.gstPercent; }), [5, 12]);
  assert.equal(checkout.tax, 56);
  assert.equal(checkout.total, 756);
});

test('CURRENT BEHAVIOUR: #1002 invoice applies SAVE10 before GST', function () {
  var items = [{ id: 1, name: 'Rice', price: 640, qty: 1, hsn: '1006' }];
  var coupon = 'SAVE10';
  var figures = invoice.computeInvoiceFigures({ items, coupon });
  var checkout = pricing.computeTotals(items, coupon);

  assert.deepEqual(figures, {
    subtotal: 640, discount: 64, tax: 28.8, cgst: 14.4, sgst: 14.4, total: 604.8,
    rows: [
      { name: 'Rice', sku: '-', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 }
    ]
  });
  assert.equal(checkout.discount, 64);
  assert.equal(checkout.tax, 28.8);
  assert.equal(checkout.total, 604.8);
});

test('CURRENT BEHAVIOUR: #1004 invoice honors the SAVE10 cap', function () {
  var items = [{ id: 3, name: 'Coffee', price: 1120, qty: 2, hsn: '0901' }];
  var coupon = 'SAVE10';
  var figures = invoice.computeInvoiceFigures({ items, coupon });
  var checkout = pricing.computeTotals(items, coupon);

  assert.deepEqual(figures, {
    subtotal: 2240, discount: 150, tax: 376.2, cgst: 188.1, sgst: 188.1, total: 2466.2,
    rows: [
      { name: 'Coffee', sku: '-', hsn: '0901', qty: 2, price: 1120, gstPercent: 18, line: 2240, lineTax: 376.2 }
    ]
  });
  assert.equal(checkout.subtotal, 2240);
  assert.equal(checkout.discount, 150);
  assert.equal(checkout.tax, 376.2);
  assert.equal(checkout.total, 2466.2);
});

test('CURRENT BEHAVIOUR: #1008 invoice matches checkout at 18% without a coupon', function () {
  var items = [
    { id: 4, name: 'Tea', price: 250, qty: 2, hsn: '0902', gstRate: 18 },
    { id: 3, name: 'Coffee', price: 180, qty: 1, hsn: '0901' }
  ];
  var coupon = '';
  var figures = invoice.computeInvoiceFigures({ items, coupon });
  var checkout = pricing.computeTotals(items, coupon);

  assert.deepEqual(figures, {
    subtotal: 680, discount: 0, tax: 122.4, cgst: 61.2, sgst: 61.2, total: 802.4,
    rows: [
      { name: 'Tea', sku: '-', hsn: '0902', qty: 2, price: 250, gstPercent: 18, line: 500, lineTax: 90 },
      { name: 'Coffee', sku: '-', hsn: '0901', qty: 1, price: 180, gstPercent: 18, line: 180, lineTax: 32.4 }
    ]
  });
  assert.equal(checkout.discount, figures.discount);
  assert.equal(checkout.tax, figures.tax);
  assert.equal(checkout.cgst, figures.cgst);
  assert.equal(checkout.sgst, figures.sgst);
  assert.equal(checkout.total, figures.total);
});


test('invoice shows the checkout GST and capped SAVE10 amounts for #1004', function () {
  var items = [
    { id: 1, name: 'Groundnut oil', price: 1120, qty: 2, hsn: '1508' }
  ];
  var coupon = 'SAVE10';
  var checkout = pricing.computeTotals(items, coupon);
  var order = { id: 1004, items, coupon, total: checkout.total };
  var figures = invoice.computeInvoiceFigures(order);

  assert.equal(figures.subtotal, 2240);
  assert.equal(figures.discount, checkout.discount);
  assert.equal(figures.tax, checkout.tax);
  assert.equal(figures.cgst, checkout.cgst);
  assert.equal(figures.sgst, checkout.sgst);
  assert.equal(figures.total, checkout.total);
  assert.equal(figures.rows[0].gstPercent, 5);
  assert.equal(figures.rows[0].lineTax, 104.5);
  assert.match(invoice.render(order), /Invoice Total<\/td><td class="r">₹2194\.50/);
  assert.doesNotMatch(invoice.render(order), /Accountant Reconciliation Notice/);
});
