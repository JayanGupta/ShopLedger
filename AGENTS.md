# ShopLedger contributor notes

## Stack
- Node.js CommonJS application using Express 4 and body-parser for JSON request bodies.
- Browser UI is static HTML, CSS, and JavaScript in `public/`, served by Express.
- Application data is read from and written to `data/db.json` by `lib/store.js`.

## Module map
- `routes/customers.js` — lists customers and recent settlements; records customer settlements.
- `routes/orders.js` — lists and fetches orders; creates orders and cancels them.
- `routes/products.js` — lists products and active coupons.
- `routes/reports.js` — dashboard and GST reconciliation endpoints, pricing preview, and keyed data export.
- `lib/coupons.js` — normalizes, looks up, validates, and calculates coupon discounts.
- `lib/dates.js` — formats today's date, normalizes date keys, and derives fiscal years.
- `lib/inventory.js` — product lookup, sellable stock, stock checks, stock updates, and inventory summary.
- `lib/invoice.js` — computes printable invoice figures and renders printable invoice HTML.
- `lib/ledger.js` — customer ledger balances, Khata order charges/reversals, and settlements.
- `lib/orders.js` — adds, finds, cancels, and filters orders.
- `lib/pricing.js` — computes order subtotals, discounts, GST totals, and line breakdowns.
- `lib/reports.js` — builds dashboard summaries and compares saved order totals with invoice calculations.
- `lib/store.js` — reads/writes the JSON database and appends audit entries.
- `lib/tax.js` — resolves item GST rates, reports slab percentages, and splits GST into CGST/SGST.

## Commands
- Start the app: `npm start` (package script runs `node server.js`).
- Run tests: `node --test` (Node's built-in test runner; no test script is defined in `package.json`).

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
- Invoice total and GST breakdown do not match what the customer was billed.
- Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
