# ShopLedger

## Stack
- Node.js with CommonJS modules.
- Express 4 (`express`); JSON request parsing uses `body-parser`.
- Browser UI is static HTML, CSS, and JavaScript served from `public/`.
- Runtime data is stored in `data/db.json` through `lib/store.js`.

## Module map
- `routes/customers.js` — lists customers and settlements; records Khata settlements.
- `routes/orders.js` — lists, retrieves, creates, and cancels orders.
- `routes/products.js` — lists products and active coupons.
- `routes/reports.js` — pricing preview, dashboard, GST reconciliation, and admin export endpoints.
- `lib/coupons.js` — normalizes, validates, and calculates coupon discounts from `config.js`.
- `lib/dates.js` — formats today’s date, normalizes date keys, and derives fiscal years.
- `lib/inventory.js` — finds products, checks/reserves/releases stock, and summarizes inventory.
- `lib/invoice.js` — computes invoice figures and renders printable invoice HTML.
- `lib/ledger.js` — finds and lists customers, charges/reverses Khata orders, and records settlements.
- `lib/orders.js` — adds, gets, cancels, and filters orders.
- `lib/pricing.js` — computes subtotal, coupon discount, line GST, and checkout totals.
- `lib/reports.js` — computes dashboard summary and compares stored orders with invoice figures.
- `lib/store.js` — reads/writes the JSON store and appends audit records.
- `lib/tax.js` — resolves item GST rates/slabs and splits GST into CGST and SGST.

## Commands
- Start the app: `npm start` (runs `node server.js`).
- Run tests: `node --test` (Node’s built-in test runner; tests are in `test/`).

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
Invoice total and GST breakdown do not match what the customer was billed. Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).

