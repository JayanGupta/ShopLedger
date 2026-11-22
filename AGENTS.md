# ShopLedger contributor notes

## Stack
- Node.js app using CommonJS modules and Express 4 with body-parser.
- Browser UI is static HTML, CSS, and JavaScript under `public/`.
- Application data is stored in `data/db.json` through `lib/store.js`.

## Module map
- `routes/customers.js` — customer listing and Khata settlement endpoints.
- `routes/orders.js` — order listing, retrieval, placement, and cancellation endpoints.
- `routes/products.js` — product listing and active coupon endpoints.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — coupon normalization, lookup, validation, discount calculation, and listing.
- `lib/dates.js` — date formatting, normalization, and fiscal year calculation.
- `lib/inventory.js` — product lookup, sellable stock, stock checks, reservation/release, and summary.
- `lib/invoice.js` — invoice figure calculation and printable HTML rendering.
- `lib/ledger.js` — customer balances, Khata charges/reversals, and settlements.
- `lib/orders.js` — order add/get/cancel/list operations.
- `lib/pricing.js` — subtotal, discount delegation, and checkout total calculation.
- `lib/reports.js` — dashboard summary and invoice/order GST reconciliation.
- `lib/store.js` — JSON database read/write, structure defaults, and audit log append.
- `lib/tax.js` — item GST rate/slab resolution and CGST/SGST split.

## Commands
- Start the app: `npm start`.
- Run tests: `node --test`.
- The package currently has no test script for `node --test` and no declared test dependencies.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
- Invoice total and GST breakdown do not match what the customer was billed.
- Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
