const { test } = require('node:test');
const { strict: assert } = require('node:assert');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');
const config = require('../config');

function gstBreakdown(rows) {
  return rows.map(({ hsn, gstPercent, lineTax }) => ({ hsn, gstPercent, lineTax }));
}

test('CURRENT BEHAVIOUR: #1001 invoice uses the 5% and 12% HSN slabs', () => {
  const order = {
    items: [
      { name: 'Dal', price: 150, qty: 2, hsn: '0713', gstRate: undefined },
      { name: 'Ghee', price: 310, qty: 1, hsn: '0405', gstRate: undefined }
    ],
    coupon: ''
  };

  const { rows, ...figures } = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(figures, {
    subtotal: 610,
    discount: 0,
    tax: 52.2,
    cgst: 26.1,
    sgst: 26.1,
    total: 662.2
  });
  assert.deepEqual(gstBreakdown(rows), [
    { hsn: '0713', gstPercent: 5, lineTax: 15 },
    { hsn: '0405', gstPercent: 12, lineTax: 37.2 }
  ]);
  assert.deepEqual(checkout.lines.map((line) => line.gstPercent), [5, 12]);
  assert.equal(checkout.tax, 52.2);
  assert.equal(checkout.total, 662.2);
});

test('CURRENT BEHAVIOUR: #1002 invoice applies SAVE10 before GST', () => {
  const order = {
    items: [
      { name: 'Rice', price: 60, qty: 10, hsn: '1006', gstRate: undefined },
      { name: 'Sunflower oil', price: 140, qty: 3, hsn: '1512', gstRate: undefined }
    ],
    coupon: 'SAVE10'
  };

  const { rows, ...figures } = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(figures, {
    subtotal: 1020,
    discount: 102,
    tax: 45.9,
    cgst: 22.95,
    sgst: 22.95,
    total: 963.9
  });
  assert.deepEqual(gstBreakdown(rows), [
    { hsn: '1006', gstPercent: 5, lineTax: 27 },
    { hsn: '1512', gstPercent: 5, lineTax: 18.9 }
  ]);
  assert.equal(checkout.discount, 102);
  assert.equal(checkout.tax, 45.9);
  assert.equal(checkout.total, 963.9);
});

test('CURRENT BEHAVIOUR: #1004 invoice honors the SAVE10 cap', () => {
  const order = {
    items: [
      { name: 'Groundnut oil', price: 160, qty: 14, hsn: '1508', gstRate: undefined }
    ],
    coupon: 'SAVE10'
  };

  const { rows, ...figures } = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(figures, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5
  });
  assert.deepEqual(gstBreakdown(rows), [
    { hsn: '1508', gstPercent: 5, lineTax: 104.5 }
  ]);
  assert.equal(checkout.discount, 150);
  assert.equal(checkout.tax, 104.5);
  assert.equal(checkout.total, 2194.5);
});

test('CURRENT BEHAVIOUR: #1008 invoice matches checkout for 18% items without a coupon', () => {
  const order = {
    items: [
      { name: 'Tea', price: 150, qty: 2, hsn: '0902', gstRate: 18 },
      { name: 'Syrup', price: 100, qty: 2, hsn: '2106', gstRate: undefined }
    ],
    coupon: ''
  };

  const { rows, ...figures } = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(figures, {
    subtotal: 500,
    discount: 0,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 590
  });
  assert.deepEqual(gstBreakdown(rows), [
    { hsn: '0902', gstPercent: 18, lineTax: 54 },
    { hsn: '2106', gstPercent: 18, lineTax: 36 }
  ]);
  const { taxable, lines, ...checkoutFigures } = checkout;
  assert.deepEqual(figures, checkoutFigures);
});

test('invoice matches checkout for mixed HSN slabs with a capped discount', () => {
  const items = [
    { name: 'Dal', price: 140, qty: 10, hsn: '0713' },
    { name: 'Ghee', price: 420, qty: 2, hsn: '0405' }
  ];
  const coupon = 'SAVE10';
  const { taxable, lines, ...billedFigures } = pricing.computeTotals(items, coupon);
  const order = { id: 2001, items, coupon, ...billedFigures };
  const { rows, ...figures } = invoice.computeInvoiceFigures(order);

  assert.deepEqual(figures, billedFigures);
  assert.deepEqual(gstBreakdown(rows), lines.map(({ hsn, gstPercent, tax }) => ({
    hsn,
    gstPercent,
    lineTax: tax
  })));

  const html = invoice.render(order);
  assert.match(html, /Coupon Discount \(SAVE10\)<\/td><td[^>]*>-₹150\.00<\/td>/);
  assert.match(html, /Total GST\)<\/td><td[^>]*>₹159\.36<\/td>/);
  assert.match(html, /Invoice Total<\/td><td[^>]*>₹2249\.36<\/td>/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);

  const couponConfig = config.coupons[coupon];
  const wasActive = couponConfig.active;
  couponConfig.active = false;
  try {
    assert.deepEqual(invoice.computeInvoiceFigures(order), { ...figures, rows });
    assert.equal(invoice.render(order), html);
  } finally {
    couponConfig.active = wasActive;
  }

  const originalSlab = config.tax.hsnSlabs['0713'];
  config.tax.hsnSlabs['0713'] = 18;
  try {
    const reprint = invoice.render(order);
    const totalsTable = /<table class="totals-table">.*?<\/table>/;
    assert.equal(reprint.match(totalsTable)[0], html.match(totalsTable)[0]);
    assert.match(reprint, /Per-line GST rates and amounts are unavailable/);
    const itemRows = reprint.match(/<tbody>(.*?)<\/tbody>/)[1].match(/<tr>.*?<\/tr>/g);
    assert.equal(itemRows.length, items.length);
    for (const row of itemRows) {
      assert.match(row, /<td class="r">&mdash;<\/td><td class="r">&mdash;<\/td><td class="r"><strong>/);
    }

    const savedSubtotalReprint = invoice.render({ ...order, subtotal: 2300, total: 2309.36 });
    assert.match(savedSubtotalReprint, /Gross Subtotal<\/td><td[^>]*>₹2300\.00<\/td>/);
  } finally {
    config.tax.hsnSlabs['0713'] = originalSlab;
  }
});
