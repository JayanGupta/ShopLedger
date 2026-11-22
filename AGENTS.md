# ShopLedger

## Stack

- Node.js (CommonJS), Express 4, and `body-parser` for JSON requests.
- Plain HTML, CSS, and browser JavaScript in `public/`, served by `server.js`.
- `data/db.json` stores products, orders, customer balances, settlements, and audit entries.

## Module map

- `routes/customers.js` lists Khata accounts and records repayments.
- `routes/orders.js` places, lists, retrieves, and cancels orders.
- `routes/products.js` lists products and active coupons.
- `routes/reports.js` serves dashboard and GST reconciliation reports, cart pricing previews, and admin exports.
- `lib/coupons.js` normalizes and validates coupon codes and computes discounts.
- `lib/dates.js` formats dates, normalizes date filters, and derives fiscal years.
- `lib/inventory.js` checks sellable stock, deducts order quantities, releases reservations, and summarizes stock.
- `lib/invoice.js` recalculates invoice figures and renders printable GST invoice HTML.
- `lib/ledger.js` tracks Khata balances, checks credit limits, reverses debits, and records repayments.
- `lib/orders.js` adds, retrieves, filters, and cancels order records.
- `lib/pricing.js` allocates coupon discounts across lines and computes checkout GST and totals.
- `lib/reports.js` summarizes sales, inventory, and Khata and compares invoice figures with saved order totals.
- `lib/store.js` reads and writes the JSON data file and maintains the audit log.
- `lib/tax.js` resolves item GST rates and splits GST into CGST and SGST.

## Commands

- Start the app with `node server.js`. The port defaults to `3000` and can be set with `PORT`.
- Run tests with `node --test`. The `npm test` script is a placeholder.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules the ticket is about.
3. Tests must use in-memory data and never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown can differ from what the customer was billed. Checkout applies item GST to amounts after discount. The invoice recalculates GST on gross line amounts and uses the default GST rate for lines saved by checkout.

Allowed files are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
