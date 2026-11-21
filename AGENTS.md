# ShopLedger

## Stack
- Node.js, Express 4, body-parser, and a plain HTML/CSS/JavaScript browser UI.
- `server.js` serves `public/`, mounts the API routers, and renders printable invoices; `config.js` holds shop, tax, inventory, and coupon settings.
- `lib/store.js` persists application data in `data/db.json`.

## Module map
- `routes/products.js` — product and active coupon endpoints.
- `routes/orders.js` — order listing, creation, and cancellation endpoints.
- `routes/customers.js` — customer listing and Khata settlement endpoints.
- `routes/reports.js` — dashboard, reconciliation, pricing preview, and export endpoints.
- `lib/coupons.js` — coupon normalization, validation, and discounts.
- `lib/dates.js` — date formatting, normalization, and fiscal year helpers.
- `lib/inventory.js` — stock lookup, checks, changes, and summary.
- `lib/invoice.js` — invoice figure calculation and printable HTML rendering.
- `lib/ledger.js` — customer balances, Khata charges, reversals, and settlements.
- `lib/orders.js` — order creation, lookup, cancellation, and filtering.
- `lib/pricing.js` — checkout subtotals, discounts, taxes, and totals.
- `lib/reports.js` — dashboard summary and invoice reconciliation.
- `lib/store.js` — JSON storage and audit log.
- `lib/tax.js` — item GST rates and CGST/SGST splitting.

## Commands
- Start the app: `node server.js` (or `npm start`).
- Run Node tests: `node --test`. The `npm test` script currently exits with an error; no test suite is present in the repository today.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module or modules the ticket is about.
3. Tests must never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
Invoice total and GST breakdown do not match what the customer was billed. Allowed production files: `lib/invoice.js`; `lib/tax.js` only if truly needed.
