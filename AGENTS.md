# Repository Guidelines

## Project Structure & Module Organization

- `server.js` configures Express, mounts the routers under `/api`, serves static files, and exposes the printable invoice page.
- `routes/` handles HTTP requests. Keep inventory, order, Khata, pricing, GST, and persistence logic in `lib/`.
- `public/` contains the browser UI (`index.html`, `js/app.js`, and `css/style.css`). `config.js` holds shop settings, GST rates, and coupons.
- `data/db.json` is the app’s writable store for products, orders, customer accounts, settlements, and audit entries. See [the architecture diagram](docs/architecture.svg) for the checkout flow.

## Build, Test, and Development Commands

- `npm ci` installs the versions pinned in `package-lock.json`. No build step is configured.
- `npm start` runs `node server.js`. Open `http://localhost:3000` or use the port set by `PORT`.
- `npm test` runs a placeholder that exits with status 1. No test framework, coverage target, or test naming convention is configured.

## Coding Style & Naming Conventions

Match adjacent code. JavaScript uses two-space indentation, single quotes, and semicolons. Server modules use CommonJS (`require`, `module.exports`, and `exports`). Use lowercase module filenames and camelCase functions such as `getSellableStock()`. No lint or format script is configured. Preserve persisted field names where callers depend on them, especially order-line `id` and `qty` and product `stock` and `reserved`.

## Testing Guidelines

Run manual smoke checks with a disposable copy of `data/db.json`, since checkout, cancellation, and settlements write to it. For order changes, check stock boundaries, duplicate product lines, and cancellation. Compare physical stock, wholesale holds, and Khata balances before and after. For pricing changes, compare the checkout total, saved order, and printable invoice. Record the steps and results in the pull request.

## Commit & Pull Request Guidelines

Follow the recent history with short, lowercase summaries such as `support hsn gst slabs and coupon maxDiscount caps`. In the pull request, describe the behavior change and verification, link the relevant issue if one exists, and include screenshots for visible UI changes. Call out any persisted data changes and keep customer data and credentials out of examples.
