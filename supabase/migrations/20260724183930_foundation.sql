-- Tenantly foundation: identity, organization boundaries, and property inventory.
-- Money-bearing and occupancy-history tables are introduced with their functional milestones.

create extension if not exists pgcrypto with schema extensions;

create type public.account_status as enum ('active', 'suspended', 'closed');
create type public.organization_status as enum ('active', 'suspended', 'archived');
create type public.membership_role as enum ('owner', 'manager', 'tenant', 'maintenance_staff');
create type public.membership_status as enum ('invited', 'active', 'suspended', 'revoked');
create type public.property_type as enum ('apartment', 'house', 'pg', 'hostel', 'commercial', 'other');
create type public.property_status as enum ('active', 'archived');
create type public.room_type as enum ('private', 'shared', 'studio', 'other');
create type public.inventory_status as enum ('active', 'inactive', 'archived');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 2 and 120),
  phone_e164 text check (phone_e164 is null or phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  avatar_path text,
  account_status public.account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) between 3 and 63),
  default_currency char(3) not null default 'INR' check (default_currency ~ '^[A-Z]{3}$'),
  default_timezone text not null default 'Asia/Kolkata',
  created_by uuid not null references public.profiles (id) on delete restrict,
  status public.organization_status not null default 'active',
  idempotency_key text check (idempotency_key is null or char_length(idempotency_key) between 8 and 128),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, created_by)
);

create unique index organizations_creator_idempotency_idx
  on public.organizations (created_by, idempotency_key)
  where idempotency_key is not null;

create table public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role public.membership_role not null,
  status public.membership_status not null default 'invited',
  invited_at timestamptz,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, profile_id),
  unique (id, organization_id),
  check ((status = 'active' and joined_at is not null) or status <> 'active')
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 120),
  property_type public.property_type not null,
  address_line_1 text not null check (char_length(trim(address_line_1)) between 3 and 160),
  address_line_2 text,
  city text not null check (char_length(trim(city)) between 2 and 100),
  state text not null check (char_length(trim(state)) between 2 and 100),
  postal_code text not null check (postal_code ~ '^[1-9][0-9]{5}$'),
  country_code char(2) not null default 'IN' check (country_code ~ '^[A-Z]{2}$'),
  timezone text not null default 'Asia/Kolkata',
  rules text,
  description text,
  status public.property_status not null default 'active',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id),
  check ((status = 'archived' and archived_at is not null) or (status = 'active' and archived_at is null))
);

create table public.property_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  organization_membership_id uuid not null,
  property_id uuid not null,
  role_override public.membership_role check (role_override in ('manager', 'maintenance_staff')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_membership_id, property_id),
  foreign key (organization_membership_id, organization_id)
    references public.organization_memberships (id, organization_id) on delete cascade,
  foreign key (property_id, organization_id)
    references public.properties (id, organization_id) on delete cascade
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  property_id uuid not null,
  code text not null check (char_length(trim(code)) between 1 and 40),
  floor_label text,
  room_type public.room_type not null,
  default_rent_paise bigint not null default 0 check (default_rent_paise >= 0),
  default_deposit_paise bigint not null default 0 check (default_deposit_paise >= 0),
  currency char(3) not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  capacity smallint not null default 1 check (capacity between 1 and 100),
  status public.inventory_status not null default 'active',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (property_id, code),
  unique (id, organization_id),
  foreign key (property_id, organization_id)
    references public.properties (id, organization_id) on delete cascade,
  check ((status = 'archived' and archived_at is not null) or status <> 'archived')
);

create table public.beds (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  room_id uuid not null,
  code text not null check (char_length(trim(code)) between 1 and 40),
  status public.inventory_status not null default 'active',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (room_id, code),
  foreign key (room_id, organization_id)
    references public.rooms (id, organization_id) on delete cascade,
  check ((status = 'archived' and archived_at is not null) or status <> 'archived')
);

create index organization_memberships_profile_status_idx
  on public.organization_memberships (profile_id, status);
create index organization_memberships_org_role_status_idx
  on public.organization_memberships (organization_id, role, status);
create index properties_org_status_idx on public.properties (organization_id, status);
create index property_memberships_property_idx on public.property_memberships (property_id);
create index rooms_property_status_idx on public.rooms (property_id, status);
create index beds_room_status_idx on public.beds (room_id, status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger organizations_set_updated_at before update on public.organizations
for each row execute function public.set_updated_at();
create trigger organization_memberships_set_updated_at before update on public.organization_memberships
for each row execute function public.set_updated_at();
create trigger properties_set_updated_at before update on public.properties
for each row execute function public.set_updated_at();
create trigger property_memberships_set_updated_at before update on public.property_memberships
for each row execute function public.set_updated_at();
create trigger rooms_set_updated_at before update on public.rooms
for each row execute function public.set_updated_at();
create trigger beds_set_updated_at before update on public.beds
for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'Tenantly user')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

