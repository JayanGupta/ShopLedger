# ShopLedger

## Stack
Node.js CommonJS. Express 4.17 and body-parser 1.19. No build step and no test dependencies. The database is data/db.json.

## Module map
- server.js — Express app, serves public/, mounts /api, GET /orders/:id/invoice.
- config.js — port, shop profile, HSN GST slabs, coupon catalog, admin key.
- routes/products.js — GET /products and GET /coupons.
- routes/orders.js — list, fetch, create, and cancel orders.
- routes/customers.js — khata accounts and POST settlement.
- routes/reports.js — dashboard, GST reconciliation, price preview, admin export.
- lib/store.js — read and write data/db.json; append the audit log.
- lib/inventory.js — sellable quantity, stock check, reserve, release.
- lib/pricing.js — subtotal, coupon discount, GST on post-discount lines.
- lib/tax.js — HSN slab rate and CGST/SGST split.
- lib/coupons.js — normalise, validate, and cap discounts.
- lib/orders.js — add, get, list (filter and sort), cancel.
- lib/dates.js — today as DD/MM/YYYY, sortable date keys, fiscal year.
- lib/ledger.js — khata charge, debit reversal, settlement.
- lib/invoice.js — invoice figures and printable HTML.
- lib/reports.js — dashboard totals and ledger-versus-invoice reconciliation.
- public/ — billing desk, order history, khata, and audit screens.
- data/db.json — products, customers, orders, settlements, audit log.

## Commands
- npm start — listens on port 3000 (override with PORT).
- node --test — runs test/*.test.js.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write data/db.json; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current tickets
- Invoice totals and GST must match checkout. Allowed: lib/invoice.js (lib/tax.js only if required).
- Order sort, date filter, and khata settlement amounts. Allowed: lib/orders.js (list), lib/dates.js, lib/ledger.js, routes/customers.js.
- Selling the last unit, and restoring stock on cancel. Allowed: lib/inventory.js, lib/orders.js (cancel).
