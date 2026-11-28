'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(name, price, qty, hsn, gstRate) {
  return { name, sku: name.toUpperCase().replace(/\s+/g, '-'), price, qty, hsn, gstRate };
}

function compareOrder(id, items, coupon, expectedInvoice, expectedCheckout) {
  const order = { id, items, coupon };
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutFigures = pricing.computeTotals(items, coupon);

  assert.deepEqual(invoiceFigures, expectedInvoice);
  assert.deepEqual(checkoutFigures, expectedCheckout);
}

test('CURRENT BEHAVIOUR: #1001 invoice uses supplied 5% and 12% rates without a coupon', function () {
  const items = [item('Rice', 100, 1, '1006', 5), item('Ghee', 100, 1, '0405', 12)];

  compareOrder(1001, items, '', {
    subtotal: 200,
    discount: 0,
    tax: 17,
    cgst: 8.5,
    sgst: 8.5,
    total: 217,
    rows: [
      { name: 'Rice', sku: 'RICE', hsn: '1006', qty: 1, price: 100, gstPercent: 5, line: 100, lineTax: 5 },
      { name: 'Ghee', sku: 'GHEE', hsn: '0405', qty: 1, price: 100, gstPercent: 12, line: 100, lineTax: 12 }
    ]
  }, {
    subtotal: 200,
    discount: 0,
    taxable: 200,
    tax: 17,
    cgst: 8.5,
    sgst: 8.5,
    total: 217,
    lines: [
      { id: undefined, name: 'Rice', hsn: '1006', gstPercent: 5, gross: 100, discount: 0, taxable: 100, tax: 5, net: 105 },
      { id: undefined, name: 'Ghee', hsn: '0405', gstPercent: 12, gross: 100, discount: 0, taxable: 100, tax: 12, net: 112 }
    ]
  });
});

test('invoice #1002 applies SAVE10 before GST like checkout', function () {
  const items = [item('Rice', 500, 1, '1006', 5), item('Tea', 500, 1, '0902', 18)];

  compareOrder(1002, items, 'SAVE10', {
    subtotal: 1000,
    discount: 100,
    tax: 103.5,
    cgst: 51.75,
    sgst: 51.75,
    total: 1003.5,
    rows: [
      { name: 'Rice', sku: 'RICE', hsn: '1006', qty: 1, price: 500, gstPercent: 5, line: 500, lineTax: 22.5 },
      { name: 'Tea', sku: 'TEA', hsn: '0902', qty: 1, price: 500, gstPercent: 18, line: 500, lineTax: 81 }
    ]
  }, {
    subtotal: 1000,
    discount: 100,
    taxable: 900,
    tax: 103.5,
    cgst: 51.75,
    sgst: 51.75,
    total: 1003.5,
    lines: [
      { id: undefined, name: 'Rice', hsn: '1006', gstPercent: 5, gross: 500, discount: 50, taxable: 450, tax: 22.5, net: 472.5 },
      { id: undefined, name: 'Tea', hsn: '0902', gstPercent: 18, gross: 500, discount: 50, taxable: 450, tax: 81, net: 531 }
    ]
  });
});

test('invoice #1004 honors SAVE10 maximum discount before GST', function () {
  const items = [item('Rice', 1000, 1, '1006', 5), item('Ghee', 1240, 1, '0405', 12)];

  compareOrder(1004, items, 'SAVE10', {
    subtotal: 2240,
    discount: 150,
    tax: 185.49,
    cgst: 92.75,
    sgst: 92.74,
    total: 2275.49,
    rows: [
      { name: 'Rice', sku: 'RICE', hsn: '1006', qty: 1, price: 1000, gstPercent: 5, line: 1000, lineTax: 46.65 },
      { name: 'Ghee', sku: 'GHEE', hsn: '0405', qty: 1, price: 1240, gstPercent: 12, line: 1240, lineTax: 138.84 }
    ]
  }, {
    subtotal: 2240,
    discount: 150,
    taxable: 2090,
    tax: 185.49,
    cgst: 92.75,
    sgst: 92.74,
    total: 2275.49,
    lines: [
      { id: undefined, name: 'Rice', hsn: '1006', gstPercent: 5, gross: 1000, discount: 66.96, taxable: 933.04, tax: 46.65, net: 979.69 },
      { id: undefined, name: 'Ghee', hsn: '0405', gstPercent: 12, gross: 1240, discount: 83.04, taxable: 1156.96, tax: 138.84, net: 1295.8 }
    ]
  });
});

test('CURRENT BEHAVIOUR: #1008 all-18% invoice and checkout figures agree without a coupon', function () {
  const items = [item('Tea', 140, 2, '0902', 18), item('Coffee', 80, 1, '0901', 18)];

  compareOrder(1008, items, '', {
    subtotal: 360,
    discount: 0,
    tax: 64.8,
    cgst: 32.4,
    sgst: 32.4,
    total: 424.8,
    rows: [
      { name: 'Tea', sku: 'TEA', hsn: '0902', qty: 2, price: 140, gstPercent: 18, line: 280, lineTax: 50.4 },
      { name: 'Coffee', sku: 'COFFEE', hsn: '0901', qty: 1, price: 80, gstPercent: 18, line: 80, lineTax: 14.4 }
    ]
  }, {
    subtotal: 360,
    discount: 0,
    taxable: 360,
    tax: 64.8,
    cgst: 32.4,
    sgst: 32.4,
    total: 424.8,
    lines: [
      { id: undefined, name: 'Tea', hsn: '0902', gstPercent: 18, gross: 280, discount: 0, taxable: 280, tax: 50.4, net: 330.4 },
      { id: undefined, name: 'Coffee', hsn: '0901', gstPercent: 18, gross: 80, discount: 0, taxable: 80, tax: 14.4, net: 94.4 }
    ]
  });
});

test('invoice #1004 matches checkout HSN GST and capped SAVE10 figures', function () {
  const items = [item('Groundnut Oil', 1120, 2, '1508', undefined)];
  const order = { id: 1004, items, coupon: 'SAVE10' };
  const checkout = pricing.computeTotals(items, order.coupon);
  const figures = invoice.computeInvoiceFigures(order);
  const html = invoice.render(Object.assign({}, order, { total: checkout.total }));

  assert.equal(figures.subtotal, checkout.subtotal);
  assert.equal(figures.discount, checkout.discount);
  assert.equal(figures.tax, checkout.tax);
  assert.equal(figures.total, checkout.total);
  assert.deepEqual(figures.rows.map(function (row) {
    return { gstPercent: row.gstPercent, tax: row.lineTax };
  }), checkout.lines.map(function (line) {
    return { gstPercent: line.gstPercent, tax: line.tax };
  }));
  assert.match(html, /5%/);
  assert.match(html, /₹104\.50/);
  assert.match(html, /₹2090\.00/);
  assert.match(html, /₹2194\.50/);
  assert.ok(html.indexOf('Coupon Discount (SAVE10)') < html.indexOf('Taxable Subtotal'));
  assert.ok(html.indexOf('Taxable Subtotal') < html.indexOf('CGST + SGST (Total GST)'));
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
});
