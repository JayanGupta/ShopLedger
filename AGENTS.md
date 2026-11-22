# ShopLedger

## Stack
- Node.js application using Express 4 and body-parser 1.
- Browser UI is static HTML, CSS, and JavaScript in `public/`.
- `server.js` mounts JSON API routers; persistent application data is `data/db.json`.

## Module map
- `routes/customers.js` — list customers and record Khata settlements.
- `routes/orders.js` — list/get, place, and cancel orders.
- `routes/products.js` — list/filter products and list coupons.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — normalize, find, validate, calculate, and list coupons.
- `lib/dates.js` — current date, normalized date keys, and fiscal year.
- `lib/inventory.js` — product lookup, sellable stock, stock checks/reservation/release, and summary.
- `lib/invoice.js` — compute invoice figures and render printable invoice HTML.
- `lib/ledger.js` — customer lookup/list, Khata charges/reversals, and settlements.
- `lib/orders.js` — add, get, cancel, and filter/list orders.
- `lib/pricing.js` — subtotal, discount, rounding, and order totals.
- `lib/reports.js` — dashboard summary and GST reconciliation calculations.
- `lib/store.js` — read/write JSON database and append audit events.
- `lib/tax.js` — resolve item GST rates/slabs and split CGST/SGST.

## Commands
- Start the app: `node server.js` (also available as `npm start`).
- Run tests: `node --test`.
- `package.json` currently defines no test suite; its `npm test` script is a placeholder that exits with an error.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
Invoice total and GST breakdown do not match what the customer was billed. Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
