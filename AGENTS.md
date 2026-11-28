# Repository Guidelines

## Stack

- Node.js CommonJS application using Express 4 and body-parser for JSON request bodies.
- Browser interface is static HTML, CSS, and JavaScript in `public/`.
- Application data is stored in `data/db.json` through `lib/store.js`.
- No test files or test framework are currently present.

## Module map

### `routes/`

- `routes/customers.js` — customer list and Khata settlement endpoints.
- `routes/orders.js` — order listing, lookup, placement, and cancellation endpoints.
- `routes/products.js` — product catalog and active coupon endpoints.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.

### `lib/`

- `lib/coupons.js` — coupon lookup, validation, discount calculation, and active coupon listing.
- `lib/dates.js` — current date, date key normalization, and fiscal year helpers.
- `lib/inventory.js` — product lookup, sellable stock checks, inventory reservation/release, and summary.
- `lib/invoice.js` — invoice figure calculation and printable HTML rendering.
- `lib/ledger.js` — customer ledger balances, Khata order charges/reversals, and settlements.
- `lib/orders.js` — order creation, lookup, listing, and cancellation.
- `lib/pricing.js` — checkout subtotal, discount, GST, and total calculations.
- `lib/reports.js` — dashboard summary and stored-order versus invoice reconciliation.
- `lib/store.js` — synchronous JSON store reads/writes and audit log updates.
- `lib/tax.js` — item GST rate lookup and CGST/SGST split calculation.

## Commands

- `npm start` — starts `server.js` (port 3000 unless `PORT` is set).
- `node --test` — runs Node's built-in test discovery; no tests currently exist.
- `npm test` is only a placeholder and exits with an error.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Invoice total and GST breakdown do not match what the customer was billed. Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
