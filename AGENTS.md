# Repository Guidelines

## Project Structure

- `server.js` starts Express, serves `public/`, mounts the API under `/api`, and handles the printable invoice route.
- `routes/` contains the product, order, customer, and report HTTP handlers. `lib/` contains pricing, GST, coupons, stock, Khata, invoices, reporting, and JSON storage.
- `public/` contains plain HTML, CSS, and browser JavaScript. `config.js` holds shop details, GST slabs, and coupon settings. `data/db.json` is the tracked store for products, customers, orders, settlements, and audit entries.

## Development Commands

- `npm install` installs the dependencies declared in `package.json`.
- `npm start` runs `node server.js`. Open `http://localhost:3000` or set `PORT` to use a different port.
- `node --check lib/pricing.js` checks JavaScript syntax without starting the app. Use the path of each JavaScript file you changed.

The UI is served directly from `public/`. The repository has no build step or configured formatter or linter.

## Coding Style

Use two-space indentation, single quotes for JavaScript strings, and semicolons. Match the surrounding CommonJS style in server code with `require()` and `exports` or `module.exports`. Use descriptive `camelCase` function names such as `computeTotals()`. Keep request handling in `routes/` and shared business rules in `lib/`.

## Testing

`npm test` is a placeholder that exits with an error. The repository defines no test framework, coverage threshold, or test naming convention. For manual checks that create orders, cancel orders, or record settlements, run the app from a disposable copy because these actions rewrite `data/db.json`. For pricing changes, check a mixed-GST basket with a capped coupon and compare checkout, the saved order, and the printable invoice. For Khata or stock changes, check the resulting balance and stock.

## Commits and Pull Requests

Follow the short, lowercase subjects in Git history, such as `invoice page for accountant`. In the pull request, explain the behavior change, link the issue when applicable, and list the checks you ran. Include before-and-after screenshots for visible UI or invoice layout changes. Keep local transactions and real customer data out of commits.
