# Starter Test Coverage

## Purpose and intentional gaps

This is a deliberately thin starter suite, not a release-readiness check.

- Two Vitest unit cases exercise successful customer sign-in and product listing/search using small in-memory store doubles.
- One Playwright journey browses the collection, searches for a tote, signs in as the demonstration customer, and adds the tote to the bag.
- There are no error, permission, boundary, administrator, checkout, discount, logout, or persistence cases.
- Assertions are intentionally limited. Executed lines do not imply every behavior on those lines was verified.

## Runtime and installation

The suite was run on Node.js **18.20.8** with npm **10.8.2**.

Pinned tooling: Vitest and its V8 coverage provider **2.1.9**, Playwright **1.51.1**, and monocart-coverage-reports **2.12.1**. The root lockfile records the dependency tree. The `test-exclude` override pins **7.0.1**, avoiding a newer transitive dependency that requires Node 20.

From the repository root:

```sh
npm ci
npm --prefix server ci
npm --prefix client ci
npm run test:e2e:install
CI=true npm run coverage
```

On a minimal Linux CI image, install Chromium's operating-system dependencies with `npx playwright install --with-deps chromium` instead of the browser-only install command. That step may require elevated privileges.

## Commands

| Command | Result |
| --- | --- |
| `npm test` or `npm run coverage` | Clean old results, run both suites, then generate the merged report. |
| `npm run test:unit` | Run server unit cases and replace unit coverage. |
| `npm run test:e2e` | Build the frontend with source maps and without minification, then run Chromium and generate browser coverage. |
| `npm run coverage:merge` | Merge existing unit and browser coverage JSON; fails if either input or an application source file is missing. |

The browser server runs on `127.0.0.1:3107`, uses a temporary data directory, and is started and stopped by Playwright. An already-running service is not reused, ensuring the journey starts with a fresh seeded bag. Local data under `server/data/` is not touched. The temporary directory is removed on normal shutdown.

The coverage build changes only generated `client/dist/` output, not the production build configuration. Run `npm --prefix client run build` afterward to restore a normal production build.

## Reports

| Scope | LCOV | HTML | Summary JSON |
| --- | --- | --- | --- |
| Server unit | `coverage/unit/lcov.info` | `coverage/unit/index.html` | `coverage/unit/coverage-summary.json` |
| Browser | `coverage/browser/lcov.info` | `coverage/browser/index.html` | `coverage/browser/coverage-summary.json` |
| Whole application | `coverage/merged/lcov.info` | `coverage/merged/index.html` | `coverage/merged/coverage-summary.json` |

Generated reports are ignored by Git and can be regenerated with the commands above. Each report set also includes `coverage-final.json` for merging or external tools.

Vitest collects server V8 coverage, including all nine server JavaScript modules even when not imported by a case. Playwright collects Chromium JavaScript coverage before navigation; Monocart converts it through the build source maps into original `client/src/` sources. React and other vendor dependencies, generated bundles, stylesheets, configuration, and test helpers are outside the application JavaScript denominator.

The merger combines the source-level Istanbul counters, not averages of percentages. It verifies that all server JavaScript modules and the client JavaScript source files are represented. Server requests made by the browser journey are not instrumented: the merged result combines server **unit** coverage with browser **client** coverage only.

## Measured starter baseline

A complete run on Node 18.20.8 passed **2 unit cases and 1 browser case**.

| Scope | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| Server unit | 23.90% | 40.00% | 40.00% | 23.90% |
| Browser | 56.00% | 52.84% | 37.09% | 71.62% |
| Whole application | **32.47%** | **50.67%** | **37.80%** | **32.37%** |

Merged totals were 152/468 statements, 75/148 branches, 31/82 functions, and 135/417 lines. The approximate 30–40% goal refers to overall application line/statement coverage, not every metric or every layer.

No artificial upper coverage threshold is enforced. Future cases should be allowed to increase coverage. Untouched modules remain visible at zero rather than being excluded to improve the headline number. V8 and source-map conversion can mark compact lines as executed even when an unexercised branch shares the line; use the branch and function details alongside line percentages.
