# ShopLedger contributor notes

## Stack and layout
- Node.js 22+ and Express 4; browser UI is plain HTML, CSS, and JavaScript.
- `server.js` serves `public/` and mounts routers from `routes/`.
- `lib/` contains pricing, tax, coupons, inventory, orders, ledger, invoice, reports, dates, and JSON store logic.
- `config.js` holds shop settings, HSN tax slabs, coupons, and defaults.
- `data/db.json` is the local JSON database. `lib/store.js` reads and writes it.

## Commands
- `npm start` runs the app on port 3000 (or `PORT`).
- `npm test` is currently a placeholder that exits with an error.
- Focused tests use Node's built-in runner: `node --test test/invoice.test.js`.

## Safe change rules
1. Read the existing flow before editing; preserve established behavior outside the ticket.
2. Add focused regression tests before changing behavior.
3. Keep each fix as small as possible and within the ticket's allowed files.
4. Never run tests against or modify `data/db.json`; use isolated in-memory fixtures.
5. Review the final diff for unrelated edits, secrets, and debugging output.

## Current ticket: invoice and GST reconciliation
- Goal: make printable invoice calculations match checkout's HSN GST, coupon, rounding, and total rules.
- Allowed files: `lib/invoice.js`, `test/invoice.test.js`, `docs/architecture.svg`, and this `AGENTS.md`.
- Do not change checkout pricing, routes, inventory, or the tracked database for this ticket.
