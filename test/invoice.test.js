const test = require('node:test');
const assert = require('node:assert/strict');

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

const cases = [
  {
    name: 'order #1001 invoice uses checkout HSN slabs',
    orderId: 1001,
    coupon: '',
    items: [
      { name: 'Assam CTC Masala Chai', sku: 'BEV-001', hsn: '0902', price: 140, qty: 2 },
      { name: 'Unpolished Toor Dal', sku: 'GRN-002', hsn: '0713', price: 165, qty: 2 }
    ],
    expectedInvoice: { subtotal: 610, discount: 0, tax: 66.9, cgst: 33.45, sgst: 33.45, total: 676.9, rates: [18, 5] },
    expectedCheckout: { subtotal: 610, discount: 0, tax: 66.9, total: 676.9, rates: [18, 5] }
  },
  {
    name: 'order #1002 invoice applies SAVE10 before tax',
    orderId: 1002,
    coupon: 'SAVE10',
    items: [
      { name: 'Indrayani Rice', sku: 'GRN-001', hsn: '1006', price: 640, qty: 1 },
      { name: 'Sunflower Oil', sku: 'OIL-001', hsn: '1512', price: 190, qty: 2 }
    ],
    expectedInvoice: { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9, rates: [5, 5] },
    expectedCheckout: { subtotal: 1020, discount: 102, tax: 45.9, total: 963.9, rates: [5, 5] }
  },
  {
    name: 'order #1004 invoice applies SAVE10 maximum discount',
    orderId: 1004,
    coupon: 'SAVE10',
    items: [
      { name: 'Groundnut Oil', sku: 'OIL-002', hsn: '1508', price: 1120, qty: 2 }
    ],
    expectedInvoice: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5, rates: [5] },
    expectedCheckout: { subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5, rates: [5] }
  },
  {
    name: 'CURRENT BEHAVIOUR: order #1008 invoice totals agree when all items use 18% GST without coupon',
    orderId: 1008,
    coupon: '',
    items: [
      { name: 'Assam CTC Masala Chai', sku: 'BEV-001', hsn: '0902', price: 140, qty: 1 },
      { name: 'Kokum Sherbet Concentrate', sku: 'BEV-003', hsn: '2106', price: 180, qty: 2 }
    ],
    expectedInvoice: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590, rates: [18, 18] },
    expectedCheckout: { subtotal: 500, discount: 0, tax: 90, total: 590, rates: [18, 18] }
  }
];

test('invoice figures match checkout HSN GST, capped coupon discount, and totals', () => {
  for (const fixture of cases) {
    const items = fixture.items.map(item => ({ ...item }));
    const figures = invoice.computeInvoiceFigures({ id: fixture.orderId, coupon: fixture.coupon, items });
    const checkout = pricing.computeTotals(items, fixture.coupon);

    assert.deepEqual(
      {
        subtotal: figures.subtotal,
        discount: figures.discount,
        tax: figures.tax,
        cgst: figures.cgst,
        sgst: figures.sgst,
        total: figures.total,
        rates: figures.rows.map(row => row.gstPercent)
      },
      {
        subtotal: checkout.subtotal,
        discount: checkout.discount,
        tax: checkout.tax,
        cgst: checkout.cgst,
        sgst: checkout.sgst,
        total: checkout.total,
        rates: checkout.lines.map(line => line.gstPercent)
      }
    );
  }
});

for (const fixture of cases) {
  test(fixture.name, () => {
    const order = {
      id: fixture.orderId,
      coupon: fixture.coupon,
      items: fixture.items.map(item => ({ ...item }))
    };

    const figures = invoice.computeInvoiceFigures(order);
    const checkout = pricing.computeTotals(order.items, order.coupon);

    assert.deepEqual(
      {
        subtotal: figures.subtotal,
        discount: figures.discount,
        tax: figures.tax,
        cgst: figures.cgst,
        sgst: figures.sgst,
        total: figures.total,
        rates: figures.rows.map(row => row.gstPercent)
      },
      fixture.expectedInvoice
    );
    assert.deepEqual(
      {
        subtotal: checkout.subtotal,
        discount: checkout.discount,
        tax: checkout.tax,
        total: checkout.total,
        rates: checkout.lines.map(line => line.gstPercent)
      },
      fixture.expectedCheckout
    );
  });
}
