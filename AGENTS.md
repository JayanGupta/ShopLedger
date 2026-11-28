# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and body-parser for JSON request bodies.
- Vanilla HTML, CSS, and JavaScript served from `public/` by `server.js`.
- Synchronous JSON persistence in `data/db.json`.

## Module map

- `routes/customers.js` lists Khata customers and records settlements.
- `routes/orders.js` lists, retrieves, creates, and cancels orders.
- `routes/products.js` serves the product catalog and active coupons.
- `routes/reports.js` serves dashboard and GST reconciliation reports, pricing previews, and database export.
- `lib/coupons.js` normalizes coupon codes, validates them, and calculates discounts.
- `lib/dates.js` formats dates, normalizes date strings, and derives fiscal years.
- `lib/inventory.js` looks up products, checks sellable stock, handles deductions and releases, and summarizes inventory.
- `lib/invoice.js` computes invoice figures and renders printable HTML.
- `lib/ledger.js` manages Khata balances, credit checks, order debits and reversals, and settlements.
- `lib/orders.js` creates, retrieves, filters, and cancels order records.
- `lib/pricing.js` calculates checkout totals, allocates discounts across lines, and applies GST.
- `lib/reports.js` summarizes the dashboard and compares saved order figures with recalculated invoice figures.
- `lib/store.js` reads and rewrites the JSON database, supplies missing top-level defaults, and maintains the audit log.
- `lib/tax.js` resolves GST rates and splits GST into CGST and SGST.

## Commands

- Start the app with `node server.js` or `npm start`.
- Run tests with `node --test`. The repo currently has no automated tests, and `npm test` is a placeholder.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules the ticket is about.
3. Use in-memory data in tests. Tests must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown do not match what the customer was billed.

Allowed files are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
