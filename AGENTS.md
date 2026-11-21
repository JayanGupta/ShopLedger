# Repository Guidelines

## Technology Stack

ShopLedger uses Node.js and Express. The browser UI is static HTML, CSS, and vanilla JavaScript. Application data is persisted in the JSON file `data/db.json`; there is no database server or frontend build system.

## Module Map

- `server.js` creates the Express app, serves `public/`, mounts `/api` routers, and exposes the printable invoice route.
- `config.js` holds application configuration, including shop, tax, inventory, and coupon settings.
- `routes/` contains HTTP handlers for products, orders, customers, and reports.
- `lib/` contains business logic for coupons, dates, inventory, invoices, ledger/Khata, orders, pricing, reports, storage, and tax.
- `public/` contains `index.html`, `js/app.js`, and `css/style.css` for the browser POS interface.
- `data/db.json` is the application datastore, read and written through `lib/store.js`.

## Commands

```sh
npm start  # runs node server.js
npm test   # currently prints “Error: no test specified” and exits with status 1
```

`package.json` defines no build, lint, or working test command. No tracked test framework or test directory exists.

## Workshop Engineering Rules

1. Write characterization tests before changing behaviour.
2. Change only the module that the assigned ticket is about.
3. Tests must never read from or write to `data/db.json`. Use in-memory data or isolated temporary copies.
4. Add no external dependencies.

## Data Safety

Never modify the original `data/db.json` during workshop exercises. Tests must never read from or write to this file. Use in-memory fixtures or isolated temporary copies for all testing.
