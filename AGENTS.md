# ShopLedger

## Stack

- Node.js application using CommonJS modules.
- Express 4 serves the API and the static `public/` directory; `body-parser` parses JSON request bodies.
- Browser UI uses HTML, CSS, and JavaScript without a frontend framework.
- Application data is persisted in `data/db.json` through `lib/store.js`.

## Module map

- `routes/customers.js` — customer listing and Khata settlement endpoints.
- `routes/orders.js` — order listing, lookup, creation, and cancellation endpoints.
- `routes/products.js` — product catalog and active coupon endpoints.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — coupon normalization, lookup, validation, discounts, and active coupon listing.
- `lib/dates.js` — today, date-key normalization, and fiscal-year helpers.
- `lib/inventory.js` — product lookup, sellable stock, stock checks, reservation, release, and summary.
- `lib/invoice.js` — invoice figures and printable HTML invoice rendering.
- `lib/ledger.js` — customer lookup/listing, Khata order charges and reversals, and settlements.
- `lib/orders.js` — order creation, lookup, cancellation, and filtered listing.
- `lib/pricing.js` — subtotal, coupon discount, tax, and order total calculations.
- `lib/reports.js` — dashboard summary and GST reconciliation calculations.
- `lib/store.js` — reads and writes `data/db.json`, ensures its structure, and appends audit entries.
- `lib/tax.js` — GST rate lookup from item rates or HSN slabs, and CGST/SGST split.

## Commands

- Start the app: `npm start` (runs `node server.js`).
- Run tests: `node --test` (Node.js built-in test runner). `npm test` is currently a placeholder that exits with an error.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; they use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Invoice total and GST breakdown do not match what the customer was billed. Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
