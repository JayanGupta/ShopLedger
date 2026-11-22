const test = require('node:test');
const assert = require('node:assert/strict');

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function line(id, name, sku, hsn, price, qty) {
  return { id, name, sku, hsn, price, qty, gstRate: null };
}

function assertCurrentFigures(items, coupon, expectedInvoice, expectedCheckout) {
  const order = { items, coupon };
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutFigures = pricing.computeTotals(items, coupon);

  assert.deepEqual(invoiceFigures, expectedInvoice);
  assert.deepEqual(
    {
      subtotal: checkoutFigures.subtotal,
      discount: checkoutFigures.discount,
      tax: checkoutFigures.tax,
      total: checkoutFigures.total
    },
    expectedCheckout
  );
}

test('Invoice matches checkout for #1001 mixed HSN rates', function () {
  assertCurrentFigures([
    line(8, 'Assam CTC Masala Chai 250g', 'BEV-001', '0902', 140, 2),
    line(2, 'Unpolished Toor Dal 1kg', 'GRN-002', '0713', 165, 2)
  ], '', {
    subtotal: 610,
    discount: 0,
    tax: 66.9,
    cgst: 33.45,
    sgst: 33.45,
    total: 676.9,
    rows: [
      { name: 'Assam CTC Masala Chai 250g', sku: 'BEV-001', hsn: '0902', qty: 2, price: 140, gstPercent: 18, line: 280, lineTax: 50.4 },
      { name: 'Unpolished Toor Dal 1kg', sku: 'GRN-002', hsn: '0713', qty: 2, price: 165, gstPercent: 5, line: 330, lineTax: 16.5 }
    ]
  }, { subtotal: 610, discount: 0, tax: 66.9, total: 676.9 });
});

test('Invoice matches checkout for #1002 with SAVE10', function () {
  assertCurrentFigures([
    line(1, 'Indrayani Basmati Rice 5kg', 'GRN-001', '1006', 640, 1),
    line(4, 'Cold-Pressed Sunflower Oil 1L', 'OIL-001', '1512', 190, 2)
  ], 'SAVE10', {
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
  }, { subtotal: 1020, discount: 102, tax: 45.9, total: 963.9 });
});

test('Invoice matches checkout for #1004 with the SAVE10 cap', function () {
  assertCurrentFigures([
    line(5, 'Cold-Pressed Groundnut Oil 5L', 'OIL-002', '1508', 1120, 2)
  ], 'SAVE10', {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      { name: 'Cold-Pressed Groundnut Oil 5L', sku: 'OIL-002', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  }, { subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5 });
});

test('CURRENT BEHAVIOUR: #1008 invoice and checkout agree for items in the 18% slab', function () {
  assertCurrentFigures([
    line(8, 'Assam CTC Masala Chai 250g', 'BEV-001', '0902', 140, 1),
    line(12, 'Kokum Sherbet Concentrate 750ml', 'BEV-003', '2106', 180, 2)
  ], '', {
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
  }, { subtotal: 500, discount: 0, tax: 90, total: 590 });
});

test('Invoice uses the checkout HSN slab and capped coupon before tax', function () {
  const items = [
    line(5, 'Cold-Pressed Groundnut Oil 5L', 'OIL-002', '1508', 1120, 2)
  ];
  const checkout = pricing.computeTotals(items, 'SAVE10');
  const figures = invoice.computeInvoiceFigures({ items, coupon: 'SAVE10' });

  assert.deepEqual({
    subtotal: figures.subtotal,
    discount: figures.discount,
    tax: figures.tax,
    cgst: figures.cgst,
    sgst: figures.sgst,
    total: figures.total,
    rows: figures.rows.map(function (row) {
      return {
        hsn: row.hsn,
        gstPercent: row.gstPercent,
        line: row.line,
        lineTax: row.lineTax
      };
    })
  }, {
    subtotal: checkout.subtotal,
    discount: checkout.discount,
    tax: checkout.tax,
    cgst: checkout.cgst,
    sgst: checkout.sgst,
    total: checkout.total,
    rows: checkout.lines.map(function (row) {
      return {
        hsn: row.hsn,
        gstPercent: row.gstPercent,
        line: row.gross,
        lineTax: row.tax
      };
    })
  });
});
