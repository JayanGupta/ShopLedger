const test = require('node:test');
const assert = require('node:assert/strict');

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function line(name, price, qty, hsn) {
  return { name, price, qty, hsn, gstRate: undefined };
}

const cases = [
  {
    name: 'EXPECTED BEHAVIOUR: order #1001 invoice uses HSN 5% and 12% slabs',
    order: {
      id: 1001,
      coupon: '',
      items: [line('Rice', 165, 2, '1006'), line('Ghee', 140, 2, '0405')]
    },
    invoiceExpected: { subtotal: 610, discount: 0, tax: 50.1, cgst: 25.05, sgst: 25.05, total: 660.1, gstPercents: [5, 12] },
    pricingExpected: { subtotal: 610, discount: 0, tax: 50.1, total: 660.1 }
  },
  {
    name: 'EXPECTED BEHAVIOUR: order #1002 invoice discounts before GST',
    order: {
      id: 1002,
      coupon: 'SAVE10',
      items: [line('Rice', 400, 1, '1006'), line('Ghee', 200, 1, '0405')]
    },
    invoiceExpected: { subtotal: 600, discount: 60, tax: 39.6, cgst: 19.8, sgst: 19.8, total: 579.6, gstPercents: [5, 12] },
    pricingExpected: { subtotal: 600, discount: 60, tax: 39.6, total: 579.6 }
  },
  {
    name: 'EXPECTED BEHAVIOUR: order #1004 invoice applies SAVE10 maximum discount at ₹2,240 subtotal',
    order: {
      id: 1004,
      coupon: 'SAVE10',
      items: [line('Rice', 1400, 1, '1006'), line('Ghee', 840, 1, '0405')]
    },
    invoiceExpected: { subtotal: 2240, discount: 150, tax: 159.36, cgst: 79.68, sgst: 79.68, total: 2249.36, gstPercents: [5, 12] },
    pricingExpected: { subtotal: 2240, discount: 150, tax: 159.36, total: 2249.36 }
  },
  {
    name: 'CURRENT BEHAVIOUR: order #1008 all-18% no-coupon invoice matches checkout totals',
    order: {
      id: 1008,
      coupon: '',
      items: [line('Tea', 140, 2, '0902'), line('Coffee', 165, 2, '0901')]
    },
    invoiceExpected: { subtotal: 610, discount: 0, tax: 109.8, cgst: 54.9, sgst: 54.9, total: 719.8, gstPercents: [18, 18] },
    pricingExpected: { subtotal: 610, discount: 0, tax: 109.8, total: 719.8 }
  }
];

for (const scenario of cases) {
  test(scenario.name, () => {
    const invoiceFigures = invoice.computeInvoiceFigures(scenario.order);
    const checkoutFigures = pricing.computeTotals(scenario.order.items, scenario.order.coupon);

    assert.deepEqual({
      subtotal: invoiceFigures.subtotal,
      discount: invoiceFigures.discount,
      tax: invoiceFigures.tax,
      cgst: invoiceFigures.cgst,
      sgst: invoiceFigures.sgst,
      total: invoiceFigures.total,
      gstPercents: invoiceFigures.rows.map((row) => row.gstPercent)
    }, scenario.invoiceExpected);

    assert.deepEqual({
      subtotal: checkoutFigures.subtotal,
      discount: checkoutFigures.discount,
      tax: checkoutFigures.tax,
      total: checkoutFigures.total
    }, scenario.pricingExpected);
  });
}

test('EXPECTED BEHAVIOUR: invoice matches capped-coupon checkout GST and totals by HSN slab', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [line('Rice', 1400, 1, '1006'), line('Ghee', 840, 1, '0405')]
  };
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual({
    subtotal: invoiceFigures.subtotal,
    discount: invoiceFigures.discount,
    tax: invoiceFigures.tax,
    cgst: invoiceFigures.cgst,
    sgst: invoiceFigures.sgst,
    total: invoiceFigures.total
  }, {
    subtotal: checkoutFigures.subtotal,
    discount: checkoutFigures.discount,
    tax: checkoutFigures.tax,
    cgst: checkoutFigures.cgst,
    sgst: checkoutFigures.sgst,
    total: checkoutFigures.total
  });
  assert.deepEqual(invoiceFigures.rows.map((row) => ({ gstPercent: row.gstPercent, lineTax: row.lineTax })),
    checkoutFigures.lines.map((row) => ({ gstPercent: row.gstPercent, lineTax: row.tax })));
});
