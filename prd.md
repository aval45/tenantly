# Tenantly — Implementation-Ready Product Requirements

**Document purpose:** Source of truth for product decisions, database design, UI behavior, and AI-assisted scaffolding.

**Version baseline:** 24 July 2026

---

## 1. Product Definition

Tenantly is an India-first mobile application for small landlords, PG owners, hostel managers, tenants, and maintenance staff. It replaces spreadsheets, notebooks, and fragmented WhatsApp conversations with structured workflows for:

- properties, rooms, and beds;
- tenant onboarding and occupancy history;
- rent invoices and manual payment verification;
- receipts, documents, complaints, and notices;
- basic operational and financial reporting.

The initial product is a private property-management tool. It is not a public rental marketplace.

### Product principles

1. A first-time owner must be able to create a property, room, and tenant without training.
2. Money, occupancy, and approval history must remain auditable.
3. Owners and tenants must never see another organization's data.
4. iOS and Android share workflows and branding but use platform-native controls and visual behavior.
5. The initial release favors reliable manual payment tracking over payment-gateway complexity.
6. Optional modules must not complicate the MVP schema or navigation until they are scheduled.

### Defaults and assumptions

- Primary currency: INR.
- Money is stored as integer paise, never floating point.
- Default property timezone: `Asia/Kolkata`; store timestamps as UTC.
- English is the first interface language, but user-facing strings must be centralized for future localization.
- Owners may manage multiple properties.
- A user may have different roles in different organizations.
- An owner may create a resident before that resident creates an app account.
- Android 7+ and iOS 16.4+ follow the Expo SDK 56 platform baseline.
- Native Liquid Glass is an enhancement for iOS 26+, not a requirement for older devices.

---

## 2. Release Scope

Priority labels:

- **P0:** required for the first usable release;
- **P1:** next release after P0 is stable;
- **P2:** explicitly deferred.

### 2.1 P0 — First usable release

#### Accounts and organizations

- Email/password registration, verification, login, logout, and password reset.
- Owner creates an organization and its first property.
- Owner invites tenants by secure expiring link or code.
- Role-aware navigation and authorization.
- Profile editing and account status handling.

#### Property and occupancy

- Create, edit, list, and archive properties.
- Create, edit, list, and archive rooms.
- Optional bed records for shared rooms.
- Create a resident record before or after account invitation.
- Create a tenancy with start date, rent, deposit, and due-day terms.
- Assign, transfer, and vacate a resident with complete occupancy history.
- Show current vacancy from active assignments, not manually maintained counters.

#### Rent and payments

- Generate one monthly invoice or idempotently generate invoices in bulk.
- Invoice line items support rent, utilities, mess, discount, late fee, and adjustment, even when some categories are unused in P0.
- Owner records cash/manual payments.
- Tenant submits UPI or bank-transfer proof with amount, date, reference, and image.
- Owner approves or rejects submitted proof with a reason.
- Support partial payments and multiple payments against one invoice.
- Generate an immutable receipt after approved allocation.
- Show due, partially paid, paid, overdue, waived, and void states.

#### Complaints and notices

- Tenant creates a complaint with category, priority, description, and optional images.
- Owner updates or assigns the complaint.
- Tenant sees status history and can reopen a resolved complaint.
- Owner publishes notices to an organization, property, room, or resident.
- Notice feed supports pinned items and read state.

#### Documents and notifications

- Upload and privately view resident IDs, agreements, payment proof, and complaint images.
- In-app notifications with read/unread state and deep links.
- Basic push notifications for payment decisions, notices, and complaint updates.

#### Dashboards and reports

- Owner dashboard: occupancy, expected rent, collected rent, outstanding rent, pending approvals, and open complaints.
- Tenant dashboard: current amount due, recent payment state, active complaints, and pinned notices.
- CSV export for invoice and payment lists.

### 2.2 P1 — Operational expansion

- Maintenance-staff role and task workflow.
- Agreement expiry and renewal workflow.
- Move-out request and settlement workflow.
- Expense tracking and basic profit summary.
- Scheduled rent generation and overdue reminders.
- PDF owner reports.
- QR-based tenant onboarding and receipt verification.
- Persistent offline query cache and retry queue for non-financial drafts.
- Product analytics and feature flags.

