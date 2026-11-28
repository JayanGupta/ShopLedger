const test = require('node:test');
const assert = require('node:assert/strict');

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function checkOrder(order, expectedInvoice, expectedPricing) {
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const pricingFigures = pricing.computeTotals(order.items, order.coupon);

  // Keep both calculations visible in each characterization case.
  assert.deepEqual(invoiceFigures, expectedInvoice);
  assert.deepEqual(
    {
      subtotal: pricingFigures.subtotal,
      discount: pricingFigures.discount,
      tax: pricingFigures.tax,
      cgst: pricingFigures.cgst,
      sgst: pricingFigures.sgst,
      total: pricingFigures.total
    },
    expectedPricing
  );
}

test('order #1001 invoice matches mixed 5% and 12% pricing without a coupon', function () {
  checkOrder(
    {
      id: 1001,
      coupon: '',
      items: [
        { name: 'Rice', sku: 'RICE', hsn: '1006', price: 100, qty: 2, gstRate: 5 },
        { name: 'Ghee', sku: 'GHEE', hsn: '0405', price: 200, qty: 1, gstRate: 12 }
      ]
    },
    {
      subtotal: 400,
      discount: 0,
      tax: 34,
      cgst: 17,
      sgst: 17,
      total: 434,
      rows: [
        { name: 'Rice', sku: 'RICE', hsn: '1006', qty: 2, price: 100, gstPercent: 5, line: 200, lineTax: 10 },
        { name: 'Ghee', sku: 'GHEE', hsn: '0405', qty: 1, price: 200, gstPercent: 12, line: 200, lineTax: 24 }
      ]
    },
    { subtotal: 400, discount: 0, tax: 34, cgst: 17, sgst: 17, total: 434 }
  );
});

test('order #1002 invoice uses the pricing SAVE10 discount and taxable amounts', function () {
  checkOrder(
    {
      id: 1002,
      coupon: 'SAVE10',
      items: [
        { name: 'Rice', sku: 'RICE', hsn: '1006', price: 100, qty: 3, gstRate: 5 },
        { name: 'Ghee', sku: 'GHEE', hsn: '0405', price: 200, qty: 2, gstRate: 12 }
      ]
    },
    {
      subtotal: 700,
      discount: 70,
      tax: 56.7,
      cgst: 28.35,
      sgst: 28.35,
      total: 686.7,
      rows: [
        { name: 'Rice', sku: 'RICE', hsn: '1006', qty: 3, price: 100, gstPercent: 5, line: 300, lineTax: 13.5 },
        { name: 'Ghee', sku: 'GHEE', hsn: '0405', qty: 2, price: 200, gstPercent: 12, line: 400, lineTax: 43.2 }
      ]
    },
    { subtotal: 700, discount: 70, tax: 56.7, cgst: 28.35, sgst: 28.35, total: 686.7 }
  );
});

test('order #1004 invoice matches capped SAVE10 pricing on a ₹2,240 subtotal', function () {
  checkOrder(
    {
      id: 1004,
      coupon: 'SAVE10',
      items: [
        // Match persisted order lines: the HSN is stored, but gstRate is not.
        { name: 'Cold-Pressed Groundnut Oil 5L', sku: 'OIL-002', hsn: '1508', price: 1120, qty: 2 }
      ]
    },
    {
      subtotal: 2240,
      discount: 150,
      tax: 104.5,
      cgst: 52.25,
      sgst: 52.25,
      total: 2194.5,
      rows: [
        { name: 'Cold-Pressed Groundnut Oil 5L', sku: 'OIL-002', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
      ]
    },
    { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 }
  );
});

test('order #1008 invoice matches 18% pricing on every line without a coupon', function () {
  checkOrder(
    {
      id: 1008,
      coupon: '',
      items: [
        { name: 'Tea', sku: 'TEA', hsn: '0902', price: 150, qty: 4, gstRate: 18 },
        { name: 'Coffee', sku: 'COF', hsn: '0901', price: 120, qty: 2, gstRate: 18 }
      ]
    },
    {
      subtotal: 840,
      discount: 0,
      tax: 151.2,
      cgst: 75.6,
      sgst: 75.6,
      total: 991.2,
      rows: [
        { name: 'Tea', sku: 'TEA', hsn: '0902', qty: 4, price: 150, gstPercent: 18, line: 600, lineTax: 108 },
        { name: 'Coffee', sku: 'COF', hsn: '0901', qty: 2, price: 120, gstPercent: 18, line: 240, lineTax: 43.2 }
      ]
    },
    { subtotal: 840, discount: 0, tax: 151.2, cgst: 75.6, sgst: 75.6, total: 991.2 }
  );
});
