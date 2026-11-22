# ShopLedger

## Stack
- Node.js with CommonJS modules; Express and body-parser.
- Browser UI uses HTML, CSS, vanilla JavaScript and XMLHttpRequest in `public/`.
- `server.js` serves the UI, mounts API routers at `/api`, and serves HTML invoices.
- `config.js` defines shop details, GST slabs, coupons, inventory settings and port.
- `lib/store.js` synchronously persists business data in `data/db.json`.

## Module map
- `routes/customers.js`: customer listing and Khata settlement endpoints.
- `routes/orders.js`: order listing, lookup, creation and cancellation endpoints.
- `routes/products.js`: product listing and active coupon endpoints.
- `routes/reports.js`: dashboard, GST reconciliation, pricing preview and admin export endpoints.
- `lib/coupons.js`: coupon normalization, lookup, validation and discount calculation.
- `lib/dates.js`: local date formatting, date-key normalization and fiscal-year calculation.
- `lib/inventory.js`: product lookup, sellable stock, checks, stock deduction, release and summary.
- `lib/invoice.js`: independently computes invoice figures and renders printable HTML.
- `lib/ledger.js`: customer balances, Khata credit checks, order debits, reversals and settlements.
- `lib/orders.js`: creates, retrieves, cancels, filters and sorts in-memory orders.
- `lib/pricing.js`: subtotal, coupon allocation and post-discount per-line GST totals.
- `lib/reports.js`: dashboard summaries and stored-order versus invoice reconciliation.
- `lib/store.js`: JSON database reads/writes, structural defaults and capped audit history.
- `lib/tax.js`: explicit-rate or exact-HSN GST resolution and CGST/SGST splitting.

## Commands
- Start the app: `node server.js` (also the command behind `npm start`).
- Run tests: `node --test` using Node's built-in test runner.
- The current `npm test` script is a placeholder that exits unsuccessfully.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; they use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
- Invoice total and GST breakdown do not match what the customer was billed.
- Allowed files: `lib/invoice.js`; `lib/tax.js` only if truly needed.
- Checkout uses `lib/pricing.js` to allocate coupons before per-line HSN GST.
- Invoice calculation ignores HSN and applies percentage coupons after GST without checkout caps.
