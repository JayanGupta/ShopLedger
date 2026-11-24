const test = require('node:test');
const assert = require('node:assert/strict');

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// These in-memory line items mirror the fields stored by routes/orders.js.
// gstRate is null because that route stores HSN but does not persist gstRate.
function line(name, price, qty, hsn) {
  return { name, price, qty, hsn, gstRate: null };
}

const orders = [
  {
    id: 1001,
    coupon: '',
    items: [
      line('Assam tea', 140, 2, '0902'),
      line('Toor dal', 165, 2, '0713')
    ],
    expected: { subtotal: 610, discount: 0, tax: 66.9, cgst: 33.45, sgst: 33.45, total: 676.9, rates: [18, 5] },
    checkout: { tax: 66.9, total: 676.9 }
  },
  {
    id: 1002,
    coupon: 'SAVE10',
    items: [line('Rice', 640, 1, '1006'), line('Sunflower oil', 190, 2, '1512')],
    expected: { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9, rates: [5, 5] },
    checkout: { discount: 102, tax: 45.9, total: 963.9 }
  },
  {
    id: 1004,
    coupon: 'SAVE10',
    items: [line('Groundnut oil', 1120, 2, '1508')],
    expected: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5, rates: [5] },
    checkout: { discount: 150, tax: 104.5, total: 2194.5 }
  },
  {
    id: 1008,
    coupon: '',
    items: [
      line('Packaged tea', 140, 1, '0902'),
      line('Sherbet concentrate', 180, 2, '2106')
    ],
    expected: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590, rates: [18, 18] },
    checkout: { tax: 90, total: 590 }
  }
];

for (const order of orders) {
  test(`CURRENT BEHAVIOUR: invoice figures for #${order.id}`, () => {
    const invoiceFigures = invoice.computeInvoiceFigures(order);
    const checkoutFigures = pricing.computeTotals(order.items, order.coupon);

    assert.deepEqual(
      {
        subtotal: invoiceFigures.subtotal,
        discount: invoiceFigures.discount,
        tax: invoiceFigures.tax,
        cgst: invoiceFigures.cgst,
        sgst: invoiceFigures.sgst,
        total: invoiceFigures.total,
        rates: invoiceFigures.rows.map(row => row.gstPercent)
      },
      order.expected
    );
    for (const [field, expected] of Object.entries(order.checkout)) {
      assert.equal(checkoutFigures[field], expected, `checkout ${field}`);
    }
  });
}

test('Invoice figures match checkout for reported orders', () => {
  const reportedOrders = [
    {
      id: 1001,
      coupon: '',
      items: [line('Assam tea', 140, 2, '0902'), line('Toor dal', 165, 2, '0713')]
    },
    {
      id: 1002,
      coupon: 'SAVE10',
      items: [line('Rice', 640, 1, '1006'), line('Sunflower oil', 190, 2, '1512')]
    },
    {
      id: 1004,
      coupon: 'SAVE10',
      items: [line('Groundnut oil', 1120, 2, '1508')]
    },
    {
      id: 1008,
      coupon: '',
      items: [line('Assam tea', 140, 1, '0902'), line('Sherbet concentrate', 180, 2, '2106')]
    }
  ];

  for (const order of reportedOrders) {
    const actualInvoice = invoice.computeInvoiceFigures(order);
    const checkout = pricing.computeTotals(order.items, order.coupon);
    assert.deepEqual(
      {
        subtotal: actualInvoice.subtotal,
        discount: actualInvoice.discount,
        tax: actualInvoice.tax,
        cgst: actualInvoice.cgst,
        sgst: actualInvoice.sgst,
        total: actualInvoice.total,
        rates: actualInvoice.rows.map(row => row.gstPercent)
      },
      {
        subtotal: checkout.subtotal,
        discount: checkout.discount,
        tax: checkout.tax,
        cgst: checkout.cgst,
        sgst: checkout.sgst,
        total: checkout.total,
        rates: checkout.lines.map(item => item.gstPercent)
      },
      `order #${order.id}`
    );
  }
});
