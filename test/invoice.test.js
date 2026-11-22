const test = require('node:test');
const assert = require('node:assert/strict');

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');
const coupons = require('../lib/coupons');

const cases = [
  {
    name: '#1001 invoice uses 5% and 12% HSN GST slabs',
    coupon: '',
    items: [
      { name: 'Rice', sku: 'GRN-001', price: 400, qty: 1, hsn: '1006', gstRate: undefined },
      { name: 'Ghee', sku: 'DRY-001', price: 210, qty: 1, hsn: '0405', gstRate: undefined }
    ],
    invoiceExpected: { subtotal: 610, discount: 0, tax: 45.2, cgst: 22.6, sgst: 22.6, total: 655.2, gstPercents: [5, 12] }
  },
  {
    name: '#1002 invoice applies SAVE10 to subtotal and uses HSN GST slabs',
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', sku: 'GRN-001', price: 640, qty: 1, hsn: '1006', gstRate: undefined },
      { name: 'Dal', sku: 'GRN-002', price: 165, qty: 1, hsn: '0713', gstRate: undefined },
      { name: 'Tea', sku: 'BEV-001', price: 140, qty: 1, hsn: '0902', gstRate: undefined },
      { name: 'Poha', sku: 'GRN-003', price: 48, qty: 1, hsn: '1104', gstRate: undefined },
      { name: 'Spice', sku: 'SPC-001', price: 27, qty: 1, hsn: '0904', gstRate: undefined }
    ],
    invoiceExpected: { subtotal: 1020, discount: 102, tax: 63.99, cgst: 32, sgst: 31.99, total: 981.99, gstPercents: [5, 5, 18, 5, 12] }
  },
  {
    name: '#1004 invoice applies the SAVE10 discount cap before GST',
    coupon: 'SAVE10',
    items: [
      { name: 'Groundnut oil', sku: 'OIL-002', price: 1120, qty: 2, hsn: '1508', gstRate: undefined }
    ],
    invoiceExpected: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5, gstPercents: [5] }
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

test('Invoice matches checkout subtotal, discount, GST, total, and per-line GST breakdown', () => {
  for (const scenario of cases) {
    const invoiceFigures = invoice.computeInvoiceFigures({
      id: scenario.name,
      items: scenario.items,
      coupon: scenario.coupon
    });
    const checkoutFigures = pricing.computeTotals(scenario.items, scenario.coupon);

    assert.equal(invoiceFigures.subtotal, checkoutFigures.subtotal, scenario.name);
    assert.equal(invoiceFigures.discount, checkoutFigures.discount, scenario.name);
    assert.equal(invoiceFigures.tax, checkoutFigures.tax, scenario.name);
    assert.equal(invoiceFigures.cgst, checkoutFigures.cgst, scenario.name);
    assert.equal(invoiceFigures.sgst, checkoutFigures.sgst, scenario.name);
    assert.equal(invoiceFigures.total, checkoutFigures.total, scenario.name);
    assert.deepEqual(invoiceFigures.rows.map(row => ({
      gstPercent: row.gstPercent,
      line: row.line,
      lineTax: row.lineTax
    })), checkoutFigures.lines.map(line => ({
      gstPercent: line.gstPercent,
      line: line.gross,
      lineTax: line.tax
    })), scenario.name);
  }
});
