# Repository Guidelines

## Project Structure

- `server.js` serves the browser UI, mounts the Express routers under `/api`, and handles the printable invoice route.
- `routes/` contains HTTP handlers for products, orders, customers, and reports. `lib/` contains pricing, GST, coupons, inventory, Khata, invoices, reporting, and persistence.
- `public/` contains the static HTML, CSS, and browser JavaScript. `config.js` defines shop settings, GST slabs, and coupons. `data/db.json` is the tracked data file that the running app rewrites.

## Local Development

- `npm install` installs the Express and body-parser dependencies.
- `npm start` runs `node server.js`. Open `http://localhost:3000`, or set `PORT=3001 npm start` to use another port. The frontend is served directly from `public/`.
- `node --check routes/orders.js` checks JavaScript syntax without starting the app. Substitute the path of each changed JavaScript file.

## Coding Style

Use two-space indentation, single quotes, semicolons, and camelCase identifiers in JavaScript. Match nearby CommonJS modules and callback style. Keep HTTP handling in `routes/` and reuse existing helpers in `lib/` for calculations and persistence. The repository has no configured linter or formatter.

## Testing and Local Data

`npm test` is a failing placeholder. There is no automated test suite, test naming convention, or coverage threshold. Smoke-test state-changing flows in a disposable checkout because the app writes orders, stock changes, settlements, and audits into `data/db.json`. For pricing changes, check cart preview, saved order totals, and the printable invoice using mixed GST slabs and a capped coupon. Exercise Khata checkout and cancellation when touching credit or stock behavior.

## Commits and Pull Requests

Follow the history's short, lowercase, descriptive commit subjects, such as `express routes for products and orders`. In the PR, summarize the behavior change and include the checks you ran. Link the relevant issue when available and include screenshots for visible UI or invoice changes. Review the diff for local database changes, customer data, and credentials before publishing.
