const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function calculate(order) {
  const { rows, ...invoiceTotals } = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(order.items, order.coupon);
  return {
    invoiceTotals,
    invoiceGst: rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]),
    checkout,
    checkoutGst: checkout.lines.map(({ gstPercent, tax }) => [gstPercent, tax])
  };
}

test('CURRENT BEHAVIOUR: #1001 invoice uses the checkout GST rates for mixed HSN slabs', () => {
  // A missing gstRate mirrors the checkout route's saved item shape.
  const order = {
    id: 1001,
    coupon: '',
    items: [
      { name: 'Rice', price: 100, qty: 2, hsn: '1006' },
      { name: 'Ghee', price: 300, qty: 1, hsn: '0405' }
    ]
  };

  const { invoiceTotals, invoiceGst, checkout, checkoutGst } = calculate(order);

  assert.deepEqual(invoiceTotals, {
    subtotal: 500, discount: 0, tax: 46, cgst: 23, sgst: 23, total: 546
  });
  assert.deepEqual(invoiceGst, [[5, 10], [12, 36]]);
  assert.deepEqual(checkoutGst, [[5, 10], [12, 36]]);
  assert.equal(checkout.tax, 46);
  assert.equal(checkout.total, 546);
});

test('CURRENT BEHAVIOUR: #1002 invoice applies SAVE10 before GST', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [{ name: 'Rice', price: 100, qty: 10, hsn: '1006', gstRate: 5 }]
  };

  const { invoiceTotals, invoiceGst, checkout, checkoutGst } = calculate(order);

  assert.deepEqual(invoiceTotals, {
    subtotal: 1000, discount: 100, tax: 45, cgst: 22.5, sgst: 22.5, total: 945
  });
  assert.deepEqual(invoiceGst, [[5, 45]]);
  assert.deepEqual(checkoutGst, [[5, 45]]);
  assert.equal(checkout.discount, 100);
  assert.equal(checkout.tax, 45);
  assert.equal(checkout.total, 945);
});

test('CURRENT BEHAVIOUR: #1004 invoice honors the SAVE10 cap', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [{ name: 'Tea', price: 280, qty: 8, hsn: '0902', gstRate: 18 }]
  };

  const { invoiceTotals, invoiceGst, checkout, checkoutGst } = calculate(order);

  assert.deepEqual(invoiceTotals, {
    subtotal: 2240, discount: 150, tax: 376.2,
    cgst: 188.1, sgst: 188.1, total: 2466.2
  });
  assert.deepEqual(invoiceGst, [[18, 376.2]]);
  assert.deepEqual(checkoutGst, [[18, 376.2]]);
  assert.equal(checkout.subtotal, 2240);
  assert.equal(checkout.discount, 150);
  assert.equal(checkout.tax, 376.2);
  assert.equal(checkout.total, 2466.2);
});

test('CURRENT BEHAVIOUR: #1008 invoice matches checkout at 18% without a coupon', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      { name: 'Tea', price: 50, qty: 2, hsn: '0902' },
      { name: 'Coffee', price: 250, qty: 1, hsn: '0901', gstRate: 18 }
    ]
  };

  const { invoiceTotals, invoiceGst, checkout, checkoutGst } = calculate(order);

  assert.deepEqual(invoiceTotals, {
    subtotal: 350, discount: 0, tax: 63, cgst: 31.5, sgst: 31.5, total: 413
  });
  assert.deepEqual(invoiceGst, [[18, 18], [18, 45]]);
  assert.deepEqual(checkoutGst, invoiceGst);
  assert.equal(checkout.tax, 63);
  assert.equal(checkout.total, 413);
});


test('invoice matches the billed HSN GST and capped coupon on order #1004', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [{ name: 'Groundnut oil', price: 1120, qty: 2, hsn: '1508' }]
  };
  const { invoiceTotals, invoiceGst, checkout, checkoutGst } = calculate(order);
  const billed = {
    subtotal: 2240, discount: 150, tax: 104.5,
    cgst: 52.25, sgst: 52.25, total: 2194.5
  };

  const { subtotal, discount, tax, cgst, sgst, total } = checkout;
  assert.deepEqual({ subtotal, discount, tax, cgst, sgst, total }, billed);
  assert.deepEqual(invoiceTotals, billed);
  assert.deepEqual(invoiceGst, [[5, 104.5]]);
  assert.deepEqual(invoiceGst, checkoutGst);
  // An order can retain a billed discount after its coupon is deactivated.
  const historicalOrder = {
    ...order,
    coupon: 'DIWALI20',
    subtotal: 2240,
    discount: 250,
    tax: 99.5,
    total: 2089.5
  };
  const { invoiceTotals: historicalTotals, invoiceGst: historicalGst } =
    calculate(historicalOrder);
  assert.deepEqual(historicalTotals, {
    subtotal: 2240, discount: 250, tax: 99.5,
    cgst: 49.75, sgst: 49.75, total: 2089.5
  });
  assert.deepEqual(historicalGst, [[5, 99.5]]);
});
