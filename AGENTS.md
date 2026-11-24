# Repository Guidelines

## Project Structure

- `server.js` configures Express, serves `public/`, mounts the four routers under `/api`, and handles `GET /orders/:id/invoice`.
- `routes/` handles HTTP requests and responses. Keep reusable business logic in `lib/`, which contains checkout pricing, GST, coupons, inventory, orders, Khata, invoice rendering, and reporting.
- `public/index.html`, `public/js/app.js`, and `public/css/style.css` make up the browser UI. `config.js` holds shop settings, GST slabs, and coupon rules. `data/db.json` is the tracked dataset and the runtime store.

## Development Commands

- `npm install` installs dependencies. Review any generated lockfile changes before including them in a PR.
- `npm start` runs `node server.js`. Open `http://localhost:3000` or use the configured `PORT`. The app serves source files directly and has no build step.
- `npm test` runs a placeholder that exits with an error. Use the manual checks below to verify changes.

## Coding Style

Use two-space indentation, single quotes, and semicolons in JavaScript. Follow the existing CommonJS style with `require()`, `exports`, and `module.exports`. Use camelCase for functions and variables, and lowercase filenames such as `lib/pricing.js`. The repository has no configured formatter or linter.

## Testing

The repository has no test framework, test naming convention, or coverage threshold. Run manual checks against a disposable copy of the repository because orders, cancellations, and settlements rewrite `data/db.json`. For changes to pricing or invoices, compare the cart preview, saved order, printable invoice, and GST reconciliation report. Check mixed GST slabs and a capped percentage coupon. For stock or Khata changes, verify the saved quantities and balances after order placement and cancellation.

## Commits and Pull Requests

Use short, descriptive, lowercase commit subjects, following history such as `invoice page for accountant`. In a PR, explain the behavior change, link the issue if one exists, and record the checks you ran. Include screenshots for visible UI or invoice changes. Call out changes to saved data formats and any effect on historical orders.
