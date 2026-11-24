# ShopLedger

## Stack
- Node.js with CommonJS modules; Express 4 and body-parser provide the HTTP server and JSON request parsing.
- The browser UI is static HTML, CSS, and JavaScript in `public/`.
- Application data is stored as JSON in `data/db.json` through `lib/store.js`.

## Module map
- `routes/customers.js` — lists customer accounts and settlements; records Khata settlements.
- `routes/orders.js` — lists, reads, creates, and cancels orders.
- `routes/products.js` — lists products and active coupons.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and keyed data export.
- `lib/coupons.js` — normalizes, validates, lists, and calculates coupon discounts.
- `lib/dates.js` — formats today's date, normalizes date keys, and calculates fiscal years.
- `lib/inventory.js` — finds products, checks stock, reserves/releases quantities, and summarizes inventory.
- `lib/invoice.js` — computes invoice figures and renders printable invoice HTML.
- `lib/ledger.js` — lists customers, charges/reverses Khata order debits, and records settlements.
- `lib/orders.js` — adds, finds, cancels, and filters orders.
- `lib/pricing.js` — calculates subtotals, discounts, tax, and order totals.
- `lib/reports.js` — builds dashboard summaries and GST reconciliation rows.
- `lib/store.js` — reads/writes `data/db.json` and appends audit entries.
- `lib/tax.js` — resolves item GST rates and splits tax into CGST/SGST.

## Commands
- Start the app: `node server.js` (the package also defines `npm start`).
- Run tests: `node --test`. `package.json`'s current `test` script is a placeholder that exits with an error.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
- Invoice total and GST breakdown do not match what the customer was billed.
- Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
