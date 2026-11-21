# Repository Guidelines

## Project Structure & Module Organization

This repository is a small Node.js/Express point-of-sale application. `server.js` configures Express, serves the browser app, and mounts routes. `routes/` contains the HTTP handlers; `lib/` contains pricing, tax, inventory, orders, customer ledger, invoice, reporting, date, and JSON storage logic. `config.js` holds shop settings, tax slabs, coupon rules, and the port. `data/db.json` is the application’s local data store. The browser interface lives in `public/` (`index.html`, `js/`, and `css/`). `docs/architecture.svg` diagrams the main components and order flow. No test directory is present.

## Build, Test, and Development Commands

- `npm start` — starts the Express app on port 3000, or the port set in `PORT`.
- `npm test` — currently only prints “Error: no test specified” and exits unsuccessfully; there is no configured test suite.

There is no build, lint, or formatter script configured. Run the app only when you intend to serve it locally; it reads and writes `data/db.json`.

## Coding Style & Naming Conventions

Use the existing CommonJS style (`require` and `module.exports`) and match the surrounding JavaScript. Existing files use two-space indentation, semicolons, single-quoted strings, and descriptive camelCase function and variable names. Keep route handlers in the appropriate `routes/*.js` file and reusable business logic in `lib/*.js`. Use lowercase, descriptive filenames such as `gst-reconciliation.js` only if consistent with the existing module naming; current modules use short lowercase names. Keep tax and pricing calculations centralized, and ensure invoice and checkout behavior remain consistent when changing totals.

## Testing Guidelines

No test framework, test files, or coverage requirement is configured. For changes to order, inventory, coupon, tax, Khata, or invoice behavior, manually review the affected route and library call paths. Do not treat `npm test` as a passing validation command; it is a placeholder that exits with failure.

## Commit & Pull Request Guidelines

Recent commits use short, lowercase, descriptive summaries (for example, `support hsn gst slabs and coupon maxDiscount caps`). Follow that pattern and keep each commit focused. Pull requests should explain the user-visible behavior and affected routes or modules. Include before/after screenshots for browser UI changes and state what checks were performed; link a related issue when one exists.

## Security & Data Handling

Do not commit real customer or transaction information. `config.js` contains shop settings and an admin key, while `data/db.json` contains customer, order, settlement, and audit data. Avoid exposing these values in logs, screenshots, or pull-request examples.
