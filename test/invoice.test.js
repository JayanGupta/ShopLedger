const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// Synthetic fixtures only: no store, server, or database imports.
// HSN-driven order lines omit gstRate; undefined explicitly models that absence.
// The #1001-style fixture deliberately mixes 5% and 12% items as requested.
const cases = [
  {
    name: 'CURRENT BEHAVIOUR: #1001-style invoice uses HSN 5% and 12% slabs',
    order: {
      id: 1001, coupon: '',
      items: [
        { id: 2, name: 'Dal', sku: 'GRN-002', price: 165, qty: 2, hsn: '0713', gstRate: undefined },
        { id: 6, name: 'Ghee', sku: 'DRY-001', price: 450, qty: 1, hsn: '0405', gstRate: undefined }
      ]
    },
    checkout: { subtotal: 780, discount: 0, tax: 70.5, cgst: 35.25, sgst: 35.25, total: 850.5 },
    checkoutSlabs: [5, 12],
    figures: {
      subtotal: 780, discount: 0, tax: 70.5, cgst: 35.25, sgst: 35.25, total: 850.5,
      rows: [
        { name: 'Dal', sku: 'GRN-002', hsn: '0713', qty: 2, price: 165, gstPercent: 5, line: 330, lineTax: 16.5 },
        { name: 'Ghee', sku: 'DRY-001', hsn: '0405', qty: 1, price: 450, gstPercent: 12, line: 450, lineTax: 54 }
      ]
    }
  },
  {
    name: 'CURRENT BEHAVIOUR: #1002 SAVE10 discounts invoice subtotal before GST',
    order: {
      id: 1002, coupon: 'SAVE10',
      items: [
        { id: 1, name: 'Rice', sku: 'GRN-001', price: 640, qty: 1, hsn: '1006', gstRate: undefined },
        { id: 4, name: 'Oil', sku: 'OIL-001', price: 190, qty: 2, hsn: '1512', gstRate: undefined }
      ]
    },
    checkout: { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 },
    checkoutSlabs: [5, 5],
    figures: {
      subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9,
      rows: [
        { name: 'Rice', sku: 'GRN-001', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
        { name: 'Oil', sku: 'OIL-001', hsn: '1512', qty: 2, price: 190, gstPercent: 5, line: 380, lineTax: 17.1 }
      ]
    }
  },
  {
    name: 'CURRENT BEHAVIOUR: #1004 invoice caps SAVE10 at Rs 150 on Rs 2240',
    order: {
      id: 1004, coupon: 'SAVE10',
      items: [
        { id: 5, name: 'Groundnut oil', sku: 'OIL-002', price: 1120, qty: 2, hsn: '1508', gstRate: undefined }
      ]
    },
    checkout: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 },
    checkoutSlabs: [5],
    figures: {
      subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5,
      rows: [
        { name: 'Groundnut oil', sku: 'OIL-002', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
      ]
    }
  },
  {
    name: 'CURRENT BEHAVIOUR: #1008 all-18% no-coupon invoice matches checkout',
    order: {
      id: 1008, coupon: '',
      items: [
        { id: 8, name: 'Tea', sku: 'BEV-001', price: 140, qty: 1, hsn: '0902', gstRate: undefined },
        { id: 12, name: 'Sherbet', sku: 'BEV-003', price: 180, qty: 2, hsn: '2106', gstRate: undefined }
      ]
    },
    checkout: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 },
    checkoutSlabs: [18, 18],
    figures: {
      subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590,
      rows: [
        { name: 'Tea', sku: 'BEV-001', hsn: '0902', qty: 1, price: 140, gstPercent: 18, line: 140, lineTax: 25.2 },
        { name: 'Sherbet', sku: 'BEV-003', hsn: '2106', qty: 2, price: 180, gstPercent: 18, line: 360, lineTax: 64.8 }
      ]
    }
  }
];

