'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

const cases = [
  {
    name: '#1001 invoice uses the 5% and 12% HSN slabs',
    coupon: '',
    items: [
      { name: 'Dal', price: 165, qty: 2, hsn: '0713', gstRate: undefined },
      { name: 'Ghee', price: 140, qty: 2, hsn: '0405', gstRate: undefined }
    ],
    checkout: { subtotal: 610, discount: 0, tax: 50.10, cgst: 25.05, sgst: 25.05, total: 660.10 },
    checkoutLines: [{ rate: 5, tax: 16.50 }, { rate: 12, tax: 33.60 }],
    invoice: { subtotal: 610, discount: 0, tax: 50.10, cgst: 25.05, sgst: 25.05, total: 660.10 },
    invoiceLines: [{ rate: 5, tax: 16.50 }, { rate: 12, tax: 33.60 }]
  },
  {
    name: '#1002 invoice applies SAVE10 before GST',
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 640, qty: 1, hsn: '1006', gstRate: undefined },
      { name: 'Sunflower oil', price: 380, qty: 1, hsn: '1512', gstRate: undefined }
    ],
    checkout: { subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90 },
    checkoutLines: [{ rate: 5, tax: 28.80 }, { rate: 5, tax: 17.10 }],
    invoice: { subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90 },
    invoiceLines: [{ rate: 5, tax: 28.80 }, { rate: 5, tax: 17.10 }]
  },
  {
    name: '#1004 invoice applies the SAVE10 cap on a ₹2,240 subtotal',
    coupon: 'SAVE10',
    items: [
      { name: 'Groundnut oil', price: 1120, qty: 2, hsn: '1508', gstRate: undefined }
    ],
    checkout: { subtotal: 2240, discount: 150, tax: 104.50, cgst: 52.25, sgst: 52.25, total: 2194.50 },
    checkoutLines: [{ rate: 5, tax: 104.50 }],
    invoice: { subtotal: 2240, discount: 150, tax: 104.50, cgst: 52.25, sgst: 52.25, total: 2194.50 },
    invoiceLines: [{ rate: 5, tax: 104.50 }]
  },
  {
    name: '#1008 invoice matches checkout for 18% items without a coupon',
    coupon: '',
    items: [
      { name: 'Tea', price: 140, qty: 1, hsn: '0902', gstRate: undefined },
      { name: 'Syrup', price: 360, qty: 1, hsn: '2106', gstRate: 18 }
    ],
    checkout: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 },
    checkoutLines: [{ rate: 18, tax: 25.20 }, { rate: 18, tax: 64.80 }],
    invoice: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 },
    invoiceLines: [{ rate: 18, tax: 25.20 }, { rate: 18, tax: 64.80 }]
  }
];

function billingFigures({ subtotal, discount, tax, cgst, sgst, total }) {
  return { subtotal, discount, tax, cgst, sgst, total };
}

for (const fixture of cases) {
  test(`CURRENT BEHAVIOUR: ${fixture.name}`, () => {
    const { items, coupon } = fixture;
    const checkout = pricing.computeTotals(items, coupon);
    const order = {
      items,
      coupon,
      subtotal: checkout.subtotal,
      discount: checkout.discount,
      tax: checkout.tax,
      total: checkout.total
    };
    const figures = invoice.computeInvoiceFigures(order);

    assert.deepStrictEqual(billingFigures(checkout), fixture.checkout);
    assert.deepStrictEqual(
      checkout.lines.map(({ gstPercent, tax }) => ({ rate: gstPercent, tax })),
      fixture.checkoutLines
    );
    assert.deepStrictEqual(billingFigures(figures), fixture.invoice);
    assert.deepStrictEqual(
      figures.rows.map(({ gstPercent, lineTax }) => ({ rate: gstPercent, tax: lineTax })),
      fixture.invoiceLines
    );
  });
}

test('invoice matches billed GST under current and legacy checkout rules', () => {
  const items = [
    { name: 'Groundnut oil', price: 1120, qty: 1, hsn: '1508' },
    { name: 'Ghee', price: 560, qty: 2, hsn: '0405' }
  ];
  const coupon = 'SAVE10';
  const checkout = pricing.computeTotals(items, coupon);
  const order = { id: 1, items, coupon, ...billingFigures(checkout) };

  assert.deepStrictEqual(billingFigures(checkout), {
    subtotal: 2240,
    discount: 150,
    tax: 177.65,
    cgst: 88.83,
    sgst: 88.82,
    total: 2267.65
  });

  const figures = invoice.computeInvoiceFigures(order);
  assert.deepStrictEqual(billingFigures(figures), billingFigures(checkout));
  assert.deepStrictEqual(
    figures.rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]),
    [[5, 52.25], [12, 125.40]]
  );

  const html = invoice.render(order);
  assert.match(html, /Invoice Total<\/td><td class="r">₹2267\.65/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
  assert.doesNotMatch(html, /Rounding Adjustment/);

  // Legacy checkout used the unrounded coupon discount and rounded GST once for the full order.
  const legacyOrder = {
    id: 2,
    items: [
      { name: 'Rice', price: 250, qty: 1, hsn: '1006' },
      { name: 'Ghee', price: 250.05, qty: 1, hsn: '0405' },
      { name: 'Sample', price: 0, qty: 1, hsn: '1006' }
    ],
    coupon: 'SAVE10',
    subtotal: 500.05,
    discount: 50.01,
    tax: 81.01,
    total: 531.06
  };
  const legacy = invoice.computeInvoiceFigures(legacyOrder);
  assert.deepStrictEqual(billingFigures(legacy), {
    subtotal: 500.05,
    discount: 50.01,
    tax: 81.01,
    cgst: 40.51,
    sgst: 40.50,
    total: 531.06
  });
  assert.deepStrictEqual(
    legacy.rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]),
    [[18, 40.50], [18, 40.51], [18, 0]]
  );
  const legacyHtml = invoice.render(legacyOrder);
  assert.match(legacyHtml, /Rounding Adjustment<\/td><td class="r">\+₹0\.01/);
  assert.doesNotMatch(legacyHtml, /Accountant Reconciliation Notice/);

  // Older line rates can differ even when the rounded order totals coincide.
  const matchingTotalsOrder = {
    date: '01/06/2021',
    items: [
      { name: 'Rice', price: 0.10, qty: 1, hsn: '1006' },
      { name: 'Tea', price: 100.09, qty: 1, hsn: '0902' }
    ],
    coupon: '', subtotal: 100.19, discount: 0, tax: 18.03, total: 118.22
  };
  assert.deepStrictEqual(
    invoice.computeInvoiceFigures(matchingTotalsOrder).rows.map(row => row.gstPercent),
    [18, 18]
  );
});
