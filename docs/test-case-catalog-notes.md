# Manual Test Case Catalog

[Download the CSV catalog](test-case-catalog.csv)

## Export conventions

The catalog contains 200 manual cases with stable IDs TC-001 through TC-200.

| Column | Meaning |
| --- | --- |
| ID | Stable identifier for the case. |
| Title | Short description of the behavior being checked. |
| Steps | Actions to perform, separated by semicolons within the spreadsheet cell. |
| Expected Result | Outcome to check after performing the steps. |
| Module | Functional area of the shop. |
| Priority | Relative priority: High, Medium, or Low. |
| Linked Requirement | Related ID in [Client Requirements](requirements.md). |

Use supplied demonstration accounts and fictional personal details. Cases that alter stock, orders, storage permissions, time, or request payloads should be performed in a disposable local environment. API steps describe manual requests from a QA HTTP client, not automated scripts. Start seeded-price examples with fresh data or restore the stated product values first. Storage inspection means inspecting the disposable shop data file; it does not imply an order-management screen exists.

## Execution status

These are authored manual case definitions, not execution results. No case is marked passed. Automated suite commands and measured coverage are described separately in [Test Coverage](coverage.md).