function financialFigures(totals) {
  return {
    subtotal: totals.subtotal,
    discount: totals.discount,
    tax: totals.tax,
    cgst: totals.cgst,
    sgst: totals.sgst,
    total: totals.total
  };
}

for (const fixture of cases) {
  test(fixture.name, () => {
    const order = fixture.order;
    const calculatedInvoice = invoice.computeInvoiceFigures(order);
    const checkout = pricing.computeTotals(order.items, order.coupon);

    // Literal expectations independently pin invoice and checkout outputs.
    assert.deepStrictEqual(calculatedInvoice, fixture.figures);
    assert.deepStrictEqual(financialFigures(checkout), fixture.checkout);
    assert.deepStrictEqual(checkout.lines.map(line => line.gstPercent), fixture.checkoutSlabs);
  });
}

test('CURRENT BEHAVIOUR: explicit 5% and 12% gstRate values match without coupon', () => {
  const order = {
    coupon: '',
    items: cases[0].order.items.map((item, index) => ({
      ...item, gstRate: [5, 12][index]
    }))
  };
  const calculatedInvoice = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepStrictEqual(calculatedInvoice, {
    subtotal: 780, discount: 0, tax: 70.5, cgst: 35.25, sgst: 35.25, total: 850.5,
    rows: [
      { name: 'Dal', sku: 'GRN-002', hsn: '0713', qty: 2, price: 165, gstPercent: 5, line: 330, lineTax: 16.5 },
      { name: 'Ghee', sku: 'DRY-001', hsn: '0405', qty: 1, price: 450, gstPercent: 12, line: 450, lineTax: 54 }
    ]
  });
  assert.deepStrictEqual(financialFigures(checkout), {
    subtotal: 780, discount: 0, tax: 70.5, cgst: 35.25, sgst: 35.25, total: 850.5
  });
  assert.deepStrictEqual(checkout.lines.map(line => line.gstPercent), [5, 12]);
});

test('Invoice matches checkout for mixed HSN slabs and capped pre-tax SAVE10', () => {
  const order = {
    id: 2001, coupon: 'SAVE10',
    items: [
      { id: 1, name: 'Rice', sku: 'GRN-001', price: 640, qty: 2, hsn: '1006' },
      { id: 6, name: 'Ghee', sku: 'DRY-001', price: 450, qty: 2, hsn: '0405' },
      { id: 8, name: 'Tea', sku: 'BEV-001', price: 140, qty: 1, hsn: '0902' }
    ]
  };
  const checkout = pricing.computeTotals(order.items, order.coupon);
  const expected = {
    subtotal: 2320, discount: 150, tax: 184.45,
    cgst: 92.23, sgst: 92.22, total: 2354.45
  };
  assert.deepStrictEqual(financialFigures(checkout), expected);
  const calculatedInvoice = invoice.computeInvoiceFigures(order);
  assert.deepStrictEqual(calculatedInvoice, {
    ...expected,
    rows: [
      { name: 'Rice', sku: 'GRN-001', hsn: '1006', qty: 2, price: 640, gstPercent: 5, line: 1280, lineTax: 59.86 },
      { name: 'Ghee', sku: 'DRY-001', hsn: '0405', qty: 2, price: 450, gstPercent: 12, line: 900, lineTax: 101.02 },
      { name: 'Tea', sku: 'BEV-001', hsn: '0902', qty: 1, price: 140, gstPercent: 18, line: 140, lineTax: 23.57 }
    ]
  });
  const html = invoice.render({ ...order, ...expected });
  assert.match(html, /Invoice Total<\/td><td class="r">₹2354\.45<\/td>/);
  assert.match(html, /Total GST\)<\/td><td class="r">₹184\.45<\/td>/);
  assert.match(html, /-₹150\.00/);
  for (const row of calculatedInvoice.rows) {
    assert.ok(html.includes('>' + row.gstPercent + '%</td>'));
    assert.ok(html.includes('₹' + row.lineTax.toFixed(2) + '</td>'));
  }
  assert.doesNotMatch(html, /Accountant Reconciliation Notice:/);
});
