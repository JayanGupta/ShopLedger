const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function figures(items, coupon = '') {
  const checkout = pricing.computeTotals(items, coupon);
  const { rows, ...summary } = invoice.computeInvoiceFigures({
    items,
    coupon,
    subtotal: checkout.subtotal,
    discount: checkout.discount,
    tax: checkout.tax,
    total: checkout.total
  });

  return {
    invoice: summary,
    invoiceGst: rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]),
    checkout: {
      subtotal: checkout.subtotal,
      discount: checkout.discount,
      tax: checkout.tax,
      cgst: checkout.cgst,
      sgst: checkout.sgst,
      total: checkout.total
    },
    checkoutGst: checkout.lines.map(({ gstPercent, tax }) => [gstPercent, tax])
  };
}

// Use synthetic line items for the order scenarios. Omit gstRate where
// checkout is meant to resolve HSN and the invoice is meant to fall back.
test('CURRENT BEHAVIOUR: #1001 invoice uses the checkout HSN slabs', () => {
  const items = [
    { price: 200, qty: 2, hsn: '0713' },
    { price: 200, qty: 1, hsn: '0405' }
  ];

  assert.deepStrictEqual(figures(items), {
    invoice: { subtotal: 600, discount: 0, tax: 44, cgst: 22, sgst: 22, total: 644 },
    invoiceGst: [[5, 20], [12, 24]],
    checkout: { subtotal: 600, discount: 0, tax: 44, cgst: 22, sgst: 22, total: 644 },
    checkoutGst: [[5, 20], [12, 24]]
  });
});

test('CURRENT BEHAVIOUR: #1002 invoice applies SAVE10 before GST', () => {
  const items = [
    { price: 640, qty: 1, hsn: '1006' },
    { price: 190, qty: 2, hsn: '1512' }
  ];

  assert.deepStrictEqual(figures(items, 'SAVE10'), {
    invoice: { subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90 },
    invoiceGst: [[5, 28.80], [5, 17.10]],
    checkout: { subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90 },
    checkoutGst: [[5, 28.80], [5, 17.10]]
  });
});

test('CURRENT BEHAVIOUR: #1004 invoice applies the SAVE10 cap', () => {
  const items = [
    { price: 560, qty: 2, hsn: '1006' },
    { price: 1120, qty: 1, hsn: '0405' }
  ];

  assert.deepStrictEqual(figures(items, 'SAVE10'), {
    invoice: { subtotal: 2240, discount: 150, tax: 177.65, cgst: 88.83, sgst: 88.82, total: 2267.65 },
    invoiceGst: [[5, 52.25], [12, 125.40]],
    checkout: { subtotal: 2240, discount: 150, tax: 177.65, cgst: 88.83, sgst: 88.82, total: 2267.65 },
    checkoutGst: [[5, 52.25], [12, 125.40]]
  });
});

test('CURRENT BEHAVIOUR: #1008 invoice matches checkout at 18% without a coupon', () => {
  const items = [
    { price: 300, qty: 2, hsn: '0902' },
    { price: 400, qty: 1, hsn: '0901', gstRate: 18 }
  ];
  const expectedSummary = {
    subtotal: 1000, discount: 0, tax: 180, cgst: 90, sgst: 90, total: 1180
  };
  const expectedGst = [[18, 108], [18, 72]];

  assert.deepStrictEqual(figures(items), {
    invoice: expectedSummary,
    invoiceGst: expectedGst,
    checkout: expectedSummary,
    checkoutGst: expectedGst
  });
});

test('printable invoice shows checkout GST slabs, capped coupon, and billed total', () => {
  const items = [
    { price: 560, qty: 2, hsn: '1006' },
    { price: 1120, qty: 1, hsn: '0405' }
  ];
  const coupon = 'SAVE10';
  const { subtotal, discount, tax, total } = pricing.computeTotals(items, coupon);
  const html = invoice.render({ id: 1004, items, coupon, subtotal, discount, tax, total });
  const rupee = '\u20b9';

  assert.ok(html.includes('<td class="r">5%</td><td class="r">' + rupee + '52.25</td>'));
  assert.ok(html.includes('<td class="r">12%</td><td class="r">' + rupee + '125.40</td>'));
  assert.ok(html.includes('Gross Subtotal</td><td class="r">' + rupee + '2240.00</td>'));
  assert.ok(html.includes('(Total GST)</td><td class="r">' + rupee + '177.65</td>'));
  assert.ok(html.includes('>-' + rupee + '150.00</td>'));
  assert.ok(html.includes('Invoice Total</td><td class="r">' + rupee + '2267.65</td>'));
  assert.ok(!html.includes('Accountant Reconciliation Notice'));

  const reprint = invoice.render({ id: 1004, items, coupon, subtotal, discount, tax: 180, total: 2270 });
  assert.ok(reprint.includes('(Total GST)</td><td class="r">' + rupee + '180.00</td>'));
  assert.ok(reprint.includes('Invoice Total</td><td class="r">' + rupee + '2270.00</td>'));
  assert.ok(reprint.includes('Accountant Reconciliation Notice'));
});
