'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');

test('invoice reproduces capped checkout discount and HSN GST figures', function () {
  const order = {
    coupon: 'WHOLESALE15',
    items: [
      { id: 1, name: 'Rice', sku: 'RICE', hsn: '1006', price: 1000, qty: 1 },
      { id: 2, name: 'Ghee', sku: 'GHEE', hsn: '0405', price: 1000, qty: 1 },
      { id: 3, name: 'Tea', sku: 'TEA', hsn: '0902', price: 1000, qty: 1 }
    ]
  };

  const figures = invoice.computeInvoiceFigures(order);

  assert.equal(figures.subtotal, 3000);
  assert.equal(figures.discount, 400);
  assert.equal(figures.tax, 303.33);
  assert.equal(figures.cgst, 151.67);
  assert.equal(figures.sgst, 151.66);
  assert.equal(figures.total, 2903.33);
  assert.deepEqual(figures.rows.map(function (row) {
    return [row.gstPercent, row.discount, row.taxable, row.lineTax];
  }), [
    [5, 133.33, 866.67, 43.33],
    [12, 133.33, 866.67, 104],
    [18, 133.33, 866.67, 156]
  ]);

  const html = invoice.render(order);
  assert.match(html, /Coupon Off/);
  assert.match(html, /Taxable/);
  assert.match(html, /&#8377;866\.67/);
  assert.match(html, /Coupon Discount \(WHOLESALE15\).*400\.00/);
  assert.match(html, /Gross Subtotal.*3000\.00/);
  assert.match(html, /Total GST.*303\.33/);
  assert.match(html, /Invoice Total.*2903\.33/);
  assert.match(html, /5%<\/td>/);
  assert.match(html, /12%<\/td>/);
  assert.match(html, /18%<\/td>/);
});
