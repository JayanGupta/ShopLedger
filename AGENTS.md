# ShopLedger Agent Guide

## Stack
- Node.js using CommonJS modules.
- Express 4 with `body-parser` for the HTTP API and static file serving.
- Vanilla HTML, CSS, and browser JavaScript in `public/`.
- Synchronous JSON-file persistence in `data/db.json`.

## Module map
- `routes/products.js` — lists products and active coupons.
- `routes/orders.js` — lists, creates, retrieves, and cancels orders.
- `routes/customers.js` — lists Khata customers and records settlements.
- `routes/reports.js` — serves dashboard and GST reports, pricing previews, and admin export.
- `lib/coupons.js` — normalizes, validates, lists, and calculates coupon discounts.
- `lib/dates.js` — formats dates, normalizes date keys, and derives fiscal years.
- `lib/inventory.js` — finds products, checks sellable stock, adjusts inventory, and summarizes stock.
- `lib/invoice.js` — recomputes invoice figures and renders printable invoice HTML.
- `lib/ledger.js` — manages customer balances, Khata charges/reversals, and settlements.
- `lib/orders.js` — adds, retrieves, lists, and cancels orders.
- `lib/pricing.js` — calculates checkout subtotal, discount, GST, and final totals.
- `lib/reports.js` — builds dashboard summaries and GST reconciliation results.
- `lib/store.js` — reads and rewrites `data/db.json` and appends audit entries.
- `lib/tax.js` — resolves item GST rates and splits GST into CGST and SGST.

## Commands
- Start the app: `node server.js`
- Run tests with Node's test runner: `node --test`
- There are currently no test files; the `npm test` script is not configured to run tests.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; they use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
- Invoice total and GST breakdown do not match what the customer was billed.
- Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
