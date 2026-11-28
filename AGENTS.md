# AGENTS.md

## Stack
- Node.js CommonJS application using Express 4 and body-parser.
- Browser UI is served from public/ (HTML, CSS and JavaScript).
- Persistent application data is stored in data/db.json through lib/store.js.
- Tests use the built-in node:test and node:assert modules; no test dependencies are installed.

## Module map
- server.js — creates the Express app, serves public/, mounts routers and renders invoice pages.
- config.js — port, shop metadata, GST slabs, inventory defaults and coupon definitions.
- routes/products.js — product catalogue and active coupon endpoints.
- routes/orders.js — order list/detail/create/cancel endpoints.
- routes/customers.js — customer Khata balances and settlement endpoint.
- routes/reports.js — dashboard, GST reconciliation, pricing preview and admin export endpoints.
- lib/coupons.js — coupon normalization, lookup, validation and discount calculation.
- lib/dates.js — DD/MM/YYYY date formatting, normalization and fiscal-year helper.
- lib/inventory.js — product lookup, sellable-stock checks, stock reserve/release and summary.
- lib/invoice.js — accountant invoice calculations and HTML rendering.
- lib/ledger.js — customer lookup, Khata charges/reversals and settlements.
- lib/orders.js — order add/get/cancel/list business logic.
- lib/pricing.js — subtotal, coupon discount and item-level GST totals.
- lib/reports.js — dashboard summary and GST reconciliation.
- lib/store.js — reads/writes the JSON database and appends audit entries.
- lib/tax.js — HSN GST-rate resolution and CGST/SGST split.
- public/ — static POS, order-history, Khata and GST-audit interface.
- data/db.json — JSON-backed products, orders, customers, settlements and audit log.

## Commands
- Start the app: `npm start`
- Run tests: `node --test`

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests must use in-memory data; never read or write data/db.json.
4. Add no dependencies.
5. Make the smallest fix that works.
6. Never stage or modify data/db.json or package-lock.json for this ticket.

## Current ticket
Cannot sell the last sellable unit in stock, and cancelling an order never restores stock.
Allowed implementation files: lib/inventory.js and lib/orders.js (cancel only).
