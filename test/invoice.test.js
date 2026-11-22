'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function line(name, sku, hsn, price, qty, gstRate) {
  return { name, sku, hsn, price, qty, gstRate };
}

const cases = [
  {
    name: 'CURRENT BEHAVIOUR: #1001 invoice and checkout agree on mixed 5% and 18% GST lines',
    coupon: '',
    items: [
      line('Assam CTC Masala Chai 250g', 'BEV-001', '0902', 140, 2, 18),
      line('Unpolished Toor Dal 1kg', 'GRN-002', '0713', 165, 2, 5)
    ],
    invoice: { subtotal: 610, discount: 0, tax: 66.9, cgst: 33.45, sgst: 33.45, total: 676.9,
      rows: [{ gstPercent: 18, line: 280, lineDiscount: 0, taxable: 280, lineTax: 50.4 },
        { gstPercent: 5, line: 330, lineDiscount: 0, taxable: 330, lineTax: 16.5 }] },
    checkout: { subtotal: 610, discount: 0, tax: 66.9, cgst: 33.45, sgst: 33.45, total: 676.9 }
  },
  {
    name: '#1002 invoice matches checkout for SAVE10 with same-slab lines',
    coupon: 'SAVE10',
    items: [
      line('Indrayani Basmati Rice 5kg', 'GRN-001', '1006', 640, 1, 5),
      line('Cold-Pressed Sunflower Oil 1L', 'OIL-001', '1512', 190, 2, 5)
    ],
    invoice: { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9,
      rows: [{ gstPercent: 5, line: 640, lineDiscount: 64, taxable: 576, lineTax: 28.8 },
        { gstPercent: 5, line: 380, lineDiscount: 38, taxable: 342, lineTax: 17.1 }] },
    checkout: { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 }
  },
  {
    name: '#1004 invoice matches checkout with SAVE10 capped at ₹150',
    coupon: 'SAVE10',
    items: [
      line('Cold-Pressed Groundnut Oil 5L', 'OIL-002', '1508', 1120, 2, 5)
    ],
    invoice: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5,
      rows: [{ gstPercent: 5, line: 2240, lineDiscount: 150, taxable: 2090, lineTax: 104.5 }] },
    checkout: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 }
  },
  {
    name: 'CURRENT BEHAVIOUR: #1008 invoice and checkout agree for undiscounted all-18% lines',
    coupon: '',
    items: [
      line('Assam CTC Masala Chai 250g', 'BEV-001', '0902', 140, 1, 18),
      line('Kokum Sherbet Concentrate 750ml', 'BEV-003', '2106', 180, 2, 18)
    ],
    invoice: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590,
      rows: [{ gstPercent: 18, line: 140, lineDiscount: 0, taxable: 140, lineTax: 25.2 },
        { gstPercent: 18, line: 360, lineDiscount: 0, taxable: 360, lineTax: 64.8 }] },
    checkout: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 }
  }
];

for (const scenario of cases) {
  test(scenario.name, () => {
    const order = { items: scenario.items, coupon: scenario.coupon };
    const actualInvoice = invoice.computeInvoiceFigures(order);
    const actualCheckout = pricing.computeTotals(scenario.items, scenario.coupon);

    assert.deepEqual({
      subtotal: actualInvoice.subtotal,
      discount: actualInvoice.discount,
      tax: actualInvoice.tax,
      cgst: actualInvoice.cgst,
      sgst: actualInvoice.sgst,
      total: actualInvoice.total,
      rows: actualInvoice.rows.map(({ gstPercent, line, lineDiscount, taxable, lineTax }) =>
        ({ gstPercent, line, lineDiscount, taxable, lineTax }))
    }, scenario.invoice);
    assert.deepEqual({
      subtotal: actualCheckout.subtotal,
      discount: actualCheckout.discount,
      tax: actualCheckout.tax,
      cgst: actualCheckout.cgst,
      sgst: actualCheckout.sgst,
      total: actualCheckout.total
    }, scenario.checkout);
  });
}

test('invoice matches checkout HSN GST and capped coupon for stored order #1004', () => {
  const items = [
    { name: 'Cold-Pressed Groundnut Oil 5L', sku: 'OIL-002', hsn: '1508', price: 1120, qty: 2 }
  ];
  const expected = pricing.computeTotals(items, 'SAVE10');
  const actual = invoice.computeInvoiceFigures({ items, coupon: 'SAVE10' });

  assert.deepEqual({
    subtotal: actual.subtotal,
    discount: actual.discount,
    tax: actual.tax,
    cgst: actual.cgst,
    sgst: actual.sgst,
    total: actual.total,
    rows: actual.rows.map(({ gstPercent, line, lineDiscount, taxable, lineTax }) =>
      ({ gstPercent, line, lineDiscount, taxable, lineTax }))
  }, {
    subtotal: expected.subtotal,
    discount: expected.discount,
    tax: expected.tax,
    cgst: expected.cgst,
    sgst: expected.sgst,
    total: expected.total,
    rows: expected.lines.map(({ gstPercent, gross, discount, taxable, tax }) =>
      ({ gstPercent, line: gross, lineDiscount: discount, taxable, lineTax: tax }))
  });

  const html = invoice.render({ items, coupon: 'SAVE10' });
  assert.match(html, /Line Gross<\/th><th class="r">Discount<\/th><th class="r">Taxable<\/th>/);
  assert.match(html, /₹2240\.00<\/td><td class="r">-₹150\.00<\/td><td class="r">₹2090\.00<\/td>/);
});
