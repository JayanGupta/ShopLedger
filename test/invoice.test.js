'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(id, name, hsn, price, qty) {
  return { id, name, sku: `SKU-${id}`, hsn, price, qty };
}

function compare(itemList, coupon) {
  const order = { id: 1, items: itemList, coupon };
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutFigures = pricing.computeTotals(itemList, coupon);
  return { invoiceFigures, checkoutFigures };
}

test('CURRENT BEHAVIOUR: #1001 invoice GST uses each HSN slab', () => {
  const { invoiceFigures, checkoutFigures } = compare([
    item(8, 'Assam CTC Masala Chai 250g', '0902', 140, 2),
    item(2, 'Unpolished Toor Dal 1kg', '0713', 165, 2)
  ], '');

  assert.deepEqual(invoiceFigures, {
    subtotal: 610, discount: 0, tax: 66.9, cgst: 33.45, sgst: 33.45, total: 676.9,
    rows: [
      { name: 'Assam CTC Masala Chai 250g', sku: 'SKU-8', hsn: '0902', qty: 2, price: 140, gstPercent: 18, line: 280, lineTax: 50.4 },
      { name: 'Unpolished Toor Dal 1kg', sku: 'SKU-2', hsn: '0713', qty: 2, price: 165, gstPercent: 5, line: 330, lineTax: 16.5 }
    ]
  });
  assert.equal(invoiceFigures.subtotal, checkoutFigures.subtotal);
  assert.equal(invoiceFigures.discount, checkoutFigures.discount);
  assert.equal(invoiceFigures.tax, checkoutFigures.tax);
  assert.equal(invoiceFigures.cgst, checkoutFigures.cgst);
  assert.equal(invoiceFigures.sgst, checkoutFigures.sgst);
  assert.equal(invoiceFigures.total, checkoutFigures.total);
});

test('CURRENT BEHAVIOUR: #1002 SAVE10 is deducted before slab GST', () => {
  const { invoiceFigures, checkoutFigures } = compare([
    item(1, 'Indrayani Basmati Rice 5kg', '1006', 640, 1),
    item(4, 'Cold-Pressed Sunflower Oil 1L', '1512', 190, 2)
  ], 'SAVE10');

  assert.equal(invoiceFigures.subtotal, 1020);
  assert.equal(invoiceFigures.discount, 102);
  assert.equal(invoiceFigures.tax, 45.9);
  assert.equal(invoiceFigures.cgst, 22.95);
  assert.equal(invoiceFigures.sgst, 22.95);
  assert.equal(invoiceFigures.total, 963.9);
  assert.equal(invoiceFigures.total, checkoutFigures.total);
});

test('CURRENT BEHAVIOUR: #1004 SAVE10 discount respects the ₹150 cap before GST', () => {
  const { invoiceFigures, checkoutFigures } = compare([
    item(5, 'Cold-Pressed Groundnut Oil 5L', '1508', 1120, 2)
  ], 'SAVE10');

  assert.equal(invoiceFigures.subtotal, 2240);
  assert.equal(invoiceFigures.discount, 150);
  assert.equal(invoiceFigures.tax, 104.5);
  assert.equal(invoiceFigures.cgst, 52.25);
  assert.equal(invoiceFigures.sgst, 52.25);
  assert.equal(invoiceFigures.total, 2194.5);
  assert.equal(invoiceFigures.total, checkoutFigures.total);
});

test('CURRENT BEHAVIOUR: #1008 no-coupon 18% slab invoice matches checkout', () => {
  const { invoiceFigures, checkoutFigures } = compare([
    item(8, 'Assam CTC Masala Chai 250g', '0902', 140, 1),
    item(12, 'Kokum Sherbet Concentrate 750ml', '2106', 180, 2)
  ], '');

  assert.equal(invoiceFigures.subtotal, 500);
  assert.equal(invoiceFigures.discount, 0);
  assert.equal(invoiceFigures.tax, 90);
  assert.equal(invoiceFigures.cgst, 45);
  assert.equal(invoiceFigures.sgst, 45);
  assert.equal(invoiceFigures.total, 590);
  assert.equal(invoiceFigures.total, checkoutFigures.total);
});
