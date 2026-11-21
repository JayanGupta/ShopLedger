# ShopLedger

## Stack
- Node.js CommonJS app using Express (`^4.17.1`) and body-parser (`^1.19.0`).
- Browser UI is static HTML, CSS, and JavaScript under `public/`; persistence is `data/db.json`.

## Module map
- `routes/customers.js` — customer listing and Khata settlement endpoints.
- `routes/orders.js` — order listing, lookup, placement, and cancellation endpoints.
- `routes/products.js` — product listing and active coupon endpoints.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — coupon normalization, validation, discount calculation, and active coupon listing.
- `lib/dates.js` — current date, date-key normalization, and fiscal-year helpers.
- `lib/inventory.js` — product lookup, sellable stock, stock checks, reservation/release, and summary.
- `lib/invoice.js` — invoice figures and printable invoice HTML rendering.
- `lib/ledger.js` — customer lookup/listing, Khata order charges/reversals, and settlements.
- `lib/orders.js` — order creation, lookup, cancellation, and filtered listing.
- `lib/pricing.js` — subtotal, coupon discount, line GST, and order totals.
- `lib/reports.js` — dashboard summary and stored-order versus invoice GST reconciliation.
- `lib/store.js` — read/write `data/db.json` and append audit entries.
- `lib/tax.js` — GST rate lookup by item/HSN and CGST/SGST splitting.

## Commands
- Start the app: `npm start` (runs `node server.js`).
- Run tests: `node --test` (Node's built-in test runner; no test files are present currently).

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
Invoice total and GST breakdown do not match what the customer was billed.
Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
