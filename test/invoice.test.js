const { test } = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// Synthetic saved order lines carry HSNs but have no explicit GST-rate override.
const mixedSlabItems = [
  { id: 1, name: 'Rice', hsn: '1006', price: 120, qty: 5, gstRate: undefined },
  { id: 2, name: 'Ghee', hsn: '0405', price: 200, qty: 2, gstRate: undefined },
];

const cases = [
  {
    name: 'CURRENT BEHAVIOUR: #1001 invoices items at their 5% and 12% HSN rates',
    order: { id: 1001, items: mixedSlabItems, coupon: '' },
    expectedInvoice: {
      totals: { subtotal: 1000, discount: 0, tax: 78, cgst: 39, sgst: 39, total: 1078 },
      rows: [
        { hsn: '1006', gstPercent: 5, line: 600, lineTax: 30 },
        { hsn: '0405', gstPercent: 12, line: 400, lineTax: 48 },
      ],
    },
    expectedCheckout: {
      totals: {
        subtotal: 1000, discount: 0, taxable: 1000, tax: 78, cgst: 39, sgst: 39, total: 1078,
      },
      lines: [
        { hsn: '1006', gstPercent: 5, taxable: 600, tax: 30 },
        { hsn: '0405', gstPercent: 12, taxable: 400, tax: 48 },
      ],
    },
  },
  {
    name: 'CURRENT BEHAVIOUR: #1002 applies SAVE10 before GST',
    order: { id: 1002, items: mixedSlabItems, coupon: 'SAVE10' },
    expectedInvoice: {
      totals: { subtotal: 1000, discount: 100, tax: 70.20, cgst: 35.10, sgst: 35.10, total: 970.20 },
      rows: [
        { hsn: '1006', gstPercent: 5, line: 600, lineTax: 27 },
        { hsn: '0405', gstPercent: 12, line: 400, lineTax: 43.20 },
      ],
    },
    expectedCheckout: {
      totals: {
        subtotal: 1000, discount: 100, taxable: 900, tax: 70.20,
        cgst: 35.10, sgst: 35.10, total: 970.20,
      },
      lines: [
        { hsn: '1006', gstPercent: 5, taxable: 540, tax: 27 },
        { hsn: '0405', gstPercent: 12, taxable: 360, tax: 43.20 },
      ],
    },
  },
  {
    name: 'CURRENT BEHAVIOUR: #1004 caps the invoice SAVE10 discount at ₹150',
    order: {
      id: 1004,
      items: [
        { id: 1, name: 'Rice', hsn: '1006', price: 140, qty: 10, gstRate: undefined },
        { id: 2, name: 'Ghee', hsn: '0405', price: 280, qty: 3, gstRate: undefined },
      ],
      coupon: 'SAVE10',
    },
    expectedInvoice: {
      totals: {
        subtotal: 2240, discount: 150, tax: 159.36, cgst: 79.68, sgst: 79.68,
        total: 2249.36,
      },
      rows: [
        { hsn: '1006', gstPercent: 5, line: 1400, lineTax: 65.31 },
        { hsn: '0405', gstPercent: 12, line: 840, lineTax: 94.05 },
      ],
    },
    expectedCheckout: {
      totals: {
        subtotal: 2240, discount: 150, taxable: 2090, tax: 159.36,
        cgst: 79.68, sgst: 79.68, total: 2249.36,
      },
      lines: [
        { hsn: '1006', gstPercent: 5, taxable: 1306.25, tax: 65.31 },
        { hsn: '0405', gstPercent: 12, taxable: 783.75, tax: 94.05 },
      ],
    },
  },
  {
    name: 'CURRENT BEHAVIOUR: #1008 matches checkout for 18% items without a coupon',
    order: {
      id: 1008,
      items: [
        { id: 3, name: 'Tea', hsn: '0902', price: 250, qty: 2, gstRate: undefined },
        { id: 4, name: 'Coffee', hsn: '0901', price: 125, qty: 2, gstRate: undefined },
      ],
      coupon: '',
    },
    expectedInvoice: {
      totals: { subtotal: 750, discount: 0, tax: 135, cgst: 67.50, sgst: 67.50, total: 885 },
      rows: [
        { hsn: '0902', gstPercent: 18, line: 500, lineTax: 90 },
        { hsn: '0901', gstPercent: 18, line: 250, lineTax: 45 },
      ],
    },
    expectedCheckout: {
      totals: {
        subtotal: 750, discount: 0, taxable: 750, tax: 135, cgst: 67.50, sgst: 67.50, total: 885,
      },
      lines: [
        { hsn: '0902', gstPercent: 18, taxable: 500, tax: 90 },
        { hsn: '0901', gstPercent: 18, taxable: 250, tax: 45 },
      ],
    },
  },
];

