# ShopLedger agent notes

Verified against the current source tree; update only after checking the code.

## Stack and commands
- Node.js CommonJS app with Express and body-parser; static browser UI in public/.
- Data is stored synchronously in the tracked data/db.json file.
- npm start runs node server.js (requires dependencies from package.json).
- Run tests with node --test. npm test is a placeholder that exits with an error.
- Install dependencies only in a temporary copy; do not commit package-lock.json.

## Module map
- server.js: Express setup, static UI, API routers, printable invoice endpoint.
- config.js: port, shop settings, GST slabs, inventory defaults, coupons.
- routes/customers.js: customer listing and Khata settlement endpoint.
- routes/orders.js: order create/list/get/cancel endpoints.
- routes/products.js: product and active coupon endpoints.
- routes/reports.js: dashboard, GST reconciliation, pricing preview, export.
- lib/coupons.js: coupon normalization, validation, and discount calculation.
- lib/dates.js: date parsing, normalization, and fiscal-year helpers.
- lib/inventory.js: product lookup, stock checks, reservations, and summary.
- lib/invoice.js: invoice figures and printable HTML.
- lib/ledger.js: Khata balances, order charges, reversals, settlements.
- lib/orders.js: add, get, cancel, and list orders.
- lib/pricing.js: checkout subtotal, discount, HSN GST, and totals.
- lib/reports.js: dashboard summary and GST reconciliation.
- lib/store.js: read/write db.json and append audit entries.
- lib/tax.js: resolve GST rates and split CGST/SGST.
- public/index.html, public/js/app.js, public/css/style.css: browser UI.
- data/db.json: products, customers, orders, settlements, audit log, and counters.

## Safety rules
1. Add characterization tests before changing billing behavior.
2. Change only files allowed by the active ticket.
3. Tests must use in-memory data; never read or write data/db.json.
4. Add no dependencies.
5. Make the smallest fix that passes the tests.

## Current ticket
Invoice totals and GST must match checkout. Allowed code files: lib/invoice.js; lib/tax.js only if truly needed.

