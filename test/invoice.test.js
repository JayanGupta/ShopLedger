const test = require('node:test');
const assert = require('node:assert/strict');

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function compareFigures(items, coupon, expectedInvoice, expectedCheckout) {
  const checkout = pricing.computeTotals(items, coupon);
  const figures = invoice.computeInvoiceFigures({
    items,
    coupon,
    subtotal: checkout.subtotal,
    discount: checkout.discount,
    tax: checkout.tax,
    total: checkout.total
  });

  const { rows, ...invoiceTotals } = figures;
  assert.deepEqual(invoiceTotals, expectedInvoice.totals);
  assert.deepEqual(
    rows.map(({ hsn, gstPercent, line, lineTax }) => ({ hsn, gstPercent, line, lineTax })),
    expectedInvoice.rows
  );

  const { subtotal, discount, tax, cgst, sgst, total } = checkout;
  assert.deepEqual({ subtotal, discount, tax, cgst, sgst, total }, expectedCheckout);
}

test('#1001 invoice uses the 5% and 12% checkout GST slabs', () => {
  // Omit gstRate to model a line saved by checkout with only its HSN.
  const items = [
    { name: 'Rice', hsn: '1006', price: 200, qty: 2 },
    { name: 'Ghee', hsn: '0405', price: 200, qty: 1 }
  ];

  compareFigures(items, '', {
    totals: { subtotal: 600, discount: 0, tax: 44, cgst: 22, sgst: 22, total: 644 },
    rows: [
      { hsn: '1006', gstPercent: 5, line: 400, lineTax: 20 },
      { hsn: '0405', gstPercent: 12, line: 200, lineTax: 24 }
    ]
  }, { subtotal: 600, discount: 0, tax: 44, cgst: 22, sgst: 22, total: 644 });
});

test('#1002 invoice applies SAVE10 before GST', () => {
  // Use an explicit rate so the coupon calculation is the only difference.
  const items = [{ name: 'Ghee', hsn: '0405', gstRate: 12, price: 300, qty: 2 }];

  compareFigures(items, 'SAVE10', {
    totals: { subtotal: 600, discount: 60, tax: 64.8, cgst: 32.4, sgst: 32.4, total: 604.8 },
    rows: [{ hsn: '0405', gstPercent: 12, line: 600, lineTax: 64.8 }]
  }, { subtotal: 600, discount: 60, tax: 64.8, cgst: 32.4, sgst: 32.4, total: 604.8 });
});

test('#1004 invoice honors the SAVE10 cap on INR 2,240', () => {
  const items = [{ name: 'Tea', hsn: '0902', price: 280, qty: 8 }];

  compareFigures(items, 'SAVE10', {
    totals: { subtotal: 2240, discount: 150, tax: 376.2, cgst: 188.1, sgst: 188.1, total: 2466.2 },
    rows: [{ hsn: '0902', gstPercent: 18, line: 2240, lineTax: 376.2 }]
  }, { subtotal: 2240, discount: 150, tax: 376.2, cgst: 188.1, sgst: 188.1, total: 2466.2 });
});

test('CURRENT BEHAVIOUR: #1008 invoice matches checkout for 18% lines without a coupon', () => {
  const items = [
    { name: 'Tea', hsn: '0902', price: 150, qty: 2 },
    { name: 'Coffee', hsn: '0901', price: 200, qty: 1 }
  ];

  compareFigures(items, '', {
    totals: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 },
    rows: [
      { hsn: '0902', gstPercent: 18, line: 300, lineTax: 54 },
      { hsn: '0901', gstPercent: 18, line: 200, lineTax: 36 }
    ]
  }, { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 });
});

test('invoice matches checkout for mixed GST slabs with a capped SAVE10 discount', () => {
  const items = [
    { name: 'Rice', hsn: '1006', price: 560, qty: 2 },
    { name: 'Ghee', hsn: '0405', price: 1120, qty: 1 }
  ];

  compareFigures(items, 'SAVE10', {
    totals: { subtotal: 2240, discount: 150, tax: 177.65, cgst: 88.83, sgst: 88.82, total: 2267.65 },
    rows: [
      { hsn: '1006', gstPercent: 5, line: 1120, lineTax: 52.25 },
      { hsn: '0405', gstPercent: 12, line: 1120, lineTax: 125.4 }
    ]
  }, { subtotal: 2240, discount: 150, tax: 177.65, cgst: 88.83, sgst: 88.82, total: 2267.65 });

  const html = invoice.render({ items, coupon: 'SAVE10', total: 2267.65 });
  assert.match(html, /<th class="r">Taxable<\/th>/);
  assert.match(html, /5%<\/td><td class="r">₹52\.25<\/td><td class="r">₹1045\.00<\/td>/);
  assert.match(html, /12%<\/td><td class="r">₹125\.40<\/td><td class="r">₹1045\.00<\/td>/);
});
