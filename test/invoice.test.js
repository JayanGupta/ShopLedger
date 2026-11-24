const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// Synthetic orders use HSN codes. A missing gstRate models a checkout line
// without a saved rate override.
const cases = [
  {
    name: '#1001 invoices each line at its 5% or 12% HSN rate',
    order: {
      id: 1001,
      coupon: '',
      items: [
        { id: 1, name: 'Rice', price: 100, qty: 2, hsn: '1006', gstRate: undefined },
        { id: 2, name: 'Ghee', price: 300, qty: 1, hsn: '0405', gstRate: undefined }
      ]
    },
    invoiceTotals: { subtotal: 500, discount: 0, tax: 46, cgst: 23, sgst: 23, total: 546 },
    invoiceLines: [[5, 10], [12, 36]],
    checkoutTotals: { subtotal: 500, discount: 0, tax: 46, cgst: 23, sgst: 23, total: 546 },
    checkoutLines: [[5, 10], [12, 36]]
  },
  {
    name: '#1002 applies SAVE10 before GST and matches the checkout breakdown',
    order: {
      id: 1002,
      coupon: 'SAVE10',
      items: [{ id: 3, name: 'Tea', price: 300, qty: 2, hsn: '0902', gstRate: undefined }]
    },
    invoiceTotals: { subtotal: 600, discount: 60, tax: 97.2, cgst: 48.6, sgst: 48.6, total: 637.2 },
    invoiceLines: [[18, 97.2]],
    checkoutTotals: { subtotal: 600, discount: 60, tax: 97.2, cgst: 48.6, sgst: 48.6, total: 637.2 },
    checkoutLines: [[18, 97.2]]
  },
  {
    name: '#1004 caps SAVE10 at ₹150 on a ₹2,240 subtotal before GST',
    order: {
      id: 1004,
      coupon: 'SAVE10',
      items: [{ id: 1, name: 'Rice', price: 280, qty: 8, hsn: '1006', gstRate: undefined }]
    },
    invoiceTotals: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 },
    invoiceLines: [[5, 104.5]],
    checkoutTotals: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 },
    checkoutLines: [[5, 104.5]]
  },
  {
    name: 'CURRENT BEHAVIOUR: #1008 matches checkout for all 18% items without a coupon',
    order: {
      id: 1008,
      coupon: '',
      items: [
        { id: 3, name: 'Tea', price: 125, qty: 2, hsn: '0902', gstRate: undefined },
        { id: 4, name: 'Coffee', price: 150, qty: 1, hsn: '0901', gstRate: 18 }
      ]
    },
    invoiceTotals: { subtotal: 400, discount: 0, tax: 72, cgst: 36, sgst: 36, total: 472 },
    invoiceLines: [[18, 45], [18, 27]],
    checkoutTotals: { subtotal: 400, discount: 0, tax: 72, cgst: 36, sgst: 36, total: 472 },
    checkoutLines: [[18, 45], [18, 27]]
  }
];

for (const fixture of cases) {
  test(fixture.name, () => {
    const { order } = fixture;
    const { rows, ...invoiceTotals } = invoice.computeInvoiceFigures(order);
    const { lines, taxable, ...checkoutTotals } = pricing.computeTotals(order.items, order.coupon);

    assert.deepStrictEqual(invoiceTotals, fixture.invoiceTotals, 'invoice totals and GST split');
    assert.deepStrictEqual(
      rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]),
      fixture.invoiceLines,
      'invoice line GST rates and amounts'
    );
    assert.deepStrictEqual(checkoutTotals, fixture.checkoutTotals, 'checkout totals and GST split');
    assert.equal(taxable, fixture.checkoutTotals.subtotal - fixture.checkoutTotals.discount);
    assert.deepStrictEqual(
      lines.map(({ gstPercent, tax }) => [gstPercent, tax]),
      fixture.checkoutLines,
      'checkout line GST rates and amounts'
    );
  });
}

test('invoice matches checkout GST and totals for a mixed-rate order with capped SAVE10', () => {
  const order = {
    coupon: 'SAVE10',
    items: [
      { id: 1, name: 'Rice', price: 500, qty: 2, hsn: '1006' },
      { id: 2, name: 'Ghee', price: 620, qty: 2, hsn: '0405' }
    ]
  };
  const checkout = pricing.computeTotals(order.items, order.coupon);
  const figures = invoice.computeInvoiceFigures(order);

  assert.equal(checkout.discount, 150);
  assert.deepStrictEqual(
    figures.rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]),
    [[5, 46.65], [12, 138.84]]
  );
  for (const field of ['subtotal', 'discount', 'tax', 'cgst', 'sgst', 'total']) {
    assert.equal(figures[field], checkout[field], field);
  }
});
