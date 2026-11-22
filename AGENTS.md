# ShopLedger contributor notes

## Stack
- Node.js application using CommonJS modules.
- Express 4 and body-parser provide the HTTP server and JSON request parsing.
- Browser UI is static HTML, CSS, and JavaScript in `public/`.
- Application data is stored in `data/db.json` through `lib/store.js`.

## Module map
- `routes/customers.js` — list customers and settlements; record Khata settlements.
- `routes/orders.js` — list, fetch, place, and cancel orders.
- `routes/products.js` — list products and active coupons.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export.
- `lib/coupons.js` — normalize, retrieve, validate, and calculate coupon discounts.
- `lib/dates.js` — format today, normalize date keys, and derive fiscal years.
- `lib/inventory.js` — find products, check/reserve/release stock, and summarize inventory.
- `lib/invoice.js` — calculate invoice figures and render printable invoice HTML.
- `lib/ledger.js` — find/list customers, charge/reverse Khata orders, and record settlements.
- `lib/orders.js` — add, find, cancel, and filter orders.
- `lib/pricing.js` — calculate subtotals, discounts, GST line breakdowns, and totals.
- `lib/reports.js` — calculate dashboard summaries and compare invoice/order totals.
- `lib/store.js` — synchronously read and write the JSON database and append audit entries.
- `lib/tax.js` — resolve item GST rates and split tax into CGST and SGST.

## Commands
- Start the app: `node server.js` (also available as `npm start`).
- Run tests: `node --test`. `package.json` currently defines no test suite; its `test` script is a placeholder.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
- Invoice total and GST breakdown do not match what the customer was billed.
- Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
