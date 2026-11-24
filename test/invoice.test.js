const test = require('node:test');
const assert = require('node:assert/strict');

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(name, price, qty, hsn, gstRate) {
  return { name, sku: name.toUpperCase().replace(/ /g, '-'), price, qty, hsn, gstRate };
}

function figures(order) {
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutFigures = pricing.computeTotals(order.items, order.coupon);
  return { invoiceFigures, checkoutFigures };
}

function assertInvoice(actual, expected) {
  assert.deepEqual(actual, expected);
}

function assertCheckout(actual, expected) {
  assert.deepEqual(
    {
      subtotal: actual.subtotal,
      discount: actual.discount,
      tax: actual.tax,
      cgst: actual.cgst,
      sgst: actual.sgst,
      total: actual.total
    },
    expected
  );
}

test('CURRENT BEHAVIOUR: #1001 with 5% and 12% items and no coupon', () => {
  const order = {
    id: 1001,
    coupon: '',
    items: [item('Rice', 640, 1, '1006', 5), item('Ghee', 450, 1, '0405', 12)]
  };
  const { invoiceFigures, checkoutFigures } = figures(order);

  assertInvoice(invoiceFigures, {
    subtotal: 1090,
    discount: 0,
    tax: 86,
    cgst: 43,
    sgst: 43,
    total: 1176,
    rows: [
      { name: 'Rice', sku: 'RICE', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 32 },
      { name: 'Ghee', sku: 'GHEE', hsn: '0405', qty: 1, price: 450, gstPercent: 12, line: 450, lineTax: 54 }
    ]
  });
  assertCheckout(checkoutFigures, {
    subtotal: 1090, discount: 0, tax: 86, cgst: 43, sgst: 43, total: 1176
  });
});

test('CURRENT BEHAVIOUR: #1002 with SAVE10 matches checkout totals and discounted GST', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [item('Rice', 1000, 1, '1006', 5), item('Ghee', 500, 1, '0405', 12)]
  };
  const { invoiceFigures, checkoutFigures } = figures(order);

  assertInvoice(invoiceFigures, {
    subtotal: 1500,
    discount: 150,
    tax: 99,
    cgst: 49.5,
    sgst: 49.5,
    total: 1449,
    rows: [
      { name: 'Rice', sku: 'RICE', hsn: '1006', qty: 1, price: 1000, gstPercent: 5, line: 1000, lineTax: 45 },
      { name: 'Ghee', sku: 'GHEE', hsn: '0405', qty: 1, price: 500, gstPercent: 12, line: 500, lineTax: 54 }
    ]
  });
  assertCheckout(checkoutFigures, {
    subtotal: 1500, discount: 150, tax: 99, cgst: 49.5, sgst: 49.5, total: 1449
  });
});

test('CURRENT BEHAVIOUR: #1004 SAVE10 on ₹2,240 applies the ₹150 cap', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [item('Rice', 1000, 1, '1006', 5), item('Ghee', 1240, 1, '0405', 12)]
  };
  const { invoiceFigures, checkoutFigures } = figures(order);

  assertInvoice(invoiceFigures, {
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
  });
  assertCheckout(checkoutFigures, {
    subtotal: 2240, discount: 150, tax: 185.49, cgst: 92.75, sgst: 92.74, total: 2275.49
  });
});

test('CURRENT BEHAVIOUR: #1008 with all 18% items and no coupon', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [item('Tea', 1000, 1, '0902', 18)]
  };
  const { invoiceFigures, checkoutFigures } = figures(order);

  assertInvoice(invoiceFigures, {
    subtotal: 1000,
    discount: 0,
    tax: 180,
    cgst: 90,
    sgst: 90,
    total: 1180,
    rows: [
      { name: 'Tea', sku: 'TEA', hsn: '0902', qty: 1, price: 1000, gstPercent: 18, line: 1000, lineTax: 180 }
    ]
  });
  assertCheckout(checkoutFigures, {
    subtotal: 1000, discount: 0, tax: 180, cgst: 90, sgst: 90, total: 1180
  });
});

test('invoice matches checkout for stored #1004 HSN and capped coupon', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    total: 2194.5,
    items: [{
      id: 5,
      name: 'Cold-Pressed Groundnut Oil 5L',
      sku: 'OIL-002',
      hsn: '1508',
      price: 1120,
      qty: 2
    }]
  };
  const { invoiceFigures, checkoutFigures } = figures(order);

  assertInvoice(invoiceFigures, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [{
      name: 'Cold-Pressed Groundnut Oil 5L',
      sku: 'OIL-002',
      hsn: '1508',
      qty: 2,
      price: 1120,
      gstPercent: 5,
      line: 2240,
      lineTax: 104.5
    }]
  });
  assertCheckout(checkoutFigures, {
    subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5
  });
  assert.equal(invoiceFigures.rows.reduce((sum, row) => sum + row.lineTax, 0), invoiceFigures.tax);

  const recordedTaxOrder = Object.assign({}, order, { tax: 107.25 });
  const recordedTaxFigures = invoice.computeInvoiceFigures(recordedTaxOrder);
  assert.equal(recordedTaxFigures.rows.reduce((sum, row) => sum + row.lineTax, 0), 104.5);
  assert.match(invoice.render(recordedTaxOrder), /GST reconciliation adjustment/);

  const savedDiscountOrder = {
    coupon: 'SAVE10',
    subtotal: 1500,
    discount: 100,
    tax: 102.67,
    total: 1502.67,
    items: [item('Rice', 1000, 1, '1006', 5), item('Ghee', 500, 1, '0405', 12)]
  };
  assert.deepEqual(
    invoice.computeInvoiceFigures(savedDiscountOrder).rows.map((row) => row.lineTax),
    [46.67, 56]
  );

  const inconsistentOrder = Object.assign({}, order, { total: 2195.5 });
  const inconsistentInvoice = invoice.render(inconsistentOrder);
  assert.match(inconsistentInvoice, /Accountant Reconciliation Notice/);
  assert.match(inconsistentInvoice, /Component Total/);
  assert.match(inconsistentInvoice, /Recorded-total adjustment/);
  assert.match(inconsistentInvoice, /Amount Billed \(Recorded\)/);
  const missingTotal = Object.assign({}, inconsistentOrder, { total: undefined, tax: 107.25 });
  const missingTotalInvoice = invoice.render(missingTotal);
  assert.match(missingTotalInvoice, /₹2197\.25/);
  assert.doesNotMatch(missingTotalInvoice, /NaN/);
});
