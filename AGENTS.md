# ShopLedger

## Stack
- Node.js, CommonJS JavaScript, Express (`^4.17.1`) and body-parser (`^1.19.0`) as declared in package.json.
- Static HTML/CSS/browser JavaScript in public/; server.js mounts API routers at /api and serves printable HTML invoices.
- lib/store.js synchronously reads and rewrites data/db.json; config.js contains shop, tax, coupon, inventory and server settings.

## Module map
- routes/customers.js: customer/settlement listing and Khata settlement endpoint.
- routes/orders.js: order listing, lookup, creation and cancellation endpoints.
- routes/products.js: product listing with stock/GST information and active coupon listing.
- routes/reports.js: dashboard, GST reconciliation, pricing preview and key-protected JSON export endpoints.
- lib/coupons.js: coupon normalization, lookup, validation, discount calculation and active listing.
- lib/dates.js: local DD/MM/YYYY dates, date-key conversion and fiscal-year labels.
- lib/inventory.js: product lookup, sellable-stock checks, stock deduction, reservation release and inventory summary.
- lib/invoice.js: independently computes invoice figures and renders printable HTML with a total-mismatch warning.
- lib/ledger.js: customer lookup, balances, Khata debits/reversals and settlement recording.
- lib/orders.js: adds, gets, cancels and filters orders in the supplied in-memory store.
- lib/pricing.js: subtotal, proportional coupon allocation, post-discount per-line GST and checkout totals.
- lib/reports.js: dashboard totals and reconciliation of stored orders against invoice calculations.
- lib/store.js: JSON-file persistence, structure defaults and audit log capped at 100 entries.
- lib/tax.js: explicit-rate/HSN/default GST resolution, slab percentages and CGST/SGST splitting.

## Commands
- Start the app: `node server.js` (also the package.json start script).
- Run tests with Node's built-in test runner: `node --test`.
- No test files currently exist outside node_modules; package.json's test script is a failing placeholder.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write data/db.json; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
- Invoice total and GST breakdown do not match what the customer was billed.
- Checkout uses lib/pricing.js for post-discount HSN-based GST; lib/invoice.js independently uses gstRate/default GST and different coupon arithmetic.
- Allowed files: lib/invoice.js; lib/tax.js only if truly needed.
