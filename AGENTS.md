# ShopLedger contributor guide

## Commands

- Install with `npm install`; start with `npm start`; test with `node --test`.
- Use Node's built-in test runner and fixture objects. Tests must not read or mutate `data/db.json`.

## Module map

- `server.js` configures Express, static UI, API routers, and the printable invoice route.
- `config.js` holds the port, shop metadata, tax slabs, and coupon definitions.
- `routes/` owns HTTP validation and orchestration: orders, products, customers, and reports.
- `lib/store.js` persists `data/db.json`; `lib/orders.js`, `inventory.js`, and `ledger.js` own order, stock, and Khata behaviour.
- `lib/pricing.js` is the checkout source of truth; `tax.js` resolves HSN GST and `coupons.js` applies coupon rules.
- `lib/invoice.js` formats figures for printable invoices; `lib/reports.js` reconciles invoice figures against stored order totals.

## Current ticket and allowed files

- Ticket 1 — Invoice & GST mismatch (upstream #1).
- Production change: `lib/invoice.js` only. Regression tests: `test/invoice.test.js`.
- Documentation artifacts: `docs/architecture.svg` and this `AGENTS.md`.

## Required rules

1. Do not edit, reset, or commit `data/db.json`; use inline fixtures in tests.
2. Add a passing characterization test before changing legacy behaviour, then turn it into a failing regression test before the fix.
3. Reuse `pricing.computeTotals(items, coupon)` for invoice monetary figures; do not duplicate coupon or HSN tax rules.
4. Keep changes scoped to the current ticket's allowed files. Do not add dependencies or commit `node_modules/` or `package-lock.json`.
5. Preserve ES5 CommonJS and semicolon style. Before committing, run `node --test`, `git diff --check`, and inspect `git status`.
