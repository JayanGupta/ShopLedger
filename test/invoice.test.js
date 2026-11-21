const assert = require('node:assert/strict');
const test = require('node:test');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(name, hsn, price, qty) {
  // Model a saved checkout line with no explicit GST override.
  return { name, hsn, price, qty, gstRate: undefined };
}

const cases = [
  {
    id: 1001,
    description: 'uses the 5% and 12% HSN slabs',
    items: [item('Dal', '0713', 165, 2), item('Ghee', '0405', 140, 2)],
    coupon: '',
    checkout: { subtotal: 610, discount: 0, tax: 50.10, total: 660.10 },
    checkoutRates: [5, 12],
    figures: { subtotal: 610, discount: 0, tax: 50.10, cgst: 25.05, sgst: 25.05, total: 660.10 },
    rows: [
      { gstPercent: 5, line: 330, lineTax: 16.50 },
      { gstPercent: 12, line: 280, lineTax: 33.60 },
    ],
  },
  {
    id: 1002,
    description: 'applies SAVE10 before charging GST',
    items: [item('Rice', '1006', 640, 1), item('Sunflower oil', '1512', 190, 2)],
    coupon: 'SAVE10',
    checkout: { subtotal: 1020, discount: 102, tax: 45.90, total: 963.90 },
    checkoutRates: [5, 5],
    figures: { subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90 },
    rows: [
      { gstPercent: 5, line: 640, lineTax: 28.80 },
      { gstPercent: 5, line: 380, lineTax: 17.10 },
    ],
  },
  {
    id: 1004,
    description: 'honours the SAVE10 cap on a 2240 subtotal',
    items: [item('Groundnut oil', '1508', 1120, 2)],
    coupon: 'SAVE10',
    checkout: { subtotal: 2240, discount: 150, tax: 104.50, total: 2194.50 },
    checkoutRates: [5],
    figures: { subtotal: 2240, discount: 150, tax: 104.50, cgst: 52.25, sgst: 52.25, total: 2194.50 },
    rows: [{ gstPercent: 5, line: 2240, lineTax: 104.50 }],
  },
  {
    id: 1008,
    description: 'matches checkout on 18% items without a coupon',
    items: [item('Tea', '0902', 140, 1), item('Syrup', '2106', 180, 2)],
    coupon: '',
    checkout: { subtotal: 500, discount: 0, tax: 90, total: 590 },
    checkoutRates: [18, 18],
    figures: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 },
    rows: [
      { gstPercent: 18, line: 140, lineTax: 25.20 },
      { gstPercent: 18, line: 360, lineTax: 64.80 },
    ],
  },
];

for (const scenario of cases) {
  test(`CURRENT BEHAVIOUR: #${scenario.id} ${scenario.description}`, () => {
    const { id, items, coupon } = scenario;
    const { subtotal, discount, tax, total, lines } = pricing.computeTotals(items, coupon);
    const checkout = { subtotal, discount, tax, total };
    const figures = invoice.computeInvoiceFigures({ id, items, coupon, ...checkout });

    assert.deepEqual(checkout, scenario.checkout);
    assert.deepEqual(lines.map((line) => line.gstPercent), scenario.checkoutRates);
    assert.deepEqual(figures, {
      ...scenario.figures,
      rows: items.map(({ name, hsn, price, qty }, index) => ({
        name,
        sku: '-',
        hsn,
        price,
        qty,
        ...scenario.rows[index],
      })),
    });
  });
}

test('invoice matches checkout for mixed HSN slabs and a capped coupon', () => {
  const items = [item('Rice', '1006', 600, 2), item('Ghee', '0405', 520, 2)];
  const coupon = 'SAVE10';
  const checkout = pricing.computeTotals(items, coupon);
  const { subtotal, discount, tax, total } = checkout;
  const order = { id: 2001, items, coupon, subtotal, discount, tax, total };
  const { rows, ...figures } = invoice.computeInvoiceFigures(order);

  assert.equal(checkout.discount, 150);
  assert.deepEqual(figures, { subtotal, discount, tax, cgst: checkout.cgst, sgst: checkout.sgst, total });
  assert.deepEqual(rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]), [
    [5, 55.98],
    [12, 116.44],
  ]);
  const html = invoice.render(order);
  assert.match(html, /Invoice Total<\/td><td class="r">₹2262\.42<\/td>/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);

  // A retired coupon is no longer available to the live pricing rules.
  const historicalOrder = { ...order, coupon: 'RETIRED10' };
  assert.equal(invoice.computeInvoiceFigures(historicalOrder).total, 2424.80);
  const historicalHtml = invoice.render(historicalOrder);
  assert.match(historicalHtml, /Gross Subtotal<\/td><td class="r">₹2240\.00<\/td>/);
  assert.match(historicalHtml, /Coupon Discount \(RETIRED10\)<\/td><td[^>]*>-₹150\.00<\/td>/);
  assert.match(historicalHtml, /Total GST\)<\/td><td class="r">₹172\.42<\/td>/);
  assert.match(historicalHtml, /Invoice Total<\/td><td class="r">₹2262\.42<\/td>/);
  assert.match(historicalHtml, /Per-line GST could not be verified/);
  assert.doesNotMatch(historicalHtml, /<td class="r">(?:5%|12%)<\/td>/);
});
