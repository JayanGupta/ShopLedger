# Repository Guidelines

## Project Structure & Module Organization

This is a small Node.js/Express POS, inventory, Khata ledger, and GST invoicing app. `server.js` configures Express and mounts the routers. `routes/` contains API endpoints; `lib/` contains business logic for orders, pricing, tax, coupons, inventory, ledger, reports, dates, invoices, and JSON storage. `public/` holds the browser UI (`index.html`, `css/`, and `js/`). `config.js` contains shop, tax, coupon, and inventory settings. `data/db.json` is the local persistent store. `docs/` contains repository documentation and diagrams. There is no test directory or test framework currently configured.

## Build, Test, and Development Commands

- `npm start` runs the app with `node server.js` on port 3000, or on the `PORT` environment variable when set.
- `npm test` currently exits with “Error: no test specified”; do not treat it as a passing test suite.
- No build, lint, or formatting scripts are configured. Do not claim validation beyond checks actually performed.

## Coding Style & Naming Conventions

Follow the existing CommonJS JavaScript style: two-space indentation, single-quoted strings, semicolons, and `var` declarations. Use lowercase file names, with descriptive module names such as `pricing.js`; route paths use lowercase plural nouns (for example, `/api/orders`). Keep HTTP handling in `routes/` and reusable business rules in `lib/`. Centralize shop, coupon, and tax settings in `config.js` rather than duplicating them.

## Testing Guidelines

There are no repository tests or coverage requirements today. For changes, manually exercise the relevant flow and inspect the resulting API response and `data/db.json` behavior. For pricing changes, compare checkout calculations in `lib/pricing.js` and invoice calculations in `lib/invoice.js`; both currently contain calculation logic. Add focused tests when introducing a test framework, and document the command contributors should run.

## Commit & Pull Request Guidelines

Recent commits use short, lowercase, descriptive summaries (for example, `support hsn gst slabs and coupon maxDiscount caps`). Follow that pattern and describe the behavior changed. Pull requests should explain user-visible and data-model changes, list manual verification performed, and include screenshots for browser UI changes. Call out changes to persistent JSON structure or GST and coupon calculations explicitly.

## Security & Configuration Tips

Do not commit real customer information or secrets. `data/db.json` contains application records, and `config.js` currently includes an admin key and shop configuration; treat these as sensitive and avoid exposing exports or production credentials.
