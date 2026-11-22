# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and `body-parser` for JSON requests.
- `server.js` serves the static HTML, CSS, and browser JavaScript in `public/`, mounts the API routers, and serves printable invoice HTML.
- `lib/store.js` reads and writes `data/db.json` synchronously.

## Module map

- `routes/customers.js` lists Khata customers and recent settlements and records repayments.
- `routes/orders.js` lists, fetches, places, and cancels orders.
- `routes/products.js` lists and filters the product catalog and lists active coupons.
- `routes/reports.js` serves dashboard and GST reconciliation reports, cart pricing previews, and admin database export.
- `lib/coupons.js` normalizes and validates coupon codes and calculates discounts.
- `lib/dates.js` formats today's date, normalizes date filter keys, and derives fiscal-year labels.
- `lib/inventory.js` finds products, checks sellable stock, deducts stock, releases reserved units, and summarizes inventory.
- `lib/invoice.js` recalculates invoice figures and renders printable HTML.
- `lib/ledger.js` looks up customers, calculates Khata balances, charges and reverses order debits, and records settlements.
- `lib/orders.js` adds, retrieves, filters, and cancels orders.
- `lib/pricing.js` calculates checkout totals by allocating the cart discount across lines and taxing each discounted line.
- `lib/reports.js` aggregates dashboard metrics and compares stored order figures with recalculated invoice figures.
- `lib/store.js` loads and saves the JSON database and appends audit entries.
- `lib/tax.js` resolves item GST rates and splits GST into CGST and SGST.

## Commands

- Start the app with `npm start` (`node server.js`).
- Run tests with `node --test`. The current `npm test` script is a failing placeholder.

## Rules

1. Write characterization tests before changing behavior.
2. Change only the modules the ticket is about.
3. Tests must use in-memory data and must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown do not match what the customer was billed. Checkout calculates GST by HSN on discounted lines, while the invoice recalculates GST on undiscounted lines and uses the fallback rate when the saved line has no GST rate.

Allowed implementation files are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
