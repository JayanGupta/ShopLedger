# Repository Guidelines

## Project Structure

`server.js` starts Express, serves the browser UI, mounts API routers, and serves printable invoices. Put request handling in `routes/` and reusable business rules in `lib/`, which contains pricing, GST, coupons, inventory, Khata, reporting, and storage code. Browser assets live in `public/index.html`, `public/js/`, and `public/css/`. `config.js` holds shop and pricing settings. `data/db.json` is the writable store for orders, inventory, customer balances, settlements, and audit history.

## Local Development

- `npm install` installs the dependencies declared in `package.json`.
- `npm start` runs `node server.js`. Open `http://localhost:3000` or set `PORT` to use a different port.
- `npm test` runs a placeholder that exits with an error. The project serves its browser assets directly and has no build or lint script.

## Coding Style

Use two-space indentation, single quotes, and semicolons in JavaScript. Follow the surrounding CommonJS style with `require()` and `module.exports` or `exports`. Use lowercase module filenames and descriptive camelCase names such as `computeTotals` and `chargeOrderToKhata`. Keep route handlers focused on request validation and orchestration, and reuse the existing domain helpers for calculations and persistence.

## Verification and Local Data

The repository has no configured test framework, test naming convention, or coverage threshold. Use a disposable checkout or back up `data/db.json` before testing write endpoints. For checkout changes, verify a mixed-GST cart with a coupon, check the saved order and stock adjustment, and compare receipt figures with the printable invoice and GST reconciliation report. For Khata changes, verify the customer balance after a charge, settlement, or cancellation. Keep local transactions and real customer data out of commits.

## Commits and Pull Requests

Recent commits use short, lowercase descriptions such as `invoice page for accountant` and `express routes for products and orders`. Keep each commit focused. In a pull request, describe the behavior change and how you verified it. Link the relevant issue when available and include screenshots for visible UI or invoice changes. Call out changes to pricing, saved data, or configuration that reviewers need to check.
