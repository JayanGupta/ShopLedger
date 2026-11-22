# ShopLedger

## Stack

- Node.js with CommonJS, Express (^4.17.1), and body-parser (^1.19.0).
- Static HTML, CSS, and browser JavaScript in `public/`, served by `server.js`.
- Synchronous JSON file storage in `data/db.json`. Settings live in `config.js`.

## Module map

- `routes/customers.js` lists customers and records Khata settlements.
- `routes/orders.js` lists, retrieves, places, and cancels orders.
- `routes/products.js` lists products and active coupons.
- `routes/reports.js` serves dashboard and GST reconciliation reports, cart price previews, and admin export.
- `lib/coupons.js` normalizes and validates coupon codes and computes discounts.
- `lib/dates.js` formats dates, normalizes date keys, and calculates fiscal years.
- `lib/inventory.js` finds products, checks sellable stock, updates stock or reservations, and summarizes inventory.
- `lib/invoice.js` recalculates invoice figures and renders printable HTML.
- `lib/ledger.js` looks up customer accounts, applies and reverses Khata charges, and records settlements.
- `lib/orders.js` creates, retrieves, filters, and cancels order records.
- `lib/pricing.js` calculates checkout subtotals, allocated discounts, line GST, and totals.
- `lib/reports.js` summarizes the dashboard and compares stored checkout figures with recalculated invoice figures.
- `lib/store.js` reads and writes the JSON database and keeps the latest 100 audit entries.
- `lib/tax.js` resolves GST rates from item overrides or HSN and splits GST into CGST and SGST.

## Commands

- Start the app with `node server.js` or `npm start`.
- Run tests with `node --test`. The `npm test` script is a failing placeholder.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules the ticket is about.
3. Tests must use in-memory data. Never read or write `data/db.json` from tests.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The invoice total and GST breakdown do not match what the customer was billed.
Checkout applies HSN rates after allocating the coupon discount. The invoice
uses the saved item rate or the fallback rate and calculates GST before the coupon.

Allowed files are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
