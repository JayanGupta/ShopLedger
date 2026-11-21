var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function figuresFor(order) {
  return {
    invoice: invoice.computeInvoiceFigures(order),
    checkout: pricing.computeTotals(order.items, order.coupon)
  };
}

function invoiceSummary(result) {
  return {
    subtotal: result.subtotal,
    discount: result.discount,
    tax: result.tax,
    cgst: result.cgst,
    sgst: result.sgst,
    total: result.total,
    rows: result.rows.map(function (row) {
      return {
        hsn: row.hsn,
        gstPercent: row.gstPercent,
        lineTax: row.lineTax
      };
    })
  };
}

test('CURRENT BEHAVIOUR: #1001 invoice uses 5% and 12% item GST with no coupon', function () {
  var order = {
    id: 1001,
    coupon: '',
    items: [
      { name: 'Rice', price: 640, qty: 1, hsn: '1006', gstRate: 5 },
      { name: 'Ghee', price: 450, qty: 1, hsn: '0405', gstRate: 12 }
    ]
  };
  var figures = figuresFor(order);

  assert.deepStrictEqual(invoiceSummary(figures.invoice), {
    subtotal: 1090, discount: 0, tax: 86, cgst: 43, sgst: 43, total: 1176,
    rows: [
      { hsn: '1006', gstPercent: 5, lineTax: 32 },
      { hsn: '0405', gstPercent: 12, lineTax: 54 }
    ]
  });
  assert.strictEqual(figures.checkout.total, 1176);
});

test('CURRENT BEHAVIOUR: #1002 invoice matches checkout after SAVE10 discount', function () {
  var order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 640, qty: 1, hsn: '1006', gstRate: 5 },
      { name: 'Ghee', price: 450, qty: 1, hsn: '0405', gstRate: 12 }
    ]
  };
  var figures = figuresFor(order);

  assert.deepStrictEqual(invoiceSummary(figures.invoice), {
    subtotal: 1090, discount: 109, tax: 77.4, cgst: 38.7, sgst: 38.7, total: 1058.4,
    rows: [
      { hsn: '1006', gstPercent: 5, lineTax: 28.8 },
      { hsn: '0405', gstPercent: 12, lineTax: 48.6 }
    ]
  });
  assert.strictEqual(figures.checkout.tax, 77.4);
  assert.strictEqual(figures.checkout.total, 1058.4);
});

test('CURRENT BEHAVIOUR: #1004 invoice applies the SAVE10 ₹150 cap', function () {
  var order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { name: 'Groundnut Oil', price: 1120, qty: 2, hsn: '1508', gstRate: 5 }
    ]
  };
  var figures = figuresFor(order);

  assert.deepStrictEqual(invoiceSummary(figures.invoice), {
    subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5,
    rows: [{ hsn: '1508', gstPercent: 5, lineTax: 104.5 }]
  });
  assert.strictEqual(figures.checkout.discount, 150);
  assert.strictEqual(figures.checkout.total, 2194.5);
});

test('CURRENT BEHAVIOUR: #1008 invoice uses explicit 18% GST for every line with no coupon', function () {
  var order = {
    id: 1008,
    coupon: '',
    items: [
      { name: 'Tea', price: 140, qty: 2, hsn: '0902', gstRate: 18 },
      { name: 'Coffee', price: 340, qty: 1, hsn: '0901', gstRate: 18 }
    ]
  };
  var figures = figuresFor(order);

  assert.deepStrictEqual(invoiceSummary(figures.invoice), {
    subtotal: 620, discount: 0, tax: 111.6, cgst: 55.8, sgst: 55.8, total: 731.6,
    rows: [
      { hsn: '0902', gstPercent: 18, lineTax: 50.4 },
      { hsn: '0901', gstPercent: 18, lineTax: 61.2 }
    ]
  });
  assert.strictEqual(figures.checkout.total, 731.6);
});

test('invoice matches the checkout figures for #1004 HSN GST and capped SAVE10', function () {
  var order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { id: 5, name: 'Groundnut Oil', price: 1120, qty: 2, hsn: '1508' }
    ]
  };
  var figures = figuresFor(order);

  assert.deepStrictEqual(invoiceSummary(figures.invoice), {
    subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5,
    rows: [{ hsn: '1508', gstPercent: 5, lineTax: 104.5 }]
  });
  assert.strictEqual(figures.invoice.total, figures.checkout.total);
  assert.strictEqual(figures.invoice.tax, figures.checkout.tax);
});
