# ShopLedger

## Stack
- Node.js, CommonJS JavaScript, Express, and body-parser; plain HTML/CSS/JavaScript UI.
- `server.js` serves `public/`, mounts routers at `/api`, and serves `/orders/:id/invoice`.
- `config.js` holds shop details, port, GST mappings, coupon rules, inventory settings, and admin key.
- Persistence is synchronous JSON file I/O through `lib/store.js` to `data/db.json`.

## Module map
- `routes/products.js`: Product listing with stock/GST information and active coupon listing.
- `routes/orders.js`: Order listing, retrieval, checkout, and cancellation; coordinates persistence.
- `routes/customers.js`: Customer balances, recent settlements, and payment settlement submission.
- `routes/reports.js`: Dashboard, GST reconciliation, pricing preview, and key-protected database export.
- `lib/coupons.js`: Coupon normalization, validation, discount calculation, and active coupon listing.
- `lib/dates.js`: Local dates, DD/MM/YYYY normalization, and fiscal-year labels.
- `lib/inventory.js`: Product lookup, sellable stock, stock checks/deductions, reservation release, and summaries.
- `lib/invoice.js`: Independently recomputes invoice figures and renders printable HTML with a total mismatch notice.
- `lib/ledger.js`: Customer lookup/balances, Khata credit checks/debits/reversals, and settlements.
- `lib/orders.js`: Adds, retrieves, filters, sorts, and cancels orders in the supplied database object.
- `lib/pricing.js`: Checkout subtotal, proportional coupon allocation, post-discount line GST, and totals.
- `lib/reports.js`: Dashboard aggregates and comparison of stored order figures with recomputed invoice figures.
- `lib/store.js`: Reads/writes data/db.json, supplies missing top-level structures, and retains up to 100 audit entries.
- `lib/tax.js`: Resolves explicit rates or exact HSN mappings, falls back to the configured rate, and splits CGST/SGST.

## Commands
- Start the app: `node server.js` (also the command behind `npm start`).
- Run tests with Node's built-in runner: `node --test`.
- `npm test` currently runs a placeholder that exits with an error; it does not invoke the test runner.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; they use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
- Invoice total and GST breakdown do not match what the customer was billed.
- Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
- Checkout uses `pricing.computeTotals()`; orders persist aggregate subtotal, discount, tax, and total.
- Invoice uses `computeInvoiceFigures()` with its own rate/discount logic, bypassing the pricing and tax helpers.
- Invoice currently ignores HSN slabs and coupon activity, minimums, and caps; percentage discounts include pre-discount tax.
