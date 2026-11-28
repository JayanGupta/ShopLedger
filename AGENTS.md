# Repository Guidelines

## Project Structure

- `server.js` starts Express, serves `public/`, mounts the `/api` routers, and exposes the printable order invoice.
- `routes/` handles HTTP requests for products, orders, customers, and reports. `lib/` contains pricing, GST, coupon, inventory, Khata, invoice, reporting, date, and storage logic.
- `public/index.html`, `public/js/app.js`, and `public/css/style.css` contain the browser UI. `config.js` holds shop settings, GST slabs, and coupon rules. `data/db.json` is the writable datastore.

## Local Development

- `npm install` installs Express and `body-parser`.
- `npm start` runs `node server.js`. Open `http://localhost:3000` or use the port set by `PORT`. The browser assets are served directly. There is no build step.
- `npm test` runs a placeholder that exits with an error. The repository has no automated test suite, test naming convention, or coverage threshold.

## Coding Style

Follow nearby JavaScript style: two-space indentation, single quotes, semicolons, CommonJS `require` and `exports`, and camelCase function names such as `computeTotals`. Use lowercase filenames such as `pricing.js`. Keep request handling in `routes/` and reusable business rules in `lib/`. No formatter or linter is configured.

## Verification and Data

Use a disposable copy of `data/db.json` for write-path checks because orders, cancellations, and settlements rewrite the datastore. For checkout changes, compare the cart preview, saved order, and printable invoice using a mixed-GST cart and a capped coupon. For stock or Khata changes, check the persisted stock and customer balance after order placement and cancellation. Record the inputs and observed results so reviewers can reproduce them.

## Commits and Pull Requests

Use short, descriptive commit subjects. Existing subjects are generally lowercase, for example `invoice page for accountant`. In pull requests, explain the behavior change and verification steps, link a related issue when available, and include screenshots for visible UI or invoice changes. Flag changes to persisted data or billing calculations explicitly.
