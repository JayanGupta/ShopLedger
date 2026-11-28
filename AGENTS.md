# ShopLedger contributor notes

## Stack

- Node.js CommonJS application using Express 4.
- JSON persistence lives in `data/db.json` through `lib/store.js`.
- No test dependencies; tests use Node's built-in `node:test` and `node:assert`.

## Module map

- `routes/customers.js` — customer and Khata routes.
- `routes/orders.js` — order listing, checkout, invoices, and cancellation routes.
- `routes/products.js` — product and inventory routes.
- `routes/reports.js` — report routes.
- `lib/coupons.js` — coupon normalization, validation, and discounts.
- `lib/dates.js` — date parsing and date keys.
- `lib/inventory.js` — product lookup, stock checks, and reservations.
- `lib/invoice.js` — invoice figures and printable invoice HTML.
- `lib/ledger.js` — customer balances, charges, and settlements.
- `lib/orders.js` — order listing, lookup, creation, and cancellation.
- `lib/pricing.js` — cart subtotal, discount, GST, and total calculations.
- `lib/reports.js` — report aggregation.
- `lib/store.js` — JSON database reads, writes, and audit entries.
- `lib/tax.js` — GST slab lookup and CGST/SGST split.

## Commands

- Start the app: `node server.js`.
- Run tests: `node --test`.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests use in-memory data; never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Invoice total and GST breakdown do not match what the customer was billed.
Allowed fix module: `lib/invoice.js`.
Test file: `test/invoice.test.js`.
