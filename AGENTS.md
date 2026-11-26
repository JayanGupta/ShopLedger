# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and `body-parser` for JSON requests.
- Static HTML, CSS, and browser JavaScript in `public/`, served by `server.js`.
- Synchronous JSON persistence in `data/db.json` through `lib/store.js`.

## Module map

- `routes/customers.js` lists Khata customers and recent settlements, and records settlements.
- `routes/orders.js` lists, retrieves, places, and cancels orders.
- `routes/products.js` lists and filters the product catalog and lists active coupons.
- `routes/reports.js` serves dashboard and GST reconciliation reports, pricing previews, and a key-protected data export.
- `lib/coupons.js` normalizes and validates coupon codes, calculates discounts, and lists active coupons.
- `lib/dates.js` formats dates, normalizes date filters, and derives fiscal-year labels.
- `lib/inventory.js` finds products, checks sellable stock, deducts physical stock, releases held units, and summarizes inventory.
- `lib/invoice.js` recalculates invoice figures and renders printable HTML.
- `lib/ledger.js` tracks customer balances and credit limits, charges or reverses order debits, and records settlements.
- `lib/orders.js` creates, finds, lists, and cancels order records.
- `lib/pricing.js` calculates checkout totals with proportionally allocated coupon discounts and per-line GST.
- `lib/reports.js` summarizes dashboard metrics and compares saved order GST and totals with invoice figures.
- `lib/store.js` reads and writes the JSON database and appends audit entries.
- `lib/tax.js` resolves item GST rates and splits GST into CGST and SGST.

## Commands

- Start the app with `npm start` (`node server.js`). It defaults to port 3000 and accepts `PORT`.
- Run tests with `node --test`. The repository currently has no test files, and `npm test` is a placeholder that exits with an error.

## Rules

1. Write characterization tests before changing behavior.
2. Change only the modules covered by the ticket.
3. Use in-memory data in tests. Tests must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown do not match what the customer was billed. Checkout applies coupon discounts before per-line GST, while invoice rendering recalculates GST on undiscounted lines and applies the coupon afterward.

Allowed files are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
