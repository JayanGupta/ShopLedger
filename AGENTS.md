# ShopLedger

## Stack
- Node.js app using Express 4 and body-parser for JSON request bodies.
- Browser UI is served from public/; business data is read from and written to data/db.json.

## Module map
- routes/customers.js — lists customers and recent settlements; records Khata settlements.
- routes/orders.js — lists, reads, creates, and cancels orders.
- routes/products.js — lists products and active coupons.
- routes/reports.js — dashboard and GST reconciliation, pricing preview, and admin export endpoints.
- lib/coupons.js — normalizes, validates, lists, and calculates coupon discounts.
- lib/dates.js — formats today’s date, normalizes date keys, and calculates fiscal year.
- lib/inventory.js — finds products, checks/reserves/releases stock, and summarizes inventory.
- lib/invoice.js — computes invoice figures and renders printable HTML invoices.
- lib/ledger.js — customer balances, Khata charges/reversals, and settlements.
- lib/orders.js — adds, finds, cancels, and filters orders.
- lib/pricing.js — subtotal, discount, and checkout total calculations.
- lib/reports.js — dashboard summary and invoice-to-ledger GST reconciliation.
- lib/store.js — reads/writes data/db.json and appends audit entries.
- lib/tax.js — resolves item GST rates/slabs and splits CGST/SGST.

## Commands
- Start: `npm start` (package script runs `node server.js`).
- Tests: `node --test`. No test files are present; package.json's `npm test` script is a placeholder that exits with an error.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write data/db.json; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
Invoice total and GST breakdown do not match what the customer was billed.
Allowed files: lib/invoice.js (lib/tax.js only if truly needed).
