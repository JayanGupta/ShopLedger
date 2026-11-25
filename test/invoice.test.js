var test = require('node:test');
var assert = require('node:assert/strict');

var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function makeOrder(id, items, coupon) {
  return {
    id: id,
    customer: 'Test Customer',
    coupon: coupon || '',
    items: items
  };
}

function line(name, sku, hsn, price, qty, gstRate) {
  return {
    name: name,
    sku: sku,
    hsn: hsn,
    price: price,
    qty: qty,
    gstRate: gstRate
  };
}

test('CURRENT BEHAVIOUR: #1001 invoice uses supplied 5% and 12% line GST without a coupon', function () {
  var items = [
    line('Indrayani Basmati Rice 5kg', 'GRN-001', '1006', 640, 1, 5),
    line('A2 Gir Cow Ghee 500ml', 'DRY-001', '0405', 450, 1, 12)
  ];
  var invoiceFigures = invoice.computeInvoiceFigures(makeOrder(1001, items));
  var checkoutFigures = pricing.computeTotals(items, '');

  assert.deepEqual(invoiceFigures, {
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
  assert.equal(checkoutFigures.total, 1176);
  assert.equal(checkoutFigures.tax, 86);
});

test('CURRENT BEHAVIOUR: #1002 SAVE10 invoice mirrors checkout discount-before-tax figures', function () {
  var items = [
    line('Indrayani Basmati Rice 5kg', 'GRN-001', '1006', 640, 1, 5),
    line('Cold-Pressed Sunflower Oil 1L', 'OIL-001', '1512', 190, 2, 5)
  ];
  var invoiceFigures = invoice.computeInvoiceFigures(makeOrder(1002, items, 'SAVE10'));
  var checkoutFigures = pricing.computeTotals(items, 'SAVE10');

  assert.deepEqual(invoiceFigures, {
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
  assert.deepEqual(
    { discount: checkoutFigures.discount, tax: checkoutFigures.tax, total: checkoutFigures.total },
    { discount: 102, tax: 45.9, total: 963.9 }
  );
});

test('CURRENT BEHAVIOUR: #1004 SAVE10 invoice applies the ₹150 cap before GST', function () {
  var items = [
    line('Cold-Pressed Groundnut Oil 5L', 'OIL-002', '1508', 1120, 2, 5)
  ];
  var invoiceFigures = invoice.computeInvoiceFigures(makeOrder(1004, items, 'SAVE10'));
  var checkoutFigures = pricing.computeTotals(items, 'SAVE10');

  assert.deepEqual(invoiceFigures, {
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
  assert.deepEqual(
    { discount: checkoutFigures.discount, tax: checkoutFigures.tax, total: checkoutFigures.total },
    { discount: 150, tax: 104.5, total: 2194.5 }
  );
  assert.equal(invoiceFigures.total, checkoutFigures.total);
});

test('CURRENT BEHAVIOUR: #1008 all-18% items without a coupon match checkout totals', function () {
  var items = [
    line('Assam CTC Masala Chai 250g', 'BEV-001', '0902', 140, 1, 18),
    line('Kokum Sherbet Concentrate 750ml', 'BEV-003', '2106', 180, 2, 18)
  ];
  var invoiceFigures = invoice.computeInvoiceFigures(makeOrder(1008, items));
  var checkoutFigures = pricing.computeTotals(items, '');

  assert.deepEqual(invoiceFigures, {
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
  assert.deepEqual(
    { tax: checkoutFigures.tax, total: checkoutFigures.total },
    { tax: 90, total: 590 }
  );
});

test('invoice matches checkout for an HSN-rated SAVE10 order with the discount cap', function () {
  var items = [
    {
      name: 'Cold-Pressed Groundnut Oil 5L',
      sku: 'OIL-002',
      hsn: '1508',
      price: 1120,
      qty: 2
    }
  ];
  var invoiceFigures = invoice.computeInvoiceFigures(makeOrder(1004, items, 'SAVE10'));
  var checkoutFigures = pricing.computeTotals(items, 'SAVE10');

  assert.deepEqual(invoiceFigures, {
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
  assert.deepEqual(
    {
      subtotal: invoiceFigures.subtotal,
      discount: invoiceFigures.discount,
      tax: invoiceFigures.tax,
      cgst: invoiceFigures.cgst,
      sgst: invoiceFigures.sgst,
      total: invoiceFigures.total
    },
    {
      subtotal: checkoutFigures.subtotal,
      discount: checkoutFigures.discount,
      tax: checkoutFigures.tax,
      cgst: checkoutFigures.cgst,
      sgst: checkoutFigures.sgst,
      total: checkoutFigures.total
    }
  );
});
