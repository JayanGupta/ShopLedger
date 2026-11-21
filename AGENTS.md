# ShopLedger

## Stack

Node.js 22 for the workshop, Express 4, body-parser, vanilla browser JavaScript,
and a JSON file datastore at data/db.json. server.js mounts the API and serves
the browser UI and printable invoice. config.js contains shop, GST, and coupon settings.

## Module map

- routes/products.js: product, stock availability, and active coupon endpoints.
- routes/orders.js: checkout, order history, order details, and cancellation.
- routes/customers.js: Khata customers and settlement recording.
- routes/reports.js: dashboard, GST reconciliation, preview, and data export.
- lib/coupons.js: coupon normalization, validation, limits, and discounts.
- lib/dates.js: legacy order dates, date keys, and fiscal years.
- lib/inventory.js: stock lookup, availability, adjustments, and summaries.
- lib/invoice.js: calculates invoice figures and renders printable HTML.
- lib/ledger.js: Khata balances, charges, reversals, and settlements.
- lib/orders.js: creates, looks up, lists, and cancels orders.
- lib/pricing.js: checkout subtotal, coupon allocation, line tax, and totals.
- lib/reports.js: dashboard and ledger versus invoice reconciliation.
- lib/store.js: synchronous JSON reads and writes plus audit entries.
- lib/tax.js: HSN GST resolution and the CGST/SGST split.

## Commands

- In a disposable app copy, run `npm install` then `npm start`.
- Run `node --test` from the repository root.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the production modules named in the current ticket.
3. Use in-memory test fixtures. Tests must never read or write data/db.json.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Issue #1: Invoice total and GST breakdown do not match what the customer was billed.
Production scope: lib/invoice.js, with lib/tax.js only if required.
