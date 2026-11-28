# Repository Guidelines

## Stack

ShopLedger uses Node.js, CommonJS, Express 4, and `body-parser` for JSON requests. The browser UI in `public/` uses HTML, CSS, and plain JavaScript. `server.js` serves the UI, mounts the API under `/api`, and serves printable invoice HTML. `config.js` holds shop settings, GST rates, and coupon rules. The app persists state in `data/db.json`.

## Module map

- `routes/customers.js` lists customers and recent settlements and records Khata payments.
- `routes/orders.js` lists, retrieves, places, and cancels orders.
- `routes/products.js` lists and filters products and lists active coupons.
- `routes/reports.js` serves dashboard and GST reconciliation reports, cart price previews, and a key-gated JSON export.
- `lib/coupons.js` normalizes codes, validates eligibility, and computes discounts.
- `lib/dates.js` formats dates, normalizes date keys, and derives fiscal years.
- `lib/inventory.js` looks up products, checks sellable stock, updates stock and reservations, and summarizes inventory.
- `lib/invoice.js` recomputes invoice figures and renders printable HTML.
- `lib/ledger.js` manages customer balances, Khata charges and reversals, and settlements.
- `lib/orders.js` creates, retrieves, filters, and cancels order records.
- `lib/pricing.js` calculates checkout totals by allocating coupon discounts across lines and applying GST to the discounted amounts.
- `lib/reports.js` summarizes dashboard figures and compares stored order totals and GST with invoice calculations.
- `lib/store.js` reads and writes the JSON store and maintains the audit log.
- `lib/tax.js` resolves GST rates and splits GST into CGST and SGST.

## Commands

- `npm start` starts the app on port 3000 by default. Set `PORT` to override it.
- `node --test` runs tests with Node's built-in runner. There are currently no repository test files, and `npm test` is a failing placeholder.

## Rules

1. Write characterization tests before changing behavior.
2. Change only the module or modules the ticket is about.
3. Use in-memory data in tests. Tests must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Invoice total and GST breakdown do not match what the customer was billed. Checkout applies GST after allocating discounts across lines. The invoice separately recomputes GST on gross line amounts.

Allowed files for the fix are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
