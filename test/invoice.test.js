const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function figures(order) {
  return {
    printed: invoice.computeInvoiceFigures(order),
    billed: pricing.computeTotals(order.items, order.coupon)
  };
}

function amounts({ subtotal, discount, tax, cgst, sgst, total }) {
  return { subtotal, discount, tax, cgst, sgst, total };
}

function invoiceGst(rows) {
  return rows.map(({ hsn, gstPercent, lineTax }) => ({ hsn, gstPercent, lineTax }));
}

test('invoice matches checkout for mixed GST slabs with a capped coupon', () => {
  const { printed, billed } = figures({ coupon: 'SAVE10', items: [
    { name: 'Rice', hsn: '1006', price: 640, qty: 2 },
    { name: 'Butter', hsn: '0405', price: 260, qty: 2 }
  ] });
  assert.equal(billed.discount, 150);
  assert.deepEqual(amounts(printed), amounts(billed));
  assert.deepEqual(invoiceGst(printed.rows), billed.lines.map(line => ({
    hsn: line.hsn, gstPercent: line.gstPercent, lineTax: line.tax
  })));
});

test('#1001 prints the 5% and 12% HSN slabs', () => {
  const { printed, billed } = figures({ id: 1001, coupon: '', items: [
    { name: 'Dal', hsn: '0713', price: 165, qty: 2 },
    { name: 'Butter', hsn: '0405', price: 260, qty: 1 }
  ] });
  assert.deepEqual(invoiceGst(printed.rows), [
    { hsn: '0713', gstPercent: 5, lineTax: 16.5 },
    { hsn: '0405', gstPercent: 12, lineTax: 31.2 }
  ]);
  assert.deepEqual(amounts(printed), amounts(billed));
  assert.deepEqual(amounts(billed), { subtotal: 590, discount: 0, tax: 47.7, cgst: 23.85, sgst: 23.85, total: 637.7 });
});

test('#1002 applies SAVE10 before GST', () => {
  const { printed, billed } = figures({ id: 1002, coupon: 'SAVE10', items: [
    { name: 'Rice', hsn: '1006', price: 640, qty: 1 },
    { name: 'Sunflower oil', hsn: '1512', price: 190, qty: 2 }
  ] });
  assert.deepEqual(invoiceGst(printed.rows), [
    { hsn: '1006', gstPercent: 5, lineTax: 28.8 },
    { hsn: '1512', gstPercent: 5, lineTax: 17.1 }
  ]);
  assert.deepEqual(amounts(printed), amounts(billed));
  assert.deepEqual(amounts(billed), { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 });
});

test('#1004 caps SAVE10 at 150', () => {
  const { printed, billed } = figures({ id: 1004, coupon: 'SAVE10', items: [
    { name: 'Groundnut oil', hsn: '1508', price: 1120, qty: 2 }
  ] });
  assert.deepEqual(invoiceGst(printed.rows), [
    { hsn: '1508', gstPercent: 5, lineTax: 104.5 }
  ]);
  assert.deepEqual(amounts(printed), amounts(billed));
  assert.deepEqual(amounts(billed), { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 });
});

test('CURRENT BEHAVIOUR: #1008 matches checkout at 18% without a coupon', () => {
  const { printed, billed } = figures({ id: 1008, coupon: '', items: [
    { name: 'Chai', hsn: '0902', price: 140, qty: 1 },
    { name: 'Kokum', hsn: '2106', price: 180, qty: 2 }
  ] });
  assert.deepEqual(invoiceGst(printed.rows), [
    { hsn: '0902', gstPercent: 18, lineTax: 25.2 },
    { hsn: '2106', gstPercent: 18, lineTax: 64.8 }
  ]);
  const expected = { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 };
  assert.deepEqual(amounts(printed), expected);
  assert.deepEqual(amounts(billed), expected);
});
