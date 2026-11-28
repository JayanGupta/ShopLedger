const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function makeOrder(id, items, coupon) {
  return { id, items, coupon };
}

const cases = [
  {
    id: 1001,
    coupon: '',
    items: [
      { name: 'Assam CTC Masala Chai 250g', sku: 'BEV-001', hsn: '0902', price: 140, qty: 2 },
      { name: 'Unpolished Toor Dal 1kg', sku: 'GRN-002', hsn: '0713', price: 165, qty: 2 }
    ],
    checkout: { subtotal: 610, discount: 0, tax: 66.9, cgst: 33.45, sgst: 33.45, total: 676.9 },
    checkoutRates: [18, 5]
  },
  {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      { name: 'Indrayani Basmati Rice 5kg', sku: 'GRN-001', hsn: '1006', price: 640, qty: 1 },
      { name: 'Cold-Pressed Sunflower Oil 1L', sku: 'OIL-001', hsn: '1512', price: 190, qty: 2 }
    ],
    checkout: { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 },
    checkoutRates: [5, 5]
  },
  {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { name: 'Cold-Pressed Groundnut Oil 5L', sku: 'OIL-002', hsn: '1508', price: 1120, qty: 2 }
    ],
    checkout: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 },
    checkoutRates: [5]
  },
  {
    id: 1008,
    coupon: '',
    items: [
      { name: 'Assam CTC Masala Chai 250g', sku: 'BEV-001', hsn: '0902', price: 140, qty: 1 },
      { name: 'Kokum Sherbet Concentrate 750ml', sku: 'BEV-003', hsn: '2106', price: 180, qty: 2 }
    ],
    checkout: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 },
    checkoutRates: [18, 18]
  }
];

for (const sample of cases) {
  test(`invoice #${sample.id} matches checkout totals and HSN GST slabs`, () => {
    const order = makeOrder(sample.id, sample.items, sample.coupon);
    const actualInvoice = invoice.computeInvoiceFigures(order);
    const actualCheckout = pricing.computeTotals(sample.items, sample.coupon);

    const invoiceFigures = {
      subtotal: actualInvoice.subtotal,
      discount: actualInvoice.discount,
      tax: actualInvoice.tax,
      cgst: actualInvoice.cgst,
      sgst: actualInvoice.sgst,
      total: actualInvoice.total
    };
    assert.deepEqual(invoiceFigures, sample.checkout);
    assert.deepEqual(actualInvoice.rows.map(row => row.gstPercent), sample.checkoutRates);
    assert.deepEqual(
      actualInvoice.rows.map(row => row.lineTax),
      actualCheckout.lines.map(line => line.tax)
    );
    assert.deepEqual(
      {
        subtotal: actualCheckout.subtotal,
        discount: actualCheckout.discount,
        tax: actualCheckout.tax,
        cgst: actualCheckout.cgst,
        sgst: actualCheckout.sgst,
        total: actualCheckout.total
      },
      sample.checkout
    );
    assert.deepEqual(actualCheckout.lines.map(line => line.gstPercent), sample.checkoutRates);
  });
}

test('invoice figures match checkout for GST slabs and capped coupons', () => {
  const sample = cases.find(item => item.id === 1002);
  const actualInvoice = invoice.computeInvoiceFigures(makeOrder(sample.id, sample.items, sample.coupon));
  const checkout = pricing.computeTotals(sample.items, sample.coupon);

  assert.deepEqual(
    {
      subtotal: actualInvoice.subtotal,
      discount: actualInvoice.discount,
      tax: actualInvoice.tax,
      cgst: actualInvoice.cgst,
      sgst: actualInvoice.sgst,
      total: actualInvoice.total
    },
    {
      subtotal: checkout.subtotal,
      discount: checkout.discount,
      tax: checkout.tax,
      cgst: checkout.cgst,
      sgst: checkout.sgst,
      total: checkout.total
    }
  );
});
