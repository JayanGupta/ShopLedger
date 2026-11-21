# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and `body-parser` for JSON requests.
- `server.js` serves the plain HTML, CSS, and JavaScript in `public/`, mounts the routers under `/api`, and serves printable HTML invoices.
- Application state is stored in `data/db.json`. `lib/store.js` reads and rewrites the file synchronously.

## Module map

- `routes/customers.js` — Lists Khata accounts and recent settlements and records new settlements.
- `routes/orders.js` — Lists, retrieves, places, and cancels orders.
- `routes/products.js` — Lists and filters catalog products and lists active coupons.
- `routes/reports.js` — Serves the dashboard, GST reconciliation, cart pricing preview, and key-protected JSON export.
- `lib/coupons.js` — Normalizes, validates, and lists coupons and calculates discounts.
- `lib/dates.js` — Formats dates, normalizes date keys, and calculates fiscal years.
- `lib/inventory.js` — Looks up products, checks sellable stock, updates stock and reservations, and summarizes inventory.
- `lib/invoice.js` — Recalculates invoice figures from order items and configuration and renders printable HTML.
- `lib/ledger.js` — Looks up customers, computes balances, charges and reverses Khata orders, and records settlements.
- `lib/orders.js` — Creates order records, looks up and filters orders, and handles cancellations.
- `lib/pricing.js` — Calculates checkout totals and applies GST to each line after allocating the coupon discount.
- `lib/reports.js` — Summarizes the dashboard and compares invoice figures with stored order figures.
- `lib/store.js` — Reads and writes the JSON datastore and maintains its audit log.
- `lib/tax.js` — Resolves line GST rates and splits GST into CGST and SGST.

## Commands

- Start the app from the repo root with `npm start` (`node server.js`). It listens on port 3000 by default and uses `PORT` if set.
- Run tests from the repo root with `node --test`. The repository currently has no test files, and `npm test` is a placeholder that exits with an error.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules the ticket is about.
3. Use in-memory data in tests. Tests must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown do not match what the customer was billed. Checkout saves its calculated discount, tax, and total, while the invoice calculates its own figures.

The allowed file is `lib/invoice.js`. Change `lib/tax.js` only if truly needed.
