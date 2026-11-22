# AGENTS.md: ShopLedger

POS, Khata (customer credit) ledger and GST invoicing app for one shop, Corner Shop Kirana & Wholesale, Pune. Legacy code from 2021 with no README.

## Stack
- Node.js 22+, Express 4 + body-parser, CommonJS in ES5 style (`var`, callbacks).
- UI: static `public/` (index.html, css/style.css, js/app.js), vanilla JS using XMLHttpRequest.
- Data: one JSON file, `data/db.json` (tracked in git), read and rewritten whole by `lib/store.js`.
- Config: `config.js` (port, shop details, HSN to GST % slabs, coupons, admin key).
- Tests: Node built-in `node:test` + `node:assert`, files in `test/`.

## Module map
- `server.js`: Express app; mounts routers under `/api`; `GET /orders/:id/invoice` calls `invoice.render()`.
- `routes/products.js`: `GET /products` (catalog, GST %, sellable stock), `GET /coupons`.
- `routes/orders.js`: list/get orders, `POST /orders` (place order), `POST /orders/:id/cancel`.
- `routes/customers.js`: `GET /customers` (Khata balances), `POST /customers/:id/settle`.
- `routes/reports.js`: dashboard, GST reconciliation, `POST /pricing/preview`, `GET /admin/export`.
- `lib/store.js`: `read()` / `write()` of data/db.json, `appendAudit()`.
- `lib/inventory.js`: sellable = stock - reserved; `check()`, `reserve()`, `release()`, `summarize()`.
- `lib/pricing.js`: checkout maths; `computeTotals()` spreads the discount per line, then HSN GST per line.
- `lib/tax.js`: `getRateForItem()` (gstRate, else HSN slab, else 18%), `splitCgstSgst()`.
- `lib/coupons.js`: `validate()`, `calculateDiscount()` (active flag, minOrder, maxDiscount cap).
- `lib/orders.js`: `add()`, `get()`, `cancel()`, `list()` (search, status, date filters, sort).
- `lib/ledger.js`: Khata `chargeOrderToKhata()`, `reverseOrderDebit()`, `recordSettlement()`.
- `lib/dates.js`: `today()` (DD/MM/YYYY), `normalizeDateKey()`, `getFiscalYear()`.
- `lib/invoice.js`: printable tax invoice; `computeInvoiceFigures()`, `render()`.
- `lib/reports.js`: `getDashboardSummary()`, `getGstReconciliation()` (order ledger vs invoice).

## Commands
- `npm install`: install express and body-parser.
- `npm start`: serve on http://localhost:3000 (`PORT` env var overrides).
- `node --test`: run all tests in `test/`.
- `git checkout data/db.json`: undo data changed by using the app.

## Rules
1. Write characterization tests before changing behaviour; name tests that pin odd behaviour "CURRENT BEHAVIOUR: ...".
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; they build in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.
- Never commit `package-lock.json` or `data/db.json`.

## Current ticket: #1 Invoice total and GST breakdown do not match what the customer was billed
Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed), tests in `test/invoice.test.js`.

Problem (verified in code and data):
- `invoice.computeInvoiceFigures()` reads `item.gstRate`, which order lines never have, so every line is taxed at 18% instead of its HSN slab (5% / 12% / 18%).
- The coupon is looked up raw in `config.coupons` and applied to subtotal + tax, ignoring the `maxDiscount` cap and `minOrder`.
- GST is charged on the full line value, before the discount.
- Result: the GST Audit flags 7 of 8 orders (total delta Rs 612.01); only #1008 (all 18%, no coupon) matches.

Solution (done): `invoice.computeInvoiceFigures()` now uses `pricing.computeTotals()`, the same maths as checkout, so each line gets its HSN slab, the coupon follows its rules (active, minOrder, cap) and the discount is applied before tax. Only `lib/invoice.js` changed. Result: 0 of 8 orders mismatched; 16/16 tests pass.
