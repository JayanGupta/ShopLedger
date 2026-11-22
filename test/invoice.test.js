'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(name, price, qty, hsn) {
  return { name, sku: name.toUpperCase().replace(/\s+/g, '-'), price, qty, hsn };
}

function assertInvoiceMatchesCheckout(order, expected) {
  const checkout = pricing.computeTotals(order.items, order.coupon);
  const figures = invoice.computeInvoiceFigures(order);

  assert.deepEqual(
    {
      subtotal: figures.subtotal,
      discount: figures.discount,
      taxable: figures.taxable,
      tax: figures.tax,
      cgst: figures.cgst,
      sgst: figures.sgst,
      total: figures.total
    },
    {
      subtotal: checkout.subtotal,
      discount: checkout.discount,
      taxable: checkout.taxable,
      tax: checkout.tax,
      cgst: checkout.cgst,
      sgst: checkout.sgst,
      total: checkout.total
    }
  );
  assert.deepEqual(
    [figures.subtotal, figures.discount, figures.taxable, figures.tax, figures.cgst, figures.sgst, figures.total],
    expected
  );
  assert.equal(Math.round(figures.rows.reduce((sum, row) => sum + row.lineTax, 0) * 100) / 100, figures.tax);
}

test('invoice matches checkout GST for a mixed 5% and 12% HSN order', function () {
  assertInvoiceMatchesCheckout({
    items: [item('Rice', 200, 1, '1006'), item('Ghee', 100, 1, '0405')], coupon: ''
  }, [300, 0, 300, 22, 11, 11, 322]);
});

test('invoice matches seeded #1002 SAVE10 billed total', function () {
  assertInvoiceMatchesCheckout({
    items: [item('Indrayani Basmati Rice', 640, 1, '1006'), item('Cold-Pressed Sunflower Oil', 190, 2, '1512')], coupon: 'SAVE10'
  }, [1020, 102, 918, 45.9, 22.95, 22.95, 963.9]);
});

test('invoice matches seeded #1004 SAVE10 cap on 5% items', function () {
  assertInvoiceMatchesCheckout({
    items: [item('Cold-Pressed Groundnut Oil', 1120, 2, '1508')], coupon: 'SAVE10'
  }, [2240, 150, 2090, 104.5, 52.25, 52.25, 2194.5]);
});

test('invoice matches seeded #1008 all-18% order without coupon', function () {
  assertInvoiceMatchesCheckout({
    items: [item('Assam CTC Masala Chai', 140, 1, '0902'), item('Kokum Sherbet Concentrate', 180, 2, '2106')], coupon: ''
  }, [500, 0, 500, 90, 45, 45, 590]);
});

test('invoice uses checkout coupon minimum rule', function () {
  assertInvoiceMatchesCheckout({
    items: [item('Rice', 400, 1, '1006')], coupon: 'SAVE10'
  }, [400, 0, 400, 20, 10, 10, 420]);
});

test('invoice renders taxable value and separate GST components', function () {
  const html = invoice.render({
    id: 44, items: [item('Rice', 200, 1, '1006'), item('Ghee', 100, 1, '0405')], coupon: '', total: 322
  });
  assert.match(html, /Taxable Amount/);
  assert.match(html, /CGST/);
  assert.match(html, /SGST/);
  assert.match(html, /₹322\.00/);
});
