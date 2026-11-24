# Repository Guidelines

## Project Structure & Module Organization

ShopLedger is a Node/Express point-of-sale, Khata ledger, inventory, and GST-invoicing app. `server.js` wires middleware, static assets, API routers, and the printable invoice route. Keep HTTP handlers in `routes/` (`orders.js`, `products.js`, `customers.js`, `reports.js`) and reusable business logic in `lib/`.

The browser UI is in `public/`: `index.html`, `js/app.js`, and `css/style.css`. `config.js` holds shop, GST-slab, coupon, and inventory settings. `data/db.json` is the live JSON datastore; treat changes to it as data migrations, not sample-data edits. `docs/architecture.svg` documents the current component layout.

## Build, Test, and Development Commands

- `npm start` — starts the Express server using `node server.js` (default port `3000`, overridable with `PORT`).
- `npm test` — currently exits with “no test specified”; add a real test suite before relying on it in CI.

No build step, formatter, linter, or test framework is configured. Do not introduce generated output or dependency lockfiles without agreement in the related change.

## Coding Style & Naming Conventions

Match the existing ES5 CommonJS style: `var`, `require(...)`, and `exports.name = function (...) {}`. Use two-space indentation, semicolons, single quotes, and camelCase for variables/functions. Keep route paths REST-like (for example, `POST /orders`) and put calculations in `lib/`, not UI handlers.

Persisted order lines should remain snapshots of product fields needed for auditability (`id`, `sku`, `name`, `hsn`, `price`, `qty`). Reuse `lib/pricing.js`, `lib/tax.js`, and `lib/coupons.js` rather than duplicating financial calculations.

## Testing Guidelines

There are no automated tests yet. For logic changes, add focused tests in a new `test/` directory with names such as `pricing.test.js`, and cover GST slabs, coupon limits, rounding, stock mutation, cancellation, and Khata credit limits. Before submitting, manually exercise the affected API/UI flow and confirm the order ledger, invoice, and GST reconciliation agree.

## Commit & Pull Request Guidelines

Recent commits use short, lowercase, descriptive subject lines, such as `support hsn gst slabs and coupon maxDiscount caps`. Prefer the same style: describe the user-visible capability, keep each commit focused, and avoid vague messages such as `fix`.

Pull requests should state the behavior changed, affected routes/modules, data migration implications, and verification performed. Include screenshots for UI or printable-invoice changes, and call out any impact on stored totals, GST, coupons, stock, or customer balances.

## Security & Data Care

Never commit customer data, admin keys, or production `data/db.json` exports. Validate request input server-side and preserve the existing order/audit trail when changing persistence behavior.
