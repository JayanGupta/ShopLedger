const test = require('node:test');
const assert = require('node:assert/strict');

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(name, sku, price, qty, hsn, gstRate) {
  return { name, sku, price, qty, hsn, gstRate };
}

function calculate(order) {
  return {
    invoiceFigures: invoice.computeInvoiceFigures(order),
    checkoutFigures: pricing.computeTotals(order.items, order.coupon)
  };
}

test('CURRENT BEHAVIOUR: #1001 mixed 5% and 12% items without a coupon', function () {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      item('Rice', 'GRN-001', 640, 1, '1006', 5),
      item('Ghee', 'DRY-001', 450, 1, '0405', 12)
    ]
  };
  const { invoiceFigures, checkoutFigures } = calculate(order);

  assert.deepEqual(invoiceFigures, {
    subtotal: 1090,
    discount: 0,
    tax: 86,
    cgst: 43,
    sgst: 43,
    total: 1176,
    rows: [
      { name: 'Rice', sku: 'GRN-001', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 32 },
      { name: 'Ghee', sku: 'DRY-001', hsn: '0405', qty: 1, price: 450, gstPercent: 12, line: 450, lineTax: 54 }
    ]
  });
  assert.deepEqual(
    { subtotal: checkoutFigures.subtotal, discount: checkoutFigures.discount, tax: checkoutFigures.tax, total: checkoutFigures.total },
    { subtotal: 1090, discount: 0, tax: 86, total: 1176 }
  );
});

test('CURRENT BEHAVIOUR: #1002 SAVE10 invoice matches checkout discount and post-discount GST', function () {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      item('Rice', 'GRN-001', 640, 1, '1006', 5),
      item('Sunflower Oil', 'OIL-001', 190, 2, '1512', 5)
    ]
  };
  const { invoiceFigures, checkoutFigures } = calculate(order);

  assert.deepEqual(invoiceFigures, {
    subtotal: 1020,
    discount: 102,
    tax: 45.9,
    cgst: 22.95,
    sgst: 22.95,
    total: 963.9,
    rows: [
      { name: 'Rice', sku: 'GRN-001', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
      { name: 'Sunflower Oil', sku: 'OIL-001', hsn: '1512', qty: 2, price: 190, gstPercent: 5, line: 380, lineTax: 17.1 }
    ]
  });
  assert.deepEqual(
    { subtotal: checkoutFigures.subtotal, discount: checkoutFigures.discount, tax: checkoutFigures.tax, total: checkoutFigures.total },
    { subtotal: 1020, discount: 102, tax: 45.9, total: 963.9 }
  );
});

test('CURRENT BEHAVIOUR: #1004 SAVE10 invoice honors the ₹150 maximum discount', function () {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [item('Groundnut Oil', 'OIL-002', 1120, 2, '1508', 5)]
  };
  const { invoiceFigures, checkoutFigures } = calculate(order);

  assert.deepEqual(invoiceFigures, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      { name: 'Groundnut Oil', sku: 'OIL-002', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  });
  assert.deepEqual(
    { subtotal: checkoutFigures.subtotal, discount: checkoutFigures.discount, tax: checkoutFigures.tax, total: checkoutFigures.total },
    { subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5 }
  );
});

test('CURRENT BEHAVIOUR: #1008 all 18% items without a coupon', function () {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      item('Packaged Tea', 'BEV-001', 140, 1, '0902', 18),
      item('Sherbet Concentrate', 'BEV-003', 180, 2, '2106', 18)
    ]
  };
  const { invoiceFigures, checkoutFigures } = calculate(order);

  assert.deepEqual(invoiceFigures, {
    subtotal: 500,
    discount: 0,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 590,
    rows: [
      { name: 'Packaged Tea', sku: 'BEV-001', hsn: '0902', qty: 1, price: 140, gstPercent: 18, line: 140, lineTax: 25.2 },
      { name: 'Sherbet Concentrate', sku: 'BEV-003', hsn: '2106', qty: 2, price: 180, gstPercent: 18, line: 360, lineTax: 64.8 }
    ]
  });
  assert.deepEqual(
    { subtotal: checkoutFigures.subtotal, discount: checkoutFigures.discount, tax: checkoutFigures.tax, total: checkoutFigures.total },
    { subtotal: 500, discount: 0, tax: 90, total: 590 }
  );
});

test('invoice matches checkout for HSN slabs and capped coupon', function () {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      item('Rice', 'GRN-001', 2000, 1, '1006'),
      item('Ghee', 'DRY-001', 1000, 1, '0405')
    ]
  };
  const { invoiceFigures, checkoutFigures } = calculate(order);

  assert.deepEqual(
    {
      subtotal: invoiceFigures.subtotal,
      discount: invoiceFigures.discount,
      tax: invoiceFigures.tax,
      cgst: invoiceFigures.cgst,
      sgst: invoiceFigures.sgst,
      total: invoiceFigures.total,
      rows: invoiceFigures.rows.map(function (row) {
        return { hsn: row.hsn, gstPercent: row.gstPercent, tax: row.lineTax };
      })
    },
    {
      subtotal: checkoutFigures.subtotal,
      discount: checkoutFigures.discount,
      tax: checkoutFigures.tax,
      cgst: checkoutFigures.cgst,
      sgst: checkoutFigures.sgst,
      total: checkoutFigures.total,
      rows: checkoutFigures.lines.map(function (line) {
        return { hsn: line.hsn, gstPercent: line.gstPercent, tax: line.tax };
      })
    }
  );
});
