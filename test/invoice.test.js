const { test } = require('node:test');
const assert = require('node:assert/strict');
const coupons = require('../lib/coupons');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');
const reports = require('../lib/reports');

function totals({ subtotal, discount, tax, cgst, sgst, total }) {
  return { subtotal, discount, tax, cgst, sgst, total };
}

function invoiceLineGst({ rows }) {
  return rows.map(({ gstPercent, lineTax }) => ({ gstPercent, lineTax }));
}

// These fixtures model checkout order lines with an HSN and no gstRate override.
test('CURRENT BEHAVIOUR: #1001 invoice uses 5% and 12% HSN GST slabs', () => {
  const order = {
    coupon: '',
    items: [
      { name: 'Rice', price: 100, qty: 2, hsn: '1006' },
      { name: 'Ghee', price: 150, qty: 2, hsn: '0405' }
    ]
  };

  const printed = invoice.computeInvoiceFigures(order);
  const billed = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(totals(printed), {
    subtotal: 500, discount: 0, tax: 46, cgst: 23, sgst: 23, total: 546
  });
  assert.deepEqual(invoiceLineGst(printed), [
    { gstPercent: 5, lineTax: 10 },
    { gstPercent: 12, lineTax: 36 }
  ]);
  assert.deepEqual(totals(billed), {
    subtotal: 500, discount: 0, tax: 46, cgst: 23, sgst: 23, total: 546
  });
  assert.deepEqual(billed.lines.map(line => line.gstPercent), [5, 12]);
});

test('CURRENT BEHAVIOUR: #1002 invoice applies SAVE10 before GST', () => {
  const order = {
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 200, qty: 3, hsn: '1006' },
      { name: 'Sunflower oil', price: 100, qty: 4, hsn: '1512' }
    ]
  };

  const printed = invoice.computeInvoiceFigures(order);
  const billed = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(totals(printed), {
    subtotal: 1000, discount: 100, tax: 45, cgst: 22.5, sgst: 22.5, total: 945
  });
  assert.deepEqual(invoiceLineGst(printed), [
    { gstPercent: 5, lineTax: 27 },
    { gstPercent: 5, lineTax: 18 }
  ]);
  assert.deepEqual(totals(billed), {
    subtotal: 1000, discount: 100, tax: 45, cgst: 22.5, sgst: 22.5, total: 945
  });
});

test('CURRENT BEHAVIOUR: #1004 invoice applies the SAVE10 cap on a ₹2,240 subtotal', () => {
  const order = {
    coupon: 'SAVE10',
    items: [{ name: 'Groundnut oil', price: 560, qty: 4, hsn: '1508' }]
  };

  const printed = invoice.computeInvoiceFigures(order);
  const billed = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(totals(printed), {
    subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5
  });
  assert.deepEqual(invoiceLineGst(printed), [{ gstPercent: 5, lineTax: 104.5 }]);
  assert.deepEqual(totals(billed), {
    subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5
  });
});

test('CURRENT BEHAVIOUR: #1008 invoice matches checkout for 18% items without a coupon', () => {
  const order = {
    coupon: '',
    items: [
      { name: 'Packaged tea', price: 125, qty: 3, hsn: '0902' },
      { name: 'Syrup', price: 75.5, qty: 2, hsn: '2106' }
    ]
  };

  const printed = invoice.computeInvoiceFigures(order);
  const billed = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(totals(printed), {
    subtotal: 526, discount: 0, tax: 94.68, cgst: 47.34, sgst: 47.34, total: 620.68
  });
  assert.deepEqual(invoiceLineGst(printed), [
    { gstPercent: 18, lineTax: 67.5 },
    { gstPercent: 18, lineTax: 27.18 }
  ]);
  assert.deepEqual(totals(billed), totals(printed));
});

