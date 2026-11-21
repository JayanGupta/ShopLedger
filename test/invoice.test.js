const test = require('node:test');
const assert = require('node:assert/strict');

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function figures(result) {
  return {
    subtotal: result.subtotal,
    discount: result.discount,
    tax: result.tax,
    cgst: result.cgst,
    sgst: result.sgst,
    total: result.total
  };
}

function rowGst(result) {
  return result.rows.map(({ gstPercent, lineTax }) => ({ gstPercent, lineTax }));
}

// These in-memory lines use whole-number GST percentages, as invoice.js expects.
const mixedItems = [
  { name: 'Rice', price: 400, qty: 1, hsn: '1006', gstRate: 5 },
  { name: 'Ghee', price: 210, qty: 1, hsn: '0405', gstRate: 12 }
];

test('CURRENT BEHAVIOUR: #1001-style 5% and 12% lines without a coupon match the bill', () => {
  const order = { id: 1001, items: mixedItems, coupon: '' };
  const billed = pricing.computeTotals(order.items, order.coupon);
  const shown = invoice.computeInvoiceFigures(order);

  assert.deepStrictEqual(figures(shown), {
    subtotal: 610, discount: 0, tax: 45.2, cgst: 22.6, sgst: 22.6, total: 655.2
  });
  assert.deepStrictEqual(rowGst(shown), [
    { gstPercent: 5, lineTax: 20 },
    { gstPercent: 12, lineTax: 25.2 }
  ]);
  assert.deepStrictEqual(figures(billed), figures(shown));
});

test('CURRENT BEHAVIOUR: #1002 SAVE10 uses a pre-tax discount and 5% GST', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 640, qty: 1, hsn: '1006', gstRate: 5 },
      { name: 'Sunflower oil', price: 190, qty: 2, hsn: '1512', gstRate: 5 }
    ]
  };
  const billed = pricing.computeTotals(order.items, order.coupon);
  const shown = invoice.computeInvoiceFigures(order);

  assert.deepStrictEqual(figures(shown), {
    subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9
  });
  assert.deepStrictEqual(rowGst(shown), [
    { gstPercent: 5, lineTax: 28.8 },
    { gstPercent: 5, lineTax: 17.1 }
  ]);
  assert.deepStrictEqual(figures(billed), {
    subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9
  });
});

test('CURRENT BEHAVIOUR: #1004 SAVE10 respects the billed 150 rupee cap', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [{ name: 'Groundnut oil', price: 1120, qty: 2, hsn: '1508', gstRate: 5 }]
  };
  const billed = pricing.computeTotals(order.items, order.coupon);
  const shown = invoice.computeInvoiceFigures(order);

  assert.deepStrictEqual(figures(shown), {
    subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5
  });
  assert.deepStrictEqual(rowGst(shown), [{ gstPercent: 5, lineTax: 104.5 }]);
  assert.deepStrictEqual(figures(billed), {
    subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5
  });
});

test('CURRENT BEHAVIOUR: #1008 all-18% lines without a coupon match the bill', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      { name: 'Tea', price: 140, qty: 1, hsn: '0902', gstRate: 18 },
      { name: 'Kokum concentrate', price: 180, qty: 2, hsn: '2106', gstRate: 18 }
    ]
  };
  const billed = pricing.computeTotals(order.items, order.coupon);
  const shown = invoice.computeInvoiceFigures(order);

  assert.deepStrictEqual(figures(shown), {
    subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590
  });
  assert.deepStrictEqual(rowGst(shown), [
    { gstPercent: 18, lineTax: 25.2 },
    { gstPercent: 18, lineTax: 64.8 }
  ]);
  assert.deepStrictEqual(figures(billed), figures(shown));
});

test('CURRENT BEHAVIOUR: absent gstRate resolves mixed HSN slabs for the invoice', () => {
  const items = mixedItems.map(({ gstRate, ...item }) => item);
  const order = { id: 1001, items, coupon: '' };
  const billed = pricing.computeTotals(order.items, order.coupon);
  const shown = invoice.computeInvoiceFigures(order);

  assert.deepStrictEqual(figures(shown), {
    subtotal: 610, discount: 0, tax: 45.2, cgst: 22.6, sgst: 22.6, total: 655.2
  });
  assert.deepStrictEqual(rowGst(shown), [
    { gstPercent: 5, lineTax: 20 },
    { gstPercent: 12, lineTax: 25.2 }
  ]);
  assert.deepStrictEqual(figures(billed), {
    subtotal: 610, discount: 0, tax: 45.2, cgst: 22.6, sgst: 22.6, total: 655.2
  });
});

