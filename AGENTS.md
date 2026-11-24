# Repository Guidelines

## Stack

Node.js with CommonJS, Express 4, and `body-parser` for JSON requests. `server.js` serves the plain HTML, CSS, and JavaScript under `public/`. The app persists data in `data/db.json`.

## Module map

- `routes/customers.js` lists customers and settlements and records Khata payments.
- `routes/orders.js` lists, retrieves, places, and cancels orders.
- `routes/products.js` lists and filters products and lists active coupons.
- `routes/reports.js` serves dashboard and GST reconciliation reports, checkout previews, and admin export.
- `lib/coupons.js` normalizes and validates coupon codes and calculates discounts.
- `lib/dates.js` formats dates, normalizes date strings, and derives fiscal years.
- `lib/inventory.js` looks up products, checks and summarizes sellable stock, deducts stock, and releases reserved quantities.
- `lib/invoice.js` recalculates invoice figures and renders printable HTML.
- `lib/ledger.js` manages Khata balances, order charges, reversals, and settlements.
- `lib/orders.js` adds, retrieves, filters, and cancels stored orders.
- `lib/pricing.js` calculates checkout totals and applies line GST after allocating coupon discounts.
- `lib/reports.js` aggregates dashboard metrics and compares stored order figures with invoice figures.
- `lib/store.js` reads and writes the JSON store and appends audit entries.
- `lib/tax.js` resolves item GST rates and splits GST into CGST and SGST.

## Commands

- `npm start` starts the app on port 3000 by default. Set `PORT` to override it.
- `node --test` runs Node's built-in test runner. The repo currently has no test files, and `npm test` is a failing placeholder.

## Rules

1. Write characterization tests before changing behavior.
2. Change only the modules covered by the ticket.
3. Tests must use in-memory data and must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown can differ from what the customer was billed. Checkout uses HSN slabs on discounted line amounts. The invoice recalculates GST on gross line amounts and falls back to the configured default rate when a line has no saved rate.

Allowed files for the fix are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
