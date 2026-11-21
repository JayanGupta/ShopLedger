# ShopLedger Agent Notes

## Stack
- Node.js CommonJS app using Express 4 and body-parser for JSON requests.
- Browser UI uses HTML, CSS, and vanilla JavaScript in `public/`.
- Application data is stored in `data/db.json` through `lib/store.js`.

## Module map
- `routes/customers.js` — customer list and Khata settlement endpoints.
- `routes/orders.js` — order list/read/create and cancellation endpoints.
- `routes/products.js` — product catalog and active coupon endpoints.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — coupon lookup, validation, normalization, and discount calculation.
- `lib/dates.js` — current date and date-key normalization helpers.
- `lib/inventory.js` — product lookup, sellable stock, stock checks, reservations, and summaries.
- `lib/invoice.js` — printable invoice figures and HTML rendering.
- `lib/ledger.js` — customer balances, Khata order debits, reversals, and settlements.
- `lib/orders.js` — order creation, lookup, cancellation, and listing.
- `lib/pricing.js` — subtotal, discounts, and checkout totals.
- `lib/reports.js` — dashboard summary and invoice-to-ledger reconciliation.
- `lib/store.js` — synchronous JSON store read/write and audit log updates.
- `lib/tax.js` — GST rate lookup, slab percentage, and CGST/SGST split.

## Commands
- Start the app: `npm start` (runs `node server.js`).
- Run tests: `node --test` (Node.js built-in test runner).

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; they use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
Invoice total and GST breakdown do not match what the customer was billed.
Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
