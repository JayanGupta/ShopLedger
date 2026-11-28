const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// An undefined gstRate models an order line with no saved rate override.
const cases = [
  {
    name: 'CURRENT BEHAVIOUR: #1001 invoice uses the 5% and 12% HSN slabs',
    order: {
      id: 1001,
      coupon: '',
      items: [
        { name: 'Toor dal', price: 165, qty: 2, hsn: '0713', gstRate: undefined },
        { name: 'Chilli powder', price: 140, qty: 2, hsn: '0904', gstRate: undefined },
      ],
    },
    checkout: { discount: 0, tax: 50.10, total: 660.10 },
    checkoutRates: [5, 12],
    invoiceTotals: {
      subtotal: 610,
      discount: 0,
      tax: 50.10,
      cgst: 25.05,
      sgst: 25.05,
      total: 660.10,
    },
    invoiceRows: [
      { hsn: '0713', gstPercent: 5, lineTax: 16.50 },
      { hsn: '0904', gstPercent: 12, lineTax: 33.60 },
    ],
  },
  {
    name: 'CURRENT BEHAVIOUR: #1002 invoice applies SAVE10 before GST',
    order: {
      id: 1002,
      coupon: 'SAVE10',
      items: [
        { name: 'Basmati rice', price: 640, qty: 1, hsn: '1006', gstRate: undefined },
        { name: 'Sunflower oil', price: 190, qty: 2, hsn: '1512', gstRate: undefined },
      ],
    },
    checkout: { discount: 102, tax: 45.90, total: 963.90 },
    checkoutRates: [5, 5],
    invoiceTotals: {
      subtotal: 1020,
      discount: 102,
      tax: 45.90,
      cgst: 22.95,
      sgst: 22.95,
      total: 963.90,
    },
    invoiceRows: [
      { hsn: '1006', gstPercent: 5, lineTax: 28.80 },
      { hsn: '1512', gstPercent: 5, lineTax: 17.10 },
    ],
  },
  {
    name: 'CURRENT BEHAVIOUR: #1004 invoice honours the ₹150 SAVE10 cap',
    order: {
      id: 1004,
      coupon: 'SAVE10',
      items: [
        { name: 'Basmati rice', price: 640, qty: 2, hsn: '1006', gstRate: undefined },
        { name: 'Cane jaggery', price: 160, qty: 6, hsn: '1701', gstRate: undefined },
      ],
    },
    checkout: { discount: 150, tax: 104.50, total: 2194.50 },
    checkoutRates: [5, 5],
    invoiceTotals: {
      subtotal: 2240,
      discount: 150,
      tax: 104.50,
      cgst: 52.25,
      sgst: 52.25,
      total: 2194.50,
    },
    invoiceRows: [
      { hsn: '1006', gstPercent: 5, lineTax: 59.71 },
      { hsn: '1701', gstPercent: 5, lineTax: 44.79 },
    ],
  },
  {
    name: 'CURRENT BEHAVIOUR: #1008 invoice matches checkout for 18% items without a coupon',
    order: {
      id: 1008,
      coupon: '',
      items: [
        { name: 'Packaged tea', price: 140, qty: 1, hsn: '0902', gstRate: undefined },
        { name: 'Coffee blend', price: 180, qty: 2, hsn: '0901', gstRate: 18 },
      ],
    },
    checkout: { discount: 0, tax: 90, total: 590 },
    checkoutRates: [18, 18],
    invoiceTotals: {
      subtotal: 500,
      discount: 0,
      tax: 90,
      cgst: 45,
      sgst: 45,
      total: 590,
    },
    invoiceRows: [
      { hsn: '0902', gstPercent: 18, lineTax: 25.20 },
      { hsn: '0901', gstPercent: 18, lineTax: 64.80 },
    ],
  },
];

for (const example of cases) {
  test(example.name, () => {
    const { items, coupon } = example.order;
    const checkout = pricing.computeTotals(items, coupon);
    const { rows, ...invoiceTotals } = invoice.computeInvoiceFigures({
      ...example.order,
      subtotal: checkout.subtotal,
      discount: checkout.discount,
      tax: checkout.tax,
      total: checkout.total,
    });

    assert.deepEqual(invoiceTotals, example.invoiceTotals);
    assert.deepEqual(
      rows.map(({ hsn, gstPercent, lineTax }) => ({ hsn, gstPercent, lineTax })),
      example.invoiceRows
    );
    assert.deepEqual(
      { discount: checkout.discount, tax: checkout.tax, total: checkout.total },
      example.checkout
    );
    assert.deepEqual(checkout.lines.map(({ gstPercent }) => gstPercent), example.checkoutRates);
  });
}

test('printed invoice matches checkout for mixed GST slabs and capped SAVE10', () => {
  const items = [
    { name: 'Basmati rice', price: 560, qty: 2, hsn: '1006' },
    { name: 'Ghee', price: 280, qty: 4, hsn: '0405' },
  ];
  const coupon = 'SAVE10';
  const { subtotal, discount, tax, total } = pricing.computeTotals(items, coupon);
  const html = invoice.render({ id: 2001, items, coupon, subtotal, discount, tax, total });

  const lineTaxes = Array.from(
    html.matchAll(/<td class="r">(\d+)%<\/td><td class="r">₹([\d.]+)<\/td>/g),
    ([, rate, amount]) => [rate, amount]
  );
  assert.deepEqual(lineTaxes, [['5', '52.25'], ['12', '125.40']]);

  const summaryAmounts = Array.from(
    html.matchAll(/(?:Gross Subtotal|Total GST\)|Invoice Total)<\/td><td class="r">₹([\d.]+)<\/td>/g),
    ([, amount]) => amount
  );
  assert.deepEqual(summaryAmounts, ['2240.00', '177.65', '2267.65']);
  assert.match(html, /Coupon Discount \(SAVE10\)<\/td><td[^>]*>-₹150\.00<\/td>/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
});
