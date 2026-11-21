var test = require('node:test');
var assert = require('node:assert').strict;
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function compareOrder(order) {
  return {
    printed: invoice.computeInvoiceFigures(order),
    billed: pricing.computeTotals(order.items, order.coupon)
  };
}

function summary(figures) {
  return {
    subtotal: figures.subtotal,
    discount: figures.discount,
    tax: figures.tax,
    cgst: figures.cgst,
    sgst: figures.sgst,
    total: figures.total
  };
}

function invoiceGstRows(printed) {
  return printed.rows.map(function (row) {
    return { hsn: row.hsn, gstPercent: row.gstPercent, lineTax: row.lineTax };
  });
}

test('CURRENT BEHAVIOUR: #1001 prints the 5% and 12% HSN slabs', function () {
  var result = compareOrder({
    id: 1001,
    coupon: '',
    // The stored lines can have HSN without an explicit gstRate.
    items: [
      { id: 1, name: 'Rice', hsn: '1006', price: 300, qty: 2 },
      { id: 2, name: 'Ghee', hsn: '0405', price: 400, qty: 1 }
    ]
  });

  assert.deepEqual(summary(result.printed), {
    subtotal: 1000, discount: 0, tax: 78, cgst: 39, sgst: 39, total: 1078
  });
  assert.deepEqual(invoiceGstRows(result.printed), [
    { hsn: '1006', gstPercent: 5, lineTax: 30 },
    { hsn: '0405', gstPercent: 12, lineTax: 48 }
  ]);
  assert.deepEqual(summary(result.billed), summary(result.printed));
});

test('CURRENT BEHAVIOUR: #1002 applies SAVE10 before GST on the invoice', function () {
  var result = compareOrder({
    id: 1002,
    coupon: 'SAVE10',
    items: [{ id: 3, name: 'Tea', hsn: '0902', price: 400, qty: 2 }]
  });

  assert.deepEqual(summary(result.printed), {
    subtotal: 800, discount: 80, tax: 129.60, cgst: 64.80, sgst: 64.80, total: 849.60
  });
  assert.deepEqual(invoiceGstRows(result.printed), [
    { hsn: '0902', gstPercent: 18, lineTax: 129.60 }
  ]);
  assert.deepEqual(summary(result.billed), summary(result.printed));
});

test('CURRENT BEHAVIOUR: #1004 applies the SAVE10 cap on the invoice', function () {
  var result = compareOrder({
    id: 1004,
    coupon: 'SAVE10',
    items: [{ id: 2, name: 'Ghee', hsn: '0405', price: 560, qty: 4 }]
  });

  assert.deepEqual(summary(result.printed), {
    subtotal: 2240, discount: 150, tax: 250.80, cgst: 125.40, sgst: 125.40, total: 2340.80
  });
  assert.deepEqual(invoiceGstRows(result.printed), [
    { hsn: '0405', gstPercent: 12, lineTax: 250.80 }
  ]);
  assert.deepEqual(summary(result.billed), summary(result.printed));
});

test('CURRENT BEHAVIOUR: #1008 matches checkout at 18% without a coupon', function () {
  var result = compareOrder({
    id: 1008,
    coupon: '',
    items: [
      { id: 3, name: 'Tea', hsn: '0902', price: 125.50, qty: 2 },
      { id: 4, name: 'Coffee', hsn: '0901', price: 99.50, qty: 1, gstRate: 18 }
    ]
  });

  assert.deepEqual(summary(result.printed), {
    subtotal: 350.50, discount: 0, tax: 63.09, cgst: 31.55, sgst: 31.54, total: 413.59
  });
  assert.deepEqual(invoiceGstRows(result.printed), [
    { hsn: '0902', gstPercent: 18, lineTax: 45.18 },
    { hsn: '0901', gstPercent: 18, lineTax: 17.91 }
  ]);
  assert.deepEqual(summary(result.billed), summary(result.printed));
});

