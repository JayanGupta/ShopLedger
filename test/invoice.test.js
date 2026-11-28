'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(name, price, qty, hsn, gstRate) {
  return { name, sku: name.toUpperCase().replace(/ /g, '-'), price, qty, hsn, gstRate };
}

function order(id, items, coupon) {
  return { id, items, coupon: coupon || '' };
}

test('CURRENT BEHAVIOUR: #1001 mixed 5% and 12% items without a coupon', function () {
  const items = [item('Rice', 640, 1, '1006', 5), item('Ghee', 450, 1, '0405', 12)];
  const inv = invoice.computeInvoiceFigures(order(1001, items, ''));
  const checkout = pricing.computeTotals(items, '');

  assert.deepEqual(
    { subtotal: inv.subtotal, discount: inv.discount, tax: inv.tax, cgst: inv.cgst, sgst: inv.sgst, total: inv.total,
      rows: inv.rows.map(function (row) { return { gstPercent: row.gstPercent, line: row.line, lineTax: row.lineTax }; }) },
    { subtotal: 1090, discount: 0, tax: 86, cgst: 43, sgst: 43, total: 1176,
      rows: [{ gstPercent: 5, line: 640, lineTax: 32 }, { gstPercent: 12, line: 450, lineTax: 54 }] }
  );
  assert.deepEqual(
    { subtotal: checkout.subtotal, discount: checkout.discount, tax: checkout.tax, cgst: checkout.cgst, sgst: checkout.sgst, total: checkout.total },
    { subtotal: 1090, discount: 0, tax: 86, cgst: 43, sgst: 43, total: 1176 }
  );
});

test('#1002 SAVE10 invoice matches checkout discount and post-discount GST', function () {
  const items = [item('Rice', 640, 1, '1006', 5), item('Ghee', 450, 1, '0405', 12)];
  const inv = invoice.computeInvoiceFigures(order(1002, items, 'SAVE10'));
  const checkout = pricing.computeTotals(items, 'SAVE10');

  assert.deepEqual(
    { subtotal: inv.subtotal, discount: inv.discount, tax: inv.tax, cgst: inv.cgst, sgst: inv.sgst, total: inv.total,
      rows: inv.rows.map(function (row) { return { gstPercent: row.gstPercent, line: row.line, discount: row.discount, taxable: row.taxable, lineTax: row.lineTax }; }) },
    { subtotal: 1090, discount: 109, tax: 77.4, cgst: 38.7, sgst: 38.7, total: 1058.4,
      rows: [{ gstPercent: 5, line: 640, discount: 64, taxable: 576, lineTax: 28.8 }, { gstPercent: 12, line: 450, discount: 45, taxable: 405, lineTax: 48.6 }] }
  );
  assert.deepEqual(
    { subtotal: checkout.subtotal, discount: checkout.discount, tax: checkout.tax, cgst: checkout.cgst, sgst: checkout.sgst, total: checkout.total },
    { subtotal: 1090, discount: 109, tax: 77.4, cgst: 38.7, sgst: 38.7, total: 1058.4 }
  );
});

test('#1004 SAVE10 invoice applies the ₹150 cap before GST at ₹2,240', function () {
  const items = [item('Groundnut Oil', 1120, 2, '1508', 5)];
  const inv = invoice.computeInvoiceFigures(order(1004, items, 'SAVE10'));
  const checkout = pricing.computeTotals(items, 'SAVE10');

  assert.deepEqual(
    { subtotal: inv.subtotal, discount: inv.discount, tax: inv.tax, cgst: inv.cgst, sgst: inv.sgst, total: inv.total,
      rows: inv.rows.map(function (row) { return { gstPercent: row.gstPercent, line: row.line, discount: row.discount, taxable: row.taxable, lineTax: row.lineTax }; }) },
    { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5,
      rows: [{ gstPercent: 5, line: 2240, discount: 150, taxable: 2090, lineTax: 104.5 }] }
  );
  assert.deepEqual(
    { subtotal: checkout.subtotal, discount: checkout.discount, tax: checkout.tax, cgst: checkout.cgst, sgst: checkout.sgst, total: checkout.total },
    { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 }
  );
});

test('CURRENT BEHAVIOUR: #1008 all 18% items without a coupon', function () {
  const items = [
    item('Tea', 140, 1, '0902', 18),
    item('Coffee', 310, 1, '0901', 18),
    item('Sherbet', 180, 1, '2106', 18)
  ];
  const inv = invoice.computeInvoiceFigures(order(1008, items, ''));
  const checkout = pricing.computeTotals(items, '');

  assert.deepEqual(
    { subtotal: inv.subtotal, discount: inv.discount, tax: inv.tax, cgst: inv.cgst, sgst: inv.sgst, total: inv.total,
      rows: inv.rows.map(function (row) { return { gstPercent: row.gstPercent, lineTax: row.lineTax }; }) },
    { subtotal: 630, discount: 0, tax: 113.4, cgst: 56.7, sgst: 56.7, total: 743.4,
      rows: [{ gstPercent: 18, lineTax: 25.2 }, { gstPercent: 18, lineTax: 55.8 }, { gstPercent: 18, lineTax: 32.4 }] }
  );
  assert.deepEqual(
    { subtotal: checkout.subtotal, discount: checkout.discount, tax: checkout.tax, cgst: checkout.cgst, sgst: checkout.sgst, total: checkout.total },
    { subtotal: 630, discount: 0, tax: 113.4, cgst: 56.7, sgst: 56.7, total: 743.4 }
  );
});

test('Invoice uses checkout HSN GST and capped coupon figures for #1004', function () {
  const items = [item('Groundnut Oil', 1120, 2, '1508', 5)];
  const coupon = 'SAVE10';
  const inv = invoice.computeInvoiceFigures(order(1004, items, coupon));
  const checkout = pricing.computeTotals(items, coupon);

  assert.deepEqual(
    { subtotal: inv.subtotal, discount: inv.discount, tax: inv.tax, cgst: inv.cgst, sgst: inv.sgst, total: inv.total },
    { subtotal: checkout.subtotal, discount: checkout.discount, tax: checkout.tax, cgst: checkout.cgst, sgst: checkout.sgst, total: checkout.total }
  );
  assert.deepEqual(
    inv.rows.map(function (row) {
      return { hsn: row.hsn, gstPercent: row.gstPercent, line: row.line, discount: row.discount, taxable: row.taxable, lineTax: row.lineTax };
    }),
    checkout.lines.map(function (line) {
      return { hsn: line.hsn, gstPercent: line.gstPercent, line: line.gross, discount: line.discount, taxable: line.taxable, lineTax: line.tax };
    })
  );
});
