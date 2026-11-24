# Repository Guidelines

## Project Structure

ShopLedger is a Node.js and Express app for point-of-sale orders, Khata credit, inventory, and GST invoices.

- `server.js` serves the browser UI, mounts the routers under `/api`, and serves printable invoices at `/orders/:id/invoice`.
- `routes/` handles HTTP requests for products, orders, customers, and reports. Put reusable business rules in `lib/`.
- `public/` contains static HTML, CSS, and vanilla JavaScript. `config.js` holds shop settings, GST rates, and coupon rules.
- `data/db.json` is the live JSON store, accessed through `lib/store.js`. It contains stock, orders, customer balances, settlements, and audit entries.

## Local Development

- `npm install` installs dependencies from `package.json`. A fresh checkout has no tracked lockfile.
- `npm start` runs `node server.js`. Open `http://localhost:3000` by default. Set `PORT` to use a different port.
- `node --check <file.js>` checks a JavaScript file's syntax. The app serves its assets directly and has no build step.

## Coding Style

Use two-space indentation, single quotes in JavaScript, semicolons, and camelCase names such as `computeTotals`. Follow the existing CommonJS style (`require`, `exports`, and `module.exports)) and match nearby code. Keep filenames lowercase, such as `routes/orders.js`. The repository configures no formatter or linter.

## Testing and Data Handling

There is no automated test suite, test naming convention, or coverage threshold. `npm test` is a placeholder that exits with an error. Syntax-check changed JavaScript and smoke-test the affected browser or API path. Use a disposable checkout for order or settlement checks because those requests overwrite `data/db.json`.

For pricing changes, compare POS preview, saved order totals, printable invoice, and GST reconciliation. Include a mixed-slab cart and a capped coupon, and record any discrepancies.

## Commits and Pull Requests

Git history uses short, lowercase summaries such as `express routes for products and orders`. Keep commits focused. In pull requests, explain the behavior change and the checks you ran, link the issue when available, and include screenshots for visible UI or invoice changes.
