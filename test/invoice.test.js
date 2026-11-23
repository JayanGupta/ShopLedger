var assert = require('node:assert/strict');
var test = require('node:test');

var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function compute(order) {
  return {
    invoice: invoice.computeInvoiceFigures(order),
    pricing: pricing.computeTotals(order.items, order.coupon)
  };
}

test('CURRENT BEHAVIOUR: #1001 mixed 5% and 12% items without a coupon', function () {
  var order = {
    id: 1001,
    items: [
      { id: 'rice', name: 'Basmati Rice', price: 600, qty: 1, hsn: '1006', gstRate: 5 },
      { id: 'ghee', name: 'Pure Ghee', price: 500, qty: 1, hsn: '0405', gstRate: 12 }
    ]
  };
  var figures = compute(order);

  assert.deepEqual(figures.invoice, {
    subtotal: 1100,
    discount: 0,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 1190,
    rows: [
      { name: 'Basmati Rice', sku: '-', hsn: '1006', qty: 1, price: 600, gstPercent: 5, line: 600, lineTax: 30 },
      { name: 'Pure Ghee', sku: '-', hsn: '0405', qty: 1, price: 500, gstPercent: 12, line: 500, lineTax: 60 }
    ]
  });
  assert.equal(figures.invoice.total, figures.pricing.total);
  assert.equal(figures.invoice.tax, figures.pricing.tax);
});

test('CURRENT BEHAVIOUR: #1002 SAVE10 applies before invoice GST', function () {
  var order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      { id: 'rice', name: 'Basmati Rice', price: 600, qty: 1, hsn: '1006', gstRate: 5 },
      { id: 'ghee', name: 'Pure Ghee', price: 400, qty: 1, hsn: '0405', gstRate: 12 }
    ]
  };
  var figures = compute(order);

  assert.deepEqual(figures.invoice, {
    subtotal: 1000,
    discount: 100,
    tax: 70.2,
    cgst: 35.1,
    sgst: 35.1,
    total: 970.2,
    rows: [
      { name: 'Basmati Rice', sku: '-', hsn: '1006', qty: 1, price: 600, gstPercent: 5, line: 600, lineTax: 27 },
      { name: 'Pure Ghee', sku: '-', hsn: '0405', qty: 1, price: 400, gstPercent: 12, line: 400, lineTax: 43.2 }
    ]
  });
  assert.equal(figures.invoice.total, figures.pricing.total);
  assert.equal(figures.invoice.tax, figures.pricing.tax);
});

test('CURRENT BEHAVIOUR: #1004 SAVE10 on Rs 2,240 applies the coupon discount cap before invoice GST', function () {
  var order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { id: 'rice', name: 'Basmati Rice', price: 1240, qty: 1, hsn: '1006', gstRate: 5 },
      { id: 'ghee', name: 'Pure Ghee', price: 1000, qty: 1, hsn: '0405', gstRate: 12 }
    ]
  };
  var figures = compute(order);

  assert.deepEqual(figures.invoice, {
    subtotal: 2240,
    discount: 150,
    tax: 169.81,
    cgst: 84.91,
    sgst: 84.9,
    total: 2259.81,
    rows: [
      { name: 'Basmati Rice', sku: '-', hsn: '1006', qty: 1, price: 1240, gstPercent: 5, line: 1240, lineTax: 57.85 },
      { name: 'Pure Ghee', sku: '-', hsn: '0405', qty: 1, price: 1000, gstPercent: 12, line: 1000, lineTax: 111.96 }
    ]
  });
  assert.equal(figures.invoice.total, figures.pricing.total);
  assert.equal(figures.invoice.tax, figures.pricing.tax);
});

test('CURRENT BEHAVIOUR: #1004 invoice matches checkout after the capped SAVE10 discount', function () {
  var order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      {
        id: 5,
        sku: 'OIL-002',
        name: 'Cold-Pressed Groundnut Oil 5L',
        hsn: '1508',
        price: 1120,
        qty: 2
      }
    ]
  };
  var figures = compute(order);

  assert.deepEqual(figures.invoice, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      {
        name: 'Cold-Pressed Groundnut Oil 5L',
        sku: 'OIL-002',
        hsn: '1508',
        qty: 2,
        price: 1120,
        gstPercent: 5,
        line: 2240,
        lineTax: 104.5
      }
    ]
  });
  assert.deepEqual(figures.invoice, {
    subtotal: figures.pricing.subtotal,
    discount: figures.pricing.discount,
    tax: figures.pricing.tax,
    cgst: figures.pricing.cgst,
    sgst: figures.pricing.sgst,
    total: figures.pricing.total,
    rows: figures.invoice.rows
  });
});

test('CURRENT BEHAVIOUR: #1008 all 18% items without a coupon', function () {
  var order = {
    id: 1008,
    items: [
      { id: 'tea', name: 'Packaged Tea', price: 1000, qty: 1, hsn: '0902', gstRate: 18 },
      { id: 'coffee', name: 'Coffee Blend', price: 500, qty: 1, hsn: '0901', gstRate: 18 }
    ]
  };
  var figures = compute(order);

  assert.deepEqual(figures.invoice, {
    subtotal: 1500,
    discount: 0,
    tax: 270,
    cgst: 135,
    sgst: 135,
    total: 1770,
    rows: [
      { name: 'Packaged Tea', sku: '-', hsn: '0902', qty: 1, price: 1000, gstPercent: 18, line: 1000, lineTax: 180 },
      { name: 'Coffee Blend', sku: '-', hsn: '0901', qty: 1, price: 500, gstPercent: 18, line: 500, lineTax: 90 }
    ]
  });
  assert.equal(figures.invoice.total, figures.pricing.total);
  assert.equal(figures.invoice.tax, figures.pricing.tax);
});