revoke all on function public.handle_new_auth_user() from public;

create or replace function public.is_org_member(
  requested_organization_id uuid,
  allowed_roles public.membership_role[] default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = requested_organization_id
      and membership.profile_id = auth.uid()
      and membership.status = 'active'
      and (allowed_roles is null or membership.role = any (allowed_roles))
  );
$$;

create or replace function public.shares_organization_with(requested_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select requested_profile_id = auth.uid() or exists (
    select 1
    from public.organization_memberships mine
    join public.organization_memberships theirs
      on theirs.organization_id = mine.organization_id
     and theirs.profile_id = requested_profile_id
     and theirs.status = 'active'
    where mine.profile_id = auth.uid()
      and mine.status = 'active'
  );
$$;

create or replace function public.can_access_property(requested_property_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.properties property
    join public.organization_memberships membership
      on membership.organization_id = property.organization_id
     and membership.profile_id = auth.uid()
     and membership.status = 'active'
    left join public.property_memberships scoped
      on scoped.organization_membership_id = membership.id
     and scoped.property_id = property.id
    where property.id = requested_property_id
      and (
        membership.role in ('owner', 'manager')
        or (membership.role = 'maintenance_staff' and scoped.id is not null)
      )
  );
$$;

revoke all on function public.is_org_member(uuid, public.membership_role[]) from public;
revoke all on function public.shares_organization_with(uuid) from public;
revoke all on function public.can_access_property(uuid) from public;
grant execute on function public.is_org_member(uuid, public.membership_role[]) to authenticated;
grant execute on function public.shares_organization_with(uuid) to authenticated;
grant execute on function public.can_access_property(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.properties enable row level security;
alter table public.property_memberships enable row level security;
alter table public.rooms enable row level security;
alter table public.beds enable row level security;

create policy profiles_select_shared_organization
on public.profiles for select to authenticated
using (public.shares_organization_with(id));

create policy profiles_update_self
on public.profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy organizations_select_member
on public.organizations for select to authenticated
using (public.is_org_member(id));

create policy organizations_update_owner
on public.organizations for update to authenticated
using (public.is_org_member(id, array['owner']::public.membership_role[]))
with check (public.is_org_member(id, array['owner']::public.membership_role[]));

create policy memberships_select_self_or_operator
on public.organization_memberships for select to authenticated
using (
  profile_id = auth.uid()
  or public.is_org_member(organization_id, array['owner', 'manager']::public.membership_role[])
);

create policy memberships_insert_owner
on public.organization_memberships for insert to authenticated
with check (public.is_org_member(organization_id, array['owner']::public.membership_role[]));

create policy memberships_update_owner
on public.organization_memberships for update to authenticated
using (public.is_org_member(organization_id, array['owner']::public.membership_role[]))
with check (public.is_org_member(organization_id, array['owner']::public.membership_role[]));

create policy memberships_delete_owner
on public.organization_memberships for delete to authenticated
using (public.is_org_member(organization_id, array['owner']::public.membership_role[]));

create policy properties_select_authorized
on public.properties for select to authenticated
using (public.can_access_property(id));

create policy properties_insert_operator
on public.properties for insert to authenticated
with check (public.is_org_member(organization_id, array['owner', 'manager']::public.membership_role[]));

create policy properties_update_operator
on public.properties for update to authenticated
using (public.is_org_member(organization_id, array['owner', 'manager']::public.membership_role[]))
with check (public.is_org_member(organization_id, array['owner', 'manager']::public.membership_role[]));

create policy properties_delete_owner
on public.properties for delete to authenticated
using (public.is_org_member(organization_id, array['owner']::public.membership_role[]));

create policy property_memberships_select_authorized
on public.property_memberships for select to authenticated
using (
  public.is_org_member(organization_id, array['owner', 'manager']::public.membership_role[])
  or organization_membership_id in (
    select membership.id
    from public.organization_memberships membership
    where membership.profile_id = auth.uid()
  )
);

create policy property_memberships_manage_owner
on public.property_memberships for all to authenticated
using (public.is_org_member(organization_id, array['owner']::public.membership_role[]))
with check (public.is_org_member(organization_id, array['owner']::public.membership_role[]));

create policy rooms_select_authorized
on public.rooms for select to authenticated
using (public.can_access_property(property_id));

create policy rooms_insert_operator
on public.rooms for insert to authenticated
with check (
  public.is_org_member(organization_id, array['owner', 'manager']::public.membership_role[])
  and public.can_access_property(property_id)
);

create policy rooms_update_operator
on public.rooms for update to authenticated
using (public.is_org_member(organization_id, array['owner', 'manager']::public.membership_role[]))
with check (
  public.is_org_member(organization_id, array['owner', 'manager']::public.membership_role[])
  and public.can_access_property(property_id)
);

create policy rooms_delete_owner
on public.rooms for delete to authenticated
using (public.is_org_member(organization_id, array['owner']::public.membership_role[]));

create policy beds_select_authorized
on public.beds for select to authenticated
using (
  exists (
    select 1 from public.rooms room
    where room.id = beds.room_id
      and public.can_access_property(room.property_id)
  )
);

create policy beds_insert_operator
on public.beds for insert to authenticated
with check (
  public.is_org_member(organization_id, array['owner', 'manager']::public.membership_role[])
  and exists (
    select 1 from public.rooms room
    where room.id = beds.room_id
      and room.organization_id = beds.organization_id
      and public.can_access_property(room.property_id)
  )
);

create policy beds_update_operator
on public.beds for update to authenticated
using (public.is_org_member(organization_id, array['owner', 'manager']::public.membership_role[]))
with check (public.is_org_member(organization_id, array['owner', 'manager']::public.membership_role[]));

create policy beds_delete_owner
on public.beds for delete to authenticated
using (public.is_org_member(organization_id, array['owner']::public.membership_role[]));

create or replace function public.create_organization_with_owner(
  organization_name text,
  organization_slug text,
  request_idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  created_organization_id uuid;
begin
  if actor_id is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;
  if char_length(trim(organization_name)) not between 2 and 120 then
    raise exception 'invalid_organization_name' using errcode = '22023';
  end if;
  if organization_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
     or char_length(organization_slug) not between 3 and 63 then
    raise exception 'invalid_organization_slug' using errcode = '22023';
  end if;
  if request_idempotency_key is null
     or char_length(request_idempotency_key) not between 8 and 128 then
    raise exception 'invalid_idempotency_key' using errcode = '22023';
  end if;

  insert into public.organizations (name, slug, created_by, idempotency_key)
  values (trim(organization_name), organization_slug, actor_id, request_idempotency_key)
  on conflict (created_by, idempotency_key) where idempotency_key is not null
  do update set updated_at = public.organizations.updated_at
  returning id into created_organization_id;

  insert into public.organization_memberships (
    organization_id,
    profile_id,
    role,
    status,
    joined_at
  ) values (
    created_organization_id,
    actor_id,
    'owner',
    'active',
    now()
  )
  on conflict (organization_id, profile_id) do nothing;

  return created_organization_id;
end;
$$;

revoke all on function public.create_organization_with_owner(text, text, text) from public;
grant execute on function public.create_organization_with_owner(text, text, text) to authenticated;

grant select on public.profiles to authenticated;
grant update (full_name, phone_e164, avatar_path) on public.profiles to authenticated;

grant select on public.organizations to authenticated;
grant update (name, slug, default_currency, default_timezone, status) on public.organizations to authenticated;

grant select, delete on public.organization_memberships to authenticated;
grant insert (organization_id, profile_id, role, status, invited_at, joined_at)
  on public.organization_memberships to authenticated;
grant update (role, status, invited_at, joined_at)
  on public.organization_memberships to authenticated;

grant select, delete on public.properties to authenticated;
grant insert (
  organization_id, name, property_type, address_line_1, address_line_2,
  city, state, postal_code, country_code, timezone, rules, description,
  status, archived_at
) on public.properties to authenticated;
grant update (
  name, property_type, address_line_1, address_line_2, city, state,
  postal_code, country_code, timezone, rules, description, status, archived_at
) on public.properties to authenticated;

grant select, delete on public.property_memberships to authenticated;
grant insert (organization_id, organization_membership_id, property_id, role_override)
  on public.property_memberships to authenticated;
grant update (role_override) on public.property_memberships to authenticated;

grant select, delete on public.rooms to authenticated;
grant insert (
  organization_id, property_id, code, floor_label, room_type,
  default_rent_paise, default_deposit_paise, currency, capacity, status, archived_at
) on public.rooms to authenticated;
grant update (
  code, floor_label, room_type, default_rent_paise, default_deposit_paise,
  currency, capacity, status, archived_at
) on public.rooms to authenticated;

grant select, delete on public.beds to authenticated;
grant insert (organization_id, room_id, code, status, archived_at)
  on public.beds to authenticated;
grant update (code, status, archived_at) on public.beds to authenticated;