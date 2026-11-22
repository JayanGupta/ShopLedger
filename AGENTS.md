# ShopLedger

CommonJS Node.js app with Express 4 and a static browser UI.
Use Node 22 or newer. Install dependencies with `npm install`, run
`npm start`, and open http://localhost:3000. Run tests with `node --test`.

- `server.js` serves the UI, mounts API routes, and handles printable invoices.
- `routes/` handles orders, products, customers, and reports.
- `lib/` handles pricing, coupons, GST, inventory, orders, Khata, and reporting.
- `config.js` contains shop configuration and pricing rules.
- `lib/store.js` reads and writes the tracked JSON data file.

1. Inspect the current behavior before editing.
2. Write characterization tests before changing production logic.
3. Keep production changes to the selected ticket's modules.
4. Use in-memory fixtures or isolated temporary copies. Tests must never
   read or write the tracked `data/db.json`.
5. Review the diff and run the tests before opening a pull request.

Ticket 1 covers invoice and GST reconciliation. Production edits belong in
`lib/invoice.js`. Change `lib/tax.js` only if required.
Keep generated lockfiles and local data edits out of the pull request.
