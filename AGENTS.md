# ShopLedger agent guide

## Stack
- Node.js CommonJS app using Express 4 and body-parser.
- `server.js` serves `public/`, mounts JSON API routers, and serves the printable HTML invoice.
- `lib/store.js` reads and writes the app's JSON data in `data/db.json`.

## Module map
- `routes/customers.js` — lists customers and settlements; records Khata settlements.
- `routes/orders.js` — lists, fetches, places, and cancels orders.
- `routes/products.js` — lists products and active coupons.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and data export endpoints.
- `lib/coupons.js` — normalizes, validates, calculates, and lists coupons.
- `lib/dates.js` — formats today's date, normalizes date keys, and derives fiscal years.
- `lib/inventory.js` — finds products, checks and updates stock, and summarizes inventory.
- `lib/invoice.js` — computes invoice figures and renders printable invoice HTML.
- `lib/ledger.js` — customer balances, Khata order charges, reversals, and settlements.
- `lib/orders.js` — adds, finds, cancels, and filters orders.
- `lib/pricing.js` — computes order subtotals, discounts, GST, and totals.
- `lib/reports.js` — computes dashboard summaries and GST reconciliation.
- `lib/store.js` — reads/writes `data/db.json` and appends audit entries.
- `lib/tax.js` — resolves GST rates and splits tax into CGST/SGST.

## Commands
- Start the app: `node server.js` (listens on port 3000 unless `PORT` is set).
- Run tests: `node --test` (Node's built-in test runner; invoice tests are in `test/invoice.test.js`).

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.
- Invoice totals and line GST must use `lib/pricing.js`'s `computeTotals()` so invoices match checkout.

## Current ticket
- Invoice total and GST breakdown do not match what the customer was billed.
- Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
