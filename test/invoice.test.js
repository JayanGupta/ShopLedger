const test = require('node:test');
const assert = require('node:assert/strict');

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');
const coupons = require('../lib/coupons');

const cases = [
  {
    name: 'CURRENT BEHAVIOUR: #1001 uses fallback 18% GST on invoice despite 5% and 12% HSN slabs',
    coupon: '',
    items: [
      { name: 'Rice', sku: 'GRN-001', price: 400, qty: 1, hsn: '1006', gstRate: undefined },
      { name: 'Ghee', sku: 'DRY-001', price: 210, qty: 1, hsn: '0405', gstRate: undefined }
    ],
    invoiceExpected: { subtotal: 610, discount: 0, tax: 109.8, cgst: 54.9, sgst: 54.9, total: 719.8, gstPercents: [18, 18] }
  },
  {
    name: 'CURRENT BEHAVIOUR: #1002 invoices SAVE10 on subtotal plus tax and uses fallback GST',
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', sku: 'GRN-001', price: 640, qty: 1, hsn: '1006', gstRate: undefined },
      { name: 'Dal', sku: 'GRN-002', price: 165, qty: 1, hsn: '0713', gstRate: undefined },
      { name: 'Tea', sku: 'BEV-001', price: 140, qty: 1, hsn: '0902', gstRate: undefined },
      { name: 'Poha', sku: 'GRN-003', price: 48, qty: 1, hsn: '1104', gstRate: undefined },
      { name: 'Spice', sku: 'SPC-001', price: 27, qty: 1, hsn: '0904', gstRate: undefined }
    ],
    invoiceExpected: { subtotal: 1020, discount: 120.36, tax: 183.6, cgst: 91.8, sgst: 91.8, total: 1083.24, gstPercents: [18, 18, 18, 18, 18] }
  },
  {
    name: 'CURRENT BEHAVIOUR: #1004 does not apply SAVE10 maxDiscount cap on invoice',
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', sku: 'GRN-001', price: 640, qty: 2, hsn: '1006', gstRate: undefined },
      { name: 'Groundnut oil', sku: 'OIL-002', price: 1120, qty: 1, hsn: '1508', gstRate: undefined },
      { name: 'Poha', sku: 'GRN-003', price: 480, qty: 1, hsn: '1104', gstRate: undefined }
    ],
    invoiceExpected: { subtotal: 2880, discount: 339.84, tax: 518.4, cgst: 259.2, sgst: 259.2, total: 3058.56, gstPercents: [18, 18, 18] }
  },
  {
    name: 'CURRENT BEHAVIOUR: #1008 keeps 18% invoice GST when all items are 18%',
    coupon: '',
    items: [
      { name: 'Tea', sku: 'BEV-001', price: 140, qty: 1, hsn: '0902', gstRate: undefined },
      { name: 'Coffee', sku: 'BEV-002', price: 310, qty: 1, hsn: '0901', gstRate: undefined },
      { name: 'Sherbet', sku: 'BEV-003', price: 50, qty: 1, hsn: '2106', gstRate: undefined }
    ],
    invoiceExpected: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590, gstPercents: [18, 18, 18] }
  }
];

for (const scenario of cases) {
  test(scenario.name, () => {
    const order = { id: scenario.name, items: scenario.items, coupon: scenario.coupon };
    const invoiceFigures = invoice.computeInvoiceFigures(order);
    const checkoutFigures = pricing.computeTotals(scenario.items, scenario.coupon);

    assert.deepEqual({
      subtotal: invoiceFigures.subtotal,
      discount: invoiceFigures.discount,
      tax: invoiceFigures.tax,
      cgst: invoiceFigures.cgst,
      sgst: invoiceFigures.sgst,
      total: invoiceFigures.total,
      gstPercents: invoiceFigures.rows.map(row => row.gstPercent)
    }, scenario.invoiceExpected);

    assert.equal(checkoutFigures.subtotal, pricing.subtotal(scenario.items));
    assert.equal(checkoutFigures.discount, coupons.calculateDiscount(checkoutFigures.subtotal, scenario.coupon));
    assert.equal(checkoutFigures.tax, Math.round(checkoutFigures.lines.reduce((sum, line) => sum + line.tax, 0) * 100) / 100);
    assert.equal(checkoutFigures.total, checkoutFigures.taxable + checkoutFigures.tax);
  });
}
