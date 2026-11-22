const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// Synthetic orders, not database records. The #1001-style fixture deliberately
// uses the requested 5%/12% mix. No persistence modules or database files are used.
// Undefined gstRate models an omitted explicit rate: both calculators resolve HSN.
const cases = [
  {
    name: 'CURRENT BEHAVIOUR: #1001-style invoice uses mixed HSN slabs',
    order: {
      id: 1001, coupon: '',
      items: [
        { id: 1, name: 'Rice', sku: 'RICE', price: 640, qty: 1, hsn: '1006', gstRate: undefined },
        { id: 6, name: 'Ghee', sku: 'GHEE', price: 450, qty: 1, hsn: '0405', gstRate: undefined }
      ]
    },
    expectedInvoice: {
      subtotal: 1090, discount: 0, tax: 86, cgst: 43, sgst: 43, total: 1176,
      rows: [
        { name: 'Rice', sku: 'RICE', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 32 },
        { name: 'Ghee', sku: 'GHEE', hsn: '0405', qty: 1, price: 450, gstPercent: 12, line: 450, lineTax: 54 }
      ]
    },
    expectedCheckout: { subtotal: 1090, discount: 0, taxable: 1090, tax: 86, cgst: 43, sgst: 43, total: 1176 },
    expectedCheckoutGst: [{ gstPercent: 5, tax: 32 }, { gstPercent: 12, tax: 54 }]
  },
  {
    name: 'CURRENT BEHAVIOUR: #1002-style SAVE10 discounts invoice value before GST',
    order: {
      id: 1002, coupon: 'SAVE10',
      items: [
        { id: 1, name: 'Rice', sku: 'RICE', price: 640, qty: 1, hsn: '1006', gstRate: undefined },
        { id: 4, name: 'Oil', sku: 'OIL', price: 190, qty: 2, hsn: '1512', gstRate: undefined }
      ]
    },
    expectedInvoice: {
      subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9,
      rows: [
        { name: 'Rice', sku: 'RICE', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
        { name: 'Oil', sku: 'OIL', hsn: '1512', qty: 2, price: 190, gstPercent: 5, line: 380, lineTax: 17.1 }
      ]
    },
    expectedCheckout: { subtotal: 1020, discount: 102, taxable: 918, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 },
    expectedCheckoutGst: [{ gstPercent: 5, tax: 28.8 }, { gstPercent: 5, tax: 17.1 }]
  },
  {
    name: 'CURRENT BEHAVIOUR: #1004-style SAVE10 invoice respects the 150 cap',
    order: {
      id: 1004, coupon: 'SAVE10',
      items: [
        { id: 5, name: 'Groundnut oil', sku: 'OIL-5L', price: 1120, qty: 2, hsn: '1508', gstRate: undefined }
      ]
    },
    expectedInvoice: {
      subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5,
      rows: [
        { name: 'Groundnut oil', sku: 'OIL-5L', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
      ]
    },
    expectedCheckout: { subtotal: 2240, discount: 150, taxable: 2090, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 },
    expectedCheckoutGst: [{ gstPercent: 5, tax: 104.5 }]
  },
  {
    name: 'CURRENT BEHAVIOUR: #1008-style all-18% order without coupon matches checkout',
    order: {
      id: 1008, coupon: '',
      items: [
        { id: 8, name: 'Tea', sku: 'TEA', price: 140, qty: 1, hsn: '0902', gstRate: undefined },
        { id: 12, name: 'Sherbet', sku: 'SHERBET', price: 180, qty: 2, hsn: '2106', gstRate: undefined }
      ]
    },
    expectedInvoice: {
      subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590,
      rows: [
        { name: 'Tea', sku: 'TEA', hsn: '0902', qty: 1, price: 140, gstPercent: 18, line: 140, lineTax: 25.2 },
        { name: 'Sherbet', sku: 'SHERBET', hsn: '2106', qty: 2, price: 180, gstPercent: 18, line: 360, lineTax: 64.8 }
      ]
    },
    expectedCheckout: { subtotal: 500, discount: 0, taxable: 500, tax: 90, cgst: 45, sgst: 45, total: 590 },
    expectedCheckoutGst: [{ gstPercent: 18, tax: 25.2 }, { gstPercent: 18, tax: 64.8 }]
  }
];

for (const fixture of cases) {
  test(fixture.name, () => {
    const order = fixture.order;
    const invoiceResult = invoice.computeInvoiceFigures(order);
    const checkoutResult = pricing.computeTotals(order.items, order.coupon);

    // Literal expectations pin the invoice figures separately from checkout.
    assert.deepStrictEqual(invoiceResult, fixture.expectedInvoice);
    const { lines, ...checkoutTotals } = checkoutResult;
    assert.deepStrictEqual(checkoutTotals, fixture.expectedCheckout);
    assert.deepStrictEqual(
      lines.map(({ gstPercent, tax }) => ({ gstPercent, tax })),
      fixture.expectedCheckoutGst
    );
  });
}

test('Invoice matches checkout for mixed HSN slabs with a capped pre-tax coupon', () => {
  const order = {
    id: 2001,
    coupon: 'SAVE10',
    items: [
      { id: 5, name: 'Oil', sku: 'OIL', price: 1120, qty: 2, hsn: '1508' },
      { id: 6, name: 'Ghee', sku: 'GHEE', price: 450, qty: 1, hsn: '0405' },
      { id: 9, name: 'Coffee', sku: 'COFFEE', price: 310, qty: 1, hsn: '0901' }
    ],
    subtotal: 3000, discount: 150, tax: 210.71, total: 3060.71
  };
  const checkout = pricing.computeTotals(order.items, order.coupon);
  const { lines, taxable, ...checkoutFigures } = checkout;
  assert.equal(taxable, 2850);
  assert.deepStrictEqual(checkoutFigures, {
    subtotal: 3000, discount: 150, tax: 210.71,
    cgst: 105.36, sgst: 105.35, total: 3060.71
  });

  const { rows, ...invoiceFigures } = invoice.computeInvoiceFigures(order);
  assert.deepStrictEqual(invoiceFigures, checkoutFigures);
  assert.deepStrictEqual(
    rows.map(({ gstPercent, lineTax }) => ({ gstPercent, tax: lineTax })),
    [{ gstPercent: 5, tax: 106.4 }, { gstPercent: 12, tax: 51.3 }, { gstPercent: 18, tax: 53.01 }]
  );
  assert.deepStrictEqual(
    rows.map((row) => row.lineTax),
    lines.map((line) => line.tax)
  );
  const html = invoice.render(order);
  assert.match(html, /Invoice Total<\/td><td class="r">₹3060\.71/);
  assert.match(html, /CGST \+ SGST \(Total GST\)<\/td><td class="r">₹210\.71/);
  assert.match(html, /Coupon Discount \(SAVE10\)<\/td><td[^>]*>-₹150\.00/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
});
