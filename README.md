# Common Ground shop

A small React storefront with a Node/Express API: login, searchable products,
persistent per-user carts, discount checkout, and administrator product management.

## Run locally

Requires Node.js 18.20.8 or newer and npm.

1. In `client`, run `npm ci` followed by `npm run build`.
2. In `server`, run `npm ci` followed by `node index.js`.
3. Open `http://localhost:3001`.

For frontend development, run `npm run dev` in `client` with the backend running.
Vite forwards `/api` requests to the backend. The backend also serves the built
frontend, so the single-origin production build works without the Vite server.

The login screen displays the two built-in **local demo accounts**, one customer
and one administrator. Use only fictional information. `WELCOME10` discounts the
subtotal by 10%; delivery is free. No payment information is collected.

## Structure

- `server/shop.js`: independent shop service factory, validation, password hashing,
  session handling, cart totals, stock checks, discounts, checkout and product CRUD.
- `server/index.js`: Express app factory, HTTP adapters, authentication middleware,
  cookie handling, same-origin write checks, static hosting and error responses.
- `client/src/App.jsx`: storefront, account, cart/checkout and admin views.
- `server/data/shop.json`: automatically created local persistence, ignored by Git.

`createShop(filename)` accepts a storage filename for isolated use later.
`createApp(shop)` accepts a service instance. Importing either module does not
start a listener.

## Starter test coverage

The repository includes a deliberately thin Vitest server suite and a Node-based
Playwright Chromium journey with Monocart browser coverage. From the repository
root, install dependencies with `npm ci`, install the app dependencies in `client`
and `server`, and install Chromium with `npm run test:e2e:install`.
Run `CI=true npm run coverage` to generate unit, browser, and merged LCOV and HTML
reports under `coverage/`. See [Starter Test Coverage](docs/coverage.md) for exact
commands, the measured baseline, and intentional gaps.

## Behavior and safeguards

- Passwords are salted and hashed with scrypt; the API never returns password hashes.
- Sessions use random tokens in HttpOnly, SameSite=Strict cookies, with eight-hour
  expiry. Production mode uses Secure cookies and therefore requires HTTPS.
- Product writes require an authenticated administrator, including in the service
  layer. Customer requests cannot grant themselves a role.
- Login failures are rate limited per client IP/email pair.
- The server validates input types, string lengths, integer prices, stock and
  quantities. Money is calculated in integer cents with rounded percentage discounts.
- Checkout recalculates totals from current products and validates current stock.
  Order creation, inventory deductions and cart clearing are persisted together.
- Product deletion removes the item from all carts. Existing order snapshots remain.
- Persistence uses an atomic file replacement. Failed writes do not replace the
  in-memory state. API errors have consistent JSON messages; unexpected details
  remain server-side.

## Demo limitations

This is a **single-process local demo**, not a production commerce deployment.
The demo accounts are public and must be replaced before public deployment.
Sessions and rate-limit state live in memory and reset on restart; products, carts
and orders persist. JSON storage is not suitable for multiple server processes.
There is no registration, password recovery, real payment, tax calculation,
shipping integration, or order-history interface. Order confirmation is shown
immediately after checkout. Use a transactional database, managed account
provisioning and payment provider before accepting real orders.

## Verification performed

- Frontend production build and lint; backend syntax checks.
- Hands-on Chromium flows for search, invalid and valid login, cart quantities,
  discount errors and successful discounted checkout, session restoration/logout.
- Administrator product creation, editing and deletion.
- API rejection of unauthorized admin writes, negative quantities, invalid products,
  malformed JSON and cross-origin writes.
- Mobile shop/admin overflow check at 390px and browser JavaScript error monitoring.

The checks in this section were earlier ad hoc verification commands. They are
not the scope of the intentionally limited committed starter suite described above.
