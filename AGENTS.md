# ShopLedger

- Node.js and Express serve a plain HTML, CSS, and JavaScript point-of-sale app.
- `server.js` serves `public/`, mounts `routes/` under /api, and renders printable invoices.
- `lib/` contains pricing, coupons, tax, invoices, orders, inventory, dates, Khata, reporting, and JSON storage.
- `config.js` sets shop, coupon, tax, and server defaults. `data/db.json` holds workshop data.
- Install with `npm install --no-package-lock`. Run with `npm start` and test with `node --test`.
- Ticket #1 concerns invoice and GST reconciliation. Keep production edits in `lib/invoice.js`. Use `lib/tax.js` only if necessary.

## Workshop rules

1. Read the existing flow before editing.
2. Capture current behavior with characterization tests before fixing it.
3. Make the smallest change in the ticket's modules and add a regression test.
4. Use in-memory fixtures for tests and a disposable copy for manual verification. Keep `data/db.json` and lockfiles out of changes.
5. Review the diff and run the full test suite before opening a pull request.
