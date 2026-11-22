// Characterization tests for lib/invoice.js (ticket #1: invoice total and GST breakdown
// do not match what the customer was billed).
// They pin what the code does TODAY. Tests named "CURRENT BEHAVIOUR:" record behaviour that
// looks wrong. All data is in memory: data/db.json is never read or written.
const { test } = require('node:test');
const assert = require('node:assert').strict;

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// Order lines exactly as checkout stores them (routes/orders.js): no gstRate field.
const ITEM = {
  chai: { id: 8, sku: 'BEV-001', name: 'Assam CTC Masala Chai 250g', hsn: '0902', price: 140 }, // 18%
  dal: { id: 2, sku: 'GRN-002', name: 'Unpolished Toor Dal 1kg', hsn: '0713', price: 165 }, // 5%
  rice: { id: 1, sku: 'GRN-001', name: 'Indrayani Basmati Rice 5kg', hsn: '1006', price: 640 }, // 5%
  sunOil: { id: 4, sku: 'OIL-001', name: 'Cold-Pressed Sunflower Oil 1L', hsn: '1512', price: 190 }, // 5%
  butter: { id: 7, sku: 'DRY-002', name: 'Pasteurized Table Butter 500g', hsn: '0405', price: 260 }, // 12%
  gnOil: { id: 5, sku: 'OIL-002', name: 'Cold-Pressed Groundnut Oil 5L', hsn: '1508', price: 1120 }, // 5%
  kokum: { id: 12, sku: 'BEV-003', name: 'Kokum Sherbet Concentrate 750ml', hsn: '2106', price: 180 }, // 18%
  ghee: { id: 6, sku: 'DRY-001', name: 'A2 Gir Cow Ghee 500ml', hsn: '0405', price: 450 }, // 12%
  coffee: { id: 9, sku: 'BEV-002', name: 'Filter Coffee Decoction Blend 500g', hsn: '0901', price: 310 }, // 18%
};
const line = (key, qty) => Object.assign({}, ITEM[key], { qty });

// In-memory copies of the 8 seed orders, with the figures checkout billed (the ledger).
const ORDERS = [
  { id: 1001, coupon: '', items: [line('chai', 2), line('dal', 2)], subtotal: 610, discount: 0, tax: 66.9, total: 676.9 },
  { id: 1002, coupon: 'SAVE10', items: [line('rice', 1), line('sunOil', 2)], subtotal: 1020, discount: 102, tax: 45.9, total: 963.9 },
  { id: 1003, coupon: 'FLAT50', items: [line('butter', 1), line('chai', 1)], subtotal: 400, discount: 50, tax: 49.35, total: 399.35 },
  { id: 1004, coupon: 'SAVE10', items: [line('gnOil', 2)], subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5 },
  { id: 1005, coupon: 'FLAT50', items: [line('rice', 1), line('kokum', 2)], subtotal: 1000, discount: 50, tax: 91.96, total: 1041.96 },
  { id: 1006, coupon: 'WELCOME', items: [line('ghee', 2), line('coffee', 1)], subtotal: 1210, discount: 60.5, tax: 155.61, total: 1305.11 },
  { id: 1007, coupon: '', items: [line('ghee', 2), line('sunOil', 2)], subtotal: 1280, discount: 0, tax: 127, total: 1407 },
  { id: 1008, coupon: '', items: [line('chai', 1), line('kokum', 2)], subtotal: 500, discount: 0, tax: 90, total: 590 },
];
const order = (id) => JSON.parse(JSON.stringify(ORDERS.find((o) => o.id === id)));

// Figures from both engines for the same items and coupon.
function both(o) {
  const inv = invoice.computeInvoiceFigures(o);
  const chk = pricing.computeTotals(o.items, o.coupon);
  return { inv, chk };
}
const pick = (f) => ({ subtotal: f.subtotal, discount: f.discount, tax: f.tax, cgst: f.cgst, sgst: f.sgst, total: f.total });

