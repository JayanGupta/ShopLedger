# ShopLedger

## Stack
- Node.js, CommonJS JavaScript, Express 4, and body-parser.
- Browser UI is static HTML, CSS, and JavaScript under `public/`.
- Persistent application data is stored in `data/db.json` through `lib/store.js`.

## Module map
- `routes/customers.js` — customer list and Khata settlement endpoints.
- `routes/orders.js` — order list/read/create and cancellation endpoints.
- `routes/products.js` — product and active coupon endpoints.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — coupon normalization, lookup, validation, discount calculation, and listing.
- `lib/dates.js` — current date, date-key normalization, and fiscal-year helpers.
- `lib/inventory.js` — product lookup, sellable stock, stock checks/reservation/release, and summary.
- `lib/invoice.js` — printable invoice figures and HTML rendering.
- `lib/ledger.js` — customer balances, Khata charges/reversals, and settlements.
- `lib/orders.js` — order add/read/cancel/list operations.
- `lib/pricing.js` — subtotal, discount, and checkout total calculations.
- `lib/reports.js` — dashboard summary and GST reconciliation calculations.
- `lib/store.js` — JSON database read/write and audit log append.
- `lib/tax.js` — item GST rate/slab lookup and CGST/SGST split.

## Commands
- Start the app: `npm start` (runs `node server.js`).
- Run tests: `node --test` (Node.js built-in test runner; no test files are currently present).

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
- Invoice total and GST breakdown do not match what the customer was billed.
- Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
