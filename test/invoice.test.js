const assert = require('node:assert/strict');
const test = require('node:test');

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function riceOrder() {
  return {
    id: 1002,
    items: [
      { name: 'Rice', hsn: '1006', price: 640, qty: 1 },
      { name: 'Sunflower oil', hsn: '1512', price: 190, qty: 2 }
    ],
    coupon: 'SAVE10',
    subtotal: 1020,
    discount: 102,
    tax: 45.9,
    total: 963.9
  };
}

function amounts({ subtotal, discount, tax, total }) {
  return { subtotal, discount, tax, total };
}

test('checkout records the discount before charging HSN GST', () => {
  const order = riceOrder();
  assert.deepEqual(amounts(pricing.computeTotals(order.items, order.coupon)), amounts(order));
});

test('invoice breakdown keeps printable item details and splits GST', () => {
  const order = { items: [{ name: 'Tea', sku: 'TEA', hsn: '0902', price: 20.06, qty: 1 }] };
  const figures = invoice.computeInvoiceFigures(order);

  assert.deepEqual(figures.rows[0], {
    name: 'Tea', sku: 'TEA', hsn: '0902', qty: 1, price: 20.06,
    gstPercent: 18, line: 20.06, lineTax: 3.61
  });
  assert.equal(figures.cgst, 1.81);
  assert.equal(figures.sgst, 1.8);
});

test('invoice for order #1002 matches the stored checkout totals and uses 5% GST', () => {
  const order = riceOrder();
  const figures = invoice.computeInvoiceFigures(order);

  assert.deepEqual(amounts(figures), amounts(order));
  assert.deepEqual(figures.rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]), [
    [5, 28.8], [5, 17.1]
  ]);
  assert.equal(figures.cgst, 22.95);
  assert.equal(figures.sgst, 22.95);
  assert.doesNotMatch(invoice.render(order), /Accountant Reconciliation Notice/);
});

test('invoice respects the SAVE10 cap and computes GST on the discounted amount', () => {
  const order = {
    items: [{ name: 'Groundnut oil', hsn: '1508', price: 1120, qty: 2 }],
    coupon: 'SAVE10'
  };

  assert.deepEqual(amounts(invoice.computeInvoiceFigures(order)), {
    subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5
  });
});

test('invoice applies a flat coupon across mixed GST slabs', () => {
  const order = {
    items: [
      { name: 'Ghee', hsn: '0405', price: 260, qty: 1 },
      { name: 'Tea', hsn: '0902', price: 140, qty: 1 }
    ],
    coupon: 'FLAT50'
  };
  const figures = invoice.computeInvoiceFigures(order);

  assert.deepEqual(amounts(figures), { subtotal: 400, discount: 50, tax: 49.35, total: 399.35 });
  assert.deepEqual(figures.rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]), [
    [12, 27.3], [18, 22.05]
  ]);
});
