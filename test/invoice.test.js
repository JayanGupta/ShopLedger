const test = require('node:test');
const assert = require('node:assert/strict');
const config = require('../config');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// These in-memory fixtures leave gstRate unset on HSN-only lines.
test('CURRENT BEHAVIOUR: #1001 invoice uses 5% and 12% HSN slabs', () => {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      { name: 'Rice', hsn: '1006', price: 200, qty: 2 },
      { name: 'Ghee', hsn: '0405', price: 300, qty: 1 },
    ],
  };

  const { rows, ...invoiceTotals } = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(invoiceTotals, {
    subtotal: 700,
    discount: 0,
    tax: 56,
    cgst: 28,
    sgst: 28,
    total: 756,
  });
  assert.deepEqual(rows.map(({ gstPercent, lineTax }) => ({ gstPercent, lineTax })), [
    { gstPercent: 5, lineTax: 20 },
    { gstPercent: 12, lineTax: 36 },
  ]);
  assert.deepEqual(checkout.lines.map(({ gstPercent }) => gstPercent), [5, 12]);
  assert.equal(checkout.tax, 56);
  assert.equal(checkout.total, 756);
});

test('CURRENT BEHAVIOUR: #1002 invoice applies SAVE10 before GST', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', hsn: '1006', price: 640, qty: 1 },
      { name: 'Sunflower oil', hsn: '1512', price: 190, qty: 2 },
    ],
  };

  const { rows, ...invoiceTotals } = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(invoiceTotals, {
    subtotal: 1020,
    discount: 102,
    tax: 45.9,
    cgst: 22.95,
    sgst: 22.95,
    total: 963.9,
  });
  assert.deepEqual(rows.map(({ gstPercent, lineTax }) => ({ gstPercent, lineTax })), [
    { gstPercent: 5, lineTax: 28.8 },
    { gstPercent: 5, lineTax: 17.1 },
  ]);
  assert.equal(checkout.discount, 102);
  assert.equal(checkout.tax, 45.9);
  assert.equal(checkout.total, 963.9);
});

test('CURRENT BEHAVIOUR: #1004 invoice honours the SAVE10 cap', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [{ name: 'Groundnut oil', hsn: '1508', price: 560, qty: 4 }],
  };

  const { rows, ...invoiceTotals } = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(invoiceTotals, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
  });
  assert.deepEqual(rows.map(({ gstPercent, lineTax }) => ({ gstPercent, lineTax })), [
    { gstPercent: 5, lineTax: 104.5 },
  ]);
  assert.equal(checkout.subtotal, 2240);
  assert.equal(checkout.discount, 150);
  assert.equal(checkout.tax, 104.5);
  assert.equal(checkout.total, 2194.5);
});

test('CURRENT BEHAVIOUR: #1008 invoice matches checkout for 18% items without a coupon', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      { name: 'Tea', hsn: '0902', price: 50.5, qty: 1, gstRate: 18 },
      { name: 'Syrup', hsn: '2106', price: 75, qty: 2 },
    ],
  };

  const { rows, ...invoiceTotals } = invoice.computeInvoiceFigures(order);
  const { subtotal, discount, tax, cgst, sgst, total } = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(invoiceTotals, {
    subtotal: 200.5,
    discount: 0,
    tax: 36.09,
    cgst: 18.05,
    sgst: 18.04,
    total: 236.59,
  });
  assert.deepEqual(rows.map(({ gstPercent, lineTax }) => ({ gstPercent, lineTax })), [
    { gstPercent: 18, lineTax: 9.09 },
    { gstPercent: 18, lineTax: 27 },
  ]);
  assert.deepEqual(invoiceTotals, { subtotal, discount, tax, cgst, sgst, total });
});

test('invoice matches checkout and preserves billed amounts when pricing rules change', (t) => {
  const items = [
    { name: 'Rice', hsn: '1006', price: 500, qty: 2 },
    { name: 'Ghee', hsn: '0405', price: 620, qty: 2 },
  ];
  const coupon = 'SAVE10';
  const { subtotal, discount, tax, cgst, sgst, total } = pricing.computeTotals(items, coupon);
  const order = { id: 1042, items, coupon, subtotal, discount, tax, total };

  const { rows, ...invoiceTotals } = invoice.computeInvoiceFigures(order);

  assert.deepEqual(invoiceTotals, { subtotal, discount, tax, cgst, sgst, total });
  assert.equal(invoiceTotals.discount, 150);
  assert.deepEqual(rows.map(({ gstPercent, lineTax }) => ({ gstPercent, lineTax })), [
    { gstPercent: 5, lineTax: 46.65 },
    { gstPercent: 12, lineTax: 138.84 },
  ]);
  const html = invoice.render(order);
  assert.match(html, /<td class="r">5%<\/td><td class="r">₹46\.65<\/td>/);
  assert.match(html, /<td class="r">12%<\/td><td class="r">₹138\.84<\/td>/);
  assert.match(html, /<td>Invoice Total<\/td><td class="r">₹2275\.49<\/td>/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);

  const flatCoupon = 'FLAT50';
  const flatTotals = pricing.computeTotals(items, flatCoupon);
  const flatOrder = {
    id: 1043,
    items,
    coupon: flatCoupon,
    subtotal: flatTotals.subtotal,
    discount: flatTotals.discount,
    tax: flatTotals.tax,
    total: flatTotals.total,
  };
  const flatFigures = invoice.computeInvoiceFigures(flatOrder);
  const flatHtml = invoice.render(flatOrder);
  assert.equal(flatFigures.discount, 50);
  assert.equal(flatFigures.total, flatTotals.total);

  const flatCouponConfig = config.coupons[flatCoupon];
  const wasActive = flatCouponConfig.active;
  t.after(() => { flatCouponConfig.active = wasActive; });
  flatCouponConfig.active = false;

  assert.deepEqual(invoice.computeInvoiceFigures(flatOrder), flatFigures);
  assert.equal(invoice.render(flatOrder), flatHtml);

  const unlistedHsn = '9999';
  assert.equal(Object.hasOwn(config.tax.hsnSlabs, unlistedHsn), false);
  const historicalItems = [{ name: 'Unlisted product', hsn: unlistedHsn, price: 500, qty: 1 }];
  const historicalTotals = pricing.computeTotals(historicalItems, '');
  const historicalOrder = {
    id: 1044,
    items: historicalItems,
    coupon: '',
    subtotal: historicalTotals.subtotal,
    discount: historicalTotals.discount,
    tax: historicalTotals.tax,
    total: historicalTotals.total,
  };

  t.after(() => { delete config.tax.hsnSlabs[unlistedHsn]; });
  config.tax.hsnSlabs[unlistedHsn] = 5;

  const historicalHtml = invoice.render(historicalOrder);
  assert.match(historicalHtml, /<td>CGST \+ SGST \(Total GST\)<\/td><td class="r">₹90\.00<\/td>/);
  assert.match(historicalHtml, /<td>Invoice Total<\/td><td class="r">₹590\.00<\/td>/);
  assert.match(historicalHtml, /Line GST breakdown is unavailable/);
  assert.doesNotMatch(historicalHtml, /<td class="r">5%<\/td>/);
});
