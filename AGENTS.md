# Repository Guidelines

## Project Structure

* `server.js` configures Express, serves the static browser UI, mounts the `/api` routers, and handles printable invoices at `/orders/:id/invoice`.
* `routes/` contains HTTP handlers for products, orders, customers, and reports. Keep pricing, GST, coupons, inventory, Khata balances, and invoice rendering in the matching modules under `lib/`.
* `public/` contains the HTML, CSS, and browser JavaScript. `config.js` holds shop details, tax and coupon rules, and server defaults. `data/db.json` is the writable store for products, orders, customers, settlements, and audit entries.

## Local Development

* `npm install` installs Express and the other declared dependencies.
* `npm start` runs `node server.js`. Open `http://localhost:3000` or set `PORT` to override the default.
* The UI is served directly from `public/`. There is no build step or configured lint or format command.

## Coding Style

Use two-space indentation, single quotes, and semicolons. Match the surrounding CommonJS style in Node code with `require()` and `module.exports` or named `exports`. Use descriptive camelCase names such as `computeTotals` and lowercase module filenames such as `pricing.js`. Keep changes focused and reuse existing helpers where their behavior fits.

## Testing Changes

`npm test` is a placeholder that exits with an error. The repository defines no test framework, test naming convention, or coverage target. Use disposable data for checks that place or cancel orders or settle Khata balances, since those actions rewrite `data/db.json`.

For pricing changes, compare the cart preview, saved order, and printable invoice. Exercise mixed GST slabs, coupon minimums and caps, and rounding. For inventory or Khata changes, verify stock and balance changes on placement and cancellation.

## Commits and Pull Requests

Git history uses short, lowercase subjects that describe the change, such as `support hsn gst slabs and coupon maxDiscount caps`. Summarize the behavior change and verification steps in the pull request. Link the relevant issue when available, and include screenshots for visible UI or invoice changes. Call out changes to persisted order fields or financial calculations.



\*\*\*

Verify by reading the code; do not guess.



Sections:

\- Stack

\- Module map (one line per file in routes/ and lib/)

\- Commands (start the app, run tests with node --test)

\- Rules: 1) write characterization tests before changing behaviour; 2) change only the module(s) the ticket is about; 3) tests never read or write data/db.json, they use in-memory data; 4) add no dependencies; 5) make the smallest fix that works

\- Current ticket: Invoice total and GST breakdown do not match what the customer was billed. Allowed files: lib/invoice.js (lib/tax.js only if truly needed).



Change nothing else.

\*\*\*

