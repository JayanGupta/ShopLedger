const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function assertFigures(order, expected) {
  const checkout = pricing.computeTotals(order.items, order.coupon);
  const printed = invoice.computeInvoiceFigures(order);

  const { subtotal, discount, tax, cgst, sgst, total } = printed;
  assert.deepStrictEqual({ subtotal, discount, tax, cgst, sgst, total }, expected.invoice);
  assert.deepStrictEqual(
    printed.rows.map(({ hsn, gstPercent, lineTax }) => ({ hsn, gstPercent, lineTax })),
    expected.rows
  );
  assert.deepStrictEqual(
    { discount: checkout.discount, tax: checkout.tax, total: checkout.total },
    expected.checkout
  );
}

test('#1001 prints the 5% and 12% HSN slabs on their respective lines', () => {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      { name: 'Dal', hsn: '0713', price: 165, qty: 2 },
      { name: 'Spices', hsn: '0904', price: 140, qty: 2 }
    ]
  };
  assertFigures(order, {
    invoice: { subtotal: 610, discount: 0, tax: 50.10, cgst: 25.05, sgst: 25.05, total: 660.10 },
    rows: [
      { hsn: '0713', gstPercent: 5, lineTax: 16.50 },
      { hsn: '0904', gstPercent: 12, lineTax: 33.60 }
    ],
    checkout: { discount: 0, tax: 50.10, total: 660.10 }
  });
});

test('#1002 applies SAVE10 before computing GST on each line', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    total: 963.90,
    items: [
      { name: 'Rice', hsn: '1006', price: 640, qty: 1 },
      { name: 'Sunflower oil', hsn: '1512', price: 190, qty: 2 }
    ]
  };
  assertFigures(order, {
    invoice: { subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90 },
    rows: [
      { hsn: '1006', gstPercent: 5, lineTax: 28.80 },
      { hsn: '1512', gstPercent: 5, lineTax: 17.10 }
    ],
    checkout: { discount: 102, tax: 45.90, total: 963.90 }
  });
  const html = invoice.render(order);
  assert.match(html, /5%<\/td>\s*<td[^>]*>₹28\.80</);
  assert.match(html, /5%<\/td>\s*<td[^>]*>₹17\.10</);
  assert.match(html, /Coupon Discount \(SAVE10\)<\/td>\s*<td[^>]*>-₹102\.00</);
  assert.match(html, /Invoice Total<\/td>\s*<td[^>]*>₹963\.90</);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
});

test('#1004 caps SAVE10 at ₹150 before applying 5% GST', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [{ name: 'Groundnut oil', hsn: '1508', price: 1120, qty: 2 }]
  };
  assertFigures(order, {
    invoice: { subtotal: 2240, discount: 150, tax: 104.50, cgst: 52.25, sgst: 52.25, total: 2194.50 },
    rows: [{ hsn: '1508', gstPercent: 5, lineTax: 104.50 }],
    checkout: { discount: 150, tax: 104.50, total: 2194.50 }
  });
});

test('CURRENT BEHAVIOUR: #1008 matches checkout for 18% lines without a coupon', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      { name: 'Tea', hsn: '0902', price: 140, qty: 1 },
      { name: 'Syrup', hsn: '2106', gstRate: 18, price: 180, qty: 2 }
    ]
  };
  assertFigures(order, {
    invoice: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 },
    rows: [
      { hsn: '0902', gstPercent: 18, lineTax: 25.20 },
      { hsn: '2106', gstPercent: 18, lineTax: 64.80 }
    ],
    checkout: { discount: 0, tax: 90, total: 590 }
  });
});

test('invoice matches checkout on every GST slab after allocating a capped coupon', (t) => {
  const items = [
    { name: 'Rice', sku: 'R1', hsn: '1006', price: 560, qty: 2 },
    { name: 'Ghee', sku: 'G1', hsn: '0405', price: 672, qty: 1 },
    { name: 'Tea', sku: 'T1', hsn: '0902', price: 224, qty: 2 }
  ];
  const coupon = 'SAVE10';
  const { subtotal, discount, tax, cgst, sgst, total, lines } = pricing.computeTotals(items, coupon);
  const order = { items, coupon, subtotal, discount, tax, total };
  const expected = {
    subtotal, discount, tax, cgst, sgst, total,
    rows: items.map((item, index) => ({
      ...item,
      gstPercent: lines[index].gstPercent,
      line: lines[index].gross,
      lineTax: lines[index].tax
    }))
  };
  assert.deepStrictEqual(invoice.computeInvoiceFigures(order), expected);

  // A later reprint must retain the discount that checkout saved.
  t.mock.method(require('../lib/coupons'), 'getCoupon', () => null);
  assert.deepStrictEqual(invoice.computeInvoiceFigures(order), expected);
});
