# Repository Guidelines

## Stack

Node.js with CommonJS, Express, and body-parser. The browser UI uses plain HTML, CSS, and JavaScript in `public/`. `server.js` serves the UI, mounts API routes, and serves printable invoices. `config.js` holds shop, GST, and coupon settings. Persistence uses `data/db.json`.

## Module map

- `routes/customers.js` — lists Khata customers and settlements and records repayments.
- `routes/orders.js` — lists, fetches, places, and cancels orders.
- `routes/products.js` — serves the product catalog and active coupons.
- `routes/reports.js` — serves dashboard and GST reconciliation reports, cart pricing previews, and admin export.
- `lib/coupons.js` — normalizes and validates coupon codes and calculates discounts.
- `lib/dates.js` — formats dates, normalizes date keys, and derives fiscal years.
- `lib/inventory.js` — finds products, checks sellable stock, deducts stock, and manages reservation release.
- `lib/invoice.js` — recalculates invoice figures and renders printable HTML.
- `lib/ledger.js` — manages Khata balances, credit limits, order debits, and settlements.
- `lib/orders.js` — adds, finds, filters, and cancels order records.
- `lib/pricing.js` — computes checkout discounts, per-line GST, and order totals.
- `lib/reports.js` — summarizes dashboard metrics and compares saved orders with invoice figures.
- `lib/store.js` — reads and writes the JSON database and maintains the audit log.
- `lib/tax.js` — resolves GST rates and splits GST into CGST and SGST.

## Commands

- Start the app with `npm start` or `node server.js`. The default port is 3000.
- Run tests with `node --test`. There are currently no repository test files, and `npm test` is a placeholder.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules the ticket is about.
3. Tests use in-memory data and must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The invoice total and GST breakdown do not match what the customer was billed. Allowed implementation files are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
