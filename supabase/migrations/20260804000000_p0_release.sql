-- Tenantly P0 domain schema. All privileged multi-row mutations are transactional RPCs.

create type public.resident_status as enum ('active', 'inactive', 'archived');
create type public.tenancy_status as enum ('draft', 'active', 'notice_period', 'ended', 'cancelled');
create type public.invoice_status as enum ('draft', 'issued', 'partially_paid', 'paid', 'overdue', 'waived', 'void');
create type public.invoice_item_type as enum ('rent', 'utilities', 'mess', 'discount', 'late_fee', 'adjustment');
create type public.payment_status as enum ('submitted', 'approved', 'rejected', 'partially_refunded', 'refunded');
create type public.payment_method as enum ('cash', 'upi', 'bank_transfer', 'other');
create type public.complaint_status as enum ('open', 'assigned', 'in_progress', 'resolved', 'closed', 'reopened', 'rejected');
create type public.complaint_priority as enum ('low', 'normal', 'high', 'urgent');
create type public.verification_status as enum ('pending', 'verified', 'rejected');

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  resident_id uuid,
  role public.membership_role not null check (role in ('manager','tenant')),
  email_normalized text,
  phone_e164 text,
  token_hash text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  invited_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  check (email_normalized is not null or phone_e164 is not null)
);

create table public.property_media (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  storage_path text not null,
  media_type text not null check (media_type in ('image/jpeg','image/png','image/heic')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.residents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  full_name text not null check (char_length(trim(full_name)) between 2 and 120),
  email_normalized text,
  phone_e164 text,
  emergency_name text,
  emergency_phone_e164 text,
  status public.resident_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, profile_id)
);

alter table public.invitations add constraint invitations_resident_fk
  foreign key (resident_id) references public.residents(id) on delete set null;

create table public.tenancies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  resident_id uuid not null references public.residents(id),
  property_id uuid not null references public.properties(id),
  start_date date not null,
  end_date date,
  due_day smallint not null check (due_day between 1 and 28),
  rent_paise bigint not null check (rent_paise >= 0),
  deposit_paise bigint not null default 0 check (deposit_paise >= 0),
  currency char(3) not null default 'INR',
  status public.tenancy_status not null default 'draft',
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, idempotency_key)
);

create table public.occupancy_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  tenancy_id uuid not null references public.tenancies(id),
  room_id uuid not null references public.rooms(id),
  bed_id uuid references public.beds(id),
  starts_at timestamptz not null,
  ends_at timestamptz,
  reason text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);
create unique index occupancy_active_tenancy_idx on public.occupancy_assignments(tenancy_id) where ends_at is null;
create unique index occupancy_active_bed_idx on public.occupancy_assignments(bed_id) where ends_at is null and bed_id is not null;

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  tenancy_id uuid not null references public.tenancies(id),
  property_id uuid not null references public.properties(id),
  period_start date not null,
  period_end date not null,
  due_date date not null,
  currency char(3) not null default 'INR',
  subtotal_paise bigint not null default 0,
  adjustment_paise bigint not null default 0,
  total_paise bigint not null default 0 check (total_paise >= 0),
  paid_paise bigint not null default 0 check (paid_paise >= 0),
  balance_paise bigint generated always as (total_paise - paid_paise) stored,
  status public.invoice_status not null default 'issued',
  invoice_number text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenancy_id, period_start)
);

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  item_type public.invoice_item_type not null,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_amount_paise bigint not null,
  total_amount_paise bigint not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  payer_resident_id uuid not null references public.residents(id),
  amount_paise bigint not null check (amount_paise > 0),
  currency char(3) not null default 'INR',
  method public.payment_method not null,
  paid_on date not null,
  transaction_reference text,
  proof_storage_path text,
  status public.payment_status not null default 'submitted',
  submitted_by uuid not null references public.profiles(id),
  decision_reason text,
  decided_by uuid references public.profiles(id),
  decided_at timestamptz,
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, idempotency_key)
);

create table public.payment_allocations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  payment_id uuid not null references public.payments(id),
  invoice_id uuid not null references public.invoices(id),
  amount_paise bigint not null check (amount_paise > 0),
  created_at timestamptz not null default now(),
  unique (payment_id, invoice_id)
);

