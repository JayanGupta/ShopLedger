# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and `body-parser` for JSON requests.
- Express serves plain HTML, CSS, and browser JavaScript from `public/`.
- The app persists data in `data/db.json` using synchronous Node.js filesystem calls.

## Module map

- `routes/customers.js` lists Khata customers and recent settlements and records repayments.
- `routes/orders.js` lists, retrieves, places, and cancels orders.
- `routes/products.js` lists products with stock and GST information and lists active coupons.
- `routes/reports.js` serves dashboard and GST reconciliation reports, pricing previews, and admin exports.
- `lib/coupons.js` normalizes and validates coupon codes and calculates discounts.
- `lib/dates.js` formats dates, normalizes date keys, and derives fiscal years.
- `lib/inventory.js` finds products, checks sellable stock, updates stock and reservations, and summarizes inventory.
- `lib/invoice.js` recomputes invoice figures and renders printable HTML.
- `lib/ledger.js` manages Khata balances, credit charges, reversals, and settlements.
- `lib/orders.js` stores, retrieves, filters, and cancels order records in memory.
- `lib/pricing.js` computes checkout totals with proportional coupon discounts and GST by line.
- `lib/reports.js` summarizes dashboard metrics and compares invoice figures with saved orders.
- `lib/store.js` reads and rewrites the JSON datastore and records audit entries.
- `lib/tax.js` resolves GST rates and splits GST into CGST and SGST.

## Commands

- Start the app with `node server.js`.
- Run tests with `node --test`. The `npm test` script is a failing placeholder.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules the ticket is about.
3. Use in-memory data in tests. Never read or write `data/db.json` in tests.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown do not match what the customer was billed. Checkout saves the billed amounts, and the printable invoice recomputes them separately.

Allowed files are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
