const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function compare(order) {
  const { rows, ...invoiceTotals } = invoice.computeInvoiceFigures(order);
  const { lines, taxable, ...checkoutTotals } = pricing.computeTotals(order.items, order.coupon);
  return {
    invoiceTotals,
    invoiceGst: rows.map(({ gstPercent, lineTax }) => ({ rate: gstPercent, tax: lineTax })),
    checkoutTotals,
    checkoutGst: lines.map(({ gstPercent, tax }) => ({ rate: gstPercent, tax }))
  };
}

test('#1001 invoice uses the 5% and 12% HSN slabs', () => {
  const order = {
    coupon: '',
    items: [
      { id: 1, name: 'Rice', hsn: '1006', price: 250, qty: 1 },
      { id: 2, name: 'Ghee', hsn: '0405', price: 180, qty: 2 }
    ]
  };

  assert.deepEqual(compare(order), {
    invoiceTotals: { subtotal: 610, discount: 0, tax: 55.70, cgst: 27.85, sgst: 27.85, total: 665.70 },
    invoiceGst: [{ rate: 5, tax: 12.50 }, { rate: 12, tax: 43.20 }],
    checkoutTotals: { subtotal: 610, discount: 0, tax: 55.70, cgst: 27.85, sgst: 27.85, total: 665.70 },
    checkoutGst: [{ rate: 5, tax: 12.50 }, { rate: 12, tax: 43.20 }]
  });
});

test('#1002 invoice applies SAVE10 before GST', () => {
  const order = {
    coupon: 'SAVE10',
    items: [
      { id: 1, name: 'Rice', hsn: '1006', price: 640, qty: 1 },
      { id: 4, name: 'Sunflower oil', hsn: '1512', price: 190, qty: 2 }
    ]
  };

  assert.deepEqual(compare(order), {
    invoiceTotals: { subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90 },
    invoiceGst: [{ rate: 5, tax: 28.80 }, { rate: 5, tax: 17.10 }],
    checkoutTotals: { subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90 },
    checkoutGst: [{ rate: 5, tax: 28.80 }, { rate: 5, tax: 17.10 }]
  });
});

test('#1004 invoice respects the SAVE10 cap', () => {
  const order = {
    coupon: 'SAVE10',
    items: [{ id: 5, name: 'Groundnut oil', hsn: '1508', price: 560, qty: 4 }]
  };

  assert.deepEqual(compare(order), {
    invoiceTotals: { subtotal: 2240, discount: 150, tax: 104.50, cgst: 52.25, sgst: 52.25, total: 2194.50 },
    invoiceGst: [{ rate: 5, tax: 104.50 }],
    checkoutTotals: { subtotal: 2240, discount: 150, tax: 104.50, cgst: 52.25, sgst: 52.25, total: 2194.50 },
    checkoutGst: [{ rate: 5, tax: 104.50 }]
  });
});

test('CURRENT BEHAVIOUR: #1008 invoice and checkout agree at 18% without a coupon', () => {
  const order = {
    coupon: '',
    items: [
      { id: 8, name: 'Tea', hsn: '0902', gstRate: 18, price: 140, qty: 2 },
      { id: 12, name: 'Syrup', hsn: '2106', price: 220, qty: 1 }
    ]
  };

  assert.deepEqual(compare(order), {
    invoiceTotals: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 },
    invoiceGst: [{ rate: 18, tax: 50.40 }, { rate: 18, tax: 39.60 }],
    checkoutTotals: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 },
    checkoutGst: [{ rate: 18, tax: 50.40 }, { rate: 18, tax: 39.60 }]
  });
});

test('invoice matches checkout for mixed GST slabs and a capped pre-tax coupon', () => {
  const order = {
    coupon: 'SAVE10',
    items: [
      { id: 1, name: 'Rice', hsn: '1006', price: 500, qty: 2 },
      { id: 2, name: 'Ghee', hsn: '0405', price: 620, qty: 2 }
    ]
  };

  const { invoiceTotals, invoiceGst, checkoutTotals, checkoutGst } = compare(order);
  assert.deepEqual(checkoutTotals, {
    subtotal: 2240, discount: 150, tax: 185.49, cgst: 92.75, sgst: 92.74, total: 2275.49
  });
  assert.deepEqual(checkoutGst, [{ rate: 5, tax: 46.65 }, { rate: 12, tax: 138.84 }]);
  assert.deepEqual(invoiceTotals, checkoutTotals);
  assert.deepEqual(invoiceGst, checkoutGst);

  const html = invoice.render({ ...order, ...checkoutTotals });
  assert.match(html, />5%<\/td><td class="r">₹46\.65<\/td>/);
  assert.match(html, />12%<\/td><td class="r">₹138\.84<\/td>/);
  assert.match(html, /Invoice Total<\/td><td class="r">₹2275\.49<\/td>/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);

  const historical = invoice.render({
    ...order, subtotal: 2240, discount: 200, tax: 367.20, total: 2407.20
  });
  assert.match(historical, /Total GST\)<\/td><td class="r">₹367\.20<\/td>/);
  assert.match(historical, /-₹200\.00<\/td>/);
  assert.match(historical, /Invoice Total<\/td><td class="r">₹2407\.20<\/td>/);
  assert.match(historical, /Accountant Reconciliation Notice/);
  assert.doesNotMatch(historical, />5%<\/td>|>12%<\/td>/);
});
