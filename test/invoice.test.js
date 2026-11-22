'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// These fixtures model the ticket scenarios in memory. An omitted gstRate
// exercises HSN slab resolution.
const cases = [
  {
    name: '#1001 uses the 5% and 12% HSN slabs on the invoice',
    order: {
      id: 1001,
      coupon: '',
      items: [
        { id: 1, name: 'Rice', price: 50, qty: 2, hsn: '1006' },
        { id: 2, name: 'Ghee', price: 100, qty: 1, hsn: '0405' }
      ]
    },
    invoice: { subtotal: 200, discount: 0, tax: 17, cgst: 8.5, sgst: 8.5, total: 217 },
    invoiceLines: [[5, 5], [12, 12]],
    checkout: { subtotal: 200, discount: 0, tax: 17, cgst: 8.5, sgst: 8.5, total: 217 },
    checkoutLines: [[5, 5], [12, 12]]
  },
  {
    name: '#1002 applies SAVE10 before GST on the invoice',
    order: {
      id: 1002,
      coupon: 'SAVE10',
      items: [{ id: 3, name: 'Tea', price: 200, qty: 3, hsn: '0902', gstRate: 18 }]
    },
    invoice: { subtotal: 600, discount: 60, tax: 97.2, cgst: 48.6, sgst: 48.6, total: 637.2 },
    invoiceLines: [[18, 97.2]],
    checkout: { subtotal: 600, discount: 60, tax: 97.2, cgst: 48.6, sgst: 48.6, total: 637.2 },
    checkoutLines: [[18, 97.2]]
  },
  {
    name: '#1004 applies the 150 SAVE10 cap on the invoice',
    order: {
      id: 1004,
      coupon: 'SAVE10',
      items: [{ id: 3, name: 'Tea', price: 560, qty: 4, hsn: '0902' }]
    },
    invoice: { subtotal: 2240, discount: 150, tax: 376.2, cgst: 188.1, sgst: 188.1, total: 2466.2 },
    invoiceLines: [[18, 376.2]],
    checkout: { subtotal: 2240, discount: 150, tax: 376.2, cgst: 188.1, sgst: 188.1, total: 2466.2 },
    checkoutLines: [[18, 376.2]]
  },
  {
    name: '#1008 matches checkout for all 18% items without a coupon',
    order: {
      id: 1008,
      coupon: '',
      items: [
        { id: 3, name: 'Tea', price: 40, qty: 2, hsn: '0902' },
        { id: 4, name: 'Coffee', price: 120, qty: 1, hsn: '0901', gstRate: 18 }
      ]
    },
    invoice: { subtotal: 200, discount: 0, tax: 36, cgst: 18, sgst: 18, total: 236 },
    invoiceLines: [[18, 14.4], [18, 21.6]],
    checkout: { subtotal: 200, discount: 0, tax: 36, cgst: 18, sgst: 18, total: 236 },
    checkoutLines: [[18, 14.4], [18, 21.6]]
  }
];

for (const scenario of cases) {
  test(`CURRENT BEHAVIOUR: ${scenario.name}`, () => {
    const order = scenario.order;
    const { rows, ...invoiceTotals } = invoice.computeInvoiceFigures(order);
    const { lines, taxable, ...checkoutTotals } = pricing.computeTotals(order.items, order.coupon);

    assert.deepEqual(invoiceTotals, scenario.invoice);
    assert.deepEqual(rows.map(row => [row.gstPercent, row.lineTax]), scenario.invoiceLines);
    assert.deepEqual(checkoutTotals, scenario.checkout);
    assert.deepEqual(lines.map(line => [line.gstPercent, line.tax]), scenario.checkoutLines);
    assert.equal(taxable, scenario.checkout.subtotal - scenario.checkout.discount);
  });
}

test('invoice matches checkout for mixed HSN slabs with capped SAVE10', (t) => {
  const items = [
    { id: 1, name: 'Rice', price: 560, qty: 2, hsn: '1006' },
    { id: 2, name: 'Ghee', price: 560, qty: 2, hsn: '0405' }
  ];
  const coupon = 'SAVE10';
  const billed = pricing.computeTotals(items, coupon);
  const figures = invoice.computeInvoiceFigures({ items, coupon });

  assert.equal(billed.discount, 150);
  assert.deepEqual(
    {
      subtotal: figures.subtotal,
      discount: figures.discount,
      tax: figures.tax,
      cgst: figures.cgst,
      sgst: figures.sgst,
      total: figures.total,
      lines: figures.rows.map(row => [row.gstPercent, row.lineTax])
    },
    {
      subtotal: billed.subtotal,
      discount: billed.discount,
      tax: billed.tax,
      cgst: billed.cgst,
      sgst: billed.sgst,
      total: billed.total,
      lines: billed.lines.map(line => [line.gstPercent, line.tax])
    }
  );

  t.mock.method(require('../lib/coupons'), 'getCoupon', () => null);
  assert.equal(pricing.computeTotals(items, coupon).discount, 0);
  assert.deepEqual(invoice.computeInvoiceFigures({ ...billed, items, coupon }), figures);
});
