# ShopLedger

## Stack
- Node.js with CommonJS modules.
- Express 4 serves the static browser UI and JSON API; `body-parser` parses JSON request bodies.
- Application data is stored in `data/db.json` through synchronous filesystem reads and writes in `lib/store.js`.

## Module map
- `routes/customers.js` — lists customer accounts and settlements; records Khata settlements.
- `routes/orders.js` — lists, retrieves, creates, and cancels orders.
- `routes/products.js` — lists searchable products and active coupons.
- `routes/reports.js` — serves dashboard, GST reconciliation, pricing preview, and admin export.
- `lib/coupons.js` — normalizes, validates, lists, and calculates coupon discounts from `config.js`.
- `lib/dates.js` — formats today, normalizes date keys, and derives fiscal years.
- `lib/inventory.js` — finds products, checks sellable stock, adjusts inventory, and summarizes it.
- `lib/invoice.js` — computes printable invoice figures and renders invoice HTML.
- `lib/ledger.js` — lists customers, charges/reverses Khata orders, and records settlements.
- `lib/orders.js` — adds, retrieves, cancels, and filters orders.
- `lib/pricing.js` — calculates subtotals, coupon discounts, GST, and checkout totals.
- `lib/reports.js` — calculates dashboard summaries and compares stored order totals with invoice figures.
- `lib/store.js` — reads/writes `data/db.json` and appends audit entries.
- `lib/tax.js` — resolves item GST rates from HSN/config and splits GST into CGST and SGST.

## Commands
- Start the app: `node server.js` (equivalent to the configured `npm start`).
- Run tests: `node --test` (Node's built-in test runner; no test files are currently present).

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
Invoice total and GST breakdown do not match what the customer was billed.
Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
