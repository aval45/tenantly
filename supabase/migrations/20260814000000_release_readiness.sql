begin;

-- Property-scoped manager invitations. The existing property_memberships table is
-- the canonical membership-to-property mapping, so do not duplicate it.
alter table public.invitations
  add constraint invitations_id_organization_unique unique (id, organization_id);

create table public.invitation_properties (
  invitation_id uuid not null,
  organization_id uuid not null,
  property_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (invitation_id, property_id),
  foreign key (invitation_id, organization_id)
    references public.invitations(id, organization_id) on delete cascade,
  foreign key (property_id, organization_id)
    references public.properties(id, organization_id) on delete cascade
);

alter table public.payments
  add column submitted_invoice_id uuid references public.invoices(id) on delete restrict;
create index payments_submitted_invoice_idx on public.payments(submitted_invoice_id);

-- Cross-organization identifiers must agree even for service-role writes.
alter table public.residents add constraint residents_id_organization_unique unique(id,organization_id);
alter table public.tenancies add constraint tenancies_id_organization_unique unique(id,organization_id);
alter table public.invoices add constraint invoices_id_organization_unique unique(id,organization_id);
alter table public.payments add constraint payments_id_organization_unique unique(id,organization_id);
alter table public.notices add constraint notices_id_organization_unique unique(id,organization_id);
alter table public.beds add constraint beds_id_organization_unique unique(id,organization_id);

alter table public.invitations
  add constraint invitations_resident_organization_fk foreign key(resident_id,organization_id) references public.residents(id,organization_id);

alter table public.tenancies
  add constraint tenancies_resident_organization_fk foreign key(resident_id,organization_id) references public.residents(id,organization_id),
  add constraint tenancies_property_organization_fk foreign key(property_id,organization_id) references public.properties(id,organization_id);
alter table public.occupancy_assignments
  add constraint occupancy_tenancy_organization_fk foreign key(tenancy_id,organization_id) references public.tenancies(id,organization_id),
  add constraint occupancy_room_organization_fk foreign key(room_id,organization_id) references public.rooms(id,organization_id),
  add constraint occupancy_bed_organization_fk foreign key(bed_id,organization_id) references public.beds(id,organization_id);
alter table public.invoices
  add constraint invoices_tenancy_organization_fk foreign key(tenancy_id,organization_id) references public.tenancies(id,organization_id),
  add constraint invoices_property_organization_fk foreign key(property_id,organization_id) references public.properties(id,organization_id);
alter table public.payments
  add constraint payments_resident_organization_fk foreign key(payer_resident_id,organization_id) references public.residents(id,organization_id),
  add constraint payments_invoice_organization_fk foreign key(submitted_invoice_id,organization_id) references public.invoices(id,organization_id);
alter table public.payment_allocations
  add constraint allocations_payment_organization_fk foreign key(payment_id,organization_id) references public.payments(id,organization_id),
  add constraint allocations_invoice_organization_fk foreign key(invoice_id,organization_id) references public.invoices(id,organization_id);
alter table public.complaints
  add constraint complaints_tenancy_organization_fk foreign key(tenancy_id,organization_id) references public.tenancies(id,organization_id),
  add constraint complaints_resident_organization_fk foreign key(resident_id,organization_id) references public.residents(id,organization_id),
  add constraint complaints_property_organization_fk foreign key(property_id,organization_id) references public.properties(id,organization_id),
  add constraint complaints_room_organization_fk foreign key(room_id,organization_id) references public.rooms(id,organization_id);
alter table public.notice_targets
  add constraint notice_targets_notice_organization_fk foreign key(notice_id,organization_id) references public.notices(id,organization_id);
alter table public.documents
  add constraint documents_resident_organization_fk foreign key(resident_id,organization_id) references public.residents(id,organization_id);

create or replace function public.validate_notice_target()
returns trigger language plpgsql set search_path='' as $$
begin
  if (new.target_type='organization' and new.target_id<>new.organization_id)
     or (new.target_type='property' and not exists(select 1 from public.properties p where p.id=new.target_id and p.organization_id=new.organization_id))
     or (new.target_type='room' and not exists(select 1 from public.rooms r where r.id=new.target_id and r.organization_id=new.organization_id))
     or (new.target_type='resident' and not exists(select 1 from public.residents r where r.id=new.target_id and r.organization_id=new.organization_id))
    then raise exception 'invalid_notice_target'; end if;
  return new;
end $$;
create trigger notice_targets_validate before insert or update on public.notice_targets
for each row execute function public.validate_notice_target();

alter table public.invitation_properties enable row level security;

