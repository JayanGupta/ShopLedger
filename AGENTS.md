# ShopLedger

## Stack
- Node.js, CommonJS JavaScript, Express 4, and body-parser 1.
- Static HTML/CSS/JavaScript UI in public/; server.js mounts API routers at /api.
- lib/store.js synchronously reads and rewrites data/db.json as the datastore.
- config.js holds shop settings, GST slabs, coupons, inventory defaults, and the admin key.

## Module map
- routes/products.js: product catalog with sellable stock and active coupon listing.
- routes/orders.js: order listing, lookup, creation, and cancellation endpoints.
- routes/customers.js: customer balances and Khata settlement endpoints.
- routes/reports.js: dashboard, GST reconciliation, pricing preview, and keyed data export.
- lib/coupons.js: coupon normalization, lookup, validation, discounts, and active listing.
- lib/dates.js: local date formatting, date-key conversion, and fiscal-year labels.
- lib/inventory.js: product lookup, sellable stock, stock checks, deduction, release, and summaries.
- lib/invoice.js: separate invoice calculations and printable HTML rendering.
- lib/ledger.js: customer lookup, balances, credit-limit checks, Khata charges, reversals, and settlements.
- lib/orders.js: order creation, lookup, cancellation, filtering, and sorting.
- lib/pricing.js: subtotal, discounts, and totals with per-line post-discount GST.
- lib/reports.js: dashboard summaries and invoice-versus-order GST reconciliation.
- lib/store.js: JSON persistence, datastore defaults, and audit logging capped at 100 entries.
- lib/tax.js: GST rate resolution and CGST/SGST splitting.

## Commands
- Start the app from the repo root: `node server.js` (also exposed as `npm start`).
- Run Node's built-in test runner from the repo root: `node --test`.
- No project test files were found; `npm test` is currently a placeholder that exits with failure.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write data/db.json; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
- Cannot sell the last sellable unit in stock, and cancelling an order never restores stock.
- Allowed files: lib/inventory.js and lib/orders.js (cancel function only).
- check() currently rejects qty >= sellable; sellable is max(0, stock - reserved).
- reserve() subtracts qty from product.stock using item.id.
- Saved order items use id, sku, name, hsn, price, and qty.
- release() looks up item.productId and reduces reserved; it never adds back stock.
- cancel() marks the order cancelled, calls release(), and reverses a Khata debit when applicable.
- cancel() rejects missing orders and orders already marked cancelled.
