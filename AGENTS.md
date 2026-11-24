# Repository Guidelines

## Project Structure & Module Organization

This is a small Node.js/Express point-of-sale and Khata ledger app. `server.js` wires the app and serves the browser UI. API handlers live in `routes/`; business logic is in `lib/` (pricing, tax, coupons, inventory, orders, ledger, invoices, reports, dates, and JSON storage). The UI is under `public/` (`index.html`, `js/app.js`, `css/style.css`). `config.js` contains shop settings and GST/coupon configuration. `data/db.json` is the local data store. Architecture documentation is in `docs/`. There is no separate test directory.

## Build, Test, and Development Commands

- `npm start` — start the Express app on `PORT` or port 3000.
- `npm test` — currently a placeholder that exits with an error; no test framework or build script is configured.

Run the app locally with `npm start` after dependencies are available. Do not treat the current test command as a passing test suite; add focused automated coverage when changing business logic.

## Coding Style & Naming Conventions

Follow the existing CommonJS JavaScript style: two-space indentation, semicolons, single-quoted strings, and `var` declarations. Use lower camel case for functions and variables. Keep HTTP request/response handling in the relevant route module and put reusable business rules in `lib/`. Preserve the current file naming pattern, such as `routes/orders.js` and `lib/pricing.js`. No formatter or linter is configured.

## Testing Guidelines

There are no repository-owned tests or coverage requirements yet. For pricing, coupons, GST, stock, or Khata changes, manually verify representative valid and invalid inputs and compare stored order totals with invoice/reconciliation output. Add tests with any new testing framework only when the project adopts one, and document its run command.

## Commit & Pull Request Guidelines

Recent commits use short, lowercase descriptive subjects without a visible prefix convention (for example, `support hsn gst slabs and coupon maxDiscount caps`). Keep commits similarly specific. Pull requests should summarize behavior changes, note affected routes/modules and data implications, list verification performed, and include screenshots for visible UI changes. Link related issues when available.

## Security & Data Handling

Treat `config.js` and `data/db.json` as sensitive: configuration includes an admin key and the JSON file contains customer and transaction records. Do not add real credentials or customer data to commits. Back up the data file before any operation that could alter it, and review invoice, pricing, and ledger changes for consistent calculations.
