# ShopLedger

## Stack
- Node.js with CommonJS modules; Express 4 and body-parser handle the server and JSON request bodies.
- Browser UI is HTML, CSS, and JavaScript under `public/`; application records are stored in `data/db.json`.

## Module map
- `routes/customers.js` — customer/settlement API; uses `lib/ledger.js` and `lib/store.js`.
- `routes/orders.js` — order list, lookup, placement, and cancellation API.
- `routes/products.js` — product catalog and active coupon API.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export API.
- `lib/coupons.js` — coupon lookup, validation, discount calculation, and listing.
- `lib/dates.js` — current date, date-key normalization, and fiscal-year helpers.
- `lib/inventory.js` — product lookup, stock checks, reserve/release, and inventory summary.
- `lib/invoice.js` — printable invoice HTML and invoice figure calculation.
- `lib/ledger.js` — customer balances, Khata charges/reversals, and settlements.
- `lib/orders.js` — order add/get/cancel/list operations.
- `lib/pricing.js` — subtotal, discount delegation, and checkout totals.
- `lib/reports.js` — dashboard summary and invoice/order GST reconciliation.
- `lib/store.js` — read/write `data/db.json` and append audit entries.
- `lib/tax.js` — resolve an item GST rate, return slab percent, and split CGST/SGST.

## Commands
- Start the app: `npm start` (runs `node server.js`).
- Run tests: `node --test`.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
Invoice total and GST breakdown do not match what the customer was billed. Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
