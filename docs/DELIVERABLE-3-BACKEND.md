# Deliverable 3 back end: orders, customization, admin reports

Author: Amr Alhamwi

Covers three product backlog items assigned for Deliverable 3, plus the Observer
pattern that Section 8 of the Deliverable 2 report described but the code did not
yet implement.

- Checkout and Order Processing (UC12)
- Vehicle Customization Options (UC11)
- Administrator Reports (UC15, UC16)
- Observer pattern for order processing

Status: `npx tsc --noEmit` clean, 11 suites and 50 tests passing, and the whole
flow verified end to end against a real PostgreSQL database.

Scope note: this covers only my assigned work. No fixes to anyone else's code are
included, and no shared file has been overwritten. `app.ts` and `server.ts` need
two small hand edits, listed in `PASTE-INTO-SHARED-FILES.md`.

---

## 1. Note for the team, not a change I made

`src/services/aiClient.ts` reads `GEMINI_API_KEY` at module load and throws if it
is absent. Because `app.ts` imports the chatbot routes, anything that imports
`app` will not start without the key present, including every test suite.

It resolves locally because a `.env` containing the key gets loaded by
`dotenv.config()`, which runs inside `config/datasource` as a side effect of
`app.ts` importing `vehicleRoutes` before `chatbotRoutes`. That ordering is what
makes it work, which means reordering the imports in `app.ts` would break the app
and all the tests at once.

Not my code, so I have not touched it. Worth flagging to Yogesh, along with the
fact that anyone cloning the repo without a Gemini key cannot run `npm test`.

## 2. New endpoints

