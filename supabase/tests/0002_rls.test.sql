begin;

create extension if not exists pgtap with schema extensions;
select plan(15);

insert into auth.users (id, email, raw_user_meta_data) values
  ('a1111111-1111-4111-8111-111111111111', 'owner-a@tenantly.test', '{"full_name":"Owner A"}'),
  ('b2222222-2222-4222-8222-222222222222', 'manager-b@tenantly.test', '{"full_name":"Manager B"}'),
  ('c3333333-3333-4333-8333-333333333333', 'outsider-c@tenantly.test', '{"full_name":"Outsider C"}'),
  ('d4444444-4444-4444-8444-444444444444', 'staff-d@tenantly.test', '{"full_name":"Staff D"}'),
  ('e5555555-5555-4555-8555-555555555555', 'tenant-e@tenantly.test', '{"full_name":"Tenant E"}');

insert into public.organizations (id, name, slug, created_by) values
  ('aa111111-1111-4111-8111-111111111111', 'Organization A', 'organization-a', 'a1111111-1111-4111-8111-111111111111'),
  ('cc333333-3333-4333-8333-333333333333', 'Organization C', 'organization-c', 'c3333333-3333-4333-8333-333333333333');

insert into public.organization_memberships (
  id, organization_id, profile_id, role, status, joined_at
) values
  ('a0111111-1111-4111-8111-111111111111', 'aa111111-1111-4111-8111-111111111111', 'a1111111-1111-4111-8111-111111111111', 'owner', 'active', now()),
  ('b0222222-2222-4222-8222-222222222222', 'aa111111-1111-4111-8111-111111111111', 'b2222222-2222-4222-8222-222222222222', 'manager', 'active', now()),
  ('c0333333-3333-4333-8333-333333333333', 'cc333333-3333-4333-8333-333333333333', 'c3333333-3333-4333-8333-333333333333', 'owner', 'active', now()),
  ('d0444444-4444-4444-8444-444444444444', 'aa111111-1111-4111-8111-111111111111', 'd4444444-4444-4444-8444-444444444444', 'maintenance_staff', 'active', now()),
  ('e0555555-5555-4555-8555-555555555555', 'aa111111-1111-4111-8111-111111111111', 'e5555555-5555-4555-8555-555555555555', 'tenant', 'active', now());

insert into public.properties (
  id, organization_id, name, property_type, address_line_1, city, state, postal_code
) values
  ('a1111111-aaaa-4111-8111-111111111111', 'aa111111-1111-4111-8111-111111111111', 'Property One', 'pg', '1 Test Road', 'Bengaluru', 'Karnataka', '560001'),
  ('a2222222-aaaa-4222-8222-222222222222', 'aa111111-1111-4111-8111-111111111111', 'Property Two', 'hostel', '2 Test Road', 'Bengaluru', 'Karnataka', '560002'),
  ('c3333333-cccc-4333-8333-333333333333', 'cc333333-3333-4333-8333-333333333333', 'Property Three', 'house', '3 Test Road', 'Pune', 'Maharashtra', '411001');

insert into public.property_memberships (
  organization_id, organization_membership_id, property_id, role_override
) values (
  'aa111111-1111-4111-8111-111111111111',
  'b0222222-2222-4222-8222-222222222222',
  'a1111111-aaaa-4111-8111-111111111111',
  'manager'
), (
  'aa111111-1111-4111-8111-111111111111',
  'd0444444-4444-4444-8444-444444444444',
  'a1111111-aaaa-4111-8111-111111111111',
  'maintenance_staff'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1111111-1111-4111-8111-111111111111', true);

select results_eq(
  $$ select count(*)::bigint from public.organizations where id = 'aa111111-1111-4111-8111-111111111111' $$,
  $$ values (1::bigint) $$,
  'owner reads their organization'
);
select results_eq(
  $$ select count(*)::bigint from public.organizations where id = 'cc333333-3333-4333-8333-333333333333' $$,
  $$ values (0::bigint) $$,
  'owner cannot read another organization'
);
select results_eq(
  $$ select count(*)::bigint from public.properties where organization_id = 'aa111111-1111-4111-8111-111111111111' $$,
  $$ values (2::bigint) $$,
  'owner reads all organization properties'
);
select lives_ok(
  $$ insert into public.properties (organization_id, name, property_type, address_line_1, city, state, postal_code) values ('aa111111-1111-4111-8111-111111111111', 'Owner Added', 'pg', '4 Test Road', 'Bengaluru', 'Karnataka', '560003') $$,
  'owner can create a property'
);
select is(
  public.create_organization_with_owner('Idempotent Org', 'idempotent-org', 'request-key-1234'),
  public.create_organization_with_owner('Idempotent Org', 'idempotent-org', 'request-key-1234'),
  'organization creation is idempotent'
);

select set_config('request.jwt.claim.sub', 'b2222222-2222-4222-8222-222222222222', true);
select results_eq(
  $$ select count(*)::bigint from public.properties where organization_id = 'aa111111-1111-4111-8111-111111111111' $$,
  $$ values (1::bigint) $$,
  'manager reads only assigned properties'
);
select lives_ok(
  $$ insert into public.rooms (organization_id, property_id, code, room_type, capacity) values ('aa111111-1111-4111-8111-111111111111', 'a1111111-aaaa-4111-8111-111111111111', 'M-101', 'private', 1) $$,
  'manager can create a room'
);

select set_config('request.jwt.claim.sub', 'd4444444-4444-4444-8444-444444444444', true);
select results_eq(
  $$ select count(*)::bigint from public.properties where id = 'a1111111-aaaa-4111-8111-111111111111' $$,
  $$ values (1::bigint) $$,
  'staff reads an assigned property'
);
select results_eq(
  $$ select count(*)::bigint from public.properties where id = 'a2222222-aaaa-4222-8222-222222222222' $$,
  $$ values (0::bigint) $$,
  'staff cannot read an unassigned property'
);

select set_config('request.jwt.claim.sub', 'e5555555-5555-4555-8555-555555555555', true);
select results_eq(
  $$ select count(*)::bigint from public.properties where organization_id = 'aa111111-1111-4111-8111-111111111111' $$,
  $$ values (0::bigint) $$,
  'tenant property access waits for linked tenancy data'
);

select set_config('request.jwt.claim.sub', 'c3333333-3333-4333-8333-333333333333', true);
select results_eq(
  $$ select count(*)::bigint from public.organizations where id = 'aa111111-1111-4111-8111-111111111111' $$,
  $$ values (0::bigint) $$,
  'outsider cannot read another organization'
);
select results_eq(
  $$ select count(*)::bigint from public.properties where organization_id = 'aa111111-1111-4111-8111-111111111111' $$,
  $$ values (0::bigint) $$,
  'outsider cannot read another organization properties'
);
select throws_ok(
  $$ insert into public.properties (organization_id, name, property_type, address_line_1, city, state, postal_code) values ('aa111111-1111-4111-8111-111111111111', 'Forbidden Property', 'pg', '5 Test Road', 'Bengaluru', 'Karnataka', '560004') $$,
  '42501',
  'new row violates row-level security policy for table "properties"',
  'outsider cannot create a property in another organization'
);
select results_eq(
  $$ select count(*)::bigint from public.profiles where id = 'a1111111-1111-4111-8111-111111111111' $$,
  $$ values (0::bigint) $$,
  'outsider cannot read an unrelated profile'
);
select results_eq(
  $$ select count(*)::bigint from public.profiles where id = 'c3333333-3333-4333-8333-333333333333' $$,
  $$ values (1::bigint) $$,
  'user can read their own profile'
);

select * from finish();
rollback;