### 2.3 P2 — Deferred modules

Do not scaffold routes, tables, services, or placeholder screens for these modules until they are promoted:

- Razorpay or other online payment gateway;
- WhatsApp/SMS messaging;
- subscription billing and plan enforcement;
- platform-admin web console;
- visitor and security desk management;
- electricity meter workflows;
- mess/food plan management;
- public property discovery, maps, or booking;
- advanced forecasting and analytics;
- automated legal agreement generation;
- ratings, marketplace features, or tenant social features.

The core invoice model already supports future utility and mess line items, so separate P2 tables are unnecessary during P0.

---

## 3. Roles and Authorization

### 3.1 Roles

| Role | Scope | Main capabilities |
|---|---|---|
| `platform_admin` | Platform | Support and platform operations; never granted through the mobile client |
| `owner` | Organization | Full organization, property, resident, finance, and member management |
| `manager` | Organization or property | Operational management without organization ownership or platform access |
| `tenant` | Own tenancy | Own invoices, payments, receipts, documents, complaints, and targeted notices |
| `maintenance_staff` | Assigned properties/tasks | Assigned complaints and task updates |

Organization roles belong to memberships, not to the global profile. A profile may have several memberships. `platform_admin` is a separate trusted platform entitlement and is never assigned by an organization.

### 3.2 Authorization rules

- Authorization is enforced in PostgreSQL Row Level Security, not only in navigation.
- Every business row contains `organization_id`.
- Owners can access rows within organizations they own.
- Managers access only the permissions and properties granted to their membership.
- Tenants access data through their linked resident/tenancy records.
- Staff access only assigned properties and tasks.
- Platform-admin actions run through a separate trusted server or future admin application.
- The Supabase service-role key is never included in the mobile application.
- Edge Functions must validate the authenticated user and organization membership before privileged work.

### 3.3 Route behavior

- Unauthenticated users can access only authentication and invitation routes.
- Authenticated users without a membership enter organization setup or invitation acceptance.
- Users with multiple memberships select an active organization.
- The active organization is a UI context, not an authorization mechanism.
- Unauthorized deep links show a safe error screen and do not expose record existence.

---

## 4. Core User Journeys

### 4.1 Owner setup

1. Register and verify email.
2. Create organization.
3. Add property.
4. Add room and optional beds.
5. Add resident and tenancy terms.
6. Assign room/bed.
7. Send tenant invitation.
8. Land on an owner dashboard containing real organization data.

**Acceptance criteria**

- The setup can be completed without leaving the app.
- Refreshing or reopening the app resumes incomplete setup safely.
- Duplicate taps cannot create duplicate organizations, tenancies, or assignments.

### 4.2 Monthly rent

1. Owner selects property and billing month.
2. System previews eligible active tenancies.
3. Owner confirms bulk generation.
4. Server creates missing invoices and skips existing invoices.
5. Tenants receive in-app notifications.

**Acceptance criteria**

- Repeating the operation is idempotent.
- Each invoice snapshots the applicable tenancy terms.
- The operation reports created, skipped, and failed counts.

### 4.3 Tenant payment proof

1. Tenant opens an unpaid invoice.
2. Tenant enters paid amount, payment date, payment method, transaction reference, and proof image.
3. Payment enters `submitted`.
4. Owner approves or rejects it.
5. Approval allocates the payment and may generate a receipt.

**Acceptance criteria**

- Tenant cannot approve or alter a submitted payment.
- Approval is a single server-side transaction.
- A payment cannot be allocated beyond its approved amount.
- Rejection requires a reason and notifies the tenant.
- Receipt totals are derived from immutable payment allocations.

### 4.4 Complaint resolution

1. Tenant creates a complaint.
2. Owner triages and optionally assigns it.
3. Owner or staff updates status with notes.
4. Tenant sees the event history.
5. Tenant may reopen after resolution.

**Acceptance criteria**

- Every status transition produces a timestamped event.
- Invalid transitions are rejected server-side.
- Images use private storage and signed access URLs.

### 4.5 Move or transfer

