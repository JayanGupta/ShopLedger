# ShopLedger agent notes

## Stack
- Node.js CommonJS app using Express 4 and body-parser; static browser UI lives in `public/`.
- Persistent application data is JSON at `data/db.json`; `lib/store.js` reads and writes it synchronously.

## Module map
- `routes/products.js`: product catalogue and active-coupon API endpoints.
- `routes/orders.js`: order listing, placement, stock reservation, coupon validation, and cancellation endpoints.
- `routes/customers.js`: khata customer listing and settlement endpoint.
- `routes/reports.js`: dashboard, GST reconciliation, pricing-preview, and export endpoints.
- `lib/coupons.js`: coupon normalization, validation, and capped discount calculations.
- `lib/dates.js`: Indian date formatting, date-key normalization, and fiscal-year calculation.
- `lib/inventory.js`: product lookup, sellable-stock checks, stock reserve/release, and inventory summary.
- `lib/invoice.js`: printable invoice figures and HTML rendering.
- `lib/ledger.js`: khata balances, order charges/reversals, and settlements.
- `lib/orders.js`: order creation, lookup, cancellation, and filtering.
- `lib/pricing.js`: checkout subtotal, coupon, HSN-GST, and total calculation.
- `lib/reports.js`: dashboard and invoice-versus-ledger reconciliation calculations.
- `lib/store.js`: JSON database structure, read/write, and audit-log helpers.
- `lib/tax.js`: HSN GST rate resolution and CGST/SGST split.

## Commands
- Start: `npm start`
- Run tests: `node --test`

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) covered by the active ticket.
3. Tests must use in-memory data only; never read or write `data/db.json`.
4. Do not add dependencies.
5. Make the smallest fix that works.

## Current ticket
Invoice total and GST breakdown do not match the customer checkout bill. Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
