# Repository Guidelines

## Project Structure & Module Organization

This is a Node.js/Express POS, inventory, GST invoicing, and Khata ledger app. `server.js` mounts the routers in `routes/` and serves the browser app from `public/`. Business logic is in `lib/` (pricing, tax, coupons, inventory, orders, ledger, invoices, reports, dates, and JSON storage). `config.js` holds shop settings and GST/coupon configuration. `data/db.json` is the file-backed application data store. The architecture diagram is in `docs/architecture.svg`. No test directory is present.

## Build, Test, and Development Commands

- `npm start` runs `node server.js` and serves the app on port 3000 by default; set `PORT` to override.
- `npm test` is currently a placeholder that exits with an error; there is no configured test framework or build script.
- Dependencies are declared in `package.json` and pinned by `package-lock.json`; use the lockfile when installing dependencies.

## Coding Style & Naming Conventions

Follow the existing CommonJS style (`require`, `module.exports`) and two-space indentation. Use lower camel case for functions and variables, descriptive filenames such as `routes/orders.js`, and Express router handlers for HTTP endpoints. Keep business rules in the relevant `lib/` module rather than duplicating calculations in routes or invoice rendering. Preserve the existing JSON data shape when changing persistence logic. No formatter or linter is configured.

## Testing Guidelines

There are no automated tests or coverage requirements in the repository. For changes to pricing, tax, coupons, stock, Khata, or invoices, manually verify representative cases, including invalid input and boundary values. Do not treat the existing `npm test` placeholder as a passing test suite.

## Commit & Pull Request Guidelines

Recent commits use short, lowercase, descriptive summaries (for example, `support hsn gst slabs and coupon maxDiscount caps`); follow that pattern and describe the behavior changed. In pull requests, explain the user-visible change, list affected modules, note any data/configuration implications, and include screenshots for UI changes. Call out the verification performed and any known limitations.

## Security & Configuration Tips

Do not commit real customer or transaction data from `data/db.json`. Review `config.js` before deployment: shop details, coupon rules, and an admin key are defined there. Validate and normalize all request values at the route boundary, and keep stored data and invoice totals consistent when adjusting business rules.