create or replace function public.is_org_owner(requested_organization_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_org_member(
    requested_organization_id,
    array['owner']::public.membership_role[]
  )
$$;

create or replace function public.can_access_property(requested_property_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.properties p
    join public.organization_memberships m
      on m.organization_id = p.organization_id
     and m.profile_id = auth.uid()
     and m.status = 'active'
    left join public.property_memberships pm
      on pm.organization_membership_id = m.id
     and pm.property_id = p.id
    where p.id = requested_property_id
      and (
        m.role = 'owner'
        or (m.role in ('manager','maintenance_staff') and pm.id is not null)
      )
  )
$$;

create or replace function public.can_access_resident(requested_resident_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.residents r
    where r.id = requested_resident_id
      and (
        r.profile_id = auth.uid()
        or public.is_org_owner(r.organization_id)
        or exists (
          select 1 from public.tenancies t
          where t.resident_id = r.id and public.can_access_property(t.property_id)
        )
      )
  )
$$;

create or replace function public.can_read_profile(requested_profile_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select requested_profile_id = auth.uid()
    or exists (
      select 1 from public.organization_memberships viewer
      join public.organization_memberships subject
        on subject.organization_id=viewer.organization_id
       and subject.profile_id=requested_profile_id
       and subject.status='active'
      where viewer.profile_id=auth.uid() and viewer.status='active' and viewer.role='owner'
    )
    or exists (
      select 1 from public.residents r
      where r.profile_id=requested_profile_id and public.can_access_resident(r.id)
    )
$$;

create or replace function public.can_access_payment(requested_payment_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.payments p
    where p.id = requested_payment_id
      and (
        public.is_linked_resident(p.payer_resident_id)
        or public.is_org_owner(p.organization_id)
        or exists (
          select 1 from public.invoices i
          where i.id = p.submitted_invoice_id and public.can_access_property(i.property_id)
        )
        or exists (
          select 1 from public.payment_allocations pa
          join public.invoices i on i.id = pa.invoice_id
          where pa.payment_id = p.id and public.can_access_property(i.property_id)
        )
      )
  )
$$;

create or replace function public.can_read_notice(requested_notice_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.notices n
    join public.notice_targets nt on nt.notice_id = n.id
    where n.id = requested_notice_id
      and (
        public.is_org_owner(n.organization_id)
        or (nt.target_type = 'organization' and public.is_org_member(n.organization_id))
        or (nt.target_type = 'property' and (
          public.can_access_property(nt.target_id)
          or exists (
            select 1 from public.tenancies t join public.residents r on r.id=t.resident_id
            where t.property_id=nt.target_id and t.status='active' and r.profile_id=auth.uid()
          )
        ))
        or (nt.target_type = 'room' and exists (
          select 1 from public.rooms r
          where r.id = nt.target_id and (
            public.can_access_property(r.property_id)
            or exists (
              select 1 from public.occupancy_assignments oa
              join public.tenancies t on t.id=oa.tenancy_id
              join public.residents resident on resident.id=t.resident_id
              where oa.room_id=r.id and oa.ends_at is null and resident.profile_id=auth.uid()
            )
          )
        ))
        or (nt.target_type = 'resident' and public.can_access_resident(nt.target_id))
      )
  )
$$;

revoke all on function public.is_org_owner(uuid) from public;
revoke all on function public.can_access_resident(uuid) from public;
revoke all on function public.can_read_profile(uuid) from public;
revoke all on function public.can_access_payment(uuid) from public;
revoke all on function public.can_read_notice(uuid) from public;
grant execute on function public.is_org_owner(uuid) to authenticated;
grant execute on function public.can_access_resident(uuid) to authenticated;
grant execute on function public.can_read_profile(uuid) to authenticated;
grant execute on function public.can_access_payment(uuid) to authenticated;
grant execute on function public.can_read_notice(uuid) to authenticated;

-- Prevent an organization from losing its final active owner.
create or replace function public.protect_last_owner()
returns trigger language plpgsql security definer set search_path = '' as $$
declare remaining integer;
begin
  if old.role = 'owner' and old.status = 'active'
     and (tg_op = 'DELETE' or new.role <> 'owner' or new.status <> 'active') then
    perform 1 from public.organizations where id = old.organization_id for update;
    select count(*) into remaining
    from public.organization_memberships m
    where m.organization_id = old.organization_id
      and m.role = 'owner' and m.status = 'active' and m.id <> old.id;
    if remaining = 0 then raise exception 'last_owner_required'; end if;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end $$;

create trigger organization_memberships_protect_last_owner
before update or delete on public.organization_memberships
for each row execute function public.protect_last_owner();

-- Invitations are owner-created, email-bound, single-use, and server-expiring.
drop function if exists public.create_invitation(
  uuid, uuid, public.membership_role, text, text, timestamptz
);

create or replace function public.create_invitation(
  requested_organization_id uuid,
  requested_resident_id uuid,
  requested_role public.membership_role,
  requested_email text,
  requested_property_ids uuid[] default array[]::uuid[]
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  raw_token text := encode(extensions.gen_random_bytes(32), 'hex');
  invitation_uuid uuid;
  normalized_email text := lower(trim(requested_email));
  expires_at_value timestamptz := now() + interval '7 days';
begin
  if not public.is_org_owner(requested_organization_id) then raise exception 'forbidden'; end if;
  if requested_role not in ('manager','tenant') then raise exception 'invalid_role'; end if;
  if normalized_email is null or normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    then raise exception 'valid_email_required'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(requested_organization_id::text||':'||normalized_email,0));

  if requested_role = 'tenant' then
    if requested_resident_id is null or coalesce(cardinality(requested_property_ids), 0) <> 0
      then raise exception 'invalid_tenant_invitation'; end if;
    if not exists (
      select 1 from public.residents r
      where r.id = requested_resident_id
        and r.organization_id = requested_organization_id
        and r.profile_id is null
    ) then raise exception 'resident_unavailable'; end if;
  else
    if requested_resident_id is not null or coalesce(cardinality(requested_property_ids), 0) = 0
      then raise exception 'manager_properties_required'; end if;
    if exists (
      select 1 from unnest(requested_property_ids) requested_id
      where not exists (
        select 1 from public.properties p
        where p.id = requested_id and p.organization_id = requested_organization_id
      )
    ) then raise exception 'invalid_manager_property'; end if;
  end if;

  if exists (
    select 1 from public.invitations i
    where i.organization_id = requested_organization_id
      and i.email_normalized = normalized_email
      and i.accepted_at is null and i.expires_at > now()
  ) then raise exception 'active_invitation_exists'; end if;

  insert into public.invitations(
    organization_id,resident_id,role,email_normalized,phone_e164,
    token_hash,expires_at,invited_by
  ) values (
    requested_organization_id,requested_resident_id,requested_role,
    normalized_email,null,encode(extensions.digest(raw_token,'sha256'),'hex'),
    expires_at_value,auth.uid()
  ) returning id into invitation_uuid;

  if requested_role = 'manager' then
    insert into public.invitation_properties(invitation_id,organization_id,property_id)
    select invitation_uuid,requested_organization_id,requested_id
    from (select distinct unnest(requested_property_ids) requested_id) properties;
  end if;

  return jsonb_build_object('id',invitation_uuid,'token',raw_token,'expiresAt',expires_at_value);
end $$;

create or replace function public.accept_invitation(raw_token text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  invitation_row public.invitations%rowtype;
  membership_uuid uuid;
  existing_membership public.organization_memberships%rowtype;
  authenticated_email text := lower(trim(coalesce(auth.jwt()->>'email','')));
  linked_count integer;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select * into invitation_row from public.invitations
  where token_hash = encode(extensions.digest(raw_token,'sha256'),'hex') for update;
  if invitation_row.id is null or invitation_row.accepted_at is not null or invitation_row.expires_at <= now()
    then raise exception 'invitation_invalid_or_expired'; end if;
  if not exists (select 1 from auth.users u where u.id=auth.uid() and u.email_confirmed_at is not null)
    then raise exception 'verified_email_required'; end if;
  if authenticated_email = '' or authenticated_email <> invitation_row.email_normalized
    then raise exception 'invitation_email_mismatch'; end if;

  select * into existing_membership from public.organization_memberships
  where organization_id = invitation_row.organization_id and profile_id = auth.uid();
  if existing_membership.id is not null and existing_membership.role <> invitation_row.role
    then raise exception 'membership_role_conflict'; end if;

  insert into public.organization_memberships(
    organization_id,profile_id,role,status,invited_at,joined_at
  ) values (
    invitation_row.organization_id,auth.uid(),invitation_row.role,'active',
    invitation_row.created_at,now()
  ) on conflict(organization_id,profile_id) do update
    set status='active',joined_at=now(),updated_at=now()
  returning id into membership_uuid;

  if invitation_row.role = 'tenant' then
    update public.residents set profile_id = auth.uid()
    where id = invitation_row.resident_id
      and organization_id = invitation_row.organization_id
      and profile_id is null;
    get diagnostics linked_count = row_count;
    if linked_count <> 1 then raise exception 'resident_unavailable'; end if;
  else
    insert into public.property_memberships(
      organization_id,organization_membership_id,property_id,role_override
    )
    select ip.organization_id,membership_uuid,ip.property_id,'manager'
    from public.invitation_properties ip where ip.invitation_id = invitation_row.id
    on conflict(organization_membership_id,property_id) do update set role_override='manager';
  end if;

  update public.invitations set accepted_at = now() where id = invitation_row.id;
  return membership_uuid;
end $$;

-- Payment submission is tied to one invoice and fully idempotent.
create or replace function public.submit_payment(
  requested_invoice_id uuid,
  requested_amount_paise bigint,
  requested_method public.payment_method,
  requested_paid_on date,
  requested_reference text,
  requested_proof_path text,
  request_idempotency_key text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare inv public.invoices%rowtype; resident_uuid uuid; payment_row public.payments%rowtype;
begin
  select i.* into inv from public.invoices i where i.id=requested_invoice_id for update;
  if inv.id is null then raise exception 'invoice_not_found'; end if;
  select t.resident_id into resident_uuid from public.tenancies t where t.id=inv.tenancy_id;
  if not public.is_linked_resident(resident_uuid) then raise exception 'forbidden'; end if;
  if requested_amount_paise <= 0 or requested_amount_paise > inv.balance_paise
    then raise exception 'invalid_payment_amount'; end if;
  if requested_method in ('upi','bank_transfer') and nullif(trim(requested_proof_path),'') is null
    then raise exception 'payment_proof_required'; end if;
  if requested_proof_path is not null and (
    split_part(requested_proof_path,'/',1)<>inv.organization_id::text
    or split_part(requested_proof_path,'/',2)<>auth.uid()::text
    or not exists(select 1 from storage.objects o where o.bucket_id='payment-proofs' and o.name=requested_proof_path)
  ) then raise exception 'invalid_payment_proof'; end if;
  if char_length(request_idempotency_key) not between 8 and 128
    then raise exception 'invalid_idempotency_key'; end if;

  select * into payment_row from public.payments
  where organization_id=inv.organization_id and idempotency_key=request_idempotency_key;
  if payment_row.id is not null then
    if payment_row.submitted_invoice_id <> inv.id
       or payment_row.amount_paise <> requested_amount_paise
       or payment_row.method <> requested_method
      then raise exception 'idempotency_conflict'; end if;
    return payment_row.id;
  end if;

  insert into public.payments(
    organization_id,payer_resident_id,submitted_invoice_id,amount_paise,currency,
    method,paid_on,transaction_reference,proof_storage_path,submitted_by,idempotency_key
  ) values (
    inv.organization_id,resident_uuid,inv.id,requested_amount_paise,inv.currency,
    requested_method,requested_paid_on,nullif(trim(requested_reference),''),
    nullif(trim(requested_proof_path),''),auth.uid(),request_idempotency_key
  ) returning * into payment_row;
  return payment_row.id;
end $$;

create or replace function public.decide_payment(
  requested_payment_id uuid,
  approve boolean,
  reason text,
  allocations jsonb default '[]'::jsonb
) returns uuid language plpgsql security definer set search_path = '' as $$
declare p public.payments%rowtype; allocation jsonb; allocation_total bigint:=0;
  receipt_uuid uuid; inv public.invoices%rowtype; seen_ids uuid[]:=array[]::uuid[];
  allocation_amount bigint; allocation_invoice_id uuid;
begin
  select * into p from public.payments where id=requested_payment_id for update;
  if p.id is null
     or not public.is_org_member(p.organization_id,array['owner','manager']::public.membership_role[])
     or not public.can_access_payment(p.id) then raise exception 'forbidden'; end if;
  if p.status <> 'submitted' then raise exception 'payment_already_decided'; end if;
  if not approve then
    if char_length(trim(coalesce(reason,''))) < 3 then raise exception 'rejection_reason_required'; end if;
    update public.payments set status='rejected',decision_reason=trim(reason),decided_by=auth.uid(),decided_at=now() where id=p.id;
    insert into public.audit_logs(organization_id,actor_id,action,entity_type,entity_id,after_data)
      values(p.organization_id,auth.uid(),'payment.rejected','payment',p.id,jsonb_build_object('reason',trim(reason)));
    return null;
  end if;

  if jsonb_typeof(allocations) <> 'array' or jsonb_array_length(allocations)=0
    then raise exception 'allocations_required'; end if;
  for allocation in select * from jsonb_array_elements(allocations) loop
    allocation_invoice_id := (allocation->>'invoiceId')::uuid;
    allocation_amount := (allocation->>'amountPaise')::bigint;
    if allocation_amount <= 0 or allocation_invoice_id = any(seen_ids)
      then raise exception 'invalid_allocation'; end if;
    seen_ids := array_append(seen_ids,allocation_invoice_id);
    select * into inv from public.invoices where id=allocation_invoice_id for update;
    if inv.id is null or inv.organization_id<>p.organization_id
       or inv.balance_paise<allocation_amount
       or not exists (
         select 1 from public.tenancies t
         where t.id=inv.tenancy_id and t.resident_id=p.payer_resident_id
       ) then raise exception 'invalid_allocation'; end if;
    allocation_total := allocation_total + allocation_amount;
    insert into public.payment_allocations(organization_id,payment_id,invoice_id,amount_paise)
      values(p.organization_id,p.id,inv.id,allocation_amount);
    update public.invoices set paid_paise=paid_paise+allocation_amount,
      status=case when paid_paise+allocation_amount>=total_paise then 'paid'::public.invoice_status else 'partially_paid'::public.invoice_status end
      where id=inv.id;
  end loop;
  if allocation_total <> p.amount_paise then raise exception 'allocation_total_mismatch'; end if;

  update public.payments set status='approved',decision_reason=nullif(trim(reason),''),decided_by=auth.uid(),decided_at=now() where id=p.id;
  insert into public.receipts(organization_id,payment_id,receipt_number)
    values(p.organization_id,p.id,'RCT-'||to_char(now(),'YYYYMMDD')||'-'||upper(substr(replace(p.id::text,'-',''),1,8)))
    returning id into receipt_uuid;
  insert into public.audit_logs(organization_id,actor_id,action,entity_type,entity_id,after_data)
    values(p.organization_id,auth.uid(),'payment.approved','payment',p.id,jsonb_build_object('allocationTotalPaise',allocation_total,'receiptId',receipt_uuid));
  return receipt_uuid;
end $$;

-- Atomic complaint creation and server-owned attachment metadata.
create or replace function public.create_complaint_with_attachment(
  requested_tenancy_id uuid,
  requested_category text,
  requested_priority public.complaint_priority,
  requested_title text,
  requested_description text,
  requested_storage_path text default null,
  requested_media_type text default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare t public.tenancies%rowtype; resident_profile uuid; complaint_uuid uuid; active_room uuid;
begin
  select * into t from public.tenancies where id=requested_tenancy_id;
  if t.id is null then raise exception 'tenancy_not_found'; end if;
  select profile_id into resident_profile from public.residents where id=t.resident_id;
  if resident_profile <> auth.uid() then raise exception 'forbidden'; end if;
  select room_id into active_room from public.occupancy_assignments where tenancy_id=t.id and ends_at is null;
  if char_length(trim(requested_title)) not between 3 and 160
     or char_length(trim(requested_description)) not between 3 and 4000
    then raise exception 'invalid_complaint'; end if;
  if (requested_storage_path is null) <> (requested_media_type is null)
    then raise exception 'invalid_attachment'; end if;
  if requested_storage_path is not null and (
    split_part(requested_storage_path,'/',1) <> t.organization_id::text
    or split_part(requested_storage_path,'/',2) <> auth.uid()::text
    or requested_media_type not in ('image/jpeg','image/png','image/heic')
    or not exists(select 1 from storage.objects o where o.bucket_id='complaint-attachments' and o.name=requested_storage_path)
  ) then raise exception 'invalid_attachment'; end if;

  insert into public.complaints(
    organization_id,tenancy_id,resident_id,property_id,room_id,category,priority,title,description
  ) values (
    t.organization_id,t.id,t.resident_id,t.property_id,active_room,
    trim(requested_category),requested_priority,trim(requested_title),trim(requested_description)
  ) returning id into complaint_uuid;
  if requested_storage_path is not null then
    insert into public.attachments(organization_id,entity_type,entity_id,storage_path,media_type,uploaded_by)
      values(t.organization_id,'complaint',complaint_uuid,requested_storage_path,requested_media_type,auth.uid());
  end if;
  return complaint_uuid;
end $$;

create or replace function public.transition_complaint(
  requested_complaint_id uuid,
  requested_status public.complaint_status,
  transition_note text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare complaint_row public.complaints%rowtype; event_uuid uuid; is_tenant boolean;
begin
  select * into complaint_row from public.complaints where id=requested_complaint_id for update;
  if complaint_row.id is null then raise exception 'complaint_not_found'; end if;
  is_tenant := public.is_linked_resident(complaint_row.resident_id);
  if not ((public.is_org_member(complaint_row.organization_id,array['owner','manager']::public.membership_role[])
           and public.can_access_property(complaint_row.property_id)) or is_tenant)
    then raise exception 'forbidden'; end if;
  if is_tenant and requested_status<>'reopened' then raise exception 'tenant_can_only_reopen'; end if;
  if requested_status='reopened' and complaint_row.status not in ('resolved','closed') then raise exception 'invalid_transition'; end if;
  if not is_tenant and not (
    (complaint_row.status in ('open','reopened') and requested_status in ('assigned','in_progress','rejected')) or
    (complaint_row.status='assigned' and requested_status in ('in_progress','rejected')) or
    (complaint_row.status='in_progress' and requested_status in ('resolved','rejected')) or
    (complaint_row.status='resolved' and requested_status='closed')
  ) then raise exception 'invalid_transition'; end if;
  update public.complaints set status=requested_status,
    closed_at=case when requested_status='closed' then now() else null end
    where id=requested_complaint_id;
  insert into public.complaint_events(organization_id,complaint_id,actor_id,event_type,previous_status,new_status,note)
    values(complaint_row.organization_id,requested_complaint_id,auth.uid(),'status_changed',complaint_row.status,requested_status,nullif(trim(transition_note),''))
    returning id into event_uuid;
  return event_uuid;
end $$;

-- Atomic room and bed creation.
create or replace function public.create_room_with_beds(
  requested_organization_id uuid,
  requested_property_id uuid,
  requested_code text,
  requested_floor_label text,
  requested_room_type public.room_type,
  requested_rent_paise bigint,
  requested_deposit_paise bigint,
  requested_capacity integer
) returns uuid language plpgsql security definer set search_path = '' as $$
declare room_uuid uuid; bed_index integer;
begin
  if not public.is_org_member(requested_organization_id,array['owner','manager']::public.membership_role[])
     or not public.can_access_property(requested_property_id) then raise exception 'forbidden'; end if;
  if not exists(select 1 from public.properties where id=requested_property_id and organization_id=requested_organization_id)
    then raise exception 'invalid_property'; end if;
  if requested_capacity not between 1 and 100 or requested_rent_paise<0 or requested_deposit_paise<0
    then raise exception 'invalid_room'; end if;
  insert into public.rooms(
    organization_id,property_id,code,floor_label,room_type,default_rent_paise,default_deposit_paise,capacity
  ) values (
    requested_organization_id,requested_property_id,trim(requested_code),nullif(trim(requested_floor_label),''),
    requested_room_type,requested_rent_paise,requested_deposit_paise,requested_capacity
  ) returning id into room_uuid;
  if requested_room_type='shared' then
    for bed_index in 1..requested_capacity loop
      insert into public.beds(organization_id,room_id,code)
      values(requested_organization_id,room_uuid,'B'||bed_index::text);
    end loop;
  end if;
  return room_uuid;
end $$;

-- Register resident-document metadata without trusting client-owned actor fields.
create or replace function public.register_resident_document(
  requested_organization_id uuid,
  requested_resident_id uuid,
  requested_document_type text,
  requested_storage_path text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare document_uuid uuid;
begin
  if not public.is_org_member(requested_organization_id,array['owner','manager']::public.membership_role[])
     or not exists (
       select 1 from public.residents r
       where r.id=requested_resident_id and r.organization_id=requested_organization_id
         and (public.is_org_owner(requested_organization_id) or public.can_access_resident(r.id))
     ) then raise exception 'forbidden'; end if;
  if split_part(requested_storage_path,'/',1)<>requested_organization_id::text
     or split_part(requested_storage_path,'/',2)<>auth.uid()::text
     or requested_document_type not in ('resident_document','identity','agreement','other')
     or not exists(select 1 from storage.objects o where o.bucket_id='resident-documents' and o.name=requested_storage_path)
    then raise exception 'invalid_document'; end if;
  insert into public.documents(
    organization_id,resident_id,profile_id,document_type,storage_path,uploaded_by
  ) values (
    requested_organization_id,requested_resident_id,null,requested_document_type,requested_storage_path,auth.uid()
  ) returning id into document_uuid;
  return document_uuid;
end $$;

-- Publish notice and targets before deriving recipients.
drop trigger if exists notices_notify_members on public.notices;
drop function if exists public.notify_notice();

create or replace function public.publish_notice(
  requested_organization_id uuid,
  requested_title text,
  requested_body text,
  requested_is_pinned boolean,
  requested_target_type text,
  requested_target_ids uuid[]
) returns uuid language plpgsql security definer set search_path = '' as $$
declare notice_uuid uuid; target_id uuid;
begin
  if not public.is_org_member(requested_organization_id,array['owner','manager']::public.membership_role[])
    then raise exception 'forbidden'; end if;
  if requested_target_type not in ('organization','property','room','resident')
     or coalesce(cardinality(requested_target_ids),0)=0 then raise exception 'invalid_notice_target'; end if;
  if requested_target_type='organization' then
    if not public.is_org_owner(requested_organization_id)
       or cardinality(requested_target_ids)<>1
       or requested_target_ids[1]<>requested_organization_id
      then raise exception 'forbidden'; end if;
  elsif requested_target_type='property' then
    if exists(select 1 from unnest(requested_target_ids) id where not public.can_access_property(id))
      then raise exception 'forbidden'; end if;
  elsif requested_target_type='room' then
    if exists(select 1 from unnest(requested_target_ids) id where not exists(
      select 1 from public.rooms r where r.id=id and r.organization_id=requested_organization_id and public.can_access_property(r.property_id)
    )) then raise exception 'forbidden'; end if;
  else
    if exists(select 1 from unnest(requested_target_ids) id where not exists(
      select 1 from public.residents r where r.id=id and r.organization_id=requested_organization_id and public.can_access_resident(r.id)
    )) then raise exception 'forbidden'; end if;
  end if;
  insert into public.notices(organization_id,author_id,title,body,is_pinned,category)
    values(requested_organization_id,auth.uid(),trim(requested_title),trim(requested_body),requested_is_pinned,'general')
    returning id into notice_uuid;
  foreach target_id in array requested_target_ids loop
    insert into public.notice_targets(organization_id,notice_id,target_type,target_id)
      values(requested_organization_id,notice_uuid,requested_target_type,target_id)
      on conflict do nothing;
  end loop;

  insert into public.notifications(organization_id,recipient_profile_id,notification_type,title,body,deep_link_path)
  select distinct requested_organization_id,r.profile_id,'notice',trim(requested_title),trim(requested_body),'/(tenant)'
  from public.residents r
  join public.organization_memberships m
    on m.organization_id=r.organization_id and m.profile_id=r.profile_id and m.role='tenant' and m.status='active'
  where r.organization_id=requested_organization_id and r.profile_id is not null and (
    requested_target_type='organization'
    or (requested_target_type='resident' and r.id=any(requested_target_ids))
    or (requested_target_type='property' and exists(
      select 1 from public.tenancies t where t.resident_id=r.id and t.status='active' and t.property_id=any(requested_target_ids)
    ))
    or (requested_target_type='room' and exists(
      select 1 from public.tenancies t join public.occupancy_assignments oa on oa.tenancy_id=t.id and oa.ends_at is null
      where t.resident_id=r.id and oa.room_id=any(requested_target_ids)
    ))
  );
  return notice_uuid;
end $$;

-- Capacity checks serialize on the target room; existing partial indexes are the final guard.
create or replace function public.assert_room_available(requested_room_id uuid, requested_bed_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare target_room public.rooms%rowtype; resolved_bed uuid; active_count integer;
begin
  select * into target_room from public.rooms where id=requested_room_id and status='active' for update;
  if target_room.id is null or not public.can_access_property(target_room.property_id) then raise exception 'invalid_room'; end if;
  select count(*) into active_count from public.occupancy_assignments where room_id=target_room.id and ends_at is null;
  if active_count>=target_room.capacity then raise exception 'room_at_capacity'; end if;
  if target_room.room_type='shared' then
    if requested_bed_id is not null then
      select b.id into resolved_bed from public.beds b
      where b.id=requested_bed_id and b.room_id=target_room.id and b.status='active'
        and not exists(select 1 from public.occupancy_assignments oa where oa.bed_id=b.id and oa.ends_at is null);
    else
      select b.id into resolved_bed from public.beds b
      where b.room_id=target_room.id and b.status='active'
        and not exists(select 1 from public.occupancy_assignments oa where oa.bed_id=b.id and oa.ends_at is null)
      order by b.code limit 1;
    end if;
    if resolved_bed is null then raise exception 'bed_required_or_unavailable'; end if;
  elsif requested_bed_id is not null then raise exception 'bed_not_allowed'; end if;
  return resolved_bed;
end $$;

create or replace function public.create_tenancy_with_assignment(
  requested_organization_id uuid,
  requested_resident_id uuid,
  requested_property_id uuid,
  requested_room_id uuid,
  requested_bed_id uuid,
  requested_start_date date,
  requested_due_day integer,
  requested_rent_paise bigint,
  requested_deposit_paise bigint,
  request_idempotency_key text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare tenancy_uuid uuid; resolved_bed_id uuid;
begin
  if not public.is_org_member(requested_organization_id,array['owner','manager']::public.membership_role[])
     or not public.can_access_property(requested_property_id) then raise exception 'forbidden'; end if;
  select id into tenancy_uuid from public.tenancies
    where organization_id=requested_organization_id and idempotency_key=request_idempotency_key;
  if tenancy_uuid is not null then return tenancy_uuid; end if;
  if not exists(select 1 from public.residents where id=requested_resident_id and organization_id=requested_organization_id)
     or not exists(select 1 from public.properties where id=requested_property_id and organization_id=requested_organization_id)
     or not exists(select 1 from public.rooms where id=requested_room_id and property_id=requested_property_id and organization_id=requested_organization_id)
    then raise exception 'invalid_organization_inventory'; end if;
  resolved_bed_id := public.assert_room_available(requested_room_id,requested_bed_id);
  insert into public.tenancies(
    organization_id,resident_id,property_id,start_date,due_day,rent_paise,deposit_paise,status,idempotency_key
  ) values (
    requested_organization_id,requested_resident_id,requested_property_id,requested_start_date,
    requested_due_day,requested_rent_paise,requested_deposit_paise,'active',request_idempotency_key
  ) on conflict(organization_id,idempotency_key) do update set updated_at=public.tenancies.updated_at
  returning id into tenancy_uuid;
  if not exists(select 1 from public.occupancy_assignments where tenancy_id=tenancy_uuid and ends_at is null) then
    insert into public.occupancy_assignments(organization_id,tenancy_id,room_id,bed_id,starts_at,created_by)
      values(requested_organization_id,tenancy_uuid,requested_room_id,resolved_bed_id,requested_start_date::timestamptz,auth.uid());
  end if;
  return tenancy_uuid;
end $$;

create or replace function public.transfer_occupancy(
  requested_tenancy_id uuid,
  requested_room_id uuid,
  requested_bed_id uuid,
  effective_at timestamptz,
  transfer_reason text,
  request_idempotency_key text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare tenancy_row public.tenancies%rowtype; assignment_id uuid; resolved_bed_id uuid;
begin
  select * into tenancy_row from public.tenancies where id=requested_tenancy_id for update;
  if tenancy_row.id is null
     or not public.is_org_member(tenancy_row.organization_id,array['owner','manager']::public.membership_role[])
     or not public.can_access_property(tenancy_row.property_id) then raise exception 'forbidden'; end if;
  select entity_id into assignment_id from public.audit_logs
    where organization_id=tenancy_row.organization_id and request_id=request_idempotency_key;
  if found then return assignment_id; end if;

  if requested_room_id is null then
    update public.occupancy_assignments set ends_at=effective_at,reason=transfer_reason
      where tenancy_id=requested_tenancy_id and ends_at is null;
    update public.tenancies set status='ended',end_date=effective_at::date where id=requested_tenancy_id;
    insert into public.audit_logs(organization_id,actor_id,action,entity_type,entity_id,request_id)
      values(tenancy_row.organization_id,auth.uid(),'occupancy.vacated','tenancy',requested_tenancy_id,request_idempotency_key);
    return null;
  end if;

  if not exists(select 1 from public.rooms where id=requested_room_id and property_id=tenancy_row.property_id)
    then raise exception 'cross_property_transfer_requires_new_tenancy'; end if;
  resolved_bed_id := public.assert_room_available(requested_room_id,requested_bed_id);
  update public.occupancy_assignments set ends_at=effective_at,reason=transfer_reason
    where tenancy_id=requested_tenancy_id and ends_at is null;
  insert into public.occupancy_assignments(organization_id,tenancy_id,room_id,bed_id,starts_at,reason,created_by)
    values(tenancy_row.organization_id,requested_tenancy_id,requested_room_id,resolved_bed_id,effective_at,transfer_reason,auth.uid())
    returning id into assignment_id;
  insert into public.audit_logs(organization_id,actor_id,action,entity_type,entity_id,request_id)
    values(tenancy_row.organization_id,auth.uid(),'occupancy.transferred','occupancy_assignment',assignment_id,request_idempotency_key);
  return assignment_id;
end $$;

create or replace function public.owner_dashboard(requested_organization_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
select case when not public.is_org_member(requested_organization_id,array['owner','manager']::public.membership_role[]) then null else jsonb_build_object(
  'propertyCount',(select count(*) from public.properties p where p.organization_id=requested_organization_id and p.status='active' and public.can_access_property(p.id)),
  'occupiedBeds',(select count(*) from public.occupancy_assignments oa join public.rooms r on r.id=oa.room_id where oa.organization_id=requested_organization_id and oa.ends_at is null and public.can_access_property(r.property_id)),
  'capacity',(select coalesce(sum(r.capacity),0) from public.rooms r where r.organization_id=requested_organization_id and r.status='active' and public.can_access_property(r.property_id)),
  'expectedPaise',(select coalesce(sum(i.total_paise),0) from public.invoices i where i.organization_id=requested_organization_id and i.period_start=date_trunc('month',current_date)::date and i.status<>'void' and public.can_access_property(i.property_id)),
  'collectedPaise',(select coalesce(sum(i.paid_paise),0) from public.invoices i where i.organization_id=requested_organization_id and i.period_start=date_trunc('month',current_date)::date and i.status<>'void' and public.can_access_property(i.property_id)),
  'outstandingPaise',(select coalesce(sum(i.balance_paise),0) from public.invoices i where i.organization_id=requested_organization_id and i.status in ('issued','partially_paid','overdue') and public.can_access_property(i.property_id)),
  'pendingApprovals',(select count(*) from public.payments p where p.organization_id=requested_organization_id and p.status='submitted' and public.can_access_payment(p.id)),
  'openComplaints',(select count(*) from public.complaints c where c.organization_id=requested_organization_id and c.status in ('open','assigned','in_progress','reopened') and public.can_access_property(c.property_id))
) end $$;

create or replace function public.generate_monthly_invoices(requested_organization_id uuid, requested_period_start date)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare t record; created_count integer:=0; skipped_count integer:=0; inv_id uuid; period_end date; due date;
begin
  if not public.is_org_member(requested_organization_id,array['owner','manager']::public.membership_role[])
    then raise exception 'forbidden'; end if;
  if requested_period_start <> date_trunc('month',requested_period_start)::date
    then raise exception 'period_must_start_on_first'; end if;
  period_end := (requested_period_start + interval '1 month - 1 day')::date;
  for t in select * from public.tenancies
    where organization_id=requested_organization_id
      and status in ('active','notice_period')
      and start_date<=period_end and coalesce(end_date,period_end)>=requested_period_start
      and public.can_access_property(property_id)
  loop
    if exists(select 1 from public.invoices where tenancy_id=t.id and period_start=requested_period_start)
      then skipped_count:=skipped_count+1; continue; end if;
    due := make_date(extract(year from requested_period_start)::int,extract(month from requested_period_start)::int,t.due_day);
    insert into public.invoices(organization_id,tenancy_id,property_id,period_start,period_end,due_date,currency,subtotal_paise,total_paise,status,invoice_number)
      values(t.organization_id,t.id,t.property_id,requested_period_start,period_end,due,t.currency,t.rent_paise,t.rent_paise,'issued',
        'INV-'||to_char(requested_period_start,'YYYYMM')||'-'||upper(substr(replace(t.id::text,'-',''),1,8)))
      returning id into inv_id;
    insert into public.invoice_items(organization_id,invoice_id,item_type,description,unit_amount_paise,total_amount_paise)
      values(t.organization_id,inv_id,'rent','Monthly rent',t.rent_paise,t.rent_paise);
    created_count:=created_count+1;
  end loop;
  return jsonb_build_object('created',created_count,'skipped',skipped_count,'failed',0);
end $$;

-- Remove broad operator policies and replace them with relationship-aware reads/writes.
do $$ declare table_name text; begin
  foreach table_name in array array[
    'invitations','property_media','residents','tenancies','occupancy_assignments','invoices','invoice_items',
    'payments','payment_allocations','receipts','complaints','complaint_events','attachments','notices',
    'notice_targets','documents','audit_logs'
  ] loop execute format('drop policy if exists %I on public.%I',table_name||'_operator',table_name); end loop;
end $$;

drop policy if exists invitations_owner on public.invitations;
create policy invitations_owner on public.invitations for select to authenticated
using(public.is_org_owner(organization_id));
create policy invitation_properties_owner on public.invitation_properties for select to authenticated
using(public.is_org_owner(organization_id));

drop policy if exists profiles_select_shared_organization on public.profiles;
create policy profiles_select_authorized on public.profiles for select to authenticated
using(public.can_read_profile(id));
drop policy if exists memberships_select_self_or_operator on public.organization_memberships;
create policy memberships_select_self_or_owner on public.organization_memberships for select to authenticated
using(profile_id=auth.uid() or public.is_org_owner(organization_id));
drop policy if exists property_memberships_select_authorized on public.property_memberships;
create policy property_memberships_select_authorized on public.property_memberships for select to authenticated
using(public.is_org_owner(organization_id) or organization_membership_id in (
  select m.id from public.organization_memberships m where m.profile_id=auth.uid()
));

create policy property_media_scoped on public.property_media for select to authenticated using(public.can_access_property(property_id));
create policy property_media_operator_write on public.property_media for all to authenticated
using(public.is_org_member(organization_id,array['owner','manager']::public.membership_role[]) and public.can_access_property(property_id))
with check(public.is_org_member(organization_id,array['owner','manager']::public.membership_role[]) and public.can_access_property(property_id));
create policy residents_operator_read on public.residents for select to authenticated using(public.is_org_owner(organization_id) or public.can_access_resident(id));
create policy residents_owner_insert on public.residents for insert to authenticated
with check(public.is_org_owner(organization_id) and profile_id is null);
create policy residents_operator_update on public.residents for update to authenticated
using(public.is_org_owner(organization_id) or public.can_access_resident(id))
with check(public.is_org_owner(organization_id) or public.can_access_resident(id));
create policy residents_owner_delete on public.residents for delete to authenticated
using(public.is_org_owner(organization_id));
create policy tenancies_operator_read on public.tenancies for select to authenticated using(public.can_access_property(property_id));
create policy occupancy_operator_read on public.occupancy_assignments for select to authenticated using(exists(
  select 1 from public.rooms r where r.id=room_id and public.can_access_property(r.property_id)
));
create policy invoices_operator_read on public.invoices for select to authenticated using(public.can_access_property(property_id));
create policy invoice_items_operator_read on public.invoice_items for select to authenticated using(exists(
  select 1 from public.invoices i where i.id=invoice_id and public.can_access_property(i.property_id)
));
create policy payments_authorized_read on public.payments for select to authenticated using(public.can_access_payment(id));
create policy allocations_authorized_read on public.payment_allocations for select to authenticated using(public.can_access_payment(payment_id));
create policy receipts_authorized_read on public.receipts for select to authenticated using(public.can_access_payment(payment_id));
create policy complaints_operator_read on public.complaints for select to authenticated using(public.can_access_property(property_id));
create policy complaint_events_operator_read on public.complaint_events for select to authenticated using(exists(
  select 1 from public.complaints c where c.id=complaint_id and public.can_access_property(c.property_id)
));
create policy attachments_authorized_read on public.attachments for select to authenticated using(
  (entity_type='complaint' and exists(select 1 from public.complaints c where c.id=entity_id and (public.is_linked_resident(c.resident_id) or public.can_access_property(c.property_id))))
  or (entity_type='payment' and public.can_access_payment(entity_id))
);

drop policy if exists notices_member_read on public.notices;
drop policy if exists notice_targets_member_read on public.notice_targets;
create policy notices_targeted_read on public.notices for select to authenticated using(public.can_read_notice(id));
create policy notice_targets_targeted_read on public.notice_targets for select to authenticated using(public.can_read_notice(notice_id));
drop policy if exists notice_reads_self on public.notice_reads;
create policy notice_reads_targeted_self on public.notice_reads for all to authenticated
using(profile_id=auth.uid() and public.can_read_notice(notice_id))
with check(profile_id=auth.uid() and public.can_read_notice(notice_id));
create policy documents_operator_read on public.documents for select to authenticated using(
  public.is_org_owner(organization_id) or (resident_id is not null and public.can_access_resident(resident_id))
);
create policy audit_logs_owner_read on public.audit_logs for select to authenticated using(public.is_org_owner(organization_id));

drop policy if exists complaints_tenant_insert on public.complaints;
revoke insert on public.complaints from authenticated;

-- Tighten foundation write policies for property-scoped managers.
drop policy if exists properties_insert_operator on public.properties;
drop policy if exists properties_update_operator on public.properties;
create policy properties_insert_owner on public.properties for insert to authenticated with check(public.is_org_owner(organization_id));
create policy properties_update_scoped on public.properties for update to authenticated
using(public.is_org_member(organization_id,array['owner','manager']::public.membership_role[]) and public.can_access_property(id))
with check(public.is_org_member(organization_id,array['owner','manager']::public.membership_role[]) and public.can_access_property(id));
drop policy if exists rooms_update_operator on public.rooms;
create policy rooms_update_scoped on public.rooms for update to authenticated
using(public.is_org_member(organization_id,array['owner','manager']::public.membership_role[]) and public.can_access_property(property_id))
with check(public.is_org_member(organization_id,array['owner','manager']::public.membership_role[]) and public.can_access_property(property_id));
drop policy if exists beds_update_operator on public.beds;
create policy beds_update_scoped on public.beds for update to authenticated using(exists(
  select 1 from public.rooms r where r.id=room_id
    and public.is_org_member(r.organization_id,array['owner','manager']::public.membership_role[])
    and public.can_access_property(r.property_id)
)) with check(exists(
  select 1 from public.rooms r where r.id=room_id
    and public.is_org_member(r.organization_id,array['owner','manager']::public.membership_role[])
    and public.can_access_property(r.property_id)
));

-- Server-owned audit/link columns cannot be supplied by authenticated clients.
revoke insert,update,delete on public.notices,public.notice_targets,public.attachments,public.documents from authenticated;
revoke update on public.residents from authenticated;
grant update(full_name,email_normalized,phone_e164,emergency_name,emergency_phone_e164,status) on public.residents to authenticated;

drop policy if exists storage_business_delete on storage.objects;
drop policy if exists storage_business_read on storage.objects;
drop policy if exists storage_business_insert on storage.objects;
create policy storage_business_read on storage.objects for select to authenticated using(
  (storage.foldername(name))[2]=auth.uid()::text
  or (bucket_id='payment-proofs' and exists(
    select 1 from public.payments p where p.proof_storage_path=name and public.can_access_payment(p.id)
  ))
  or (bucket_id='complaint-attachments' and exists(
    select 1 from public.attachments a join public.complaints c on c.id=a.entity_id
    where a.entity_type='complaint' and a.storage_path=name
      and (public.is_linked_resident(c.resident_id) or (
        public.is_org_member(c.organization_id,array['owner','manager']::public.membership_role[])
        and public.can_access_property(c.property_id)
      ))
  ))
  or (bucket_id='resident-documents' and exists(
    select 1 from public.documents d where d.storage_path=name and (
      public.is_org_owner(d.organization_id)
      or (d.resident_id is not null and public.can_access_resident(d.resident_id))
      or d.profile_id=auth.uid()
    )
  ))
);
create policy storage_business_insert on storage.objects for insert to authenticated with check(
  (storage.foldername(name))[2]=auth.uid()::text and (
    (bucket_id in ('payment-proofs','complaint-attachments') and public.is_org_member(
      ((storage.foldername(name))[1])::uuid,array['owner','manager','tenant']::public.membership_role[]
    ))
    or (bucket_id='resident-documents' and public.is_org_member(
      ((storage.foldername(name))[1])::uuid,array['owner','manager']::public.membership_role[]
    ))
  )
);
create policy storage_business_delete on storage.objects for delete to authenticated using(
  bucket_id in ('payment-proofs','complaint-attachments','resident-documents')
  and (storage.foldername(name))[2]=auth.uid()::text
);

grant select on public.invitation_properties to authenticated;
grant execute on function public.create_invitation(uuid,uuid,public.membership_role,text,uuid[]) to authenticated;
grant execute on function public.create_complaint_with_attachment(uuid,text,public.complaint_priority,text,text,text,text) to authenticated;
grant execute on function public.create_room_with_beds(uuid,uuid,text,text,public.room_type,bigint,bigint,integer) to authenticated;
grant execute on function public.register_resident_document(uuid,uuid,text,text) to authenticated;
grant execute on function public.publish_notice(uuid,text,text,boolean,text,uuid[]) to authenticated;
revoke all on function public.assert_room_available(uuid,uuid) from public;

commit;
