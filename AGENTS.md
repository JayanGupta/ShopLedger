# ShopLedger

## Stack

- Node.js with CommonJS modules, Express 4, and `body-parser` for JSON requests.
- Plain HTML, CSS, and browser JavaScript in `public/`. Express serves the UI and mounts the API under `/api`.
- `config.js` holds application settings. Persistence uses synchronous reads and writes of `data/db.json`.
- `server.js` serves printable HTML invoices at `GET /orders/:id/invoice`.

## Module map

- `routes/customers.js` lists Khata customers and recent settlements and records repayments.
- `routes/orders.js` lists, fetches, places, and cancels orders.
- `routes/products.js` lists and filters products and exposes active coupons.
- `routes/reports.js` serves the dashboard, GST reconciliation, checkout preview, and keyed JSON export.
- `lib/coupons.js` normalizes and validates coupon codes and calculates discounts.
- `lib/dates.js` formats today's date, normalizes date keys, and derives fiscal years.
- `lib/inventory.js` looks up products, checks sellable stock, deducts stock, releases reservations, and summarizes inventory.
- `lib/invoice.js` recomputes invoice figures and renders printable HTML.
- `lib/ledger.js` looks up customers, tracks Khata charges and reversals, and records settlements.
- `lib/orders.js` creates, retrieves, filters, and cancels order records.
- `lib/pricing.js` apportions checkout coupon discounts across lines and calculates GST and totals.
- `lib/reports.js` summarizes dashboard metrics and compares invoice figures with saved orders.
- `lib/store.js` reads and writes the JSON store and keeps a bounded audit log.
- `lib/tax.js` resolves item GST rates and splits GST into CGST and SGST.

## Commands

- Start the app with `node server.js` or `npm start`.
- Run tests with `node --test`. There are no project tests yet. The `npm test` script is a failing placeholder.

## Rules

1. Write characterization tests before changing behavior.
2. Change only the implementation modules the ticket is about.
3. Tests must never read or write `data/db.json`. Use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Invoice totals and the GST breakdown can differ from what the customer was billed. Checkout applies HSN rates to discounted line values, while the invoice recomputes GST on gross lines and applies coupons afterward.

Allowed implementation files are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
