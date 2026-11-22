# ShopLedger

## Stack
- CommonJS Node.js app; Express 4 and body-parser; plain browser HTML/CSS/JS.
- Persistence is synchronous whole-file JSON in data/db.json.
- Test runner: Node's built-in node:test and node:assert/strict.

## Module map
- server.js: Express bootstrap, static assets, API mounts, printable invoice route.
- config.js: shop identity, port, admin key, HSN tax slabs, coupon rules, inventory defaults.
- routes/products.js: product catalogue and active coupons.
- routes/orders.js: order creation, listing, lookup and cancellation.
- routes/customers.js: customer accounts and Khata settlements.
- routes/reports.js: dashboard, GST reconciliation, pricing preview and keyed export.
- lib/store.js: synchronous JSON read/write, structure defaults and bounded audit log.
- lib/inventory.js: stock lookup, sellable quantity, checks, deductions, releases and summary.
- lib/orders.js: order IDs, creation, lookup, cancellation, filtering and sorting.
- lib/dates.js: local date strings, validated sortable date keys and fiscal years.
- lib/ledger.js: customer balances, credit limits, Khata debits, reversals and settlements.
- lib/pricing.js: subtotal, proportional coupon allocation, post-discount GST and totals.
- lib/tax.js: explicit or HSN tax rates, fallback rate and CGST/SGST split.
- lib/coupons.js: normalization, validation, discount limits and coupon listing.
- lib/invoice.js: invoice figures through shared pricing and printable HTML rendering.
- lib/reports.js: dashboard aggregates and stored-order versus invoice reconciliation.
- public/: browser interface, styles and API requests.
- data/db.json: products, orders, customers, settlements, IDs and audit entries.

## Commands
- Start: npm start (ask first; use a temporary project copy for reproduction).
- Tests: node --test (package.json's npm test script is a placeholder).

## Rules
1. Read before editing. Write characterization tests before future behaviour changes.
2. Change only the selected ticket's modules; keep fixes minimal and add no dependencies.
3. Tests use in-memory fixtures and never read or write data/db.json.
4. Preserve existing uncommitted fixes in other ticket modules.
5. Never stage package-lock.json or data/db.json; review the diff before a PR.
6. Ask before network access, branches, servers or work outside this project.
7. Approve one command at a time; no force, all, mirror or tags command options.
8. Never make the repository public, merge a PR, or ask for passwords or tokens.

## Current ticket
- Ticket 1: printable invoice totals and GST must agree with checkout.
- Allowed production file: lib/invoice.js; lib/tax.js only if truly necessary.
- Workshop artifacts: test/invoice.test.js, docs/architecture.svg and this file.
- Invoice, date, ledger, order, inventory and customer-route fixes predate these tests.
- Do not claim these tests preceded those existing fixes; verify the original separately.
