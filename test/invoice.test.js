const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

test('invoice matches checkout for mixed GST slabs and a capped coupon', () => {
  const items = [
    { name: 'Rice', price: 112, qty: 10, hsn: '1006' },
    { name: 'Ghee', price: 560, qty: 2, hsn: '0405' }
  ];
  const coupon = 'SAVE10';
  const checkout = pricing.computeTotals(items, coupon);
  const { rows, ...figures } = invoice.computeInvoiceFigures({ items, coupon });

  assert.deepEqual(figures, {
    subtotal: checkout.subtotal,
    discount: 150,
    tax: checkout.tax,
    cgst: checkout.cgst,
    sgst: checkout.sgst,
    total: checkout.total
  });
  assert.deepEqual(rows.map(row => [row.gstPercent, row.lineTax]), [
    [5, 52.25],
    [12, 125.40]
  ]);
});

function assertFigures(order, expectedInvoice, expectedCheckout) {
  const { subtotal, discount, tax, cgst, sgst, total, rows } =
    invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual({
    subtotal, discount, tax, cgst, sgst, total,
    rates: rows.map(row => row.gstPercent),
    lineTaxes: rows.map(row => row.lineTax)
  }, expectedInvoice);
  assert.deepEqual({
    discount: checkout.discount,
    tax: checkout.tax,
    total: checkout.total,
    rates: checkout.lines.map(line => line.gstPercent)
  }, expectedCheckout);
}

// These synthetic fixtures model the supplied order scenarios in memory.
test('CURRENT BEHAVIOUR: #1001 invoices the 5% and 12% HSN slabs', () => {
  assertFigures({
    id: 1001,
    coupon: '',
    items: [
      { name: 'Rice', price: 100, qty: 2, hsn: '1006', gstRate: undefined },
      { name: 'Ghee', price: 300, qty: 1, hsn: '0405', gstRate: undefined }
    ]
  }, {
    subtotal: 500, discount: 0, tax: 46, cgst: 23, sgst: 23, total: 546,
    rates: [5, 12], lineTaxes: [10, 36]
  }, {
    discount: 0, tax: 46, total: 546, rates: [5, 12]
  });
});

test('CURRENT BEHAVIOUR: #1002 invoices SAVE10 before GST', () => {
  assertFigures({
    id: 1002,
    coupon: 'SAVE10',
    items: [{ name: 'Tea', price: 250, qty: 2, hsn: '0902', gstRate: 18 }]
  }, {
    subtotal: 500, discount: 50, tax: 81, cgst: 40.50, sgst: 40.50, total: 531,
    rates: [18], lineTaxes: [81]
  }, {
    discount: 50, tax: 81, total: 531, rates: [18]
  });
});

test('CURRENT BEHAVIOUR: #1004 invoice applies the SAVE10 cap', () => {
  assertFigures({
    id: 1004,
    coupon: 'SAVE10',
    items: [{ name: 'Tea', price: 224, qty: 10, hsn: '0902', gstRate: 18 }]
  }, {
    subtotal: 2240, discount: 150, tax: 376.20, cgst: 188.10, sgst: 188.10,
    total: 2466.20, rates: [18], lineTaxes: [376.20]
  }, {
    discount: 150, tax: 376.20, total: 2466.20, rates: [18]
  });
});

test('CURRENT BEHAVIOUR: #1008 agrees with checkout at 18% without a coupon', () => {
  assertFigures({
    id: 1008,
    coupon: '',
    items: [
      { name: 'Tea', price: 100, qty: 2, hsn: '0902', gstRate: undefined },
      { name: 'Coffee', price: 100, qty: 1, hsn: '0901', gstRate: 18 }
    ]
  }, {
    subtotal: 300, discount: 0, tax: 54, cgst: 27, sgst: 27, total: 354,
    rates: [18, 18], lineTaxes: [36, 18]
  }, {
    discount: 0, tax: 54, total: 354, rates: [18, 18]
  });
});
