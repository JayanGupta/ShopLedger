# ShopLedger

## Stack

- Node.js with CommonJS modules, Express 4, and `body-parser` for JSON requests.
- Static HTML, CSS, and browser JavaScript served from `public/`.
- JSON file persistence in `data/db.json`.

## Module map

- `routes/customers.js` — Lists Khata customers and recent settlements, and records payments.
- `routes/orders.js` — Lists, retrieves, creates, and cancels orders.
- `routes/products.js` — Lists and filters products and lists active coupons.
- `routes/reports.js` — Serves dashboard and GST reconciliation reports, pricing previews, and admin exports.
- `lib/coupons.js` — Normalizes and validates coupon codes, calculates discounts, and lists active coupons.
- `lib/dates.js` — Formats dates, normalizes date inputs, and derives fiscal years.
- `lib/inventory.js` — Looks up products, checks sellable stock, adjusts stock and reservations, and summarizes inventory.
- `lib/invoice.js` — Computes invoice figures and renders printable HTML invoices.
- `lib/ledger.js` — Manages Khata balances, credit limits, order debits, and settlements.
- `lib/orders.js` — Adds, retrieves, filters, and cancels order records.
- `lib/pricing.js` — Computes checkout totals and applies GST after allocating coupon discounts to line items.
- `lib/reports.js` — Builds dashboard summaries and compares invoice figures with stored order figures.
- `lib/store.js` — Reads and writes the JSON database, fills missing fields, and appends audit entries.
- `lib/tax.js` — Resolves item GST rates from explicit rates, HSN codes, or the configured default, and splits GST into CGST and SGST.

## Commands

- Start the app with `npm start` (`node server.js`). The port defaults to `3000` and can be set with `PORT`.
- Run tests with `node --test`.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules the ticket is about.
3. Use in-memory data in tests. Tests must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Invoice total and GST breakdown do not match what the customer was billed.

Allowed files are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
