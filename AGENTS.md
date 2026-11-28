# Repository Guidelines

## Project Structure & Module Organization

This is a small Node.js/Express POS application. `server.js` mounts the routers and serves the browser app in `public/` (`index.html`, `js/`, and `css/`). HTTP handlers live in `routes/`; business logic belongs in `lib/` (pricing, tax, coupons, inventory, orders, Khata, reports, dates, invoices, and JSON persistence). `config.js` holds shop and operational settings. `data/db.json` is the local data store. `docs/architecture.svg` diagrams the request and order flow. There is no test directory or checked-in test suite.

## Build, Test, and Development Commands

- `npm start` runs `node server.js` and starts the app on port 3000 by default; set `PORT` to override it.
- No build command is defined; the browser assets are served directly from `public/`.
- `npm test` is a placeholder that exits with “no test specified”; do not treat it as a passing test suite. No test framework or coverage threshold is configured.

## Coding Style & Naming Conventions

Follow the existing CommonJS style (`require`, `module.exports`), two-space indentation, single-quoted strings, and semicolons. Use lowercase descriptive filenames such as `gst-reconciliation` only where route URLs require it; library files use concise lowercase names (for example, `pricing.js`). Keep route handlers thin and put reusable calculations or state changes in `lib/`. Preserve existing response shapes and round monetary calculations to two decimal places. There is no configured formatter or linter.

## Testing Guidelines

There are currently no automated tests. For changes, manually exercise the affected route and UI path; for order changes, check stock, totals, coupons, GST, Khata balances, persisted JSON, and invoice/reconciliation output as applicable. Never rely on browser preview alone: checkout and invoice calculations are separate code paths.

## Commit & Pull Request Guidelines

Recent commits use short, lowercase, descriptive subjects (for example, `support hsn gst slabs and coupon maxDiscount caps`); no formal prefix convention is established. Keep commits focused. Pull requests should explain behavior changes, list validation performed, link related work when available, and include screenshots for visible UI changes.

## Security & Data Handling

Do not commit real credentials or customer data. `config.js` currently contains an admin key, and `data/db.json` contains customer and transaction records; handle both as sensitive. Avoid logging account details or exposing the JSON store through new endpoints.