### Orders (`/api/orders`, all routes require authentication)

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/orders` | Checkout: convert the cart into an order and take payment |
| GET | `/api/orders` | Order history for the signed-in customer |
| GET | `/api/orders/:orderId` | One order confirmation |
| POST | `/api/orders/:orderId/payment` | Retry payment on a declined order |

Checkout request body:

```json
{
  "shipping": {
    "fullName": "Amr Alhamwi",
    "street": "1 Yonge Street",
    "city": "Toronto",
    "province": "Ontario",
    "country": "Canada",
    "postalCode": "M5E 1E5",
    "phone": "4165550123"
  },
  "payment": {
    "cardNumber": "4111111111111111",
    "cardHolderName": "Amr Alhamwi",
    "expiryMonth": 12,
    "expiryYear": 2028,
    "cvv": "123"
  },
  "notes": "Optional delivery instructions"
}
```

Responses: `201` on success, `400` for an empty cart or invalid details, `409`
when stock has moved since the item was added, `402` when the payment simulator
declines. The `402` body carries `details.orderId` so the front end can call the
retry endpoint without rebuilding the cart.

### Customization (`/api/vehicles/:vehicleId/customizations`, public)

Returns the options a specific vehicle offers, grouped by category, alongside the
vehicle's base price:

```json
{
  "success": true,
  "data": {
    "vehicleId": "...",
    "basePrice": 59990,
    "categories": [
      {
        "id": "...",
        "name": "Exterior Colour",
        "options": [
          { "id": "...", "name": "Midnight Black", "priceDelta": 900, "isAvailable": true },
          { "id": "...", "name": "Pearl White", "priceDelta": 1200, "isAvailable": true }
        ]
      }
    ]
  }
}
```

`POST /api/cart/items` now accepts an optional `customizationOptionIds` array:

```json
{ "vehicleId": "...", "quantity": 1, "customizationOptionIds": ["...", "..."] }
```

### Administrator reports (`/api/admin`, authentication plus admin role)

| Method | Path | Query |
| --- | --- | --- |
| GET | `/api/admin/reports/sales` | `groupBy=month\|brand\|vehicle`, `from`, `to` |
| GET | `/api/admin/reports/usage` | `from`, `to` |

Sales report shape:

```json
{
  "groupBy": "brand",
  "totals": {
    "orderCount": 2,
    "unitsSold": 3,
    "grossRevenue": 210372.10,
    "netRevenue": 186170.00,
    "taxCollected": 24202.10,
    "averageOrderValue": 105186.05
  },
  "rows": [{ "label": "Tesla", "orderCount": 2, "unitsSold": 3, "revenue": 186170 }]
}
```

Usage report returns totals, `eventsByType`, `mostViewedVehicles` and
`topSearchTerms`.

`403` is returned for an authenticated non-admin, not `404` and not `401`, because
the caller is known and signing in again would not help.

---

## 3. Design decisions worth putting in the report

### Observer pattern

`src/events/eventBus.ts` holds a small typed subject with `subscribe` and
`publish`. `src/events/orderEvents.ts` declares two channels, `orderCompleted`
and `orderPaymentDenied`. `src/events/orderSubscribers.ts` attaches three
observers, each belonging conceptually to a different service:

| Observer | Service | Reaction to `orderCompleted` |
| --- | --- | --- |
| `onOrderCompletedUpdateCatalog` | Catalog | Reduce stock, mark the vehicle sold at zero |
| `onOrderCompletedRecordAnalytics` | Analytics | Write a `purchase` usage event per vehicle |
| `onOrderCompletedClearCart` | Cart | Empty the cart that produced the order |

`registerOrderSubscribers()` runs once in `server.ts` at startup. The Ordering
service imports `orderEvents` and nothing else: it does not know the Catalog,
Analytics or Cart services exist. Adding a fourth reaction, a confirmation email
say, means adding a subscriber and editing no existing code, which is the low
coupling criterion made good rather than merely claimed.

Observers run through `Promise.allSettled`. By the time `orderCompleted` fires the
payment has been captured, so a failed analytics write is logged for
reconciliation rather than allowed to fail the sale.

### Payment simulator

`src/services/paymentService.ts` declines every third consecutive request, which
is the requirement TC-012 tests. The counter is global to the simulator, not per
order, because the requirement describes a flaky gateway rather than a per-order
rule. Swapping in a real provider replaces this one module, since the Ordering
service only depends on the `authorizePayment` signature.

**Demo consequence: roughly one checkout in three fails on purpose.** That is
correct behaviour, not a bug, and the retry endpoint exists so the failure can be
recovered on camera.

### Order written before payment

The order and its lines are persisted with `payment_status = pending` before
authorization is attempted. A decline then flips the row to `denied` and records a
`payment_attempts` entry, leaving an auditable trail instead of nothing.

### Card data

Only the last four digits reach the database. `TC-031` asserts the full number
never appears in what is passed to the repository.

### Stock decrement is concurrency safe

`decrementVehicleQuantity` issues a single `UPDATE ... WHERE quantity >= :n`
rather than reading then writing, so two customers buying the last unit at the
same moment cannot both succeed. The affected row count tells the caller which one
won.

### Stock re-checked at checkout

An item can sit in a cart for days. The quantity available when it was added
proves nothing at checkout, so availability is validated again before the order is
created.

### Customization snapshots

Option names, categories and prices are copied onto the cart line and then the
order line as JSON. Storing only IDs would let a later repricing or withdrawal
silently rewrite what a customer is shown they bought. Customization cost is held
per unit, so a line total is `(unitPrice + customizationTotal) * quantity`.

A quantity change preserves the configuration rather than discarding it.

### Two revenue figures in the sales report

`grossRevenue` is what customers were charged and includes tax. `netRevenue`
excludes it. The per-brand and per-month rows sum to `netRevenue`, because tax sits
on the order and cannot be attributed to an individual line when one order spans
several brands. Totals come from the `orders` table and units from `order_items`
in separate queries; combining them into one grouped query would multiply each
order total by its line count.

Verified against real data: `netRevenue` 186170 equals the breakdown row sum
exactly, and `taxCollected` 24202.10 equals gross minus net.

### Admin role read per request

`requireAdmin` reads the role from `profiles` on every request instead of trusting
a claim in the token, so revoking an administrator takes effect immediately rather
than whenever that session happens to expire.

### All aggregation in SQL

Every figure in both reports is computed by PostgreSQL, not by loading rows into
Node and summing them. Section 11 of the Deliverable 2 report already claims this,
so the implementation now matches.

---

## 4. Test cases

Numbered TC-031 onward. **Renumber if teammates have claimed these IDs**, since
each member is contributing test cases for this deliverable.

| ID | Suite | What it checks |
| --- | --- | --- |
| TC-031 | order | Checkout succeeds, tax applied, only last four card digits stored |
| TC-032 | order | Empty cart rejected with 400, no order written |
| TC-033 | order | Cart exceeding stock rejected with 409 |
| TC-034 | order | Third consecutive payment declined, order marked denied, attempt recorded |
| TC-035 | order | Approved order notifies catalog, analytics and cart observers |
| TC-036 | order | Declined payment leaves stock and cart untouched |
| TC-037 | order | Another customer's order returns 404 |
| TC-038 | customization | Options listed grouped by category with base price |
| TC-039 | customization | Configured vehicle priced into the cart line total |
| TC-040 | customization | Option not offered on that vehicle rejected with 400 |
| TC-041 | customization | Withdrawn option rejected with 409 |
| TC-042 | customization | Quantity change preserves the configuration |
| TC-043 | report | Sales report totals and average order value |
| TC-044 | report | Defaults to monthly grouping, date range passed through |
| TC-045 | report | Non-admin receives 403 and no query runs |
| TC-046 | report | Inverted date range rejected with 400 |
| TC-047 | report | Usage report event counts, top vehicles, top search terms |
| TC-048 | report | Breakdown rows reconcile to net revenue, not gross |
| TC-049 | report | Zero orders reports zero average rather than dividing by zero |

Run with `npm test`. Needs a `.env` containing `GEMINI_API_KEY`, per section 1.

---

## 5. Files

New:

```
src/entities/            Order, OrderItem, PaymentAttempt, Profile, UsageEvent,
                         CustomizationCategory, CustomizationOption,
                         VehicleCustomization
