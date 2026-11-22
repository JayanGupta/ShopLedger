# ShopLedger

## Stack

- Node.js with CommonJS modules, Express 4, and `body-parser` for JSON requests.
- Static HTML, CSS, and browser JavaScript in `public/`, served by Express.
- JSON file storage in `data/db.json`.

## Module map

- `routes/customers.js` lists Khata customers and recent settlements, and records settlement payments.
- `routes/orders.js` lists, retrieves, creates, and cancels orders through the API.
- `routes/products.js` lists and filters products and exposes active coupons.
- `routes/reports.js` serves dashboard and GST reconciliation reports, cart pricing previews, and admin data export.
- `lib/coupons.js` normalizes and validates coupon codes, calculates discounts, and lists active coupons.
- `lib/dates.js` formats the current date, normalizes date inputs, and derives fiscal years.
- `lib/inventory.js` finds products, checks sellable stock, updates stock and reservations, and summarizes inventory.
- `lib/invoice.js` computes invoice figures and renders printable HTML invoices.
- `lib/ledger.js` manages Khata balances, credit limits, order debits, reversals, and settlements.
- `lib/orders.js` adds, retrieves, filters, and cancels orders in the supplied data object.
- `lib/pricing.js` computes order totals by allocating coupon discounts across lines and applying GST to discounted line amounts.
- `lib/reports.js` computes dashboard summaries and compares invoice figures with stored order totals and tax.
- `lib/store.js` reads and writes `data/db.json`, fills missing data fields, and appends audit entries.
- `lib/tax.js` resolves GST rates from item overrides, configured HSN slabs, or the default rate and splits GST into CGST and SGST.

## Commands

- Start the app with `npm start` (runs `node server.js` on port 3000 by default, or `PORT` if set).
- Run tests with `node --test`.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules the ticket is about.
3. Use in-memory data for tests. Never read or write `data/db.json` in tests.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Invoice total and GST breakdown do not match what the customer was billed.

Allowed files are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
