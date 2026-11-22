# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and body-parser.
- Static HTML, CSS, and browser JavaScript in public/.
- Synchronous JSON persistence in data/db.json.

## Module map

- `routes/customers.js` lists Khata customers and records settlements.
- `routes/orders.js` lists, retrieves, places, and cancels orders.
- `routes/products.js` lists products and active coupons.
- `routes/reports.js` serves dashboard and GST reconciliation reports, previews checkout totals, and exports the database.
- `lib/coupons.js` normalizes and validates coupon codes and calculates discounts.
- `lib/dates.js` formats and normalizes dates and derives fiscal years.
- `lib/inventory.js` looks up products, checks sellable stock, updates quantities, and summarizes inventory.
- `lib/invoice.js` recalculates invoice amounts and renders printable HTML.
- `lib/ledger.js` tracks Khata charges, reversals, balances, and settlements.
- `lib/orders.js` creates, finds, filters, and cancels order records.
- `lib/pricing.js` allocates coupon discounts and calculates checkout totals and line GST.
- `lib/reports.js` summarizes the dashboard and compares saved order and invoice figures.
- `lib/store.js` reads and writes data/db.json and appends audit entries.
- `lib/tax.js` resolves item GST rates and splits GST into CGST and SGST.

## Commands

- Start the app with `node server.js`.
- Run tests with `node --test`. The repo currently has no test files, and the package test script is a placeholder.

## Rules

1. Write characterization tests before changing behavior.
2. Change only the module(s) the ticket is about.
3. Tests must use in-memory data and must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Invoice total and GST breakdown do not match what the customer was billed.

Allowed files are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
