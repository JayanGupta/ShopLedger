# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and `body-parser` for JSON requests.
- Browser UI in `public/` using HTML, CSS, and plain JavaScript.
- Express serves the UI and printable GST invoices. App data lives in `data/db.json`.

## Module map

- `routes/products.js` — Lists and filters products and lists active coupons.
- `routes/orders.js` — Lists, retrieves, places, and cancels orders.
- `routes/customers.js` — Lists customers and recent settlements, and records Khata payments.
- `routes/reports.js` — Serves dashboard and GST reconciliation reports, pricing previews, and keyed data export.
- `lib/coupons.js` — Normalizes codes, validates coupon eligibility, and calculates discounts.
- `lib/dates.js` — Formats dates, converts date strings for filtering, and derives fiscal years.
- `lib/inventory.js` — Looks up products, checks sellable stock, deducts stock, handles releases, and summarizes inventory.
- `lib/invoice.js` — Recalculates invoice figures from saved order lines and renders printable HTML.
- `lib/ledger.js` — Looks up customers, calculates Khata balances, charges and reverses order debits, and records settlements.
- `lib/orders.js` — Creates, retrieves, filters, sorts, and cancels order records.
- `lib/pricing.js` — Calculates checkout subtotals, discounts, line GST, and order totals.
- `lib/reports.js` — Builds dashboard totals and compares invoice figures with saved order figures.
- `lib/store.js` — Reads and rewrites the JSON data file and maintains the audit log.
- `lib/tax.js` — Resolves item GST rates and splits GST into CGST and SGST.

## Commands

- Start the app with `node server.js` or `npm start`. The default port is 3000 and can be set with `PORT`.
- Run tests with `node --test`. There are currently no project test files, and the `npm test` script is a failing placeholder.

## Rules

1. Write characterization tests before changing behavior.
2. Change only the module or modules the ticket is about.
3. Tests use in-memory data and never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Invoice total and GST breakdown do not match what the customer was billed.

Allowed files for the fix are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
