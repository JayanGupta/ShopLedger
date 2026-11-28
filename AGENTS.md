# ShopLedger

## Stack
- Node.js CommonJS app using Express 4 and body-parser.
- Browser UI is static HTML, CSS, and JavaScript in `public/`.
- Persistent records are stored in `data/db.json` through `lib/store.js`.

## Module map
- `routes/customers.js` — customer/Khata listing and settlement endpoint.
- `routes/orders.js` — order listing, creation, lookup, and cancellation endpoints.
- `routes/products.js` — product catalog and active coupon endpoints.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — coupon normalization, validation, discount calculation, and active coupon listing.
- `lib/dates.js` — current date, date-key normalization, and fiscal-year helper.
- `lib/inventory.js` — product lookup, sellable stock, stock checks, reserve/release, and summary.
- `lib/invoice.js` — invoice figure calculation and printable HTML rendering.
- `lib/ledger.js` — customer lookup, Khata balances/charges/reversals, and settlements.
- `lib/orders.js` — add, get, cancel, and filter/sort orders.
- `lib/pricing.js` — subtotal, discount delegation, and checkout total calculation.
- `lib/reports.js` — dashboard summary and comparison of saved order figures with invoice figures.
- `lib/store.js` — read/write JSON database and append bounded audit log.
- `lib/tax.js` — GST rate resolution, slab percentage, and CGST/SGST split.

## Commands
- Start the app: `npm start`
- Run tests: `node --test`

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; they use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
- Invoice total and GST breakdown do not match what the customer was billed.
- Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
