var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function calculate(order) {
  return {
    invoice: invoice.computeInvoiceFigures(order),
    pricing: pricing.computeTotals(order.items, order.coupon)
  };
}

test('invoice uses the capped pre-tax discount and HSN GST on stored checkout lines', function () {
  var order = {
    id: 1009,
    coupon: 'SAVE10',
    subtotal: 2000,
    discount: 150,
    tax: 157.25,
    total: 2007.25,
    items: [
      { id: 'rice', name: 'Rice', hsn: '1006', price: 500, qty: 2 },
      { id: 'ghee', name: 'Ghee', hsn: '0405', price: 250, qty: 4 }
    ]
  };
  var figures = invoice.computeInvoiceFigures(order);
  var html = invoice.render(order);

  assert.deepStrictEqual(
    [figures.subtotal, figures.discount, figures.tax, figures.total],
    [order.subtotal, order.discount, order.tax, order.total]
  );
  assert.deepStrictEqual(figures.rows.map(function (line) {
    return [line.hsn, line.gstPercent, line.lineTax];
  }), [['1006', 5, 46.25], ['0405', 12, 111]]);
  assert.match(html, /<td class="r">5%<\/td><td class="r">₹46\.25<\/td>/);
  assert.match(html, /<td class="r">12%<\/td><td class="r">₹111\.00<\/td>/);
  assert.match(html, /Invoice Total<\/td><td class="r">₹2007\.25<\/td>/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
});

test('CURRENT BEHAVIOUR: order #1001 keeps mixed 5% and 12% GST unchanged without a coupon', function () {
  var order = {
    id: 1001,
    items: [
      { id: 'rice', name: 'Rice', sku: 'RICE-5', price: 50, qty: 10, hsn: '1006', gstRate: 5 },
      { id: 'ghee', name: 'Ghee', sku: 'GHEE-12', price: 250, qty: 4, hsn: '0405', gstRate: 12 }
    ]
  };
  var calculated = calculate(order);

  assert.deepStrictEqual(calculated.invoice, {
    subtotal: 1500,
    discount: 0,
    tax: 145,
    cgst: 72.5,
    sgst: 72.5,
    total: 1645,
    rows: [
      { name: 'Rice', sku: 'RICE-5', hsn: '1006', qty: 10, price: 50, gstPercent: 5, line: 500, lineTax: 25 },
      { name: 'Ghee', sku: 'GHEE-12', hsn: '0405', qty: 4, price: 250, gstPercent: 12, line: 1000, lineTax: 120 }
    ]
  });
  assert.equal(calculated.invoice.total, calculated.pricing.total);
  assert.equal(calculated.invoice.tax, calculated.pricing.tax);
});

test('order #1002 applies SAVE10 before calculating GST', function () {
  var order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      { id: 'rice', name: 'Rice', sku: 'RICE-5', price: 50, qty: 10, hsn: '1006', gstRate: 5 },
      { id: 'ghee', name: 'Ghee', sku: 'GHEE-12', price: 250, qty: 4, hsn: '0405', gstRate: 12 }
    ]
  };
  var calculated = calculate(order);

  assert.deepStrictEqual(calculated.invoice, {
    subtotal: 1500,
    discount: 150,
    tax: 130.5,
    cgst: 65.25,
    sgst: 65.25,
    total: 1480.5,
    rows: [
      { name: 'Rice', sku: 'RICE-5', hsn: '1006', qty: 10, price: 50, gstPercent: 5, line: 500, lineTax: 22.5 },
      { name: 'Ghee', sku: 'GHEE-12', hsn: '0405', qty: 4, price: 250, gstPercent: 12, line: 1000, lineTax: 108 }
    ]
  });
  assert.equal(calculated.invoice.total, calculated.pricing.total);
  assert.equal(calculated.invoice.tax, calculated.pricing.tax);
});

test('order #1004 caps SAVE10 at ₹150 on a ₹2,240 subtotal', function () {
  var order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { id: 'tea', name: 'Tea', sku: 'TEA-18', price: 140, qty: 8, hsn: '0902', gstRate: 18 },
      { id: 'coffee', name: 'Coffee', sku: 'COFFEE-18', price: 280, qty: 4, hsn: '0901', gstRate: 18 }
    ]
  };
  var calculated = calculate(order);

  assert.deepStrictEqual(calculated.invoice, {
    subtotal: 2240,
    discount: 150,
    tax: 376.2,
    cgst: 188.1,
    sgst: 188.1,
    total: 2466.2,
    rows: [
      { name: 'Tea', sku: 'TEA-18', hsn: '0902', qty: 8, price: 140, gstPercent: 18, line: 1120, lineTax: 188.1 },
      { name: 'Coffee', sku: 'COFFEE-18', hsn: '0901', qty: 4, price: 280, gstPercent: 18, line: 1120, lineTax: 188.1 }
    ]
  });
  assert.equal(calculated.invoice.discount, calculated.pricing.discount);
  assert.equal(calculated.invoice.total, calculated.pricing.total);
});

test('CURRENT BEHAVIOUR: order #1008 keeps an all-18% order unchanged without a coupon', function () {
  var order = {
    id: 1008,
    items: [
      { id: 'tea', name: 'Tea', sku: 'TEA-18', price: 140, qty: 5, hsn: '0902', gstRate: 18 },
      { id: 'coffee', name: 'Coffee', sku: 'COFFEE-18', price: 300, qty: 1, hsn: '0901', gstRate: 18 }
    ]
  };
  var calculated = calculate(order);

  assert.deepStrictEqual(calculated.invoice, {
    subtotal: 1000,
    discount: 0,
    tax: 180,
    cgst: 90,
    sgst: 90,
    total: 1180,
    rows: [
      { name: 'Tea', sku: 'TEA-18', hsn: '0902', qty: 5, price: 140, gstPercent: 18, line: 700, lineTax: 126 },
      { name: 'Coffee', sku: 'COFFEE-18', hsn: '0901', qty: 1, price: 300, gstPercent: 18, line: 300, lineTax: 54 }
    ]
  });
  assert.equal(calculated.invoice.total, calculated.pricing.total);
  assert.equal(calculated.invoice.tax, calculated.pricing.tax);
});
