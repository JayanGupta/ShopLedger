# Repository Guidelines

## Project Structure & Module Organization

ShopLedger is a small Node.js and Express POS application. `server.js` configures Express and mounts the routers in `routes/` (`products.js`, `orders.js`, `customers.js`, and `reports.js`). Business logic is in `lib/`: pricing, tax, coupons, inventory, orders, Khata ledger, reporting, invoices, dates, and JSON persistence. The browser UI is `public/index.html`, `public/css/style.css`, and `public/js/app.js`. Runtime records are stored in `data/db.json`; shop settings and coupon/GST configuration are in `config.js`. Architecture documentation is in `docs/`. There is no test directory currently.

## Build, Test, and Development Commands

- `npm start` runs `node server.js` and serves the app at `http://localhost:3000` (or the configured `PORT`).
- `npm test` currently exits with “no test specified”; no test framework or build step is configured.

Do not assume a build or migration process exists. The app writes directly to `data/db.json`, so preserve the file when working with sample or production-like data.

## Coding Style & Naming Conventions

Follow the existing CommonJS and vanilla JavaScript style: two-space indentation, semicolons, single-quoted strings, and `var` declarations. Use lower camel case for functions and variables; route and library filenames are lowercase nouns such as `routes/orders.js` and `lib/pricing.js`. Keep HTTP handling in route modules and reusable business rules in `lib/`. There is no configured formatter or linter, so match the surrounding file style.

## Testing Guidelines

No automated tests or coverage requirements are present. If adding tests, introduce a clear test command and use descriptive names tied to behavior (for example, order pricing by GST slab or coupon cap). For manual checks, review the relevant API flow and verify that changes do not unintentionally alter stored totals, inventory, or Khata balances. Do not treat the current `npm test` placeholder as a passing test suite.

## Commit & Pull Request Guidelines

Recent commits use short, lowercase, descriptive subjects, for example `support hsn gst slabs and coupon maxDiscount caps`. Follow that style and describe the user-visible or business-rule change. Pull requests should summarize behavior changes, note affected routes/data, include verification steps, and add screenshots for browser UI changes. Call out any changes to `data/db.json`, pricing, GST, coupons, or ledger behavior explicitly.

## Security & Configuration

Keep credentials and deployment-specific values out of commits. Treat `data/db.json` as sensitive because it contains customer and transaction records. Validate request input at API boundaries, and escape untrusted values before rendering HTML.
