# ShopLedger

## Stack
- Node.js CommonJS application using Express 4 and body-parser.
- Browser UI is static HTML, CSS, and JavaScript under `public/`.
- Application data is stored in `data/db.json` via synchronous file reads and writes in `lib/store.js`.

## Module map
- `routes/customers.js` — lists customers and records Khata settlements.
- `routes/orders.js` — lists, retrieves, places, and cancels orders.
- `routes/products.js` — lists products and active coupons.
- `routes/reports.js` — dashboard and GST reports, pricing preview, and keyed database export.
- `lib/coupons.js` — normalizes, validates, calculates, and lists coupons.
- `lib/dates.js` — returns today’s date, normalizes date keys, and calculates fiscal years.
- `lib/inventory.js` — finds products, checks sellable stock, reserves/releases stock, and summarizes inventory.
- `lib/invoice.js` — computes invoice figures and renders printable invoice HTML.
- `lib/ledger.js` — lists customers, charges/reverses Khata orders, and records settlements.
- `lib/orders.js` — adds, finds, cancels, and filters orders.
- `lib/pricing.js` — calculates subtotals, discounts, per-line GST, and checkout totals.
- `lib/reports.js` — builds dashboard summaries and compares invoice figures with stored order totals.
- `lib/store.js` — reads/writes `data/db.json` and appends audit entries.
- `lib/tax.js` — resolves GST rates from an explicit line rate, HSN slab, or default, and splits CGST/SGST.

## Commands
- Start the app: `npm start` (runs `node server.js`; default port is 3000 unless `PORT` is set).
- Run tests: `node --test` (uses Node’s built-in test runner; no test files are currently listed in the repository).
- `npm test` is currently a placeholder that exits with an error.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; they use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
- Invoice total and GST breakdown do not match what the customer was billed.
- Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
