const { test } = require('node:test');
const assert = require('node:assert').strict;
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function orderItem(name, price, qty, hsn) {
  // New order lines carry HSN but no explicit GST override.
  return { name, price, qty, hsn, gstRate: undefined };
}

function assertOrderFigures(order, expectedInvoice, expectedCheckout) {
  const { rows, ...invoiceFigures } = invoice.computeInvoiceFigures(order);
  const { lines, ...checkoutFigures } = pricing.computeTotals(order.items, order.coupon);
  const { rows: expectedRows, ...expectedInvoiceFigures } = expectedInvoice;
  const { lines: expectedLines, ...expectedCheckoutFigures } = expectedCheckout;

  assert.deepStrictEqual(invoiceFigures, expectedInvoiceFigures, 'Invoice totals');
  assert.deepStrictEqual(
    rows.map(({ hsn, gstPercent, line, lineTax }) => ({ hsn, gstPercent, line, lineTax })),
    expectedRows,
    'Invoice line GST'
  );
  assert.deepStrictEqual(checkoutFigures, expectedCheckoutFigures, 'Checkout totals');
  assert.deepStrictEqual(
    lines.map(({ hsn, gstPercent, taxable, tax }) => ({ hsn, gstPercent, taxable, tax })),
    expectedLines,
    'Checkout line GST'
  );
}

test('CURRENT BEHAVIOUR: #1001 invoice uses the checkout HSN slabs for both lines', function () {
  const order = {
    id: 1001,
    items: [
      orderItem('Poha', 45, 2, '1104'),
      orderItem('Ghee', 520, 1, '0405')
    ],
    coupon: ''
  };

  assertOrderFigures(order, {
    subtotal: 610,
    discount: 0,
    tax: 66.90,
    cgst: 33.45,
    sgst: 33.45,
    total: 676.90,
    rows: [
      { hsn: '1104', gstPercent: 5, line: 90, lineTax: 4.50 },
      { hsn: '0405', gstPercent: 12, line: 520, lineTax: 62.40 }
    ]
  }, {
    subtotal: 610,
    discount: 0,
    taxable: 610,
    tax: 66.90,
    cgst: 33.45,
    sgst: 33.45,
    total: 676.90,
    lines: [
      { hsn: '1104', gstPercent: 5, taxable: 90, tax: 4.50 },
      { hsn: '0405', gstPercent: 12, taxable: 520, tax: 62.40 }
    ]
  });
});

test('CURRENT BEHAVIOUR: #1002 invoice applies SAVE10 before GST', function () {
  const order = {
    id: 1002,
    items: [
      orderItem('Rice', 640, 1, '1006'),
      orderItem('Sunflower oil', 190, 2, '1512')
    ],
    coupon: 'SAVE10'
  };

  assertOrderFigures(order, {
    subtotal: 1020,
    discount: 102,
    tax: 45.90,
    cgst: 22.95,
    sgst: 22.95,
    total: 963.90,
    rows: [
      { hsn: '1006', gstPercent: 5, line: 640, lineTax: 28.80 },
      { hsn: '1512', gstPercent: 5, line: 380, lineTax: 17.10 }
    ]
  }, {
    subtotal: 1020,
    discount: 102,
    taxable: 918,
    tax: 45.90,
    cgst: 22.95,
    sgst: 22.95,
    total: 963.90,
    lines: [
      { hsn: '1006', gstPercent: 5, taxable: 576, tax: 28.80 },
      { hsn: '1512', gstPercent: 5, taxable: 342, tax: 17.10 }
    ]
  });
});

test('CURRENT BEHAVIOUR: #1004 invoice applies the SAVE10 cap', function () {
  const order = {
    id: 1004,
    items: [orderItem('Groundnut oil', 1120, 2, '1508')],
    coupon: 'SAVE10'
  };

  assertOrderFigures(order, {
    subtotal: 2240,
    discount: 150,
    tax: 104.50,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.50,
    rows: [{ hsn: '1508', gstPercent: 5, line: 2240, lineTax: 104.50 }]
  }, {
    subtotal: 2240,
    discount: 150,
    taxable: 2090,
    tax: 104.50,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.50,
    lines: [{ hsn: '1508', gstPercent: 5, taxable: 2090, tax: 104.50 }]
  });
});

test('CURRENT BEHAVIOUR: #1008 invoice matches checkout at 18% without a coupon', function () {
  const order = {
    id: 1008,
    items: [
      orderItem('Tea', 125, 2, '0902'),
      orderItem('Coffee', 250, 1, '0901')
    ],
    coupon: ''
  };

  assertOrderFigures(order, {
    subtotal: 500,
    discount: 0,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 590,
    rows: [
      { hsn: '0902', gstPercent: 18, line: 250, lineTax: 45 },
      { hsn: '0901', gstPercent: 18, line: 250, lineTax: 45 }
    ]
  }, {
    subtotal: 500,
    discount: 0,
    taxable: 500,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 590,
    lines: [
      { hsn: '0902', gstPercent: 18, taxable: 250, tax: 45 },
      { hsn: '0901', gstPercent: 18, taxable: 250, tax: 45 }
    ]
  });
});

test('invoice matches checkout for mixed GST slabs with a capped coupon', function () {
  const order = {
    items: [
      orderItem('Rice', 640, 1, '1006'),
      orderItem('Ghee', 800, 2, '0405')
    ],
    coupon: 'SAVE10'
  };

  assertOrderFigures(order, {
    subtotal: 2240,
    discount: 150,
    tax: 209,
    cgst: 104.50,
    sgst: 104.50,
    total: 2299,
    rows: [
      { hsn: '1006', gstPercent: 5, line: 640, lineTax: 29.86 },
      { hsn: '0405', gstPercent: 12, line: 1600, lineTax: 179.14 }
    ]
  }, {
    subtotal: 2240,
    discount: 150,
    taxable: 2090,
    tax: 209,
    cgst: 104.50,
    sgst: 104.50,
    total: 2299,
    lines: [
      { hsn: '1006', gstPercent: 5, taxable: 597.14, tax: 29.86 },
      { hsn: '0405', gstPercent: 12, taxable: 1492.86, tax: 179.14 }
    ]
  });
});
