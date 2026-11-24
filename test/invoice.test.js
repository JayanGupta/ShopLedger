const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function calculate(items, coupon) {
  return {
    printed: invoice.computeInvoiceFigures({ items, coupon }),
    checkout: pricing.computeTotals(items, coupon)
  };
}

function assertFigures({ printed, checkout }, expectedPrinted, expectedCheckout) {
  const { rows, ...figures } = printed;
  assert.deepEqual(figures, expectedPrinted.figures);
  assert.deepEqual(
    rows.map(({ gstPercent, line, lineTax }) => [gstPercent, line, lineTax]),
    expectedPrinted.lines
  );
  const { discount, tax, total, lines } = checkout;
  assert.deepEqual(
    { discount, tax, total, rates: lines.map(({ gstPercent }) => gstPercent) },
    expectedCheckout
  );
}

test('CURRENT BEHAVIOUR: #1001 uses the 5% and 12% HSN slabs', () => {
  // Missing gstRate models a checkout line with an HSN but no saved rate.
  const items = [
    { id: 1, name: 'Dal', price: 165, qty: 2, hsn: '0713', gstRate: undefined },
    { id: 2, name: 'Butter', price: 140, qty: 2, hsn: '0405', gstRate: undefined }
  ];

  assertFigures(calculate(items, ''), {
    figures: { subtotal: 610, discount: 0, tax: 50.1, cgst: 25.05, sgst: 25.05, total: 660.1 },
    lines: [[5, 330, 16.5], [12, 280, 33.6]]
  }, { discount: 0, tax: 50.1, total: 660.1, rates: [5, 12] });
});

test('CURRENT BEHAVIOUR: #1002 applies SAVE10 before GST', () => {
  const items = [
    { id: 1, name: 'Rice', price: 640, qty: 1, hsn: '1006', gstRate: undefined },
    { id: 2, name: 'Sunflower oil', price: 190, qty: 2, hsn: '1512', gstRate: undefined }
  ];

  assertFigures(calculate(items, 'SAVE10'), {
    figures: { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 },
    lines: [[5, 640, 28.8], [5, 380, 17.1]]
  }, { discount: 102, tax: 45.9, total: 963.9, rates: [5, 5] });
});

test('CURRENT BEHAVIOUR: #1004 caps SAVE10 at ₹150 on ₹2,240', () => {
  const items = [
    { id: 1, name: 'Groundnut oil', price: 1120, qty: 2, hsn: '1508', gstRate: undefined }
  ];

  assertFigures(calculate(items, 'SAVE10'), {
    figures: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 },
    lines: [[5, 2240, 104.5]]
  }, { discount: 150, tax: 104.5, total: 2194.5, rates: [5] });
});

test('CURRENT BEHAVIOUR: #1008 matches checkout for 18% lines without a coupon', () => {
  const items = [
    { id: 1, name: 'Tea', price: 140, qty: 1, hsn: '0902', gstRate: 18 },
    { id: 2, name: 'Sherbet', price: 180, qty: 2, hsn: '2106', gstRate: undefined }
  ];

  assertFigures(calculate(items, ''), {
    figures: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 },
    lines: [[18, 140, 25.2], [18, 360, 64.8]]
  }, { discount: 0, tax: 90, total: 590, rates: [18, 18] });
});

test('invoice matches checkout for mixed GST slabs and a capped coupon', () => {
  const items = [
    { id: 1, name: 'Rice', price: 800, qty: 2, hsn: '1006' },
    { id: 2, name: 'Ghee', price: 640, qty: 1, hsn: '0405' }
  ];
  const coupon = 'SAVE10';
  const checkout = pricing.computeTotals(items, coupon);
  const order = {
    id: 1, items, coupon, subtotal: checkout.subtotal, discount: checkout.discount,
    tax: checkout.tax, total: checkout.total
  };
  const { rows, ...figures } = invoice.computeInvoiceFigures(order);

  assert.equal(figures.total, checkout.total, 'invoice payable total matches checkout');
  assert.deepEqual(figures, {
    subtotal: 2240, discount: 150, tax: 146.3, cgst: 73.15, sgst: 73.15, total: 2236.3
  });
  assert.deepEqual(rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]), [
    [5, 74.64], [12, 71.66]
  ]);

  const html = invoice.render(order);
  assert.match(html, /<td[^>]*>5%<\/td><td[^>]*>₹74\.64<\/td>/);
  assert.match(html, /<td[^>]*>12%<\/td><td[^>]*>₹71\.66<\/td>/);
  assert.match(html, /Invoice Total<\/td><td[^>]*>₹2236\.30<\/td>/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
});
