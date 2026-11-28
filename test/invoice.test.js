const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

const cases = [
  {
    name: '#1001 invoice uses the 5% and 12% HSN slabs',
    order: {
      id: 1001,
      coupon: '',
      // Saved order lines omit gstRate. Checkout resolves the HSN instead.
      items: [
        { name: 'Rice', price: 200, qty: 2, hsn: '1006' },
        { name: 'Ghee', price: 200, qty: 1, hsn: '0405' }
      ]
    },
    invoiceTotals: { subtotal: 600, discount: 0, tax: 44, cgst: 22, sgst: 22, total: 644 },
    invoiceGst: [{ rate: 5, tax: 20 }, { rate: 12, tax: 24 }],
    checkoutTotals: { subtotal: 600, discount: 0, tax: 44, cgst: 22, sgst: 22, total: 644 },
    checkoutGst: [{ rate: 5, tax: 20 }, { rate: 12, tax: 24 }]
  },
  {
    name: '#1002 invoice applies SAVE10 before GST',
    order: {
      id: 1002,
      coupon: 'SAVE10',
      items: [{ name: 'Tea', price: 500, qty: 2, hsn: '0902' }]
    },
    invoiceTotals: { subtotal: 1000, discount: 100, tax: 162, cgst: 81, sgst: 81, total: 1062 },
    invoiceGst: [{ rate: 18, tax: 162 }],
    checkoutTotals: { subtotal: 1000, discount: 100, tax: 162, cgst: 81, sgst: 81, total: 1062 },
    checkoutGst: [{ rate: 18, tax: 162 }]
  },
  {
    name: '#1004 invoice honors the SAVE10 cap on a 2240 subtotal',
    order: {
      id: 1004,
      coupon: 'SAVE10',
      items: [{ name: 'Coffee', price: 560, qty: 4, hsn: '0901' }]
    },
    invoiceTotals: { subtotal: 2240, discount: 150, tax: 376.20, cgst: 188.10, sgst: 188.10, total: 2466.20 },
    invoiceGst: [{ rate: 18, tax: 376.20 }],
    checkoutTotals: { subtotal: 2240, discount: 150, tax: 376.20, cgst: 188.10, sgst: 188.10, total: 2466.20 },
    checkoutGst: [{ rate: 18, tax: 376.20 }]
  },
  {
    name: '#1008 invoice and checkout agree on 18% items without a coupon',
    order: {
      id: 1008,
      coupon: '',
      items: [
        { name: 'Tea', price: 300, qty: 2, hsn: '0902' },
        { name: 'Coffee', price: 250, qty: 1, hsn: '0901', gstRate: 18 }
      ]
    },
    invoiceTotals: { subtotal: 850, discount: 0, tax: 153, cgst: 76.50, sgst: 76.50, total: 1003 },
    invoiceGst: [{ rate: 18, tax: 108 }, { rate: 18, tax: 45 }],
    checkoutTotals: { subtotal: 850, discount: 0, tax: 153, cgst: 76.50, sgst: 76.50, total: 1003 },
    checkoutGst: [{ rate: 18, tax: 108 }, { rate: 18, tax: 45 }]
  }
];

for (const example of cases) {
  test(`CURRENT BEHAVIOUR: ${example.name}`, () => {
    const { order } = example;
    const { rows, ...invoiceTotals } = invoice.computeInvoiceFigures(order);
    const { lines, taxable, ...checkoutTotals } = pricing.computeTotals(order.items, order.coupon);

    assert.deepEqual(invoiceTotals, example.invoiceTotals);
    assert.deepEqual(rows.map(row => ({ rate: row.gstPercent, tax: row.lineTax })), example.invoiceGst);
    assert.deepEqual(checkoutTotals, example.checkoutTotals);
    assert.deepEqual(lines.map(line => ({ rate: line.gstPercent, tax: line.tax })), example.checkoutGst);
  });
}

test('invoice matches checkout GST and totals for mixed slabs with capped SAVE10', () => {
  const order = {
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 500, qty: 2, hsn: '1006' },
      { name: 'Ghee', price: 620, qty: 2, hsn: '0405' }
    ]
  };

  const checkout = pricing.computeTotals(order.items, order.coupon);
  const { rows, ...totals } = invoice.computeInvoiceFigures(order);

  assert.deepEqual(totals, {
    subtotal: checkout.subtotal,
    discount: 150,
    tax: checkout.tax,
    cgst: checkout.cgst,
    sgst: checkout.sgst,
    total: checkout.total
  });
  assert.deepEqual(rows.map(row => [row.gstPercent, row.lineTax]), [[5, 46.65], [12, 138.84]]);

  const savedOrder = { ...order, coupon: 'DIWALI20', discount: 150, total: checkout.total };
  assert.deepEqual(invoice.computeInvoiceFigures(savedOrder), { ...totals, rows });
  assert.doesNotMatch(invoice.render(savedOrder), /Accountant Reconciliation Notice/);
  assert.match(invoice.render({ ...savedOrder, total: 2274.49 }), /Accountant Reconciliation Notice/);
});
