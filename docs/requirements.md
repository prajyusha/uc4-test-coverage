# Common Ground Shop — Client Requirements

## Project brief

We need a small shop for a curated collection of everyday products. Visitors should be able to explore the collection, and signed-in customers should be able to save a bag and place a demonstration order. Administrators should be able to maintain the collection.

This document defines the scope supported by the current shop, expressed as requirements for the project. It is a local demonstration service, not a service for accepting real payments or fulfilling real orders. Only fictional customer information should be used.

## Browsing and product discovery

### REQ-001 — Browse without an account

The shop shall let visitors browse the collection without signing in. Each product shall show its name, description, category, product symbol, price in US dollars, and available stock. Sold-out products shall remain visible, but their add-to-bag button shall be unavailable.

### REQ-002 — Search the collection

Visitors shall be able to search product names, descriptions, and categories using partial words or phrases. Matching shall ignore letter case and spaces at the beginning and end of the search. Search text shall be limited to 100 characters. A blank search shall show the collection without a search restriction.

### REQ-003 — Filter by category and recover from no results

Visitors shall be able to select a category from those present in the collection, or select all categories. Category and search restrictions shall work together. The shop shall show the number of matching products. When nothing matches, it shall explain that no products were found and offer a way to clear both restrictions.

## Accounts and access

### REQ-004 — Use the supplied demonstration accounts

The shop shall provide a customer account and an administrator account for demonstration use, with sign-in guidance on the login page. Account creation, password recovery, account editing, and customer management are outside the project scope. Customers shall not be able to choose or change their own permission level.

### REQ-005 — Validate sign-in details

Sign-in shall require a validly formatted email address of no more than 254 characters and a password with at least 8 characters after surrounding spaces are removed. The submitted password shall not exceed 200 characters before those spaces are removed. Email matching shall ignore letter case and surrounding spaces. Invalid input shall receive a useful explanation; incorrect credentials shall receive a shared message that does not reveal whether the email belongs to an account.

### REQ-006 — Limit repeated failed sign-ins

The shop shall allow at most 10 failed credential checks for the same combination of visitor network address and email address during a 15-minute window. Further sign-in attempts for that combination shall be refused until the window ends, with a message asking the visitor to try again later. Successful sign-in shall clear that combination's failure count. These counts shall reset when the service restarts.

### REQ-007 — Maintain and end a signed-in session

A successful sign-in shall keep the account signed in across page reloads for up to eight hours from sign-in. Signing out shall end that session and remove account-specific information from the current screen without deleting the saved bag. Expired sessions and service restarts shall require another sign-in; an account-only action refused because the session is no longer valid shall send the visitor back to login.

### REQ-008 — Protect customer and administrator actions

Only signed-in accounts shall be able to read or change their own bag or place orders. Visitors selecting the bag or trying to add a product shall be directed to login; the interrupted addition need not be completed automatically afterward. Only administrators shall see product-management controls and be allowed to create, edit, or delete products. Requests made outside the visible screens shall obey the same access restrictions.

## Bags and pricing

### REQ-009 — Keep a separate saved bag for each account

Each account shall have its own saved bag, restored after a later sign-in. Adding an existing product shall increase its quantity rather than create a second line for that product. Bag contents shall remain separate between accounts and shall survive a service restart when the existing storage is retained.

### REQ-010 — Show and manage bag contents

The bag shall show each product's name, symbol, current unit price, current available stock, quantity, and line total. Customers shall be able to increase or decrease quantities, remove a product, and return to shopping. The navigation bag count shall represent the total number of units, rather than the number of different products. An empty bag shall offer a route back to the collection.

### REQ-011 — Enforce quantity and availability limits

A product's bag quantity shall be a whole number from 0 to 99 inclusive, where zero removes the product. Negative values, fractions, and quantities above 99 shall be rejected. A quantity change shall also be refused if it exceeds current stock or refers to a product that no longer exists, with an explanation. Adding to a bag shall not reserve or reduce stock.

### REQ-012 — Calculate totals from current prices

The shop shall calculate each line total from the product's current price multiplied by its quantity, then show the subtotal, any discount, and the final total in US dollars. Calculations shall use whole cents. A saved bag shall not lock a product's price; checkout shall use the prices current when the order is placed.

### REQ-013 — Apply the supported discount

Customers shall be able to apply WELCOME10 for 10% off the whole bag subtotal. Letter case and surrounding spaces shall not affect recognition. The discount shall be rounded to the nearest cent, and submitting a blank code shall remove it. Unknown codes and codes longer than 40 submitted characters shall be refused with an explanation. Only this one code is supported; there is no first-order restriction, usage limit, expiry date, or combination of discounts.

