# Repository Guidelines

## Project Structure & Module Organization

ShopLedger is a Node.js/Express point-of-sale, inventory, Khata ledger, and GST invoicing app. `server.js` configures Express and mounts the routers in `routes/`. Business logic lives in `lib/`: pricing, tax, coupons, orders, inventory, ledger, storage, dates, invoices, and reports. The browser interface is in `public/` (`index.html`, `js/`, and `css/`). `config.js` contains shop, tax, inventory, and coupon settings. `data/db.json` is the local persistent store. Architecture overview: `docs/architecture.svg`. There is no dedicated test directory in the repository.

## Build, Test, and Development Commands

- `npm start` runs `node server.js` and serves the app on port 3000 by default; set `PORT` to override it.
- `npm test` is currently a placeholder that prints “no test specified” and exits with an error. Do not treat it as a passing test suite.
- There is no build, lint, or formatting script configured. Install dependencies with the package manager only when needed for development; use the committed lockfile to keep dependency versions consistent.

## Coding Style & Naming Conventions

Follow the existing CommonJS JavaScript style: two-space indentation, single-quoted strings, semicolons, and `var` declarations in keeping with the current code. Use `camelCase` for functions and variables, and lowercase plural filenames for route modules (for example, `routes/orders.js`). Keep HTTP handling in route modules and reusable domain logic in `lib/`. Preserve the established JSON response and error patterns when changing endpoints. No formatter or linter is configured.

## Testing Guidelines

No test framework or automated coverage requirement is configured. For changes, add focused tests if introducing a test setup, and otherwise manually verify the affected flow. Pricing changes should account for checkout totals, GST slabs, coupon limits, and printable invoice/reconciliation figures. Inventory and Khata changes should include order placement and cancellation paths.

## Commit & Pull Request Guidelines

Recent history uses short, lowercase, descriptive summaries (for example, `customer khata credit ledger and order cancellation`). Follow that style and keep each commit focused. Pull requests should describe the behavior changed, note relevant endpoints or modules, include manual verification steps, and attach screenshots for visible UI changes. Call out any data format or `data/db.json` migration impact.

## Security & Configuration Tips

Keep credentials and deployment-specific settings out of source control. `config.js` currently contains shop details and an admin key; review access controls before exposing admin routes. `data/db.json` contains operational records, so avoid committing real customer data or overwriting it during development.
