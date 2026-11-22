const test = require('node:test');
const assert = require('node:assert/strict');

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(id, sku, name, hsn, price, qty, gstRate) {
  return { id, sku, name, hsn, price, qty, gstRate };
}

function assertCurrentFigures(order, expectedInvoice, expectedPricing) {
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const pricingFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepStrictEqual(invoiceFigures, expectedInvoice);
  assert.deepStrictEqual({
    subtotal: pricingFigures.subtotal,
    discount: pricingFigures.discount,
    tax: pricingFigures.tax,
    cgst: pricingFigures.cgst,
    sgst: pricingFigures.sgst,
    total: pricingFigures.total
  }, expectedPricing);
}

test('CORRECT BEHAVIOUR: invoice matches checkout for capped SAVE10 with HSN GST', () => {
  const items = [
    item(5, 'OIL-002', 'Cold-Pressed Groundnut Oil 5L', '1508', 1120, 2)
  ];

  const order = { id: 1004, items, coupon: 'SAVE10' };
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const pricingFigures = pricing.computeTotals(items, order.coupon);

  assert.deepStrictEqual(invoiceFigures, {
    subtotal: pricingFigures.subtotal,
    discount: pricingFigures.discount,
    tax: pricingFigures.tax,
    cgst: pricingFigures.cgst,
    sgst: pricingFigures.sgst,
    total: pricingFigures.total,
    rows: [
      { name: 'Cold-Pressed Groundnut Oil 5L', sku: 'OIL-002', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  });
});

test('CURRENT BEHAVIOUR: invoice and checkout agree for a no-coupon 5% and 12% order', () => {
  const items = [
    item(2, 'GRN-002', 'Unpolished Toor Dal 1kg', '0713', 165, 2, 5),
    item(6, 'DRY-001', 'A2 Gir Cow Ghee 500ml', '0405', 450, 1, 12)
  ];

  assertCurrentFigures(
    { id: 1001, items, coupon: '' },
    {
      subtotal: 780,
      discount: 0,
      tax: 70.5,
      cgst: 35.25,
      sgst: 35.25,
      total: 850.5,
      rows: [
        { name: 'Unpolished Toor Dal 1kg', sku: 'GRN-002', hsn: '0713', qty: 2, price: 165, gstPercent: 5, line: 330, lineTax: 16.5 },
        { name: 'A2 Gir Cow Ghee 500ml', sku: 'DRY-001', hsn: '0405', qty: 1, price: 450, gstPercent: 12, line: 450, lineTax: 54 }
      ]
    },
    { subtotal: 780, discount: 0, tax: 70.5, cgst: 35.25, sgst: 35.25, total: 850.5 }
  );
});

test('CURRENT BEHAVIOUR: SAVE10 invoice applies discount before GST like checkout', () => {
  const items = [
    item(1, 'GRN-001', 'Indrayani Basmati Rice 5kg', '1006', 640, 1, 5),
    item(4, 'OIL-001', 'Cold-Pressed Sunflower Oil 1L', '1512', 190, 2, 5)
  ];

  assertCurrentFigures(
    { id: 1002, items, coupon: 'SAVE10' },
    {
      subtotal: 1020,
      discount: 102,
      tax: 45.9,
      cgst: 22.95,
      sgst: 22.95,
      total: 963.9,
      rows: [
        { name: 'Indrayani Basmati Rice 5kg', sku: 'GRN-001', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
        { name: 'Cold-Pressed Sunflower Oil 1L', sku: 'OIL-001', hsn: '1512', qty: 2, price: 190, gstPercent: 5, line: 380, lineTax: 17.1 }
      ]
    },
    { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 }
  );
});

test('CURRENT BEHAVIOUR: SAVE10 invoice applies the 150 discount cap on a 2240 subtotal', () => {
  const items = [
    item(5, 'OIL-002', 'Cold-Pressed Groundnut Oil 5L', '1508', 1120, 2, 5)
  ];

  assertCurrentFigures(
    { id: 1004, items, coupon: 'SAVE10' },
    {
      subtotal: 2240,
      discount: 150,
      tax: 104.5,
      cgst: 52.25,
      sgst: 52.25,
      total: 2194.5,
      rows: [
        { name: 'Cold-Pressed Groundnut Oil 5L', sku: 'OIL-002', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
      ]
    },
    { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 }
  );
});

test('CURRENT BEHAVIOUR: invoice and checkout agree for an all-18% order without a coupon', () => {
  const items = [
    item(8, 'BEV-001', 'Assam CTC Masala Chai 250g', '0902', 140, 1, 18),
    item(12, 'BEV-003', 'Kokum Sherbet Concentrate 750ml', '2106', 180, 2, 18)
  ];

  assertCurrentFigures(
    { id: 1008, items, coupon: '' },
    {
      subtotal: 500,
      discount: 0,
      tax: 90,
      cgst: 45,
      sgst: 45,
      total: 590,
      rows: [
        { name: 'Assam CTC Masala Chai 250g', sku: 'BEV-001', hsn: '0902', qty: 1, price: 140, gstPercent: 18, line: 140, lineTax: 25.2 },
        { name: 'Kokum Sherbet Concentrate 750ml', sku: 'BEV-003', hsn: '2106', qty: 2, price: 180, gstPercent: 18, line: 360, lineTax: 64.8 }
      ]
    },
    { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 }
  );
});
