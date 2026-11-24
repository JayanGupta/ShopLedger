# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and `body-parser` for JSON requests.
- Plain HTML, CSS, and browser JavaScript in `public/`, served by `server.js`.
- `server.js` mounts the routers under `/api` and serves printable HTML invoices at `/orders/:id/invoice`.
- `lib/store.js` persists application data in `data/db.json`.

## Module map

- `routes/customers.js` lists Khata customers and recent settlements and records new settlements.
- `routes/orders.js` lists, retrieves, creates, and cancels orders.
- `routes/products.js` lists products and active coupons.
- `routes/reports.js` serves dashboard and GST reconciliation data, pricing previews, and admin export.
- `lib/coupons.js` normalizes and validates coupon codes and calculates discounts.
- `lib/dates.js` formats dates, normalizes date strings, and derives fiscal years.
- `lib/inventory.js` looks up products, checks sellable stock, applies stock changes, and summarizes inventory.
- `lib/invoice.js` recomputes invoice figures and renders printable HTML.
- `lib/ledger.js` manages Khata balances, credit limits, order debits, and settlements.
- `lib/orders.js` creates, retrieves, filters, and cancels order records.
- `lib/pricing.js` apportions coupon discounts and calculates checkout totals and GST by line.
- `lib/reports.js` builds dashboard summaries and compares invoice figures with stored order totals and tax.
- `lib/store.js` reads and writes the JSON store and appends audit entries.
- `lib/tax.js` resolves item GST rates and splits GST into CGST and SGST.

## Commands

- Start the app with `node server.js`. The port defaults to 3000 and can be set with `PORT`.
- Run tests with `node --test`. The `npm test` script is a placeholder that exits with an error.

## Rules

1. Write characterization tests before changing behavior.
2. Change only the modules covered by the ticket.
3. Tests must never read or write `data/db.json`. Use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The invoice total and GST breakdown do not match what the customer was billed. Checkout applies item GST rates after allocating the coupon discount. The invoice recalculates GST on gross line values and applies its own coupon calculation.

Allowed files are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
