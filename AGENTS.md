# ShopLedger

## Stack
- Node.js with CommonJS modules; Express (`^4.17.1`) and body-parser (`^1.19.0`) declared in package.json.
- Browser UI uses HTML, CSS, plain JavaScript, and XMLHttpRequest.
- Persistence is synchronous JSON file I/O through lib/store.js to data/db.json.

## Module map
- server.js: Configures Express, serves public/, mounts /api routers, and renders /orders/:id/invoice.
- config.js: Port, shop details, admin key, GST slabs, inventory defaults, and coupon definitions.
- routes/customers.js: Lists customers and recent settlements; records Khata settlements.
- routes/orders.js: Lists, retrieves, creates, and cancels orders; coordinates stock, pricing, and Khata charges.
- routes/products.js: Lists products with stock and GST information; lists active coupons.
- routes/reports.js: Dashboard, GST reconciliation, pricing preview, and key-protected database export.
- lib/coupons.js: Normalizes codes, validates coupons, calculates capped discounts, and lists active coupons.
- lib/dates.js: Formats today's date, normalizes date keys, and derives fiscal years.
- lib/inventory.js: Finds products, computes sellable stock, checks quantities, updates stock/reservations, and summarizes inventory.
- lib/invoice.js: Independently recomputes invoice figures and renders printable HTML.
- lib/ledger.js: Finds/lists customers, charges/reverses Khata orders, and records settlements.
- lib/orders.js: Adds, retrieves, cancels, and filters orders.
- lib/pricing.js: Computes subtotal, proportional coupon allocation, post-discount line GST, and checkout totals.
- lib/reports.js: Summarizes sales, Khata, and inventory; compares stored order totals with invoice figures.
- lib/store.js: Reads/writes data/db.json, supplies missing collections/counters, and retains up to 100 audit entries.
- lib/tax.js: Resolves explicit GST rates or exact HSN slab matches with a default fallback; splits CGST/SGST.
- public/: POS, order register, Khata, inventory, and reconciliation browser views.
- data/db.json: Products, customers, orders, settlements, audit log, and ID counters.

## Commands
- Start the app: `node server.js` (package.json also defines `npm start`); port is PORT or 3000.
- Run tests with Node's built-in runner: `node --test`.
- package.json's `npm test` is a placeholder that exits with an error; no project test files were found outside node_modules.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write data/db.json; they use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
- Invoice total and GST breakdown do not match what the customer was billed.
- Checkout uses lib/pricing.js and lib/tax.js; lib/invoice.js independently recomputes tax and coupon discounts using different rules.
- Allowed files: lib/invoice.js (lib/tax.js only if truly needed).
