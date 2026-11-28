'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// Stored order lines contain price, qty, and HSN, but no GST rate. Keep the
// missing rate explicit: invoice.js falls back to config.tax.defaultRate.
function line(name, price, qty, hsn) {
  return { name, price, qty, hsn, gstRate: undefined };
}

function figures(id, items, coupon) {
  const order = { id, items, coupon };
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutFigures = pricing.computeTotals(items, coupon);
  return { invoiceFigures, checkoutFigures };
}

test('invoice uses HSN GST slabs for #1001 lines', () => {
  const { invoiceFigures, checkoutFigures } = figures(1001, [
    line('Rice', 160, 1, '1006'),
    line('Ghee', 450, 1, '0405')
  ], '');

  assert.deepEqual(
    { subtotal: invoiceFigures.subtotal, discount: invoiceFigures.discount, tax: invoiceFigures.tax, cgst: invoiceFigures.cgst, sgst: invoiceFigures.sgst, total: invoiceFigures.total, rates: invoiceFigures.rows.map(row => row.gstPercent) },
    { subtotal: 610, discount: 0, tax: 62, cgst: 31, sgst: 31, total: 672, rates: [5, 12] }
  );
  assert.deepEqual(
    { tax: checkoutFigures.tax, total: checkoutFigures.total, rates: checkoutFigures.lines.map(row => row.gstPercent) },
    { tax: 62, total: 672, rates: [5, 12] }
  );
});

test('invoice applies SAVE10 to subtotal using checkout pricing for #1002', () => {
  const { invoiceFigures, checkoutFigures } = figures(1002, [
    line('Rice', 640, 1, '1006'),
    line('Sunflower oil', 190, 2, '1512')
  ], 'SAVE10');

  assert.deepEqual(
    { subtotal: invoiceFigures.subtotal, discount: invoiceFigures.discount, tax: invoiceFigures.tax, total: invoiceFigures.total, rates: invoiceFigures.rows.map(row => row.gstPercent) },
    { subtotal: 1020, discount: 102, tax: 45.9, total: 963.9, rates: [5, 5] }
  );
  assert.deepEqual(
    { subtotal: checkoutFigures.subtotal, discount: checkoutFigures.discount, tax: checkoutFigures.tax, total: checkoutFigures.total },
    { subtotal: 1020, discount: 102, tax: 45.9, total: 963.9 }
  );
});

test('invoice observes SAVE10 cap for #1004', () => {
  const { invoiceFigures, checkoutFigures } = figures(1004, [
    line('Groundnut oil', 1120, 2, '1508')
  ], 'SAVE10');

  assert.deepEqual(
    { subtotal: invoiceFigures.subtotal, discount: invoiceFigures.discount, tax: invoiceFigures.tax, total: invoiceFigures.total, rates: invoiceFigures.rows.map(row => row.gstPercent) },
    { subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5, rates: [5] }
  );
  assert.deepEqual(
    { subtotal: checkoutFigures.subtotal, discount: checkoutFigures.discount, tax: checkoutFigures.tax, total: checkoutFigures.total },
    { subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5 }
  );
});

test('invoice matches checkout GST slabs and capped discount before tax', () => {
  const { invoiceFigures, checkoutFigures } = figures(1004, [
    line('Groundnut oil', 1120, 1, '1508'),
    line('Ghee', 560, 2, '0405')
  ], 'SAVE10');

  assert.deepEqual(
    {
      subtotal: invoiceFigures.subtotal,
      discount: invoiceFigures.discount,
      tax: invoiceFigures.tax,
      cgst: invoiceFigures.cgst,
      sgst: invoiceFigures.sgst,
      total: invoiceFigures.total,
      rates: invoiceFigures.rows.map(row => row.gstPercent),
      lineTaxes: invoiceFigures.rows.map(row => row.lineTax)
    },
    {
      subtotal: checkoutFigures.subtotal,
      discount: checkoutFigures.discount,
      tax: checkoutFigures.tax,
      cgst: checkoutFigures.cgst,
      sgst: checkoutFigures.sgst,
      total: checkoutFigures.total,
      rates: checkoutFigures.lines.map(row => row.gstPercent),
      lineTaxes: checkoutFigures.lines.map(row => row.tax)
    }
  );
});

test('CURRENT BEHAVIOUR: #1008 all-18% invoice and checkout totals agree without a coupon', () => {
  const { invoiceFigures, checkoutFigures } = figures(1008, [
    line('Packaged tea', 140, 1, '0902'),
    line('Sherbet concentrate', 180, 2, '2106')
  ], '');

  assert.deepEqual(
    { subtotal: invoiceFigures.subtotal, discount: invoiceFigures.discount, tax: invoiceFigures.tax, cgst: invoiceFigures.cgst, sgst: invoiceFigures.sgst, total: invoiceFigures.total, rates: invoiceFigures.rows.map(row => row.gstPercent) },
    { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590, rates: [18, 18] }
  );
  assert.deepEqual(
    { subtotal: checkoutFigures.subtotal, discount: checkoutFigures.discount, tax: checkoutFigures.tax, total: checkoutFigures.total },
    { subtotal: 500, discount: 0, tax: 90, total: 590 }
  );
});
