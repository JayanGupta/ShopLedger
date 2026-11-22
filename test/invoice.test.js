const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

test('invoice matches checkout for capped SAVE10 and mixed HSN slabs', () => {
  const order = {
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 560, qty: 2, hsn: '1006' },
      { name: 'Ghee', price: 1120, qty: 1, hsn: '0405' }
    ]
  };
  const expected = {
    figures: { subtotal: 2240, discount: 150, tax: 177.65, cgst: 88.83, sgst: 88.82, total: 2267.65 },
    lines: [[5, 52.25], [12, 125.4]]
  };

  assertOrder(order, expected, expected);

  // Model a saved sale from before the current coupon rules.
  const historicalOrder = { ...order, subtotal: 2240, discount: 100, tax: 181.9, total: 2321.9 };
  const historicalInvoice = invoice.computeInvoiceFigures(historicalOrder);
  assertFigures(historicalInvoice, {
    subtotal: 2240, discount: 100, tax: 181.9, cgst: 90.95, sgst: 90.95, total: 2321.9
  }, {
    actual: historicalInvoice.rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]),
    expected: [[5, 53.5], [12, 128.4]]
  });
});

function assertFigures(figures, expected, lines) {
  const { subtotal, discount, tax, cgst, sgst, total } = figures;
  assert.deepEqual({ subtotal, discount, tax, cgst, sgst, total }, expected);
  assert.deepEqual(lines.actual, lines.expected);
}

function assertOrder(order, expectedInvoice, expectedCheckout) {
  const printed = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(order.items, order.coupon);

  assertFigures(printed, expectedInvoice.figures, {
    actual: printed.rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]),
    expected: expectedInvoice.lines
  });
  assertFigures(checkout, expectedCheckout.figures, {
    actual: checkout.lines.map(({ gstPercent, tax }) => [gstPercent, tax]),
    expected: expectedCheckout.lines
  });
}

// undefined represents a saved line without an explicit GST rate.
test('#1001 prints the checkout rates for 5% and 12% HSN lines', () => {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      { name: 'Rice', price: 100, qty: 2, hsn: '1006', gstRate: undefined },
      { name: 'Ghee', price: 300, qty: 1, hsn: '0405', gstRate: undefined }
    ]
  };

  const expected = {
    figures: { subtotal: 500, discount: 0, tax: 46, cgst: 23, sgst: 23, total: 546 },
    lines: [[5, 10], [12, 36]]
  };
  assertOrder(order, expected, expected);
});

test('#1002 applies SAVE10 before GST and matches the checkout breakdown', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [{ name: 'Tea', price: 500, qty: 2, hsn: '0902', gstRate: undefined }]
  };

  const expected = {
    figures: { subtotal: 1000, discount: 100, tax: 162, cgst: 81, sgst: 81, total: 1062 },
    lines: [[18, 162]]
  };
  assertOrder(order, expected, expected);
});

test('#1004 applies the checkout SAVE10 cap on the invoice', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [{ name: 'Rice', price: 560, qty: 4, hsn: '1006', gstRate: 5 }]
  };

  const expected = {
    figures: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 },
    lines: [[5, 104.5]]
  };
  assertOrder(order, expected, expected);
});

test('CURRENT BEHAVIOUR: #1008 matches checkout for 18% items without a coupon', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      { name: 'Tea', price: 100, qty: 2, hsn: '0902', gstRate: undefined },
      { name: 'Coffee', price: 300, qty: 1, hsn: '0901', gstRate: 18 }
    ]
  };
  const expected = {
    figures: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 },
    lines: [[18, 36], [18, 54]]
  };

  assertOrder(order, expected, expected);
});
