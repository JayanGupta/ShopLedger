const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function assertFigures(order, expectedInvoice, expectedRows, expectedCheckout) {
  const { rows, ...invoiceTotals } = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(invoiceTotals, expectedInvoice);
  assert.deepEqual(rows.map(({ hsn, gstPercent, line, lineTax }) => ({
    hsn, gstPercent, line, lineTax
  })), expectedRows);
  assert.deepEqual({
    subtotal: checkout.subtotal,
    discount: checkout.discount,
    tax: checkout.tax,
    cgst: checkout.cgst,
    sgst: checkout.sgst,
    total: checkout.total
  }, expectedCheckout);
}

test('#1001-style invoice uses the 5% and 12% HSN slabs without gstRate', () => {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      { id: 1, name: 'Rice', price: 150, qty: 2, hsn: '1006' },
      { id: 2, name: 'Ghee', price: 300, qty: 1, hsn: '0405' }
    ]
  };

  assertFigures(order,
    { subtotal: 600, discount: 0, tax: 51, cgst: 25.5, sgst: 25.5, total: 651 },
    [
      { hsn: '1006', gstPercent: 5, line: 300, lineTax: 15 },
      { hsn: '0405', gstPercent: 12, line: 300, lineTax: 36 }
    ],
    { subtotal: 600, discount: 0, tax: 51, cgst: 25.5, sgst: 25.5, total: 651 });
});

test('#1002-style invoice applies SAVE10 before GST', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      { id: 1, name: 'Rice', price: 640, qty: 1, hsn: '1006', gstRate: 5 },
      { id: 3, name: 'Sunflower oil', price: 190, qty: 1, hsn: '1512', gstRate: 5 }
    ]
  };

  assertFigures(order,
    { subtotal: 830, discount: 83, tax: 37.35, cgst: 18.68, sgst: 18.67, total: 784.35 },
    [
      { hsn: '1006', gstPercent: 5, line: 640, lineTax: 28.8 },
      { hsn: '1512', gstPercent: 5, line: 190, lineTax: 8.55 }
    ],
    { subtotal: 830, discount: 83, tax: 37.35, cgst: 18.68, sgst: 18.67, total: 784.35 });
});

test('#1004-style invoice applies the SAVE10 cap on a 2240 subtotal', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { id: 1, name: 'Rice', price: 560, qty: 2, hsn: '1006' },
      { id: 4, name: 'Dal', price: 280, qty: 4, hsn: '0713' }
    ]
  };

  assertFigures(order,
    { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 },
    [
      { hsn: '1006', gstPercent: 5, line: 1120, lineTax: 52.25 },
      { hsn: '0713', gstPercent: 5, line: 1120, lineTax: 52.25 }
    ],
    { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 });
});

test('CURRENT BEHAVIOUR: #1008-style invoice matches checkout for 18% items without a coupon', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      { id: 5, name: 'Tea', price: 140, qty: 2, hsn: '0902' },
      { id: 6, name: 'Coffee', price: 220, qty: 1, hsn: '0901', gstRate: 18 }
    ]
  };
  const expectedTotals = { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 };

  assertFigures(order, expectedTotals,
    [
      { hsn: '0902', gstPercent: 18, line: 280, lineTax: 50.4 },
      { hsn: '0901', gstPercent: 18, line: 220, lineTax: 39.6 }
    ],
    expectedTotals);
});

test('invoice matches checkout for mixed GST slabs and a capped SAVE10 discount', () => {
  const items = [
    { id: 1, name: 'Rice', price: 500, qty: 2, hsn: '1006' },
    { id: 2, name: 'Ghee', price: 500, qty: 2, hsn: '0405' }
  ];
  const coupon = 'SAVE10';
  const checkout = pricing.computeTotals(items, coupon);
  const order = { id: 1009, items, coupon, subtotal: checkout.subtotal,
    discount: checkout.discount, tax: checkout.tax, total: checkout.total };
  const figures = invoice.computeInvoiceFigures(order);

  assert.equal(checkout.discount, 150);
  for (const field of ['subtotal', 'discount', 'tax', 'cgst', 'sgst', 'total']) {
    assert.equal(figures[field], checkout[field], field);
  }
  assert.deepEqual(figures.rows.map(({ gstPercent, lineTax }) => ({ gstPercent, lineTax })), [
    { gstPercent: 5, lineTax: 46.25 },
    { gstPercent: 12, lineTax: 111 }
  ]);
  const html = invoice.render(order);
  assert.match(html, /Invoice Total<\/td><td class="r">₹2007\.25/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);

  // A saved order can refer to a coupon that is no longer active.
  const reprint = { ...order, coupon: 'DIWALI20' };
  assert.deepEqual(invoice.computeInvoiceFigures(reprint), figures);
});