1. Owner chooses an active tenancy.
2. Owner selects a new room/bed or a move-out date.
3. Server closes the previous assignment and creates the next state atomically.

**Acceptance criteria**

- Two residents cannot hold the same exclusive bed for overlapping dates.
- Historical assignments remain queryable.
- Vacancy is derived from active assignments.

---

## 5. Navigation and Required Screens

### 5.1 Shared routes

- Launch/session restoration
- Login
- Registration
- Email verification
- Forgot/reset password
- Invitation acceptance
- Organization selector
- Notifications
- Profile and settings
- Not found / unauthorized / offline states

### 5.2 Owner navigation

Primary tabs:

1. **Home**
2. **Properties**
3. **Rent**
4. **More**

Required owner screens:

- Dashboard
- Property list and property form
- Property detail
- Room/bed list and form
- Resident list, detail, and form
- Tenancy and occupancy form
- Invoice list, detail, and bulk generation
- Payment approval queue and payment detail
- Receipt detail/share
- Complaint list and detail
- Notice list and editor
- Document viewer
- Basic reports/export

### 5.3 Tenant navigation

Primary tabs:

1. **Home**
2. **Payments**
3. **Requests**
4. **More**

Required tenant screens:

- Dashboard
- Current invoice and invoice history
- Submit payment proof
- Payment/receipt detail
- Complaint list, create, and detail
- Notice feed and notice detail
- Tenancy/agreement summary
- Own documents
- Profile/settings

### 5.4 Staff navigation

Staff routes are P1. Do not include them in the P0 navigation bundle until the role is implemented.

---

## 6. Platform UI and Design System

### 6.1 Design-system source of truth

The UI direction is generated with the project-local `ui-ux-pro-max` skill and persisted at `design-system/tenantly/MASTER.md`. Page-specific files under `design-system/tenantly/pages/` override the master rules.

Tenantly uses a custom cross-platform visual identity. Android and iOS share the same branded screens; platform differences apply to behavior and system chrome, not to the main content design.

- References to products such as Airbnb set only the quality bar for modernity, clarity, spacing, typography, and interaction polish.
- Do not copy another product's imagery strategy, screen layout, navigation, branding, or content model.
- Operational screens are information-led. Use property imagery only where the image itself is functional, such as a property detail or gallery—not as dashboard decoration.
- Style: light-first flat editorial design with clean lines, minimal icons, and almost no decorative shadow.
- Primary: `#18181B`; secondary: `#3F3F46`; accent: `#EC4899`; background: `#FAFAFA`; text: `#09090B`.
- Typography: Inter, loaded locally through `expo-font`, using weights 400, 500, 600, and 700.
- Spacing scale: 4, 8, 16, 24, 32, 48, and 64.
- Shape scale: 8 px controls, 12 px cards, and 16 px dialogs or featured media.
- Motion: purposeful color, opacity, and position transitions lasting 150–200 ms.
- Use one consistent Lucide icon set; do not mix platform icon families inside branded content.
- Status must be communicated by text and icon as well as color.
- Dark mode is supported, but light mode is the default product presentation.
- Avoid gradients, glass cards, oversized dashboard tiles, emoji icons, generic stock imagery, and ornamental animation.

### 6.2 iOS

- Use the shared HeroUI Native component system for branded content.
- Use native presentations for system alerts, menus, permissions, pickers, and share flows where platform behavior matters.
- Liquid Glass is reserved for optional navigation chrome: tab bars, toolbars, search, and compact floating actions.
- Do not use Liquid Glass as the background for ordinary cards, lists, invoices, or form sections.
- Use `expo-glass-effect` only when the API is available on iOS 26+.
- Use a standard material, blur, or opaque surface fallback on older iOS versions and when Reduce Transparency is enabled.
- Respect Reduce Motion, Increase Contrast, Dynamic Type, and safe areas.

### 6.3 Android

- Use the same branded HeroUI Native components and design tokens as iOS.
- Do not expose Material Design cards, tonal palettes, selected navigation pills, floating-action-button styling, or Dynamic Color in branded screens.
- Preserve Android behavior underneath the custom UI: edge-to-edge insets, predictive back, keyboard handling, touch feedback, haptics, accessibility, and gesture navigation.
- Bottom navigation uses the custom Tenantly design and Expo Router rather than a visibly Material navigation bar.
- Use solid surfaces; blur is not required for visual hierarchy.

