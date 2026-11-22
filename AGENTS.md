# Repository Guidelines

## Project Structure & Module Organization

`server.js` is the Express entry point and mounts all `/api` routers. Put endpoint handlers in `routes/` (`orders.js`, `products.js`, `customers.js`, `reports.js`) and business logic in the matching `lib/` module. `public/` contains the static browser UI: `index.html`, `js/app.js`, and `css/style.css`. Runtime data is stored in `data/db.json`; treat it as application state, not sample data. `config.js` holds shop details, GST slabs, inventory defaults, and coupon rules. `docs/` contains project documentation and diagrams.

## Build, Test, and Development Commands

- `npm start` — starts the Express server through `node server.js` (default port: 3000).
- `node --check server.js` — performs a quick syntax check; run the same command for changed JavaScript files as needed.
- `npm test` — currently has no test suite and intentionally exits with an error. Add tests before relying on this command in CI.

Do not run `npm install` unless dependency changes are intentional; commit the resulting lockfile change with the dependency update.

## Coding Style & Naming Conventions

Use the established CommonJS style (`var`, `require`, `module.exports`) and two-space indentation. Keep route handlers thin and move reusable calculations or persistence logic into `lib/`. Use lower-case, singular module names such as `lib/pricing.js`; name exported functions with lower camel case, for example `computeTotals` and `recordSettlement`. Preserve API paths and JSON field names unless the change includes a migration plan.

## Testing Guidelines

There is no test framework or coverage requirement yet. For changes, exercise the affected API path manually and cover invalid input, stock boundaries, coupon eligibility, Khata credit limits, and cancellation. For pricing or invoice changes, compare stored order totals with the GST reconciliation endpoint and printable invoice.

## Commit & Pull Request Guidelines

Existing commits use short, lower-case, descriptive subjects (for example, `customer khata credit ledger and order cancellation`). Follow that pattern and keep each commit focused. Pull requests should explain the user-facing behavior, list API/data-format changes, identify any `data/db.json` migration, and include screenshots for UI or invoice changes.

## Security & Data Handling

Never commit real customer data, credentials, or new hard-coded secrets. The JSON store contains financial and contact data; back it up before manual edits and avoid unrelated formatting churn. Treat GST, coupon, and invoice calculation changes as accounting-sensitive and update the reconciliation behavior deliberately.
