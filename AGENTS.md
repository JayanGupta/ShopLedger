# ShopLedger

## Stack
- Node.js with Express 4; `server.js` serves the API and static files from `public/`.
- Data is read from and written to `data/db.json` by `lib/store.js`.
- Browser UI uses plain JavaScript, HTML, and CSS.

## Module map
- `routes/customers.js` — customer listing and Khata settlement endpoint.
- `routes/orders.js` — order listing, creation, lookup, and cancellation endpoints.
- `routes/products.js` — product listing and active coupon endpoint.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — coupon normalization, validation, listing, and discount calculation.
- `lib/dates.js` — Indian date formatting, date-key normalization, and fiscal-year calculation.
- `lib/inventory.js` — product lookup, sellable stock, stock checks, deduction, release, and summary.
- `lib/invoice.js` — invoice figures and printable HTML rendering.
- `lib/ledger.js` — customer lookup, Khata balance updates, and settlement recording.
- `lib/orders.js` — order creation, lookup, cancellation, and filtered listing.
- `lib/pricing.js` — subtotal, discounts, GST totals, and line breakdowns.
- `lib/reports.js` — dashboard totals and invoice/order GST reconciliation.
- `lib/store.js` — synchronous JSON data read/write and bounded audit log.
- `lib/tax.js` — GST rate resolution and CGST/SGST split.

## Commands
- Start the app: `npm start` (runs `node server.js`).
- Run tests: `node --test`.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; they use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
Cannot sell the last sellable unit in stock, and cancelling an order never restores stock.
Allowed files: `lib/inventory.js`, and `lib/orders.js` (`cancel` only).
