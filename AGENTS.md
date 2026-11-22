# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and `body-parser` for JSON request bodies.
- `server.js` serves the HTML, CSS, and vanilla JavaScript in `public/`, mounts the API at `/api`, and serves printable invoices.
- `config.js` holds shop settings, GST rates, and coupon rules. `data/db.json` is the JSON data store.

## Module map

- `routes/customers.js` lists Khata accounts and recent settlements and records repayments.
- `routes/orders.js` lists, retrieves, places, and cancels orders.
- `routes/products.js` lists and filters catalog products and lists active coupons.
- `routes/reports.js` serves dashboard totals, GST reconciliation, pricing previews, and admin export.
- `lib/coupons.js` normalizes codes, validates coupons, and calculates discounts.
- `lib/dates.js` formats and normalizes dates and derives fiscal-year labels.
- `lib/inventory.js` looks up products, checks sellable stock, adjusts stock or reservations, and summarizes inventory.
- `lib/invoice.js` recalculates invoice figures and renders printable HTML.
- `lib/ledger.js` tracks Khata balances, checks credit limits, and records charges, reversals, and settlements.
- `lib/orders.js` creates, looks up, filters, sorts, and cancels order records.
- `lib/pricing.js` allocates coupon discounts across lines and computes checkout GST and totals.
- `lib/reports.js` builds dashboard summaries and compares invoice figures with saved order figures.
- `lib/store.js` reads and writes the JSON store and maintains the audit log.
- `lib/tax.js` resolves item GST rates and splits GST into CGST and SGST.

## Commands

- Start from the repo root with `node server.js` (also `npm start`). The port defaults to 3000 and can be set with `PORT`.
- Run tests with `node --test`. The `npm test` script is a failing placeholder.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests must use in-memory data. Never read or write `data/db.json` in tests.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown do not match what the customer was billed. Checkout applies HSN GST rates after allocating the coupon discount. The invoice calculates GST on the undiscounted lines and applies the coupon separately.

Allowed files are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
