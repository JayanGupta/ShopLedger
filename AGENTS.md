# ShopLedger

## Stack

Node.js and CommonJS, Express 4, and body-parser for JSON requests. The server serves plain HTML, CSS, and JavaScript from `public/`. Persistence is a local JSON file at `data/db.json`.

## Module map

- `routes/customers.js` lists Khata customers and records settlements.
- `routes/orders.js` lists, fetches, places, and cancels orders.
- `routes/products.js` lists products and active coupons.
- `routes/reports.js` serves dashboard and GST reconciliation reports, cart pricing previews, and admin export.
- `lib/coupons.js` normalizes and validates coupon codes and calculates discounts.
- `lib/dates.js` formats local dates, normalizes date keys, and derives fiscal years.
- `lib/inventory.js` looks up products, checks sellable stock, adjusts stock or reservations, and summarizes inventory.
- `lib/invoice.js` recomputes invoice figures and renders printable HTML.
- `lib/ledger.js` manages Khata billing, debit reversals, balances, and settlements.
- `lib/orders.js` creates, retrieves, filters, and cancels order records.
- `lib/pricing.js` allocates cart discounts across lines and computes checkout tax and totals.
- `lib/reports.js` builds dashboard summaries and compares saved order figures with invoice figures.
- `lib/store.js` reads and writes the JSON database and appends audit entries.
- `lib/tax.js` resolves GST rates and splits GST into CGST and SGST.

## Commands

- Start the app with `node server.js` or `npm start`.
- Run tests with `node --test`. The `npm test` script is a failing placeholder.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules the ticket is about.
3. Tests must use in-memory data and must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown can differ from what the customer was billed. Checkout applies HSN-based GST after allocating the cart discount. The invoice independently computes GST on gross line amounts and recalculates the coupon.

Allowed implementation files are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
