# Repository Guidelines

## Project Structure

- `server.js` starts Express, serves `public/`, mounts the `/api` routers, and handles printable invoices.
- `routes/` contains HTTP handlers for products, orders, customers, and reports. Put shared business logic in `lib/`, which handles pricing, GST, coupons, inventory, Khata, invoicing, and storage.
- `public/index.html`, `public/js/app.js`, and `public/css/style.css` make up the browser UI. `config.js` defines shop details, tax slabs, and coupon rules. `data/db.json` is the tracked data file that the app rewrites at runtime.

## Local Development

- Run `npm install` from the repository root to install dependencies.
- Run `npm start` to start the app at `http://localhost:3000`. Use `PORT=3001 npm start` to override the port.
- There is no build step. Express serves the HTML, CSS, and JavaScript directly. `npm test` is a placeholder that exits with status 1.

## Coding Style

Use two-space indentation, single quotes, and semicolons in JavaScript. Follow the existing CommonJS style with `require()` and `exports`, lower-case module filenames such as `pricing.js`, and camelCase function names such as `computeTotals()`. Keep route handlers focused on request validation and responses, and reuse existing helpers for business rules. The repository has no configured linter or formatter.

## Verification

There is no automated test suite, test naming convention, or coverage target. Record the manual checks you performed. For checkout changes, place an order with mixed GST rates and a coupon, then compare the preview, saved order, and printable invoice. For Khata or inventory changes, verify balances and stock after the affected operation. Use a disposable checkout for tests that mutate `data/db.json`, and keep generated orders, settlements, and customer data out of commits.

## Commits and Pull Requests

Use short, descriptive commit subjects. Recent history generally uses lowercase subjects such as `invoice page for accountant`. In the PR, describe the behavior changed and how you verified it. Link the relevant issue when available, and include screenshots for changes to the browser UI or printable invoice.