for (const { name, order, expectedInvoice, expectedCheckout } of cases) {
  test(name, () => {
    const { lines, ...checkoutTotals } = pricing.computeTotals(order.items, order.coupon);
    const { subtotal, discount, tax, total } = checkoutTotals;
    const billedOrder = { ...order, subtotal, discount, tax, total };
    const { rows, ...invoiceTotals } = invoice.computeInvoiceFigures(billedOrder);

    assert.deepStrictEqual(invoiceTotals, expectedInvoice.totals, 'invoice totals and GST split');
    assert.deepStrictEqual(
      rows.map(({ hsn, gstPercent, line, lineTax }) => ({ hsn, gstPercent, line, lineTax })),
      expectedInvoice.rows,
      'invoice GST per line',
    );
    assert.deepStrictEqual(checkoutTotals, expectedCheckout.totals, 'checkout totals and GST split');
    assert.deepStrictEqual(
      lines.map(({ hsn, gstPercent, taxable, tax }) => ({ hsn, gstPercent, taxable, tax })),
      expectedCheckout.lines,
      'checkout GST per line',
    );
  });
}

test('invoice matches checkout for mixed GST slabs and a capped coupon', () => {
  const items = [
    { id: 1, name: 'Rice', hsn: '1006', price: 350, qty: 4 },
    { id: 2, name: 'Ghee', hsn: '0405', price: 420, qty: 2 },
  ];
  const coupon = 'SAVE10';
  const checkout = pricing.computeTotals(items, coupon);
  const billedOrder = {
    id: 2001,
    items,
    coupon,
    subtotal: checkout.subtotal,
    discount: checkout.discount,
    tax: checkout.tax,
    total: checkout.total,
  };

  assert.equal(checkout.discount, 150);
  const figures = invoice.computeInvoiceFigures(billedOrder);
  const { rows, ...totals } = figures;
  assert.deepStrictEqual(totals, {
    subtotal: checkout.subtotal,
    discount: checkout.discount,
    tax: checkout.tax,
    cgst: checkout.cgst,
    sgst: checkout.sgst,
    total: checkout.total,
  });
  assert.deepStrictEqual(
    rows.map(({ gstPercent, lineTax }) => ({ gstPercent, lineTax })),
    [
      { gstPercent: 5, lineTax: 65.31 },
      { gstPercent: 12, lineTax: 94.05 },
    ],
  );
  const printedInvoice = invoice.render(billedOrder);
  assert.doesNotMatch(printedInvoice, /Accountant Reconciliation Notice/);
  assert.match(printedInvoice, /Per-line GST for items without saved rates is estimated/);

  const config = require('../config');
  const couponSettings = config.coupons[coupon];
  const wasActive = couponSettings.active;
  const riceHsn = items[0].hsn;
  const originalRiceRate = config.tax.hsnSlabs[riceHsn];
  try {
    couponSettings.active = false;
    assert.deepStrictEqual(
      invoice.computeInvoiceFigures(billedOrder),
      figures,
      'reprinting a billed order after its coupon is disabled',
    );

    config.tax.hsnSlabs[riceHsn] = 12;
    const { rows: historicalRows, ...historicalTotals } = invoice.computeInvoiceFigures(billedOrder);
    assert.deepStrictEqual(historicalTotals, totals, 'reprinting after an HSN rate changes');
    for (const row of historicalRows) {
      assert.equal(row.gstPercent, null);
      assert.equal(row.lineTax, null);
    }
    assert.match(invoice.render(billedOrder), /Original per-line GST is unavailable/);
  } finally {
    couponSettings.active = wasActive;
    config.tax.hsnSlabs[riceHsn] = originalRiceRate;
  }
});
