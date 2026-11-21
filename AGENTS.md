# Repository Guidelines

## Stack

ShopLedger uses Node.js, Express, and CommonJS. The browser UI is plain HTML, CSS, and JavaScript. `server.js` serves `public/`, mounts `/api`, and serves printable invoices. `config.js` holds shop, GST, and coupon settings. `data/db.json` is the tracked seed and local database.

## Module Map

- `routes/products.js` serves the catalog and active coupons.
- `routes/orders.js` handles order placement, lookup, and cancellation.
- `routes/customers.js` lists Khata accounts and records settlements.
- `routes/reports.js` handles dashboards, reconciliation, price previews, and export.
- `lib/coupons.js` validates codes and calculates discounts.
- `lib/dates.js` formats and normalizes dates.
- `lib/inventory.js` checks, deducts, releases, and summarizes stock.
- `lib/invoice.js` computes invoice figures and renders printable HTML.
- `lib/ledger.js` handles Khata charges, limits, and settlements.
- `lib/orders.js` builds, filters, and cancels order records.
- `lib/pricing.js` calculates line and checkout totals.
- `lib/reports.js` summarizes sales and compares ledger and invoice figures.
- `lib/store.js` reads and writes JSON and appends audit entries.
- `lib/tax.js` resolves GST rates and splits CGST and SGST.

See [the architecture diagram](docs/architecture.svg) for the order flow.

## Commands

- `npm install` installs dependencies.
- `npm start` serves the app at `http://localhost:3000`.
- `node --test` runs the in-memory invoice suite. The `npm test` script is a placeholder.

## Rules

1. Write characterization tests before changing behavior.
2. Change only the modules in the ticket's scope.
3. Use in-memory data in tests. Never read or write `data/db.json` from tests.
4. Add no dependencies.
5. Make the smallest fix that works.

Use two-space indentation, single quotes, and camelCase names. Keep test transactions out of commits.

## Current Ticket and Pull Requests

Invoice totals and GST breakdowns must match checkout. The ticket allows `lib/invoice.js` and `test/invoice.test.js`, with `lib/tax.js` only if essential. Use a short, descriptive commit subject. Put the linked issue, tests added, cause, fix, and test result in the PR.
