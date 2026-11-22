# Repository Guidelines

## Project Structure & Module Organization

ShopLedger is a small Express application for point-of-sale billing, inventory, and customer credit. `server.js` starts the app and mounts API routers from `routes/` (`products.js`, `orders.js`, `customers.js`, and `reports.js`). Business logic lives in `lib/`, including pricing, tax, coupons, inventory, orders, invoices, ledger, reports, dates, and JSON storage. The browser interface is in `public/` (`index.html`, `js/app.js`, and `css/style.css`). `config.js` contains shop and business settings. Runtime data is stored in `data/db.json`; the system design diagram is in `docs/architecture.svg`.

## Build, Test, and Development Commands

- `npm install` installs the dependencies declared in `package.json`.
- `npm start` runs `node server.js`; open the local address printed by the server.
- `npm test` is currently a placeholder that exits with an error because no test suite is configured. Do not treat it as a passing validation command.

There is no build, lint, or formatting script configured. For changes, manually exercise the relevant UI or API path and inspect the persisted data when appropriate.

## Coding Style & Naming Conventions

Follow the existing CommonJS and Express style. Use two spaces for indentation, semicolons, single-quoted strings, and descriptive camelCase names for functions and variables. Keep route handlers in `routes/` and reusable business rules in `lib/`; avoid duplicating pricing or validation logic across handlers. Match existing filenames, which are lowercase and use short domain names (for example, `pricing.js` and `gst-reconciliation` route paths).

## Testing Guidelines

No test framework, test directory, or coverage requirement is present. If adding tests, first establish a repeatable test command and use filenames that identify the module or behavior (for example, `pricing.test.js`). Cover order totals, coupon validation, GST calculation, stock reservation, and persistence paths when those areas change.

## Commit & Pull Request Guidelines

Recent commits use short, lowercase, descriptive summaries, often without a prefix (for example, `invoice page for accountant`). Follow that pattern and state the user-visible or business-rule change. Pull requests should explain the behavior change, list manual checks or tests run, link related issues when available, and include screenshots for browser UI changes. Call out any changes to `data/db.json` shape or configuration.

## Security & Configuration

Keep environment-specific or sensitive values out of commits. Review `config.js` and sample data before sharing; do not put credentials or real customer data in `data/db.json`.
