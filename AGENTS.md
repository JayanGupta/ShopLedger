# ShopLedger contributor guide

## Stack
Node.js CommonJS application using Express, body-parser, static HTML/CSS/JS, and a JSON file store.

## Module map
- `routes/products.js`: lists products and active coupons.
- `routes/orders.js`: lists, creates, reads, and cancels orders.
- `routes/customers.js`: lists Khata data and records settlements.
- `routes/reports.js`: serves dashboard, GST reconciliation, pricing preview, and admin export.
- `lib/coupons.js`: normalizes, validates, and calculates coupon discounts.
- `lib/dates.js`: formats and normalizes date keys.
- `lib/inventory.js`: finds products and checks, reserves, releases, and summarizes stock.
- `lib/invoice.js`: calculates and renders printable HTML invoices.
- `lib/ledger.js`: manages customer credit and settlement balances.
- `lib/orders.js`: creates, reads, cancels, and filters saved orders.
- `lib/pricing.js`: calculates cart totals and line-level GST figures.
- `lib/reports.js`: calculates dashboard and GST reconciliation data.
- `lib/store.js`: reads and writes `data/db.json` and appends audit events.
- `lib/tax.js`: resolves HSN GST rates and splits CGST/SGST.

## Commands
- Start app: `npm start`
- Run tests: `node --test`

## Rules
1. Add characterization tests before changing behaviour.
2. Change only the ticket's modules.
3. Tests never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
Invoice total and GST breakdown do not match what the customer was billed.
Allowed implementation files: `lib/invoice.js` and only if truly needed `lib/tax.js`.
Test file: `test/invoice.test.js`.
