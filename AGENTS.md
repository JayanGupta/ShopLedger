# Repository Guidelines

## Project Structure & Module Organization

ShopLedger is a Node.js/Express point-of-sale and Khata ledger app. `server.js` wires the Express app and invoice page; `routes/` contains API handlers; `lib/` holds pricing, GST, inventory, orders, ledger, reports, dates, and JSON storage logic. `config.js` contains shop, tax, inventory, and coupon settings. `data/db.json` is the app's persisted sample and working data. The browser interface is in `public/` (`index.html`, `js/`, and `css/`). Architecture documentation is in `docs/`. There is no test directory or test suite currently.

## Build, Test, and Development Commands

- `npm start` — start the local server on port 3000 by default; set `PORT` to override it.
- `npm test` — currently a placeholder that exits with “no test specified”; it does not run tests.
- `node --check server.js` — check server entry-point syntax without starting the app. Apply the same command to changed JavaScript files as useful.

There is no separate build or lint script configured.

## Coding Style & Naming Conventions

Follow the existing CommonJS and Express patterns. Use two-space indentation, semicolons, single-quoted strings, and `var` in line with the current code. Use camelCase for functions and variables, descriptive lower-case filenames such as `pricing.js`, and route handlers that validate inputs before changing data. Keep calculations in `lib/` rather than duplicating them in routes or browser code; preserve consistency between checkout totals and printable invoices.

## Testing Guidelines

No framework, coverage target, or test naming convention is configured. For changes, manually review affected API and UI paths and add focused automated tests if introducing a test framework is in scope. Do not treat `npm test` as validation until its placeholder is replaced.

## Commit & Pull Request Guidelines

Recent history uses short, descriptive, lower-case summaries (for example, `support hsn gst slabs and coupon maxDiscount caps`). Follow that style and describe the user-visible change. Pull requests should explain behavior changes, list relevant verification, link related work when applicable, and include screenshots for UI changes.

## Data & Configuration Safety

`data/db.json` is written directly by the application. Back it up before manual edits and avoid committing real customer or sales data. Keep secrets out of source control; `config.js` currently contains an admin key, so deployments should use protected configuration and review access controls.