### 6.4 Component policy

Build only reusable domain primitives that are not adequately provided by the platform:

- `Money`
- `StatusBadge`
- `MetricTile`
- `EntityRow`
- `EmptyState`
- `ErrorState`
- `LoadingSkeleton`
- `AttachmentPicker`
- `ConfirmAction`

Use HeroUI Native primitives directly when they already match the design system. Create a wrapper only when it adds a documented Tenantly variant, accessibility rule, or domain behavior. Prefer granular HeroUI imports to control bundle size.

### 6.5 Accessibility baseline

- Minimum interactive target: 44 pt on iOS and 48 dp on Android.
- Keep at least 8 px between adjacent touch targets.
- All controls require accessible names and state.
- Use the correct keyboard, content type, and autofill metadata for each input.
- Financial and destructive actions require explicit labels and confirmation.
- Swipe gestures cannot be the only way to perform an action.
- Layouts must support large text without clipped values.
- Test screen-reader order, color contrast, reduced transparency, and reduced motion.

---

## 7. Technical Architecture

### 7.1 Mobile stack

| Layer | Decision |
|---|---|
| Runtime | React Native 0.85 through Expo SDK 56 |
| Language | TypeScript with `strict: true` |
| Architecture | React Native New Architecture and Hermes |
| Routing | Expo Router version installed by SDK 56 |
| Component library | HeroUI Native with granular imports |
| Styling | Uniwind with Tailwind CSS v4 and semantic tokens in `global.css` |
| Typography | Inter through `expo-font` |
| Icons | `lucide-react-native` |
| Platform controls | Expo/native APIs only where platform behavior is essential |
| iOS material | `expo-glass-effect` with `expo-blur`/solid fallback |
| Server state | TanStack Query |
| Local UI state | Zustand, limited to session-derived UI context and preferences |
| Forms | React Hook Form and Zod |
| Animation | Reanimated 4 and React Native Worklets |
| Images | `expo-image` |
| Secrets/session storage | `expo-secure-store` |
| Structured local storage | `expo-sqlite` |
| Notifications | Expo Notifications |
| Monitoring | Sentry |
| Build/release | EAS Build, Submit, and Update |

Use `npx expo install` for Expo-compatible package versions. Do not copy hard-coded transitive versions into the PRD.

Wrap the route tree in `GestureHandlerRootView` and `HeroUINativeProvider`. Install HeroUI peer dependencies at Expo-compatible versions and use granular component imports consistently.

### 7.2 UI dependency policy

- HeroUI Native is the default visual component layer; do not mix it with Gluestack, React Native Paper, Tamagui, or another full UI kit.
- Uniwind is the styling engine; do not add NativeWind alongside it.
- `@expo/ui` is not the main screen framework. Add an individual platform control only when HeroUI cannot meet a documented native-behavior requirement.
- MMKV must not store authentication tokens.
- `@gorhom/bottom-sheet` is unnecessary unless HeroUI/native presentation APIs fail a documented requirement.
- Lottie is not a baseline dependency.
- A charting library is added only when a P1 chart is implemented.
- Do not add a payment SDK during P0.

### 7.3 Backend stack

- Supabase Auth
- PostgreSQL with migrations and Row Level Security
- Supabase Storage with private buckets
- Supabase Edge Functions for privileged integrations and PDF generation
- PostgreSQL functions for transactional domain operations
- Supabase Cron for scheduled P1 jobs
- Supabase Realtime only for targeted, low-volume updates

Standard CRUD may use the Supabase client when RLS fully protects it. Multi-row financial or occupancy operations must use database functions or authenticated Edge Functions.

### 7.4 State ownership

- Supabase Auth owns the authenticated session.
- TanStack Query owns remote records and cache invalidation.
- React Hook Form owns in-progress forms.
- Zustand owns only active organization/property selection and non-sensitive preferences.
- SQLite may persist query cache and non-financial drafts.
- Never mirror the same server entity into Zustand.

