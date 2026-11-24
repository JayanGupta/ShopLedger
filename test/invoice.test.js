const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function assertFigures(order, expectedInvoice, expectedCheckout) {
  const { items, coupon } = order;
  const { rows, ...invoiceTotals } = invoice.computeInvoiceFigures(order);
  const { lines, taxable, ...checkoutTotals } = pricing.computeTotals(items, coupon);

  assert.deepStrictEqual(invoiceTotals, expectedInvoice.totals);
  assert.deepStrictEqual(rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]),
    expectedInvoice.gst);
  assert.deepStrictEqual(checkoutTotals, expectedCheckout.totals);
  assert.deepStrictEqual(lines.map(({ gstPercent, tax }) => [gstPercent, tax]),
    expectedCheckout.gst);
}

test('#1001 invoice uses the checkout HSN slabs and GST', () => {
  // Checkout-shaped lines carry HSN and omit gstRate.
  const order = {
    id: 1001,
    coupon: '',
    items: [
      { id: 1, price: 200, qty: 2, hsn: '1006' },
      { id: 2, price: 200, qty: 1, hsn: '0405' }
    ]
  };

  assertFigures(order, {
    totals: { subtotal: 600, discount: 0, tax: 44, cgst: 22, sgst: 22, total: 644 },
    gst: [[5, 20], [12, 24]]
  }, {
    totals: { subtotal: 600, discount: 0, tax: 44, cgst: 22, sgst: 22, total: 644 },
    gst: [[5, 20], [12, 24]]
  });
});

test('#1002 invoice applies SAVE10 before GST', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [{ id: 3, price: 300, qty: 2, hsn: '0902' }]
  };

  assertFigures(order, {
    totals: { subtotal: 600, discount: 60, tax: 97.2, cgst: 48.6, sgst: 48.6, total: 637.2 },
    gst: [[18, 97.2]]
  }, {
    totals: { subtotal: 600, discount: 60, tax: 97.2, cgst: 48.6, sgst: 48.6, total: 637.2 },
    gst: [[18, 97.2]]
  });
});

test('#1004 invoice honours the SAVE10 cap', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [{ id: 1, price: 560, qty: 4, hsn: '1006' }]
  };

  assertFigures(order, {
    totals: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 },
    gst: [[5, 104.5]]
  }, {
    totals: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 },
    gst: [[5, 104.5]]
  });
});

test('CURRENT BEHAVIOUR: #1008 all-18% order without coupon matches checkout', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      { id: 3, price: 100, qty: 2, hsn: '0902' },
      { id: 4, price: 300, qty: 1, hsn: '0901', gstRate: 18 }
    ]
  };
  const expected = {
    totals: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 },
    gst: [[18, 36], [18, 54]]
  };

  assertFigures(order, expected, expected);
});


test('invoice matches checkout for mixed HSN slabs with a capped coupon', () => {
  const items = [
    { id: 1, price: 700, qty: 2, hsn: '1006' },
    { id: 2, price: 420, qty: 2, hsn: '0405' }
  ];
  const coupon = 'SAVE10';
  const expected = {
    totals: { subtotal: 2240, discount: 150, tax: 159.36, cgst: 79.68, sgst: 79.68, total: 2249.36 },
    gst: [[5, 65.31], [12, 94.05]]
  };

  assertFigures({ items, coupon }, expected, expected);
});