test('invoice matches checkout for mixed GST slabs and a capped coupon', t => {
  const order = {
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 280, qty: 4, hsn: '1006' },
      { name: 'Ghee', price: 560, qty: 2, hsn: '0405' }
    ]
  };

  const billed = pricing.computeTotals(order.items, order.coupon);
  const printed = invoice.computeInvoiceFigures(order);

  assert.deepEqual(totals(billed), {
    subtotal: 2240, discount: 150, tax: 177.65, cgst: 88.83, sgst: 88.82, total: 2267.65
  });
  assert.deepEqual(totals(printed), totals(billed));
  assert.deepEqual(invoiceLineGst(printed), [
    { gstPercent: 5, lineTax: 52.25 },
    { gstPercent: 12, lineTax: 125.4 }
  ]);

  const savedOrder = { ...order, id: 1009, ...totals(billed) };
  t.mock.method(coupons, 'getCoupon', () => null);
  const reprint = invoice.computeInvoiceFigures(savedOrder);

  assert.deepEqual(totals(reprint), totals(billed));
  assert.deepEqual(invoiceLineGst(reprint), invoiceLineGst(printed));
  const currentHtml = invoice.render(savedOrder);
  assert.match(currentHtml, /Coupon Discount \(SAVE10\).*?-₹150\.00/);
  assert.match(currentHtml, />₹177\.65<.*?Invoice Total.*?>₹2267\.65</);
  assert.doesNotMatch(currentHtml, /Accountant Reconciliation Notice/);

  const legacyOrder = {
    id: 1000,
    date: '20/07/2021',
    coupon: 'WELCOME',
    items: [{ name: 'Rice', price: 100.5, qty: 1, hsn: '1006' }],
    subtotal: 100.5,
    discount: 5.03,
    tax: 17.19,
    total: 112.67
  };
  const legacyPrint = invoice.computeInvoiceFigures(legacyOrder);
  assert.deepEqual(totals(legacyPrint), {
    subtotal: 100.5, discount: 5.03, tax: 17.19, cgst: 8.6, sgst: 8.59, total: 112.67
  });
  assert.deepEqual(invoiceLineGst(legacyPrint), [{ gstPercent: 18, lineTax: 17.19 }]);
  const legacyHtml = invoice.render(legacyOrder);
  assert.match(legacyHtml, />18%<.*?>₹17\.19<.*?Invoice Total.*?>₹112\.67</);
  assert.doesNotMatch(legacyHtml, /Accountant Reconciliation Notice/);

  const reconciliation = reports.getGstReconciliation({ orders: [savedOrder, legacyOrder] });
  assert.equal(reconciliation.totalChecked, 2);
  assert.equal(reconciliation.mismatchCount, 0);

  const legacyCutover = { ...legacyOrder, date: '22/07/2021' };
  assert.deepEqual(totals(invoice.computeInvoiceFigures(legacyCutover)), totals(legacyPrint));
  const modernCutover = { ...savedOrder, date: '22/07/2021' };
  assert.deepEqual(totals(invoice.computeInvoiceFigures(modernCutover)), totals(billed));
  assert.equal(reports.getGstReconciliation({ orders: [legacyCutover, modernCutover] }).mismatchCount, 0);

  const wrongLegacyTotal = { ...legacyOrder, total: 120 };
  assert.equal(invoice.computeInvoiceFigures(wrongLegacyTotal).total, 112.67);
  assert.match(invoice.render(wrongLegacyTotal), /Accountant Reconciliation Notice/);
  assert.equal(reports.getGstReconciliation({ orders: [wrongLegacyTotal] }).mismatchCount, 1);

  const incorrectOrder = {
    id: 1010,
    date: '01/08/2021',
    coupon: 'SAVE10',
    items: [{ name: 'Rice', price: 640, qty: 1, hsn: '1006' }],
    subtotal: 640,
    discount: 64,
    tax: 103.68,
    total: 679.68
  };
  assert.deepEqual(invoiceLineGst(invoice.computeInvoiceFigures(incorrectOrder)), [
    { gstPercent: 5, lineTax: 28.8 }
  ]);
  assert.match(invoice.render(incorrectOrder), /Accountant Reconciliation Notice/);
  assert.equal(reports.getGstReconciliation({ orders: [incorrectOrder] }).mismatchCount, 1);

  const missingCoupon = {
    ...incorrectOrder, coupon: ' ', discount: 64, tax: 28.8, total: 604.8
  };
  assert.equal(invoice.computeInvoiceFigures(missingCoupon).discount, 0);
  assert.match(invoice.render(missingCoupon), /Accountant Reconciliation Notice/);
  assert.equal(reports.getGstReconciliation({ orders: [missingCoupon] }).mismatchCount, 1);
});
