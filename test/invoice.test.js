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

test('CURRENT BEHAVIOUR: #1001 invoice uses supplied 5% and 12% line GST rates without a coupon', function () {
  var order = {
    id: 1001,
    coupon: '',
    items: [
      { id: 2, name: 'Toor Dal', sku: 'GRN-002', hsn: '0713', gstRate: 5, price: 165, qty: 2 },
      { id: 6, name: 'A2 Ghee', sku: 'DRY-001', hsn: '0405', gstRate: 12, price: 450, qty: 1 }
    ]
  };
  var result = calculate(order);

  assert.deepEqual(result.invoice, {
    subtotal: 780,
    discount: 0,
    tax: 70.5,
    cgst: 35.25,
    sgst: 35.25,
    total: 850.5,
    rows: [
      { name: 'Toor Dal', sku: 'GRN-002', hsn: '0713', qty: 2, price: 165, gstPercent: 5, line: 330, lineTax: 16.5 },
      { name: 'A2 Ghee', sku: 'DRY-001', hsn: '0405', qty: 1, price: 450, gstPercent: 12, line: 450, lineTax: 54 }
    ]
  });
  assert.equal(result.pricing.total, result.invoice.total);
  assert.equal(result.pricing.tax, result.invoice.tax);
});

test('CURRENT BEHAVIOUR: #1002 SAVE10 invoice applies the coupon before calculating GST', function () {
  var order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      { id: 1, name: 'Basmati Rice', sku: 'GRN-001', hsn: '1006', gstRate: 5, price: 640, qty: 1 },
      { id: 4, name: 'Sunflower Oil', sku: 'OIL-001', hsn: '1512', gstRate: 5, price: 190, qty: 2 }
    ]
  };
  var result = calculate(order);

  assert.deepEqual(result.invoice, {
    subtotal: 1020,
    discount: 102,
    tax: 45.9,
    cgst: 22.95,
    sgst: 22.95,
    total: 963.9,
    rows: [
      { name: 'Basmati Rice', sku: 'GRN-001', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
      { name: 'Sunflower Oil', sku: 'OIL-001', hsn: '1512', qty: 2, price: 190, gstPercent: 5, line: 380, lineTax: 17.1 }
    ]
  });
  assert.equal(result.pricing.discount, result.invoice.discount);
  assert.equal(result.pricing.tax, result.invoice.tax);
  assert.equal(result.pricing.total, result.invoice.total);
});

test('CURRENT BEHAVIOUR: #1004 SAVE10 invoice applies the 150 rupee coupon cap before tax', function () {
  var order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { id: 5, name: 'Groundnut Oil', sku: 'OIL-002', hsn: '1508', gstRate: 5, price: 1120, qty: 2 }
    ]
  };
  var result = calculate(order);

  assert.deepEqual(result.invoice, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      { name: 'Groundnut Oil', sku: 'OIL-002', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  });
  assert.equal(result.pricing.discount, result.invoice.discount);
  assert.equal(result.pricing.tax, result.invoice.tax);
  assert.equal(result.pricing.total, result.invoice.total);
});

test('CURRENT BEHAVIOUR: #1008 invoice and billed totals agree for all-18% items without a coupon', function () {
  var order = {
    id: 1008,
    coupon: '',
    items: [
      { id: 8, name: 'Masala Chai', sku: 'BEV-001', hsn: '0902', gstRate: 18, price: 140, qty: 1 },
      { id: 12, name: 'Kokum Sherbet', sku: 'BEV-003', hsn: '2106', gstRate: 18, price: 180, qty: 2 }
    ]
  };
  var result = calculate(order);

  assert.deepEqual(result.invoice, {
    subtotal: 500,
    discount: 0,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 590,
    rows: [
      { name: 'Masala Chai', sku: 'BEV-001', hsn: '0902', qty: 1, price: 140, gstPercent: 18, line: 140, lineTax: 25.2 },
      { name: 'Kokum Sherbet', sku: 'BEV-003', hsn: '2106', qty: 2, price: 180, gstPercent: 18, line: 360, lineTax: 64.8 }
    ]
  });
  assert.equal(result.pricing.total, result.invoice.total);
  assert.equal(result.pricing.tax, result.invoice.tax);
});

test('invoice matches checkout totals and per-line HSN GST after a capped SAVE10 discount', function () {
  var order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { id: 5, name: 'Groundnut Oil', sku: 'OIL-002', hsn: '1508', gstRate: 5, price: 1120, qty: 2 }
    ]
  };
  var result = calculate(order);

  assert.deepEqual(result.invoice, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      { name: 'Groundnut Oil', sku: 'OIL-002', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  });
  assert.equal(result.invoice.total, result.pricing.total);
  assert.equal(result.invoice.tax, result.pricing.tax);
});
