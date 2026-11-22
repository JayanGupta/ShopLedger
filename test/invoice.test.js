const { test } = require('node:test');
const assert = require('node:assert/strict');

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function figuresFor(items, coupon = '') {
  const order = { items, coupon };
  return {
    invoice: invoice.computeInvoiceFigures(order),
    checkout: pricing.computeTotals(items, coupon)
  };
}

test('CURRENT BEHAVIOUR: #1001-style 5% and 12% lines without a coupon agree when gstRate is present', () => {
  const items = [
    { id: 1, name: 'Rice', sku: 'GRN-001', price: 640, qty: 1, hsn: '1006', gstRate: 5 },
    { id: 7, name: 'Butter', sku: 'DRY-002', price: 260, qty: 1, hsn: '0405', gstRate: 12 }
  ];
  const { invoice: billed, checkout } = figuresFor(items);

  assert.deepEqual(
    { subtotal: billed.subtotal, discount: billed.discount, tax: billed.tax,
      cgst: billed.cgst, sgst: billed.sgst, total: billed.total },
    { subtotal: 900, discount: 0, tax: 63.2, cgst: 31.6, sgst: 31.6, total: 963.2 }
  );
  assert.deepEqual(billed.rows.map(({ gstPercent, lineTax }) => ({ gstPercent, lineTax })), [
    { gstPercent: 5, lineTax: 32 },
    { gstPercent: 12, lineTax: 31.2 }
  ]);
  assert.equal(checkout.tax, 63.2);
  assert.equal(checkout.total, billed.total);
});

test('CURRENT BEHAVIOUR: #1002-style SAVE10 discounts before GST on the invoice', () => {
  const items = [
    { id: 1, name: 'Rice', sku: 'GRN-001', price: 640, qty: 1, hsn: '1006', gstRate: 5 },
    { id: 4, name: 'Sunflower oil', sku: 'OIL-001', price: 190, qty: 2, hsn: '1512', gstRate: 5 }
  ];
  const { invoice: billed, checkout } = figuresFor(items, 'SAVE10');

  assert.deepEqual(
    { subtotal: billed.subtotal, discount: billed.discount, tax: billed.tax,
      cgst: billed.cgst, sgst: billed.sgst, total: billed.total },
    { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 }
  );
  assert.deepEqual(billed.rows.map(({ gstPercent, lineTax }) => ({ gstPercent, lineTax })), [
    { gstPercent: 5, lineTax: 28.8 },
    { gstPercent: 5, lineTax: 17.1 }
  ]);
  assert.equal(checkout.discount, 102);
  assert.equal(checkout.tax, 45.9);
  assert.equal(checkout.total, billed.total);
});

test('CURRENT BEHAVIOUR: #1004-style SAVE10 invoice applies the checkout ₹150 cap', () => {
  const items = [
    { id: 5, name: 'Groundnut oil', sku: 'OIL-002', price: 1120, qty: 2, hsn: '1508', gstRate: 5 }
  ];
  const { invoice: billed, checkout } = figuresFor(items, 'SAVE10');

  assert.deepEqual(
    { subtotal: billed.subtotal, discount: billed.discount, tax: billed.tax,
      cgst: billed.cgst, sgst: billed.sgst, total: billed.total },
    { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 }
  );
  assert.deepEqual(billed.rows.map(({ gstPercent, lineTax }) => ({ gstPercent, lineTax })), [
    { gstPercent: 5, lineTax: 104.5 }
  ]);
  assert.equal(checkout.discount, 150);
  assert.equal(checkout.tax, 104.5);
  assert.equal(checkout.total, 2194.5);
});

test('CURRENT BEHAVIOUR: #1008-style all-18% order without a coupon agrees', () => {
  const items = [
    { id: 8, name: 'Tea', sku: 'BEV-001', price: 140, qty: 1, hsn: '0902', gstRate: 18 },
    { id: 12, name: 'Sherbet', sku: 'BEV-003', price: 180, qty: 2, hsn: '2106', gstRate: 18 }
  ];
  const { invoice: billed, checkout } = figuresFor(items);

  assert.deepEqual(
    { subtotal: billed.subtotal, discount: billed.discount, tax: billed.tax,
      cgst: billed.cgst, sgst: billed.sgst, total: billed.total },
    { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 }
  );
  assert.deepEqual(billed.rows.map(({ gstPercent, lineTax }) => ({ gstPercent, lineTax })), [
    { gstPercent: 18, lineTax: 25.2 },
    { gstPercent: 18, lineTax: 64.8 }
  ]);
  assert.equal(checkout.tax, billed.tax);
  assert.equal(checkout.total, billed.total);
});

test('CURRENT BEHAVIOUR: missing gstRate makes invoice use 5% and 12% HSN codes', () => {
  const items = [
    { id: 1, name: 'Rice', sku: 'GRN-001', price: 640, qty: 1, hsn: '1006' },
    { id: 7, name: 'Butter', sku: 'DRY-002', price: 260, qty: 1, hsn: '0405' }
  ];
  const { invoice: billed, checkout } = figuresFor(items);

  assert.deepEqual(
    { subtotal: billed.subtotal, discount: billed.discount, tax: billed.tax,
      cgst: billed.cgst, sgst: billed.sgst, total: billed.total },
    { subtotal: 900, discount: 0, tax: 63.2, cgst: 31.6, sgst: 31.6, total: 963.2 }
  );
  assert.deepEqual(billed.rows.map(({ gstPercent, lineTax }) => ({ gstPercent, lineTax })), [
    { gstPercent: 5, lineTax: 32 },
    { gstPercent: 12, lineTax: 31.2 }
  ]);
  assert.equal(checkout.tax, 63.2);
  assert.equal(checkout.total, 963.2);
});

test('invoice matches checkout for an HSN-rated order with a capped coupon', () => {
  const order = {
    id: 1004,
    date: '30/01/2022',
    customer: 'Wholesale customer',
    paymentMode: 'khata',
    coupon: 'SAVE10',
    // Placed orders save HSN but do not save gstRate on each item.
    items: [{ id: 5, name: 'Groundnut oil', sku: 'OIL-002', price: 1120, qty: 2, hsn: '1508' }]
  };
  const checkout = pricing.computeTotals(order.items, order.coupon);
  order.total = checkout.total;
  const billed = invoice.computeInvoiceFigures(order);

  assert.deepEqual(
    { subtotal: billed.subtotal, discount: billed.discount, tax: billed.tax,
      cgst: billed.cgst, sgst: billed.sgst, total: billed.total },
    { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 }
  );
  assert.deepEqual(billed.rows.map(({ gstPercent, lineTax }) => ({ gstPercent, lineTax })), [
    { gstPercent: 5, lineTax: 104.5 }
  ]);
  assert.equal(billed.total, checkout.total);
  assert.doesNotMatch(invoice.render(order), /Accountant Reconciliation Notice/);
});
