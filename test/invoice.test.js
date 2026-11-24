'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(name, hsn, price, qty, gstRate) {
  const result = { name, sku: hsn, hsn, price, qty };
  if (gstRate !== undefined) result.gstRate = gstRate;
  return result;
}

function checkOrder(items, coupon, expectedInvoice, expectedPricing) {
  // Both calculations receive the exact same in-memory line items and coupon.
  const order = { items, coupon };
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const pricingFigures = pricing.computeTotals(items, coupon);

  assert.deepEqual(invoiceFigures, expectedInvoice);
  assert.deepEqual(
    {
      subtotal: pricingFigures.subtotal,
      discount: pricingFigures.discount,
      tax: pricingFigures.tax,
      cgst: pricingFigures.cgst,
      sgst: pricingFigures.sgst,
      total: pricingFigures.total,
      lineTax: pricingFigures.lines.map(line => line.tax)
    },
    expectedPricing
  );
}

test('CURRENT BEHAVIOUR: order #1001 model uses 5% and 12% gstRate values without a coupon', () => {
  checkOrder(
    [
      item('Unpolished Toor Dal 1kg', '0713', 165, 2, 5),
      item('Pasteurized Table Butter 500g', '0405', 260, 1, 12)
    ],
    '',
    {
      subtotal: 590,
      discount: 0,
      tax: 47.7,
      cgst: 23.85,
      sgst: 23.85,
      total: 637.7,
      rows: [
        { name: 'Unpolished Toor Dal 1kg', sku: '0713', hsn: '0713', qty: 2, price: 165, gstPercent: 5, line: 330, lineTax: 16.5 },
        { name: 'Pasteurized Table Butter 500g', sku: '0405', hsn: '0405', qty: 1, price: 260, gstPercent: 12, line: 260, lineTax: 31.2 }
      ]
    },
    { subtotal: 590, discount: 0, tax: 47.7, cgst: 23.85, sgst: 23.85, total: 637.7, lineTax: [16.5, 31.2] }
  );
});

test('order #1002 invoice matches checkout for SAVE10', () => {
  checkOrder(
    [
      item('Indrayani Basmati Rice 5kg', '1006', 640, 1, 5),
      item('Cold-Pressed Sunflower Oil 1L', '1512', 190, 2, 5)
    ],
    'SAVE10',
    {
      subtotal: 1020,
      discount: 102,
      tax: 45.9,
      cgst: 22.95,
      sgst: 22.95,
      total: 963.9,
      rows: [
        { name: 'Indrayani Basmati Rice 5kg', sku: '1006', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
        { name: 'Cold-Pressed Sunflower Oil 1L', sku: '1512', hsn: '1512', qty: 2, price: 190, gstPercent: 5, line: 380, lineTax: 17.1 }
      ]
    },
    { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9, lineTax: [28.8, 17.1] }
  );
});

test('order #1004 invoice matches checkout SAVE10 cap on ₹2,240', () => {
  checkOrder(
    [item('Cold-Pressed Groundnut Oil 5L', '1508', 1120, 2, 5)],
    'SAVE10',
    {
      subtotal: 2240,
      discount: 150,
      tax: 104.5,
      cgst: 52.25,
      sgst: 52.25,
      total: 2194.5,
      rows: [
        { name: 'Cold-Pressed Groundnut Oil 5L', sku: '1508', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
      ]
    },
    { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5, lineTax: [104.5] }
  );
});

test('INVOICE MATCHES CHECKOUT: order #1004 resolves the HSN slab and caps SAVE10 before GST', () => {
  const items = [item('Cold-Pressed Groundnut Oil 5L', '1508', 1120, 2)];
  const expected = pricing.computeTotals(items, 'SAVE10');
  const actual = invoice.computeInvoiceFigures({ items, coupon: 'SAVE10' });

  assert.deepEqual(
    {
      subtotal: actual.subtotal,
      discount: actual.discount,
      tax: actual.tax,
      cgst: actual.cgst,
      sgst: actual.sgst,
      total: actual.total,
      lineTax: actual.rows.map(row => row.lineTax),
      gstPercent: actual.rows.map(row => row.gstPercent)
    },
    {
      subtotal: expected.subtotal,
      discount: expected.discount,
      tax: expected.tax,
      cgst: expected.cgst,
      sgst: expected.sgst,
      total: expected.total,
      lineTax: expected.lines.map(line => line.tax),
      gstPercent: expected.lines.map(line => line.gstPercent)
    }
  );
});

test('CURRENT BEHAVIOUR: order #1008 invoice and checkout agree for 18% items without a coupon', () => {
  checkOrder(
    [
      item('Assam CTC Masala Chai 250g', '0902', 140, 1, 18),
      item('Kokum Sherbet Concentrate 750ml', '2106', 180, 2, 18)
    ],
    '',
    {
      subtotal: 500,
      discount: 0,
      tax: 90,
      cgst: 45,
      sgst: 45,
      total: 590,
      rows: [
        { name: 'Assam CTC Masala Chai 250g', sku: '0902', hsn: '0902', qty: 1, price: 140, gstPercent: 18, line: 140, lineTax: 25.2 },
        { name: 'Kokum Sherbet Concentrate 750ml', sku: '2106', hsn: '2106', qty: 2, price: 180, gstPercent: 18, line: 360, lineTax: 64.8 }
      ]
    },
    { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590, lineTax: [25.2, 64.8] }
  );
});