test('checkout reference: pricing.computeTotals reproduces the billed ledger figures for all 8 orders', () => {
  for (const o of ORDERS) {
    const chk = pricing.computeTotals(o.items, o.coupon);
    assert.deepEqual(
      { subtotal: chk.subtotal, discount: chk.discount, tax: chk.tax, total: chk.total },
      { subtotal: o.subtotal, discount: o.discount, tax: o.tax, total: o.total },
      'order #' + o.id
    );
  }
});

test('#1008 (all 18% items, no coupon): invoice matches checkout', () => {
  const { inv, chk } = both(order(1008));
  assert.deepEqual(pick(inv), { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 });
  assert.deepEqual(pick(inv), pick(chk));
  assert.deepEqual(inv.rows.map((r) => r.gstPercent), [18, 18]);
});

// Updated after the fix: these tests used to pin the old (wrong) invoice figures as "CURRENT BEHAVIOUR".
test('#1001 (18% chai + 5% dal, no coupon): invoice taxes each line at its own HSN slab', () => {
  const { inv, chk } = both(order(1001));
  assert.deepEqual(inv.rows.map((r) => r.gstPercent), [18, 5]);
  assert.deepEqual(inv.rows.map((r) => r.lineTax), [50.4, 16.5]);
  assert.deepEqual(pick(inv), { subtotal: 610, discount: 0, tax: 66.9, cgst: 33.45, sgst: 33.45, total: 676.9 });
  assert.deepEqual(pick(inv), pick(chk));
});

test('#1007 (12% ghee + 5% sunflower oil, no coupon): invoice uses 12% and 5%', () => {
  const { inv, chk } = both(order(1007));
  assert.deepEqual(inv.rows.map((r) => r.gstPercent), [12, 5]);
  assert.deepEqual(pick(inv), { subtotal: 1280, discount: 0, tax: 127, cgst: 63.5, sgst: 63.5, total: 1407 });
  assert.deepEqual(pick(inv), pick(chk));
});

test('#1002 (SAVE10): 10% of the subtotal, applied before GST', () => {
  const { inv, chk } = both(order(1002));
  assert.deepEqual(pick(inv), { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 });
  assert.deepEqual(pick(inv), pick(chk));
});

test('#1004 (SAVE10 on Rs 2,240): invoice applies the Rs 150 maxDiscount cap', () => {
  const { inv, chk } = both(order(1004));
  assert.equal(inv.discount, 150);
  assert.deepEqual(pick(inv), { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 });
  assert.deepEqual(pick(inv), pick(chk));
});

test('#1003 (FLAT50, 12% butter + 18% chai): GST on the discounted lines at 12% and 18%', () => {
  const { inv, chk } = both(order(1003));
  assert.deepEqual(pick(inv), { subtotal: 400, discount: 50, tax: 49.35, cgst: 24.68, sgst: 24.67, total: 399.35 });
  assert.deepEqual(pick(inv), pick(chk));
});

test('reconciling all 8 orders gives 0 mismatches and total delta Rs 0', () => {
  const round2 = (n) => Math.round((n + 1e-9) * 100) / 100;
  const mismatched = [];
  let totalDelta = 0;
  for (const o of ORDERS) {
    const inv = invoice.computeInvoiceFigures(o);
    const delta = round2(inv.total - o.total);
    const taxDelta = round2(inv.tax - o.tax);
    if (Math.abs(delta) >= 0.01 || Math.abs(taxDelta) >= 0.01) {
      mismatched.push(o.id);
      totalDelta = round2(totalDelta + Math.abs(delta));
    }
  }
  assert.deepEqual(mismatched, []);
  assert.equal(totalDelta, 0);
});

test('inactive coupon DIWALI20 gives no discount on the invoice (same as checkout)', () => {
  const o = order(1007);
  o.coupon = 'DIWALI20';
  const { inv, chk } = both(o);
  assert.equal(inv.discount, 0);
  assert.equal(inv.total, 1407);
  assert.deepEqual(pick(inv), pick(chk));
});

