var assert = require('node:assert/strict');
var test = require('node:test');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function figuresFor(order) {
  var printed = invoice.computeInvoiceFigures(order);
  var checkout = pricing.computeTotals(order.items, order.coupon);
  return { printed: printed, checkout: checkout };
}

function amounts(figures) {
  var { subtotal, discount, tax, cgst, sgst, total } = figures;
  return { subtotal, discount, tax, cgst, sgst, total };
}

function lineGst(lines, taxField) {
  return lines.map(function (line) {
    return { rate: line.gstPercent, tax: line[taxField] };
  });
}

// Order-line snapshots omit gstRate unless a rate was explicitly stored.
test('CURRENT BEHAVIOUR: #1001 prints the 5% and 12% HSN slabs', function () {
  var { printed, checkout } = figuresFor({
    id: 1001,
    coupon: '',
    items: [
      { name: 'Rice', hsn: '1006', price: 100, qty: 2 },
      { name: 'Ghee', hsn: '0405', price: 300, qty: 1 }
    ]
  });

  assert.deepEqual(lineGst(printed.rows, 'lineTax'), [{ rate: 5, tax: 10 }, { rate: 12, tax: 36 }]);
  assert.deepEqual(lineGst(checkout.lines, 'tax'), [{ rate: 5, tax: 10 }, { rate: 12, tax: 36 }]);
  assert.deepEqual(amounts(printed), { subtotal: 500, discount: 0, tax: 46, cgst: 23, sgst: 23, total: 546 });
  assert.deepEqual(amounts(checkout), { subtotal: 500, discount: 0, tax: 46, cgst: 23, sgst: 23, total: 546 });
});

test('CURRENT BEHAVIOUR: #1002 applies SAVE10 before GST', function () {
  var { printed, checkout } = figuresFor({
    id: 1002,
    coupon: 'SAVE10',
    items: [{ name: 'Tea', hsn: '0902', price: 300, qty: 2 }]
  });

  assert.deepEqual(lineGst(printed.rows, 'lineTax'), [{ rate: 18, tax: 97.2 }]);
  assert.deepEqual(lineGst(checkout.lines, 'tax'), [{ rate: 18, tax: 97.2 }]);
  assert.deepEqual(amounts(printed), { subtotal: 600, discount: 60, tax: 97.2, cgst: 48.6, sgst: 48.6, total: 637.2 });
  assert.deepEqual(amounts(checkout), { subtotal: 600, discount: 60, tax: 97.2, cgst: 48.6, sgst: 48.6, total: 637.2 });
});

test('CURRENT BEHAVIOUR: #1004 honors the 150 rupee SAVE10 cap', function () {
  var { printed, checkout } = figuresFor({
    id: 1004,
    coupon: 'SAVE10',
    items: [{ name: 'Coffee', hsn: '0901', price: 560, qty: 4 }]
  });

  assert.deepEqual(lineGst(printed.rows, 'lineTax'), [{ rate: 18, tax: 376.2 }]);
  assert.deepEqual(lineGst(checkout.lines, 'tax'), [{ rate: 18, tax: 376.2 }]);
  assert.deepEqual(amounts(printed), { subtotal: 2240, discount: 150, tax: 376.2, cgst: 188.1, sgst: 188.1, total: 2466.2 });
  assert.deepEqual(amounts(checkout), { subtotal: 2240, discount: 150, tax: 376.2, cgst: 188.1, sgst: 188.1, total: 2466.2 });
});

test('CURRENT BEHAVIOUR: #1008 matches checkout for 18% GST without a coupon', function () {
  var { printed, checkout } = figuresFor({
    id: 1008,
    coupon: '',
    items: [
      { name: 'Tea', hsn: '0902', price: 150, qty: 2 },
      { name: 'Coffee', hsn: '0901', gstRate: 18, price: 200, qty: 1 }
    ]
  });

  var expectedLines = [{ rate: 18, tax: 54 }, { rate: 18, tax: 36 }];
  var expectedAmounts = { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 };
  assert.deepEqual(lineGst(printed.rows, 'lineTax'), expectedLines);
  assert.deepEqual(lineGst(checkout.lines, 'tax'), expectedLines);
  assert.deepEqual(amounts(printed), expectedAmounts);
  assert.deepEqual(amounts(checkout), expectedAmounts);
});

test('invoice matches checkout GST and totals for mixed slabs with capped SAVE10', function () {
  var { printed, checkout } = figuresFor({
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', hsn: '1006', price: 560, qty: 2 },
      { name: 'Ghee', hsn: '0405', price: 560, qty: 2 }
    ]
  });

  assert.deepEqual(amounts(checkout), {
    subtotal: 2240, discount: 150, tax: 177.65, cgst: 88.83, sgst: 88.82, total: 2267.65
  });
  assert.deepEqual(amounts(printed), amounts(checkout));
  assert.deepEqual(lineGst(printed.rows, 'lineTax'), [{ rate: 5, tax: 52.25 }, { rate: 12, tax: 125.4 }]);
});
