# Repository Guidelines

## Project Structure & Module Organization

This is a small Node.js/Express POS and Khata ledger application. `server.js` mounts the API routers and serves `public/`; HTTP handlers live in `routes/`. Business logic is in `lib/` (pricing, GST, coupons, inventory, orders, ledger, reports, invoice rendering, dates, and JSON storage). `config.js` contains shop and application settings. `data/db.json` is the local operational data store. Browser assets are in `public/`, and `docs/architecture.svg` diagrams the architecture and order flow. There is currently no dedicated test directory.

## Build, Test, and Development Commands

- `npm install` installs the dependencies declared in `package.json`.
- `npm start` runs the Express app at the configured port (3000 by default).
- `npm test` currently exits with “no test specified”; it does not run a test suite.

No build, lint, or formatting scripts are configured. Do not treat a successful `npm test` as validation; manually check affected routes and calculations until automated tests are added.

## Coding Style & Naming Conventions

Follow the existing CommonJS style (`require`/`module.exports`) and plain JavaScript conventions. Match nearby files: two-space indentation, single-quoted strings, semicolons, and `var` declarations. Use lowercase filenames such as `pricing.js`; exported functions use descriptive camelCase names. Keep route handling in `routes/` and reusable business rules in `lib/` rather than duplicating calculations in handlers or views.

## Testing Guidelines

There is no test framework or coverage requirement in the repository. For changes, review the affected route and library call paths, including error cases and persisted data shape. Pricing changes should compare checkout totals with printable invoice and GST reconciliation calculations. If adding tests, introduce a test framework and documented command, and use names that identify the behavior (for example, `pricing.test.js`).

## Commit & Pull Request Guidelines

Recent commits use short, lowercase, descriptive summaries, often naming the feature or behavior (for example, `support hsn gst slabs and coupon maxDiscount caps`). Follow that style and keep each commit focused. Pull requests should explain user-visible behavior, list affected routes or modules, describe manual verification, and include screenshots for UI changes. Link relevant issues when available; do not claim tests passed when none exist.

## Security & Data Handling

Treat `data/db.json` as live application data: avoid replacing or committing incidental changes to customer and transaction records. Do not add secrets to `config.js`; use environment-backed configuration for sensitive values. Review access controls before changing admin endpoints or export behavior.
