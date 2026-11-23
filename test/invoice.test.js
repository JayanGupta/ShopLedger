var test = require('node:test');
var assert = require('node:assert');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function line(id, name, sku, hsn, gstRate, price, qty) {
  return { id: id, name: name, sku: sku, hsn: hsn, gstRate: gstRate, price: price, qty: qty };
}

test('CURRENT BEHAVIOUR: #1001 invoice uses supplied 5% and 12% GST rates without a coupon', function () {
  var order = {
    id: 1001,
    coupon: '',
    items: [
      line(1, 'Indrayani Basmati Rice 5kg', 'GRN-001', '1006', 5, 640, 1),
      line(6, 'A2 Gir Cow Ghee 500ml', 'DRY-001', '0405', 12, 450, 1)
    ]
  };
  var invoiceFigures = invoice.computeInvoiceFigures(order);
  var checkoutFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepStrictEqual(invoiceFigures, {
    subtotal: 1090,
    discount: 0,
    tax: 86,
    cgst: 43,
    sgst: 43,
    total: 1176,
    rows: [
      { name: 'Indrayani Basmati Rice 5kg', sku: 'GRN-001', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 32 },
      { name: 'A2 Gir Cow Ghee 500ml', sku: 'DRY-001', hsn: '0405', qty: 1, price: 450, gstPercent: 12, line: 450, lineTax: 54 }
    ]
  });
  assert.deepStrictEqual(
    { tax: checkoutFigures.tax, total: checkoutFigures.total },
    { tax: 86, total: 1176 }
  );
});

test('CURRENT BEHAVIOUR: #1002 invoice applies SAVE10 before tax and matches checkout', function () {
  var order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      line(1, 'Indrayani Basmati Rice 5kg', 'GRN-001', '1006', 5, 640, 1),
      line(4, 'Cold-Pressed Sunflower Oil 1L', 'OIL-001', '1512', 5, 190, 2)
    ]
  };
  var invoiceFigures = invoice.computeInvoiceFigures(order);
  var checkoutFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepStrictEqual(invoiceFigures, {
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
  });
  assert.deepStrictEqual(
    { discount: checkoutFigures.discount, tax: checkoutFigures.tax, total: checkoutFigures.total },
    { discount: 102, tax: 45.9, total: 963.9 }
  );
});

test('CURRENT BEHAVIOUR: #1004 invoice applies the SAVE10 maximum discount cap and matches checkout', function () {
  var order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      line(5, 'Cold-Pressed Groundnut Oil 5L', 'OIL-002', '1508', 5, 1120, 2)
    ]
  };
  var invoiceFigures = invoice.computeInvoiceFigures(order);
  var checkoutFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepStrictEqual(invoiceFigures, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      { name: 'Cold-Pressed Groundnut Oil 5L', sku: 'OIL-002', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  });
  assert.deepStrictEqual(
    { discount: checkoutFigures.discount, tax: checkoutFigures.tax, total: checkoutFigures.total },
    { discount: 150, tax: 104.5, total: 2194.5 }
  );
});

test('INVOICE CORRECT BEHAVIOUR: #1004 matches checkout using its HSN slab and capped SAVE10 discount', function () {
  var order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { id: 5, name: 'Cold-Pressed Groundnut Oil 5L', sku: 'OIL-002', hsn: '1508', price: 1120, qty: 2 }
    ]
  };
  var invoiceFigures = invoice.computeInvoiceFigures(order);
  var checkoutFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepStrictEqual(invoiceFigures, {
    subtotal: checkoutFigures.subtotal,
    discount: checkoutFigures.discount,
    tax: checkoutFigures.tax,
    cgst: checkoutFigures.cgst,
    sgst: checkoutFigures.sgst,
    total: checkoutFigures.total,
    rows: [
      { name: 'Cold-Pressed Groundnut Oil 5L', sku: 'OIL-002', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  });
});

test('CURRENT BEHAVIOUR: #1008 all-18% order produces matching invoice and checkout figures', function () {
  var order = {
    id: 1008,
    coupon: '',
    items: [
      line(8, 'Assam CTC Masala Chai 250g', 'BEV-001', '0902', 18, 140, 1),
      line(12, 'Kokum Sherbet Concentrate 750ml', 'BEV-003', '2106', 18, 180, 2)
    ]
  };
  var invoiceFigures = invoice.computeInvoiceFigures(order);
  var checkoutFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepStrictEqual(invoiceFigures, {
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
  });
  assert.deepStrictEqual(
    { tax: checkoutFigures.tax, total: checkoutFigures.total },
    { tax: 90, total: 590 }
  );
});
