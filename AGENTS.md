# ShopLedger

## Stack

- Node.js CommonJS app using Express 4 and body-parser.
- Browser UI is static HTML, CSS, and JavaScript in `public/`.
- Application data is stored in `data/db.json` through `lib/store.js`.

## Module map

- `routes/products.js` — product catalog and active coupons endpoints.
- `routes/orders.js` — list, fetch, create, and cancel orders.
- `routes/customers.js` — customer list and Khata settlement endpoint.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — coupon normalization, validation, and discount calculation.
- `lib/dates.js` — current date, date normalization, and fiscal year helpers.
- `lib/inventory.js` — product lookup, sellable stock, stock checks, reserve/release, and summary.
- `lib/invoice.js` — invoice calculations and printable HTML rendering.
- `lib/ledger.js` — customer balances, Khata charges, reversals, and settlements.
- `lib/orders.js` — order creation, lookup, cancellation, and listing.
- `lib/pricing.js` — subtotal, discount, and order totals.
- `lib/reports.js` — dashboard summary and GST reconciliation calculations.
- `lib/store.js` — JSON database read/write, structure initialization, and audit log append.
- `lib/tax.js` — GST rate lookup and CGST/SGST split.

## Commands

- Start the app: `node server.js` (also available as `npm start`).
- Run tests: `node --test`.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Cannot sell the last sellable unit in stock, and cancelling an order never restores stock.

Allowed files: `lib/inventory.js`, and `lib/orders.js` (cancel only).
