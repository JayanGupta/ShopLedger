# ShopLedger

## Stack

Node.js with CommonJS, Express 4, and `body-parser` for JSON requests. Express serves the plain HTML, CSS, and JavaScript UI from `public/`. The app stores its data in `data/db.json` through `lib/store.js`.

## Module map

- `routes/customers.js` lists Khata customers and recent settlements and records repayments.
- `routes/orders.js` lists, fetches, places, and cancels orders.
- `routes/products.js` lists products, sellable stock, GST rates, and active coupons.
- `routes/reports.js` serves the dashboard, GST reconciliation, cart pricing preview, and admin export.
- `lib/coupons.js` normalizes coupon codes, checks eligibility, and calculates discounts.
- `lib/dates.js` formats dates, normalizes date inputs, and derives fiscal years.
- `lib/inventory.js` finds products, checks sellable stock, deducts stock, releases reservations, and summarizes inventory.
- `lib/invoice.js` calculates invoice figures and renders printable HTML.
- `lib/ledger.js` looks up Khata accounts, applies and reverses order charges, and records settlements.
- `lib/orders.js` adds, looks up, filters, sorts, and cancels order records.
- `lib/pricing.js` calculates checkout totals and applies GST after allocating the coupon discount across lines.
- `lib/reports.js` aggregates dashboard figures and compares saved order totals and tax with invoice figures.
- `lib/store.js` reads and rewrites the JSON database and appends audit entries.
- `lib/tax.js` resolves item GST rates and splits GST into CGST and SGST.

## Commands

- Start the app from the repo root with `node server.js`. The default port is 3000, with `PORT` as an override.
- Run tests with `node --test`. The `npm test` script is a placeholder.

## Rules

1. Write characterization tests before changing behavior.
2. Change only the modules the ticket is about.
3. Use in-memory data in tests. Tests must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printed invoice total and GST breakdown can differ from what the customer was billed. Checkout calculates GST on discounted lines using HSN rates. The invoice recalculates GST on gross lines with a fallback rate and applies the coupon after GST.

Allowed files are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