### 7.5 Realtime and offline behavior

- Use Realtime for payment decisions, complaint events, and new notices only.
- Subscribe to organization- or user-scoped channels and remove subscriptions on logout/context change.
- Do not subscribe entire dashboards to raw table changes.
- Reconnect by invalidating the relevant queries.
- P0 requires graceful read-cache behavior, not full offline sync.
- Payment approval, invoice generation, assignment, and receipt creation are online-only.
- Draft complaints or payment forms may be preserved locally, but submission must be idempotent.

---

## 8. Data Model

### 8.1 Conventions

- Primary keys: UUID.
- `profiles.id` equals `auth.users.id`.
- All business tables include `organization_id`, `created_at`, and `updated_at` where applicable.
- Store timestamps as `timestamptz`.
- Store local calendar dates as `date`.
- Store money as `bigint` paise with a three-letter currency code.
- Use database enums or check constraints for stable statuses.
- Use foreign keys and unique constraints; do not depend on client validation.
- Store Storage object paths, not permanent public URLs.
- Financial and audit records are immutable or reversed through explicit compensating records.
- Archive operational records instead of deleting them when history matters.

Canonical state values:

- Membership: `invited`, `active`, `suspended`, `revoked`
- Tenancy: `draft`, `active`, `notice_period`, `ended`, `cancelled`
- Invoice: `draft`, `issued`, `partially_paid`, `paid`, `overdue`, `waived`, `void`
- Payment: `submitted`, `approved`, `rejected`, `partially_refunded`, `refunded`
- Complaint: `open`, `assigned`, `in_progress`, `resolved`, `closed`, `reopened`, `rejected`

### 8.2 Identity and access

#### `profiles`

- `id` → `auth.users.id`
- full name, phone, avatar path, account status

#### `organizations`

- name, slug, default currency, default timezone
- created by profile
- status

#### `organization_memberships`

- organization, profile, role
- status and invitation metadata
- unique organization/profile membership

Do not store an ordinary application role on `profiles`.

#### `property_memberships`

- organization membership and property
- optional property-scoped role override
- unique membership/property pair

Use this table to restrict managers and maintenance staff without embedding authorization lists in JSON.

#### `invitations`

- organization, optional resident, intended role
- normalized email or phone
- hashed single-use token, expiry, accepted timestamp, invited-by profile

Never store a raw invitation token.

### 8.3 Properties and occupancy

#### `properties`

- organization, name, type, address fields, timezone
- rules, description, status, archived timestamp

#### `property_media`

- property, storage path, sort order, media type

#### `rooms`

- organization, property, code/number, floor, type
- default rent/deposit in paise, capacity, status
- unique property/room code

#### `beds`

- organization, room, code, status
- unique room/bed code

#### `residents`

- organization
- optional linked profile
- legal/display name, contact fields, emergency contact
- status

This record exists independently of app registration.

#### `tenancies`

- organization, resident, property
- start/end dates, due day, rent/deposit snapshot, status
- invitation/link state where applicable

#### `occupancy_assignments`

- organization, tenancy, room, optional bed
- start/end timestamps
- reason and created-by profile

Assignments preserve transfer history. Prevent overlapping active assignments for exclusive beds.

### 8.4 Billing and payments

#### `invoices`

- organization, tenancy, property
- billing period start/end, due date, currency
- subtotal, adjustments, total, paid and balance amounts
- status and immutable invoice number
- unique tenancy/billing-period key

#### `invoice_items`

- invoice, type, description, quantity, unit amount, total amount
- metadata for future utility/mess sources

#### `payments`

- organization, payer resident, amount, currency
- method, paid date, transaction reference
- proof storage path, status, submitted-by
- decision reason, decided-by, decided-at
- optional idempotency key

#### `payment_allocations`

- payment, invoice, allocated amount
- unique payment/invoice pair

#### `receipts`

- organization, payment, immutable receipt number
- PDF storage path, generated timestamp

Approved totals and invoice balances are updated transactionally from allocations. Client code must not directly edit aggregate money fields.

### 8.5 Operations and communication

#### `complaints`

