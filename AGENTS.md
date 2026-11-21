# Repository Guidelines

## Project Structure & Module Organization

ShopLedger uses Node.js, Express, CommonJS, and plain browser JavaScript.

- `server.js`: Express setup, static assets, API mounts, printable invoice endpoint.
- `config.js`: shop settings, port, GST slabs, coupons, inventory defaults.
- `routes/products.js`: catalog and coupons.
- `routes/orders.js`: order lookup, creation, filtering, cancellation.
- `routes/customers.js`: customer accounts and settlements.
- `routes/reports.js`: dashboard, GST audit, pricing preview, export.
- `lib/pricing.js`: checkout totals and discount allocation.
- `lib/coupons.js`: coupon normalization, validation, discounts.
- `lib/tax.js`: GST rates and CGST/SGST splitting.
- `lib/invoice.js`: invoice calculations and HTML rendering.
- `lib/inventory.js`: sellable stock, checks, deductions, release.
- `lib/orders.js`: order creation, lookup, listing, cancellation.
- `lib/ledger.js`: Khata balances, charges, settlements, reversals.
- `lib/dates.js`: date formatting, normalization, fiscal years.
- `lib/reports.js`: dashboard summaries and invoice reconciliation.
- `lib/store.js`: synchronous JSON persistence and audit entries.
- `public/`: HTML, CSS, browser scripts; `docs/architecture.svg`: architecture.
- `data/db.json`: tracked application data; `test/invoice.test.js`: in-memory invoice and checkout tests.

## Build, Test, and Development Commands

Use Node.js 22 or newer for the workshop.

- `npm install`: install dependencies; may generate an untracked lockfile.
- `npm start`: run the app at `http://localhost:3000`.
- `node --test`: run Node's built-in invoice tests.

No build, lint, formatter, or coverage configuration exists; `npm test` is a failing placeholder.

## Coding Style & Naming Conventions

Use two-space indentation, semicolons, single quotes, camelCase functions, and lowercase filenames. Preserve CommonJS `require`/`exports` and surrounding legacy style.

## Testing Guidelines

Use `node:test` and `node:assert`; name files `test/*.test.js` (invoice: `test/invoice.test.js`). Write passing characterization tests first; prefix incorrect-behavior cases with `CURRENT BEHAVIOUR:`. Show a failing regression test before fixing behavior. Cover HSN-only items, mixed GST slabs, coupons, caps, and rounding. Use in-memory data; never read/write `data/db.json` or invoke persistent store functions.

## Commit & Pull Request Guidelines

History uses short, lowercase descriptions, e.g., `invoice page for accountant`; no enforced prefixes. Use `fix/<short-name>` branches. PRs should link the issue (`Fixes #<number>`), explain cause/fix and tests added first, include results/screenshots, and receive review. Stage explicit files; exclude data changes and generated lockfiles.

## Current Ticket & Safety Rules

Ticket 1: match invoice totals/GST to checkout. Production scope: `lib/invoice.js`; `lib/tax.js` only if necessary. Read pricing, coupons, and config as references. Make the smallest fix; add no dependencies; ask before expanding scope. Reproduce mutations in a temporary copy. Never commit credentials; `config.js` contains a workshop admin key.
