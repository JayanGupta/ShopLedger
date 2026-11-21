# ShopLedger

## Stack

Node.js 22+, CommonJS, Express 4 and body-parser. The browser UI is plain HTML, CSS and JavaScript. The app persists its state in `data/db.json`.

## Module map

- `server.js` serves the UI, mounts the API and renders printable invoices.
- `config.js` holds the port, shop, GST, inventory and coupon settings.
- `routes/products.js` lists the catalog and active coupons.
- `routes/orders.js` lists, creates and cancels orders.
- `routes/customers.js` lists Khata customers and records settlements.
- `routes/reports.js` serves dashboards, GST reconciliation, pricing previews and data export.
- `lib/coupons.js` normalizes and validates coupons and calculates discounts.
- `lib/dates.js` formats dates and derives date keys and fiscal years.
- `lib/inventory.js` finds products, checks sellable stock, adjusts physical stock and summarizes inventory.
- `lib/invoice.js` computes figures and renders printable invoices.
- `lib/ledger.js` manages Khata charges, reversals and settlements.
- `lib/orders.js` creates, retrieves, filters and cancels orders.
- `lib/pricing.js` calculates checkout subtotals, discounts, taxes and totals.
- `lib/reports.js` builds dashboard and GST reconciliation summaries.
- `lib/store.js` reads and writes the JSON store and appends audit events.
- `lib/tax.js` resolves GST rates and splits CGST and SGST.

## Commands

- `npm install --no-package-lock` installs the declared dependencies.
- `npm start` serves the app on port 3000 by default. Use a temporary copy for order mutations.
- `node --test` runs the test suite.

## Rules

1. Write characterization tests before changing behavior.
2. Change only the modules in scope for the ticket.
3. Use in-memory data in tests. Tests must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Issue #2 covers selling the last sellable unit and restoring stock on cancellation. Production changes may touch `lib/inventory.js` and the cancellation code in `lib/orders.js`.
