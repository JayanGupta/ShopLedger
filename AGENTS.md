# ShopLedger

## Stack

- Node.js with CommonJS modules, Express 4, and `body-parser` for JSON requests.
- Express serves plain HTML, CSS, and browser JavaScript from `public/`.
- Persistent data is stored in `data/db.json` using synchronous file reads and writes.

## Module map

- `routes/customers.js` lists customers and records Khata settlements.
- `routes/orders.js` lists, retrieves, places, and cancels orders.
- `routes/products.js` lists and filters products and lists active coupons.
- `routes/reports.js` serves dashboard and GST reconciliation reports, previews cart pricing, and exports the database behind a key check.
- `lib/coupons.js` normalizes and validates coupon codes, computes discounts, and lists active coupons.
- `lib/dates.js` formats local dates, normalizes date strings, and derives fiscal-year labels.
- `lib/inventory.js` looks up products, checks sellable quantities, applies stock and reservation updates, and summarizes inventory.
- `lib/invoice.js` recalculates invoice figures and renders printable HTML with a notice when the total differs from the saved order.
- `lib/ledger.js` looks up customers and handles Khata charges, reversals, balances, and settlements.
- `lib/orders.js` creates, retrieves, filters, and cancels order records.
- `lib/pricing.js` calculates checkout subtotals, allocates coupon discounts across lines, and computes GST and grand totals.
- `lib/reports.js` summarizes dashboard figures and compares saved orders with recalculated invoices.
- `lib/store.js` reads and writes the JSON database, supplies missing collections and counters, and maintains the audit log.
- `lib/tax.js` resolves GST rates from explicit rates or HSN mappings with a default fallback and splits GST into CGST and SGST.

## Commands

- Start the app with `node server.js` (`npm start` runs the same command). The port defaults to `3000` unless `PORT` is set.
- Run tests with `node --test`. The repo currently has no test files, and `npm test` is a failing placeholder.

## Rules

1. Write characterization tests before changing behavior.
2. Change only the module(s) the ticket is about.
3. Tests must use in-memory data and must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown do not match what the customer was billed. Checkout applies HSN-based GST after allocating the coupon discount. The invoice recalculates GST on gross line amounts and falls back to the default rate for newly saved lines.

Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
