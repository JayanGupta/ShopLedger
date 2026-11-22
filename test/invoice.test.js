var { describe, it } = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function line(id, sku, name, hsn, price, qty) {
  return { id: id, sku: sku, name: name, hsn: hsn, price: price, qty: qty };
}

// In-memory orders shaped like routes/orders.js stores them, modelled on db orders.
var ORDERS = {
  1001: {
    id: 1001,
    date: '28/12/2021',
    customer: 'Meera Joshi',
    coupon: '',
    items: [
      line(8, 'BEV-001', 'Assam CTC Masala Chai 250g', '0902', 140, 2),
      line(2, 'GRN-002', 'Unpolished Toor Dal 1kg', '0713', 165, 2)
    ],
    subtotal: 610,
    discount: 0,
    tax: 66.9,
    total: 676.9
  },
  1002: {
    id: 1002,
    date: '05/01/2022',
    customer: 'Anil Kulkarni',
    coupon: 'SAVE10',
    items: [
      line(1, 'GRN-001', 'Indrayani Basmati Rice 5kg', '1006', 640, 1),
      line(4, 'OIL-001', 'Cold-Pressed Sunflower Oil 1L', '1512', 190, 2)
    ],
    subtotal: 1020,
    discount: 102,
    tax: 45.9,
    total: 963.9
  },
  1004: {
    id: 1004,
    date: '30/01/2022',
    customer: 'Kalyani Foods (Wholesale)',
    coupon: 'SAVE10',
    items: [
      line(5, 'OIL-002', 'Cold-Pressed Groundnut Oil 5L', '1508', 1120, 2)
    ],
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    total: 2194.5
  },
  1008: {
    id: 1008,
    date: '15/03/2022',
    customer: 'Walk-in',
    coupon: '',
    items: [
      line(8, 'BEV-001', 'Assam CTC Masala Chai 250g', '0902', 140, 1),
      line(12, 'BEV-003', 'Kokum Sherbet Concentrate 750ml', '2106', 180, 2)
    ],
    subtotal: 500,
    discount: 0,
    tax: 90,
    total: 590
  }
};

function assertMatchesCheckout(order) {
  var figures = invoice.computeInvoiceFigures(order);
  var checkout = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(
    {
      subtotal: figures.subtotal,
      discount: figures.discount,
      tax: figures.tax,
      total: figures.total
    },
    {
      subtotal: checkout.subtotal,
      discount: checkout.discount,
      tax: checkout.tax,
      total: checkout.total
    }
  );
  assert.equal(figures.subtotal, order.subtotal);
  assert.equal(figures.discount, order.discount);
  assert.equal(figures.tax, order.tax);
  assert.equal(figures.total, order.total);
  assert.equal(figures.rows.length, order.items.length);
  figures.rows.forEach(function (row, idx) {
    assert.equal(row.gstPercent, checkout.lines[idx].gstPercent);
    assert.equal(row.hsn, order.items[idx].hsn);
  });
  return figures;
}

describe('invoice figures match checkout', function () {
  it('uses each HSN slab when there is no coupon (#1001)', function () {
    var figures = assertMatchesCheckout(ORDERS[1001]);
    assert.deepEqual(figures.rows.map(function (row) { return row.gstPercent; }), [18, 5]);
  });

  it('applies SAVE10 before tax when the discount is under the cap (#1002)', function () {
    var figures = assertMatchesCheckout(ORDERS[1002]);
    assert.equal(figures.discount, 102);
    assert.equal(figures.tax, 45.9);
    assert.ok(figures.tax < 183.6);
  });

  it('caps SAVE10 at ₹150 before tax on a ₹2,240 order (#1004)', function () {
    var figures = assertMatchesCheckout(ORDERS[1004]);
    assert.equal(figures.discount, 150);
    assert.equal(figures.tax, 104.5);
    assert.equal(figures.rows[0].gstPercent, 5);
  });

  it('matches an all-18% order with no coupon (#1008)', function () {
    var figures = assertMatchesCheckout(ORDERS[1008]);
    assert.deepEqual(figures.rows.map(function (row) { return row.gstPercent; }), [18, 18]);
  });

  it('prints the checkout total and no reconciliation warning for #1002', function () {
    var html = invoice.render(ORDERS[1002]);
    assert.match(html, /₹963\.90/);
    assert.equal(html.indexOf('Accountant Reconciliation Notice'), -1);
  });
});
