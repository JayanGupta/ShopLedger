var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function computeFigures(order) {
  return {
    printed: invoice.computeInvoiceFigures(order),
    billed: pricing.computeTotals(order.items, order.coupon)
  };
}

function totals(figures) {
  return {
    subtotal: figures.subtotal,
    discount: figures.discount,
    tax: figures.tax,
    cgst: figures.cgst,
    sgst: figures.sgst,
    total: figures.total
  };
}

function invoiceLines(figures) {
  return figures.rows.map(function (row) {
    return { hsn: row.hsn, gstPercent: row.gstPercent, line: row.line, tax: row.lineTax };
  });
}

test('CURRENT BEHAVIOUR: #1001 uses the 5% and 12% HSN slabs on the invoice', function () {
  // Keep gstRate absent to model an order whose items carry HSN only.
  var figures = computeFigures({
    coupon: '',
    items: [
      { name: 'Dal', price: 165, qty: 2, hsn: '0713' },
      { name: 'Ghee', price: 280, qty: 1, hsn: '0405' }
    ]
  });

  assert.deepStrictEqual(invoiceLines(figures.printed), [
    { hsn: '0713', gstPercent: 5, line: 330, tax: 16.50 },
    { hsn: '0405', gstPercent: 12, line: 280, tax: 33.60 }
  ]);
  assert.deepStrictEqual(totals(figures.printed), {
    subtotal: 610, discount: 0, tax: 50.10, cgst: 25.05, sgst: 25.05, total: 660.10
  });
  assert.deepStrictEqual(totals(figures.billed), {
    subtotal: 610, discount: 0, tax: 50.10, cgst: 25.05, sgst: 25.05, total: 660.10
  });
});

test('CURRENT BEHAVIOUR: #1002 applies SAVE10 before invoice GST', function () {
  var figures = computeFigures({
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 640, qty: 1, hsn: '1006' },
      { name: 'Sunflower oil', price: 190, qty: 2, hsn: '1512' }
    ]
  });

  assert.deepStrictEqual(invoiceLines(figures.printed), [
    { hsn: '1006', gstPercent: 5, line: 640, tax: 28.80 },
    { hsn: '1512', gstPercent: 5, line: 380, tax: 17.10 }
  ]);
  assert.deepStrictEqual(totals(figures.printed), {
    subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90
  });
  assert.deepStrictEqual(totals(figures.billed), {
    subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90
  });
});

test('CURRENT BEHAVIOUR: #1004 applies the SAVE10 cap on a mixed-slab invoice', function () {
  var figures = computeFigures({
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 400, qty: 4, hsn: '1006' },
      { name: 'Ghee', price: 320, qty: 2, hsn: '0405' }
    ]
  });

  assert.deepStrictEqual(invoiceLines(figures.printed), [
    { hsn: '1006', gstPercent: 5, line: 1600, tax: 74.64 },
    { hsn: '0405', gstPercent: 12, line: 640, tax: 71.66 }
  ]);
  assert.deepStrictEqual(totals(figures.printed), {
    subtotal: 2240, discount: 150, tax: 146.30, cgst: 73.15, sgst: 73.15, total: 2236.30
  });
  assert.deepStrictEqual(totals(figures.billed), {
    subtotal: 2240, discount: 150, tax: 146.30, cgst: 73.15, sgst: 73.15, total: 2236.30
  });
});

test('CURRENT BEHAVIOUR: #1008 matches checkout for all-18% items without a coupon', function () {
  var figures = computeFigures({
    coupon: '',
    items: [
      { name: 'Tea', price: 140, qty: 2, hsn: '0902' },
      { name: 'Coffee', price: 240, qty: 1, hsn: '0901', gstRate: 18 }
    ]
  });

  assert.deepStrictEqual(invoiceLines(figures.printed), [
    { hsn: '0902', gstPercent: 18, line: 280, tax: 50.40 },
    { hsn: '0901', gstPercent: 18, line: 240, tax: 43.20 }
  ]);
  assert.deepStrictEqual(totals(figures.printed), {
    subtotal: 520, discount: 0, tax: 93.60, cgst: 46.80, sgst: 46.80, total: 613.60
  });
  assert.deepStrictEqual(totals(figures.billed), totals(figures.printed));
});

test('invoice matches checkout for order #1004 with capped SAVE10 and 5% GST', function () {
  var figures = computeFigures({
    coupon: 'SAVE10',
    items: [
      { name: 'Groundnut oil', price: 1120, qty: 2, hsn: '1508' }
    ]
  });

  assert.deepStrictEqual(totals(figures.billed), {
    subtotal: 2240, discount: 150, tax: 104.50, cgst: 52.25, sgst: 52.25, total: 2194.50
  });
  assert.deepStrictEqual(totals(figures.printed), totals(figures.billed));
  assert.deepStrictEqual(invoiceLines(figures.printed), [
    { hsn: '1508', gstPercent: 5, line: 2240, tax: 104.50 }
  ]);
});
