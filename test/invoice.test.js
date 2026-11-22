var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function line(id, name, price, qty, hsn, gstRate) {
  return { id: id, name: name, price: price, qty: qty, hsn: hsn, gstRate: gstRate };
}

function calculate(items, coupon) {
  return {
    invoice: invoice.computeInvoiceFigures({ items: items, coupon: coupon }),
    checkout: pricing.computeTotals(items, coupon)
  };
}

test('CURRENT BEHAVIOUR: #1001-style 5% and 12% items have matching invoice and checkout GST without a coupon', function () {
  var items = [
    line(2, 'Unpolished Toor Dal 1kg', 165, 2, '0713', 5),
    line(6, 'A2 Gir Cow Ghee 500ml', 450, 1, '0405', 12)
  ];
  var result = calculate(items, '');

  assert.deepEqual(result.invoice, {
    subtotal: 780,
    discount: 0,
    tax: 70.5,
    cgst: 35.25,
    sgst: 35.25,
    total: 850.5,
    rows: [
      { name: 'Unpolished Toor Dal 1kg', sku: '-', hsn: '0713', qty: 2, price: 165, gstPercent: 5, line: 330, lineTax: 16.5 },
      { name: 'A2 Gir Cow Ghee 500ml', sku: '-', hsn: '0405', qty: 1, price: 450, gstPercent: 12, line: 450, lineTax: 54 }
    ]
  });
  assert.equal(result.checkout.tax, result.invoice.tax);
  assert.equal(result.checkout.total, result.invoice.total);
});

test('CURRENT BEHAVIOUR: #1002-style SAVE10 invoice figures match checkout after discount-before-tax', function () {
  var items = [
    line(1, 'Indrayani Basmati Rice 5kg', 640, 1, '1006', 5),
    line(4, 'Cold-Pressed Sunflower Oil 1L', 190, 2, '1512', 5)
  ];
  var result = calculate(items, 'SAVE10');

  assert.deepEqual(result.invoice, {
    subtotal: 1020,
    discount: 102,
    tax: 45.9,
    cgst: 22.95,
    sgst: 22.95,
    total: 963.9,
    rows: [
      { name: 'Indrayani Basmati Rice 5kg', sku: '-', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
      { name: 'Cold-Pressed Sunflower Oil 1L', sku: '-', hsn: '1512', qty: 2, price: 190, gstPercent: 5, line: 380, lineTax: 17.1 }
    ]
  });
  assert.equal(result.invoice.tax, result.checkout.tax);
  assert.equal(result.invoice.total, result.checkout.total);
});

test('CURRENT BEHAVIOUR: #1004-style SAVE10 invoice figures apply the ₹150 cap before tax', function () {
  var items = [
    line(5, 'Cold-Pressed Groundnut Oil 5L', 1120, 2, '1508', 5)
  ];
  var result = calculate(items, 'SAVE10');

  assert.deepEqual(result.invoice, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      { name: 'Cold-Pressed Groundnut Oil 5L', sku: '-', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  });
  assert.equal(result.invoice.discount, result.checkout.discount);
  assert.equal(result.invoice.tax, result.checkout.tax);
  assert.equal(result.invoice.total, result.checkout.total);
});

test('CURRENT BEHAVIOUR: #1008-style all-18% items agree without a coupon', function () {
  var items = [
    line(8, 'Assam CTC Masala Chai 250g', 140, 1, '0902', 18),
    line(12, 'Kokum Sherbet Concentrate 750ml', 180, 2, '2106', 18)
  ];
  var result = calculate(items, '');

  assert.deepEqual(result.invoice, {
    subtotal: 500,
    discount: 0,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 590,
    rows: [
      { name: 'Assam CTC Masala Chai 250g', sku: '-', hsn: '0902', qty: 1, price: 140, gstPercent: 18, line: 140, lineTax: 25.2 },
      { name: 'Kokum Sherbet Concentrate 750ml', sku: '-', hsn: '2106', qty: 2, price: 180, gstPercent: 18, line: 360, lineTax: 64.8 }
    ]
  });
  assert.equal(result.checkout.tax, result.invoice.tax);
  assert.equal(result.checkout.total, result.invoice.total);
});

test('invoice matches checkout totals and HSN GST for #1004-style capped SAVE10', function () {
  var items = [
    line(5, 'Cold-Pressed Groundnut Oil 5L', 1120, 2, '1508', 5)
  ];
  var checkout = pricing.computeTotals(items, 'SAVE10');
  var invoiceFigures = invoice.computeInvoiceFigures({ items: items, coupon: 'SAVE10' });

  assert.equal(invoiceFigures.subtotal, checkout.subtotal);
  assert.equal(invoiceFigures.discount, checkout.discount);
  assert.equal(invoiceFigures.tax, checkout.tax);
  assert.equal(invoiceFigures.cgst, checkout.cgst);
  assert.equal(invoiceFigures.sgst, checkout.sgst);
  assert.equal(invoiceFigures.total, checkout.total);
  assert.equal(invoiceFigures.rows[0].gstPercent, checkout.lines[0].gstPercent);
  assert.equal(invoiceFigures.rows[0].lineTax, checkout.lines[0].tax);
});
