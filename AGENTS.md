# ShopLedger

## Stack
- Node.js application with Express 4 and body-parser.
- Browser UI is static HTML, CSS, and JavaScript served from `public/`.
- Application data is stored in `data/db.json` through `lib/store.js`.

## Module map
- `routes/customers.js` — lists customers and recent settlements; accepts settlement requests.
- `routes/orders.js` — lists, reads, creates, and cancels orders.
- `routes/products.js` — lists products and active coupons.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — normalizes, validates, and calculates coupon discounts.
- `lib/dates.js` — formats today's date, normalizes date keys, and derives fiscal years.
- `lib/inventory.js` — product lookup, sellable stock checks, stock changes, and inventory summary.
- `lib/invoice.js` — computes invoice figures and renders printable invoice HTML.
- `lib/ledger.js` — customer lookup/listing, Khata charges, reversals, and settlements.
- `lib/orders.js` — adds, gets, cancels, and filters/lists orders.
- `lib/pricing.js` — subtotal, discount, and order total calculations.
- `lib/reports.js` — dashboard summary and GST reconciliation calculations.
- `lib/store.js` — reads and writes the JSON store and appends audit entries.
- `lib/tax.js` — resolves GST rates and splits tax into CGST and SGST.

## Commands
- Start the app: `npm start` (runs `node server.js`).
- Run tests: `node --test` (the repository currently has no test files).

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
Order history sorting and date filter are broken, and Khata settlements corrupt customer balances.
Allowed files: `lib/orders.js` (list only), `lib/dates.js`, `lib/ledger.js`, `routes/customers.js`.
