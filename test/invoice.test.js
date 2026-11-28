var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function figures(result) {
  return {
    subtotal: result.subtotal,
    discount: result.discount,
    tax: result.tax,
    cgst: result.cgst,
    sgst: result.sgst,
    total: result.total
  };
}

function invoiceRows(result) {
  return result.rows.map(function (row) {
    return { hsn: row.hsn, gross: row.line, rate: row.gstPercent, tax: row.lineTax };
  });
}

test('invoice matches checkout for mixed HSN slabs and a capped coupon', function () {
  var order = {
    items: [
      { name: 'Rice', hsn: '1006', price: 1000, qty: 1 },
      { name: 'Ghee', hsn: '0405', price: 500, qty: 2 }
    ],
    coupon: 'SAVE10'
  };
  var billed = pricing.computeTotals(order.items, order.coupon);
  var printed = invoice.computeInvoiceFigures(order);

  assert.deepEqual(figures(billed), {
    subtotal: 2000, discount: 150, tax: 157.25, cgst: 78.63, sgst: 78.62, total: 2007.25
  });
  assert.deepEqual(figures(printed), figures(billed));
  assert.deepEqual(invoiceRows(printed), [
    { hsn: '1006', gross: 1000, rate: 5, tax: 46.25 },
    { hsn: '0405', gross: 1000, rate: 12, tax: 111 }
  ]);
});

// Orders with HSN-only lines omit gstRate so both calculators receive
// the same order shape and can resolve the missing rate independently.
test('CURRENT BEHAVIOUR: #1001 invoices each item at its HSN rate', function () {
  var order = {
    items: [
      { name: 'Rice', hsn: '1006', price: 90, qty: 1 },
      { name: 'Ghee', hsn: '0405', price: 260, qty: 2 }
    ],
    coupon: ''
  };
  var printed = invoice.computeInvoiceFigures(order);
  var billed = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(figures(printed), {
    subtotal: 610, discount: 0, tax: 66.9, cgst: 33.45, sgst: 33.45, total: 676.9
  });
  assert.deepEqual(invoiceRows(printed), [
    { hsn: '1006', gross: 90, rate: 5, tax: 4.5 },
    { hsn: '0405', gross: 520, rate: 12, tax: 62.4 }
  ]);
  assert.deepEqual(figures(billed), {
    subtotal: 610, discount: 0, tax: 66.9, cgst: 33.45, sgst: 33.45, total: 676.9
  });
});

test('CURRENT BEHAVIOUR: #1002 applies SAVE10 before GST', function () {
  var order = {
    items: [{ name: 'Rice', hsn: '1006', price: 510, qty: 2 }],
    coupon: 'SAVE10'
  };
  var printed = invoice.computeInvoiceFigures(order);
  var billed = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(figures(printed), {
    subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9
  });
  assert.deepEqual(invoiceRows(printed), [
    { hsn: '1006', gross: 1020, rate: 5, tax: 45.9 }
  ]);
  assert.deepEqual(figures(billed), {
    subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9
  });
});

test('CURRENT BEHAVIOUR: #1004 caps SAVE10 at 150 rupees', function () {
  var order = {
    items: [{ name: 'Groundnut oil', hsn: '1508', price: 1120, qty: 2 }],
    coupon: 'SAVE10'
  };
  var printed = invoice.computeInvoiceFigures(order);
  var billed = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(figures(printed), {
    subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5
  });
  assert.deepEqual(invoiceRows(printed), [
    { hsn: '1508', gross: 2240, rate: 5, tax: 104.5 }
  ]);
  assert.deepEqual(figures(billed), {
    subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5
  });
});

test('CURRENT BEHAVIOUR: #1008 matches checkout for all 18% items without a coupon', function () {
  var order = {
    items: [
      { name: 'Tea', hsn: '0902', price: 125, qty: 2 },
      { name: 'Coffee', hsn: '0901', price: 250, qty: 1, gstRate: 18 }
    ],
    coupon: ''
  };
  var printed = invoice.computeInvoiceFigures(order);
  var billed = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(figures(printed), {
    subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590
  });
  assert.deepEqual(invoiceRows(printed), [
    { hsn: '0902', gross: 250, rate: 18, tax: 45 },
    { hsn: '0901', gross: 250, rate: 18, tax: 45 }
  ]);
  assert.deepEqual(figures(billed), figures(printed));
});
