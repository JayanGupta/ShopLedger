# Repository Guidelines

## Project Structure & Module Organization

`server.js` configures Express and mounts the route modules. API handlers live in `routes/`; business logic is separated into `lib/` modules for orders, pricing, GST, coupons, inventory, the customer ledger, reports, dates, and JSON persistence. `config.js` holds shop settings, coupon definitions, and tax slabs. `public/` contains the browser UI (`index.html`, `js/app.js`, `css/style.css`). `data/db.json` is the local application data store. `docs/` contains repository documentation and diagrams. No test directory is currently present.

## Build, Test, and Development Commands

- `npm start` runs the Express server at the configured port (default `3000`).
- `npm test` is currently a placeholder that exits with an error; there is no configured test framework or build command.

The package manifest and lockfile define dependencies. Do not treat a successful install as a test of application behavior.

## Coding Style & Naming Conventions

Match the existing CommonJS JavaScript style: two-space indentation, single-quoted strings, `var` declarations, and semicolons. Use lower camel case for functions and variables; keep route and library filenames lowercase (for example, `routes/orders.js`, `lib/pricing.js`). Keep route handlers thin and put reusable business rules in `lib/`. No formatter or linter is configured.

## Testing Guidelines

There are no repository tests or coverage requirements yet. For changes, manually exercise the affected UI/API path and describe what was checked. Pricing, GST slab selection, coupon limits, inventory changes, Khata balances, and invoice reconciliation are sensitive areas; verify their stored and displayed totals agree.

## Commit & Pull Request Guidelines

Recent commits use short, lowercase, descriptive summaries, such as `invoice page for accountant` and `support hsn gst slabs and coupon maxDiscount caps`. Follow that style and keep each commit focused. Pull requests should explain the behavior change, list verification performed, link relevant issues when available, and include screenshots for visible UI changes. Call out changes to `data/db.json` or business calculations explicitly.

## Security & Configuration

Do not commit real credentials or customer data. `config.js` currently contains an admin key and shop details; move secrets to environment configuration before deploying. Treat `data/db.json` as persistent business data and avoid overwriting it during development.
