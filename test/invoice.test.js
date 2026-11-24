var assert = require('node:assert');
var test = require('node:test');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function item(id, name, price, qty, hsn, gstRate) {
  return {
    id: id,
    sku: 'SKU-' + id,
    name: name,
    price: price,
    qty: qty,
    hsn: hsn,
    gstRate: gstRate
  };
}

function figuresFor(order) {
  return {
    invoice: invoice.computeInvoiceFigures(order),
    pricing: pricing.computeTotals(order.items, order.coupon)
  };
}

test('invoice uses the same capped coupon and HSN GST figures as checkout for #1004', function () {
  var order = {
    id: '1004',
    coupon: 'SAVE10',
    items: [{
      id: 5,
      sku: 'OIL-002',
      name: 'Cold-Pressed Groundnut Oil 5L',
      hsn: '1508',
      price: 1120,
      qty: 2
    }]
  };
  var result = figuresFor(order);

  assert.deepStrictEqual(result.invoice, {
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
  assert.deepStrictEqual(result.invoice, {
    subtotal: result.pricing.subtotal,
    discount: result.pricing.discount,
    tax: result.pricing.tax,
    cgst: result.pricing.cgst,
    sgst: result.pricing.sgst,
    total: result.pricing.total,
    rows: [
      { name: 'Cold-Pressed Groundnut Oil 5L', sku: 'OIL-002', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  });
});

test('CURRENT BEHAVIOUR: #1001 mixed 5% and 12% items without a coupon matches checkout figures', function () {
  var order = {
    id: '1001',
    items: [
      item('rice', 'Rice', 600, 1, '1006', 5),
      item('ghee', 'Ghee', 500, 1, '0405', 12)
    ]
  };
  var result = figuresFor(order);

  assert.deepStrictEqual(result.invoice, {
    subtotal: 1100,
    discount: 0,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 1190,
    rows: [
      { name: 'Rice', sku: 'SKU-rice', hsn: '1006', qty: 1, price: 600, gstPercent: 5, line: 600, lineTax: 30 },
      { name: 'Ghee', sku: 'SKU-ghee', hsn: '0405', qty: 1, price: 500, gstPercent: 12, line: 500, lineTax: 60 }
    ]
  });
  assert.strictEqual(result.invoice.total, result.pricing.total);
  assert.strictEqual(result.invoice.tax, result.pricing.tax);
});

test('#1002 SAVE10 applies the coupon before calculating invoice GST', function () {
  var order = {
    id: '1002',
    coupon: 'SAVE10',
    items: [
      item('rice', 'Rice', 600, 1, '1006', 5),
      item('ghee', 'Ghee', 500, 1, '0405', 12)
    ]
  };
  var result = figuresFor(order);

  assert.deepStrictEqual(result.invoice, {
    subtotal: 1100,
    discount: 110,
    tax: 81,
    cgst: 40.5,
    sgst: 40.5,
    total: 1071,
    rows: [
      { name: 'Rice', sku: 'SKU-rice', hsn: '1006', qty: 1, price: 600, gstPercent: 5, line: 600, lineTax: 27 },
      { name: 'Ghee', sku: 'SKU-ghee', hsn: '0405', qty: 1, price: 500, gstPercent: 12, line: 500, lineTax: 54 }
    ]
  });
  assert.strictEqual(result.invoice.total, result.pricing.total);
  assert.strictEqual(result.invoice.tax, result.pricing.tax);
});

test('#1004 SAVE10 invoice observes the ₹150 discount cap on a ₹2,240 sale', function () {
  var order = {
    id: '1004',
    coupon: 'SAVE10',
    items: [item('tea', 'Packaged Tea', 1120, 2, '0902', 18)]
  };
  var result = figuresFor(order);

  assert.deepStrictEqual(result.invoice, {
    subtotal: 2240,
    discount: 150,
    tax: 376.2,
    cgst: 188.1,
    sgst: 188.1,
    total: 2466.2,
    rows: [
      { name: 'Packaged Tea', sku: 'SKU-tea', hsn: '0902', qty: 2, price: 1120, gstPercent: 18, line: 2240, lineTax: 376.2 }
    ]
  });
  assert.strictEqual(result.invoice.discount, result.pricing.discount);
  assert.strictEqual(result.invoice.tax, result.pricing.tax);
  assert.strictEqual(result.invoice.total, result.pricing.total);
});

test('CURRENT BEHAVIOUR: #1008 all-18% items without a coupon matches checkout figures', function () {
  var order = {
    id: '1008',
    items: [
      item('tea', 'Packaged Tea', 1000, 1, '0902', 18),
      item('coffee', 'Coffee Blend', 500, 1, '0901', 18)
    ]
  };
  var result = figuresFor(order);

  assert.deepStrictEqual(result.invoice, {
    subtotal: 1500,
    discount: 0,
    tax: 270,
    cgst: 135,
    sgst: 135,
    total: 1770,
    rows: [
      { name: 'Packaged Tea', sku: 'SKU-tea', hsn: '0902', qty: 1, price: 1000, gstPercent: 18, line: 1000, lineTax: 180 },
      { name: 'Coffee Blend', sku: 'SKU-coffee', hsn: '0901', qty: 1, price: 500, gstPercent: 18, line: 500, lineTax: 90 }
    ]
  });
  assert.strictEqual(result.invoice.total, result.pricing.total);
  assert.strictEqual(result.invoice.tax, result.pricing.tax);
});
