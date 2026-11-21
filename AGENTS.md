# ShopLedger

## Stack

- Node.js with CommonJS, Express (`^4.17.1`), and body-parser (`^1.19.0`).
- `server.js` serves plain HTML, CSS, and browser JavaScript from `public/`, mounts the API at `/api`, and serves printable HTML at `GET /orders/:id/invoice`.
- `config.js` holds shop, port, GST, coupon, and inventory settings; `lib/store.js` persists app data to `data/db.json`.

## Module map

- `routes/customers.js` — Lists Khata customers and recent settlements; records settlements.
- `routes/orders.js` — Lists, retrieves, places, and cancels orders.
- `routes/products.js` — Lists products with stock and GST information, and lists active coupons.
- `routes/reports.js` — Serves dashboard and GST reconciliation reports, cart pricing previews, and database export.
- `lib/coupons.js` — Normalizes and validates coupon codes, calculates discounts, and lists active coupons.
- `lib/dates.js` — Formats today's date, normalizes date strings for filters, and derives fiscal year labels.
- `lib/inventory.js` — Finds products, checks sellable stock, adjusts stock or reservations, and summarizes inventory.
- `lib/invoice.js` — Recomputes invoice figures, renders printable HTML, and flags differences from the saved order total.
- `lib/ledger.js` — Looks up Khata accounts, checks credit limits, applies and reverses debits, and records settlements.
- `lib/orders.js` — Creates, finds, filters, and cancels order records.
- `lib/pricing.js` — Calculates checkout totals, allocating coupon discounts across lines before GST.
- `lib/reports.js` — Summarizes the dashboard and compares stored order amounts with recomputed invoice figures.
- `lib/store.js` — Reads and rewrites the JSON store synchronously and maintains the audit log.
- `lib/tax.js` — Resolves item GST rates and splits GST into CGST and SGST.

## Commands

- Start the app: `node server.js` (defaults to port 3000; override with `PORT`).
- Run tests from the repo root: `node --test`. No tests are checked in; the package's `npm test` script is a failing placeholder.

## Rules

1. Write characterization tests before changing behavior.
2. Change only the module(s) the ticket is about.
3. Tests must never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown do not match what the customer was billed. Checkout applies GST by HSN after allocating the coupon discount; the invoice recomputes GST on undiscounted amounts and applies the coupon separately.

Allowed files: `lib/invoice.js`; touch `lib/tax.js` only if truly needed.