- organization, tenancy/resident, property, optional room
- category, priority, title, description, status
- optional assigned membership and closed timestamp

#### `complaint_events`

- complaint, actor, event type, previous/new status, note, timestamp

#### `attachments`

- organization, owner entity type/id, storage path, media type, uploaded-by

Use one attachment model for complaint images and other multi-file entities. Sensitive identity documents remain in `documents`.

#### `notices`

- organization, author, title, body, category
- pinned and expiry fields

#### `notice_targets`

- notice plus target type/id

#### `notice_reads`

- notice, profile, read timestamp

#### `documents`

- organization, resident/profile, document type, storage path
- verification status, expiry, uploaded-by

#### `notifications`

- organization, recipient profile
- type, title, body, deep-link path, read timestamp

#### `push_devices`

- profile, Expo push token, platform, app version
- last seen, enabled, unique token

#### `audit_logs`

- organization, actor, action, entity type/id
- safe before/after metadata, request ID, timestamp

Do not store secrets or full sensitive document contents in audit metadata.

### 8.6 Required database operations

Create versioned SQL functions or trusted Edge Functions for:

- organization creation with owner membership;
- invitation acceptance;
- tenancy creation and occupancy assignment;
- room/bed transfer and move-out;
- bulk monthly invoice generation;
- payment submission;
- payment approval/rejection and allocation;
- receipt-number creation and PDF job dispatch;
- complaint status transition;
- dashboard aggregates.

Each mutation accepts or derives an idempotency key where duplicate mobile requests are possible.

### 8.7 Index baseline

Index:

- every foreign key used by RLS or common filters;
- organization plus status/date on invoices, payments, complaints, and tenancies;
- property plus active occupancy;
- recipient plus unread state on notifications;
- normalized resident phone/search fields where supported.

Profile queries with `EXPLAIN ANALYZE` before adding speculative indexes.

---

## 9. Security and Privacy

### 9.1 Mobile secrets

Allowed in the mobile bundle:

- Supabase project URL;
- Supabase publishable key;
- Sentry DSN;
- non-secret feature configuration.

Server-only:

- Supabase service-role key;
- payment provider secrets;
- WhatsApp/SMS credentials;
- PDF signing secrets;
- webhook signing secrets.

Use `expo-secure-store` for refresh/session material. Do not treat environment files as secret when their values are compiled into the app.

### 9.2 RLS

- Enable RLS on every exposed table.
- Policies derive organization access from memberships.
- Tenant policies join through resident and tenancy ownership.
- Storage policies mirror the owning business row.
- Service-role usage is restricted to server functions.
- Include positive and negative pgTAP tests for every role and CRUD operation.

### 9.3 Files and PII

- Buckets are private.
- Access uses short-lived signed URLs.
- Validate file extension, MIME type, size, and ownership server-side.
- Strip unneeded image metadata where practical.
- Define retention behavior for rejected payment proof and archived resident documents.
- Never expose sequential paths that reveal other organizations.

### 9.4 Financial controls

- Payment decisions require an authenticated owner/authorized manager.
- Approval and rejection are audited.
- Receipt numbers are server-generated and unique.
- Approved payments are reversed/refunded through explicit records, not deletion.
- Webhook-based providers added later must verify signatures and idempotency.

---

## 10. API, Validation, and Error Behavior

- Generate TypeScript database types from Supabase schema.
- Zod schemas validate user input and reusable domain commands.
- Database constraints remain authoritative.
- Normalize server errors into typed application errors.
- User-facing errors must say what happened and offer a recovery action.
- Log request IDs, not sensitive payloads.
- Paginate potentially unbounded lists.
- Use query-key factories including organization and filter scope.
- Mutations invalidate only affected queries.
- Optimistic updates are allowed for reversible low-risk actions such as notification read state, not financial approvals.

### File limits for P0

- Images: JPEG, PNG, or HEIC; maximum 10 MB each.
- Documents: PDF, JPEG, or PNG; maximum 15 MB each.
- Compress display images before upload while retaining readable payment proof.

---

## 11. Project Structure

Use feature-oriented organization. Avoid separate global `services`, `queries`, `hooks`, and `types` folders for every domain.

