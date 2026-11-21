const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function line(name, hsn, price, qty) {
  // Model saved order lines that have an HSN but no explicit GST rate.
  return { name, hsn, price, qty, gstRate: undefined };
}

function assertFigures(order, expectedInvoice, expectedCheckout) {
  const { rows, ...invoiceTotals } = invoice.computeInvoiceFigures(order);
  const { lines, taxable, ...checkoutTotals } = pricing.computeTotals(order.items, order.coupon);

  assert.deepStrictEqual({
    ...invoiceTotals,
    lines: rows.map(({ gstPercent, lineTax }) => ({ gstPercent, tax: lineTax })),
  }, expectedInvoice, 'invoice figures');

  assert.deepStrictEqual({
    ...checkoutTotals,
    lines: lines.map(({ gstPercent, tax }) => ({ gstPercent, tax })),
  }, expectedCheckout, 'checkout figures');
}

test('CURRENT BEHAVIOUR: #1001 invoice uses the 5% and 12% HSN rates', () => {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      line('Rice', '1006', 250, 2),
      line('Ghee', '0405', 300, 1),
    ],
  };

  const expected = {
    subtotal: 800, discount: 0, tax: 61, cgst: 30.5, sgst: 30.5, total: 861,
    lines: [{ gstPercent: 5, tax: 25 }, { gstPercent: 12, tax: 36 }],
  };
  assertFigures(order, expected, expected);
});

test('CURRENT BEHAVIOUR: #1002 invoice applies SAVE10 before GST', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      line('Tea', '0902', 250, 2),
      line('Coffee', '0901', 500, 1),
    ],
  };

  const expected = {
    subtotal: 1000, discount: 100, tax: 162, cgst: 81, sgst: 81, total: 1062,
    lines: [{ gstPercent: 18, tax: 81 }, { gstPercent: 18, tax: 81 }],
  };
  assertFigures(order, expected, expected);
});

test('CURRENT BEHAVIOUR: #1004 invoice applies the SAVE10 cap', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      line('Rice', '1006', 700, 2),
      line('Ghee', '0405', 420, 2),
    ],
  };

  const expected = {
    subtotal: 2240, discount: 150, tax: 159.36, cgst: 79.68, sgst: 79.68, total: 2249.36,
    lines: [{ gstPercent: 5, tax: 65.31 }, { gstPercent: 12, tax: 94.05 }],
  };
  assertFigures(order, expected, expected);
});

test('CURRENT BEHAVIOUR: #1008 invoice matches checkout for all-18% items without a coupon', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      line('Tea', '0902', 250, 2),
      line('Coffee', '0901', 200, 1),
    ],
  };
  const expected = {
    subtotal: 700, discount: 0, tax: 126, cgst: 63, sgst: 63, total: 826,
    lines: [{ gstPercent: 18, tax: 90 }, { gstPercent: 18, tax: 36 }],
  };

  assertFigures(order, expected, expected);
});

test('invoice shows the billed total and GST for a mixed-slab order with capped SAVE10', () => {
  const order = {
    id: 1010,
    coupon: 'SAVE10',
    items: [
      line('Rice', '1006', 500, 2),
      line('Ghee', '0405', 750, 2),
    ],
    subtotal: 2500,
    discount: 150,
    tax: 216.2,
    total: 2566.2,
  };

  const figures = invoice.computeInvoiceFigures(order);
  assert.equal(figures.total, order.total);
  assert.equal(figures.subtotal, order.subtotal);
  assert.equal(figures.discount, order.discount);
  assert.equal(figures.tax, order.tax);
  assert.equal(figures.cgst, 108.1);
  assert.equal(figures.sgst, 108.1);
  assert.deepStrictEqual(
    figures.rows.map(({ gstPercent, lineTax }) => ({ gstPercent, lineTax })),
    [{ gstPercent: 5, lineTax: 47 }, { gstPercent: 12, lineTax: 169.2 }],
  );

  const html = invoice.render(order);
  assert.match(html, /<td class="r">5%<\/td><td class="r">₹47\.00<\/td>/);
  assert.match(html, /<td class="r">12%<\/td><td class="r">₹169\.20<\/td>/);
  assert.match(html, /<td>Invoice Total<\/td><td class="r">₹2566\.20<\/td>/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
});