create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  payment_id uuid not null unique references public.payments(id),
  receipt_number text not null unique,
  pdf_storage_path text,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  tenancy_id uuid references public.tenancies(id),
  resident_id uuid not null references public.residents(id),
  property_id uuid not null references public.properties(id),
  room_id uuid references public.rooms(id),
  category text not null,
  priority public.complaint_priority not null default 'normal',
  title text not null,
  description text not null,
  status public.complaint_status not null default 'open',
  assigned_membership_id uuid references public.organization_memberships(id),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.complaint_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  actor_id uuid not null references public.profiles(id),
  event_type text not null,
  previous_status public.complaint_status,
  new_status public.complaint_status,
  note text,
  created_at timestamptz not null default now()
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null check (entity_type in ('complaint','payment')),
  entity_id uuid not null,
  storage_path text not null,
  media_type text not null,
  uploaded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.notices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  title text not null,
  body text not null,
  category text not null default 'general',
  is_pinned boolean not null default false,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.notice_targets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  notice_id uuid not null references public.notices(id) on delete cascade,
  target_type text not null check (target_type in ('organization','property','room','resident')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  unique (notice_id, target_type, target_id)
);
create table public.notice_reads (
  notice_id uuid not null references public.notices(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notice_id, profile_id)
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  resident_id uuid references public.residents(id),
  profile_id uuid references public.profiles(id),
  document_type text not null,
  storage_path text not null,
  verification_status public.verification_status not null default 'pending',
  expires_on date,
  uploaded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (resident_id is not null or profile_id is not null)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  recipient_profile_id uuid not null references public.profiles(id) on delete cascade,
  notification_type text not null,
  title text not null,
  body text not null,
  deep_link_path text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.push_devices (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  expo_push_token text not null unique,
  platform text not null check (platform in ('ios','android')),
  app_version text not null,
  last_seen_at timestamptz not null default now(),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  request_id text,
  created_at timestamptz not null default now()
);

create index residents_org_status_idx on public.residents(organization_id,status);
create index residents_profile_idx on public.residents(profile_id);
create index tenancies_org_status_idx on public.tenancies(organization_id,status,start_date);
create index occupancy_room_active_idx on public.occupancy_assignments(room_id,ends_at);
create index invoices_org_status_due_idx on public.invoices(organization_id,status,due_date);
create index payments_org_status_created_idx on public.payments(organization_id,status,created_at desc);
create index complaints_org_status_priority_idx on public.complaints(organization_id,status,priority);
create index notifications_recipient_unread_idx on public.notifications(recipient_profile_id,read_at,created_at desc);
create unique index audit_logs_org_request_idx on public.audit_logs(organization_id,request_id)
  where request_id is not null;

create trigger residents_set_updated_at before update on public.residents for each row execute function public.set_updated_at();
create trigger tenancies_set_updated_at before update on public.tenancies for each row execute function public.set_updated_at();
create trigger invoices_set_updated_at before update on public.invoices for each row execute function public.set_updated_at();
create trigger payments_set_updated_at before update on public.payments for each row execute function public.set_updated_at();
create trigger complaints_set_updated_at before update on public.complaints for each row execute function public.set_updated_at();
create trigger notices_set_updated_at before update on public.notices for each row execute function public.set_updated_at();
create trigger documents_set_updated_at before update on public.documents for each row execute function public.set_updated_at();

create or replace function public.prevent_archiving_occupied_inventory() returns trigger
language plpgsql set search_path='' as $$
begin
  if new.status::text='archived' and old.status::text<>'archived' then
    if tg_table_name='rooms' and exists(select 1 from public.occupancy_assignments where room_id=old.id and ends_at is null)
      then raise exception 'cannot_archive_occupied_room'; end if;
    if tg_table_name='properties' and exists(
      select 1 from public.occupancy_assignments a join public.rooms r on r.id=a.room_id
      where r.property_id=old.id and a.ends_at is null
    ) then raise exception 'cannot_archive_occupied_property'; end if;
  end if;
  return new;
end $$;
create trigger rooms_prevent_occupied_archive before update of status on public.rooms
for each row execute function public.prevent_archiving_occupied_inventory();
create trigger properties_prevent_occupied_archive before update of status on public.properties
for each row execute function public.prevent_archiving_occupied_inventory();

create or replace function public.protect_receipt_immutability() returns trigger
language plpgsql set search_path='' as $$
begin
  if tg_op='DELETE' then raise exception 'receipts_are_immutable'; end if;
  if new.id<>old.id or new.organization_id<>old.organization_id or new.payment_id<>old.payment_id
    or new.receipt_number<>old.receipt_number or new.generated_at<>old.generated_at then
    raise exception 'receipts_are_immutable';
  end if;
  if old.pdf_storage_path is not null and new.pdf_storage_path is distinct from old.pdf_storage_path then
    raise exception 'receipt_pdf_is_immutable';
  end if;
  return new;
end $$;
create trigger receipts_protect_immutability before update or delete on public.receipts
for each row execute function public.protect_receipt_immutability();

create or replace function public.is_linked_resident(requested_resident_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.residents r where r.id=requested_resident_id and r.profile_id=auth.uid()) $$;
grant execute on function public.is_linked_resident(uuid) to authenticated;

create or replace function public.create_tenancy_with_assignment(
  requested_organization_id uuid, requested_resident_id uuid, requested_property_id uuid,
  requested_room_id uuid, requested_bed_id uuid, requested_start_date date,
  requested_due_day integer, requested_rent_paise bigint, requested_deposit_paise bigint,
  request_idempotency_key text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare tenancy_uuid uuid; resolved_bed_id uuid:=requested_bed_id; room_capacity integer; active_count integer;
begin
  if not public.is_org_member(requested_organization_id,array['owner','manager']::public.membership_role[]) then raise exception 'forbidden'; end if;
  select id into tenancy_uuid from public.tenancies
    where organization_id=requested_organization_id and idempotency_key=request_idempotency_key;
  if tenancy_uuid is not null then return tenancy_uuid; end if;
  if not exists(select 1 from public.residents where id=requested_resident_id and organization_id=requested_organization_id)
    or not exists(select 1 from public.properties where id=requested_property_id and organization_id=requested_organization_id)
    or not exists(select 1 from public.rooms where id=requested_room_id and property_id=requested_property_id and organization_id=requested_organization_id and status='active')
    or (requested_bed_id is not null and not exists(select 1 from public.beds where id=requested_bed_id and room_id=requested_room_id and organization_id=requested_organization_id and status='active'))
  then raise exception 'invalid_organization_inventory'; end if;
  if resolved_bed_id is null then
    select b.id into resolved_bed_id from public.beds b where b.room_id=requested_room_id and b.status='active'
      and not exists(select 1 from public.occupancy_assignments a where a.bed_id=b.id and a.ends_at is null) order by b.code limit 1;
  end if;
  select capacity into room_capacity from public.rooms where id=requested_room_id;
  select count(*) into active_count from public.occupancy_assignments where room_id=requested_room_id and ends_at is null;
  if active_count>=room_capacity then raise exception 'room_at_capacity'; end if;
  insert into public.tenancies(organization_id,resident_id,property_id,start_date,due_day,rent_paise,deposit_paise,status,idempotency_key)
  values(requested_organization_id,requested_resident_id,requested_property_id,requested_start_date,requested_due_day,requested_rent_paise,requested_deposit_paise,'active',request_idempotency_key)
  on conflict(organization_id,idempotency_key) do update set updated_at=public.tenancies.updated_at returning id into tenancy_uuid;
  if not exists(select 1 from public.occupancy_assignments where tenancy_id=tenancy_uuid and ends_at is null) then
    insert into public.occupancy_assignments(organization_id,tenancy_id,room_id,bed_id,starts_at,created_by)
    values(requested_organization_id,tenancy_uuid,requested_room_id,resolved_bed_id,requested_start_date::timestamptz,auth.uid());
  end if;
  return tenancy_uuid;
end $$;

create or replace function public.transfer_occupancy(requested_tenancy_id uuid, requested_room_id uuid, requested_bed_id uuid, effective_at timestamptz, transfer_reason text, request_idempotency_key text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare org_id uuid; assignment_id uuid; resolved_bed_id uuid:=requested_bed_id; room_capacity integer; active_count integer;
begin
  select organization_id into org_id from public.tenancies where id=requested_tenancy_id;
  if not public.is_org_member(org_id,array['owner','manager']::public.membership_role[]) then raise exception 'forbidden'; end if;
  select entity_id into assignment_id from public.audit_logs where organization_id=org_id and request_id=request_idempotency_key;
  if found then return assignment_id; end if;
  update public.occupancy_assignments set ends_at=effective_at, reason=transfer_reason where tenancy_id=requested_tenancy_id and ends_at is null;
  if requested_room_id is null then
    update public.tenancies set status='ended',end_date=effective_at::date where id=requested_tenancy_id;
    insert into public.audit_logs(organization_id,actor_id,action,entity_type,entity_id,request_id)
      values(org_id,auth.uid(),'occupancy.vacated','tenancy',requested_tenancy_id,request_idempotency_key);
    return null;
  end if;
  if not exists(select 1 from public.rooms where id=requested_room_id and organization_id=org_id and status='active')
    or (requested_bed_id is not null and not exists(select 1 from public.beds where id=requested_bed_id and room_id=requested_room_id and organization_id=org_id and status='active'))
  then raise exception 'invalid_organization_inventory'; end if;
  if resolved_bed_id is null then
    select b.id into resolved_bed_id from public.beds b where b.room_id=requested_room_id and b.status='active'
      and not exists(select 1 from public.occupancy_assignments a where a.bed_id=b.id and a.ends_at is null) order by b.code limit 1;
  end if;
  select capacity into room_capacity from public.rooms where id=requested_room_id;
  select count(*) into active_count from public.occupancy_assignments where room_id=requested_room_id and ends_at is null;
  if active_count>=room_capacity then raise exception 'room_at_capacity'; end if;
  insert into public.occupancy_assignments(organization_id,tenancy_id,room_id,bed_id,starts_at,reason,created_by)
  values(org_id,requested_tenancy_id,requested_room_id,resolved_bed_id,effective_at,transfer_reason,auth.uid()) returning id into assignment_id;
  insert into public.audit_logs(organization_id,actor_id,action,entity_type,entity_id,request_id)
    values(org_id,auth.uid(),'occupancy.transferred','occupancy_assignment',assignment_id,request_idempotency_key);
  return assignment_id;
end $$;

create or replace function public.generate_monthly_invoices(requested_organization_id uuid, requested_period_start date)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare t record; created_count integer:=0; skipped_count integer:=0; inv_id uuid; period_end date; due date;
begin
  if not public.is_org_member(requested_organization_id,array['owner','manager']::public.membership_role[]) then raise exception 'forbidden'; end if;
  period_end := (requested_period_start + interval '1 month - 1 day')::date;
  for t in select * from public.tenancies where organization_id=requested_organization_id and status in ('active','notice_period') and start_date<=period_end and coalesce(end_date,period_end)>=requested_period_start loop
    if exists(select 1 from public.invoices where tenancy_id=t.id and period_start=requested_period_start) then skipped_count:=skipped_count+1; continue; end if;
    due := make_date(extract(year from requested_period_start)::int,extract(month from requested_period_start)::int,t.due_day);
    insert into public.invoices(organization_id,tenancy_id,property_id,period_start,period_end,due_date,currency,subtotal_paise,total_paise,status,invoice_number)
    values(t.organization_id,t.id,t.property_id,requested_period_start,period_end,due,t.currency,t.rent_paise,t.rent_paise,'issued',
      'INV-'||to_char(requested_period_start,'YYYYMM')||'-'||upper(substr(replace(t.id::text,'-',''),1,8))) returning id into inv_id;
    insert into public.invoice_items(organization_id,invoice_id,item_type,description,unit_amount_paise,total_amount_paise)
    values(t.organization_id,inv_id,'rent','Monthly rent',t.rent_paise,t.rent_paise);
    created_count:=created_count+1;
  end loop;
  return jsonb_build_object('created',created_count,'skipped',skipped_count,'failed',0);
end $$;

create or replace function public.submit_payment(requested_invoice_id uuid, requested_amount_paise bigint, requested_method public.payment_method,
  requested_paid_on date, requested_reference text, requested_proof_path text, request_idempotency_key text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare inv record; resident_uuid uuid; payment_uuid uuid;
begin
  select i.*,t.resident_id into inv from public.invoices i join public.tenancies t on t.id=i.tenancy_id where i.id=requested_invoice_id;
  resident_uuid:=inv.resident_id;
  if not public.is_linked_resident(resident_uuid) then raise exception 'forbidden'; end if;
  insert into public.payments(organization_id,payer_resident_id,amount_paise,currency,method,paid_on,transaction_reference,proof_storage_path,submitted_by,idempotency_key)
  values(inv.organization_id,resident_uuid,requested_amount_paise,inv.currency,requested_method,requested_paid_on,requested_reference,requested_proof_path,auth.uid(),request_idempotency_key)
  on conflict(organization_id,idempotency_key) do update set updated_at=public.payments.updated_at returning id into payment_uuid;
  return payment_uuid;
end $$;

create or replace function public.decide_payment(requested_payment_id uuid, approve boolean, reason text, allocations jsonb default '[]'::jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare p record; allocation jsonb; allocation_total bigint:=0; receipt_uuid uuid; inv record;
begin
  select * into p from public.payments where id=requested_payment_id for update;
  if not public.is_org_member(p.organization_id,array['owner','manager']::public.membership_role[]) then raise exception 'forbidden'; end if;
  if p.status<>'submitted' then raise exception 'payment_already_decided'; end if;
  if not approve then
    if char_length(trim(coalesce(reason,'')))<3 then raise exception 'rejection_reason_required'; end if;
    update public.payments set status='rejected',decision_reason=reason,decided_by=auth.uid(),decided_at=now() where id=p.id;
    insert into public.audit_logs(organization_id,actor_id,action,entity_type,entity_id,after_data)
      values(p.organization_id,auth.uid(),'payment.rejected','payment',p.id,jsonb_build_object('reason',reason));
    return null;
  end if;
  for allocation in select * from jsonb_array_elements(allocations) loop
    allocation_total:=allocation_total+(allocation->>'amountPaise')::bigint;
    select * into inv from public.invoices where id=(allocation->>'invoiceId')::uuid and organization_id=p.organization_id for update;
    if inv.id is null or (allocation->>'amountPaise')::bigint>inv.balance_paise then raise exception 'invalid_allocation'; end if;
    insert into public.payment_allocations(organization_id,payment_id,invoice_id,amount_paise)
      values(p.organization_id,p.id,inv.id,(allocation->>'amountPaise')::bigint);
    update public.invoices set paid_paise=paid_paise+(allocation->>'amountPaise')::bigint,
      status=case when paid_paise+(allocation->>'amountPaise')::bigint>=total_paise then 'paid'::public.invoice_status else 'partially_paid'::public.invoice_status end where id=inv.id;
  end loop;
  if allocation_total<=0 or allocation_total>p.amount_paise then raise exception 'invalid_allocation_total'; end if;
  update public.payments set status='approved',decision_reason=reason,decided_by=auth.uid(),decided_at=now() where id=p.id;
  insert into public.receipts(organization_id,payment_id,receipt_number)
    values(p.organization_id,p.id,'RCT-'||to_char(now(),'YYYYMMDD')||'-'||upper(substr(replace(p.id::text,'-',''),1,8))) returning id into receipt_uuid;
  insert into public.audit_logs(organization_id,actor_id,action,entity_type,entity_id,after_data)
    values(p.organization_id,auth.uid(),'payment.approved','payment',p.id,jsonb_build_object('allocationTotalPaise',allocation_total,'receiptId',receipt_uuid));
  return receipt_uuid;
end $$;

create or replace function public.transition_complaint(requested_complaint_id uuid, requested_status public.complaint_status, transition_note text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare complaint_row record; event_uuid uuid;
begin
  select * into complaint_row from public.complaints where id=requested_complaint_id for update;
  if not (public.is_org_member(complaint_row.organization_id,array['owner','manager']::public.membership_role[]) or public.is_linked_resident(complaint_row.resident_id)) then raise exception 'forbidden'; end if;
  if public.is_linked_resident(complaint_row.resident_id) and requested_status<>'reopened' then raise exception 'tenant_can_only_reopen'; end if;
  if requested_status='reopened' and complaint_row.status not in ('resolved','closed') then raise exception 'invalid_transition'; end if;
  if not public.is_linked_resident(complaint_row.resident_id) and not (
    (complaint_row.status in ('open','reopened') and requested_status in ('assigned','in_progress','rejected')) or
    (complaint_row.status='assigned' and requested_status in ('in_progress','rejected')) or
    (complaint_row.status='in_progress' and requested_status in ('resolved','rejected')) or
    (complaint_row.status='resolved' and requested_status='closed')
  ) then raise exception 'invalid_transition'; end if;
  update public.complaints set status=requested_status,closed_at=case when requested_status='closed' then now() else null end where id=requested_complaint_id;
  insert into public.complaint_events(organization_id,complaint_id,actor_id,event_type,previous_status,new_status,note)
    values(complaint_row.organization_id,requested_complaint_id,auth.uid(),'status_changed',complaint_row.status,requested_status,transition_note) returning id into event_uuid;
  return event_uuid;
end $$;

create or replace function public.create_invitation(
  requested_organization_id uuid, requested_resident_id uuid, requested_role public.membership_role,
  requested_email text, requested_phone text, requested_expires_at timestamptz
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare raw_token text:=encode(extensions.gen_random_bytes(32),'hex'); invitation_uuid uuid;
begin
  if not public.is_org_member(requested_organization_id,array['owner']::public.membership_role[]) then raise exception 'forbidden'; end if;
  if requested_role not in ('manager','tenant') then raise exception 'invalid_role'; end if;
  insert into public.invitations(organization_id,resident_id,role,email_normalized,phone_e164,token_hash,expires_at,invited_by)
  values(requested_organization_id,requested_resident_id,requested_role,lower(trim(requested_email)),requested_phone,
    encode(extensions.digest(raw_token,'sha256'),'hex'),requested_expires_at,auth.uid()) returning id into invitation_uuid;
  return jsonb_build_object('id',invitation_uuid,'token',raw_token,'expiresAt',requested_expires_at);
end $$;

create or replace function public.accept_invitation(raw_token text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare invitation_row record; membership_uuid uuid;
begin
  select * into invitation_row from public.invitations
    where token_hash=encode(extensions.digest(raw_token,'sha256'),'hex') for update;
  if invitation_row.id is null or invitation_row.accepted_at is not null or invitation_row.expires_at<=now() then raise exception 'invitation_invalid_or_expired'; end if;
  insert into public.organization_memberships(organization_id,profile_id,role,status,invited_at,joined_at)
    values(invitation_row.organization_id,auth.uid(),invitation_row.role,'active',invitation_row.created_at,now())
    on conflict(organization_id,profile_id) do update set role=excluded.role,status='active',joined_at=now()
    returning id into membership_uuid;
  if invitation_row.role='tenant' and invitation_row.resident_id is not null then
    update public.residents set profile_id=auth.uid() where id=invitation_row.resident_id and profile_id is null;
  end if;
  update public.invitations set accepted_at=now() where id=invitation_row.id;
  return membership_uuid;
end $$;

create or replace function public.notify_payment_decision() returns trigger
language plpgsql security definer set search_path='' as $$
declare recipient uuid;
begin
  if old.status='submitted' and new.status in ('approved','rejected') then
    select profile_id into recipient from public.residents where id=new.payer_resident_id;
    if recipient is not null then insert into public.notifications(organization_id,recipient_profile_id,notification_type,title,body,deep_link_path)
      values(new.organization_id,recipient,'payment_decision',case when new.status='approved' then 'Payment approved' else 'Payment rejected' end,
      case when new.status='approved' then 'Your payment was approved and allocated.' else coalesce(new.decision_reason,'Your payment was rejected.') end,'/(tenant)/payments'); end if;
  end if; return new;
end $$;
create trigger payments_notify_decision after update of status on public.payments for each row execute function public.notify_payment_decision();

create or replace function public.record_complaint_creation() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  insert into public.complaint_events(organization_id,complaint_id,actor_id,event_type,new_status,note)
  values(new.organization_id,new.id,auth.uid(),'created',new.status,'Complaint created');
  return new;
end $$;
create trigger complaints_record_creation after insert on public.complaints for each row execute function public.record_complaint_creation();

create or replace function public.notify_notice() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  insert into public.notifications(organization_id,recipient_profile_id,notification_type,title,body,deep_link_path)
  select new.organization_id,m.profile_id,'notice',new.title,new.body,'/(tenant)'
  from public.organization_memberships m where m.organization_id=new.organization_id and m.status='active' and m.profile_id<>new.author_id;
  return new;
end $$;
create trigger notices_notify_members after insert on public.notices for each row execute function public.notify_notice();

create or replace function public.owner_dashboard(requested_organization_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
select case when not public.is_org_member(requested_organization_id,array['owner','manager']::public.membership_role[]) then null else jsonb_build_object(
  'propertyCount',(select count(*) from public.properties where organization_id=requested_organization_id and status='active'),
  'occupiedBeds',(select count(*) from public.occupancy_assignments where organization_id=requested_organization_id and ends_at is null),
  'capacity',(select coalesce(sum(capacity),0) from public.rooms where organization_id=requested_organization_id and status='active'),
  'expectedPaise',(select coalesce(sum(total_paise),0) from public.invoices where organization_id=requested_organization_id and period_start=date_trunc('month',current_date)::date and status<>'void'),
  'collectedPaise',(select coalesce(sum(paid_paise),0) from public.invoices where organization_id=requested_organization_id and period_start=date_trunc('month',current_date)::date and status<>'void'),
  'outstandingPaise',(select coalesce(sum(balance_paise),0) from public.invoices where organization_id=requested_organization_id and status in ('issued','partially_paid','overdue')),
  'pendingApprovals',(select count(*) from public.payments where organization_id=requested_organization_id and status='submitted'),
  'openComplaints',(select count(*) from public.complaints where organization_id=requested_organization_id and status in ('open','assigned','in_progress','reopened'))
) end $$;

grant execute on function public.create_tenancy_with_assignment(uuid,uuid,uuid,uuid,uuid,date,integer,bigint,bigint,text) to authenticated;
grant execute on function public.transfer_occupancy(uuid,uuid,uuid,timestamptz,text,text) to authenticated;
grant execute on function public.generate_monthly_invoices(uuid,date) to authenticated;
grant execute on function public.submit_payment(uuid,bigint,public.payment_method,date,text,text,text) to authenticated;
grant execute on function public.decide_payment(uuid,boolean,text,jsonb) to authenticated;
grant execute on function public.transition_complaint(uuid,public.complaint_status,text) to authenticated;
grant execute on function public.owner_dashboard(uuid) to authenticated;
grant execute on function public.create_invitation(uuid,uuid,public.membership_role,text,text,timestamptz) to authenticated;
grant execute on function public.accept_invitation(text) to authenticated;

do $$ declare table_name text; begin
  foreach table_name in array array['invitations','property_media','residents','tenancies','occupancy_assignments','invoices','invoice_items','payments','payment_allocations','receipts','complaints','complaint_events','attachments','notices','notice_targets','notice_reads','documents','notifications','push_devices','audit_logs']
  loop execute format('alter table public.%I enable row level security',table_name); end loop;
end $$;

-- Organization operators manage business rows; tenants receive explicit own-record read policies below.
do $$ declare table_name text; begin
  foreach table_name in array array['invitations','property_media','residents','tenancies','occupancy_assignments','invoices','invoice_items','payments','payment_allocations','receipts','complaints','complaint_events','attachments','notices','notice_targets','documents','audit_logs']
  loop
    execute format('create policy %I on public.%I for all to authenticated using (public.is_org_member(organization_id,array[''owner'',''manager'']::public.membership_role[])) with check (public.is_org_member(organization_id,array[''owner'',''manager'']::public.membership_role[]))',table_name||'_operator',table_name);
  end loop;
end $$;

create policy residents_tenant_read on public.residents for select to authenticated using(profile_id=auth.uid());
create policy tenancies_tenant_read on public.tenancies for select to authenticated using(public.is_linked_resident(resident_id));
create policy occupancy_tenant_read on public.occupancy_assignments for select to authenticated using(exists(select 1 from public.tenancies t where t.id=tenancy_id and public.is_linked_resident(t.resident_id)));
create policy invoices_tenant_read on public.invoices for select to authenticated using(exists(select 1 from public.tenancies t where t.id=tenancy_id and public.is_linked_resident(t.resident_id)));
create policy invoice_items_tenant_read on public.invoice_items for select to authenticated using(exists(select 1 from public.invoices i join public.tenancies t on t.id=i.tenancy_id where i.id=invoice_id and public.is_linked_resident(t.resident_id)));
create policy payments_tenant_read on public.payments for select to authenticated using(public.is_linked_resident(payer_resident_id));
create policy receipts_tenant_read on public.receipts for select to authenticated using(exists(select 1 from public.payments p where p.id=payment_id and public.is_linked_resident(p.payer_resident_id)));
create policy complaints_tenant_manage on public.complaints for select to authenticated using(public.is_linked_resident(resident_id));
create policy complaints_tenant_insert on public.complaints for insert to authenticated with check(
  public.is_linked_resident(resident_id)
  and exists(select 1 from public.residents r where r.id=resident_id and r.organization_id=organization_id)
  and exists(select 1 from public.properties p where p.id=property_id and p.organization_id=organization_id)
);
create policy complaint_events_tenant_read on public.complaint_events for select to authenticated using(exists(select 1 from public.complaints c where c.id=complaint_id and public.is_linked_resident(c.resident_id)));
create policy notices_member_read on public.notices for select to authenticated using(public.is_org_member(organization_id));
create policy notice_targets_member_read on public.notice_targets for select to authenticated using(public.is_org_member(organization_id));
create policy notice_reads_self on public.notice_reads for all to authenticated using(profile_id=auth.uid()) with check(profile_id=auth.uid());
create policy documents_tenant_read on public.documents for select to authenticated using(profile_id=auth.uid() or exists(select 1 from public.residents r where r.id=resident_id and r.profile_id=auth.uid()));
create policy notifications_self on public.notifications for select to authenticated using(recipient_profile_id=auth.uid());
create policy notifications_self_update on public.notifications for update to authenticated using(recipient_profile_id=auth.uid()) with check(recipient_profile_id=auth.uid());
create policy push_devices_self on public.push_devices for all to authenticated using(profile_id=auth.uid()) with check(profile_id=auth.uid());

revoke all on public.invitations,public.property_media,public.residents,public.tenancies,
  public.occupancy_assignments,public.invoices,public.invoice_items,public.payments,
  public.payment_allocations,public.receipts,public.complaints,public.complaint_events,
  public.attachments,public.notices,public.notice_targets,public.notice_reads,
  public.documents,public.notifications,public.push_devices,public.audit_logs from authenticated;

grant select on public.invitations,public.property_media,public.residents,public.tenancies,
  public.occupancy_assignments,public.invoices,public.invoice_items,public.payments,
  public.payment_allocations,public.receipts,public.complaints,public.complaint_events,
  public.attachments,public.notices,public.notice_targets,public.notice_reads,
  public.documents,public.notifications,public.push_devices,public.audit_logs to authenticated;
grant insert,update,delete on public.property_media,public.residents,public.notices,
  public.notice_targets,public.notice_reads,public.documents,public.push_devices to authenticated;
grant insert,delete on public.attachments to authenticated;
grant insert on public.complaints to authenticated;
grant update (read_at) on public.notifications to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
  ('payment-proofs','payment-proofs',false,10485760,array['image/jpeg','image/png','image/heic']),
  ('complaint-attachments','complaint-attachments',false,10485760,array['image/jpeg','image/png','image/heic']),
  ('resident-documents','resident-documents',false,15728640,array['application/pdf','image/jpeg','image/png'])
on conflict(id) do nothing;
create policy storage_business_read on storage.objects for select to authenticated using(
  (bucket_id in ('payment-proofs','complaint-attachments') and (
    public.is_org_member(((storage.foldername(name))[1])::uuid,array['owner','manager']::public.membership_role[])
    or (storage.foldername(name))[2]=auth.uid()::text
  ))
  or (bucket_id='resident-documents' and exists(
    select 1 from public.documents d where d.storage_path=name and (
      public.is_org_member(d.organization_id,array['owner','manager']::public.membership_role[])
      or d.profile_id=auth.uid()
      or exists(select 1 from public.residents r where r.id=d.resident_id and r.profile_id=auth.uid())
    )
  ))
);
create policy storage_business_insert on storage.objects for insert to authenticated with check(
  bucket_id in ('payment-proofs','complaint-attachments','resident-documents')
  and public.is_org_member(((storage.foldername(name))[1])::uuid)
  and (storage.foldername(name))[2]=auth.uid()::text
);
