var test = require('node:test');
var assert = require('node:assert/strict');

var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function totalsOnly(figures) {
  return {
    subtotal: figures.subtotal,
    discount: figures.discount,
    tax: figures.tax,
    cgst: figures.cgst,
    sgst: figures.sgst,
    total: figures.total
  };
}

test('CURRENT BEHAVIOUR: #1001 invoice uses explicit 5% and 12% rates and matches checkout without a coupon', function () {
  var order = {
    id: 1001,
    coupon: '',
    items: [
      { id: 2, name: 'Unpolished Toor Dal 1kg', price: 165, qty: 2, hsn: '0713', gstRate: 5 },
      { id: 7, name: 'Pasteurized Table Butter 500g', price: 260, qty: 1, hsn: '0405', gstRate: 12 }
    ]
  };

  var invoiceFigures = invoice.computeInvoiceFigures(order);
  var billedFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepStrictEqual(totalsOnly(invoiceFigures), {
    subtotal: 590,
    discount: 0,
    tax: 47.7,
    cgst: 23.85,
    sgst: 23.85,
    total: 637.7
  });
  assert.deepStrictEqual(invoiceFigures.rows.map(function (row) {
    return { gstPercent: row.gstPercent, lineTax: row.lineTax };
  }), [
    { gstPercent: 5, lineTax: 16.5 },
    { gstPercent: 12, lineTax: 31.2 }
  ]);
  assert.deepStrictEqual(totalsOnly(invoiceFigures), totalsOnly(billedFigures));
});

test('CURRENT BEHAVIOUR: #1002 SAVE10 invoice matches checkout discount and post-discount GST', function () {
  var order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      { id: 1, name: 'Indrayani Basmati Rice 5kg', price: 640, qty: 1, hsn: '1006', gstRate: 5 },
      { id: 4, name: 'Cold-Pressed Sunflower Oil 1L', price: 190, qty: 2, hsn: '1512', gstRate: 5 }
    ]
  };

  var invoiceFigures = invoice.computeInvoiceFigures(order);
  var billedFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepStrictEqual(totalsOnly(invoiceFigures), {
    subtotal: 1020,
    discount: 102,
    tax: 45.9,
    cgst: 22.95,
    sgst: 22.95,
    total: 963.9
  });
  assert.deepStrictEqual(invoiceFigures.rows.map(function (row) {
    return { gstPercent: row.gstPercent, lineTax: row.lineTax };
  }), [
    { gstPercent: 5, lineTax: 28.8 },
    { gstPercent: 5, lineTax: 17.1 }
  ]);
  assert.deepStrictEqual(totalsOnly(billedFigures), {
    subtotal: 1020,
    discount: 102,
    tax: 45.9,
    cgst: 22.95,
    sgst: 22.95,
    total: 963.9
  });
});

test('CURRENT BEHAVIOUR: #1004 invoice applies the SAVE10 cap and matches checkout', function () {
  var order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { id: 5, name: 'Cold-Pressed Groundnut Oil 5L', price: 1120, qty: 2, hsn: '1508', gstRate: 5 }
    ]
  };

  var invoiceFigures = invoice.computeInvoiceFigures(order);
  var billedFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepStrictEqual(totalsOnly(invoiceFigures), {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5
  });
  assert.deepStrictEqual(invoiceFigures.rows.map(function (row) {
    return { gstPercent: row.gstPercent, lineTax: row.lineTax };
  }), [
    { gstPercent: 5, lineTax: 104.5 }
  ]);
  assert.deepStrictEqual(totalsOnly(billedFigures), {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5
  });
});

test('CURRENT BEHAVIOUR: #1008 all-18% invoice matches checkout without a coupon', function () {
  var order = {
    id: 1008,
    coupon: '',
    items: [
      { id: 8, name: 'Assam CTC Masala Chai 250g', price: 140, qty: 1, hsn: '0902', gstRate: 18 },
      { id: 12, name: 'Kokum Sherbet Concentrate 750ml', price: 180, qty: 2, hsn: '2106', gstRate: 18 }
    ]
  };

  var invoiceFigures = invoice.computeInvoiceFigures(order);
  var billedFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepStrictEqual(totalsOnly(invoiceFigures), {
    subtotal: 500,
    discount: 0,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 590
  });
  assert.deepStrictEqual(invoiceFigures.rows.map(function (row) {
    return { gstPercent: row.gstPercent, lineTax: row.lineTax };
  }), [
    { gstPercent: 18, lineTax: 25.2 },
    { gstPercent: 18, lineTax: 64.8 }
  ]);
  assert.deepStrictEqual(totalsOnly(invoiceFigures), totalsOnly(billedFigures));
});

test('invoice matches checkout for mixed HSN GST slabs and a capped coupon', function () {
  var order = {
    id: 2001,
    coupon: 'SAVE10',
    items: [
      { id: 1, name: 'Indrayani Basmati Rice 5kg', price: 640, qty: 2, hsn: '1006' },
      { id: 6, name: 'A2 Gir Cow Ghee 500ml', price: 450, qty: 2, hsn: '0405' },
      { id: 8, name: 'Assam CTC Masala Chai 250g', price: 140, qty: 1, hsn: '0902' }
    ]
  };

  var invoiceFigures = invoice.computeInvoiceFigures(order);
  var billedFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepStrictEqual(totalsOnly(invoiceFigures), {
    subtotal: 2320,
    discount: 150,
    tax: 184.45,
    cgst: 92.23,
    sgst: 92.22,
    total: 2354.45
  });
  assert.deepStrictEqual(invoiceFigures.rows.map(function (row) {
    return { gstPercent: row.gstPercent, lineTax: row.lineTax };
  }), [
    { gstPercent: 5, lineTax: 59.86 },
    { gstPercent: 12, lineTax: 101.02 },
    { gstPercent: 18, lineTax: 23.57 }
  ]);
  assert.deepStrictEqual(totalsOnly(invoiceFigures), totalsOnly(billedFigures));
});