src/events/              eventBus, orderEvents, orderSubscribers
src/repositories/        orderRepository, reportRepository,
                         customizationRepository, profileRepository
src/services/            orderService, paymentService, reportService,
                         customizationService
src/controllers/         orderController, reportController,
                         customizationController
src/validators/          orderValidator, reportValidator,
                         customizationValidator
src/routes/              orderRoutes, reportRoutes, customizationRoutes
src/middleware/          adminMiddleware
src/types/               order, report, customization
tests/                   order.test.ts, customization.test.ts, report.test.ts
scripts/verify-d3.ts     end to end verification against a real database
```

Modified:

```
src/app.ts                       registered the three new routers
src/server.ts                    registerOrderSubscribers() at startup
src/entities/CartItem.ts         added the customization_options JSONB column
                                 that the schema had but the entity was missing
src/types/cart.ts                customization fields on the cart responses
src/validators/cartValidator.ts  optional customizationOptionIds
src/services/cartService.ts      price and persist customizations, carry them
                                 through a quantity change
database/seeders/seed-d3.sql     new standalone file: vehicle_customizations
                                 links, more options, richer usage events. Run
                                 after the existing seed.sql rather than editing
                                 it.
```

`customizationRoutes` is mounted on `/api/vehicles` alongside `vehicleRoutes` so
the configurator endpoint reads naturally without editing Yogesh's route file.

---

## 6. Verification against a real database

`scripts/verify-d3.ts` runs the whole flow through the real `AppDataSource`,
which the unit tests cannot do because they mock every repository. It catches
entity-to-schema mismatches such as a wrong column or enum name.

```bash
# needs a PostgreSQL instance with schema.sql and seed.sql applied
DIRECT_URL="postgresql://user@host:5432/db" npx ts-node --transpile-only scripts/verify-d3.ts
```

Confirmed working: the configurator returns eight options across four categories,
a configured vehicle prices correctly into the cart, checkout applies 13 percent
tax and stores only the last four card digits, stock drops by the quantity bought,
one purchase event is written, the cart empties, the third payment request is
declined with 402, and both reports aggregate correctly with net revenue
reconciling against the breakdown.

---

## 7. Outstanding

**Rotate the Supabase keys.** Page 40 of the Deliverable 2 report contains the
live `SUPABASE_SERVICE_ROLE_KEY` and the database password in plaintext. That key
bypasses row level security entirely. Rotate it in the Supabase dashboard and
replace that section with placeholders before submitting.

**Grant an admin role for the demo.** No profile is an administrator by default,
so the reports return 403 until one is promoted:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

**Add 402 to the status code list.** Section 11 of the report lists 200, 201, 400,
401, 404 and 500. Checkout also returns 402 Payment Required and 409 Conflict.

**`seed-d3.sql` is not idempotent.** The customization option inserts have no
unique constraint, so running it twice duplicates them. The
`vehicle_customizations` inserts are safe to repeat because of `ON CONFLICT DO
NOTHING`. Reset the database rather than re-seeding it.

**Front end still to build.** Deliverable 3 is graded mostly on client-side work,
and the demo table requires checkout, customization and reports to be usable in a
browser. The pages needed, in the style of the existing `public/*.html`, are a
checkout page, a configurator on the vehicle page, an order confirmation and
history page, and an admin reports dashboard.
