# Repository Guidelines

## Project Structure & Module Organization

ShopLedger is a small Node/Express POS, Khata ledger, and GST invoicing app. `server.js` creates the Express application and mounts API routers. Keep HTTP handlers in `routes/` (`orders.js`, `products.js`, `customers.js`, and `reports.js`) and business rules in `lib/` (pricing, tax, inventory, ledger, persistence, reports, and invoices). The browser UI is plain HTML/CSS/JavaScript in `public/`. `config.js` contains shop, tax, coupon, and inventory settings. `data/db.json` is the JSON-backed data store; treat changes to it as data migrations, not incidental formatting.

## Build, Test, and Development Commands

- `npm install` installs the locked dependencies.
- `npm start` runs `node server.js` and serves the UI on `http://localhost:3000` unless `PORT` is set.
- `npm test` is currently a placeholder that exits with an error; do not represent it as a passing test suite.

There is no build step, linter, formatter, or test framework configured. Check modified JavaScript manually and exercise the affected API/UI flow before submitting.

## Coding Style & Naming Conventions

Use the existing CommonJS style: `var`, `require(...)`, `module.exports`, semicolons, and two-space indentation. Use lowercase camelCase for variables and functions (`computeTotals`, `customerId`) and lowercase hyphenated API paths (`/orders/:id/cancel`). Keep route handlers thin: resolve request data in `routes/`, then place reusable domain logic in the matching `lib/` module. Preserve monetary rounding through the existing `round2` helpers.

## Testing Guidelines

When adding behavior, add an automated test framework and focused tests if the change is substantial; none exists today. At minimum, manually verify happy-path and rejected inputs, especially stock limits, coupon eligibility, HSN GST, Khata credit limits, cancellation, and invoice totals. Document the commands and scenarios used in the pull request.

## Commit & Pull Request Guidelines

Recent commits use short, lowercase, descriptive subjects such as `invoice page for accountant` and `support hsn gst slabs and coupon maxDiscount caps`. Follow that pattern: state the user-visible change without a ticket prefix. Keep commits scoped. Pull requests should explain the behavioral change, identify affected routes/data fields, include manual verification notes, link the issue when available, and attach UI screenshots for `public/` changes.

## Data, Security, and Configuration

Do not commit real customer data, credentials, exports, or temporary database copies. Do not expose or reuse the `adminKey` in `config.js`; move secrets to environment configuration when changing related code. Because writes replace the whole `data/db.json` file, review persistence changes carefully and avoid unrelated rewrites.