test('invoice preserves checkout figures for current and pre-migration orders', function () {
  var result = compareOrder({
    date: '22/07/2021',
    subtotal: 2240,
    discount: 150,
    tax: 172.42,
    total: 2262.42,
    coupon: 'SAVE10',
    items: [
      { id: 1, name: 'Rice', hsn: '1006', price: 400, qty: 3 },
      { id: 2, name: 'Ghee', hsn: '0405', price: 520, qty: 2 }
    ]
  });

  assert.deepEqual(summary(result.billed), {
    subtotal: 2240, discount: 150, tax: 172.42, cgst: 86.21, sgst: 86.21, total: 2262.42
  });
  assert.deepEqual(summary(result.printed), summary(result.billed));
  assert.deepEqual(invoiceGstRows(result.printed), [
    { hsn: '1006', gstPercent: 5, lineTax: 55.98 },
    { hsn: '0405', gstPercent: 12, lineTax: 116.44 }
  ]);

  var legacyOrder = {
    date: '01/06/2021',
    coupon: '',
    subtotal: 20.06,
    discount: 0,
    tax: 3.61,
    total: 23.67,
    items: [
      { id: 3, name: 'Tea', hsn: '0902', price: 10.03, qty: 1 },
      { id: 4, name: 'Coffee', hsn: '0901', price: 10.03, qty: 1 }
    ]
  };
  var legacyInvoice = invoice.computeInvoiceFigures(legacyOrder);
  assert.deepEqual(summary(legacyInvoice), {
    subtotal: 20.06, discount: 0, tax: 3.61, cgst: 1.81, sgst: 1.80, total: 23.67
  });
  assert.deepEqual(invoiceGstRows(legacyInvoice), [
    { hsn: '0902', gstPercent: 18, lineTax: 1.81 },
    { hsn: '0901', gstPercent: 18, lineTax: 1.80 }
  ]);
  assert.doesNotMatch(invoice.render(legacyOrder), /Accountant Reconciliation Notice/);

  var migrationDayOrder = {
    date: '22/07/2021',
    coupon: '',
    subtotal: 27.75,
    discount: 0,
    tax: 5,
    total: 32.75,
    items: [
      { id: 3, name: 'Tea', hsn: '0902', price: 10.01, qty: 1 },
      { id: 4, name: 'Coffee', hsn: '0901', price: 17.74, qty: 1 }
    ]
  };
  var migrationDayInvoice = invoice.computeInvoiceFigures(migrationDayOrder);
  assert.deepEqual(summary(migrationDayInvoice), {
    subtotal: 27.75, discount: 0, tax: 5, cgst: 2.50, sgst: 2.50, total: 32.75
  });
  assert.deepEqual(invoiceGstRows(migrationDayInvoice), [
    { hsn: '0902', gstPercent: 18, lineTax: 1.80 },
    { hsn: '0901', gstPercent: 18, lineTax: 3.20 }
  ]);
  assert.doesNotMatch(invoice.render(migrationDayOrder), /Accountant Reconciliation Notice/);

  var unverifiedOrder = Object.assign({}, migrationDayOrder, { tax: 5.01, total: 32.76 });
  assert.match(invoice.render(unverifiedOrder), /Accountant Reconciliation Notice/);

  var roundedDiscountOrder = {
    date: '22/07/2021',
    coupon: 'SAVE10',
    subtotal: 500.05,
    discount: 50.01,
    tax: 81.01,
    total: 531.06,
    items: [{ id: 1, name: 'Rice', hsn: '1006', price: 500.05, qty: 1 }]
  };
  var roundedDiscountHtml = invoice.render(roundedDiscountOrder);
  assert.match(roundedDiscountHtml, /Rounding Adjustment<\/td><td class="r">\+₹0\.01/);
  assert.doesNotMatch(roundedDiscountHtml, /Accountant Reconciliation Notice/);
});
