# ShopLedger

## Stack
- Node.js CommonJS application using Express 4 and body-parser.
- Browser assets are served from `public/`; application records are stored in `data/db.json`.

## Module map
- `routes/customers.js` — customer listing and Khata settlement endpoints.
- `routes/orders.js` — order listing, retrieval, placement, and cancellation endpoints.
- `routes/products.js` — product listing and active coupon endpoints.
- `routes/reports.js` — dashboard and GST reports, pricing preview, and admin export.
- `lib/coupons.js` — coupon normalization, validation, discount calculation, and listing.
- `lib/dates.js` — date formatting, normalization, and fiscal year calculation.
- `lib/inventory.js` — product lookup, sellable stock, inventory checks, deductions, releases, and summary.
- `lib/invoice.js` — invoice figures and printable HTML rendering.
- `lib/ledger.js` — customer balances, Khata charges/reversals, and settlements.
- `lib/orders.js` — order creation, lookup, cancellation, and filtering.
- `lib/pricing.js` — subtotal, discount, tax, and order totals.
- `lib/reports.js` — dashboard summary and GST reconciliation.
- `lib/store.js` — JSON file read/write and audit log updates.
- `lib/tax.js` — GST rate resolution and CGST/SGST split.

## Commands
- Start the app: `node server.js` (equivalent to the package `start` script).
- Run tests: `node --test`.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; they use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
Cannot sell the last sellable unit in stock, and cancelling an order never restores stock.

Allowed files: `lib/inventory.js`, and `lib/orders.js` (cancel only).