test('invoice matches checkout HSN GST and capped pre-tax SAVE10 discount', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [{ name: 'Groundnut oil', price: 1120, qty: 2, hsn: '1508' }]
  };
  const billed = pricing.computeTotals(order.items, order.coupon);
  const shown = invoice.computeInvoiceFigures(order);

  assert.deepStrictEqual(figures(billed), {
    subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5
  });
  assert.deepStrictEqual(figures(shown), figures(billed));
  assert.deepStrictEqual(rowGst(shown), [{ gstPercent: 5, lineTax: 104.5 }]);
  assert.doesNotMatch(invoice.render({ ...order, total: billed.total }), /Accountant Reconciliation Notice/);
});

test('historical invoice keeps billed figures after its coupon becomes inactive', () => {
  const order = {
    id: 2001,
    coupon: 'DIWALI20',
    items: [{ name: 'Rice', price: 1000, qty: 1, hsn: '1006' }],
    subtotal: 1000,
    discount: 200,
    tax: 40,
    total: 840
  };
  const recalculatedNow = pricing.computeTotals(order.items, order.coupon);
  const shown = invoice.computeInvoiceFigures(order);

  assert.strictEqual(recalculatedNow.discount, 0);
  assert.deepStrictEqual(figures(shown), {
    subtotal: 1000, discount: 200, tax: 40, cgst: 20, sgst: 20, total: 840
  });
  assert.deepStrictEqual(rowGst(shown), [{ gstPercent: 5, lineTax: 40 }]);
  assert.doesNotMatch(invoice.render(order), /Accountant Reconciliation Notice/);
});

test('invoice still flags an inconsistent stored order total', () => {
  const order = {
    id: 2002,
    coupon: '',
    items: [{ name: 'Rice', price: 1000, qty: 1, hsn: '1006' }],
    subtotal: 1000,
    discount: 0,
    tax: 50,
    total: 9999
  };

  assert.strictEqual(invoice.computeInvoiceFigures(order).total, 1050);
  assert.match(invoice.render(order), /Accountant Reconciliation Notice/);
});

test('historical pre-HSN invoice keeps its billed 18% line rate', () => {
  const order = {
    id: 2003,
    date: '30/06/2021',
    coupon: '',
    items: [{ name: 'Rice', price: 1000, qty: 1, hsn: '1006' }],
    subtotal: 1000,
    discount: 0,
    tax: 180,
    total: 1180
  };
  const shown = invoice.computeInvoiceFigures(order);

  assert.deepStrictEqual(rowGst(shown), [{ gstPercent: 18, lineTax: 180 }]);
  assert.deepStrictEqual(figures(shown), {
    subtotal: 1000, discount: 0, tax: 180, cgst: 90, sgst: 90, total: 1180
  });
  assert.doesNotMatch(invoice.render(order), /Accountant Reconciliation Notice/);
});

test('historical pre-HSN invoice keeps cart-rounded GST across two lines', () => {
  const order = {
    id: 2004,
    date: '30/06/2021',
    coupon: 'WELCOME',
    items: [
      { name: 'Rice A', price: 101, qty: 1, hsn: '1006' },
      { name: 'Rice B', price: 104, qty: 1, hsn: '1006' }
    ],
    subtotal: 205,
    discount: 10.25,
    tax: 35.06,
    total: 229.81
  };
  const shown = invoice.computeInvoiceFigures(order);

  assert.deepStrictEqual(figures(shown), {
    subtotal: 205, discount: 10.25, tax: 35.06, cgst: 17.53, sgst: 17.53, total: 229.81
  });
  assert.deepStrictEqual(rowGst(shown), [
    { gstPercent: 18, lineTax: 17.27 },
    { gstPercent: 18, lineTax: 17.79 }
  ]);
  assert.doesNotMatch(invoice.render(order), /Accountant Reconciliation Notice/);
});
