'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function figures({ subtotal, discount, tax, cgst, sgst, total }) {
  return { subtotal, discount, tax, cgst, sgst, total };
}

function compare(order, expectedInvoice, expectedCheckout, expectedLines) {
  const printed = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepStrictEqual(figures(printed), expectedInvoice, 'invoice totals');
  assert.deepStrictEqual(figures(checkout), expectedCheckout, 'checkout totals');
  assert.deepStrictEqual(
    printed.rows.map(({ hsn, gstPercent, line, lineTax }) => ({ hsn, gstPercent, line, lineTax })),
    expectedLines,
    'invoice line GST breakdown'
  );
}

// Leave gstRate absent on HSN-only lines to exercise HSN slab lookup.
test('#1001 prints 5% and 12% HSN items at their checkout rates', () => {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      { id: 1, name: 'Rice', hsn: '1006', price: 150, qty: 2 },
      { id: 2, name: 'Ghee', hsn: '0405', price: 240, qty: 1 },
    ],
  };

  compare(order,
    { subtotal: 540, discount: 0, tax: 43.8, cgst: 21.9, sgst: 21.9, total: 583.8 },
    { subtotal: 540, discount: 0, tax: 43.8, cgst: 21.9, sgst: 21.9, total: 583.8 },
    [
      { hsn: '1006', gstPercent: 5, line: 300, lineTax: 15 },
      { hsn: '0405', gstPercent: 12, line: 240, lineTax: 28.8 },
    ]
  );
});

test('#1002 applies SAVE10 before GST on the invoice', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      { id: 1, name: 'Rice', hsn: '1006', price: 640, qty: 1 },
      { id: 3, name: 'Sunflower oil', hsn: '1512', price: 190, qty: 2 },
    ],
  };

  compare(order,
    { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 },
    { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 },
    [
      { hsn: '1006', gstPercent: 5, line: 640, lineTax: 28.8 },
      { hsn: '1512', gstPercent: 5, line: 380, lineTax: 17.1 },
    ]
  );
});

test('#1004 honors the 150 rupee SAVE10 cap on the invoice', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { id: 1, name: 'Rice', hsn: '1006', price: 640, qty: 2 },
      { id: 2, name: 'Ghee', hsn: '0405', price: 480, qty: 2 },
    ],
  };

  compare(order,
    { subtotal: 2240, discount: 150, tax: 167.2, cgst: 83.6, sgst: 83.6, total: 2257.2 },
    { subtotal: 2240, discount: 150, tax: 167.2, cgst: 83.6, sgst: 83.6, total: 2257.2 },
    [
      { hsn: '1006', gstPercent: 5, line: 1280, lineTax: 59.71 },
      { hsn: '0405', gstPercent: 12, line: 960, lineTax: 107.49 },
    ]
  );
});

test('CURRENT BEHAVIOUR: #1008 matches checkout for all 18% items without a coupon', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      { id: 4, name: 'Tea', hsn: '0902', price: 140, qty: 2 },
      { id: 5, name: 'Coffee', hsn: '0901', price: 120, qty: 1, gstRate: 18 },
    ],
  };
  const totals = { subtotal: 400, discount: 0, tax: 72, cgst: 36, sgst: 36, total: 472 };

  compare(order, totals, totals, [
    { hsn: '0902', gstPercent: 18, line: 280, lineTax: 50.4 },
    { hsn: '0901', gstPercent: 18, line: 120, lineTax: 21.6 },
  ]);
});

test('invoice matches checkout for a capped coupon across mixed HSN slabs', () => {
  const items = [
    { name: 'Rice', sku: 'RICE', hsn: '1006', price: 1120, qty: 1 },
    { name: 'Ghee', sku: 'GHEE', hsn: '0405', price: 560, qty: 1 },
    { name: 'Tea', sku: 'TEA', hsn: '0902', price: 280, qty: 2 },
  ];
  const coupon = 'SAVE10';
  const checkout = pricing.computeTotals(items, coupon);
  const order = { ...figures(checkout), items, coupon };

  assert.strictEqual(checkout.discount, 150);
  compare(order, figures(checkout), figures(checkout), [
    { hsn: '1006', gstPercent: 5, line: 1120, lineTax: 52.25 },
    { hsn: '0405', gstPercent: 12, line: 560, lineTax: 62.7 },
    { hsn: '0902', gstPercent: 18, line: 560, lineTax: 94.05 },
  ]);

  assert.doesNotMatch(invoice.render(order), /Accountant Reconciliation Notice/);
  assert.match(
    invoice.render({ ...order, total: 2298 }),
    /differs from Order Ledger recorded total \(₹2298\.00\) by \+₹1\.00/
  );
});
