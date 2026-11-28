const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function verifyFigures(order, expectedInvoice, expectedCheckout) {
  const printed = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual({
    subtotal: printed.subtotal,
    discount: printed.discount,
    tax: printed.tax,
    cgst: printed.cgst,
    sgst: printed.sgst,
    total: printed.total,
    lines: printed.rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax])
  }, expectedInvoice);

  assert.deepEqual({
    subtotal: checkout.subtotal,
    discount: checkout.discount,
    tax: checkout.tax,
    cgst: checkout.cgst,
    sgst: checkout.sgst,
    total: checkout.total,
    lines: checkout.lines.map(({ gstPercent, tax }) => [gstPercent, tax])
  }, expectedCheckout);
}

test('#1001-style invoice uses the 5% and 12% HSN rates from checkout', () => {
  verifyFigures({
    coupon: '',
    items: [
      { name: 'Rice', price: 100, qty: 2, hsn: '1006', gstRate: undefined },
      { name: 'Ghee', price: 300, qty: 1, hsn: '0405', gstRate: undefined }
    ]
  }, {
    subtotal: 500, discount: 0, tax: 46, cgst: 23, sgst: 23, total: 546,
    lines: [[5, 10], [12, 36]]
  }, {
    subtotal: 500, discount: 0, tax: 46, cgst: 23, sgst: 23, total: 546,
    lines: [[5, 10], [12, 36]]
  });
});

test('#1002-style invoice applies SAVE10 before GST', () => {
  verifyFigures({
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 640, qty: 1, hsn: '1006', gstRate: undefined }
    ]
  }, {
    subtotal: 640, discount: 64, tax: 28.8, cgst: 14.4, sgst: 14.4, total: 604.8,
    lines: [[5, 28.8]]
  }, {
    subtotal: 640, discount: 64, tax: 28.8, cgst: 14.4, sgst: 14.4, total: 604.8,
    lines: [[5, 28.8]]
  });
});

test('#1004-style invoice honors the ₹150 SAVE10 cap on a ₹2,240 subtotal', () => {
  verifyFigures({
    coupon: 'SAVE10',
    items: [
      { name: 'Tea', price: 560, qty: 4, hsn: '0902', gstRate: undefined }
    ]
  }, {
    subtotal: 2240, discount: 150, tax: 376.2, cgst: 188.1, sgst: 188.1, total: 2466.2,
    lines: [[18, 376.2]]
  }, {
    subtotal: 2240, discount: 150, tax: 376.2, cgst: 188.1, sgst: 188.1, total: 2466.2,
    lines: [[18, 376.2]]
  });
});

test('CURRENT BEHAVIOUR: #1008-style invoice matches checkout for all-18% lines without a coupon', () => {
  const expected = {
    subtotal: 480, discount: 0, tax: 86.4, cgst: 43.2, sgst: 43.2, total: 566.4,
    lines: [[18, 50.4], [18, 36]]
  };

  verifyFigures({
    coupon: '',
    items: [
      { name: 'Tea', price: 140, qty: 2, hsn: '0902', gstRate: undefined },
      { name: 'Coffee', price: 200, qty: 1, hsn: '0901', gstRate: 18 }
    ]
  }, expected, expected);
});

test('invoice matches checkout for mixed HSN slabs with a capped SAVE10 discount', () => {
  const order = {
    id: 1010,
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 560, qty: 2, hsn: '1006' },
      { name: 'Ghee', price: 1120, qty: 1, hsn: '0405' }
    ]
  };
  const expected = {
    subtotal: 2240, discount: 150, tax: 177.65, cgst: 88.83, sgst: 88.82, total: 2267.65,
    lines: [[5, 52.25], [12, 125.4]]
  };

  verifyFigures(order, expected, expected);
  const html = invoice.render({ ...order, total: expected.total });
  assert.match(html, /GST \(Total GST\)<\/td><td class="r">₹177\.65/);
  assert.match(html, /Invoice Total<\/td><td class="r">₹2267\.65/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
});
