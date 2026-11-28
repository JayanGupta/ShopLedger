# ShopLedger

## Stack

- Node.js, Express, body-parser, and a browser UI in public/.
- The application persists orders, stock, Khata, and audit data in data/db.json.

## Module map

- routes/products.js lists products and active coupons.
- routes/orders.js lists, creates, retrieves, and cancels orders.
- routes/customers.js lists Khata customers and records settlements.
- routes/reports.js serves the dashboard, GST reconciliation, pricing previews, and admin export.
- lib/coupons.js normalizes coupon codes, validates them, and computes discounts.
- lib/dates.js formats dates and provides date filter and fiscal year helpers.
- lib/inventory.js checks stock and adjusts quantities.
- lib/invoice.js computes and renders printable invoice figures.
- lib/ledger.js maintains customer credit balances and settlements.
- lib/orders.js stores, retrieves, filters, and cancels orders.
- lib/pricing.js calculates checkout totals and per-line tax.
- lib/reports.js summarizes dashboard and GST reconciliation figures.
- lib/store.js reads and writes the JSON database and appends audit entries.
- lib/tax.js resolves GST rates and splits tax into CGST and SGST.

## Commands

- Start the app with `npm start`. Use a temporary project copy for the workshop demo.
- Run the Node.js test runner with `node --test`.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the application modules named in the ticket.
3. Tests use in-memory data and never read or write data/db.json.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Invoice total and GST breakdown do not match what the customer was billed.
Allowed application files are lib/invoice.js and lib/tax.js only if truly needed.
