const test = require('node:test');
const assert = require('node:assert/strict');

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(name, price, qty, hsn, gstRate) {
  return { name, price, qty, hsn, gstRate };
}

test('CURRENT BEHAVIOUR: mixed 5% and 12% no-coupon invoice figures', function () {
  const items = [
    item('Rice', 640, 1, '1006', 5),
    item('Ghee', 450, 1, '0405', 12)
  ];
  const order = { items, coupon: '' };

  const actual = invoice.computeInvoiceFigures(order);
  const billed = pricing.computeTotals(items, '');

  assert.deepEqual(
    { subtotal: actual.subtotal, discount: actual.discount, tax: actual.tax, cgst: actual.cgst, sgst: actual.sgst, total: actual.total },
    { subtotal: 1090, discount: 0, tax: 86, cgst: 43, sgst: 43, total: 1176 }
  );
  assert.deepEqual(actual.rows.map((row) => [row.gstPercent, row.lineTax]), [[5, 32], [12, 54]]);
  assert.equal(billed.subtotal, 1090);
  assert.equal(billed.tax, 86);
  assert.equal(billed.total, 1176);
});

test('SAVE10 invoice applies discount before tax', function () {
  const items = [
    item('Rice', 640, 1, '1006', 5),
    item('Sunflower Oil', 190, 2, '1512', 5)
  ];
  const order = { items, coupon: 'SAVE10' };

  const actual = invoice.computeInvoiceFigures(order);
  const billed = pricing.computeTotals(items, 'SAVE10');

  assert.deepEqual(
    { subtotal: actual.subtotal, discount: actual.discount, tax: actual.tax, cgst: actual.cgst, sgst: actual.sgst, total: actual.total },
    { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 }
  );
  assert.deepEqual(actual.rows.map((row) => [row.gstPercent, row.lineTax]), [[5, 28.8], [5, 17.1]]);
  assert.deepEqual(
    { subtotal: billed.subtotal, discount: billed.discount, tax: billed.tax, total: billed.total },
    { subtotal: 1020, discount: 102, tax: 45.9, total: 963.9 }
  );
});

test('SAVE10 invoice respects the ₹150 maximum discount', function () {
  const items = [item('Groundnut Oil', 1120, 2, '1508', 5)];
  const order = { items, coupon: 'SAVE10' };

  const actual = invoice.computeInvoiceFigures(order);
  const billed = pricing.computeTotals(items, 'SAVE10');

  assert.deepEqual(
    { subtotal: actual.subtotal, discount: actual.discount, tax: actual.tax, cgst: actual.cgst, sgst: actual.sgst, total: actual.total },
    { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 }
  );
  assert.equal(actual.rows[0].gstPercent, 5);
  assert.equal(actual.rows[0].lineTax, 104.5);
  assert.deepEqual(
    { discount: billed.discount, tax: billed.tax, total: billed.total },
    { discount: 150, tax: 104.5, total: 2194.5 }
  );
});

test('CURRENT BEHAVIOUR: all-18% no-coupon invoice figures match checkout', function () {
  const items = [
    item('Packaged Tea', 140, 1, '0902', 18),
    item('Kokum Sherbet', 180, 2, '2106', 18)
  ];
  const order = { items, coupon: '' };

  const actual = invoice.computeInvoiceFigures(order);
  const billed = pricing.computeTotals(items, '');

  assert.deepEqual(
    { subtotal: actual.subtotal, discount: actual.discount, tax: actual.tax, cgst: actual.cgst, sgst: actual.sgst, total: actual.total },
    { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 }
  );
  assert.deepEqual(actual.rows.map((row) => [row.gstPercent, row.lineTax]), [[18, 25.2], [18, 64.8]]);
  assert.deepEqual(
    { subtotal: billed.subtotal, discount: billed.discount, tax: billed.tax, total: billed.total },
    { subtotal: 500, discount: 0, tax: 90, total: 590 }
  );
});

test('invoice figures match checkout totals and per-line GST for ticket cases', function () {
  const cases = [
    {
      items: [item('Rice', 640, 1, '1006', 5), item('Ghee', 450, 1, '0405', 12)],
      coupon: ''
    },
    {
      items: [item('Rice', 640, 1, '1006', 5), item('Sunflower Oil', 190, 2, '1512', 5)],
      coupon: 'SAVE10'
    },
    {
      items: [item('Groundnut Oil', 1120, 2, '1508', 5)],
      coupon: 'SAVE10'
    },
    {
      items: [item('Packaged Tea', 140, 1, '0902', 18), item('Kokum Sherbet', 180, 2, '2106', 18)],
      coupon: ''
    }
  ];

  cases.forEach(function (scenario) {
    const actual = invoice.computeInvoiceFigures({ items: scenario.items, coupon: scenario.coupon });
    const billed = pricing.computeTotals(scenario.items, scenario.coupon);

    assert.deepEqual(
      {
        subtotal: actual.subtotal,
        discount: actual.discount,
        tax: actual.tax,
        cgst: actual.cgst,
        sgst: actual.sgst,
        total: actual.total,
        rows: actual.rows.map((row) => [row.gstPercent, row.lineTax])
      },
      {
        subtotal: billed.subtotal,
        discount: billed.discount,
        tax: billed.tax,
        cgst: billed.cgst,
        sgst: billed.sgst,
        total: billed.total,
        rows: billed.lines.map((line) => [line.gstPercent, line.tax])
      }
    );
  });
});
