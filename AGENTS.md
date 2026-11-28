# Repository Guidelines

## Stack

- Node.js with CommonJS, an Express server, plain HTML/CSS/JavaScript in the browser, and a JSON file for persistence.
- `package.json` declares `express` at `^4.17.1` and `body-parser` at `^1.19.0`.

## Module Map

- `server.js` serves static files, mounts the `/api` routers, and handles `GET /orders/:id/invoice`.
- `config.js` defines the port, shop details, tax, coupons, inventory defaults, and export key.
- `routes/customers.js` lists Khata accounts and recent settlements and handles settlement requests.
- `routes/orders.js` lists, retrieves, places, and cancels orders.
- `routes/products.js` lists products and active coupons.
- `routes/reports.js` serves dashboard data, GST reconciliation, pricing previews, and admin export.
- `lib/coupons.js` normalizes coupon codes, validates eligibility, and calculates discounts.
- `lib/dates.js` formats dates, normalizes date keys, and computes fiscal-year labels.
- `lib/inventory.js` looks up products, checks sellable stock, adjusts stock or reservations, and summarizes inventory.
- `lib/invoice.js` recalculates invoice figures and renders printable HTML.
- `lib/ledger.js` manages Khata balances, order charges and reversals, and settlements.
- `lib/orders.js` adds, retrieves, filters, and cancels orders in memory.
- `lib/pricing.js` allocates coupon discounts across lines and calculates checkout totals and GST.
- `lib/reports.js` aggregates dashboard metrics and compares invoice figures with saved order figures.
- `lib/store.js` reads and rewrites the JSON data file and appends audit entries.
- `lib/tax.js` resolves GST rates and splits tax into CGST and SGST.
- `public/` contains the browser UI and its scripts and styles.
- `data/db.json` stores products, customers, orders, settlements, audit entries, and ID counters.

## Commands

- Start with `npm start`, which runs `node server.js`. The port defaults to `3000` and can be set with `PORT`.
- Run tests with `node --test`. The `npm test` script is a failing placeholder.

## Engineering Rules

- Write characterization tests before changing behavior.
- Change only the application modules assigned to the current ticket.
- Use in-memory data only in tests. Tests must never read or write `data/db.json`, even indirectly.
- Add no dependencies.
- Make the smallest fix that works.

## Current Ticket

- Ticket 1 (pre-fix behavior) — Invoice total and GST breakdown did not match what the customer was billed. The invoice taxed gross line amounts, while checkout applied GST after allocating the coupon discount.
- Allowed application files are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
- CP3 test file — `test/invoice.test.js`.
- Preserve existing public interfaces and unrelated application behavior.
