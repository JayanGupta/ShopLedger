var test = require('node:test');
var assert = require('node:assert/strict');

var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function calculate(order) {
  return {
    invoice: invoice.computeInvoiceFigures(order),
    pricing: pricing.computeTotals(order.items, order.coupon)
  };
}

test('EXPECTED BEHAVIOUR: an HSN-only order invoice matches checkout GST and total', function () {
  var order = {
    id: 1001,
    coupon: '',
    items: [
      { name: 'Rice', price: 640, qty: 1, hsn: '1006', gstRate: undefined },
      { name: 'Ghee', price: 450, qty: 1, hsn: '0405', gstRate: undefined }
    ]
  };
  var result = calculate(order);

  assert.deepStrictEqual(result.invoice, {
    subtotal: 1090,
    discount: 0,
    tax: 86,
    cgst: 43,
    sgst: 43,
    total: 1176,
    rows: [
      { name: 'Rice', sku: '-', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 32 },
      { name: 'Ghee', sku: '-', hsn: '0405', qty: 1, price: 450, gstPercent: 12, line: 450, lineTax: 54 }
    ]
  });
  assert.deepStrictEqual({
    subtotal: result.pricing.subtotal,
    discount: result.pricing.discount,
    tax: result.pricing.tax,
    cgst: result.pricing.cgst,
    sgst: result.pricing.sgst,
    total: result.pricing.total
  }, {
    subtotal: 1090,
    discount: 0,
    tax: 86,
    cgst: 43,
    sgst: 43,
    total: 1176
  });
});

test('CURRENT BEHAVIOUR: an inactive historical coupon preserves the saved checkout discount', function () {
  var order = {
    id: 1010,
    coupon: 'DIWALI20',
    subtotal: 2000,
    discount: 250,
    tax: 87.5,
    total: 1837.5,
    items: [
      { name: 'Rice', price: 1000, qty: 2, hsn: '1006', gstRate: undefined }
    ]
  };
  var result = calculate(order);

  assert.deepStrictEqual(result.invoice, {
    subtotal: 2000,
    discount: 250,
    tax: 87.5,
    cgst: 43.75,
    sgst: 43.75,
    total: 1837.5,
    rows: [
      { name: 'Rice', sku: '-', hsn: '1006', qty: 2, price: 1000, gstPercent: 5, line: 2000, lineTax: 87.5 }
    ]
  });
  assert.strictEqual(result.pricing.discount, 0);
});

test('CURRENT BEHAVIOUR: #1001 5% and 12% lines without a coupon use each line gstRate on the invoice', function () {
  var order = {
    id: 1001,
    coupon: '',
    items: [
      { name: 'Rice', price: 640, qty: 1, hsn: '1006', gstRate: 5 },
      { name: 'Ghee', price: 450, qty: 1, hsn: '0405', gstRate: 12 }
    ]
  };
  var result = calculate(order);

  assert.deepStrictEqual(result.invoice, {
    subtotal: 1090,
    discount: 0,
    tax: 86,
    cgst: 43,
    sgst: 43,
    total: 1176,
    rows: [
      { name: 'Rice', sku: '-', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 32 },
      { name: 'Ghee', sku: '-', hsn: '0405', qty: 1, price: 450, gstPercent: 12, line: 450, lineTax: 54 }
    ]
  });
  assert.deepStrictEqual(result.pricing, {
    subtotal: 1090,
    discount: 0,
    taxable: 1090,
    tax: 86,
    cgst: 43,
    sgst: 43,
    total: 1176,
    lines: [
      { id: undefined, name: 'Rice', hsn: '1006', gstPercent: 5, gross: 640, discount: 0, taxable: 640, tax: 32, net: 672 },
      { id: undefined, name: 'Ghee', hsn: '0405', gstPercent: 12, gross: 450, discount: 0, taxable: 450, tax: 54, net: 504 }
    ]
  });
});

test('CURRENT BEHAVIOUR: #1002 SAVE10 invoice figures match the post-discount checkout calculation', function () {
  var order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 640, qty: 1, hsn: '1006', gstRate: 5 },
      { name: 'Sunflower oil', price: 190, qty: 2, hsn: '1512', gstRate: 5 }
    ]
  };
  var result = calculate(order);

  assert.deepStrictEqual(result.invoice, {
    subtotal: 1020,
    discount: 102,
    tax: 45.9,
    cgst: 22.95,
    sgst: 22.95,
    total: 963.9,
    rows: [
      { name: 'Rice', sku: '-', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
      { name: 'Sunflower oil', sku: '-', hsn: '1512', qty: 2, price: 190, gstPercent: 5, line: 380, lineTax: 17.1 }
    ]
  });
  assert.deepStrictEqual(result.pricing, {
    subtotal: 1020,
    discount: 102,
    taxable: 918,
    tax: 45.9,
    cgst: 22.95,
    sgst: 22.95,
    total: 963.9,
    lines: [
      { id: undefined, name: 'Rice', hsn: '1006', gstPercent: 5, gross: 640, discount: 64, taxable: 576, tax: 28.8, net: 604.8 },
      { id: undefined, name: 'Sunflower oil', hsn: '1512', gstPercent: 5, gross: 380, discount: 38, taxable: 342, tax: 17.1, net: 359.1 }
    ]
  });
});

test('CURRENT BEHAVIOUR: #1004 SAVE10 invoice figures use the ₹150 checkout discount cap', function () {
  var order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { name: 'Groundnut oil', price: 1120, qty: 2, hsn: '1508', gstRate: 5 }
    ]
  };
  var result = calculate(order);

  assert.deepStrictEqual(result.invoice, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      { name: 'Groundnut oil', sku: '-', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  });
  assert.deepStrictEqual(result.pricing, {
    subtotal: 2240,
    discount: 150,
    taxable: 2090,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    lines: [
      { id: undefined, name: 'Groundnut oil', hsn: '1508', gstPercent: 5, gross: 2240, discount: 150, taxable: 2090, tax: 104.5, net: 2194.5 }
    ]
  });
});

test('CURRENT BEHAVIOUR: #1008 all-18% lines without a coupon match invoice and pricing totals', function () {
  var order = {
    id: 1008,
    coupon: '',
    items: [
      { name: 'Tea', price: 140, qty: 1, hsn: '0902', gstRate: 18 },
      { name: 'Kokum sherbet', price: 180, qty: 2, hsn: '2106', gstRate: 18 }
    ]
  };
  var result = calculate(order);

  assert.deepStrictEqual(result.invoice, {
    subtotal: 500,
    discount: 0,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 590,
    rows: [
      { name: 'Tea', sku: '-', hsn: '0902', qty: 1, price: 140, gstPercent: 18, line: 140, lineTax: 25.2 },
      { name: 'Kokum sherbet', sku: '-', hsn: '2106', qty: 2, price: 180, gstPercent: 18, line: 360, lineTax: 64.8 }
    ]
  });
  assert.deepStrictEqual(result.pricing, {
    subtotal: 500,
    discount: 0,
    taxable: 500,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 590,
    lines: [
      { id: undefined, name: 'Tea', hsn: '0902', gstPercent: 18, gross: 140, discount: 0, taxable: 140, tax: 25.2, net: 165.2 },
      { id: undefined, name: 'Kokum sherbet', hsn: '2106', gstPercent: 18, gross: 360, discount: 0, taxable: 360, tax: 64.8, net: 424.8 }
    ]
  });
});
