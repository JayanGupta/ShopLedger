# ShopLedger

## Stack
- Node.js application using Express 4 and body-parser.
- Browser UI is static HTML, CSS, and JavaScript served from `public/`.
- Application data is stored in `data/db.json` through synchronous file reads and writes in `lib/store.js`.

## Module map
- `routes/products.js` — lists products and active coupons.
- `routes/orders.js` — lists, retrieves, creates, and cancels orders.
- `routes/customers.js` — lists customers and records Khata settlements.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — normalizes, looks up, validates, and calculates coupon discounts.
- `lib/dates.js` — formats today’s date, normalizes date keys, and gets fiscal years.
- `lib/inventory.js` — finds products, checks sellable stock, reserves/releases stock, and summarizes inventory.
- `lib/invoice.js` — computes invoice figures and renders printable invoice HTML.
- `lib/ledger.js` — customer ledger balances, Khata billing/reversal, and settlement records.
- `lib/orders.js` — adds, gets, cancels, and filters orders.
- `lib/pricing.js` — computes order subtotal, discount, GST totals, and line breakdowns.
- `lib/reports.js` — computes dashboard summaries and compares invoice figures with stored order figures.
- `lib/store.js` — reads/writes the JSON store and appends audit entries.
- `lib/tax.js` — resolves item GST rates/slabs and splits GST into CGST and SGST.

## Commands
- Start the app: `npm start` (runs `node server.js`).
- Run tests: `node --test` (the current package has no test script that runs a test suite).

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
Invoice total and GST breakdown do not match what the customer was billed. Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
