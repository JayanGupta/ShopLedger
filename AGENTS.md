# Repository Guidelines

## Project Structure & Module Organization

ShopLedger is a small CommonJS Node/Express application. `server.js` configures middleware, static assets, API routers, and the printable invoice endpoint. HTTP handlers live in `routes/`; keep business rules in `lib/` rather than expanding route handlers. The browser UI is under `public/` (`index.html`, `css/`, and `js/app.js`). Runtime state is stored in `data/db.json`; treat it as production-like business data, not a test fixture. Shared shop, GST, coupon, and inventory settings live in `config.js`. Architecture documentation belongs in `docs/`.

There is currently no `test/` directory or automated test suite.

## Build, Test, and Development Commands

- `npm install` installs the dependencies declared in `package.json`.
- `npm start` runs `node server.js` and serves the app at `http://localhost:3000` unless `PORT` is set.
- `npm test` currently exits with `No test specified`; do not report it as a passing validation.

The project has no build, lint, or formatting step. For a quick manual check, start the app and exercise product listing, order placement, cancellation, Khata settlement, and invoice rendering.

## Coding Style & Naming Conventions

Match the existing ES5-style JavaScript: two-space indentation, semicolons, single quotes, `var`, CommonJS `require`, and function expressions. Use camelCase for functions and variables, descriptive lowercase filenames such as `pricing.js`, and plural router filenames such as `orders.js`. Keep monetary rounding and validation in reusable `lib/` functions. Avoid introducing a second implementation of pricing, GST, or coupon rules.

## Testing Guidelines

When adding tests, create `test/` and name files after the module, for example `test/pricing.test.js`. Prioritize checkout totals, HSN GST slabs, coupon caps, stock mutations, Khata limits, cancellation, and invoice reconciliation. Tests must use temporary fixtures and must not rewrite `data/db.json`.

## Commit & Pull Request Guidelines

Existing commits use short, lowercase, imperative descriptions without prefixes, for example `support hsn gst slabs and coupon maxDiscount caps`. Keep each commit focused. Pull requests should explain behavior changes, list validation performed, link the relevant issue, and include screenshots for UI or printable-invoice changes. Call out any migration or change affecting `data/db.json`, GST calculations, or customer balances.

## Security & Configuration Tips

Do not commit real customer data, credentials, or new secrets. Prefer environment variables for sensitive configuration. Review all write paths carefully because persistence rewrites the entire JSON database and has no transaction or locking layer.
