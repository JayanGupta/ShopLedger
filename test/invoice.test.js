const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function computeFigures(order) {
  const { rows, ...invoiceTotals } = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(order.items, order.coupon);

  return {
    invoiceTotals,
    invoiceGst: rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]),
    checkout,
  };
}

test('CURRENT BEHAVIOUR: #1001-style invoice uses the 5% and 12% HSN slabs', () => {
  const order = {
    coupon: '',
    // These order lines carry an HSN but no explicit gstRate.
    items: [
      { name: 'Rice', hsn: '1006', price: 100, qty: 2 },
      { name: 'Ghee', hsn: '0405', price: 300, qty: 1 },
    ],
  };
  const { invoiceTotals, invoiceGst, checkout } = computeFigures(order);

  assert.deepEqual(invoiceTotals, {
    subtotal: 500, discount: 0, tax: 46, cgst: 23, sgst: 23, total: 546,
  });
  assert.deepEqual(invoiceGst, [[5, 10], [12, 36]]);
  assert.deepEqual(checkout.lines.map(({ gstPercent, tax }) => [gstPercent, tax]), [[5, 10], [12, 36]]);
  assert.equal(checkout.tax, 46);
  assert.equal(checkout.total, 546);
});

test('CURRENT BEHAVIOUR: #1002-style SAVE10 applies the checkout discount before GST', () => {
  const order = {
    coupon: 'SAVE10',
    items: [{ name: 'Tea', hsn: '0902', price: 200, qty: 3 }],
  };
  const { invoiceTotals, invoiceGst, checkout } = computeFigures(order);

  assert.deepEqual(invoiceTotals, {
    subtotal: 600, discount: 60, tax: 97.20, cgst: 48.60, sgst: 48.60, total: 637.20,
  });
  assert.deepEqual(invoiceGst, [[18, 97.20]]);
  assert.equal(checkout.discount, 60);
  assert.equal(checkout.tax, 97.20);
  assert.equal(checkout.total, invoiceTotals.total);
});

test('CURRENT BEHAVIOUR: #1004-style SAVE10 invoice applies the ₹150 cap', () => {
  const order = {
    coupon: 'SAVE10',
    items: [{ name: 'Tea', hsn: '0902', price: 280, qty: 8 }],
  };
  const { invoiceTotals, invoiceGst, checkout } = computeFigures(order);

  assert.deepEqual(invoiceTotals, {
    subtotal: 2240, discount: 150, tax: 376.20, cgst: 188.10, sgst: 188.10, total: 2466.20,
  });
  assert.deepEqual(invoiceGst, [[18, 376.20]]);
  assert.equal(checkout.discount, 150);
  assert.equal(checkout.tax, 376.20);
  assert.equal(checkout.total, 2466.20);
});

test('CURRENT BEHAVIOUR: #1008-style all-18% order without a coupon matches checkout', () => {
  const order = {
    coupon: '',
    items: [
      { name: 'Tea', hsn: '0902', price: 125, qty: 2 },
      { name: 'Coffee', hsn: '0901', price: 350, qty: 1, gstRate: 18 },
    ],
  };
  const { invoiceTotals, invoiceGst, checkout } = computeFigures(order);
  const { lines, taxable, ...checkoutTotals } = checkout;

  assert.deepEqual(invoiceTotals, {
    subtotal: 600, discount: 0, tax: 108, cgst: 54, sgst: 54, total: 708,
  });
  assert.deepEqual(invoiceGst, [[18, 45], [18, 63]]);
  assert.deepEqual(invoiceTotals, checkoutTotals);
  assert.deepEqual(invoiceGst, lines.map(({ gstPercent, tax }) => [gstPercent, tax]));
});

test('invoice matches checkout for mixed HSN slabs and capped SAVE10', () => {
  const order = {
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', hsn: '1006', price: 500, qty: 2 },
      { name: 'Ghee', hsn: '0405', price: 620, qty: 2 },
    ],
  };
  const { invoiceTotals, invoiceGst, checkout } = computeFigures(order);
  const { lines, taxable, ...checkoutTotals } = checkout;

  assert.deepEqual(invoiceTotals, {
    subtotal: 2240, discount: 150, tax: 185.49, cgst: 92.75, sgst: 92.74, total: 2275.49,
  });
  assert.deepEqual(invoiceGst, [[5, 46.65], [12, 138.84]]);
  assert.deepEqual(invoiceTotals, checkoutTotals);
  assert.deepEqual(invoiceGst, lines.map(({ gstPercent, tax }) => [gstPercent, tax]));
});
