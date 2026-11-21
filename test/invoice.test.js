const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function assertOrderFigures(order, expectedInvoice, expectedCheckout) {
  const { rows, ...invoiceTotals } = invoice.computeInvoiceFigures(order);
  const { subtotal, discount, tax, cgst, sgst, total, lines } =
    pricing.computeTotals(order.items, order.coupon);

  assert.deepStrictEqual({
    ...invoiceTotals,
    lineGst: rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]),
  }, expectedInvoice, 'invoice figures');

  assert.deepStrictEqual({
    subtotal, discount, tax, cgst, sgst, total,
    lineGst: lines.map(({ gstPercent, tax }) => [gstPercent, tax]),
  }, expectedCheckout, 'checkout figures');
}

test('invoice matches checkout for mixed HSN slabs and capped SAVE10', () => {
  const order = {
    items: [
      { id: 1, name: 'Groundnut oil', price: 1120, qty: 1, hsn: '1508' },
      { id: 2, name: 'Ghee', price: 560, qty: 2, hsn: '0405' },
    ],
    coupon: 'SAVE10',
    subtotal: 2240,
    discount: 150,
    tax: 177.65,
    total: 2267.65,
  };
  const figures = {
    subtotal: 2240, discount: 150, tax: 177.65, cgst: 88.83, sgst: 88.82, total: 2267.65,
    lineGst: [[5, 52.25], [12, 125.40]],
  };

  assertOrderFigures(order, figures, figures);

  const html = invoice.render(order);
  assert.match(html, /5%<\/td><td class="r">₹52\.25/);
  assert.match(html, /12%<\/td><td class="r">₹125\.40/);
  assert.match(html, /Coupon Discount \(SAVE10\).*?-₹150\.00/);
  assert.match(html, /Invoice Total<\/td><td class="r">₹2267\.65/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);

  // Reprint an order billed before its coupon was deactivated.
  const expiredCouponOrder = { ...order, coupon: 'DIWALI20', discount: 250, tax: 169.15, total: 2159.15 };
  const { rows, ...reprintTotals } = invoice.computeInvoiceFigures(expiredCouponOrder);
  assert.deepStrictEqual(reprintTotals, {
    subtotal: 2240, discount: 250, tax: 169.15, cgst: 84.58, sgst: 84.57, total: 2159.15,
  });
  assert.deepStrictEqual(rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]), [[5, 49.75], [12, 119.40]]);
  const reprint = invoice.render(expiredCouponOrder);
  assert.match(reprint, /Coupon Discount \(DIWALI20\).*?-₹250\.00/);
  assert.doesNotMatch(reprint, /Accountant Reconciliation Notice/);
});

test('CURRENT BEHAVIOUR: #1001-style mixed GST uses the 5% and 12% HSN slabs', () => {
  const order = {
    items: [
      { id: 1, name: 'Dal', price: 165, qty: 2, hsn: '0713' },
      { id: 2, name: 'Ghee', price: 140, qty: 2, hsn: '0405' },
    ],
    coupon: '',
  };

  const figures = {
    subtotal: 610, discount: 0, tax: 50.10, cgst: 25.05, sgst: 25.05, total: 660.10,
    lineGst: [[5, 16.50], [12, 33.60]],
  };

  assertOrderFigures(order, figures, figures);
});

test('CURRENT BEHAVIOUR: #1002-style invoice applies SAVE10 before GST', () => {
  const order = {
    items: [
      { id: 1, name: 'Rice', price: 640, qty: 1, hsn: '1006' },
      { id: 2, name: 'Sunflower oil', price: 190, qty: 2, hsn: '1512' },
    ],
    coupon: 'SAVE10',
  };

  const figures = {
    subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90,
    lineGst: [[5, 28.80], [5, 17.10]],
  };

  assertOrderFigures(order, figures, figures);
});

test('CURRENT BEHAVIOUR: #1004-style invoice caps SAVE10 at 150 on 2,240', () => {
  const order = {
    items: [{ id: 1, name: 'Groundnut oil', price: 1120, qty: 2, hsn: '1508' }],
    coupon: 'SAVE10',
  };

  const figures = {
    subtotal: 2240, discount: 150, tax: 104.50, cgst: 52.25, sgst: 52.25, total: 2194.50,
    lineGst: [[5, 104.50]],
  };

  assertOrderFigures(order, figures, figures);
});

test('CURRENT BEHAVIOUR: #1008-style 18% items without a coupon match checkout', () => {
  const order = {
    items: [
      { id: 1, name: 'Tea', price: 140, qty: 1, hsn: '0902', gstRate: 18 },
      { id: 2, name: 'Syrup', price: 180, qty: 2, hsn: '2106' },
    ],
    coupon: '',
  };
  const figures = {
    subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590,
    lineGst: [[18, 25.20], [18, 64.80]],
  };

  assertOrderFigures(order, figures, figures);
});
