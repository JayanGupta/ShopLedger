# ShopLedger agent guidance

## Stack
- Node.js CommonJS app using Express 4 and body-parser; browser UI is static HTML, CSS, and JavaScript.
- `lib/store.js` persists products, customers, orders, settlements, and audit entries in `data/db.json`.

## Module map
- `routes/products.js`: product and coupon list endpoints.
- `routes/orders.js`: list, get, create, and cancel order endpoints.
- `routes/customers.js`: customer list and Khata settlement endpoints.
- `routes/reports.js`: dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js`: coupon normalization, validation, and discount calculation.
- `lib/dates.js`: date formatting, normalization, and fiscal year calculation.
- `lib/inventory.js`: product lookup, sellable stock, stock checks, reservation, and release.
- `lib/invoice.js`: invoice figure calculation and printable HTML rendering.
- `lib/ledger.js`: customer lookup, Khata debit/reversal, and settlement recording.
- `lib/orders.js`: order creation, lookup, cancellation, and listing.
- `lib/pricing.js`: checkout subtotal, coupon discount, GST, and total calculation.
- `lib/reports.js`: dashboard summary and invoice/ledger GST reconciliation.
- `lib/store.js`: JSON data read/write and audit entry append.
- `lib/tax.js`: item GST rate resolution and CGST/SGST split.

## Commands
- Start the app: `npm start` (runs `node server.js`).
- Run Node's built-in tests: `node --test`. The current `npm test` script is a placeholder that exits with an error.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
- Invoice total and GST breakdown do not match what the customer was billed.
- Allowed files: `lib/invoice.js`; `lib/tax.js` only if truly needed.
