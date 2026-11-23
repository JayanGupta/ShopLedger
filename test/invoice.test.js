const test = require('node:test');
const assert = require('node:assert/strict');

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(id, name, price, qty, hsn, gstRate) {
  return { id, name, price, qty, hsn, gstRate };
}

function order(id, items, coupon) {
  return { id, items, coupon };
}

test('CURRENT BEHAVIOUR: #1001 invoice matches HSN-rate pricing without a coupon', () => {
  const items = [
    item(8, 'Assam CTC Masala Chai 250g', 140, 2, '0902', 18),
    item(2, 'Unpolished Toor Dal 1kg', 165, 2, '0713', 5)
  ];
  const currentOrder = order(1001, items, '');

  const invoiceFigures = invoice.computeInvoiceFigures(currentOrder);
  const pricingFigures = pricing.computeTotals(items, '');

  assert.deepEqual(invoiceFigures, {
    subtotal: 610,
    discount: 0,
    tax: 66.9,
    cgst: 33.45,
    sgst: 33.45,
    total: 676.9,
    rows: [
      { name: 'Assam CTC Masala Chai 250g', sku: '-', hsn: '0902', qty: 2, price: 140, gstPercent: 18, line: 280, lineTax: 50.4 },
      { name: 'Unpolished Toor Dal 1kg', sku: '-', hsn: '0713', qty: 2, price: 165, gstPercent: 5, line: 330, lineTax: 16.5 }
    ]
  });
  assert.deepEqual(pricingFigures, {
    subtotal: 610,
    discount: 0,
    taxable: 610,
    tax: 66.9,
    cgst: 33.45,
    sgst: 33.45,
    total: 676.9,
    lines: [
      { id: 8, name: 'Assam CTC Masala Chai 250g', hsn: '0902', gstPercent: 18, gross: 280, discount: 0, taxable: 280, tax: 50.4, net: 330.4 },
      { id: 2, name: 'Unpolished Toor Dal 1kg', hsn: '0713', gstPercent: 5, gross: 330, discount: 0, taxable: 330, tax: 16.5, net: 346.5 }
    ]
  });
});

test('CURRENT BEHAVIOUR: #1002 invoice follows checkout discount and GST', () => {
  const items = [
    item(1, 'Indrayani Basmati Rice 5kg', 640, 1, '1006', 5),
    item(4, 'Cold-Pressed Sunflower Oil 1L', 190, 2, '1512', 5)
  ];
  const currentOrder = order(1002, items, 'SAVE10');

  const invoiceFigures = invoice.computeInvoiceFigures(currentOrder);
  const pricingFigures = pricing.computeTotals(items, 'SAVE10');

  assert.deepEqual(invoiceFigures, {
    subtotal: 1020,
    discount: 102,
    tax: 45.9,
    cgst: 22.95,
    sgst: 22.95,
    total: 963.9,
    rows: [
      { name: 'Indrayani Basmati Rice 5kg', sku: '-', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
      { name: 'Cold-Pressed Sunflower Oil 1L', sku: '-', hsn: '1512', qty: 2, price: 190, gstPercent: 5, line: 380, lineTax: 17.1 }
    ]
  });
  assert.deepEqual(pricingFigures, {
    subtotal: 1020,
    discount: 102,
    taxable: 918,
    tax: 45.9,
    cgst: 22.95,
    sgst: 22.95,
    total: 963.9,
    lines: [
      { id: 1, name: 'Indrayani Basmati Rice 5kg', hsn: '1006', gstPercent: 5, gross: 640, discount: 64, taxable: 576, tax: 28.8, net: 604.8 },
      { id: 4, name: 'Cold-Pressed Sunflower Oil 1L', hsn: '1512', gstPercent: 5, gross: 380, discount: 38, taxable: 342, tax: 17.1, net: 359.1 }
    ]
  });
  assert.equal(invoiceFigures.discount, pricingFigures.discount);
  assert.equal(invoiceFigures.tax, pricingFigures.tax);
  assert.equal(invoiceFigures.total, pricingFigures.total);
});

test('CURRENT BEHAVIOUR: #1004 invoice follows the SAVE10 maximum discount cap', () => {
  const items = [
    item(5, 'Cold-Pressed Groundnut Oil 5L', 1120, 2, '1508', 5)
  ];
  const currentOrder = order(1004, items, 'SAVE10');

  const invoiceFigures = invoice.computeInvoiceFigures(currentOrder);
  const pricingFigures = pricing.computeTotals(items, 'SAVE10');

  assert.deepEqual(invoiceFigures, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      { name: 'Cold-Pressed Groundnut Oil 5L', sku: '-', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  });
  assert.deepEqual(pricingFigures, {
    subtotal: 2240,
    discount: 150,
    taxable: 2090,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    lines: [
      { id: 5, name: 'Cold-Pressed Groundnut Oil 5L', hsn: '1508', gstPercent: 5, gross: 2240, discount: 150, taxable: 2090, tax: 104.5, net: 2194.5 }
    ]
  });
  assert.equal(invoiceFigures.discount, 150);
  assert.equal(pricingFigures.discount, 150);
  assert.equal(invoiceFigures.total, pricingFigures.total);
});

test('CURRENT BEHAVIOUR: #1008 invoice matches pricing for all-18-percent lines without a coupon', () => {
  const items = [
    item(8, 'Assam CTC Masala Chai 250g', 140, 1, '0902', 18),
    item(12, 'Kokum Sherbet Concentrate 750ml', 180, 2, '2106', 18)
  ];
  const currentOrder = order(1008, items, '');

  const invoiceFigures = invoice.computeInvoiceFigures(currentOrder);
  const pricingFigures = pricing.computeTotals(items, '');

  assert.deepEqual(invoiceFigures, {
    subtotal: 500,
    discount: 0,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 590,
    rows: [
      { name: 'Assam CTC Masala Chai 250g', sku: '-', hsn: '0902', qty: 1, price: 140, gstPercent: 18, line: 140, lineTax: 25.2 },
      { name: 'Kokum Sherbet Concentrate 750ml', sku: '-', hsn: '2106', qty: 2, price: 180, gstPercent: 18, line: 360, lineTax: 64.8 }
    ]
  });
  assert.deepEqual(pricingFigures, {
    subtotal: 500,
    discount: 0,
    taxable: 500,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 590,
    lines: [
      { id: 8, name: 'Assam CTC Masala Chai 250g', hsn: '0902', gstPercent: 18, gross: 140, discount: 0, taxable: 140, tax: 25.2, net: 165.2 },
      { id: 12, name: 'Kokum Sherbet Concentrate 750ml', hsn: '2106', gstPercent: 18, gross: 360, discount: 0, taxable: 360, tax: 64.8, net: 424.8 }
    ]
  });
});

test('CURRENT BEHAVIOUR: invoice uses checkout HSN slab and capped coupon before tax', () => {
  const items = [
    item(5, 'Cold-Pressed Groundnut Oil 5L', 1120, 2, '1508')
  ];
  const currentOrder = order(1004, items, 'SAVE10');

  const invoiceFigures = invoice.computeInvoiceFigures(currentOrder);
  const pricingFigures = pricing.computeTotals(items, 'SAVE10');

  assert.deepEqual(invoiceFigures, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      { name: 'Cold-Pressed Groundnut Oil 5L', sku: '-', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  });
  assert.equal(invoiceFigures.subtotal, pricingFigures.subtotal);
  assert.equal(invoiceFigures.discount, pricingFigures.discount);
  assert.equal(invoiceFigures.tax, pricingFigures.tax);
  assert.equal(invoiceFigures.total, pricingFigures.total);
});
