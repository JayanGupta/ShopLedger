const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');
const config = require('../config');

function computeOrderFigures(id, items, coupon) {
  const { subtotal, discount, tax, cgst, sgst, total } = pricing.computeTotals(items, coupon);
  const order = { id, items, coupon, subtotal, discount, tax, total };
  const { rows, ...invoiceTotals } = invoice.computeInvoiceFigures(order);

  return {
    checkoutTotals: { subtotal, discount, tax, cgst, sgst, total },
    invoiceTotals,
    invoiceLineGst: rows.map(({ hsn, gstPercent, lineTax }) => ({ hsn, gstPercent, lineTax })),
  };
}

// Checkout saves the HSN on each order line and leaves gstRate unset.
test('#1001 invoices 5% and 12% HSN items at their checkout rates', () => {
  const items = [
    { price: 165, qty: 2, hsn: '0713', gstRate: undefined },
    { price: 280, qty: 1, hsn: '0405', gstRate: undefined },
  ];
  const { checkoutTotals, invoiceTotals, invoiceLineGst } = computeOrderFigures(1001, items, '');

  assert.deepEqual(checkoutTotals, {
    subtotal: 610, discount: 0, tax: 50.1, cgst: 25.05, sgst: 25.05, total: 660.1,
  });
  assert.deepEqual(invoiceTotals, checkoutTotals);
  assert.deepEqual(invoiceLineGst, [
    { hsn: '0713', gstPercent: 5, lineTax: 16.5 },
    { hsn: '0405', gstPercent: 12, lineTax: 33.6 },
  ]);
});

test('#1002 applies SAVE10 before GST on the invoice', () => {
  const items = [
    { price: 640, qty: 1, hsn: '1006', gstRate: undefined },
    { price: 190, qty: 2, hsn: '1512', gstRate: undefined },
  ];
  const { checkoutTotals, invoiceTotals, invoiceLineGst } = computeOrderFigures(1002, items, 'SAVE10');

  assert.deepEqual(checkoutTotals, {
    subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9,
  });
  assert.deepEqual(invoiceTotals, checkoutTotals);
  assert.deepEqual(invoiceLineGst, [
    { hsn: '1006', gstPercent: 5, lineTax: 28.8 },
    { hsn: '1512', gstPercent: 5, lineTax: 17.1 },
  ]);
});

test('#1004 applies the ₹150 SAVE10 cap on the invoice', () => {
  const items = [{ price: 1120, qty: 2, hsn: '1508', gstRate: undefined }];
  const { checkoutTotals, invoiceTotals, invoiceLineGst } = computeOrderFigures(1004, items, 'SAVE10');

  assert.deepEqual(checkoutTotals, {
    subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5,
  });
  assert.deepEqual(invoiceTotals, checkoutTotals);
  assert.deepEqual(invoiceLineGst, [
    { hsn: '1508', gstPercent: 5, lineTax: 104.5 },
  ]);
});

test('CURRENT BEHAVIOUR: #1008 matches checkout for 18% GST without a coupon', () => {
  const items = [
    { price: 140, qty: 1, hsn: '0902', gstRate: undefined },
    { price: 180, qty: 2, hsn: '2106', gstRate: undefined },
  ];
  const { checkoutTotals, invoiceTotals, invoiceLineGst } = computeOrderFigures(1008, items, '');

  const expectedTotals = {
    subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590,
  };
  assert.deepEqual(checkoutTotals, expectedTotals);
  assert.deepEqual(invoiceTotals, expectedTotals);
  assert.deepEqual(invoiceLineGst, [
    { hsn: '0902', gstPercent: 18, lineTax: 25.2 },
    { hsn: '2106', gstPercent: 18, lineTax: 64.8 },
  ]);
});

test('invoice matches checkout for mixed HSN slabs and a capped coupon', () => {
  const items = [
    { price: 1120, qty: 1, hsn: '1508' },
    { price: 350, qty: 2, hsn: '0405' },
    { price: 140, qty: 3, hsn: '0902' },
  ];
  const { checkoutTotals, invoiceTotals, invoiceLineGst } = computeOrderFigures(1009, items, 'SAVE10');

  assert.deepEqual(checkoutTotals, {
    subtotal: 2240, discount: 150, tax: 201.16, cgst: 100.58, sgst: 100.58, total: 2291.16,
  });
  assert.deepEqual(invoiceTotals, checkoutTotals);
  assert.deepEqual(invoiceLineGst, [
    { hsn: '1508', gstPercent: 5, lineTax: 52.25 },
    { hsn: '0405', gstPercent: 12, lineTax: 78.37 },
    { hsn: '0902', gstPercent: 18, lineTax: 70.54 },
  ]);

  const savedOrder = { id: 1009, items, coupon: 'SAVE10', ...checkoutTotals };
  const coupon = config.coupons.SAVE10;
  const wasActive = coupon.active;
  try {
    coupon.active = false;
    const { rows, ...reprintedTotals } = invoice.computeInvoiceFigures(savedOrder);
    assert.deepEqual(reprintedTotals, checkoutTotals);
    assert.deepEqual(rows.map(({ hsn, gstPercent, lineTax }) => ({ hsn, gstPercent, lineTax })), invoiceLineGst);
  } finally {
    coupon.active = wasActive;
  }
});
