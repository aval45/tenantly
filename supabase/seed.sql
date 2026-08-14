-- Deterministic local-only data. The placeholder auth user has no password;
-- create login-capable users through local Studio or the Auth API when needed.

insert into auth.users (id, email, raw_user_meta_data)
values (
  '11111111-1111-4111-8111-111111111111',
  'arjun@example.in',
  '{"full_name":"Arjun Sharma"}'::jsonb
);

insert into public.organizations (
  id,
  name,
  slug,
  created_by,
  idempotency_key
) values (
  '22222222-2222-4222-8222-222222222222',
  'Greenwood Living',
  'greenwood-living',
  '11111111-1111-4111-8111-111111111111',
  'seed-greenwood-owner'
);

insert into public.organization_memberships (
  id,
  organization_id,
  profile_id,
  role,
  status,
  joined_at
) values (
  '33333333-3333-4333-8333-333333333333',
  '22222222-2222-4222-8222-222222222222',
  '11111111-1111-4111-8111-111111111111',
  'owner',
  'active',
  now()
);

insert into public.properties (
  id,
  organization_id,
  name,
  property_type,
  address_line_1,
  city,
  state,
  postal_code
) values (
  '44444444-4444-4444-8444-444444444444',
  '22222222-2222-4222-8222-222222222222',
  'Maple House',
  'pg',
  '14, 12th Main Road',
  'Bengaluru',
  'Karnataka',
  '560038'
);

insert into public.rooms (
  id,
  organization_id,
  property_id,
  code,
  floor_label,
  room_type,
  default_rent_paise,
  default_deposit_paise,
  capacity
) values (
  '55555555-5555-4555-8555-555555555555',
  '22222222-2222-4222-8222-222222222222',
  '44444444-4444-4444-8444-444444444444',
  '204',
  '2',
  'shared',
  1250000,
  2500000,
  2
);

insert into public.beds (
  id,
  organization_id,
  room_id,
  code
) values (
  '66666666-6666-4666-8666-666666666666',
  '22222222-2222-4222-8222-222222222222',
  '55555555-5555-4555-8555-555555555555',
  'A'
);