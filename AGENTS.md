# ShopLedger

## Stack
CommonJS Node.js; Express 4 and body-parser; vanilla HTML/CSS/JS; JSON storage.

## Module map
- server.js: static UI, API routers, printable invoice endpoint.
- config.js: port, shop details, tax slabs, coupons, inventory defaults, admin key.
- routes/products.js: catalog and active coupons.
- routes/orders.js: order creation, listing, detail, cancellation.
- routes/customers.js: customer balances and settlements.
- routes/reports.js: dashboard, GST audit, pricing preview, admin export.
- lib/coupons.js: normalize, validate and calculate capped discounts.
- lib/dates.js: date formatting, comparison keys, fiscal year.
- lib/inventory.js: stock checks, reservations, releases, summaries.
- lib/invoice.js: invoice figures and printable HTML.
- lib/ledger.js: customer credit, debits, reversals and settlements.
- lib/orders.js: add, get, filter and cancel orders.
- lib/pricing.js: checkout totals and discounted line tax breakdowns.
- lib/reports.js: dashboard aggregation and invoice reconciliation.
- lib/store.js: synchronous JSON reads/writes and audit entries.
- lib/tax.js: explicit/HSN/default rates and CGST/SGST split.
- public/: browser UI; data/db.json: tracked application database.

## Commands
- Install existing dependencies: npm install (only in a temporary app copy).
- Start: npm start (only in a temporary app copy for this ticket).
- Tests: node --test (npm test is a placeholder).

## Rules
1. Write characterization tests before changing behavior.
2. Change only application modules belonging to the current ticket.
3. Tests never read or write data/db.json; use in-memory fixtures.
4. Add no dependencies.
5. Make the smallest fix that works; review the diff before a PR.
6. Do not commit data/db.json or package-lock.json.

## Current ticket
Ticket 1: invoice totals and GST breakdown must match checkout.
Allowed application file: lib/invoice.js; lib/tax.js only if truly needed.
Supporting deliverables: test/invoice.test.js and docs/architecture.svg.