test('invoice checks minOrder (SAVE10 on a Rs 400 cart gives no discount, same as checkout)', () => {
  const o = order(1003);
  o.coupon = 'SAVE10';
  const { inv, chk } = both(o);
  assert.equal(inv.discount, 0);
  assert.equal(inv.total, 456.4);
  assert.deepEqual(pick(inv), pick(chk));
});

test('invoice coupon code is case-insensitive ("save10" gets the same Rs 102 as checkout)', () => {
  const o = order(1002);
  o.coupon = 'save10';
  const { inv, chk } = both(o);
  assert.equal(inv.discount, 102);
  assert.equal(inv.total, 963.9);
  assert.deepEqual(pick(inv), pick(chk));
});

test('an explicit gstRate of 0 means 0% GST on the invoice (same as checkout)', () => {
  const o = { id: 1, coupon: '', items: [{ name: 'Zero-rated item', hsn: '0902', price: 100, qty: 1, gstRate: 0 }] };
  const { inv, chk } = both(o);
  assert.equal(inv.rows[0].gstPercent, 0);
  assert.equal(inv.tax, 0);
  assert.equal(chk.tax, 0);
});

test('explicit numeric gstRate on a line is used (5 means 5%)', () => {
  const o = { id: 2, coupon: '', items: [{ name: 'Tagged item', hsn: '0902', price: 100, qty: 1, gstRate: 5 }] };
  const { inv, chk } = both(o);
  assert.deepEqual(pick(inv), { subtotal: 100, discount: 0, tax: 5, cgst: 2.5, sgst: 2.5, total: 105 });
  assert.deepEqual(pick(inv), pick(chk));
});

test('an order with no items gives all-zero figures', () => {
  const inv = invoice.computeInvoiceFigures({ id: 3, coupon: '', items: [] });
  assert.deepEqual(pick(inv), { subtotal: 0, discount: 0, tax: 0, cgst: 0, sgst: 0, total: 0 });
  assert.deepEqual(inv.rows, []);
});

test('render(): no reconciliation notice on #1002 or #1008; #1002 prints Rs 963.90', () => {
  const html1002 = invoice.render(Object.assign(order(1002), { date: '05/01/2022', customer: 'Anil Kulkarni' }));
  assert.doesNotMatch(html1002, /Accountant Reconciliation Notice/);
  assert.match(html1002, /Invoice Total<\/td><td class="r">₹963\.90/);
  const html1008 = invoice.render(Object.assign(order(1008), { date: '15/03/2022', customer: 'Walk-in' }));
  assert.doesNotMatch(html1008, /Accountant Reconciliation Notice/);
  assert.match(html1008, /Invoice Total<\/td><td class="r">₹590\.00/);
});

// ---- Correct behaviour (ticket #1): the invoice must show exactly what checkout billed.
test('FIX: for all 8 orders the invoice equals what checkout billed (per-line HSN GST, capped discount before tax)', () => {
  for (const o of ORDERS) {
    const inv = invoice.computeInvoiceFigures(o);
    const chk = pricing.computeTotals(o.items, o.coupon);
    assert.deepEqual(pick(inv), pick(chk), 'order #' + o.id + ' figures');
    assert.deepEqual(
      { subtotal: inv.subtotal, discount: inv.discount, tax: inv.tax, total: inv.total },
      { subtotal: o.subtotal, discount: o.discount, tax: o.tax, total: o.total },
      'order #' + o.id + ' vs ledger'
    );
    assert.deepEqual(inv.rows.map((r) => r.gstPercent), chk.lines.map((l) => l.gstPercent), 'order #' + o.id + ' GST %');
    assert.deepEqual(inv.rows.map((r) => r.lineTax), chk.lines.map((l) => l.tax), 'order #' + o.id + ' line GST');
  }
});
