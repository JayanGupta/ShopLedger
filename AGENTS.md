# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and `body-parser` for JSON requests.
- `server.js` serves plain HTML, CSS, and JavaScript from `public/`, mounts the `/api` routers, and serves printable invoices.
- `lib/store.js` reads and writes `data/db.json` synchronously. `config.js` holds shop details, GST rates, coupon rules, and inventory settings.

## Module map

- `routes/customers.js` lists Khata customers and recent settlements and records repayments.
- `routes/orders.js` lists, retrieves, places, and cancels orders.
- `routes/products.js` lists and filters the catalog and lists active coupons.
- `routes/reports.js` serves the dashboard, GST reconciliation, cart pricing preview, and keyed data export.
- `lib/coupons.js` normalizes and validates coupon codes, calculates discounts, and lists active coupons.
- `lib/dates.js` formats dates, normalizes date filters, and computes fiscal-year labels.
- `lib/inventory.js` looks up products, checks sellable stock, deducts ordered units, releases reservations, and summarizes stock.
- `lib/invoice.js` recomputes invoice figures from saved lines and current config and renders printable HTML.
- `lib/ledger.js` calculates Khata balances, checks credit limits, charges or reverses orders, and records settlements.
- `lib/orders.js` assigns order IDs and dates, stores orders in memory, and handles lookup, filtering, and cancellation.
- `lib/pricing.js` computes checkout subtotal, apportions coupon discounts, and calculates GST and the amount due.
- `lib/reports.js` aggregates dashboard figures and compares saved order totals and GST with recomputed invoice figures.
- `lib/store.js` loads and saves the JSON data file and keeps the most recent 100 audit entries.
- `lib/tax.js` resolves GST from an item override, HSN mapping, or fallback and splits GST into CGST and SGST.

## Commands

- Start the app with `node server.js`. The default port is 3000 and `PORT` overrides it.
- Run tests with `node --test`. No project test files exist yet, and `npm test` is a failing placeholder.

## Rules

1. Write characterization tests before changing behavior.
2. Change only the module(s) the ticket is about.
3. Tests must never read or write `data/db.json`. Use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown do not match what the customer was billed. Checkout saves its totals, while the invoice recomputes them using separate rules.

Allowed files are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
