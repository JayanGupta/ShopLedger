# ShopLedger

## Stack

Node.js CommonJS app using Express 4 and body-parser; static browser UI in `public/`; JSON persistence in `data/db.json`.

## Module map

- `routes/customers.js` — customer balances and Khata settlement endpoints.
- `routes/orders.js` — order listing, creation, and cancellation endpoints.
- `routes/products.js` — product catalog and active-coupon endpoints.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and export endpoints.
- `lib/coupons.js` — coupon normalization, validation, and discount calculation.
- `lib/dates.js` — date formatting, normalization, and fiscal-year helpers.
- `lib/inventory.js` — product lookup, stock checks, stock mutations, and summaries.
- `lib/invoice.js` — printable invoice figures and HTML rendering.
- `lib/ledger.js` — customer balances, Khata charges/reversals, and settlements.
- `lib/orders.js` — order creation, lookup, cancellation, and filtering.
- `lib/pricing.js` — subtotal, coupon discount, and checkout GST totals.
- `lib/reports.js` — dashboard aggregation and invoice/ledger GST reconciliation.
- `lib/store.js` — synchronous `data/db.json` read/write and audit entries.
- `lib/tax.js` — GST rate selection and CGST/SGST splitting.

## Commands

- Start the app: `node server.js`
- Run tests: `node --test` (there are currently no test files in the repository).

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; they use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Invoice total and GST breakdown do not match what the customer was billed. Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
