# ShopLedger - Agent Instructions

## Stack
- Node.js (v22+) & Express 4
- Pure CommonJS (`require` / `module.exports`)
- Native Node test runner (`node --test`, `node:assert`)
- Data store: local JSON file (`data/db.json`) via `lib/store.js`

## Module Map
- `routes/customers.js`: Customer khata directory and settlement endpoints
- `routes/orders.js`: Order placement, POS checkout, listing, and cancellation
- `routes/products.js`: Product catalog and SKU stock queries
- `routes/reports.js`: Sales reports and GST audit mismatch endpoints
- `lib/coupons.js`: Promo code validation and discount calculations
- `lib/dates.js`: Date parsing, range filtering, and DD/MM/YYYY formatting
- `lib/inventory.js`: Stock check, reservation, and restoration logic
- `lib/invoice.js`: Printable invoice generation, tax slabs, and line items
- `lib/ledger.js`: Khata ledger balances and settlement transaction updates
- `lib/orders.js`: Order persistence helpers and chronological filtering
- `lib/pricing.js`: Subtotal, line-level discount allocation, and tax math
- `lib/reports.js`: GST reconciliation and audit calculations
- `lib/store.js`: Low-level read/write operations for `data/db.json`
- `lib/tax.js`: HSN codes to GST rate resolution and slab lookups

## Commands
- Start server: `npm start` (or `node server.js`, runs on `http://localhost:3000`)
- Run tests: `node --test` (or `node --test test/*.test.js`)

## Rules
1. Write characterization tests before changing any behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; they use in-memory mock data.
4. Add no dependencies (keep `package.json` intact).
5. Make the smallest fix that works.

## Current Ticket
- **Ticket**: Invoice total and GST breakdown do not match what the customer was billed.
- **Allowed Files**: `lib/invoice.js` (`lib/tax.js` only if truly needed).

