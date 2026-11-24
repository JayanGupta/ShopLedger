# Repository Guidelines

## Project Structure

- `server.js` starts Express, mounts the API routers, serves the browser UI, and handles printable invoices. `config.js` holds the port, shop details, GST slabs, coupon rules, and inventory defaults.
- `routes/` contains the product, order, customer, and report endpoints. Put request parsing and HTTP responses there. Put pricing, inventory, Khata, invoice, and persistence logic in `lib/`.
- `public/index.html`, `public/js/app.js`, and `public/css/style.css` make up the browser UI. `data/db.json` is the writable store for products, orders, customers, settlements, and audit entries.

## Local Development

- `npm install` installs the dependencies declared in `package.json`.
- `npm start` runs `node server.js`. Open `http://localhost:3000` or set `PORT` to use a different port.
- The browser assets are served directly. There is no build script.

## Coding Style

Use two-space indentation, single-quoted JavaScript strings, and semicolons. Follow the surrounding CommonJS style with `require`, `module.exports`, or named `exports`. Use lowercase module filenames such as `pricing.js` and descriptive camelCase function names such as `computeTotals`. Keep changes scoped to the feature. The repository has no configured linter or formatter.

## Testing

`npm test` is a placeholder that exits with an error. There is no test suite, framework, naming convention, or coverage target. Verify affected flows manually in a disposable checkout because orders, cancellations, and settlements rewrite `data/db.json`. For pricing changes, check mixed GST slabs and a capped coupon, then compare the saved order total with the printable invoice and reconciliation report. Record the expected and observed totals.

## Commits and Pull Requests

Git history uses short, lowercase, descriptive subjects such as `support hsn gst slabs and coupon maxDiscount caps`. In the PR, describe the behavior change and how you verified it. Link the relevant issue when available and include screenshots for visible UI or invoice changes. Keep live customer data and incidental database changes out of the diff.
