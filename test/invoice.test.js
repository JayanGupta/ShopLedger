const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(name, price, qty, hsn) {
  return { name, sku: name, price, qty, hsn, gstRate: undefined };
}

const orders = [
  {
    name: 'invoice matches order #1001 HSN GST breakdown',
    coupon: '',
    items: [item('Tea', 140, 2, '0902'), item('Dal', 165, 2, '0713')],
    expected: { subtotal: 610, discount: 0, tax: 66.9, cgst: 33.45, sgst: 33.45, total: 676.9, rates: [18, 5] }
  },
  {
    name: 'invoice matches order #1002 SAVE10 checkout discount and GST',
    coupon: 'SAVE10',
    items: [item('Rice', 640, 1, '1006'), item('Sunflower oil', 190, 2, '1512')],
    expected: { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9, rates: [5, 5] }
  },
  {
    name: 'invoice matches order #1004 capped SAVE10 discount and HSN GST',
    coupon: 'SAVE10',
    items: [item('Groundnut oil', 1120, 2, '1508')],
    expected: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5, rates: [5] }
  },
  {
    name: 'CURRENT BEHAVIOUR: order #1008 applies default 18% invoice GST to all lines',
    coupon: '',
    items: [item('Tea', 140, 1, '0902'), item('Sherbet', 180, 2, '2106')],
    expected: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590, rates: [18, 18] }
  }
];

for (const order of orders) {
  test(order.name, () => {
    const invoiceFigures = invoice.computeInvoiceFigures({ items: order.items, coupon: order.coupon });
    const checkoutFigures = pricing.computeTotals(order.items, order.coupon);

    assert.deepEqual(
      { subtotal: invoiceFigures.subtotal, discount: invoiceFigures.discount, tax: invoiceFigures.tax,
        cgst: invoiceFigures.cgst, sgst: invoiceFigures.sgst, total: invoiceFigures.total,
        rates: invoiceFigures.rows.map(row => row.gstPercent) },
      order.expected
    );
    assert.equal(checkoutFigures.subtotal, order.name.includes('#1001') ? 610 : order.name.includes('#1002') ? 1020 : order.name.includes('#1004') ? 2240 : 500);
    assert.equal(checkoutFigures.total, order.name.includes('#1001') ? 676.9 : order.name.includes('#1002') ? 963.9 : order.name.includes('#1004') ? 2194.5 : 590);
  });
}


test('invoice uses checkout figures for a capped coupon and mixed HSN slabs', () => {
  const items = [item('Rice', 640, 1, '1006'), item('Ghee', 450, 2, '0405'), item('Tea', 140, 1, '0902')];
  const invoiceFigures = invoice.computeInvoiceFigures({ items, coupon: 'SAVE10' });
  const checkoutFigures = pricing.computeTotals(items, 'SAVE10');

  assert.equal(invoiceFigures.subtotal, checkoutFigures.subtotal);
  assert.equal(invoiceFigures.discount, checkoutFigures.discount);
  assert.equal(invoiceFigures.tax, checkoutFigures.tax);
  assert.equal(invoiceFigures.total, checkoutFigures.total);
  assert.deepEqual(invoiceFigures.rows.map(row => row.gstPercent), checkoutFigures.lines.map(line => line.gstPercent));
  assert.deepEqual(invoiceFigures.rows.map(row => row.lineTax), checkoutFigures.lines.map(line => line.tax));
});

