# Repository Guidelines

## Project Structure & Module Organization

`server.js` creates the Express application and mounts the API routers. Keep request handlers in `routes/`: `products.js`, `orders.js`, `customers.js`, and `reports.js`. Put reusable business logic in `lib/` (for example, checkout totals in `lib/pricing.js`, stock changes in `lib/inventory.js`, and JSON persistence in `lib/store.js`).

The browser POS lives in `public/` (`index.html`, `js/app.js`, and `css/style.css`). `config.js` holds shop, tax, coupon, and inventory settings. `data/db.json` is the development data store; do not hand-edit it unless a task specifically requires seed-data changes. See `docs/architecture.svg` for the component map and order flow.

## Build, Test, and Development Commands

- `npm install` installs the declared Express and body-parser dependencies.
- `npm start` runs `node server.js`; set `PORT=3001` (or another free port) before starting when port 3000 is occupied.
- `npm test` currently exits with “no test specified”; it is not a validation suite.

There is no build step, linter, formatter, or configured automated test framework.

## Coding Style & Naming Conventions

Use the existing CommonJS style: `var` declarations, `require(...)`, and `module.exports`. Match the current two-space indentation and semicolon usage. Name modules by domain in lowercase (`lib/pricing.js`), keep route paths plural (`/orders`), and use camelCase for JavaScript variables and JSON fields (`customerId`, `paymentMode`).

Keep price, tax, and discount calculations in `lib/` rather than duplicating them in routes or browser code. Preserve two-decimal rounding through the existing `round2` helpers.

## Testing Guidelines

No tests currently exist. Add focused tests alongside any test setup you introduce, using descriptive names such as `pricing.test.js`. At minimum, cover changed checkout totals, coupon boundaries, stock adjustments, Khata balances, and invoice/ledger reconciliation. Manually verify API changes through the POS and affected routes before requesting review.

## Commits & Pull Requests

Follow the history’s short, lower-case, feature-focused subjects, for example: `fix invoice gst reconciliation`. Keep commits scoped to one concern. Pull requests should explain the behavior change, identify data/config changes, describe manual verification, link the issue when available, and include screenshots for UI or invoice-layout changes.

## Security & Data

Do not commit customer data, credentials, or production exports. Treat the admin export key and `data/db.json` as sensitive; replace hard-coded secrets with environment configuration before production use.
