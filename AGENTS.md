# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and `body-parser` for JSON requests.
- `server.js` serves the static HTML, CSS, and vanilla JavaScript in `public/`, mounts the `/api` routers, and serves printable HTML invoices.
- `config.js` defines shop settings, GST rates, coupons, and inventory defaults. `data/db.json` is the file-backed datastore.

## Module map

- `routes/customers.js` lists Khata customers and records settlements.
- `routes/orders.js` lists, retrieves, places, and cancels orders.
- `routes/products.js` lists products with stock and GST details and lists active coupons.
- `routes/reports.js` serves dashboard and GST reconciliation reports, cart pricing previews, and admin export.
- `lib/coupons.js` normalizes and validates coupon codes and calculates discounts.
- `lib/dates.js` formats dates, normalizes filter values, and calculates fiscal years.
- `lib/inventory.js` looks up products, checks sellable stock, updates stock or reservations, and summarizes inventory.
- `lib/invoice.js` recalculates invoice figures and renders printable HTML.
- `lib/ledger.js` manages Khata charges, debit reversals, balances, and settlements.
- `lib/orders.js` creates, retrieves, filters, and cancels order records.
- `lib/pricing.js` allocates coupon discounts across lines and calculates checkout GST and totals.
- `lib/reports.js` builds dashboard summaries and compares invoice figures against saved order figures.
- `lib/store.js` reads and writes the JSON datastore and appends audit entries.
- `lib/tax.js` resolves GST rates and splits GST into CGST and SGST.

## Commands

- Start the app with `node server.js` (`npm start` runs the same command).
- Run tests with `node --test`. The repository currently has no test files, and the `npm test` script is a failing placeholder.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests must use in-memory data and must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown can differ from what the customer was billed. Checkout uses HSN rates on discounted line amounts. The invoice recomputes GST on gross line amounts, uses the default GST rate when the saved line lacks a rate, and recalculates coupon discounts separately.

Allowed files: `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
