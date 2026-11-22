# ShopLedger

## Stack

Node.js with CommonJS, Express 4, and body-parser. The browser UI uses plain HTML, CSS, and JavaScript in `public/`. The app persists data in `data/db.json` and serves printable invoices as HTML.

## Module map

- `routes/customers.js` lists Khata customers and recent settlements and records payments.
- `routes/orders.js` lists, retrieves, creates, and cancels orders.
- `routes/products.js` lists products with stock and GST details and lists active coupons.
- `routes/reports.js` serves dashboard and GST reconciliation reports, pricing previews, and database export.
- `lib/coupons.js` normalizes and validates coupon codes and calculates discounts.
- `lib/dates.js` formats dates and provides date normalization and fiscal-year helpers.
- `lib/inventory.js` looks up products, checks sellable stock, updates stock or reservations, and summarizes inventory.
- `lib/invoice.js` recalculates invoice figures and renders printable HTML with a total mismatch notice.
- `lib/ledger.js` manages Khata balances, credit-limit checks, order debits and reversals, and settlements.
- `lib/orders.js` adds, retrieves, filters, and cancels orders in memory.
- `lib/pricing.js` computes checkout subtotal, coupon allocation, per-line GST, and grand total.
- `lib/reports.js` aggregates dashboard metrics and compares saved order totals and GST with invoice figures.
- `lib/store.js` reads and writes the JSON store and appends audit events.
- `lib/tax.js` resolves item GST rates and splits GST into CGST and SGST.

## Commands

- Start the app with `node server.js` or `npm start`.
- Run tests with `node --test`. The repository currently has no test files, and the `npm test` script is a failing placeholder.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules covered by the ticket.
3. Tests use in-memory data and must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown can differ from what the customer was billed. Checkout applies coupons before calculating GST at the item's HSN rate. The invoice computes GST on gross prices using a saved rate or the configured fallback, then applies the coupon.

Allowed implementation files are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
