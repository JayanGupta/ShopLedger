# ShopLedger

## Stack

- Node.js application using Express 4 and body-parser.
- Static browser UI: HTML, CSS, and vanilla JavaScript in `public/`.
- File-backed JSON persistence in `data/db.json`.

## Module map

- `routes/products.js` — product catalog and active coupon API endpoints.
- `routes/orders.js` — order listing, creation, and cancellation API endpoints.
- `routes/customers.js` — customer directory and Khata settlement API endpoints.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and export endpoints.
- `lib/coupons.js` — coupon normalization, validation, calculation, and listing.
- `lib/dates.js` — date formatting, normalization, and fiscal-year helpers.
- `lib/inventory.js` — product lookup, sellable stock, stock changes, and inventory summary.
- `lib/invoice.js` — invoice figures and printable HTML rendering.
- `lib/ledger.js` — customer balances, Khata charges/reversals, and settlements.
- `lib/orders.js` — order creation, lookup, cancellation, and filtering.
- `lib/pricing.js` — subtotal, coupon discount, and checkout total calculation.
- `lib/reports.js` — dashboard and invoice-versus-ledger GST reconciliation.
- `lib/store.js` — JSON database reading, writing, and audit-log appending.
- `lib/tax.js` — GST rate lookup and CGST/SGST split.

## Commands

- Start the app: `node server.js`
- Run tests: `node --test`

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Invoice total and GST breakdown do not match what the customer was billed.

Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
