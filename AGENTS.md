# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and `body-parser` for JSON requests.
- Static HTML, CSS, and browser JavaScript in `public/`. The server renders printable invoices as HTML.
- Synchronous JSON persistence in `data/db.json`.

## Module map

- `routes/customers.js` lists Khata customers and records settlements.
- `routes/orders.js` lists, retrieves, places, and cancels orders.
- `routes/products.js` lists and filters products and lists active coupons.
- `routes/reports.js` serves dashboard and GST reconciliation data, cart pricing previews, and admin exports.
- `lib/coupons.js` normalizes coupon codes, checks eligibility, and calculates discounts.
- `lib/dates.js` formats the current date, normalizes date keys, and derives fiscal years.
- `lib/inventory.js` finds products, checks sellable stock, updates stock and reservations, and summarizes inventory.
- `lib/invoice.js` recomputes invoice figures and renders printable HTML.
- `lib/ledger.js` manages Khata balances, order debits and reversals, and settlements.
- `lib/orders.js` creates, retrieves, filters, and cancels order records.
- `lib/pricing.js` computes checkout totals, apportions discounts, and calculates line GST.
- `lib/reports.js` aggregates dashboard figures and compares stored order figures with recomputed invoice figures.
- `lib/store.js` reads and writes the JSON database and maintains the audit log.
- `lib/tax.js` resolves GST rates and splits GST into CGST and SGST.

## Commands

- Start the app with `node server.js` or `npm start`.
- Run tests with `node --test`. The repo currently has no test files, and `npm test` is a placeholder that exits with an error.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules the ticket is about.
3. Use in-memory data for tests. Tests must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printed invoice total and GST breakdown do not match what the customer was billed. Checkout saves its totals on the order, and the invoice recomputes them with separate GST and coupon rules.

Allowed files for the fix are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
