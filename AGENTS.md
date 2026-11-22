# ShopLedger

## Stack

- Node.js and CommonJS JavaScript with Express 4 and body-parser 1.
- Express serves the plain HTML, CSS, and browser JavaScript in `public/`.
- `lib/store.js` persists application data in `data/db.json`.

## Module map

- `routes/customers.js` lists Khata customers and recent settlements and records repayments.
- `routes/orders.js` lists, fetches, places, and cancels orders.
- `routes/products.js` lists products and active coupons.
- `routes/reports.js` serves dashboard and GST reports, checkout previews, and admin export.
- `lib/coupons.js` normalizes and validates coupon codes and calculates discounts.
- `lib/dates.js` supplies date and fiscal-year helpers.
- `lib/inventory.js` finds products, checks sellable stock, and handles stock updates and summaries.
- `lib/invoice.js` calculates invoice figures and renders printable HTML.
- `lib/ledger.js` manages Khata charges, balances, reversals, and settlements.
- `lib/orders.js` adds, finds, filters, and cancels stored orders.
- `lib/pricing.js` applies coupon discounts and calculates checkout totals and line GST.
- `lib/reports.js` summarizes the dashboard and compares stored order amounts with invoice figures.
- `lib/store.js` reads and writes the JSON store and appends audit entries.
- `lib/tax.js` resolves item GST rates and splits GST into CGST and SGST.

## Commands

Run from the repo root with the existing dependencies installed.

- Start the app with `npm start` (`node server.js`). The default port is 3000.
- Run tests with `node --test`. The repo has no test files yet, and `npm test` is a placeholder.

## Rules

1. Write characterization tests before changing behavior.
2. Change only the application modules named in the ticket.
3. Tests must use in-memory data and must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown do not match what the customer was billed.
Allowed application files are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
