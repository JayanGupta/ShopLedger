# ShopLedger

## Stack
- Node.js and Express 4, using CommonJS modules.
- JSON file persistence in `data/db.json` via `lib/store.js`.
- Browser UI is static HTML, CSS, and JavaScript in `public/`.

## Module map
- `routes/products.js`: product list and active coupon endpoints.
- `routes/orders.js`: order listing, lookup, creation, and cancellation.
- `routes/customers.js`: customer listing and Khata settlement.
- `routes/reports.js`: dashboard, GST reconciliation, pricing preview, and admin export.
- `lib/store.js`: reads, writes, initializes, and audits the JSON store.
- `lib/orders.js`: adds, retrieves, lists, and cancels orders.
- `lib/inventory.js`: product lookup, sellable stock, checks, reservation, release, and summaries.
- `lib/pricing.js`: subtotal, coupon discount, and GST-inclusive checkout totals.
- `lib/tax.js`: GST rate lookup, HSN slabs, and CGST/SGST split.
- `lib/coupons.js`: coupon normalization, validation, discount calculation, and listing.
- `lib/invoice.js`: invoice figures and printable HTML rendering.
- `lib/ledger.js`: customer balances, Khata charges/reversals, and settlements.
- `lib/dates.js`: Indian date formatting, date normalization, and fiscal year helper.
- `lib/reports.js`: dashboard summary and GST reconciliation.

## Commands
- Start the app: `npm start`.
- Run tests: `node --test`.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests use in-memory data and never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
Invoice total and GST breakdown do not match what the customer was billed.
Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
