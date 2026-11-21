# Repository Guidelines

## Project Structure & Module Organization

ShopLedger is a Node/Express POS, Khata ledger, and GST-invoicing app. `server.js` creates the Express application and mounts the API. Put endpoint handlers in `routes/` (`orders.js`, `products.js`, `customers.js`, `reports.js`) and domain logic in `lib/` (for example, `inventory.js`, `pricing.js`, and `ledger.js`).

The browser client lives in `public/`: `index.html`, `css/style.css`, and `js/app.js`. `config.js` holds shop, tax, inventory, and coupon settings. `data/db.json` is the live JSON data store; treat it as business data, not a fixture. See `docs/architecture.svg` for the component and order-flow map.

## Build, Test, and Development Commands

- `npm install` installs the Express and body-parser dependencies.
- `npm start` runs `node server.js`; the default URL is `http://localhost:3000` unless `PORT` is set.
- `npm test` currently exits with an error because no test suite is configured. Do not describe it as a passing verification step.

There is no build step, formatter, linter, or automated test framework in this repository.

## Coding Style & Naming Conventions

Follow the existing CommonJS style: `var` declarations, `require(...)`, and `module.exports`. Use two-space indentation, semicolons, lower-camel-case variables/functions, and lowercase file names. Keep route files thin: resolve HTTP input/output there and place reusable business rules in `lib/`.

Preserve the established data fields: product and order-line identifiers are `id`; product quantities are `stock`, `reserved`, and line-item `qty`. Do not substitute `productId` without a compatible migration. Prefer existing helpers such as `store.read()`, `store.write()`, `inventory.check()`, and `pricing.computeTotals()` over duplicated calculations.

## Testing & Data Changes

For behavior changes, add focused automated tests before relying on manual checks; a test harness still needs to be selected. Test order placement, stock updates, cancellations, Khata limits, and GST totals together where relevant. Avoid committing incidental changes to `data/db.json`; if a data change is intentional, explain it in the pull request.

## Commits, Pull Requests, and Security

Recent commits use short, lowercase, imperative summaries, such as `support hsn gst slabs and coupon maxDiscount caps`. Follow that pattern and keep each commit scoped. Pull requests should describe the user-facing change, list verification performed, link the issue/ticket, and include screenshots for UI work.

Do not expose or reuse the admin export key from `config.js`. Do not put customer data, exports, or secrets in issues, commits, or screenshots.
