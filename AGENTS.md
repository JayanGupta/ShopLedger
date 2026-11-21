# ShopLedger

## Stack
- Node.js using CommonJS modules.
- Express 4 and body-parser parse JSON requests; `server.js` serves `public/` and mounts the API routers.
- Browser UI: HTML, CSS, and vanilla JavaScript in `public/`.
- Application data is stored as JSON in `data/db.json` through `lib/store.js`.

## Module map
- `routes/products.js` — product search/listing and active coupon endpoints.
- `routes/orders.js` — order listing, retrieval, placement, and cancellation endpoints.
- `routes/customers.js` — customer/settlement listing and Khata settlement endpoint.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — coupon normalization, validation, and discount calculation.
- `lib/dates.js` — today's date, date-key normalization, and fiscal-year calculation.
- `lib/inventory.js` — product lookup, sellable stock, stock checks/reservation/release, and inventory summary.
- `lib/invoice.js` — invoice figure calculation and printable HTML rendering.
- `lib/ledger.js` — customer lookup/listing, Khata charges/reversals, and settlements.
- `lib/orders.js` — order creation, lookup, cancellation, and filtered order listing.
- `lib/pricing.js` — subtotal, coupon discount, line tax, and order total calculation.
- `lib/reports.js` — dashboard summary and GST reconciliation calculations.
- `lib/store.js` — read/write `data/db.json`, initialize data structure, and append audit entries.
- `lib/tax.js` — GST rate resolution, slab percentage, and CGST/SGST split.

## Commands
- Start the app: `npm start` (runs `node server.js`).
- Run tests: `node --test` (Node.js built-in test runner).

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
Order history sorting and date filtering are broken, and Khata settlements corrupt customer balances.

Allowed files: `lib/orders.js` (`list()` only), `lib/dates.js`, `lib/ledger.js`, `routes/customers.js`.
