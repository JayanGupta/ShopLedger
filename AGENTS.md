# Repository Guidelines

## Stack
- Node.js, CommonJS, Express 4, and body-parser; application data is stored in `data/db.json`.
- `package.json` declares `start` as `node server.js`; its `test` script is a placeholder that exits with an error.

## Module map
- `routes/products.js` — product listing and active coupon endpoints.
- `routes/orders.js` — order listing, creation, lookup, and cancellation endpoints.
- `routes/customers.js` — customer listing and Khata settlement endpoint.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — coupon normalization, validation, listing, and discount calculation.
- `lib/dates.js` — date formatting, normalization, and fiscal year calculation.
- `lib/inventory.js` — product lookup, sellable stock, stock checks, reservation/release, and summary.
- `lib/invoice.js` — invoice figures and printable HTML rendering.
- `lib/ledger.js` — customer balances, Khata charges/reversals, and settlements.
- `lib/orders.js` — order creation, lookup, cancellation, and filtered listing.
- `lib/pricing.js` — subtotal, discount, GST line calculations, and order totals.
- `lib/reports.js` — dashboard summary and GST reconciliation.
- `lib/store.js` — synchronous JSON database read/write and audit log updates.
- `lib/tax.js` — item GST rate lookup and CGST/SGST split.

## Commands
- Start the app: `npm start` (runs `node server.js`).
- Run tests: `node --test` (Node's built-in test runner). The package's `npm test` script is currently a placeholder.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; they use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
- Invoice total and GST breakdown do not match what the customer was billed.
- Allowed files: `lib/invoice.js`; change `lib/tax.js` only if truly needed.