```text
tenantly/
  src/
    app/
      _layout.tsx
      (auth)/
      (owner)/
      (tenant)/
      invitation/
      notifications.tsx
      settings.tsx
    features/
      organizations/
      properties/
      residents/
      tenancies/
      billing/
      payments/
      complaints/
      notices/
      documents/
      notifications/
    shared/
      api/
      auth/
      components/
      errors/
      forms/
      storage/
      theme/
      utils/
    stores/
    test/
  supabase/
    migrations/
    functions/
    tests/
    seed.sql
  assets/
    fonts/
      Inter-Variable.ttf
  design-system/
    tenantly/
      MASTER.md
      pages/
        mobile-app.md
  app.config.ts
  eas.json
  package.json
  tsconfig.json
```

Each feature may contain:

```text
feature/
  api.ts
  components/
  hooks.ts
  keys.ts
  schemas.ts
  types.ts
```

Create files only when they contain real behavior. Do not generate empty repositories, generic managers, or one-line wrappers during scaffolding.

---

## 12. Environment and Release Configuration

### Environments

- Local development
- Staging
- Production

Use separate Supabase projects for staging and production. Local development uses Supabase CLI.

### Mobile environment variables

```text
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
EXPO_PUBLIC_SENTRY_DSN
EXPO_PUBLIC_APP_ENV
```

Server secrets are configured through Supabase secrets/Vault, never `EXPO_PUBLIC_*`.

### EAS

- Development, preview, and production build profiles.
- Fingerprint-based runtime version policy for EAS Update.
- Staging and production update channels.
- OTA updates may change compatible JavaScript/assets only; native dependency changes require a new binary.
- Production releases require tested database migrations and rollback/forward-fix notes.

---

## 13. Testing and Quality Gates

### Required test layers

- Unit tests for money, dates, status transitions, and validation.
- React Native Testing Library tests for important forms and states.
- pgTAP tests for schema constraints, database functions, and RLS.
- Deno tests for Edge Functions.
- Maestro end-to-end tests for owner setup, rent generation, payment proof/approval, and complaint flow.
- Manual accessibility checks on one recent iPhone and one recent Android device.

### Required CI checks

- TypeScript typecheck
- ESLint
- Formatting check
- Unit/component tests
- Supabase migration reset
- Database and RLS tests
- Edge Function tests
- Expo Doctor

### Definition of done

A feature is complete only when:

- permissions are enforced server-side;
- loading, empty, error, offline, and success states exist;
- inputs and database constraints are validated;
- analytics/audit events required by the domain are emitted;
- relevant tests pass;
- accessibility labels and large-text behavior are verified;
- no secret or sensitive payload is logged;
- the feature works in both light and dark mode on iOS and Android.

---

## 14. Scaffold Order

An AI or developer scaffolding the repository should proceed in this order:

1. Initialize Expo SDK 56 with Expo Router, TypeScript strict mode, New Architecture, and environment validation.
2. Configure HeroUI Native, Uniwind, `global.css`, Inter, Lucide, and the persisted Tenantly design tokens; then add safe-area handling, error boundary, Query client, Sentry, and test tooling.
3. Create Supabase local configuration, migrations, generated types, seed data, and RLS tests.
4. Implement SecureStore-backed authentication and protected route groups.
5. Implement organizations and memberships.
6. Implement properties, rooms, beds, residents, tenancies, and assignments.
7. Implement invoices, payment submission, approval/allocation, and receipts.
8. Implement complaints, notices, documents, and notifications.
9. Implement dashboards from server-side aggregate functions.
10. Add E2E tests, staging configuration, and release profiles.

Do not scaffold P1 or P2 modules while completing these steps.

---

## 15. P0 Completion Criteria

P0 is ready for pilot use when:

- an owner can complete setup and invite a tenant;
- occupancy history survives room transfers and move-out;
- bulk invoice generation is idempotent;
- tenant payment proof can be approved or rejected safely;
- partial payments and receipt totals reconcile;
- owner and tenant data are isolated by tested RLS policies;
- complaints and targeted notices work end to end;
- sensitive files are private;
- the core journeys pass on supported iOS and Android devices;
- crash monitoring and a production release path are configured.

