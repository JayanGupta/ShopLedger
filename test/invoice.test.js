const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

const cases = [
  {
    name: '#1001 invoices each HSN slab without a coupon',
    order: {
      id: 1001,
      coupon: '',
      items: [
        { name: 'Rice', price: 100, qty: 2, hsn: '1006' },
        { name: 'Ghee', price: 200, qty: 1, hsn: '0405' },
      ],
    },
    invoice: { subtotal: 400, discount: 0, tax: 34, cgst: 17, sgst: 17, total: 434 },
    invoiceLines: [{ rate: 5, tax: 10 }, { rate: 12, tax: 24 }],
    checkout: { subtotal: 400, discount: 0, tax: 34, cgst: 17, sgst: 17, total: 434 },
    checkoutLines: [{ rate: 5, tax: 10 }, { rate: 12, tax: 24 }],
  },
  {
    name: '#1002 applies SAVE10 before GST',
    order: {
      id: 1002,
      coupon: 'SAVE10',
      items: [{ name: 'Tea', price: 300, qty: 2, hsn: '0902' }],
    },
    invoice: { subtotal: 600, discount: 60, tax: 97.2, cgst: 48.6, sgst: 48.6, total: 637.2 },
    invoiceLines: [{ rate: 18, tax: 97.2 }],
    checkout: { subtotal: 600, discount: 60, tax: 97.2, cgst: 48.6, sgst: 48.6, total: 637.2 },
    checkoutLines: [{ rate: 18, tax: 97.2 }],
  },
  {
    name: '#1004 honors the SAVE10 cap on a ₹2,240 subtotal',
    order: {
      id: 1004,
      coupon: 'SAVE10',
      items: [
        { name: 'Rice', price: 100, qty: 10, hsn: '1006' },
        { name: 'Ghee', price: 620, qty: 2, hsn: '0405' },
      ],
    },
    invoice: { subtotal: 2240, discount: 150, tax: 185.49, cgst: 92.75, sgst: 92.74, total: 2275.49 },
    invoiceLines: [{ rate: 5, tax: 46.65 }, { rate: 12, tax: 138.84 }],
    checkout: { subtotal: 2240, discount: 150, tax: 185.49, cgst: 92.75, sgst: 92.74, total: 2275.49 },
    checkoutLines: [{ rate: 5, tax: 46.65 }, { rate: 12, tax: 138.84 }],
  },
  {
    name: '#1008 matches checkout for 18% items without a coupon',
    order: {
      id: 1008,
      coupon: '',
      items: [
        { name: 'Tea', price: 125, qty: 2, hsn: '0902', gstRate: 18 },
        { name: 'Coffee', price: 150, qty: 1, hsn: '0901' },
      ],
    },
    invoice: { subtotal: 400, discount: 0, tax: 72, cgst: 36, sgst: 36, total: 472 },
    invoiceLines: [{ rate: 18, tax: 45 }, { rate: 18, tax: 27 }],
    checkout: { subtotal: 400, discount: 0, tax: 72, cgst: 36, sgst: 36, total: 472 },
    checkoutLines: [{ rate: 18, tax: 45 }, { rate: 18, tax: 27 }],
  },
];

function amounts({ subtotal, discount, tax, cgst, sgst, total }) {
  return { subtotal, discount, tax, cgst, sgst, total };
}

for (const fixture of cases) {
  test(`CURRENT BEHAVIOUR: ${fixture.name}`, () => {
    const { order } = fixture;
    const printed = invoice.computeInvoiceFigures(order);
    const billed = pricing.computeTotals(order.items, order.coupon);

    assert.deepEqual(amounts(printed), fixture.invoice, 'invoice amounts');
    assert.deepEqual(printed.rows.map(row => ({ rate: row.gstPercent, tax: row.lineTax })),
      fixture.invoiceLines, 'invoice line GST');
    assert.deepEqual(amounts(billed), fixture.checkout, 'checkout amounts');
    assert.deepEqual(billed.lines.map(line => ({ rate: line.gstPercent, tax: line.tax })),
      fixture.checkoutLines, 'checkout line GST');
  });
}

test('invoice prints the GST slab and capped coupon charged at checkout', () => {
  const items = [{ name: 'Rice', hsn: '1006', price: 224, qty: 10 }];
  const coupon = 'SAVE10';
  const billed = pricing.computeTotals(items, coupon);
  const order = { ...amounts(billed), id: 1004, items, coupon };
  const printed = invoice.computeInvoiceFigures(order);

  assert.deepEqual(amounts(printed), amounts(billed));
  assert.equal(printed.rows[0].gstPercent, 5);
  assert.equal(printed.rows[0].lineTax, 104.5);
  const html = invoice.render(order);
  assert.match(html, /<td class="r">5%<\/td><td class="r">₹104\.50<\/td>/);
  assert.match(html, /Coupon Discount \(SAVE10\)<\/td><td[^>]*>-₹150\.00<\/td>/);
  assert.match(html, /Invoice Total<\/td><td class="r">₹2194\.50<\/td>/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
});
