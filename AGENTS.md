# ShopLedger

## Stack

- Node.js with CommonJS, Express 4 and body-parser 1.
- `server.js` serves plain HTML, CSS and JavaScript from `public/` and mounts the routers under `/api`.
- `config.js` holds shop, GST, coupon and inventory settings. The app stores its data in `data/db.json`.

## Module map

- `routes/customers.js` lists Khata customers and recent settlements and records payments.
- `routes/orders.js` lists and retrieves orders, places orders and handles cancellations.
- `routes/products.js` lists and filters catalog products and lists active coupons.
- `routes/reports.js` serves dashboard reports, GST reconciliation, cart pricing previews and the admin export.
- `lib/coupons.js` normalizes codes, validates coupons and calculates discounts.
- `lib/dates.js` formats local dates, converts date filter keys and derives fiscal-year labels.
- `lib/inventory.js` looks up products, checks sellable stock, adjusts stock or reservations and summarizes inventory.
- `lib/invoice.js` recalculates invoice figures from saved order items and renders printable HTML.
- `lib/ledger.js` tracks Khata balances, checks credit limits, reverses order debits and records settlements.
- `lib/orders.js` creates, retrieves, filters and cancels orders.
- `lib/pricing.js` calculates checkout totals with proportional coupon discounts and GST on discounted line amounts.
- `lib/reports.js` builds dashboard summaries and compares saved order totals and GST with invoice figures.
- `lib/store.js` reads and rewrites `data/db.json` synchronously and maintains the audit log.
- `lib/tax.js` resolves item GST rates and splits GST into CGST and SGST.

## Commands

- Start the app with `npm start`, which runs `node server.js`. The port is `PORT` or 3000 by default.
- Run tests with `node --test`. The `npm test` script is a placeholder.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules the ticket is about.
3. Use in-memory data in tests. Tests must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The invoice total and GST breakdown do not match what the customer was billed. Checkout saves the billed totals on the order. `computeInvoiceFigures()` recomputes the invoice using its own GST and coupon calculations.

The allowed file is `lib/invoice.js`. Change `lib/tax.js` only if truly needed.
