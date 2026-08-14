# Tenantly local Supabase

This directory is a complete local database foundation and does not require a hosted Supabase project.

## Prerequisite

Install and start Docker Desktop (or another Docker-compatible container runtime). The Supabase CLI runs PostgreSQL, Auth, Storage, Studio, and the test database in containers.

## First run

```powershell
npm run supabase:start
npm run supabase:reset
npm run supabase:test
npm run supabase:types
```

`supabase:start` prints the local API URL and publishable key. Copy those public values into a local `.env` file as `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Until both are present, the mobile application shows a configuration-required screen. There is intentionally no mock-data fallback.

Local Studio is available at `http://127.0.0.1:54323` after the stack starts. Seeded Auth rows are reference identities without passwords; create login-capable users through local Studio or the Auth API.

## Safety

- `npm run supabase:reset` destroys only the local Docker database and reapplies migrations and seed data.
- Do not run `supabase db reset --linked` against staging or production.
- Never place a service-role key in an `EXPO_PUBLIC_*` variable.
