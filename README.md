# Tenantly

Tenantly is an Expo SDK 56 property-management app backed exclusively by Supabase. The P0 build covers owner and tenant authentication, organization isolation, properties and rooms, residents, tenancy and occupancy history, invoices, payment proof and approval, receipts, complaints, notices, private documents, notifications, dashboards, and CSV invoice export.

## Configure

Copy .env.example to .env and supply EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.

Only the project URL and publishable key belong in the mobile app. Never add a service-role key to an EXPO_PUBLIC value. When the values are absent, the app shows a configuration-required screen; it never substitutes mock data.

Apply both files in supabase/migrations to the target project. They create the P0 tables, RLS policies, private Storage buckets, transactional functions, notification triggers, and indexes.

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

Push registration activates after the app is associated with an EAS project ID. Sentry remains optional through EXPO_PUBLIC_SENTRY_DSN.
