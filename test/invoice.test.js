const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function summary({ subtotal, discount, tax, cgst, sgst, total }) {
  return { subtotal, discount, tax, cgst, sgst, total };
}

function invoiceLines(figures) {
  return figures.rows.map(({ hsn, gstPercent, line, lineTax }) => ({
    hsn, gstPercent, line, lineTax
  }));
}

// Orders without an explicit gstRate let checkout resolve the rate from HSN.
test('CURRENT BEHAVIOUR: #1001 invoice uses the 5% and 12% HSN slabs', () => {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      { name: 'Pulses', hsn: '0713', price: 165, qty: 2 },
      { name: 'Ghee', hsn: '0405', price: 140, qty: 2 }
    ]
  };

  const printed = invoice.computeInvoiceFigures(order);
  const billed = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(summary(printed), {
    subtotal: 610, discount: 0, tax: 50.10, cgst: 25.05, sgst: 25.05, total: 660.10
  });
  assert.deepEqual(invoiceLines(printed), [
    { hsn: '0713', gstPercent: 5, line: 330, lineTax: 16.50 },
    { hsn: '0405', gstPercent: 12, line: 280, lineTax: 33.60 }
  ]);
  assert.deepEqual(summary(billed), {
    subtotal: 610, discount: 0, tax: 50.10, cgst: 25.05, sgst: 25.05, total: 660.10
  });
  assert.deepEqual(billed.lines.map(({ gstPercent }) => gstPercent), [5, 12]);
});

test('CURRENT BEHAVIOUR: #1002 invoice applies SAVE10 before GST', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', hsn: '1006', price: 640, qty: 1 },
      { name: 'Sunflower oil', hsn: '1512', price: 190, qty: 2 }
    ]
  };

  const printed = invoice.computeInvoiceFigures(order);
  const billed = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(summary(printed), {
    subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90
  });
  assert.deepEqual(invoiceLines(printed), [
    { hsn: '1006', gstPercent: 5, line: 640, lineTax: 28.80 },
    { hsn: '1512', gstPercent: 5, line: 380, lineTax: 17.10 }
  ]);
  assert.deepEqual(summary(billed), {
    subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90
  });
});

test('CURRENT BEHAVIOUR: #1004 invoice honors the SAVE10 cap', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { name: 'Groundnut oil', hsn: '1508', price: 1120, qty: 2 }
    ]
  };

  const printed = invoice.computeInvoiceFigures(order);
  const billed = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(summary(printed), {
    subtotal: 2240, discount: 150, tax: 104.50, cgst: 52.25, sgst: 52.25, total: 2194.50
  });
  assert.deepEqual(invoiceLines(printed), [
    { hsn: '1508', gstPercent: 5, line: 2240, lineTax: 104.50 }
  ]);
  assert.deepEqual(summary(billed), {
    subtotal: 2240, discount: 150, tax: 104.50, cgst: 52.25, sgst: 52.25, total: 2194.50
  });
});

test('CURRENT BEHAVIOUR: #1008 invoice matches checkout for 18% items without a coupon', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      { name: 'Tea', hsn: '0902', price: 140, qty: 1, gstRate: 18 },
      { name: 'Syrup', hsn: '2106', price: 180, qty: 2 }
    ]
  };

  const printed = invoice.computeInvoiceFigures(order);
  const billed = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(summary(printed), {
    subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590
  });
  assert.deepEqual(invoiceLines(printed), [
    { hsn: '0902', gstPercent: 18, line: 140, lineTax: 25.20 },
    { hsn: '2106', gstPercent: 18, line: 360, lineTax: 64.80 }
  ]);
  assert.deepEqual(summary(printed), summary(billed));
});

test('invoice matches checkout for mixed GST slabs with a capped pre-tax coupon', () => {
  const order = {
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', hsn: '1006', price: 600, qty: 2 },
      { name: 'Ghee', hsn: '0405', price: 800, qty: 1 },
      { name: 'Tea', hsn: '0902', price: 200, qty: 2 }
    ]
  };

  const billed = pricing.computeTotals(order.items, order.coupon);
  const printed = invoice.computeInvoiceFigures(order);

  assert.deepEqual(summary(billed), {
    subtotal: 2400, discount: 150, tax: 213.75, cgst: 106.88, sgst: 106.87, total: 2463.75
  });
  assert.deepEqual(summary(printed), summary(billed));
  assert.deepEqual(invoiceLines(printed), [
    { hsn: '1006', gstPercent: 5, line: 1200, lineTax: 56.25 },
    { hsn: '0405', gstPercent: 12, line: 800, lineTax: 90 },
    { hsn: '0902', gstPercent: 18, line: 400, lineTax: 67.50 }
  ]);

  const matchingReprint = invoice.render({ ...order, ...summary(billed) });
  assert.match(matchingReprint, /Line GST uses current checkout rules/);
  assert.match(matchingReprint, /5%<\/td><td class="r">₹56\.25/);
  assert.doesNotMatch(matchingReprint, /Accountant Reconciliation Notice/);

  const reprint = invoice.render({
    ...order,
    subtotal: 2400,
    discount: 120,
    tax: 216.60,
    total: 2496.60
  });
  assert.match(reprint, /Gross Subtotal<\/td><td class="r">₹2400\.00/);
  assert.match(reprint, /Total GST\)<\/td><td class="r">₹216\.60/);
  assert.match(reprint, /Coupon Discount \(SAVE10\)<\/td><td[^>]*>-₹120\.00/);
  assert.match(reprint, /Invoice Total<\/td><td class="r">₹2496\.60/);
  assert.match(reprint, /Original line-level GST is unavailable/);
  assert.equal(reprint.match(/&mdash;<\/td><td class="r">&mdash;/g)?.length, 3);
});
