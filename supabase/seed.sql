-- ============================================================================
-- TENANTLY COMPREHENSIVE DATABASE WIPE & DEMO DATASET SEED
-- ============================================================================

begin;

set session_replication_role = 'replica';

-- 1. PURGE EXISTING DATA (CASCADE)
truncate table
  public.audit_logs,
  public.notifications,
  public.push_devices,
  public.documents,
  public.attachments,
  public.complaint_events,
  public.complaints,
  public.receipts,
  public.payment_allocations,
  public.payments,
  public.invoice_items,
  public.invoices,
  public.occupancy_assignments,
  public.tenancies,
  public.invitation_properties,
  public.invitations,
  public.residents,
  public.property_media,
  public.expenses,
  public.notice_reads,
  public.notice_targets,
  public.notices,
  public.beds,
  public.rooms,
  public.property_memberships,
  public.properties,
  public.organization_memberships,
  public.organizations,
  public.profiles
cascade;

delete from auth.identities;
delete from auth.users;

-- Restore the default auth instance row (GoTrue needs this to function)
insert into auth.instances (id, uuid, raw_base_config, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', null, now(), now())
on conflict (id) do nothing;

-- ============================================================================
-- 2. AUTH USERS & IDENTITIES & PROFILES
-- Standard password for all demo accounts: 'password123'
-- NOTE: GoTrue requires token/change columns to be '' not NULL, otherwise
--       signInWithPassword returns 500 "Database error querying schema".
-- ============================================================================

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new,
  email_change_token_current,
  reauthentication_token,
  phone_change,
  phone_change_token
) values
  -- Owner 1 (Vikram Malhotra - Greenwood Living & Urban Nest)
  (
    '11111111-1111-4111-8111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'owner@tenantly.demo',
    extensions.crypt('password123', extensions.gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Vikram Malhotra"}'::jsonb,
    false,
    now() - interval '90 days',
    now(),
    '', '', '', '', '', '', '', ''
  ),
  -- User Personal Email (Avalbir Singh - Co-Owner)
  (
    '11111111-1111-4111-8111-111111111112',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'avalbirsingh45@gmail.com',
    extensions.crypt('password123', extensions.gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Avalbir Singh"}'::jsonb,
    false,
    now() - interval '90 days',
    now(),
    '', '', '', '', '', '', '', ''
  ),
  -- Property Manager (Rajesh Kumar)
  (
    '22222222-1111-4111-8111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'manager@tenantly.demo',
    extensions.crypt('password123', extensions.gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Rajesh Kumar"}'::jsonb,
    false,
    now() - interval '80 days',
    now(),
    '', '', '', '', '', '', '', ''
  ),
  -- Maintenance Staff (Suresh Babu)
  (
    '33333333-1111-4111-8111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'staff@tenantly.demo',
    extensions.crypt('password123', extensions.gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Suresh Babu"}'::jsonb,
    false,
    now() - interval '75 days',
    now(),
    '', '', '', '', '', '', '', ''
  ),
  -- Tenant 1 (Rohan Das - Active Tenant, Maple House)
  (
    '44444444-1111-4111-8111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'tenant@tenantly.demo',
    extensions.crypt('password123', extensions.gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Rohan Das"}'::jsonb,
    false,
    now() - interval '60 days',
    now(),
    '', '', '', '', '', '', '', ''
  ),
  -- Tenant 2 (Sneha Patel - Private Room, Maple House)
  (
    '55555555-1111-4111-8111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'tenant2@tenantly.demo',
    extensions.crypt('password123', extensions.gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Sneha Patel"}'::jsonb,
    false,
    now() - interval '50 days',
    now(),
    '', '', '', '', '', '', '', ''
  ),
  -- Tenant 3 (Amitabh Sen - Notice Period, Palm Grove)
  (
    '66666666-1111-4111-8111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'tenant3@tenantly.demo',
    extensions.crypt('password123', extensions.gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Amitabh Sen"}'::jsonb,
    false,
    now() - interval '180 days',
    now(),
    '', '', '', '', '', '', '', ''
  ),
  -- Manager 2 (Priya Sharma - Urban Nest)
  (
    '77777777-1111-4111-8111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'manager2@tenantly.demo',
    extensions.crypt('password123', extensions.gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Priya Sharma"}'::jsonb,
    false,
    now() - interval '40 days',
    now(),
    '', '', '', '', '', '', '', ''
  ),
  -- Staff 2 (Ramesh Verma - Urban Nest)
  (
    '88888888-1111-4111-8111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'staff2@tenantly.demo',
    extensions.crypt('password123', extensions.gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Ramesh Verma"}'::jsonb,
    false,
    now() - interval '40 days',
    now(),
    '', '', '', '', '', '', '', ''
  ),
  -- Tenant 4 (Meera Reddy - Urban Nest)
  (
    '99999999-1111-4111-8111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'tenant4@tenantly.demo',
    extensions.crypt('password123', extensions.gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Meera Reddy"}'::jsonb,
    false,
    now() - interval '30 days',
    now(),
    '', '', '', '', '', '', '', ''
  );

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  id,
  id,
  jsonb_build_object('sub', id::text, 'email', email),
  'email',
  id::text,
  now(),
  created_at,
  updated_at
from auth.users;

insert into public.profiles (
  id,
  full_name,
  phone_e164,
  account_status,
  created_at,
  updated_at
) values
  ('11111111-1111-4111-8111-111111111111', 'Vikram Malhotra', '+919876543210', 'active', now() - interval '90 days', now()),
  ('11111111-1111-4111-8111-111111111112', 'Avalbir Singh', '+919876543211', 'active', now() - interval '90 days', now()),
  ('22222222-1111-4111-8111-111111111111', 'Rajesh Kumar', '+919876543212', 'active', now() - interval '80 days', now()),
  ('33333333-1111-4111-8111-111111111111', 'Suresh Babu', '+919876543213', 'active', now() - interval '75 days', now()),
  ('44444444-1111-4111-8111-111111111111', 'Rohan Das', '+919876543220', 'active', now() - interval '60 days', now()),
  ('55555555-1111-4111-8111-111111111111', 'Sneha Patel', '+919876543221', 'active', now() - interval '50 days', now()),
  ('66666666-1111-4111-8111-111111111111', 'Amitabh Sen', '+919876543222', 'active', now() - interval '180 days', now()),
  ('77777777-1111-4111-8111-111111111111', 'Priya Sharma', '+919876543214', 'active', now() - interval '40 days', now()),
  ('88888888-1111-4111-8111-111111111111', 'Ramesh Verma', '+919876543215', 'active', now() - interval '40 days', now()),
  ('99999999-1111-4111-8111-111111111111', 'Meera Reddy', '+919876543223', 'active', now() - interval '30 days', now())
on conflict (id) do update set
  full_name = excluded.full_name,
  phone_e164 = excluded.phone_e164,
  account_status = excluded.account_status;

-- ============================================================================
-- 3. ORGANIZATIONS
-- ============================================================================

insert into public.organizations (
  id,
  name,
  slug,
  default_currency,
  default_timezone,
  created_by,
  status,
  idempotency_key,
  created_at
) values
  (
    '22222222-2222-4222-8222-222222222222',
    'Greenwood Living',
    'greenwood-living',
    'INR',
    'Asia/Kolkata',
    '11111111-1111-4111-8111-111111111111',
    'active',
    'org-seed-greenwood',
    now() - interval '90 days'
  ),
  (
    '33333333-2222-4222-8222-222222222222',
    'Urban Nest Co-Living',
    'urban-nest',
    'INR',
    'Asia/Kolkata',
    '11111111-1111-4111-8111-111111111111',
    'active',
    'org-seed-urbannest',
    now() - interval '60 days'
  );

-- ============================================================================
-- 4. ORGANIZATION MEMBERSHIPS
-- ============================================================================

insert into public.organization_memberships (
  id,
  organization_id,
  profile_id,
  role,
  status,
  joined_at,
  created_at
) values
  -- Greenwood Living Memberships
  (
    '33333333-3333-4333-8333-000000000001',
    '22222222-2222-4222-8222-222222222222',
    '11111111-1111-4111-8111-111111111111',
    'owner',
    'active',
    now() - interval '90 days',
    now() - interval '90 days'
  ),
  (
    '33333333-3333-4333-8333-000000000002',
    '22222222-2222-4222-8222-222222222222',
    '11111111-1111-4111-8111-111111111112',
    'owner',
    'active',
    now() - interval '90 days',
    now() - interval '90 days'
  ),
  (
    '33333333-3333-4333-8333-000000000003',
    '22222222-2222-4222-8222-222222222222',
    '22222222-1111-4111-8111-111111111111',
    'manager',
    'active',
    now() - interval '80 days',
    now() - interval '80 days'
  ),
  (
    '33333333-3333-4333-8333-000000000004',
    '22222222-2222-4222-8222-222222222222',
    '33333333-1111-4111-8111-111111111111',
    'maintenance_staff',
    'active',
    now() - interval '75 days',
    now() - interval '75 days'
  ),
  (
    '33333333-3333-4333-8333-000000000005',
    '22222222-2222-4222-8222-222222222222',
    '44444444-1111-4111-8111-111111111111',
    'tenant',
    'active',
    now() - interval '60 days',
    now() - interval '60 days'
  ),
  (
    '33333333-3333-4333-8333-000000000006',
    '22222222-2222-4222-8222-222222222222',
    '55555555-1111-4111-8111-111111111111',
    'tenant',
    'active',
    now() - interval '50 days',
    now() - interval '50 days'
  ),
  (
    '33333333-3333-4333-8333-000000000007',
    '22222222-2222-4222-8222-222222222222',
    '66666666-1111-4111-8111-111111111111',
    'tenant',
    'active',
    now() - interval '180 days',
    now() - interval '180 days'
  ),

  -- Urban Nest Memberships
  (
    '33333333-3333-4333-8333-000000000010',
    '33333333-2222-4222-8222-222222222222',
    '11111111-1111-4111-8111-111111111111',
    'owner',
    'active',
    now() - interval '60 days',
    now() - interval '60 days'
  ),
  (
    '33333333-3333-4333-8333-000000000011',
    '33333333-2222-4222-8222-222222222222',
    '77777777-1111-4111-8111-111111111111',
    'manager',
    'active',
    now() - interval '40 days',
    now() - interval '40 days'
  ),
  (
    '33333333-3333-4333-8333-000000000012',
    '33333333-2222-4222-8222-222222222222',
    '88888888-1111-4111-8111-111111111111',
    'maintenance_staff',
    'active',
    now() - interval '40 days',
    now() - interval '40 days'
  ),
  (
    '33333333-3333-4333-8333-000000000013',
    '33333333-2222-4222-8222-222222222222',
    '99999999-1111-4111-8111-111111111111',
    'tenant',
    'active',
    now() - interval '30 days',
    now() - interval '30 days'
  );

-- ============================================================================
-- 5. PROPERTIES
-- ============================================================================

insert into public.properties (
  id,
  organization_id,
  name,
  property_type,
  address_line_1,
  address_line_2,
  city,
  state,
  postal_code,
  country_code,
  timezone,
  rules,
  description,
  status,
  created_at
) values
  (
    '44444444-4444-4444-8444-444444444444',
    '22222222-2222-4222-8222-222222222222',
    'Maple House PG',
    'pg',
    '14, 12th Main Road',
    'Indiranagar',
    'Bengaluru',
    'Karnataka',
    '560038',
    'IN',
    'Asia/Kolkata',
    '1. No loud music after 10 PM.
2. Overnight guests require prior notice.
3. Keep common dining area clean.',
    'Premium PG accommodation near Indiranagar Metro Station with high-speed WiFi, daily housekeeping, and 24/7 power backup.',
    'active',
    now() - interval '90 days'
  ),
  (
    '44444444-4444-4444-8444-444444444445',
    '22222222-2222-4222-8222-222222222222',
    'Palm Grove Villa',
    'house',
    '88, 4th Cross Road',
    'Koramangala 4th Block',
    'Bengaluru',
    'Karnataka',
    '560034',
    'IN',
    'Asia/Kolkata',
    '1. Quiet hours from 11 PM to 6 AM.
2. Dedicated parking slots only.
3. Non-smoking premises.',
    'Spacious 4BHK co-living villa in prime Koramangala featuring private workspaces, private lawn, and modern amenities.',
    'active',
    now() - interval '85 days'
  ),
  (
    '44444444-4444-4444-8444-444444444446',
    '33333333-2222-4222-8222-222222222222',
    'Urban Nest Prime',
    'apartment',
    '42, Sector 2, 27th Main',
    'HSR Layout',
    'Bengaluru',
    'Karnataka',
    '560102',
    'IN',
    'Asia/Kolkata',
    '1. Pet-friendly with registration.
2. Visitor parking in basement B2.',
    'Contemporary serviced studio apartments curated for working professionals in HSR Layout.',
    'active',
    now() - interval '60 days'
  );

-- ============================================================================
-- 6. PROPERTY MEMBERSHIPS (Scoped access for managers and staff)
-- ============================================================================

insert into public.property_memberships (
  id,
  organization_id,
  organization_membership_id,
  property_id,
  role_override
) values
  -- Rajesh Kumar (Manager -> Maple House & Palm Grove)
  (
    '44444444-3333-4333-8333-000000000001',
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-000000000003',
    '44444444-4444-4444-8444-444444444444',
    'manager'
  ),
  (
    '44444444-3333-4333-8333-000000000002',
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-000000000003',
    '44444444-4444-4444-8444-444444444445',
    'manager'
  ),

  -- Suresh Babu (Maintenance Staff -> Maple House & Palm Grove)
  (
    '44444444-3333-4333-8333-000000000003',
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-000000000004',
    '44444444-4444-4444-8444-444444444444',
    'maintenance_staff'
  ),
  (
    '44444444-3333-4333-8333-000000000004',
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-000000000004',
    '44444444-4444-4444-8444-444444444445',
    'maintenance_staff'
  ),

  -- Priya Sharma (Manager -> Urban Nest Prime)
  (
    '44444444-3333-4333-8333-000000000010',
    '33333333-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-000000000011',
    '44444444-4444-4444-8444-444444444446',
    'manager'
  ),

  -- Ramesh Verma (Staff -> Urban Nest Prime)
  (
    '44444444-3333-4333-8333-000000000012',
    '33333333-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-000000000012',
    '44444444-4444-4444-8444-444444444446',
    'maintenance_staff'
  );

-- ============================================================================
-- 7. ROOMS
-- ============================================================================

insert into public.rooms (
  id,
  organization_id,
  property_id,
  code,
  floor_label,
  room_type,
  default_rent_paise,
  default_deposit_paise,
  capacity,
  status
) values
  -- Maple House PG (Indiranagar)
  (
    '55555555-5555-4555-8555-000000000101',
    '22222222-2222-4222-8222-222222222222',
    '44444444-4444-4444-8444-444444444444',
    '101',
    '1st Floor',
    'shared',
    1250000, -- ₹12,500
    2500000, -- ₹25,000
    2,
    'active'
  ),
  (
    '55555555-5555-4555-8555-000000000102',
    '22222222-2222-4222-8222-222222222222',
    '44444444-4444-4444-8444-444444444444',
    '102',
    '1st Floor',
    'private',
    2200000, -- ₹22,000
    4000000, -- ₹40,000
    1,
    'active'
  ),
  (
    '55555555-5555-4555-8555-000000000201',
    '22222222-2222-4222-8222-222222222222',
    '44444444-4444-4444-8444-444444444444',
    '201',
    '2nd Floor',
    'shared',
    1000000, -- ₹10,000
    2000000, -- ₹20,000
    2,
    'active'
  ),
  (
    '55555555-5555-4555-8555-000000000202',
    '22222222-2222-4222-8222-222222222222',
    '44444444-4444-4444-8444-444444444444',
    '202',
    '2nd Floor',
    'studio',
    2800000, -- ₹28,000
    5000000, -- ₹50,000
    1,
    'active'
  ),

  -- Palm Grove Villa (Koramangala)
  (
    '55555555-5555-4555-8555-000000001101',
    '22222222-2222-4222-8222-222222222222',
    '44444444-4444-4444-8444-444444444445',
    'Suite 1',
    'Ground Floor',
    'private',
    3000000, -- ₹30,000
    6000000, -- ₹60,000
    1,
    'active'
  ),
  (
    '55555555-5555-4555-8555-000000001201',
    '22222222-2222-4222-8222-222222222222',
    '44444444-4444-4444-8444-444444444445',
    'Room 201',
    '1st Floor',
    'shared',
    1600000, -- ₹16,000
    3000000, -- ₹30,000
    2,
    'active'
  ),

  -- Urban Nest Prime (HSR Layout)
  (
    '55555555-5555-4555-8555-000000002301',
    '33333333-2222-4222-8222-222222222222',
    '44444444-4444-4444-8444-444444444446',
    'Studio 301',
    '3rd Floor',
    'studio',
    3500000, -- ₹35,000
    7000000, -- ₹70,000
    1,
    'active'
  ),
  (
    '55555555-5555-4555-8555-000000002302',
    '33333333-2222-4222-8222-222222222222',
    '44444444-4444-4444-8444-444444444446',
    'Studio 302',
    '3rd Floor',
    'studio',
    3500000, -- ₹35,000
    7000000, -- ₹70,000
    1,
    'active'
  );

-- ============================================================================
-- 8. BEDS
-- ============================================================================

insert into public.beds (
  id,
  organization_id,
  room_id,
  code,
  status
) values
  -- Maple House Room 101 (2 Beds)
  ('66666666-6666-4666-8666-000000000101', '22222222-2222-4222-8222-222222222222', '55555555-5555-4555-8555-000000000101', 'Bed A', 'active'),
  ('66666666-6666-4666-8666-000000000102', '22222222-2222-4222-8222-222222222222', '55555555-5555-4555-8555-000000000101', 'Bed B', 'active'),

  -- Maple House Room 102 (Private 1 Bed)
  ('66666666-6666-4666-8666-000000000103', '22222222-2222-4222-8222-222222222222', '55555555-5555-4555-8555-000000000102', 'Bed A', 'active'),

  -- Maple House Room 201 (2 Beds)
  ('66666666-6666-4666-8666-000000000201', '22222222-2222-4222-8222-222222222222', '55555555-5555-4555-8555-000000000201', 'Bed A', 'active'),
  ('66666666-6666-4666-8666-000000000202', '22222222-2222-4222-8222-222222222222', '55555555-5555-4555-8555-000000000201', 'Bed B', 'active'),

  -- Maple House Room 202 (Studio 1 Bed)
  ('66666666-6666-4666-8666-000000000203', '22222222-2222-4222-8222-222222222222', '55555555-5555-4555-8555-000000000202', 'Bed A', 'active'),

  -- Palm Grove Suite 1 (1 Bed)
  ('66666666-6666-4666-8666-000000001101', '22222222-2222-4222-8222-222222222222', '55555555-5555-4555-8555-000000001101', 'Bed A', 'active'),

  -- Palm Grove Room 201 (2 Beds)
  ('66666666-6666-4666-8666-000000001201', '22222222-2222-4222-8222-222222222222', '55555555-5555-4555-8555-000000001201', 'Bed A', 'active'),
  ('66666666-6666-4666-8666-000000001202', '22222222-2222-4222-8222-222222222222', '55555555-5555-4555-8555-000000001201', 'Bed B', 'active'),

  -- Urban Nest Studio 301 & 302
  ('66666666-6666-4666-8666-000000002301', '33333333-2222-4222-8222-222222222222', '55555555-5555-4555-8555-000000002301', 'Bed A', 'active'),
  ('66666666-6666-4666-8666-000000002302', '33333333-2222-4222-8222-222222222222', '55555555-5555-4555-8555-000000002302', 'Bed A', 'active');

-- ============================================================================
-- 9. RESIDENTS
-- ============================================================================

insert into public.residents (
  id,
  organization_id,
  profile_id,
  full_name,
  email_normalized,
  phone_e164,
  emergency_name,
  emergency_phone_e164,
  status
) values
  -- Rohan Das (Primary Active Tenant)
  (
    '77777777-7777-4777-8777-000000000001',
    '22222222-2222-4222-8222-222222222222',
    '44444444-1111-4111-8111-111111111111',
    'Rohan Das',
    'tenant@tenantly.demo',
    '+919876543220',
    'Sunita Das (Mother)',
    '+919876543990',
    'active'
  ),
  -- Sneha Patel (Active Tenant - Private Room)
  (
    '77777777-7777-4777-8777-000000000002',
    '22222222-2222-4222-8222-222222222222',
    '55555555-1111-4111-8111-111111111111',
    'Sneha Patel',
    'tenant2@tenantly.demo',
    '+919876543221',
    'Mahesh Patel (Father)',
    '+919876543991',
    'active'
  ),
  -- Amitabh Sen (Notice Period Tenant)
  (
    '77777777-7777-4777-8777-000000000003',
    '22222222-2222-4222-8222-222222222222',
    '66666666-1111-4111-8111-111111111111',
    'Amitabh Sen',
    'tenant3@tenantly.demo',
    '+919876543222',
    'Debabrata Sen (Brother)',
    '+919876543992',
    'active'
  ),
  -- Rahul Varma (Offline / Invited Resident)
  (
    '77777777-7777-4777-8777-000000000004',
    '22222222-2222-4222-8222-222222222222',
    null,
    'Rahul Varma',
    'rahul.varma@example.in',
    '+919876543230',
    'Alok Varma (Father)',
    '+919876543993',
    'active'
  ),
  -- Karan Mehta (Offline Resident)
  (
    '77777777-7777-4777-8777-000000000005',
    '22222222-2222-4222-8222-222222222222',
    null,
    'Karan Mehta',
    'karan.mehta@example.in',
    '+919876543231',
    'Renu Mehta (Mother)',
    '+919876543994',
    'active'
  ),
  -- Meera Reddy (Urban Nest Tenant)
  (
    '77777777-7777-4777-8777-000000000006',
    '33333333-2222-4222-8222-222222222222',
    '99999999-1111-4111-8111-111111111111',
    'Meera Reddy',
    'tenant4@tenantly.demo',
    '+919876543223',
    'Venkat Reddy (Father)',
    '+919876543995',
    'active'
  ),
  -- Vikramaditya Rao (Past / Ended Resident)
  (
    '77777777-7777-4777-8777-000000000007',
    '22222222-2222-4222-8222-222222222222',
    null,
    'Vikramaditya Rao',
    'vikramaditya@example.in',
    '+919876543232',
    'P. K. Rao (Father)',
    '+919876543996',
    'inactive'
  );

-- ============================================================================
-- 10. TENANCIES
-- ============================================================================

insert into public.tenancies (
  id,
  organization_id,
  resident_id,
  property_id,
  start_date,
  end_date,
  due_day,
  rent_paise,
  deposit_paise,
  currency,
  status,
  idempotency_key
) values
  -- Tenancy 1: Rohan Das (Maple House)
  (
    '88888888-8888-4888-8888-000000000001',
    '22222222-2222-4222-8222-222222222222',
    '77777777-7777-4777-8777-000000000001',
    '44444444-4444-4444-8444-444444444444',
    '2026-01-01',
    null,
    5,
    1250000, -- ₹12,500
    2500000, -- ₹25,000
    'INR',
    'active',
    'tenancy-seed-rohan'
  ),
  -- Tenancy 2: Sneha Patel (Maple House)
  (
    '88888888-8888-4888-8888-000000000002',
    '22222222-2222-4222-8222-222222222222',
    '77777777-7777-4777-8777-000000000002',
    '44444444-4444-4444-8444-444444444444',
    '2026-02-01',
    null,
    1,
    2200000, -- ₹22,000
    4000000, -- ₹40,000
    'INR',
    'active',
    'tenancy-seed-sneha'
  ),
  -- Tenancy 3: Amitabh Sen (Palm Grove - Notice Period)
  (
    '88888888-8888-4888-8888-000000000003',
    '22222222-2222-4222-8222-222222222222',
    '77777777-7777-4777-8777-000000000003',
    '44444444-4444-4444-8444-444444444445',
    '2025-08-01',
    '2026-08-31',
    5,
    1600000, -- ₹16,000
    3000000, -- ₹30,000
    'INR',
    'notice_period',
    'tenancy-seed-amitabh'
  ),
  -- Tenancy 4: Rahul Varma (Maple House)
  (
    '88888888-8888-4888-8888-000000000004',
    '22222222-2222-4222-8222-222222222222',
    '77777777-7777-4777-8777-000000000004',
    '44444444-4444-4444-8444-444444444444',
    '2026-06-01',
    null,
    5,
    1000000, -- ₹10,000
    2000000, -- ₹20,000
    'INR',
    'active',
    'tenancy-seed-rahul'
  ),
  -- Tenancy 5: Karan Mehta (Palm Grove)
  (
    '88888888-8888-4888-8888-000000000005',
    '22222222-2222-4222-8222-222222222222',
    '77777777-7777-4777-8777-000000000005',
    '44444444-4444-4444-8444-444444444445',
    '2026-03-01',
    null,
    5,
    1600000, -- ₹16,000
    3000000, -- ₹30,000
    'INR',
    'active',
    'tenancy-seed-karan'
  ),
  -- Tenancy 6: Meera Reddy (Urban Nest)
  (
    '88888888-8888-4888-8888-000000000006',
    '33333333-2222-4222-8222-222222222222',
    '77777777-7777-4777-8777-000000000006',
    '44444444-4444-4444-8444-444444444446',
    '2026-01-15',
    null,
    1,
    3500000, -- ₹35,000
    7000000, -- ₹70,000
    'INR',
    'active',
    'tenancy-seed-meera'
  ),
  -- Tenancy 7: Vikramaditya Rao (Past Ended Tenancy)
  (
    '88888888-8888-4888-8888-000000000007',
    '22222222-2222-4222-8222-222222222222',
    '77777777-7777-4777-8777-000000000007',
    '44444444-4444-4444-8444-444444444444',
    '2025-06-01',
    '2025-12-31',
    5,
    1200000,
    2400000,
    'INR',
    'ended',
    'tenancy-seed-vikramaditya'
  );

-- ============================================================================
-- 11. OCCUPANCY ASSIGNMENTS
-- ============================================================================

insert into public.occupancy_assignments (
  id,
  organization_id,
  tenancy_id,
  room_id,
  bed_id,
  starts_at,
  ends_at,
  reason,
  created_by
) values
  -- Active Assignments
  (
    '99999999-9999-4999-8999-000000000001',
    '22222222-2222-4222-8222-222222222222',
    '88888888-8888-4888-8888-000000000001',
    '55555555-5555-4555-8555-000000000101', -- Maple House Room 101
    '66666666-6666-4666-8666-000000000101', -- Bed A
    '2026-01-01 00:00:00+05:30',
    null,
    'Initial move-in',
    '11111111-1111-4111-8111-111111111111'
  ),
  (
    '99999999-9999-4999-8999-000000000002',
    '22222222-2222-4222-8222-222222222222',
    '88888888-8888-4888-8888-000000000002',
    '55555555-5555-4555-8555-000000000102', -- Maple House Room 102
    '66666666-6666-4666-8666-000000000103', -- Bed A
    '2026-02-01 00:00:00+05:30',
    null,
    'Initial move-in',
    '11111111-1111-4111-8111-111111111111'
  ),
  (
    '99999999-9999-4999-8999-000000000003',
    '22222222-2222-4222-8222-222222222222',
    '88888888-8888-4888-8888-000000000003',
    '55555555-5555-4555-8555-000000001201', -- Palm Grove Room 201
    '66666666-6666-4666-8666-000000001201', -- Bed A
    '2025-08-01 00:00:00+05:30',
    null,
    'Initial move-in',
    '11111111-1111-4111-8111-111111111111'
  ),
  (
    '99999999-9999-4999-8999-000000000004',
    '22222222-2222-4222-8222-222222222222',
    '88888888-8888-4888-8888-000000000004',
    '55555555-5555-4555-8555-000000000201', -- Maple House Room 201
    '66666666-6666-4666-8666-000000000201', -- Bed A
    '2026-06-01 00:00:00+05:30',
    null,
    'Initial move-in',
    '11111111-1111-4111-8111-111111111111'
  ),
  (
    '99999999-9999-4999-8999-000000000005',
    '22222222-2222-4222-8222-222222222222',
    '88888888-8888-4888-8888-000000000005',
    '55555555-5555-4555-8555-000000001201', -- Palm Grove Room 201
    '66666666-6666-4666-8666-000000001202', -- Bed B
    '2026-03-01 00:00:00+05:30',
    null,
    'Initial move-in',
    '11111111-1111-4111-8111-111111111111'
  ),
  (
    '99999999-9999-4999-8999-000000000006',
    '33333333-2222-4222-8222-222222222222',
    '88888888-8888-4888-8888-000000000006',
    '55555555-5555-4555-8555-000000002301', -- Urban Nest Studio 301
    '66666666-6666-4666-8666-000000002301', -- Bed A
    '2026-01-15 00:00:00+05:30',
    null,
    'Initial move-in',
    '11111111-1111-4111-8111-111111111111'
  ),

  -- Historical Ended Assignment (Preserves Occupancy Timeline)
  (
    '99999999-9999-4999-8999-000000000007',
    '22222222-2222-4222-8222-222222222222',
    '88888888-8888-4888-8888-000000000007',
    '55555555-5555-4555-8555-000000000101',
    '66666666-6666-4666-8666-000000000101',
    '2025-06-01 00:00:00+05:30',
    '2025-12-31 23:59:59+05:30',
    'Relocated to Hyderabad for new employment',
    '11111111-1111-4111-8111-111111111111'
  );

-- ============================================================================
-- 12. INVOICES & INVOICE ITEMS
-- ============================================================================

-- Invoices
insert into public.invoices (
  id,
  organization_id,
  tenancy_id,
  property_id,
  period_start,
  period_end,
  due_date,
  currency,
  subtotal_paise,
  adjustment_paise,
  total_paise,
  paid_paise,
  status,
  invoice_number,
  created_at
) values
  -- Rohan Das (June 2026 - Paid)
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-000000000101',
    '22222222-2222-4222-8222-222222222222',
    '88888888-8888-4888-8888-000000000001',
    '44444444-4444-4444-8444-444444444444',
    '2026-06-01',
    '2026-06-30',
    '2026-06-05',
    'INR',
    1600000,
    0,
    1600000,
    1600000,
    'paid',
    'INV-202606-001',
    '2026-06-01 09:00:00+05:30'
  ),
  -- Rohan Das (July 2026 - Paid)
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-000000000102',
    '22222222-2222-4222-8222-222222222222',
    '88888888-8888-4888-8888-000000000001',
    '44444444-4444-4444-8444-444444444444',
    '2026-07-01',
    '2026-07-31',
    '2026-07-05',
    'INR',
    1370000,
    0,
    1370000,
    1370000,
    'paid',
    'INV-202607-001',
    '2026-07-01 09:00:00+05:30'
  ),
  -- Rohan Das (August 2026 - Partially Paid)
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-000000000103',
    '22222222-2222-4222-8222-222222222222',
    '88888888-8888-4888-8888-000000000001',
    '44444444-4444-4444-8444-444444444444',
    '2026-08-01',
    '2026-08-31',
    '2026-08-05',
    'INR',
    1400000,
    0,
    1400000,
    700000,
    'partially_paid',
    'INV-202608-001',
    '2026-08-01 09:00:00+05:30'
  ),

  -- Sneha Patel (July 2026 - Paid)
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-000000000201',
    '22222222-2222-4222-8222-222222222222',
    '88888888-8888-4888-8888-000000000002',
    '44444444-4444-4444-8444-444444444444',
    '2026-07-01',
    '2026-07-31',
    '2026-07-01',
    'INR',
    2200000,
    0,
    2200000,
    2200000,
    'paid',
    'INV-202607-002',
    '2026-07-01 09:00:00+05:30'
  ),
  -- Sneha Patel (August 2026 - Issued with Pending Proof)
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-000000000202',
    '22222222-2222-4222-8222-222222222222',
    '88888888-8888-4888-8888-000000000002',
    '44444444-4444-4444-8444-444444444444',
    '2026-08-01',
    '2026-08-31',
    '2026-08-01',
    'INR',
    2250000,
    0,
    2250000,
    0,
    'issued',
    'INV-202608-002',
    '2026-08-01 09:00:00+05:30'
  ),

  -- Amitabh Sen (August 2026 - Overdue)
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-000000000301',
    '22222222-2222-4222-8222-222222222222',
    '88888888-8888-4888-8888-000000000003',
    '44444444-4444-4444-8444-444444444445',
    '2026-08-01',
    '2026-08-31',
    '2026-08-05',
    'INR',
    1600000,
    0,
    1600000,
    0,
    'overdue',
    'INV-202608-003',
    '2026-08-01 09:00:00+05:30'
  ),

  -- Meera Reddy (August 2026 - Paid)
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-000000000401',
    '33333333-2222-4222-8222-222222222222',
    '88888888-8888-4888-8888-000000000006',
    '44444444-4444-4444-8444-444444444446',
    '2026-08-01',
    '2026-08-31',
    '2026-08-01',
    'INR',
    3800000,
    -150000,
    3650000,
    3650000,
    'paid',
    'INV-202608-004',
    '2026-08-01 09:00:00+05:30'
  );

-- Invoice Items
insert into public.invoice_items (
  id,
  organization_id,
  invoice_id,
  item_type,
  description,
  quantity,
  unit_amount_paise,
  total_amount_paise
) values
  -- Rohan June 2026 Items
  ('bbbbbbbb-bbbb-4bbb-8bbb-000000000101', '22222222-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-000000000101', 'rent', 'Monthly Room Rent (Shared Bed A)', 1, 1250000, 1250000),
  ('bbbbbbbb-bbbb-4bbb-8bbb-000000000102', '22222222-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-000000000101', 'mess', 'Monthly Food & Mess Plan', 1, 350000, 350000),

  -- Rohan July 2026 Items
  ('bbbbbbbb-bbbb-4bbb-8bbb-000000000103', '22222222-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-000000000102', 'rent', 'Monthly Room Rent (Shared Bed A)', 1, 1250000, 1250000),
  ('bbbbbbbb-bbbb-4bbb-8bbb-000000000104', '22222222-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-000000000102', 'utilities', 'AC Power Sub-meter Consumption', 1, 120000, 120000),

  -- Rohan August 2026 Items
  ('bbbbbbbb-bbbb-4bbb-8bbb-000000000105', '22222222-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-000000000103', 'rent', 'Monthly Room Rent (Shared Bed A)', 1, 1250000, 1250000),
  ('bbbbbbbb-bbbb-4bbb-8bbb-000000000106', '22222222-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-000000000103', 'utilities', 'AC Power Sub-meter (August Units)', 1, 150000, 150000),

  -- Sneha July 2026 Items
  ('bbbbbbbb-bbbb-4bbb-8bbb-000000000201', '22222222-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-000000000201', 'rent', 'Private Room Rent (Room 102)', 1, 2200000, 2200000),

  -- Sneha August 2026 Items
  ('bbbbbbbb-bbbb-4bbb-8bbb-000000000202', '22222222-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-000000000202', 'rent', 'Private Room Rent (Room 102)', 1, 2200000, 2200000),
  ('bbbbbbbb-bbbb-4bbb-8bbb-000000000203', '22222222-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-000000000202', 'late_fee', 'Late Payment Fee', 1, 50000, 50000),

  -- Amitabh August 2026 Items
  ('bbbbbbbb-bbbb-4bbb-8bbb-000000000301', '22222222-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-000000000301', 'rent', 'Monthly Villa Bed Rent (Room 201 Bed A)', 1, 1600000, 1600000),

  -- Meera August 2026 Items
  ('bbbbbbbb-bbbb-4bbb-8bbb-000000000401', '33333333-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-000000000401', 'rent', 'Studio Apartment Rent (Studio 301)', 1, 3500000, 3500000),
  ('bbbbbbbb-bbbb-4bbb-8bbb-000000000402', '33333333-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-000000000401', 'utilities', 'High-Speed Internet & Maintenance Package', 1, 300000, 300000),
  ('bbbbbbbb-bbbb-4bbb-8bbb-000000000403', '33333333-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-000000000401', 'discount', 'Annual Lease Commitment Discount', 1, -150000, -150000);

-- ============================================================================
-- 13. PAYMENTS, ALLOCATIONS & RECEIPTS
-- ============================================================================

-- Payments
insert into public.payments (
  id,
  organization_id,
  payer_resident_id,
  amount_paise,
  currency,
  method,
  paid_on,
  transaction_reference,
  status,
  submitted_by,
  decided_by,
  decided_at,
  decision_reason,
  idempotency_key,
  submitted_invoice_id,
  created_at
) values
  -- Rohan June 2026 Payment (UPI Approved)
  (
    'cccccccc-cccc-4ccc-8ccc-000000000101',
    '22222222-2222-4222-8222-222222222222',
    '77777777-7777-4777-8777-000000000001',
    1600000,
    'INR',
    'upi',
    '2026-06-04',
    'UPI/615592819021/HDFC',
    'approved',
    '44444444-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    '2026-06-04 11:30:00+05:30',
    'Verified via bank statement',
    'pay-seed-rohan-jun',
    'aaaaaaaa-aaaa-4aaa-8aaa-000000000101',
    '2026-06-04 10:00:00+05:30'
  ),

  -- Rohan July 2026 Payment (Bank Transfer Approved)
  (
    'cccccccc-cccc-4ccc-8ccc-000000000102',
    '22222222-2222-4222-8222-222222222222',
    '77777777-7777-4777-8777-000000000001',
    1370000,
    'INR',
    'bank_transfer',
    '2026-07-03',
    'NEFT/N2607038192',
    'approved',
    '44444444-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    '2026-07-03 14:00:00+05:30',
    'Credited into ICICI current account',
    'pay-seed-rohan-jul',
    'aaaaaaaa-aaaa-4aaa-8aaa-000000000102',
    '2026-07-03 12:00:00+05:30'
  ),

  -- Rohan August 2026 Partial Cash Payment (Recorded by Manager)
  (
    'cccccccc-cccc-4ccc-8ccc-000000000103',
    '22222222-2222-4222-8222-222222222222',
    '77777777-7777-4777-8777-000000000001',
    700000,
    'INR',
    'cash',
    '2026-08-05',
    'CASH-IND-0805',
    'approved',
    '22222222-1111-4111-8111-111111111111', -- Submitted by Manager Rajesh Kumar
    '22222222-1111-4111-8111-111111111111',
    '2026-08-05 16:45:00+05:30',
    'Cash collected at reception desk',
    'pay-seed-rohan-aug-cash',
    'aaaaaaaa-aaaa-4aaa-8aaa-000000000103',
    '2026-08-05 16:45:00+05:30'
  ),

  -- Sneha July 2026 Payment (UPI Approved)
  (
    'cccccccc-cccc-4ccc-8ccc-000000000201',
    '22222222-2222-4222-8222-222222222222',
    '77777777-7777-4777-8777-000000000002',
    2200000,
    'INR',
    'upi',
    '2026-07-01',
    'UPI/618290381023/KOTAK',
    'approved',
    '55555555-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    '2026-07-01 17:00:00+05:30',
    'Verified via UPI settlement',
    'pay-seed-sneha-jul',
    'aaaaaaaa-aaaa-4aaa-8aaa-000000000201',
    '2026-07-01 15:30:00+05:30'
  ),

  -- Sneha August 2026 Payment (Submitted Proof - Pending Review for Demo)
  (
    'cccccccc-cccc-4ccc-8ccc-000000000202',
    '22222222-2222-4222-8222-222222222222',
    '77777777-7777-4777-8777-000000000002',
    2250000,
    'INR',
    'upi',
    '2026-08-10',
    'UPI/622384910283/GPAY',
    'submitted',
    '55555555-1111-4111-8111-111111111111',
    null,
    null,
    null,
    'pay-seed-sneha-aug-sub',
    'aaaaaaaa-aaaa-4aaa-8aaa-000000000202',
    '2026-08-10 18:20:00+05:30'
  ),

  -- Meera August 2026 Payment (Approved)
  (
    'cccccccc-cccc-4ccc-8ccc-000000000401',
    '33333333-2222-4222-8222-222222222222',
    '77777777-7777-4777-8777-000000000006',
    3650000,
    'INR',
    'upi',
    '2026-08-02',
    'UPI/621493019284/PAYTM',
    'approved',
    '99999999-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    '2026-08-02 12:15:00+05:30',
    'Approved online payment',
    'pay-seed-meera-aug',
    'aaaaaaaa-aaaa-4aaa-8aaa-000000000401',
    '2026-08-02 11:00:00+05:30'
  );

-- Payment Allocations
insert into public.payment_allocations (
  id,
  organization_id,
  payment_id,
  invoice_id,
  amount_paise
) values
  ('dddddddd-dddd-4ddd-8ddd-000000000101', '22222222-2222-4222-8222-222222222222', 'cccccccc-cccc-4ccc-8ccc-000000000101', 'aaaaaaaa-aaaa-4aaa-8aaa-000000000101', 1600000),
  ('dddddddd-dddd-4ddd-8ddd-000000000102', '22222222-2222-4222-8222-222222222222', 'cccccccc-cccc-4ccc-8ccc-000000000102', 'aaaaaaaa-aaaa-4aaa-8aaa-000000000102', 1370000),
  ('dddddddd-dddd-4ddd-8ddd-000000000103', '22222222-2222-4222-8222-222222222222', 'cccccccc-cccc-4ccc-8ccc-000000000103', 'aaaaaaaa-aaaa-4aaa-8aaa-000000000103', 700000),
  ('dddddddd-dddd-4ddd-8ddd-000000000201', '22222222-2222-4222-8222-222222222222', 'cccccccc-cccc-4ccc-8ccc-000000000201', 'aaaaaaaa-aaaa-4aaa-8aaa-000000000201', 2200000),
  ('dddddddd-dddd-4ddd-8ddd-000000000401', '33333333-2222-4222-8222-222222222222', 'cccccccc-cccc-4ccc-8ccc-000000000401', 'aaaaaaaa-aaaa-4aaa-8aaa-000000000401', 3650000);

-- Receipts (Immutable records)
insert into public.receipts (
  id,
  organization_id,
  payment_id,
  receipt_number,
  generated_at
) values
  ('eeeeeeee-eeee-4eee-8eee-000000000101', '22222222-2222-4222-8222-222222222222', 'cccccccc-cccc-4ccc-8ccc-000000000101', 'RCT-20260604-ROHANDAS', '2026-06-04 11:30:00+05:30'),
  ('eeeeeeee-eeee-4eee-8eee-000000000102', '22222222-2222-4222-8222-222222222222', 'cccccccc-cccc-4ccc-8ccc-000000000102', 'RCT-20260703-ROHANDAS', '2026-07-03 14:00:00+05:30'),
  ('eeeeeeee-eeee-4eee-8eee-000000000103', '22222222-2222-4222-8222-222222222222', 'cccccccc-cccc-4ccc-8ccc-000000000103', 'RCT-20260805-ROHANDAS', '2026-08-05 16:45:00+05:30'),
  ('eeeeeeee-eeee-4eee-8eee-000000000201', '22222222-2222-4222-8222-222222222222', 'cccccccc-cccc-4ccc-8ccc-000000000201', 'RCT-20260701-SNEHAPAT', '2026-07-01 17:00:00+05:30'),
  ('eeeeeeee-eeee-4eee-8eee-000000000401', '33333333-2222-4222-8222-222222222222', 'cccccccc-cccc-4ccc-8ccc-000000000401', 'RCT-20260802-MEERARE', '2026-08-02 12:15:00+05:30');

-- ============================================================================
-- 14. COMPLAINTS & EVENTS
-- ============================================================================

insert into public.complaints (
  id,
  organization_id,
  tenancy_id,
  resident_id,
  property_id,
  room_id,
  category,
  priority,
  title,
  description,
  status,
  assigned_membership_id,
  closed_at,
  created_at
) values
  -- Complaint 1 (Open): Tap leak in Maple House Room 101
  (
    'ffffffff-ffff-4fff-8fff-000000000001',
    '22222222-2222-4222-8222-222222222222',
    '88888888-8888-4888-8888-000000000001',
    '77777777-7777-4777-8777-000000000001',
    '44444444-4444-4444-8444-444444444444',
    '55555555-5555-4555-8555-000000000101',
    'Plumbing',
    'high',
    'Bathroom washbasin tap leaking continuously',
    'The washbasin tap in room 101 has a loose washer and drips water constantly. Please replace.',
    'open',
    null,
    null,
    now() - interval '2 hours'
  ),

  -- Complaint 2 (Assigned): AC tripping in Maple House Room 102
  (
    'ffffffff-ffff-4fff-8fff-000000000002',
    '22222222-2222-4222-8222-222222222222',
    '88888888-8888-4888-8888-000000000002',
    '77777777-7777-4777-8777-000000000002',
    '44444444-4444-4444-8444-444444444444',
    '55555555-5555-4555-8555-000000000102',
    'Electrical',
    'urgent',
    'Air conditioner tripping circuit breaker',
    'Whenever the AC starts cooling, the room MCB trips within 2 minutes. Urgent assistance required.',
    'assigned',
    '33333333-3333-4333-8333-000000000004', -- Assigned to Suresh Babu
    null,
    now() - interval '1 day'
  ),

  -- Complaint 3 (In Progress): Wardrobe hinge in Palm Grove
  (
    'ffffffff-ffff-4fff-8fff-000000000003',
    '22222222-2222-4222-8222-222222222222',
    '88888888-8888-4888-8888-000000000003',
    '77777777-7777-4777-8777-000000000003',
    '44444444-4444-4444-8444-444444444445',
    '55555555-5555-4555-8555-000000001201',
    'Carpentry',
    'normal',
    'Wardrobe door top hinge loose',
    'Left door of the double wardrobe is hanging loose and cannot be closed properly.',
    'in_progress',
    '33333333-3333-4333-8333-000000000004', -- Assigned to Suresh Babu
    null,
    now() - interval '2 days'
  ),

  -- Complaint 4 (Resolved): WiFi Mesh Router in Maple House (Resident can test reopen)
  (
    'ffffffff-ffff-4fff-8fff-000000000004',
    '22222222-2222-4222-8222-222222222222',
    '88888888-8888-4888-8888-000000000001',
    '77777777-7777-4777-8777-000000000001',
    '44444444-4444-4444-8444-444444444444',
    '55555555-5555-4555-8555-000000000101',
    'Internet',
    'normal',
    '2nd floor WiFi mesh point offline',
    'WiFi signal in the study nook is very weak because the repeater is showing red indicator light.',
    'resolved',
    '33333333-3333-4333-8333-000000000004',
    null,
    now() - interval '5 days'
  ),

  -- Complaint 5 (Closed): Microwave turntable in Urban Nest
  (
    'ffffffff-ffff-4fff-8fff-000000000005',
    '33333333-2222-4222-8222-222222222222',
    '88888888-8888-4888-8888-000000000006',
    '77777777-7777-4777-8777-000000000006',
    '44444444-4444-4444-8444-444444444446',
    '55555555-5555-4555-8555-000000002301',
    'Appliances',
    'low',
    'Microwave turntable ring replacement',
    'Turntable roller ring wheel broke. Replaced with OEM parts.',
    'closed',
    '33333333-3333-4333-8333-000000000012',
    now() - interval '10 days',
    now() - interval '15 days'
  );

-- Complaint Events (Audit history)
insert into public.complaint_events (
  id,
  organization_id,
  complaint_id,
  actor_id,
  event_type,
  previous_status,
  new_status,
  note,
  created_at
) values
  -- Events for Complaint 1
  ('12121212-1212-4212-8212-000000000001', '22222222-2222-4222-8222-222222222222', 'ffffffff-ffff-4fff-8fff-000000000001', '44444444-1111-4111-8111-111111111111', 'created', null, 'open', 'Resident reported leaking washbasin tap.', now() - interval '2 hours'),

  -- Events for Complaint 2
  ('12121212-1212-4212-8212-000000000002', '22222222-2222-4222-8222-222222222222', 'ffffffff-ffff-4fff-8fff-000000000002', '55555555-1111-4111-8111-111111111111', 'created', null, 'open', 'AC tripping breaker.', now() - interval '1 day'),
  ('12121212-1212-4212-8212-000000000003', '22222222-2222-4222-8222-222222222222', 'ffffffff-ffff-4fff-8fff-000000000002', '11111111-1111-4111-8111-111111111111', 'assigned', 'open', 'assigned', 'Assigned to Suresh Babu to check capacitor & MCB ampere rating.', now() - interval '20 hours'),

  -- Events for Complaint 3
  ('12121212-1212-4212-8212-000000000004', '22222222-2222-4222-8222-222222222222', 'ffffffff-ffff-4fff-8fff-000000000003', '66666666-1111-4111-8111-111111111111', 'created', null, 'open', 'Hinge broken.', now() - interval '2 days'),
  ('12121212-1212-4212-8212-000000000005', '22222222-2222-4222-8222-222222222222', 'ffffffff-ffff-4fff-8fff-000000000003', '11111111-1111-4111-8111-111111111111', 'assigned', 'open', 'assigned', 'Assigned to Suresh Babu.', now() - interval '1 day 18 hours'),
  ('12121212-1212-4212-8212-000000000006', '22222222-2222-4222-8222-222222222222', 'ffffffff-ffff-4fff-8fff-000000000003', '33333333-1111-4111-8111-111111111111', 'status_changed', 'assigned', 'in_progress', 'Purchasing replacement hydraulic hinge from hardware store.', now() - interval '6 hours'),

  -- Events for Complaint 4
  ('12121212-1212-4212-8212-000000000007', '22222222-2222-4222-8222-222222222222', 'ffffffff-ffff-4fff-8fff-000000000004', '44444444-1111-4111-8111-111111111111', 'created', null, 'open', 'WiFi offline.', now() - interval '5 days'),
  ('12121212-1212-4212-8212-000000000008', '22222222-2222-4222-8222-222222222222', 'ffffffff-ffff-4fff-8fff-000000000004', '33333333-1111-4111-8111-111111111111', 'status_changed', 'assigned', 'resolved', 'Replaced CAT6 patch cable and rebooted PoE injector. Speed test confirmed 150 Mbps.', now() - interval '3 days'),

  -- Events for Complaint 5
  ('12121212-1212-4212-8212-000000000009', '33333333-2222-4222-8222-222222222222', 'ffffffff-ffff-4fff-8fff-000000000005', '99999999-1111-4111-8111-111111111111', 'created', null, 'open', 'Microwave roller broken.', now() - interval '15 days'),
  ('12121212-1212-4212-8212-000000000010', '33333333-2222-4222-8222-222222222222', 'ffffffff-ffff-4fff-8fff-000000000005', '11111111-1111-4111-8111-111111111111', 'status_changed', 'resolved', 'closed', 'Confirmed working smoothly by resident. Closed.', now() - interval '10 days');

-- ============================================================================
-- 15. OPERATING EXPENSES (Multi-month ledger for Net Profit & Analytics)
-- ============================================================================

insert into public.expenses (
  id,
  organization_id,
  property_id,
  category,
  description,
  amount_paise,
  incurred_on,
  vendor_name,
  status,
  void_reason,
  voided_at,
  voided_by,
  created_by,
  created_at
) values
  -- August 2026 Expenses (Maple House)
  (
    '23232323-2323-4323-8323-000000000001',
    '22222222-2222-4222-8222-222222222222',
    '44444444-4444-4444-8444-444444444444',
    'utilities',
    'Commercial High-Speed Internet Fiber (Monthly ACT Bill)',
    850000, -- ₹8,500
    '2026-08-15',
    'ACT Fibernet Ltd',
    'recorded',
    null,
    null,
    null,
    '11111111-1111-4111-8111-111111111111',
    '2026-08-15 11:00:00+05:30'
  ),
  (
    '23232323-2323-4323-8323-000000000002',
    '22222222-2222-4222-8222-222222222222',
    '44444444-4444-4444-8444-444444444444',
    'maintenance',
    'Quarterly Lift Maintenance AMC & Safety Inspection',
    1420000, -- ₹14,200
    '2026-08-12',
    'Otis Elevator India',
    'recorded',
    null,
    null,
    null,
    '11111111-1111-4111-8111-111111111111',
    '2026-08-12 14:30:00+05:30'
  ),
  (
    '23232323-2323-4323-8323-000000000003',
    '22222222-2222-4222-8222-222222222222',
    '44444444-4444-4444-8444-444444444444',
    'supplies',
    'Housekeeping chemical supplies, sanitizers, and detergents',
    480000, -- ₹4,800
    '2026-08-08',
    'Metro Cash & Carry India',
    'recorded',
    null,
    null,
    null,
    '22222222-1111-4111-8111-111111111111',
    '2026-08-08 16:00:00+05:30'
  ),
  (
    '23232323-2323-4323-8323-000000000004',
    '22222222-2222-4222-8222-222222222222',
    '44444444-4444-4444-8444-444444444444',
    'staff',
    'Security Guard & Night Patrol Payroll (August)',
    2500000, -- ₹25,000
    '2026-08-01',
    'Eagle Security & Facility Services',
    'recorded',
    null,
    null,
    null,
    '11111111-1111-4111-8111-111111111111',
    '2026-08-01 10:00:00+05:30'
  ),
  (
    '23232323-2323-4323-8323-000000000005',
    '22222222-2222-4222-8222-222222222222',
    '44444444-4444-4444-8444-444444444444',
    'utilities',
    'BESCOM Common Area Electricity Bill',
    620000, -- ₹6,200
    '2026-08-03',
    'BESCOM Bengaluru',
    'recorded',
    null,
    null,
    null,
    '22222222-1111-4111-8111-111111111111',
    '2026-08-03 15:00:00+05:30'
  ),

  -- July 2026 Expenses
  (
    '23232323-2323-4323-8323-000000000006',
    '22222222-2222-4222-8222-222222222222',
    '44444444-4444-4444-8444-444444444444',
    'maintenance',
    'Overhead Water Tank Deep Cleaning & Disinfection',
    1200000, -- ₹12,000
    '2026-07-28',
    'AquaPure Tank Cleaners',
    'recorded',
    null,
    null,
    null,
    '11111111-1111-4111-8111-111111111111',
    '2026-07-28 17:00:00+05:30'
  ),
  (
    '23232323-2323-4323-8323-000000000007',
    '22222222-2222-4222-8222-222222222222',
    '44444444-4444-4444-8444-444444444444',
    'utilities',
    'Commercial High-Speed Internet Fiber (July ACT Bill)',
    850000, -- ₹8,500
    '2026-07-15',
    'ACT Fibernet Ltd',
    'recorded',
    null,
    null,
    null,
    '11111111-1111-4111-8111-111111111111',
    '2026-07-15 11:00:00+05:30'
  ),

  -- Voided Expense (Demonstrates void auditing & compliance)
  (
    '23232323-2323-4323-8323-000000000008',
    '22222222-2222-4222-8222-222222222222',
    '44444444-4444-4444-8444-444444444444',
    'other',
    'Duplicate pest control service invoice',
    350000,
    '2026-07-05',
    'UrbanShield Pest Services',
    'void',
    'Duplicate invoice submitted by vendor. Reissued under correct GST billing number.',
    '2026-07-06 10:00:00+05:30',
    '11111111-1111-4111-8111-111111111111',
    '22222222-1111-4111-8111-111111111111',
    '2026-07-05 14:00:00+05:30'
  );

-- ============================================================================
-- 16. NOTICES, TARGETS & READ STATES
-- ============================================================================

-- Notices
insert into public.notices (
  id,
  organization_id,
  author_id,
  title,
  body,
  category,
  is_pinned,
  expires_at,
  created_at
) values
  -- Notice 1: Pinned Organization Community Brunch
  (
    '34343434-3434-4434-8434-000000000001',
    '22222222-2222-4222-8222-222222222222',
    '11111111-1111-4111-8111-111111111111',
    'Independence Day Celebration & Community Brunch 🎉',
    'Join us this Sunday at 10:30 AM in the Maple House courtyard for brunch, refreshments, and independence day community celebrations! All residents and staff are cordially invited.',
    'general',
    true,
    now() + interval '10 days',
    now() - interval '3 days'
  ),

  -- Notice 2: Property Maintenance (Maple House)
  (
    '34343434-3434-4434-8434-000000000002',
    '22222222-2222-4222-8222-222222222222',
    '22222222-1111-4111-8111-111111111111',
    'Scheduled Overhead Water Tank Cleaning',
    'Water supply will be temporarily paused between 2:00 PM and 5:00 PM this Friday for scheduled annual tank disinfection and pipeline maintenance. Kindly store drinking water beforehand.',
    'maintenance',
    false,
    now() + interval '5 days',
    now() - interval '1 day'
  ),

  -- Notice 3: Palm Grove Villa Visitor Guidelines
  (
    '34343434-3434-4434-8434-000000000003',
    '22222222-2222-4222-8222-222222222222',
    '11111111-1111-4111-8111-111111111111',
    'Visitor Guidelines & Overnight Stay Policy',
    'As a reminder for all villa residents, overnight guests must be registered at least 24 hours in advance via reception to ensure security and comfort for all co-living members.',
    'rules',
    false,
    now() + interval '30 days',
    now() - interval '6 days'
  );

-- Notice Targets
insert into public.notice_targets (
  id,
  organization_id,
  notice_id,
  target_type,
  target_id
) values
  -- Notice 1 -> Entire Organization
  ('45454545-4545-4545-8545-000000000001', '22222222-2222-4222-8222-222222222222', '34343434-3434-4434-8434-000000000001', 'organization', '22222222-2222-4222-8222-222222222222'),

  -- Notice 2 -> Maple House PG
  ('45454545-4545-4545-8545-000000000002', '22222222-2222-4222-8222-222222222222', '34343434-3434-4434-8434-000000000002', 'property', '44444444-4444-4444-8444-444444444444'),

  -- Notice 3 -> Palm Grove Villa
  ('45454545-4545-4545-8545-000000000003', '22222222-2222-4222-8222-222222222222', '34343434-3434-4434-8434-000000000003', 'property', '44444444-4444-4444-8444-444444444445');

-- Notice Reads (Per resident read tracking)
insert into public.notice_reads (
  notice_id,
  profile_id,
  read_at
) values
  ('34343434-3434-4434-8434-000000000001', '44444444-1111-4111-8111-111111111111', now() - interval '2 days'),
  ('34343434-3434-4434-8434-000000000001', '55555555-1111-4111-8111-111111111111', now() - interval '1 day'),
  ('34343434-3434-4434-8434-000000000002', '55555555-1111-4111-8111-111111111111', now() - interval '10 hours');

-- ============================================================================
-- 17. DOCUMENTS & AGREEMENTS
-- ============================================================================

insert into public.documents (
  id,
  organization_id,
  resident_id,
  profile_id,
  document_type,
  storage_path,
  verification_status,
  expires_on,
  uploaded_by,
  supersedes_document_id,
  created_at
) values
  -- Prior Agreement for Amitabh Sen (Superseded)
  (
    '56565656-5656-4656-8656-000000000001',
    '22222222-2222-4222-8222-222222222222',
    '77777777-7777-4777-8777-000000000003',
    '66666666-1111-4111-8111-111111111111',
    'agreement',
    '22222222-2222-4222-8222-222222222222/11111111-1111-4111-8111-111111111111/agreement_amitabh_2025.pdf',
    'verified',
    '2026-07-31',
    '11111111-1111-4111-8111-111111111111',
    null,
    '2025-08-01 10:00:00+05:30'
  ),

  -- Current Renewed Agreement for Amitabh Sen
  (
    '56565656-5656-4656-8656-000000000002',
    '22222222-2222-4222-8222-222222222222',
    '77777777-7777-4777-8777-000000000003',
    '66666666-1111-4111-8111-111111111111',
    'agreement',
    '22222222-2222-4222-8222-222222222222/11111111-1111-4111-8111-111111111111/agreement_amitabh_2026_renewal.pdf',
    'verified',
    '2027-08-31',
    '11111111-1111-4111-8111-111111111111',
    '56565656-5656-4656-8656-000000000001',
    '2026-08-01 10:00:00+05:30'
  ),

  -- Rohan Das Rental Agreement
  (
    '56565656-5656-4656-8656-000000000003',
    '22222222-2222-4222-8222-222222222222',
    '77777777-7777-4777-8777-000000000001',
    '44444444-1111-4111-8111-111111111111',
    'agreement',
    '22222222-2222-4222-8222-222222222222/11111111-1111-4111-8111-111111111111/agreement_rohan_2026.pdf',
    'verified',
    '2026-12-31',
    '11111111-1111-4111-8111-111111111111',
    null,
    '2026-01-01 11:00:00+05:30'
  ),

  -- Rohan Das Aadhaar Card / Government KYC Proof
  (
    '56565656-5656-4656-8656-000000000004',
    '22222222-2222-4222-8222-222222222222',
    '77777777-7777-4777-8777-000000000001',
    '44444444-1111-4111-8111-111111111111',
    'identity_proof',
    '22222222-2222-4222-8222-222222222222/44444444-1111-4111-8111-111111111111/aadhaar_rohan_verified.jpg',
    'verified',
    null,
    '44444444-1111-4111-8111-111111111111',
    null,
    '2026-01-02 14:00:00+05:30'
  ),

  -- Sneha Patel Agreement
  (
    '56565656-5656-4656-8656-000000000005',
    '22222222-2222-4222-8222-222222222222',
    '77777777-7777-4777-8777-000000000002',
    '55555555-1111-4111-8111-111111111111',
    'agreement',
    '22222222-2222-4222-8222-222222222222/11111111-1111-4111-8111-111111111111/agreement_sneha_2026.pdf',
    'verified',
    '2027-01-31',
    '11111111-1111-4111-8111-111111111111',
    null,
    '2026-02-01 12:00:00+05:30'
  ),

  -- Meera Reddy Agreement (Urban Nest)
  (
    '56565656-5656-4656-8656-000000000006',
    '33333333-2222-4222-8222-222222222222',
    '77777777-7777-4777-8777-000000000006',
    '99999999-1111-4111-8111-111111111111',
    'agreement',
    '33333333-2222-4222-8222-222222222222/11111111-1111-4111-8111-111111111111/agreement_meera_2026.pdf',
    'verified',
    '2027-01-14',
    '11111111-1111-4111-8111-111111111111',
    null,
    '2026-01-15 15:00:00+05:30'
  );

-- ============================================================================
-- 18. PENDING INVITATIONS
-- ============================================================================

insert into public.invitations (
  id,
  organization_id,
  resident_id,
  role,
  email_normalized,
  phone_e164,
  token_hash,
  expires_at,
  invited_by,
  created_at
) values
  -- Pending Manager Invite for Maple House
  (
    '67676767-6767-4767-8767-000000000001',
    '22222222-2222-4222-8222-222222222222',
    null,
    'manager',
    'newmanager@tenantly.demo',
    '+919876543290',
    encode(extensions.digest('raw_token_manager_sample', 'sha256'), 'hex'),
    now() + interval '7 days',
    '11111111-1111-4111-8111-111111111111',
    now() - interval '1 day'
  ),

  -- Pending Tenant Invite for Rahul Varma
  (
    '67676767-6767-4767-8767-000000000002',
    '22222222-2222-4222-8222-222222222222',
    '77777777-7777-4777-8777-000000000004',
    'tenant',
    'rahul.varma@example.in',
    '+919876543230',
    encode(extensions.digest('raw_token_tenant_sample', 'sha256'), 'hex'),
    now() + interval '7 days',
    '11111111-1111-4111-8111-111111111111',
    now() - interval '2 days'
  );

-- Invitation Property mapping for the pending manager
insert into public.invitation_properties (
  invitation_id,
  organization_id,
  property_id
) values
  ('67676767-6767-4767-8767-000000000001', '22222222-2222-4222-8222-222222222222', '44444444-4444-4444-8444-444444444444');

-- ============================================================================
-- 19. NOTIFICATIONS (Role-tailored demo inboxes)
-- ============================================================================

insert into public.notifications (
  id,
  organization_id,
  recipient_profile_id,
  notification_type,
  title,
  body,
  deep_link_path,
  read_at,
  created_at
) values
  -- Notification for Owner (Vikram Malhotra)
  (
    '78787878-7878-4878-8878-000000000001',
    '22222222-2222-4222-8222-222222222222',
    '11111111-1111-4111-8111-111111111111',
    'payment_submitted',
    'New Payment Proof Submitted',
    'Sneha Patel submitted UPI payment proof of ₹22,500 for August rent.',
    '/(owner)/payment/cccccccc-cccc-4ccc-8ccc-000000000202',
    null,
    now() - interval '9 hours'
  ),
  (
    '78787878-7878-4878-8878-000000000002',
    '22222222-2222-4222-8222-222222222222',
    '11111111-1111-4111-8111-111111111111',
    'complaint_created',
    'Urgent Complaint Reported',
    'Air conditioner tripping MCB reported in Maple House Room 102.',
    '/(owner)/complaint/ffffffff-ffff-4fff-8fff-000000000002',
    now() - interval '18 hours',
    now() - interval '1 day'
  ),

  -- Notification for Staff (Suresh Babu)
  (
    '78787878-7878-4878-8878-000000000003',
    '22222222-2222-4222-8222-222222222222',
    '33333333-1111-4111-8111-111111111111',
    'maintenance_assignment',
    'New Maintenance Task Assigned',
    'You have been assigned: Air conditioner tripping circuit breaker.',
    '/(staff)/tasks',
    null,
    now() - interval '20 hours'
  ),

  -- Notification for Tenant (Rohan Das)
  (
    '78787878-7878-4878-8878-000000000004',
    '22222222-2222-4222-8222-222222222222',
    '44444444-1111-4111-8111-111111111111',
    'payment_receipt',
    'Payment Approved & Receipt Issued',
    'Receipt RCT-20260805-ROHANDAS for ₹7,000 is now available in your ledger.',
    '/(tenant)/invoice/aaaaaaaa-aaaa-4aaa-8aaa-000000000103',
    now() - interval '1 day',
    now() - interval '14 days'
  );

-- ============================================================================
-- 20. AUDIT LOGS
-- ============================================================================

insert into public.audit_logs (
  id,
  organization_id,
  actor_id,
  action,
  entity_type,
  entity_id,
  after_data,
  created_at
) values
  (
    '89898989-8989-4989-8989-000000000001',
    '22222222-2222-4222-8222-222222222222',
    '11111111-1111-4111-8111-111111111111',
    'organization.created',
    'organization',
    '22222222-2222-4222-8222-222222222222',
    '{"name":"Greenwood Living","slug":"greenwood-living"}'::jsonb,
    now() - interval '90 days'
  ),
  (
    '89898989-8989-4989-8989-000000000002',
    '22222222-2222-4222-8222-222222222222',
    '11111111-1111-4111-8111-111111111111',
    'property.created',
    'property',
    '44444444-4444-4444-8444-444444444444',
    '{"name":"Maple House PG","city":"Bengaluru"}'::jsonb,
    now() - interval '90 days'
  ),
  (
    '89898989-8989-4989-8989-000000000003',
    '22222222-2222-4222-8222-222222222222',
    '22222222-1111-4111-8111-111111111111',
    'payment.manual_recorded',
    'payment',
    'cccccccc-cccc-4ccc-8ccc-000000000103',
    '{"amountPaise":700000,"invoiceId":"aaaaaaaa-aaaa-4aaa-8aaa-000000000103"}'::jsonb,
    now() - interval '14 days'
  ),
  (
    '89898989-8989-4989-8989-000000000004',
    '22222222-2222-4222-8222-222222222222',
    '11111111-1111-4111-8111-111111111111',
    'expense.recorded',
    'expense',
    '23232323-2323-4323-8323-000000000001',
    '{"amountPaise":850000,"category":"utilities"}'::jsonb,
    now() - interval '4 days'
  ),
  (
    '89898989-8989-4989-8989-000000000005',
    '22222222-2222-4222-8222-222222222222',
    '11111111-1111-4111-8111-111111111111',
    'expense.voided',
    'expense',
    '23232323-2323-4323-8323-000000000008',
    '{"reason":"Duplicate invoice submitted by vendor. Reissued under correct GST billing number."}'::jsonb,
    now() - interval '44 days'
  );

set session_replication_role = 'origin';

commit;
