var test = require('node:test');
var assert = require('node:assert');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function calculate(order) {
  return {
    invoice: invoice.computeInvoiceFigures(order),
    checkout: pricing.computeTotals(order.items, order.coupon)
  };
}

test('CURRENT BEHAVIOUR: #1001 uses supplied 5% and 12% GST rates without a coupon', function () {
  var result = calculate({
    coupon: '',
    items: [
      { id: 1, name: 'Rice', sku: 'GRN-001', hsn: '1006', gstRate: 5, price: 640, qty: 1 },
      { id: 6, name: 'Ghee', sku: 'DRY-001', hsn: '0405', gstRate: 12, price: 450, qty: 1 }
    ]
  });

  assert.deepStrictEqual(
    pickFigures(result.invoice),
    { subtotal: 1090, discount: 0, tax: 86, cgst: 43, sgst: 43, total: 1176 }
  );
  assert.deepStrictEqual(result.invoice.rows.map(pickRow), [
    { hsn: '1006', gstPercent: 5, line: 640, lineTax: 32 },
    { hsn: '0405', gstPercent: 12, line: 450, lineTax: 54 }
  ]);
  assert.strictEqual(result.checkout.total, 1176);
});

test('CURRENT BEHAVIOUR: #1002 SAVE10 matches checkout after its pre-tax discount', function () {
  var result = calculate({
    coupon: 'SAVE10',
    items: [
      { id: 1, name: 'Rice', sku: 'GRN-001', hsn: '1006', gstRate: 5, price: 640, qty: 1 },
      { id: 4, name: 'Sunflower Oil', sku: 'OIL-001', hsn: '1512', gstRate: 5, price: 190, qty: 2 }
    ]
  });

  assert.deepStrictEqual(
    pickFigures(result.invoice),
    { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 }
  );
  assert.deepStrictEqual(result.invoice.rows.map(pickRow), [
    { hsn: '1006', gstPercent: 5, line: 640, lineTax: 28.8 },
    { hsn: '1512', gstPercent: 5, line: 380, lineTax: 17.1 }
  ]);
  assert.deepStrictEqual(pickFigures(result.checkout), {
    subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9
  });
});

test('CURRENT BEHAVIOUR: #1004 SAVE10 applies the 150 rupee cap before GST', function () {
  var result = calculate({
    coupon: 'SAVE10',
    items: [
      { id: 5, name: 'Groundnut Oil', sku: 'OIL-002', hsn: '1508', gstRate: 5, price: 1120, qty: 2 }
    ]
  });

  assert.deepStrictEqual(
    pickFigures(result.invoice),
    { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 }
  );
  assert.deepStrictEqual(result.invoice.rows.map(pickRow), [
    { hsn: '1508', gstPercent: 5, line: 2240, lineTax: 104.5 }
  ]);
  assert.deepStrictEqual(pickFigures(result.checkout), {
    subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5
  });
});

test('CURRENT BEHAVIOUR: #1008 all-18-percent items match checkout without a coupon', function () {
  var result = calculate({
    coupon: '',
    items: [
      { id: 8, name: 'Tea', sku: 'BEV-001', hsn: '0902', gstRate: 18, price: 140, qty: 1 },
      { id: 12, name: 'Kokum Sherbet', sku: 'BEV-003', hsn: '2106', gstRate: 18, price: 180, qty: 2 }
    ]
  });

  assert.deepStrictEqual(
    pickFigures(result.invoice),
    { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 }
  );
  assert.deepStrictEqual(result.invoice.rows.map(pickRow), [
    { hsn: '0902', gstPercent: 18, line: 140, lineTax: 25.2 },
    { hsn: '2106', gstPercent: 18, line: 360, lineTax: 64.8 }
  ]);
  assert.strictEqual(result.checkout.total, 590);
});

test('invoice matches checkout for #1004 HSN GST and capped SAVE10 discount', function () {
  var order = {
    coupon: 'SAVE10',
    items: [
      { id: 5, name: 'Groundnut Oil', sku: 'OIL-002', hsn: '1508', price: 1120, qty: 2 }
    ]
  };

  var invoiceFigures = invoice.computeInvoiceFigures(order);
  var checkoutFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepStrictEqual(pickFigures(invoiceFigures), pickFigures(checkoutFigures));
  assert.deepStrictEqual(invoiceFigures.rows.map(pickRow), [
    { hsn: '1508', gstPercent: 5, line: 2240, lineTax: 104.5 }
  ]);
});

function pickFigures(figures) {
  return {
    subtotal: figures.subtotal,
    discount: figures.discount,
    tax: figures.tax,
    cgst: figures.cgst,
    sgst: figures.sgst,
    total: figures.total
  };
}

function pickRow(row) {
  return {
    hsn: row.hsn,
    gstPercent: row.gstPercent,
    line: row.line,
    lineTax: row.lineTax
  };
}
