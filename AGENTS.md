# ShopLedger contributor guide

## Commands

- Install with `npm install`; start with `npm start`; test with `node --test`.
- Use Node's built-in test runner and fixture objects. Tests must not read or mutate `data/db.json`.

## Stack

- Node.js, Express 4, CommonJS modules, browser JavaScript/CSS, and a JSON-backed local store.

## Module map

- `server.js`: Express setup, static UI, API routers, and printable invoice route.
- `config.js`: port, shop metadata, tax slabs, and coupon definitions.
- `routes/orders.js`: order API validation and checkout orchestration.
- `routes/products.js`: product API.
- `routes/customers.js`: Khata customer and settlement API.
- `routes/reports.js`: dashboard, GST reconciliation, and pricing preview API.
- `lib/store.js`: reads and writes `data/db.json`.
- `lib/orders.js`: creates, queries, filters, and cancels orders.
- `lib/inventory.js`: stock lookup, availability, reservation, and release.
- `lib/ledger.js`: customer balances and Khata charges/settlements.
- `lib/pricing.js`: checkout source of truth for totals and per-line tax.
- `lib/tax.js`: resolves HSN GST slabs and CGST/SGST split.
- `lib/coupons.js`: normalizes, validates, and calculates discounts.
- `lib/invoice.js`: formats printable invoice figures.
- `lib/reports.js`: reconciles invoice figures against stored order totals.
- `lib/dates.js`: formats and normalizes date values.

## Current ticket and allowed files

- Ticket 1 — Invoice total and GST breakdown do not match what the customer was billed (upstream #1).
- Allowed production files: `lib/invoice.js` (`lib/tax.js` only if truly needed). Regression tests: `test/invoice.test.js`.
- Documentation artifacts: `docs/architecture.svg` and this `AGENTS.md`.

## Required rules

1. Do not edit, reset, or commit `data/db.json`; use inline fixtures in tests.
2. Add a passing characterization test before changing legacy behaviour, then turn it into a failing regression test before the fix.
3. Reuse `pricing.computeTotals(items, coupon)` for invoice monetary figures; do not duplicate coupon or HSN tax rules.
4. Make the smallest fix that works. Keep changes scoped to the current ticket's allowed files; do not add dependencies or commit `node_modules/` or `package-lock.json`.
5. Preserve ES5 CommonJS and semicolon style. Before committing, run `node --test`, `git diff --check`, and inspect `git status`.
