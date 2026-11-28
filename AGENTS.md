# Repository Guidelines

## Stack

ShopLedger uses Node.js CommonJS and Express 4.17.1. The browser UI is static HTML, CSS, and JavaScript under `public/`. Application records are stored in `data/db.json` through `lib/store.js`.

## Module map

### `routes/`
- `routes/customers.js` — customer and Khata API handlers.
- `routes/orders.js` — order listing, creation, and cancellation handlers.
- `routes/products.js` — product API handlers.
- `routes/reports.js` — reporting API handlers.

### `lib/`
- `lib/coupons.js` — coupon normalization, validation, and discount calculation.
- `lib/dates.js` — date formatting and normalization helpers.
- `lib/inventory.js` — product lookup, stock checks, reservation, and release.
- `lib/invoice.js` — invoice figures and printable HTML rendering.
- `lib/ledger.js` — customer balances, Khata charges, reversals, and settlements.
- `lib/orders.js` — order creation, lookup, cancellation, and filtering.
- `lib/pricing.js` — order subtotal, discount, tax, and total calculation.
- `lib/reports.js` — report calculations.
- `lib/store.js` — synchronous JSON database read, write, and audit logging.
- `lib/tax.js` — GST rate lookup and CGST/SGST split.

## Commands

- `npm start` — starts the Express app on `PORT` or port 3000.
- `node --test` — runs tests discovered by Node's built-in test runner. No test files currently exist, and `npm test` is a placeholder that exits with an error.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Invoice total and GST breakdown do not match what the customer was billed. Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
