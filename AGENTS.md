# Repository Guidelines

## Project Structure & Module Organization

- `server.js` starts Express, serves the browser UI, mounts the `/api` routers, and handles printable invoices.
- `routes/` handles HTTP requests for products, orders, customers, and reports. `lib/` implements pricing, GST, coupons, inventory, Khata, invoice rendering, and persistence.
- `public/` contains the HTML, CSS, and browser JavaScript. `config.js` holds shop details and business settings. See `docs/architecture.svg` for the order flow.
- `data/db.json` is the writable application store for products, orders, customers, settlements, and audit entries.

## Development Commands

- `npm install` installs the dependencies declared in `package.json`.
- `npm start` runs `node server.js`. Open `http://localhost:3000`, or set `PORT` to use another port.
- `node --check routes/orders.js` checks JavaScript syntax without starting the app. The project has no build step or configured linter or formatter.

## Coding Style & Naming

Use two-space indentation, single quotes, and semicolons in JavaScript. Follow the existing CommonJS style with `require()` and `exports` or `module.exports`. Use lower-case module names and camelCase for functions and variables. Keep HTTP handling in `routes/` and reusable business rules in `lib/`.

## Testing & Data Handling

`npm test` is a placeholder that exits with an error. The repository has no automated suite or coverage requirement. For checkout changes, manually compare the cart preview, saved order, and printed invoice using mixed GST slabs and a capped coupon. For Khata or inventory changes, verify balances and stock after checkout and cancellation.

Use a disposable checkout with sample data for manual tests. Order placement, cancellation, and settlements rewrite `data/db.json`. Keep test transactions and real customer records out of commits.

## Commits & Pull Requests

Use short, lower-case summaries that name the change, following existing subjects such as `support hsn gst slabs and coupon maxDiscount caps`. In pull requests, describe the behavior change and verification steps. Link the relevant issue when available, and include screenshots for visible UI or printable invoice changes.
