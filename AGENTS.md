# Repository Guidelines

## Project Structure

- `server.js` starts Express, serves the static interface, mounts routers under `/api`, and handles the printable invoice endpoint. `config.js` holds shop details, GST rates, coupon rules, and the port.
- `routes/` handles products, orders, Khata customers, and reports. Keep request handling there and put reusable business logic in `lib/`. `public/` contains the browser HTML, CSS, and JavaScript.
- `data/db.json` is the file-backed database. `lib/store.js` reads and rewrites it. Use a disposable checkout or copy with sample data when exercising writes.

## Local Development

- `npm install` installs the dependencies declared in `package.json`. Use `npm ci` when a matching lockfile is available and you need a repeatable install.
- `npm start` runs `node server.js`. Open `http://localhost:3000` by default or set `PORT` to use another port. The browser assets are served directly, so there is no build step.
- `npm test` currently exits with a placeholder error. There is no configured test framework, coverage threshold, or test naming convention.

## Coding Style

Follow the surrounding JavaScript style. Use two-space indentation, single quotes, semicolons, CommonJS modules, and descriptive camelCase names such as `computeTotals`. Existing files use `var` and function expressions. No linter or formatter is configured.

## Verification

Record the manual checks relevant to the change. For pricing changes, place an order with mixed GST slabs and a capped coupon, then compare the cart preview, saved order, printable invoice, and reconciliation report. For stock or Khata changes, check both placement and cancellation and inspect the saved values.

## Commits and Pull Requests

Use short, descriptive, lowercase commit subjects in the style of `support hsn gst slabs and coupon maxDiscount caps`. In the pull request, explain the behavior change, list verification steps and results, and link the relevant issue when available. Include a screenshot for visible UI or invoice changes. Keep customer records and credentials out of diffs, screenshots, and logs.
