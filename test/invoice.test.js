const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

const orders = {
  mixedSlabs: {
    coupon: '',
    items: [
      { name: 'Rice', hsn: '1006', price: 100, qty: 1 },
      { name: 'Ghee', hsn: '0405', price: 100, qty: 1 }
    ]
  },
  save10: {
    coupon: 'SAVE10',
    items: [{ name: 'Rice', hsn: '1006', price: 510, qty: 2 }]
  },
  cappedSave10: {
    coupon: 'SAVE10',
    items: [{ name: 'Groundnut oil', hsn: '1508', price: 1120, qty: 2 }]
  },
  standardRate: {
    coupon: '',
    items: [{ name: 'Tea', hsn: '0902', price: 250, qty: 2, gstRate: 18 }]
  }
};

function figures({ subtotal, discount, tax, total }) {
  return { subtotal, discount, tax, total };
}

test('#1001-like invoice applies each HSN slab', () => {
  const order = orders.mixedSlabs;
  const printed = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(printed.rows.map(row => row.gstPercent), [5, 12]);
  assert.deepEqual(checkout.lines.map(line => line.gstPercent), [5, 12]);
  assert.deepEqual(figures(printed), figures(checkout));
  assert.deepEqual(figures(checkout), { subtotal: 200, discount: 0, tax: 17, total: 217 });
});

test('#1002-like invoice applies SAVE10 before GST', () => {
  const order = orders.save10;
  const printed = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(figures(printed), figures(checkout));
  assert.deepEqual(figures(checkout), { subtotal: 1020, discount: 102, tax: 45.90, total: 963.90 });
});

test('#1004-like invoice honours the SAVE10 discount cap', () => {
  const order = orders.cappedSave10;
  const printed = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(figures(printed), figures(checkout));
  assert.deepEqual(figures(checkout), { subtotal: 2240, discount: 150, tax: 104.50, total: 2194.50 });
});

test('#1008-like invoice already matches checkout for 18% items without a coupon', () => {
  const order = orders.standardRate;
  const printed = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(printed.rows.map(row => row.gstPercent), [18]);
  assert.deepEqual(figures(printed), { subtotal: 500, discount: 0, tax: 90, total: 590 });
  assert.deepEqual(figures(printed), figures(checkout));
});

test('invoice matches checkout GST by HSN and applies the capped SAVE10 before tax', () => {
  const order = {
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', hsn: '1006', price: 100, qty: 1 },
      { name: 'Ghee', hsn: '0405', price: 1070, qty: 2 }
    ]
  };
  const checkout = pricing.computeTotals(order.items, order.coupon);
  const printed = invoice.computeInvoiceFigures({ ...order, ...figures(checkout) });

  assert.deepEqual(figures(printed), { subtotal: 2240, discount: 150, tax: 244.27, total: 2334.27 });
  assert.deepEqual(figures(printed), figures(checkout));
  assert.deepEqual(
    printed.rows.map(({ hsn, gstPercent, lineTax }) => ({ hsn, gstPercent, lineTax })),
    [
      { hsn: '1006', gstPercent: 5, lineTax: 4.67 },
      { hsn: '0405', gstPercent: 12, lineTax: 239.60 }
    ]
  );
  assert.deepEqual([printed.cgst, printed.sgst], [checkout.cgst, checkout.sgst]);
});
