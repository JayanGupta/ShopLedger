# Repository Guidelines

## Project Structure & Module Organization

- `server.js` configures Express, serves static assets, mounts routers at `/api`, and exposes `/orders/:id/invoice`.
- `routes/` contains `products.js`, `orders.js`, `customers.js`, and `reports.js`. Keep HTTP handling here and business logic in `lib/`.
- `lib/` implements pricing, GST, coupons, inventory, orders, Khata accounting, invoices, reports, dates, and JSON persistence.
- `public/` contains `index.html`, browser logic in `js/app.js`, and styles in `css/style.css`.
- `config.js` defines shop details, tax slabs, coupons, inventory defaults, and the port. `data/db.json` stores all persistent records.
- `docs/architecture.svg` maps modules and order placement. No test directory currently exists.

## Build, Test, and Development Commands

- `npm install`: install the dependencies declared in `package.json`; review any lockfile changes.
- `npm start`: run `node server.js`; the default address is `http://localhost:3000`. Set `PORT` to override it.
- `npm test`: currently prints “no test specified” and exits unsuccessfully; it does not validate the app.

There is no build step, development watcher, lint command, or configured formatter. Run commands only within the scope authorized for the task.

## Coding Style & Naming Conventions

Match surrounding code: two-space indentation, semicolons, single-quoted JavaScript strings, CommonJS `require`, and `module.exports`/`exports`. Existing JavaScript predominantly uses `var` and function expressions. Use camelCase for variables and functions, and lowercase filenames such as `pricing.js`. Avoid unrelated style rewrites or adding tooling for a small change.

## Testing Guidelines

No testing framework, coverage threshold, or test naming convention is configured. For new automated tests, propose a runner and an explicit convention such as `test/pricing.test.js`.

For financial changes, verify mixed GST slabs, coupon minimums/caps, rounding, and checkout-versus-invoice totals. For inventory or Khata changes, check placement, cancellation, credit limits, and numeric settlements. Use disposable data: mutations rewrite `data/db.json`. Record checks performed and checks not run.

## Commit & Pull Request Guidelines

History uses short, lowercase descriptive subjects, for example `support hsn gst slabs and coupon maxDiscount caps`; no enforced prefix convention is evident. Keep commits focused.

Describe the problem, resulting behavior, affected modules, and validation in each PR. Link an issue when available; include screenshots for UI or invoice changes. Explain financial calculation changes with before/after amounts.

## Data & Configuration

Preserve unrelated database records and existing workspace changes. Do not commit real customer information or new secrets. The admin export key is currently hardcoded in `config.js`. Checkout and invoice calculations differ; inspect both paths before changing GST or coupon behavior.