### REQ-014 — Show free delivery and exclude additional charges

Delivery shall be shown as free for every order. No tax, delivery surcharge, currency conversion, or payment fee shall be added. Delivery-zone checking, delivery scheduling, carrier integration, and shipment tracking are outside scope; an entered address shall not be treated as a verified or serviceable address.

## Ordering

### REQ-015 — Collect the required delivery details

Checkout shall require a full name of up to 100 characters and a delivery address of up to 500 characters, measured after surrounding spaces are removed. Blank or whitespace-only entries shall be refused. The current scope shall collect these as free-text details without address verification, a separate postal-code requirement, or a telephone-number requirement.

### REQ-016 — Recheck the order before accepting it

The shop shall refuse checkout for an empty bag, an invalid discount, a product no longer available, or insufficient current stock. It shall recalculate prices and discounts at submission rather than rely on amounts supplied by the customer. A rejected checkout shall not create an order, deduct inventory, or clear the saved bag.

### REQ-017 — Save a complete order together

When checkout succeeds, the shop shall assign a unique order reference and creation time, record the account and delivery details, and preserve a copy of the ordered products, quantities, prices, discount, and total. Saving the order, deducting the ordered stock, and clearing the customer's bag shall succeed together. A failed save shall not leave only part of these changes in place.

### REQ-018 — Confirm a demonstration order and state its limits

After successful checkout, the customer shall see a thank-you message, a shortened order reference, the final total, and a clear statement that no payment was taken. The collection and bag shall be refreshed. Confirmation is an immediate screen response, not an email or a lasting order-history page. Payment collection, order-history browsing, order administration, cancellation, refunds, returns, and fulfilment are outside scope.

## Product administration

### REQ-019 — Create and edit products

Administrators shall be able to create products and edit existing products through a product-management screen. Each product shall have a name, description, category, symbol, price, and stock quantity. The screen shall allow an administrator to select an existing product for editing and cancel editing without saving. Successful saves shall update the displayed collection.

### REQ-020 — Enforce product text limits

Product name, description, category, and symbol shall all be required and shall not be blank after surrounding spaces are removed. Maximum lengths shall be 100 characters for the name, 1,000 for the description, 40 for the category, and 8 text positions for the symbol. Some visual symbols occupy more than one text position. Categories shall be entered as text rather than selected from a separately managed category list.

### REQ-021 — Enforce price and stock limits

A product price shall be between $0.01 and $100,000.00 inclusive and shall be stored as whole cents. The administration screen shall accept no more than two decimal places. Stock shall be a whole number from 0 to 10,000 inclusive. Values outside these limits shall be refused. An administrator may reduce stock below quantities already saved in bags; those bags shall remain subject to the stock check at checkout.

### REQ-022 — Delete products safely within the agreed scope

Administrators shall be asked to confirm deletion before the screen submits it. Deleting a product shall remove it from the collection and every saved bag, while leaving earlier order records unchanged. Attempts to edit or delete a product that no longer exists shall receive a product-not-found explanation. Product image uploads, product variants, bulk import, and separate category administration are outside scope.

## Errors, safeguards, and operating boundaries

### REQ-023 — Give clear feedback without exposing internal details

The shop shall show loading, success, and error messages for supported actions and let the user dismiss displayed errors. Action controls shall be disabled while their shared operation is in progress. Invalid input, missing products, insufficient stock, and access refusal shall receive meaningful explanations. Unexpected service failures shall receive a general retry message without internal details. The shop shall not promise that retrying an order after an interrupted response cannot create another order.

### REQ-024 — Protect account access and reject unsuitable requests

Passwords shall be stored in a protected, non-readable form and shall never be returned as account information. Browser sign-in information shall be inaccessible to page scripts, restricted against cross-site use, and sent only over a secure connection in production mode. Changes carrying an origin from a different host shall be refused. Malformed requests and request bodies larger than 16 KB shall receive an error rather than be processed. These safeguards do not make the public demonstration accounts suitable for real trading.

### REQ-025 — Retain business data within a single-service boundary

Products, accounts, bags, and orders shall be retained in local file storage and survive ordinary restarts when that file remains available. A failed storage update shall leave the previously accepted in-memory business state unchanged. Sessions and sign-in failure counts shall not survive restarts. The agreed operating scope is one running shop process with local storage, not several coordinated servers. There is no stated total catalogue, customer, order, or bag-value limit beyond the individual field and quantity limits above; no production capacity, availability, backup, or recovery guarantee is included.

## Scope agreement

The requirements above describe the current demonstration scope, not a promise of production readiness. Accepting real customers or orders would require separately agreed account provisioning, payment handling, fulfilment, durable shared storage, and operational arrangements.
