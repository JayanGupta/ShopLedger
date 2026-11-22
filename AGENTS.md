# ShopLedger

## Stack

- Node.js with CommonJS JavaScript, Express 4 and body-parser 1.
- Static HTML, CSS and browser JavaScript in `public/`; JSON API mounted at `/api`.
- `lib/store.js` synchronously reads and rewrites `data/db.json`; no database service.
- `config.js` holds shop details, GST slabs, coupon rules, inventory settings and the admin key.

## Module map

- `server.js`: Express setup, static assets, router mounting and printable invoice endpoint.
- `routes/products.js`: Product listing with stock/GST details and active coupon listing.
- `routes/orders.js`: Order listing, retrieval, checkout and cancellation.
- `routes/customers.js`: Customer ledger listing and settlement recording.
- `routes/reports.js`: Dashboard, GST reconciliation, pricing preview and keyed JSON export.
- `lib/coupons.js`: Coupon normalization, lookup, validation, discount calculation and listing.
- `lib/dates.js`: Local date formatting, date-key conversion and fiscal-year labels.
- `lib/inventory.js`: Product lookup, sellable stock, availability checks, stock deduction, release and summary.
- `lib/invoice.js`: Independent invoice calculations, printable HTML and total-mismatch warning.
- `lib/ledger.js`: Customer lookup, balances, Khata charges, debit reversals and settlements.
- `lib/orders.js`: In-memory order creation, lookup, cancellation and filtered listing.
- `lib/pricing.js`: Checkout subtotal, coupon allocation, per-line GST and totals.
- `lib/reports.js`: Dashboard aggregation and stored-order versus invoice reconciliation.
- `lib/store.js`: JSON persistence, default structure and audit log capped at 100 entries.
- `lib/tax.js`: Explicit-rate or exact-HSN GST lookup, fallback rate and CGST/SGST split.

## Commands

- Start the app: `node server.js` (also the command behind `npm start`).
- Run tests with Node's built-in runner: `node --test`.
- No test files currently exist; `npm test` is a placeholder that exits with an error.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

- Invoice total and GST breakdown do not match what the customer was billed.
- Allowed files: `lib/invoice.js`; `lib/tax.js` only if truly needed.
- Checkout uses `pricing.computeTotals()` with proportional discounts and HSN GST rates.
- Invoice uses `computeInvoiceFigures()` with separate tax/coupon logic and no HSN lookup.
- Orders save subtotal, discount, tax and total, but not calculated per-line GST breakdowns.
