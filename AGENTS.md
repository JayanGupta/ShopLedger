# ShopLedger working rules

## Stack
- Node.js with Express 4, body-parser, and browser assets served from public/.
- JSON persistence uses data/db.json through lib/store.js.

## Module map
### routes/
- routes/customers.js — GET /customers; POST /customers/:id/settle.
- routes/orders.js — GET/POST /orders; GET /orders/:id; POST /orders/:id/cancel.
- routes/products.js — GET /products and /coupons.
- routes/reports.js — dashboard, GST reconciliation, pricing preview, admin export.
### lib/
- lib/coupons.js — normalizeCode, getCoupon, validate, calculateDiscount, listActive.
- lib/dates.js — today, normalizeDateKey, getFiscalYear.
- lib/inventory.js — find, getSellableStock, check, reserve, release, summarize.
- lib/invoice.js — computeInvoiceFigures, render.
- lib/ledger.js — findCustomer, listCustomers, chargeOrderToKhata, reverseOrderDebit, recordSettlement.
- lib/orders.js — add, get, cancel, list.
- lib/pricing.js — round2, subtotal, discount, computeTotals.
- lib/reports.js — getDashboardSummary, getGstReconciliation.
- lib/store.js — read, write, appendAudit.
- lib/tax.js — round2, getRateForItem, getSlabPercent, splitCgstSgst.

## Commands
- `npm start` — runs `node server.js`.
- `node --test` — runs the built-in Node test suite.

## Rules
1. Write characterization tests before changing behavior.
2. Change only modules covered by the current ticket.
3. Tests must not read or write data/db.json; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
Invoice total and GST breakdown do not match what the customer was billed.

## Allowed files
- `test/invoice.test.js` for Ticket 1 characterization and regression tests.
- `lib/invoice.js`.
- `lib/tax.js` only if truly needed.
