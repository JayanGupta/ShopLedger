const assert = require('node:assert/strict');
const test = require('node:test');
const config = require('../config');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

test('CURRENT BEHAVIOUR: #1001-style invoice shows the 5% and 12% HSN slabs', () => {
  const items = [
    { id: 1, sku: 'RICE', name: 'Rice', price: 150, qty: 2, hsn: '1006' },
    { id: 2, sku: 'GHEE', name: 'Ghee', price: 310, qty: 1, hsn: '0405' }
  ];
  const coupon = '';

  const { rows, ...figures } = invoice.computeInvoiceFigures({ items, coupon });
  const checkout = pricing.computeTotals(items, coupon);

  assert.deepEqual(figures, {
    subtotal: 610, discount: 0, tax: 52.20, cgst: 26.10, sgst: 26.10, total: 662.20
  });
  assert.deepEqual(rows.map(({ hsn, gstPercent, line, lineTax }) => ({
    hsn, gstPercent, line, lineTax
  })), [
    { hsn: '1006', gstPercent: 5, line: 300, lineTax: 15 },
    { hsn: '0405', gstPercent: 12, line: 310, lineTax: 37.20 }
  ]);
  assert.deepEqual(checkout.lines.map(({ gstPercent, tax }) => ({ gstPercent, tax })), [
    { gstPercent: 5, tax: 15 },
    { gstPercent: 12, tax: 37.20 }
  ]);
  assert.equal(checkout.tax, 52.20);
  assert.equal(checkout.total, 662.20);
});

test('CURRENT BEHAVIOUR: #1002-style invoice applies SAVE10 before GST', () => {
  const items = [
    { id: 1, sku: 'RICE', name: 'Rice', price: 640, qty: 1, hsn: '1006' },
    { id: 3, sku: 'SUNFLOWER', name: 'Sunflower oil', price: 190, qty: 2, hsn: '1512' }
  ];
  const coupon = 'SAVE10';

  const { rows, ...figures } = invoice.computeInvoiceFigures({ items, coupon });
  const checkout = pricing.computeTotals(items, coupon);

  assert.deepEqual(figures, {
    subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90
  });
  assert.deepEqual(rows.map(({ gstPercent, lineTax }) => ({ gstPercent, lineTax })), [
    { gstPercent: 5, lineTax: 28.80 },
    { gstPercent: 5, lineTax: 17.10 }
  ]);
  assert.equal(checkout.discount, 102);
  assert.equal(checkout.tax, 45.90);
  assert.equal(checkout.total, 963.90);
});

test('CURRENT BEHAVIOUR: #1004-style invoice applies the ₹150 SAVE10 cap on ₹2,240', () => {
  const items = [
    { id: 4, sku: 'GROUNDNUT', name: 'Groundnut oil', price: 280, qty: 8, hsn: '1508' }
  ];
  const coupon = 'SAVE10';

  const { rows, ...figures } = invoice.computeInvoiceFigures({ items, coupon });
  const checkout = pricing.computeTotals(items, coupon);

  assert.deepEqual(figures, {
    subtotal: 2240, discount: 150, tax: 104.50, cgst: 52.25, sgst: 52.25, total: 2194.50
  });
  assert.deepEqual(rows.map(({ gstPercent, lineTax }) => ({ gstPercent, lineTax })), [
    { gstPercent: 5, lineTax: 104.50 }
  ]);
  assert.equal(checkout.discount, 150);
  assert.equal(checkout.tax, 104.50);
  assert.equal(checkout.total, 2194.50);
});

test('CURRENT BEHAVIOUR: #1008-style invoice matches checkout for 18% items without a coupon', () => {
  const items = [
    { id: 5, sku: 'TEA', name: 'Tea', price: 150, qty: 2, hsn: '0902' },
    { id: 6, sku: 'SYRUP', name: 'Syrup', price: 200, qty: 1, hsn: '2106', gstRate: 18 }
  ];
  const coupon = '';

  const { rows, ...figures } = invoice.computeInvoiceFigures({ items, coupon });
  const { lines, taxable, ...checkoutFigures } = pricing.computeTotals(items, coupon);

  assert.deepEqual(figures, {
    subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590
  });
  assert.deepEqual(rows.map(({ gstPercent, lineTax }) => ({ gstPercent, lineTax })), [
    { gstPercent: 18, lineTax: 54 },
    { gstPercent: 18, lineTax: 36 }
  ]);
  assert.deepEqual(checkoutFigures, figures);
  assert.equal(taxable, 500);
  assert.deepEqual(lines.map(({ tax }) => tax), [54, 36]);
});

test('invoice matches the billed total and line GST for a capped coupon on mixed HSN slabs', () => {
  const items = [
    { id: 1, sku: 'RICE', name: 'Rice', price: 500, qty: 2, hsn: '1006' },
    { id: 2, sku: 'GHEE', name: 'Ghee', price: 620, qty: 2, hsn: '0405' }
  ];
  const coupon = 'SAVE10';
  const checkout = pricing.computeTotals(items, coupon);
  const order = {
    id: 1,
    items,
    coupon,
    subtotal: checkout.subtotal,
    discount: checkout.discount,
    tax: checkout.tax,
    total: checkout.total
  };

  const { rows, ...figures } = invoice.computeInvoiceFigures(order);

  assert.deepEqual(figures, {
    subtotal: 2240, discount: 150, tax: 185.49, cgst: 92.75, sgst: 92.74, total: 2275.49
  });
  assert.equal(figures.total, order.total);
  assert.equal(figures.tax, order.tax);
  assert.deepEqual(rows.map(({ gstPercent, lineTax }) => ({ gstPercent, lineTax })), [
    { gstPercent: 5, lineTax: 46.65 },
    { gstPercent: 12, lineTax: 138.84 }
  ]);
  const mismatchedTotal = invoice.render({ ...order, total: 2276.49 });
  assert.match(mismatchedTotal, /Invoice Total<\/td><td class="r">₹2276\.49/);
  assert.match(mismatchedTotal, /Accountant Reconciliation Notice:.*Recalculated total/);

  const active = config.coupons[coupon].active;
  const riceRate = config.tax.hsnSlabs['1006'];
  try {
    config.coupons[coupon].active = false;
    assert.deepEqual(invoice.computeInvoiceFigures(order), { ...figures, rows });

    config.tax.hsnSlabs['1006'] = 12;
    const reprint = invoice.render(order);
    assert.match(reprint, /Total GST\)<\/td><td class="r">₹185\.49/);
    assert.match(reprint, /Invoice Total<\/td><td class="r">₹2275\.49/);
    assert.match(reprint, /Accountant Reconciliation Notice/);
  } finally {
    config.coupons[coupon].active = active;
    config.tax.hsnSlabs['1006'] = riceRate;
  }
});
