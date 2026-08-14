# Tenantly

Tenantly is an Expo SDK 56 property-management app backed exclusively by Supabase. The P0 build covers owner and tenant authentication, organization isolation, properties and rooms, residents, tenancy and occupancy history, invoices, payment proof and approval, receipts, complaints, notices, private documents, notifications, dashboards, and CSV invoice export.

## Configure

Copy .env.example to .env and supply EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.

Only the project URL and publishable key belong in the mobile app. Never add a service-role key to an EXPO_PUBLIC value. When the values are absent, the app shows a configuration-required screen; it never substitutes mock data.

Apply every file in `supabase/migrations` in timestamp order. Migrations are immutable: release-readiness changes are contained in the latest migration and must ship with the compatible client build. They create the P0 tables, property-scoped RLS policies, private Storage buckets, transactional functions, notification triggers, and financial/occupancy constraints.

## Run

    npm install
    npm start

For local Supabase, start Docker Desktop and then run:

    npm run supabase:start
    npm run supabase:reset
    npm run supabase:test
    npm run supabase:types

## Verify

    npm run typecheck
    npm run lint
    npm test
    npm run doctor
    npx expo export --platform web

Push registration activates after `EXPO_PUBLIC_EAS_PROJECT_ID` is configured. Sentry remains optional through `EXPO_PUBLIC_SENTRY_DSN`.

Before production, reset staging, run the pgTAP suite, smoke-test owner/manager/tenant flows, then deploy the database migration and compatible client together.
