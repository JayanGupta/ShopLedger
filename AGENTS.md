# ShopLedger

## Stack

- Node.js with CommonJS modules, Express and body-parser.
- package.json declares express ^4.17.1 and body-parser ^1.19.0.
- Browser UI uses static HTML, CSS and JavaScript in public/.
- server.js mounts routers at /api and serves printable HTML invoices.
- config.js holds shop details, GST slabs, coupon rules and server settings.
- lib/store.js synchronously reads and rewrites data/db.json.

## Module map

- routes/customers.js — Lists Khata customers and records settlements.
- routes/orders.js — Lists, retrieves, creates and cancels orders.
- routes/products.js — Lists products with stock and GST details, and active coupons.
- routes/reports.js — Dashboard, GST reconciliation, pricing preview and admin export.
- lib/coupons.js — Normalizes, validates and calculates coupon discounts.
- lib/dates.js — Formats dates, normalizes date strings and derives fiscal years.
- lib/inventory.js — Product lookup, sellable stock checks, stock mutations and summaries.
- lib/invoice.js — Recomputes invoice figures and renders printable invoice HTML.
- lib/ledger.js — Customer balances, Khata charges, debit reversals and settlements.
- lib/orders.js — Creates, retrieves, filters and cancels in-memory orders.
- lib/pricing.js — Checkout subtotals, coupon allocation, per-line GST and totals.
- lib/reports.js — Dashboard summaries and stored-order versus invoice reconciliation.
- lib/store.js — JSON persistence, structure defaults and bounded audit log.
- lib/tax.js — GST rate resolution and CGST/SGST splitting.

## Commands

- Start the app from the repository root with `node server.js`.
- Run tests from the repository root with `node --test`.
- No test files are currently present outside node_modules; package.json's test script is a failing placeholder.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write data/db.json; they use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

- Invoice total and GST breakdown do not match what the customer was billed.
- Checkout uses lib/pricing.js, lib/coupons.js and lib/tax.js; lib/invoice.js currently computes figures separately from config.js.
- Allowed files are lib/invoice.js, and lib/tax.js only if truly needed.
