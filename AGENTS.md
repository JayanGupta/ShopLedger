# ShopLedger

## Stack
- Node.js CommonJS application using Express 4 and body-parser for JSON request bodies.
- Browser UI is static HTML, CSS, and JavaScript in `public/`, served by Express.
- Application data is read from and written to `data/db.json` by `lib/store.js`.

## Module map
- `routes/customers.js` — lists customers/settlements and records Khata settlements.
- `routes/orders.js` — lists, reads, creates, and cancels orders.
- `routes/products.js` — lists products and active coupons.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export routes.
- `lib/coupons.js` — normalizes, validates, calculates, and lists coupons.
- `lib/dates.js` — formats today's date, normalizes date keys, and derives fiscal years.
- `lib/inventory.js` — finds products, checks sellable stock, reserves/releases stock, and summarizes inventory.
- `lib/invoice.js` — computes invoice figures and renders printable invoice HTML.
- `lib/ledger.js` — finds/lists customers, charges/reverses Khata orders, and records settlements.
- `lib/orders.js` — adds, finds, cancels, and filters orders.
- `lib/pricing.js` — computes subtotals, discounts, line GST, and order totals.
- `lib/reports.js` — computes dashboard summaries and GST reconciliation.
- `lib/store.js` — reads/writes the JSON database and appends audit entries.
- `lib/tax.js` — resolves item GST rates/slabs and splits tax into CGST and SGST.

## Commands
- Start the app: `npm start` (runs `node server.js`).
- Run tests: `node --test` (Node's built-in test runner; no test script is defined in `package.json`).

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; they use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
Invoice total and GST breakdown do not match what the customer was billed.
Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
