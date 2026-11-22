# ShopLedger

## Stack
Node.js CommonJS; Express 4 and body-parser; plain HTML/CSS/JavaScript UI.
JSON persistence through synchronous filesystem calls. No database server.

## Module map
- server.js: Express app, static UI, /api routers and printable invoice route.
- config.js: port, shop details, GST slabs, coupon and inventory settings.
- routes/products.js: product listing and active coupons.
- routes/orders.js: order creation, lookup, filtering and cancellation.
- routes/customers.js: customer listing and Khata settlements.
- routes/reports.js: dashboard, GST audit, pricing preview and admin export.
- lib/store.js: read/write JSON and append bounded audit history.
- lib/inventory.js: stock checks, deduction, release and summaries.
- lib/pricing.js: checkout totals and per-line discount/tax calculations.
- lib/tax.js: explicit/HSN GST rates and CGST/SGST splitting.
- lib/coupons.js: coupon normalization, validation and capped discounts.
- lib/orders.js: add/get/list/cancel orders in an in-memory database object.
- lib/dates.js: local dates, date keys and fiscal year labels.
- lib/ledger.js: customer balances, Khata charges, reversals and settlements.
- lib/reports.js: dashboard aggregation and invoice/ledger reconciliation.
- lib/invoice.js: invoice figures and printable HTML rendering.
- public/: browser UI; data/db.json: persisted application state.

## Commands
- Start app: npm start (PowerShell: npm.cmd start); default port 3000.
- Run tests: node --test. The npm test script is still a placeholder.
- Workshop reproduction: run only in a temporary copy on PORT=3100.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write data/db.json; use in-memory fixtures.
4. Add no dependencies.
5. Make the smallest fix that works.
- Preserve data/db.json and the existing package-lock.json; do not stage either.

## Current ticket
Ticket 1: Invoice total and GST breakdown do not match checkout billing.
Issue: https://github.com/JayanGupta/ShopLedger/issues/1
Allowed production file: lib/invoice.js (lib/tax.js only if truly needed).
Workshop deliverables: test/invoice.test.js, AGENTS.md, docs/architecture.svg.
