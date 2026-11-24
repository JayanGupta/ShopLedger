# ShopLedger
Node.js, Express, body-parser, a static browser UI and a JSON file store.
Start with npm install and npm start. Run tests with node --test.

## Module map
- server.js mounts the routers and printable invoice route.
- config.js defines shop details, coupon policy and GST slabs.
- public/ contains the POS, order history, Khata and GST audit UI.
- routes/products.js serves the catalog, inventory metadata and coupons.
- routes/orders.js validates orders and handles creation, lookup and cancellation.
- routes/customers.js serves Khata accounts and records settlements.
- routes/reports.js serves reports, pricing previews and an administrative export.
- lib/store.js reads and writes the JSON database and appends audit entries.
- lib/orders.js adds, lists, retrieves and cancels orders.
- lib/inventory.js checks, reserves and releases stock.
- lib/ledger.js manages customer credit, order debits and settlements.
- lib/dates.js formats dates and supplies date keys.
- lib/pricing.js computes checkout totals and per-line breakdowns.
- lib/tax.js resolves HSN rates and splits GST.
- lib/coupons.js normalizes, validates and calculates coupon discounts.
- lib/invoice.js computes printable figures and renders the invoice.
- lib/reports.js builds dashboard summaries and GST reconciliation.

## Rules
1. Characterize current behavior before changing it.
2. Limit changes to the selected ticket.
3. Tests use in-memory fixtures and never read or write data/db.json.
4. Add no dependencies.
5. Make the smallest fix that satisfies the ticket.

## Ticket 1
Match printable invoice totals and GST to checkout.
Production scope is lib/invoice.js and, only if necessary, lib/tax.js.
