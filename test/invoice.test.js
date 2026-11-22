const { test } = require('node:test');
const { strict: assert } = require('node:assert');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// An unset gstRate models a saved line that carries only its HSN for tax lookup.
function compareOrder(order, expectedCheckout, expectedInvoice, expectedRows) {
  const checkout = pricing.computeTotals(order.items, order.coupon);
  const printed = invoice.computeInvoiceFigures(order);

  assert.deepEqual({
    discount: checkout.discount,
    tax: checkout.tax,
    total: checkout.total
  }, expectedCheckout, 'checkout figures');

  assert.deepEqual({
    subtotal: printed.subtotal,
    discount: printed.discount,
    tax: printed.tax,
    cgst: printed.cgst,
    sgst: printed.sgst,
    total: printed.total
  }, expectedInvoice, 'invoice figures');

  const rows = printed.rows.map(({ hsn, gstPercent, lineTax }) => ({ hsn, gstPercent, lineTax }));
  assert.deepEqual(rows, expectedRows, 'GST breakdown on the invoice');
}

test('the workshop fixture modelled on order 1001 uses 5% and 12% HSN slabs', () => {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      { name: 'Rice', price: 100, qty: 2, hsn: '1006', gstRate: undefined },
      { name: 'Ghee', price: 150, qty: 1, hsn: '0405', gstRate: undefined }
    ]
  };

  compareOrder(order,
    { discount: 0, tax: 28, total: 378 },
    { subtotal: 350, discount: 0, tax: 28, cgst: 14, sgst: 14, total: 378 },
    [
      { hsn: '1006', gstPercent: 5, lineTax: 10 },
      { hsn: '0405', gstPercent: 12, lineTax: 18 }
    ]
  );
});

test('order 1002 applies SAVE10 before calculating line GST', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 640, qty: 1, hsn: '1006', gstRate: undefined },
      { name: 'Sunflower oil', price: 190, qty: 2, hsn: '1512', gstRate: undefined }
    ]
  };

  compareOrder(order,
    { discount: 102, tax: 45.90, total: 963.90 },
    { subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90 },
    [
      { hsn: '1006', gstPercent: 5, lineTax: 28.80 },
      { hsn: '1512', gstPercent: 5, lineTax: 17.10 }
    ]
  );
});

test('order 1004 caps SAVE10 at INR 150 before GST', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { name: 'Groundnut oil', price: 1120, qty: 2, hsn: '1508', gstRate: undefined }
    ]
  };

  compareOrder(order,
    { discount: 150, tax: 104.50, total: 2194.50 },
    { subtotal: 2240, discount: 150, tax: 104.50, cgst: 52.25, sgst: 52.25, total: 2194.50 },
    [{ hsn: '1508', gstPercent: 5, lineTax: 104.50 }]
  );
});

test('CURRENT BEHAVIOUR: order 1008 matches checkout for 18% items without a coupon', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      { name: 'Tea', price: 140, qty: 1, hsn: '0902', gstRate: 18 },
      { name: 'Syrup', price: 180, qty: 2, hsn: '2106', gstRate: undefined }
    ]
  };

  compareOrder(order,
    { discount: 0, tax: 90, total: 590 },
    { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 },
    [
      { hsn: '0902', gstPercent: 18, lineTax: 25.20 },
      { hsn: '2106', gstPercent: 18, lineTax: 64.80 }
    ]
  );
});

test('the printable invoice matches a mixed-slab checkout with a capped discount', () => {
  const order = {
    id: 42,
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 1000, qty: 1, hsn: '1006' },
      { name: 'Ghee', price: 1000, qty: 1, hsn: '0405' }
    ],
    subtotal: 2000,
    discount: 150,
    tax: 157.25,
    total: 2007.25
  };

  const printed = invoice.computeInvoiceFigures(order);
  assert.equal(printed.total, order.total, 'printed total must equal the amount billed');
  assert.equal(printed.tax, order.tax);
  assert.equal(printed.discount, order.discount);
  assert.deepEqual(printed.rows.map(row => row.lineTax), [46.25, 111]);
  assert.deepEqual([printed.cgst, printed.sgst], [78.63, 78.62]);

  const html = invoice.render(order);
  assert.match(html, /Invoice Total<\/td><td[^>]*>₹2007\.25</);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
});

test('the original order 1001 prints its recorded tea and dal GST', () => {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      { name: 'Tea', price: 140, qty: 2, hsn: '0902' },
      { name: 'Dal', price: 165, qty: 2, hsn: '0713' }
    ]
  };
  compareOrder(order,
    { discount: 0, tax: 66.90, total: 676.90 },
    { subtotal: 610, discount: 0, tax: 66.90, cgst: 33.45, sgst: 33.45, total: 676.90 },
    [
      { hsn: '0902', gstPercent: 18, lineTax: 50.40 },
      { hsn: '0713', gstPercent: 5, lineTax: 16.50 }
    ]
  );
});

test('reprints keep the recorded bill when a historical coupon is unavailable', () => {
  const order = {
    id: 7,
    coupon: 'RETIRED',
    items: [{ name: 'Rice', price: 1000, qty: 1, hsn: '1006' }],
    subtotal: 1000, discount: 100, tax: 45, total: 945
  };
  const html = invoice.render(order);
  assert.match(html, /Invoice Total<\/td><td[^>]*>₹945\.00</);
  assert.match(html, /Total GST\)<\/td><td[^>]*>₹45\.00</);
  assert.match(html, /Coupon Discount \(RETIRED\)<\/td><td[^>]*>-₹100\.00</);
  assert.match(html, /original per-item GST breakdown was not recorded/i);
  assert.doesNotMatch(html, /₹50\.00|₹1050\.00/);
  assert.equal(invoice.computeInvoiceFigures(order).total, 1050, 'audit can still detect the discrepancy');
});
