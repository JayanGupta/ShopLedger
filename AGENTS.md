# ShopLedger

## Stack
- Node.js application using CommonJS modules and Express 4.
- `body-parser` parses JSON request bodies; `public/` is served as static files.
- Application data is persisted in `data/db.json` through synchronous filesystem reads and writes in `lib/store.js`.

## Module map
- `routes/customers.js` — customer listing and Khata settlement endpoints.
- `routes/orders.js` — order listing, lookup, creation, and cancellation endpoints.
- `routes/products.js` — product listing and active coupon endpoints.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — coupon normalization, lookup, validation, discount calculation, and active listing.
- `lib/dates.js` — current date, date-key normalization, and fiscal-year helpers.
- `lib/inventory.js` — product lookup, sellable stock, stock checks, reservations, release, and summary.
- `lib/invoice.js` — invoice figures and printable invoice HTML rendering.
- `lib/ledger.js` — customer ledger, Khata order charges/reversals, and settlements.
- `lib/orders.js` — order creation, lookup, cancellation, and filtered listing.
- `lib/pricing.js` — subtotal, discounts, per-line GST, and order totals.
- `lib/reports.js` — dashboard summary and GST reconciliation.
- `lib/store.js` — JSON database read/write and bounded audit log.
- `lib/tax.js` — item GST rate lookup and CGST/SGST split.

## Commands
- Start the app: `node server.js`
- Run tests: `node --test`

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; they use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
Invoice total and GST breakdown do not match what the customer was billed.

Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
