# Manual Test Case Catalog

[Download the CSV catalog](test-case-catalog.csv)

## Export conventions

The catalog contains 200 manual cases with stable IDs TC-001 through TC-200. Its columns are ID, Title, Steps, Expected Result, Module, Priority, and Linked Requirement. Steps use semicolons to separate actions within a spreadsheet cell. Priorities use High, Medium, and Low. Requirement links refer to IDs in [Client Requirements](requirements.md).

Use supplied demonstration accounts and fictional personal details. Cases that alter stock, orders, storage permissions, time, or request payloads should be performed in a disposable local environment. API steps describe manual requests from a QA HTTP client, not automated scripts. Start seeded-price examples with fresh data or restore the stated product values first. Storage inspection means inspecting the disposable shop data file; it does not imply an order-management screen exists.

## Deliberate catalog debt

This export is intentionally representative of an uneven long-lived catalog, rather than a fully curated baseline:

- Some steps use shorthand or vague review instructions.
- Some expected results and requirement links are blank.
- A few cases substantially overlap, including visitor browsing, tote searching, successful login, repeated additions, and saved-bag restoration.
- REQ-006 and REQ-025 have no linked cases. Rate limiting and the broader service/storage lifecycle therefore remain traceability gaps.
- Some rows combine more than one check rather than splitting each condition into its own case.

These are requested catalog characteristics, not CSV formatting defects. A linked case does not establish complete coverage of a requirement.

## Execution status

These are authored manual case definitions, not execution results. No case is marked passed, and no automated tests were added or run for this catalog. The existing thin automated suite and its measured coverage are described separately in [Starter Test Coverage](coverage.md).
