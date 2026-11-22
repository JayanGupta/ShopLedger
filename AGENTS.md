# ShopLedger Agent Guide

## Stack
- Node.js CommonJS application using Express 4 and body-parser for JSON requests.
- Browser UI is static HTML, CSS, and JavaScript served from public/.
- Application data is stored in data/db.json through synchronous filesystem reads and writes.

## Module map
- routes/products.js - lists products and active coupons.
- routes/orders.js - lists, reads, places, and cancels orders; validates pricing and charges Khata.
- routes/customers.js - lists customer balances and records Khata settlements.
- routes/reports.js - dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- lib/coupons.js - normalizes, validates, and calculates configured coupon discounts.
- lib/dates.js - formats today's date and normalizes date keys.
- lib/inventory.js - finds products, checks sellable stock, reserves/releases quantities, and summarizes inventory.
- lib/invoice.js - computes invoice figures and renders printable HTML.
- lib/ledger.js - customer balances, Khata debits/reversals, and settlement records.
- lib/orders.js - creates, finds, cancels, and filters orders.
- lib/pricing.js - subtotal and order totals with line-level GST.
- lib/reports.js - dashboard summary and stored-order/invoice reconciliation.
- lib/store.js - reads/writes data/db.json and appends audit entries.
- lib/tax.js - resolves GST rates from item rate or HSN slab and splits CGST/SGST.

## Commands
- Start the app: node server.js
- Run tests: node --test

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write data/db.json; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
Invoice total and GST breakdown do not match what the customer was billed.
Allowed files: lib/invoice.js (lib/tax.js only if truly needed).
