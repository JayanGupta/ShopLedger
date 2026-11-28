# ShopLedger contributor notes

## Stack
- Node.js application using Express (`^4.17.1`) and body-parser (`^1.19.0`).
- Browser UI uses HTML, CSS, and JavaScript in `public/`.
- Application records are read from and written to `data/db.json` by `lib/store.js`.

## Module map
- `routes/customers.js` — customer listing and Khata settlement endpoints.
- `routes/orders.js` — order listing, lookup, placement, and cancellation endpoints.
- `routes/products.js` — product catalog and active coupon endpoints.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — coupon normalization, lookup, validation, discount calculation, and listing.
- `lib/dates.js` — current date, date-key normalization, and fiscal-year calculation.
- `lib/inventory.js` — product lookup, sellable stock, stock checks, reserve/release, and summary.
- `lib/invoice.js` — invoice figures and printable HTML invoice rendering.
- `lib/ledger.js` — customer lookup/listing, Khata charges/reversals, and settlements.
- `lib/orders.js` — order creation, lookup, cancellation, and filtered listing.
- `lib/pricing.js` — subtotal, coupon discount, and checkout totals with line GST calculations.
- `lib/reports.js` — dashboard summary and saved-order versus invoice GST reconciliation.
- `lib/store.js` — JSON database read/write and audit-log append.
- `lib/tax.js` — item GST rate lookup, slab percentage, and CGST/SGST split.

## Commands
- Start the app: `node server.js`.
- Run tests: `node --test` (the current `package.json` test script is a placeholder).

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
- Invoice total and GST breakdown do not match what the customer was billed.
- Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
