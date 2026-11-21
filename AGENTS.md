# ShopLedger

## Stack
- Node.js CommonJS, Express 4, and body-parser.
- Browser UI is static HTML, CSS, and JavaScript; application data is stored in `data/db.json`.

## Module map
- `routes/customers.js` — customer and Khata ledger endpoints.
- `routes/orders.js` — order listing, checkout, retrieval, and cancellation endpoints.
- `routes/products.js` — product, stock, tax slab, and coupon endpoints.
- `routes/reports.js` — dashboard and GST reconciliation endpoints.
- `lib/coupons.js` — coupon lookup, validation, and discount calculation.
- `lib/dates.js` — date formatting, normalization, and fiscal year helpers.
- `lib/inventory.js` — product lookup, stock checks, reservation, and release.
- `lib/invoice.js` — invoice figures and printable HTML rendering.
- `lib/ledger.js` — customer balances, Khata charges, reversals, and settlements.
- `lib/orders.js` — order creation, lookup, cancellation, and filtering.
- `lib/pricing.js` — checkout subtotal, coupon discount, and tax-inclusive totals.
- `lib/reports.js` — dashboard summary and GST reconciliation data.
- `lib/store.js` — JSON database reads, writes, and audit logging.
- `lib/tax.js` — HSN GST rate resolution and CGST/SGST split.

## Commands
- Install dependencies: `npm install`
- Start the app: `npm start` (uses `PORT` or defaults to 3000).
- Run tests: `node --test` (Node's built-in test runner).

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
Invoice total and GST breakdown do not match what the customer was billed. Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
