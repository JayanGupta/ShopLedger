# Repository Guidelines

## Project Structure & Module Organization

ShopLedger is a small Node/Express point-of-sale application. `server.js` wires middleware, static assets, API routers, and the printable invoice route. Put HTTP handlers in `routes/` (`orders.js`, `products.js`, `customers.js`, `reports.js`) and business rules in `lib/` (inventory, pricing, tax, ledger, orders, persistence, reports, and invoices). The browser UI is in `public/index.html`, `public/js/app.js`, and `public/css/style.css`. `data/db.json` is the live JSON datastore; treat it as operational data, not test fixture data. `docs/` holds repository documentation and diagrams.

## Build, Test, and Development Commands

- `npm install` installs the Express and body-parser dependencies.
- `npm start` runs `node server.js` and serves the app at the configured `PORT` (default `3000`).
- `npm test` currently exits with an error because this repository has no test suite; do not present it as a passing validation step.

There is no build step, linter, formatter, or automated test framework configured. Exercise changed API paths manually and verify that `data/db.json` remains valid JSON.

## Coding Style & Naming Conventions

Use the existing Node style: ES5 syntax (`var`, function expressions, CommonJS `require`), two-space indentation, semicolons, and single quotes. Keep route files thin: parse and validate requests there, then delegate state changes and calculations to `lib/`. Export library functions as `exports.functionName = function (...) { ... };`. Use lower-case, singular domain-oriented file names such as `lib/inventory.js`; use camelCase for variables and functions.

## Data, Inventory, and GST Safety

Products and order lines use `id` as their product identifier; do not introduce `productId` without migrating every caller. Preserve the distinction between product `stock` and `reserved`. Keep order totals server-calculated from canonical product data, and make any GST or invoice change consistent across `lib/pricing.js`, `lib/tax.js`, and `lib/invoice.js`.

## Commit & Pull Request Guidelines

Use concise, imperative, lower-case commit subjects consistent with history: `support hsn gst slabs and coupon maxDiscount caps`. Keep each commit focused. PRs should state the user-visible behavior, list affected API routes and data fields, note any `db.json` migration or fixture changes, and include screenshots for UI/invoice changes. Call out inventory, Khata, or GST effects explicitly.
