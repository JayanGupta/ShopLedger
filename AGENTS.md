# Repository Guidelines

## Project Structure & Module Organization

`server.js` creates the Express application, serves `public/`, mounts the API routers, and exposes printable invoices. Keep HTTP concerns in `routes/` (`orders.js`, `products.js`, `customers.js`, and `reports.js`) and reusable business logic in `lib/`. Configuration, GST slabs, coupons, and shop details live in `config.js`. The browser UI is plain HTML, CSS, and JavaScript under `public/`. `data/db.json` is the application datastore, not disposable fixture data. See `docs/architecture.svg` for the request and dependency map.

There is currently no test directory. Add automated tests under `test/`, mirroring source names such as `test/pricing.test.js`.

## Build, Test, and Development Commands

- `npm install` installs the Express and body-parser dependencies; no lockfile is currently committed.
- `npm start` runs `node server.js` on `PORT` or port `3000`.
- `npm test` currently exits with “no test specified.” Update this script when introducing a test runner.

There is no compilation, bundling, linting, or formatting step. Do not imply those checks passed unless tooling has been added and run.

## Coding Style & Naming Conventions

Follow the existing CommonJS and ES5-style code: `require`, `module.exports`/`exports`, `var`, and function expressions. Use two-space indentation, semicolons, single quotes in JavaScript, and camelCase for variables and functions. Keep module filenames lowercase and descriptive. Route handlers should validate and translate HTTP input; calculations and data mutations belong in `lib/`.

Avoid creating another totals implementation. Checkout uses `lib/pricing.js` and `lib/tax.js`; printable invoices currently have separate logic in `lib/invoice.js`, so changes must account for reconciliation behavior.

## Testing Guidelines

Prioritize focused tests for coupon caps, mixed GST slabs, rounding, Khata limits, stock changes, cancellations, and invoice-versus-ledger totals. Use temporary database fixtures; never overwrite `data/db.json` during tests. Include success, invalid-input, and persistence-failure cases.

## Commit & Pull Request Guidelines

History uses short, lowercase, descriptive subjects, for example `support hsn gst slabs and coupon maxDiscount caps`. Keep each commit scoped to one behavior.

Pull requests should explain user-visible behavior, identify affected routes and modules, and note datastore or financial-calculation changes. Include screenshots for `public/` or invoice changes, sample request/response payloads for API changes, and test evidence or a clear explanation when tests are unavailable.

## Security & Data Safety

Do not commit real customer data, credentials, or production exports. Move secrets such as admin keys to environment configuration. Treat writes to `data/db.json`, inventory, Khata balances, and stored order totals as transaction-sensitive changes.
