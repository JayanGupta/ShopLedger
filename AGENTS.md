# Repository Guidelines

## Project Structure & Module Organization

ShopLedger is a Node.js and Express POS, Khata credit ledger, and GST invoicing app. `server.js` serves `public/`, mounts `routes/` under `/api`, and handles the printable invoice route. Keep HTTP handling in `routes/` and business logic in `lib/`. The browser UI uses plain HTML, CSS, and JavaScript in `public/`. `config.js` holds shop, GST, and coupon settings. `lib/store.js` reads and writes `data/db.json`, which stores the catalog, orders, and customer ledger.

## Build, Test, and Development Commands

- `npm install` installs the dependencies declared in `package.json`.
- `npm start` runs `node server.js`. Open `http://localhost:3000` unless you set `PORT`.
- `node --check routes/orders.js` checks JavaScript syntax without starting the app. Repeat for each changed JavaScript file.
- `npm test` is a placeholder that exits with an error. The app serves its assets directly and has no build step.

## Coding Style & Naming Conventions

Use two-space indentation, single quotes and semicolons in JavaScript, and camelCase for functions and variables. Match the surrounding CommonJS style (`require`, `exports`, and `module.exports`). Use lowercase module names such as `lib/pricing.js`. The repository has no configured linter or formatter.

## Testing Guidelines

There is no automated test suite, test naming convention, or coverage threshold. Smoke-test changes with disposable data because placing orders or recording settlements rewrites `data/db.json`. For pricing changes, try a cart with mixed GST slabs and a capped coupon. Compare the preview and saved order totals, then inspect the printable invoice and GST reconciliation report. Checkout and invoices currently calculate figures separately. For stock or Khata changes, check the stored stock and balance before and after the operation.

## Commit & Pull Request Guidelines

Follow the history's short, lowercase, change-focused subjects, such as `support hsn gst slabs and coupon maxDiscount caps`. In a pull request, explain the behavior change, list the checks you ran, and link the issue when available. Include a screenshot for visible POS or invoice changes. Keep local sales data and credentials out of the diff.
