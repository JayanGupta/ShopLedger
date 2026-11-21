# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and `body-parser` for JSON requests.
- Express serves plain HTML, CSS, and browser JavaScript from `public/`.
- Persistence uses synchronous file reads and writes to `data/db.json`.

## Module map

- `routes/customers.js` lists Khata accounts and records settlements.
- `routes/orders.js` lists, retrieves, places, and cancels orders.
- `routes/products.js` lists catalog products and active coupons.
- `routes/reports.js` serves dashboard and GST reconciliation reports, cart previews, and data export.
- `lib/coupons.js` normalizes and validates codes, calculates discounts, and lists active coupons.
- `lib/dates.js` formats dates, normalizes date filter inputs, and derives fiscal-year labels.
- `lib/inventory.js` finds products, calculates sellable stock, checks orders, updates stock or reservations, and summarizes inventory.
- `lib/invoice.js` recalculates invoice figures and renders printable HTML.
- `lib/ledger.js` looks up Khata customers, applies or reverses order charges, and records settlements.
- `lib/orders.js` creates, retrieves, lists, and cancels order records.
- `lib/pricing.js` computes checkout subtotals, discounts, per-line GST, and totals.
- `lib/reports.js` summarizes the dashboard and compares invoice figures with saved order figures.
- `lib/store.js` reads and writes the JSON store and appends audit entries.
- `lib/tax.js` resolves item GST rates and splits GST into CGST and SGST.

## Commands

- Start the app with `node server.js` (`PORT` defaults to `3000`).
- Run tests with `node --test`. The `npm test` script is a failing placeholder.

## Rules

1. Write characterization tests before changing behavior.
2. Change only the modules the ticket is about.
3. Tests must use in-memory data and must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown can differ from what the customer was billed. Checkout saves the billed figures, and the invoice calculates its own figures from the saved items and configuration.

Allowed implementation files are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
