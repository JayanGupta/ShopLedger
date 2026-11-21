# ShopLedger

## Stack

Node.js application using Express and body-parser. `server.js` serves `public/`, mounts API routers at `/api`, and uses `data/db.json` through `lib/store.js`.

## Module map

### routes/
- `routes/products.js` — product and active-coupon API routes.
- `routes/orders.js` — order listing, placement, lookup, and cancellation routes.
- `routes/customers.js` — customer listing and Khata settlement route.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export routes.

### lib/
- `lib/coupons.js` — coupon normalization, validation, listing, and discount calculation.
- `lib/dates.js` — date formatting, normalization, and fiscal-year calculation.
- `lib/inventory.js` — product lookup, stock checks, stock changes, and inventory summary.
- `lib/invoice.js` — invoice figure calculation and printable HTML rendering.
- `lib/ledger.js` — customer lookup, Khata charges, reversals, and settlements.
- `lib/orders.js` — order creation, lookup, cancellation, and filtering.
- `lib/pricing.js` — subtotal, coupon discount, and checkout total calculation.
- `lib/reports.js` — dashboard summary and GST reconciliation.
- `lib/store.js` — synchronous JSON database reading, writing, and audit logging.
- `lib/tax.js` — GST rate lookup and CGST/SGST split calculation.

## Commands

- Start the app: `node server.js`
- Run tests: `node --test`

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; they use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Invoice total and GST breakdown do not match what the customer was billed. Allowed files: `lib/invoice.js` and `lib/tax.js` only if truly needed.
