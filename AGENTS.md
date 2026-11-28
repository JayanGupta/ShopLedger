# Repository Guidelines

## Project Structure

- `server.js` configures Express, serves `public/`, mounts the API under `/api`, and serves printable invoices.
- `routes/` handles HTTP requests for products, orders, customers, pricing previews, and reports. Put reusable business logic in `lib/`, which contains pricing, GST, coupons, inventory, Khata, invoices, and JSON persistence.
- `public/index.html`, `public/js/app.js`, and `public/css/style.css` contain the browser UI and assets. `config.js` holds shop details, GST rates, and coupon rules. `data/db.json` holds persisted orders, stock, customer balances, and audit entries.
- See `docs/architecture.svg` for the module map and order flow.

## Local Development

- `npm install` installs the dependencies declared in `package.json`.
- `npm start` runs `node server.js`. Open `http://localhost:3000` unless you set `PORT`. Express serves the browser assets directly, so there is no separate build step.
- `npm test` runs a placeholder script that exits with an error.

## Coding Style

Use two-space indentation, single quotes, and semicolons in JavaScript. Match nearby CommonJS code with `require()` and `exports` or `module.exports`. Use lowercase module filenames and descriptive camelCase function names such as `computeTotals`. The repository defines no lint or formatter command.

## Verification

The repository has no test framework, test naming convention, or coverage requirement. Verify changes through the affected API or browser workflow. For order changes, check the cart preview, saved totals, printed invoice, stock movement, and Khata balance as applicable. For GST or coupon changes, include an order with mixed HSN rates and a capped discount. Use disposable data for checks that place orders or record settlements because these actions rewrite `data/db.json`.

## Commits and Pull Requests

History uses short, lowercase descriptions such as `support hsn gst slabs and coupon maxDiscount caps`. Keep commits focused. In a pull request, describe the user-visible change and how you verified it. Link the relevant ticket when available, and include a screenshot for browser or invoice layout changes. Call out any changes to persisted data or billing calculations.
