# AGENTS.md — ShopLedger

## Project

ShopLedger is a small Node.js + Express app for a grocery store (Corner Shop Kirana &
Wholesale, Pune): POS billing, inventory with wholesale-reserved stock, and a customer
khata (credit) ledger. The browser UI in `public/` talks to JSON APIs in `routes/`,
business logic lives in `lib/`, and all data is stored in a single JSON file,
`data/db.json`, read and written whole by `lib/store.js`. See
`docs/cp1-explanation.md` for a full map of the codebase and `docs/architecture.svg`
for the diagram.

## Run and test

```sh
npm install   # installs express + body-parser
npm start     # node server.js — http://localhost:3000
node --test   # runs the test suite in test/ (node:test, no extra dependencies)
```

## Current ticket

**Ticket 3 — "The last sellable unit of a product cannot be sold, and cancelling a
pending order does not return the items to stock."**

Allowed files for this ticket — nothing else may be changed:

- `lib/inventory.js`
- `lib/orders.js` — the `cancel` function only
- New files for the workshop checkpoints: `AGENTS.md`, `docs/architecture.svg`,
  `test/inventory.test.js`, `docs/cp1-explanation.md`, `docs/prep-summary.md`

## Do not touch

- `node_modules/` and `package-lock.json` (never edit the lockfile by hand)
- `data/db.json` — read-only. Never edit it, and never let a test read or write it.
- Every file outside the allowed list above, including `server.js`, `config.js`,
  `routes/`, `public/`, and the other modules in `lib/`.

## Code style

- Small, minimal changes in the existing style: `var`, CommonJS (`require` /
  `exports.`), no arrow-function or ES-module rewrites of existing code.
- No new dependencies.
- No refactors, renames, or formatting sweeps — fix the ticket, nothing more.
- Match the surrounding code, including its comment style.

## Tests

- Use only the built-in `node:test` runner and `node:assert` — no test frameworks.
- Tests live in `test/` and run with `node --test`.
- Tests must use in-memory data only (plain objects passed to the `lib/` functions).
  They must never read or write `data/db.json` and must not need the server running.
- Characterization tests pin current behaviour before a fix; tests that describe
  wrong behaviour are named with a `CURRENT BEHAVIOUR:` prefix and are updated
  (not silently deleted) when the fix lands.
