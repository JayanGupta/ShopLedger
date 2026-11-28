# Repository Guidelines

## Stack

ShopLedger is a Node.js/Express POS, Khata credit ledger, and GST invoicing app.
It uses CommonJS JavaScript, body-parser, a plain HTML/CSS/JavaScript frontend,
and synchronous JSON-file persistence. No frontend build or lint tool is configured.
Follow existing two-space indentation, semicolons, single quotes, and camelCase names.

## Module Map

- `server.js`: Express setup, static public assets, API mounts, printable invoice route.
- `config.js`: port, shop details, admin key, GST slabs, coupons, inventory settings.
- `routes/products.js`: product catalog and active coupon endpoints.
- `routes/orders.js`: order listing, lookup, placement, and cancellation endpoints.
- `routes/customers.js`: customer listing and Khata settlement endpoint.
- `routes/reports.js`: dashboard, GST reconciliation, pricing preview, and admin export.
- `lib/pricing.js`: checkout totals, proportional pre-tax discount, rounded line GST.
- `lib/tax.js`: item rate resolution, exact HSN lookup, CGST/SGST split.
- `lib/coupons.js`: coupon normalization, validation, capped discount calculation.
- `lib/inventory.js`: sellable stock, checks, deduction, release, inventory summary.
- `lib/orders.js`: order creation, lookup, cancellation, filtering, sorting.
- `lib/ledger.js`: customer lookup, credit checks, order debits, reversals, settlements.
- `lib/invoice.js`: printable HTML and independent invoice figures.
- `lib/reports.js`: dashboard aggregates and invoice/order GST reconciliation.
- `lib/dates.js`: display dates, date normalization, fiscal-year labels.
- `lib/store.js`: synchronous database reads/writes and bounded audit history.

`public/` contains `index.html`, `js/app.js`, and `css/style.css`.
`data/db.json` contains mutable business data; preserve it during development.
`test/orders-ledger.test.js` contains in-memory invoice tests; `docs/architecture.svg` maps the app.

## Commands

- `npm start`: run Express on port 3000; override with `PORT=3100 npm start`.
- `node --test`: run the built-in Node test runner; tests use `node:assert/strict`.
- `npm test`: still a failing placeholder, not the test runner.

Run servers and dependency installation only when authorized. For this ticket,
use a temporary project copy without node_modules, install there, and run on port 3100.

## Rules

1. Write characterization tests before changing behavior; name them `CURRENT BEHAVIOUR:`.
2. Change only the modules the ticket concerns; avoid unrelated style rewrites.
3. Tests use in-memory data and never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works; compare invoice and checkout monetary figures.

## Current Ticket & Pull Requests

Ticket: order sorting/date filters are incorrect and Khata settlement amounts corrupt balances.
Allowed production files: `lib/orders.js` (list only), `lib/dates.js`, and `lib/ledger.js`.
Tests belong in `test/orders-ledger.test.js`. Keep data and lockfile changes out of this ticket.
Use focused, descriptive commits. PRs explain tests added first, cause, fix, and test results.
Link the issue, review before opening, and do not merge without an explicit request.
