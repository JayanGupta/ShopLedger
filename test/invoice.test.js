const test = require('node:test');
const assert = require('node:assert/strict');

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(name, sku, hsn, price, qty, gstRate) {
  return { name, sku, hsn, price, qty, gstRate };
}

function invoiceFigures(order) {
  const result = invoice.computeInvoiceFigures(order);
  return {
    subtotal: result.subtotal,
    discount: result.discount,
    tax: result.tax,
    cgst: result.cgst,
    sgst: result.sgst,
    total: result.total,
    rows: result.rows.map(function (row) {
      return { hsn: row.hsn, gstPercent: row.gstPercent, line: row.line, lineTax: row.lineTax };
    })
  };
}

function checkoutFigures(items, coupon) {
  const result = pricing.computeTotals(items, coupon);
  return {
    subtotal: result.subtotal,
    discount: result.discount,
    taxable: result.taxable,
    tax: result.tax,
    cgst: result.cgst,
    sgst: result.sgst,
    total: result.total
  };
}

function characterize(name, id, items, coupon, expectedInvoice, expectedCheckout) {
  test(name, function () {
    const order = { id: id, items: items, coupon: coupon };
    const actualInvoice = invoiceFigures(order);
    const actualCheckout = checkoutFigures(items, coupon);

    assert.deepEqual(actualInvoice, expectedInvoice);
    assert.deepEqual(actualCheckout, expectedCheckout);
  });
}

characterize(
  'CURRENT BEHAVIOUR: #1001 uses 5% and 12% GST with no coupon',
  1001,
  [
    item('Indrayani Basmati Rice 5kg', 'GRN-001', '1006', 640, 1, 5),
    item('A2 Gir Cow Ghee 500ml', 'DRY-001', '0405', 450, 1, 12)
  ],
  '',
  {
    subtotal: 1090, discount: 0, tax: 86, cgst: 43, sgst: 43, total: 1176,
    rows: [
      { hsn: '1006', gstPercent: 5, line: 640, lineTax: 32 },
      { hsn: '0405', gstPercent: 12, line: 450, lineTax: 54 }
    ]
  },
  { subtotal: 1090, discount: 0, taxable: 1090, tax: 86, cgst: 43, sgst: 43, total: 1176 }
);

characterize(
  'CURRENT BEHAVIOUR: #1002 SAVE10 matches checkout discount before tax',
  1002,
  [
    item('Indrayani Basmati Rice 5kg', 'GRN-001', '1006', 640, 1, 5),
    item('Cold-Pressed Sunflower Oil 1L', 'OIL-001', '1512', 190, 2, 5)
  ],
  'SAVE10',
  {
    subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9,
    rows: [
      { hsn: '1006', gstPercent: 5, line: 640, lineTax: 28.8 },
      { hsn: '1512', gstPercent: 5, line: 380, lineTax: 17.1 }
    ]
  },
  { subtotal: 1020, discount: 102, taxable: 918, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 }
);

characterize(
  'CURRENT BEHAVIOUR: #1004 SAVE10 honors the 150 cap before GST',
  1004,
  [
    item('Cold-Pressed Groundnut Oil 5L', 'OIL-002', '1508', 1120, 2, 5)
  ],
  'SAVE10',
  {
    subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5,
    rows: [
      { hsn: '1508', gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  },
  { subtotal: 2240, discount: 150, taxable: 2090, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 }
);

characterize(
  'CURRENT BEHAVIOUR: #1008 all 18% GST with no coupon',
  1008,
  [
    item('Assam CTC Masala Chai 250g', 'BEV-001', '0902', 140, 1, 18),
    item('Kokum Sherbet Concentrate 750ml', 'BEV-003', '2106', 180, 2, 18)
  ],
  '',
  {
    subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590,
    rows: [
      { hsn: '0902', gstPercent: 18, line: 140, lineTax: 25.2 },
      { hsn: '2106', gstPercent: 18, line: 360, lineTax: 64.8 }
    ]
  },
  { subtotal: 500, discount: 0, taxable: 500, tax: 90, cgst: 45, sgst: 45, total: 590 }
);

test('CURRENT BEHAVIOUR: #1004 invoice matches HSN GST and capped SAVE10 checkout', function () {
  const items = [
    { name: 'Cold-Pressed Groundnut Oil 5L', sku: 'OIL-002', hsn: '1508', price: 1120, qty: 2 }
  ];
  const order = { id: 1004, items: items, coupon: 'SAVE10' };
  const expected = {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      { hsn: '1508', gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  };

  assert.deepEqual(invoiceFigures(order), expected);
  const checkout = pricing.computeTotals(items, 'SAVE10');
  assert.equal(expected.subtotal, checkout.subtotal);
  assert.equal(expected.discount, checkout.discount);
  assert.equal(expected.tax, checkout.tax);
  assert.equal(expected.cgst, checkout.cgst);
  assert.equal(expected.sgst, checkout.sgst);
  assert.equal(expected.total, checkout.total);
});
