'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(name, price, qty, hsn) {
  return { name, sku: name, price, qty, hsn };
}

const cases = [
  {
    name: 'mixed HSN rates without a coupon',
    coupon: '',
    items: [item('Toor Dal', 165, 2, '0713'), item('Ghee', 140, 2, '0405')],
    expected: { subtotal: 610, discount: 0, tax: 50.1, cgst: 25.05, sgst: 25.05, total: 660.1 }
  },
  {
    name: 'SAVE10 discount and GST',
    coupon: 'SAVE10',
    items: [item('Rice', 640, 1, '1006'), item('Sunflower Oil', 190, 2, '1512')],
    expected: { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 }
  },
  {
    name: 'SAVE10 capped discount on a single HSN line',
    coupon: 'SAVE10',
    items: [item('Groundnut Oil', 1120, 2, '1508')],
    expected: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 }
  }
];

for (const scenario of cases) {
  test('Invoice figures match checkout for ' + scenario.name, function () {
    const order = { items: scenario.items, coupon: scenario.coupon };
    const checkout = pricing.computeTotals(order.items, order.coupon);
    const result = invoice.computeInvoiceFigures(order);
    const fields = ['subtotal', 'discount', 'tax', 'cgst', 'sgst', 'total'];

    for (const field of fields) {
      assert.equal(checkout[field], scenario.expected[field], 'checkout ' + field);
      assert.equal(result[field], scenario.expected[field], 'invoice ' + field);
    }
    assert.deepEqual(
      result.rows.map(row => ({ gstPercent: row.gstPercent, lineTax: row.lineTax })),
      checkout.lines.map(line => ({ gstPercent: line.gstPercent, lineTax: line.tax }))
    );
  });
}
