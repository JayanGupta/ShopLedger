const { test } = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(price, qty, hsn, gstRate) {
  return { price, qty, hsn, gstRate };
}

function assertFigures(order, expectedInvoice, expectedCheckout) {
  const checkout = pricing.computeTotals(order.items, order.coupon);
  const billedOrder = {
    ...order,
    subtotal: checkout.subtotal,
    discount: checkout.discount,
    tax: checkout.tax,
    total: checkout.total
  };
  const { rows, ...invoiceTotals } = invoice.computeInvoiceFigures(billedOrder);
  const { lineGst: expectedInvoiceLineGst, ...expectedInvoiceTotals } = expectedInvoice;

  assert.deepStrictEqual(invoiceTotals, expectedInvoiceTotals);
  assert.deepStrictEqual(rows.map(row => [row.gstPercent, row.lineTax]), expectedInvoiceLineGst);
  assert.deepStrictEqual({
    discount: checkout.discount,
    tax: checkout.tax,
    total: checkout.total,
    lineGst: checkout.lines.map(line => [line.gstPercent, line.tax])
  }, expectedCheckout);
}

test('CURRENT BEHAVIOUR: #1001 invoice uses the 5% and 12% HSN slabs', () => {
  assertFigures({
    id: 1001,
    items: [item(150, 2, '1006'), item(310, 1, '0405')],
    coupon: ''
  }, {
    subtotal: 610,
    discount: 0,
    tax: 52.2,
    cgst: 26.1,
    sgst: 26.1,
    total: 662.2,
    lineGst: [[5, 15], [12, 37.2]]
  }, {
    discount: 0,
    tax: 52.2,
    total: 662.2,
    lineGst: [[5, 15], [12, 37.2]]
  });
});

test('CURRENT BEHAVIOUR: #1002 invoice applies SAVE10 before GST', () => {
  assertFigures({
    id: 1002,
    items: [item(300, 2, '1006'), item(420, 1, '1512')],
    coupon: 'SAVE10'
  }, {
    subtotal: 1020,
    discount: 102,
    tax: 45.9,
    cgst: 22.95,
    sgst: 22.95,
    total: 963.9,
    lineGst: [[5, 27], [5, 18.9]]
  }, {
    discount: 102,
    tax: 45.9,
    total: 963.9,
    lineGst: [[5, 27], [5, 18.9]]
  });
});

test('CURRENT BEHAVIOUR: #1004 invoice honors the SAVE10 cap', () => {
  assertFigures({
    id: 1004,
    items: [item(1120, 2, '1508')],
    coupon: 'SAVE10'
  }, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    lineGst: [[5, 104.5]]
  }, {
    discount: 150,
    tax: 104.5,
    total: 2194.5,
    lineGst: [[5, 104.5]]
  });
});

test('CURRENT BEHAVIOUR: #1008 invoice matches checkout at 18% without a coupon', () => {
  assertFigures({
    id: 1008,
    items: [item(150, 2, '0902', 18), item(200, 1, '2106')],
    coupon: ''
  }, {
    subtotal: 500,
    discount: 0,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 590,
    lineGst: [[18, 54], [18, 36]]
  }, {
    discount: 0,
    tax: 90,
    total: 590,
    lineGst: [[18, 54], [18, 36]]
  });
});

test('invoice matches checkout for mixed GST slabs and a capped pre-tax coupon', () => {
  const expected = {
    discount: 150,
    tax: 172.42,
    total: 2262.42,
    lineGst: [[5, 55.98], [12, 116.44]]
  };

  assertFigures({
    items: [item(1200, 1, '1006'), item(1040, 1, '0405')],
    coupon: 'SAVE10'
  }, {
    ...expected,
    subtotal: 2240,
    cgst: 86.21,
    sgst: 86.21
  }, expected);
});
