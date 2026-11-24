# Repository Guidelines

## Project Structure

- `server.js` starts Express, serves the browser UI, mounts the `/api` routers, and exposes the printable invoice endpoint.
- `routes/` handles products, orders, customers, and reports. Keep HTTP handling here and put business rules in `lib/`, which owns pricing, GST, coupons, inventory, Khata, invoicing, and JSON storage.
- `public/` contains the static HTML, CSS, and browser JavaScript. `config.js` holds shop details, GST slabs, and coupon rules. `data/db.json` is the writable local database. See `docs/architecture.svg` for the order flow.

## Local Development

- `npm install` installs the dependencies declared in `package.json`. The repository has no lockfile.
- `npm start` runs `node server.js`. Open `http://localhost:3000` or use the port set by `PORT`. There is no build step.
- `npm test` is a placeholder that exits with failure. The repository has no test suite, coverage target, or test naming convention.

## Coding Style

Match the surrounding JavaScript: two-space indentation, single quotes, semicolons, CommonJS imports and exports, and camelCase names. Use lowercase filenames for new modules. Keep browser code compatible with the static setup in `public/`. There is no configured linter or formatter.

## Testing Changes

Use a disposable copy of `data/db.json` in a local checkout for manual testing. For pricing changes, compare the cart preview, saved order, printable invoice, and GST reconciliation. Include a mixed-rate cart and a coupon that reaches its cap. For order or Khata changes, verify stock and customer balances after checkout, cancellation, or settlement, as applicable. Record what you checked and keep test transactions and customer data out of commits.

## Commits and Pull Requests

Follow the history's short, lowercase, descriptive commit subjects, such as `support hsn gst slabs and coupon maxDiscount caps`. In the PR, explain the behavior change and include verification steps and results. Link the issue when available and include screenshots for visible POS or invoice changes. Call out any changes to persisted data or how older orders are displayed.
