'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// Saved order lines from the current order flow have HSN codes but no explicit
// gstRate. Null keeps that persisted shape while documenting the invoice fallback.
function item(id, name, sku, hsn, price, qty) {
  return { id, name, sku, hsn, price, qty, gstRate: null };
}

test('#1001 invoice uses the checkout HSN slabs for mixed 5% and 18% items', function () {
  const items = [
    item(8, 'Assam CTC Masala Chai 250g', 'BEV-001', '0902', 140, 2),
    item(2, 'Unpolished Toor Dal 1kg', 'GRN-002', '0713', 165, 2)
  ];
  const order = { id: 1001, items, coupon: '' };
  const checkout = pricing.computeTotals(items, '');
  const figures = invoice.computeInvoiceFigures(order);

  assert.equal(checkout.tax, 66.9);
  assert.equal(checkout.total, 676.9);
  assert.deepEqual(figures, {
    subtotal: 610,
    discount: 0,
    tax: 66.9,
    cgst: 33.45,
    sgst: 33.45,
    total: 676.9,
    rows: [
      { name: 'Assam CTC Masala Chai 250g', sku: 'BEV-001', hsn: '0902', qty: 2, price: 140, gstPercent: 18, line: 280, lineTax: 50.4 },
      { name: 'Unpolished Toor Dal 1kg', sku: 'GRN-002', hsn: '0713', qty: 2, price: 165, gstPercent: 5, line: 330, lineTax: 16.5 }
    ]
  });
});

test('#1002 invoice uses HSN slabs and applies SAVE10 as checkout does', function () {
  const items = [
    item(1, 'Indrayani Basmati Rice 5kg', 'GRN-001', '1006', 640, 1),
    item(4, 'Cold-Pressed Sunflower Oil 1L', 'OIL-001', '1512', 190, 2)
  ];
  const order = { id: 1002, items, coupon: 'SAVE10' };
  const checkout = pricing.computeTotals(items, 'SAVE10');
  const figures = invoice.computeInvoiceFigures(order);

  assert.equal(checkout.discount, 102);
  assert.equal(checkout.tax, 45.9);
  assert.equal(checkout.total, 963.9);
  assert.deepEqual(figures, {
    subtotal: 1020,
    discount: 102,
    tax: 45.9,
    cgst: 22.95,
    sgst: 22.95,
    total: 963.9,
    rows: [
      { name: 'Indrayani Basmati Rice 5kg', sku: 'GRN-001', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
      { name: 'Cold-Pressed Sunflower Oil 1L', sku: 'OIL-001', hsn: '1512', qty: 2, price: 190, gstPercent: 5, line: 380, lineTax: 17.1 }
    ]
  });
});

test('#1004 invoice respects the SAVE10 checkout cap on ₹2,240', function () {
  const items = [
    item(5, 'Cold-Pressed Groundnut Oil 5L', 'OIL-002', '1508', 1120, 2)
  ];
  const order = { id: 1004, items, coupon: 'SAVE10' };
  const checkout = pricing.computeTotals(items, 'SAVE10');
  const figures = invoice.computeInvoiceFigures(order);

  assert.equal(checkout.discount, 150);
  assert.equal(checkout.tax, 104.5);
  assert.equal(checkout.total, 2194.5);
  assert.deepEqual(figures, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      { name: 'Cold-Pressed Groundnut Oil 5L', sku: 'OIL-002', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  });
});

test('#1008 all-18% invoice matches checkout without a coupon', function () {
  const items = [
    item(8, 'Assam CTC Masala Chai 250g', 'BEV-001', '0902', 140, 1),
    item(12, 'Kokum Sherbet Concentrate 750ml', 'BEV-003', '2106', 180, 2)
  ];
  const order = { id: 1008, items, coupon: '' };
  const checkout = pricing.computeTotals(items, '');
  const figures = invoice.computeInvoiceFigures(order);

  assert.equal(checkout.tax, 90);
  assert.equal(checkout.total, 590);
  assert.deepEqual(figures, {
    subtotal: 500,
    discount: 0,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 590,
    rows: [
      { name: 'Assam CTC Masala Chai 250g', sku: 'BEV-001', hsn: '0902', qty: 1, price: 140, gstPercent: 18, line: 140, lineTax: 25.2 },
      { name: 'Kokum Sherbet Concentrate 750ml', sku: 'BEV-003', hsn: '2106', qty: 2, price: 180, gstPercent: 18, line: 360, lineTax: 64.8 }
    ]
  });
});
