# Repository Guidelines

## Project Structure & Module Organization

`server.js` configures Express, serves the browser app, and mounts API routes. `routes/` contains product, order, customer, and report endpoints; `lib/` contains storage, pricing, tax, coupons, inventory, order, ledger, date, invoice, and report logic. `config.js` holds shop and business settings. `public/` contains `index.html`, `js/app.js`, and `css/style.css`. `data/db.json` is the local application database. `docs/architecture.svg` maps the main components and order flow. No test directory or test files are present.

## Build, Test, and Development Commands

- `npm start` runs the Express app with `node server.js` (default port 3000; override with `PORT`).
- `npm test` is currently a placeholder that exits with an error; do not treat it as a working test suite.

There is no build, lint, or formatting script configured. For local development, start the app only when needed and use the browser at `http://localhost:3000`.

## Coding Style & Naming Conventions

Follow the existing CommonJS JavaScript style: two-space indentation, single-quoted strings, semicolons, and `var` declarations. Use lowercase filenames such as `routes/orders.js` and `lib/pricing.js`; exported operations use descriptive camelCase names (for example, `computeTotals`). Keep HTTP handling in route modules and reusable business rules in `lib/`.

## Testing Guidelines

No framework, coverage target, or test naming convention is configured. If adding tests, introduce a documented test runner and place tests in a clearly named `test/` or `tests/` directory. Cover order validation, stock reservation, coupon and GST calculations, Khata updates, cancellation, and invoice reconciliation. Until automated tests exist, describe any manual verification steps in the change summary.

## Commit & Pull Request Guidelines

Recent history uses short, lowercase, imperative-style summaries, often describing the feature directly (for example, `invoice page for accountant`). Follow that style and keep each commit focused. Pull requests should explain the behavior change, identify affected routes/modules, include verification steps, and add screenshots for visible UI or invoice changes. Call out any changes to the shape of `data/db.json` or pricing behavior.

## Data & Configuration

Treat `data/db.json` as application data, not a disposable fixture. Avoid committing real customer information. Keep environment-specific secrets out of `config.js`; the current configuration includes an admin key, so deployments should review how secrets and access control are handled.
