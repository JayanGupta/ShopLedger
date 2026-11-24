# ShopLedger working notes

## Stack

Node.js/CommonJS, Express 4, body-parser, browser HTML/CSS/JavaScript, and a JSON-file datastore.

## Module map

- `routes/customers.js` — customer listing and Khata settlement endpoints.
- `routes/orders.js` — order listing, creation, and cancellation endpoints.
- `routes/products.js` — product catalog and active coupon endpoints.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — coupon normalization, validation, and discount calculation.
- `lib/dates.js` — DD/MM/YYYY date creation, normalization, and fiscal-year calculation.
- `lib/inventory.js` — product lookup, stock checks, reservation, release, and summaries.
- `lib/invoice.js` — invoice figures and printable HTML rendering.
- `lib/ledger.js` — customer balances, Khata charges/reversals, and settlements.
- `lib/orders.js` — order creation, lookup, cancellation, listing, filtering, and sorting.
- `lib/pricing.js` — subtotal, coupon discount, taxable-value, GST, and total calculation.
- `lib/reports.js` — dashboard and GST-reconciliation calculations.
- `lib/store.js` — JSON datastore reads, writes, and audit-log entries.
- `lib/tax.js` — HSN/GST rate lookup and CGST/SGST splitting.

## Commands

- Start the app: `npm start`
- Run tests: `node --test`

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Order-history sorting and date filtering are broken, and Khata settlements corrupt customer balances. Allowed files: `lib/orders.js` (`list` only), `lib/dates.js`, `lib/ledger.js`, and `routes/customers.js`.
