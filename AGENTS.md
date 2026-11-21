# Repository Guidelines

## Stack

ShopLedger is a Node.js and Express 4 app for point-of-sale orders, Khata credit, and GST invoices. It uses CommonJS, `body-parser` for JSON requests, and plain HTML, CSS, and JavaScript in `public/`. `server.js` mounts the routers under `/api` and serves printable invoices. `config.js` holds shop, tax, and coupon settings. Runtime records are stored in `data/db.json`.

## Module map

- `routes/customers.js` lists customer balances and records Khata settlements.
- `routes/orders.js` lists, fetches, places, and cancels orders.
- `routes/products.js` lists products, sellable stock, and active coupons.
- `routes/reports.js` serves dashboard data, GST reconciliation, pricing previews, and the admin export.
- `lib/coupons.js` normalizes codes, validates eligibility, and calculates discounts.
- `lib/dates.js` formats dates, normalizes date keys, and determines fiscal years.
- `lib/inventory.js` calculates sellable stock, checks quantities, updates stock and reservations, and summarizes inventory.
- `lib/invoice.js` calculates invoice figures and renders printable HTML.
- `lib/ledger.js` tracks Khata balances, charges, reversals, and settlements.
- `lib/orders.js` creates, finds, cancels, filters, and sorts orders.
- `lib/pricing.js` computes checkout totals, allocating discounts before calculating line GST.
- `lib/reports.js` builds dashboard totals and compares invoice figures with saved order figures.
- `lib/store.js` reads and writes the JSON store and records audit entries.
- `lib/tax.js` resolves GST rates and splits GST into CGST and SGST.

## Commands

- `npm start` starts the app on port 3000 by default. `PORT` overrides the port.
- `node --test` runs tests with Node's built-in runner. There are no test files in the current checkout, and `npm test` is a placeholder.

## Rules

1. Write characterization tests before changing behavior.
2. Change only the modules named in the ticket.
3. Use in-memory data in tests. Tests must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Invoice total and GST breakdown do not match what the customer was billed. Checkout and the printable invoice currently use separate calculations.

Allowed files are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
