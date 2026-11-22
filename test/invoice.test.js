const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function assertFigures(order, expectedInvoice, expectedCheckout) {
  const { rows, ...invoiceTotals } = invoice.computeInvoiceFigures(order);
  const { lines, ...checkoutTotals } = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(invoiceTotals, expectedInvoice.totals);
  assert.deepEqual(
    rows.map(({ gstPercent, lineTax }) => ({ gstPercent, tax: lineTax })),
    expectedInvoice.lines
  );
  assert.deepEqual(checkoutTotals, expectedCheckout.totals);
  assert.deepEqual(
    lines.map(({ gstPercent, tax }) => ({ gstPercent, tax })),
    expectedCheckout.lines
  );
}

// Checkout stores HSN on order lines. The first three fixtures omit gstRate
// to exercise how each calculator handles those lines.
test('CURRENT BEHAVIOUR: #1001-style invoice uses the 5% and 12% HSN slabs', () => {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      { name: 'Dal', price: 165, qty: 2, hsn: '0713' },
      { name: 'Ghee', price: 280, qty: 1, hsn: '0405' }
    ]
  };

  assertFigures(order, {
    totals: { subtotal: 610, discount: 0, tax: 50.10, cgst: 25.05, sgst: 25.05, total: 660.10 },
    lines: [{ gstPercent: 5, tax: 16.50 }, { gstPercent: 12, tax: 33.60 }]
  }, {
    totals: { subtotal: 610, discount: 0, taxable: 610, tax: 50.10, cgst: 25.05, sgst: 25.05, total: 660.10 },
    lines: [{ gstPercent: 5, tax: 16.50 }, { gstPercent: 12, tax: 33.60 }]
  });
});

test('CURRENT BEHAVIOUR: #1002-style invoice applies SAVE10 before GST', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 640, qty: 1, hsn: '1006' },
      { name: 'Sunflower oil', price: 190, qty: 2, hsn: '1512' }
    ]
  };

  assertFigures(order, {
    totals: { subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90 },
    lines: [{ gstPercent: 5, tax: 28.80 }, { gstPercent: 5, tax: 17.10 }]
  }, {
    totals: { subtotal: 1020, discount: 102, taxable: 918, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90 },
    lines: [{ gstPercent: 5, tax: 28.80 }, { gstPercent: 5, tax: 17.10 }]
  });
});

test('CURRENT BEHAVIOUR: #1004-style invoice honors the SAVE10 cap', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 640, qty: 1, hsn: '1006' },
      { name: 'Tea', price: 400, qty: 4, hsn: '0902' }
    ]
  };

  assertFigures(order, {
    totals: { subtotal: 2240, discount: 150, tax: 298.57, cgst: 149.29, sgst: 149.28, total: 2388.57 },
    lines: [{ gstPercent: 5, tax: 29.86 }, { gstPercent: 18, tax: 268.71 }]
  }, {
    totals: { subtotal: 2240, discount: 150, taxable: 2090, tax: 298.57, cgst: 149.29, sgst: 149.28, total: 2388.57 },
    lines: [{ gstPercent: 5, tax: 29.86 }, { gstPercent: 18, tax: 268.71 }]
  });
});

test('CURRENT BEHAVIOUR: #1008-style invoice matches checkout for 18% items without a coupon', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      { name: 'Tea', price: 140, qty: 2, hsn: '0902' },
      { name: 'Coffee', price: 220, qty: 1, hsn: '0901', gstRate: 18 }
    ]
  };

  assertFigures(order, {
    totals: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 },
    lines: [{ gstPercent: 18, tax: 50.40 }, { gstPercent: 18, tax: 39.60 }]
  }, {
    totals: { subtotal: 500, discount: 0, taxable: 500, tax: 90, cgst: 45, sgst: 45, total: 590 },
    lines: [{ gstPercent: 18, tax: 50.40 }, { gstPercent: 18, tax: 39.60 }]
  });
});

test('invoice matches checkout GST by HSN after capped SAVE10 on a mixed-slab order', () => {
  const order = {
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 500, qty: 2, hsn: '1006' },
      { name: 'Ghee', price: 1000, qty: 1, hsn: '0405' },
      { name: 'Tea', price: 250, qty: 4, hsn: '0902' }
    ]
  };
  const { lines, taxable, ...checkoutTotals } = pricing.computeTotals(order.items, order.coupon);
  const billedOrder = { ...order, ...checkoutTotals };
  const { rows, ...invoiceTotals } = invoice.computeInvoiceFigures(billedOrder);

  assert.equal(checkoutTotals.discount, 150);
  assert.equal(taxable, 2850);
  assert.deepEqual(invoiceTotals, checkoutTotals);
  assert.deepEqual(
    rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]),
    [[5, 47.50], [12, 114], [18, 171]]
  );

  const historicalOrder = { ...billedOrder, coupon: 'RETIRED-COUPON' };
  const { rows: historicalRows, ...historicalTotals } = invoice.computeInvoiceFigures(historicalOrder);
  assert.deepEqual(historicalTotals, checkoutTotals);
  assert.ok(historicalRows.every(({ gstPercent, lineTax }) => gstPercent === null && lineTax === null));
  assert.match(invoice.render(historicalOrder), /original line GST breakdown is unavailable/);
});
