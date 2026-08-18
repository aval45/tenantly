begin;

-- P0/P1 demo operations: auditable cash collection, maintenance assignment,
-- versioned agreements, and property-scoped operating expenses.
create type public.expense_category as enum (
  'maintenance', 'utilities', 'supplies', 'staff', 'taxes', 'other'
);
create type public.expense_status as enum ('recorded', 'void');

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id),
  category public.expense_category not null,
  description text not null check (char_length(trim(description)) between 3 and 240),
  amount_paise bigint not null check (amount_paise > 0),
  incurred_on date not null,
  vendor_name text,
  receipt_storage_path text,
  status public.expense_status not null default 'recorded',
  void_reason text,
  voided_at timestamptz,
  voided_by uuid references public.profiles(id),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'recorded' and void_reason is null and voided_at is null and voided_by is null)
      or (status = 'void' and char_length(trim(coalesce(void_reason, ''))) >= 3 and voided_at is not null and voided_by is not null))
);
create index expenses_org_incurred_idx on public.expenses(organization_id, incurred_on desc);
create index expenses_property_status_idx on public.expenses(property_id, status, incurred_on desc);
create trigger expenses_set_updated_at before update on public.expenses
  for each row execute function public.set_updated_at();

alter table public.documents
  add column supersedes_document_id uuid references public.documents(id);
create index documents_supersedes_idx on public.documents(supersedes_document_id)
  where supersedes_document_id is not null;

-- Staff use the same secure, property-scoped invitation mechanism as managers.
create or replace function public.create_invitation(
  requested_organization_id uuid,
  requested_resident_id uuid,
  requested_role public.membership_role,
  requested_email text,
  requested_property_ids uuid[] default array[]::uuid[]
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare raw_token text := encode(extensions.gen_random_bytes(32), 'hex');
  invitation_uuid uuid; normalized_email text := lower(trim(requested_email));
  expires_at_value timestamptz := now() + interval '7 days';
begin
  if not public.is_org_owner(requested_organization_id) then raise exception 'forbidden'; end if;
  if requested_role not in ('manager','maintenance_staff','tenant') then raise exception 'invalid_role'; end if;
  if normalized_email is null or normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+\\.[^@[:space:]]+$' then raise exception 'valid_email_required'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(requested_organization_id::text||':'||normalized_email,0));
  if requested_role = 'tenant' then
    if requested_resident_id is null or coalesce(cardinality(requested_property_ids),0) <> 0 then raise exception 'invalid_tenant_invitation'; end if;
    if not exists(select 1 from public.residents r where r.id=requested_resident_id and r.organization_id=requested_organization_id and r.profile_id is null) then raise exception 'resident_unavailable'; end if;
  else
    if requested_resident_id is not null or coalesce(cardinality(requested_property_ids),0) = 0 then raise exception 'operator_properties_required'; end if;
    if exists(select 1 from unnest(requested_property_ids) requested_id where not exists(select 1 from public.properties p where p.id=requested_id and p.organization_id=requested_organization_id and p.status='active')) then raise exception 'invalid_operator_property'; end if;
  end if;
  if exists(select 1 from public.invitations i where i.organization_id=requested_organization_id and i.email_normalized=normalized_email and i.accepted_at is null and i.expires_at>now()) then raise exception 'active_invitation_exists'; end if;
  insert into public.invitations(organization_id,resident_id,role,email_normalized,phone_e164,token_hash,expires_at,invited_by)
  values(requested_organization_id,requested_resident_id,requested_role,normalized_email,null,encode(extensions.digest(raw_token,'sha256'),'hex'),expires_at_value,auth.uid()) returning id into invitation_uuid;
  if requested_role in ('manager','maintenance_staff') then
    insert into public.invitation_properties(invitation_id,organization_id,property_id)
    select invitation_uuid,requested_organization_id,requested_id from (select distinct unnest(requested_property_ids) requested_id) properties;
  end if;
  return jsonb_build_object('id',invitation_uuid,'token',raw_token,'expiresAt',expires_at_value);
end $$;

create or replace function public.accept_invitation(raw_token text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare invitation_row public.invitations%rowtype; membership_uuid uuid;
  existing_membership public.organization_memberships%rowtype;
  authenticated_email text := lower(trim(coalesce(auth.jwt()->>'email',''))); linked_count integer;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select * into invitation_row from public.invitations where token_hash=encode(extensions.digest(raw_token,'sha256'),'hex') for update;
  if invitation_row.id is null or invitation_row.accepted_at is not null or invitation_row.expires_at<=now() then raise exception 'invitation_invalid_or_expired'; end if;
  if not exists(select 1 from auth.users u where u.id=auth.uid() and u.email_confirmed_at is not null) then raise exception 'verified_email_required'; end if;
  if authenticated_email='' or authenticated_email<>invitation_row.email_normalized then raise exception 'invitation_email_mismatch'; end if;
  select * into existing_membership from public.organization_memberships where organization_id=invitation_row.organization_id and profile_id=auth.uid();
  if existing_membership.id is not null and existing_membership.role<>invitation_row.role then raise exception 'membership_role_conflict'; end if;
  insert into public.organization_memberships(organization_id,profile_id,role,status,invited_at,joined_at)
  values(invitation_row.organization_id,auth.uid(),invitation_row.role,'active',invitation_row.created_at,now())
  on conflict(organization_id,profile_id) do update set status='active',joined_at=now(),updated_at=now()
  returning id into membership_uuid;
  if invitation_row.role='tenant' then
    update public.residents set profile_id=auth.uid() where id=invitation_row.resident_id and organization_id=invitation_row.organization_id and profile_id is null;
    get diagnostics linked_count=row_count; if linked_count<>1 then raise exception 'resident_unavailable'; end if;
  else
    insert into public.property_memberships(organization_id,organization_membership_id,property_id,role_override)
    select ip.organization_id,membership_uuid,ip.property_id,case when invitation_row.role='maintenance_staff' then 'maintenance_staff'::public.membership_role else 'manager'::public.membership_role end
    from public.invitation_properties ip where ip.invitation_id=invitation_row.id
    on conflict(organization_membership_id,property_id) do update set role_override=excluded.role_override;
  end if;
  update public.invitations set accepted_at=now() where id=invitation_row.id;
  return membership_uuid;
end $$;

create or replace function public.assign_complaint(
  requested_complaint_id uuid, requested_membership_id uuid, assignment_note text default ''
) returns uuid language plpgsql security definer set search_path = '' as $$
declare complaint_row public.complaints%rowtype; staff_row public.organization_memberships%rowtype; event_uuid uuid;
begin
  select * into complaint_row from public.complaints where id=requested_complaint_id for update;
  if complaint_row.id is null or not public.is_org_member(complaint_row.organization_id,array['owner','manager']::public.membership_role[]) or not public.can_access_property(complaint_row.property_id) then raise exception 'forbidden'; end if;
  select * into staff_row from public.organization_memberships where id=requested_membership_id and organization_id=complaint_row.organization_id and role='maintenance_staff' and status='active';
  if staff_row.id is null or not exists(select 1 from public.property_memberships pm where pm.organization_membership_id=staff_row.id and pm.property_id=complaint_row.property_id) then raise exception 'staff_not_assigned_to_property'; end if;
  update public.complaints set assigned_membership_id=staff_row.id,status=case when status in ('open','reopened') then 'assigned'::public.complaint_status else status end where id=complaint_row.id;
  insert into public.complaint_events(organization_id,complaint_id,actor_id,event_type,previous_status,new_status,note)
  values(complaint_row.organization_id,complaint_row.id,auth.uid(),'assigned',complaint_row.status,case when complaint_row.status in ('open','reopened') then 'assigned'::public.complaint_status else complaint_row.status end,nullif(trim(assignment_note),'')) returning id into event_uuid;
  insert into public.notifications(organization_id,recipient_profile_id,notification_type,title,body,deep_link_path)
  values(complaint_row.organization_id,staff_row.profile_id,'maintenance_assignment','New maintenance task',complaint_row.title,'/(staff)/tasks');
  return event_uuid;
end $$;

create or replace function public.transition_complaint(
  requested_complaint_id uuid, requested_status public.complaint_status, transition_note text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare complaint_row public.complaints%rowtype; event_uuid uuid; is_tenant boolean; is_staff boolean;
begin
  select * into complaint_row from public.complaints where id=requested_complaint_id for update;
  if complaint_row.id is null then raise exception 'complaint_not_found'; end if;
  is_tenant:=public.is_linked_resident(complaint_row.resident_id);
  is_staff:=exists(select 1 from public.organization_memberships m where m.id=complaint_row.assigned_membership_id and m.profile_id=auth.uid() and m.role='maintenance_staff' and m.status='active');
  if not ((public.is_org_member(complaint_row.organization_id,array['owner','manager']::public.membership_role[]) and public.can_access_property(complaint_row.property_id)) or is_tenant or is_staff) then raise exception 'forbidden'; end if;
  if is_tenant and requested_status<>'reopened' then raise exception 'tenant_can_only_reopen'; end if;
  if is_staff and requested_status not in ('in_progress','resolved') then raise exception 'staff_transition_forbidden'; end if;
  if requested_status='reopened' and complaint_row.status not in ('resolved','closed') then raise exception 'invalid_transition'; end if;
  if not is_tenant and not is_staff and not ((complaint_row.status in ('open','reopened') and requested_status in ('assigned','in_progress','rejected')) or (complaint_row.status='assigned' and requested_status in ('in_progress','rejected')) or (complaint_row.status='in_progress' and requested_status in ('resolved','rejected')) or (complaint_row.status='resolved' and requested_status='closed')) then raise exception 'invalid_transition'; end if;
  if is_staff and not ((complaint_row.status='assigned' and requested_status='in_progress') or (complaint_row.status='in_progress' and requested_status='resolved')) then raise exception 'invalid_transition'; end if;
  update public.complaints set status=requested_status,closed_at=case when requested_status='closed' then now() else null end where id=requested_complaint_id;
  insert into public.complaint_events(organization_id,complaint_id,actor_id,event_type,previous_status,new_status,note)
  values(complaint_row.organization_id,requested_complaint_id,auth.uid(),'status_changed',complaint_row.status,requested_status,nullif(trim(transition_note),'')) returning id into event_uuid;
  return event_uuid;
end $$;

create or replace function public.renew_agreement(
  requested_organization_id uuid, requested_resident_id uuid, requested_storage_path text,
  requested_expires_on date, requested_supersedes_document_id uuid default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare document_uuid uuid;
begin
  if not public.is_org_member(requested_organization_id,array['owner','manager']::public.membership_role[]) or not exists(select 1 from public.residents r where r.id=requested_resident_id and r.organization_id=requested_organization_id and (public.is_org_owner(requested_organization_id) or public.can_access_resident(r.id))) then raise exception 'forbidden'; end if;
  if requested_expires_on <= current_date or split_part(requested_storage_path,'/',1)<>requested_organization_id::text or split_part(requested_storage_path,'/',2)<>auth.uid()::text or not exists(select 1 from storage.objects o where o.bucket_id='resident-documents' and o.name=requested_storage_path) then raise exception 'invalid_agreement'; end if;
  if requested_supersedes_document_id is not null and not exists(select 1 from public.documents d where d.id=requested_supersedes_document_id and d.organization_id=requested_organization_id and d.resident_id=requested_resident_id and d.document_type='agreement') then raise exception 'invalid_prior_agreement'; end if;
  insert into public.documents(organization_id,resident_id,document_type,storage_path,verification_status,expires_on,uploaded_by,supersedes_document_id)
  values(requested_organization_id,requested_resident_id,'agreement',requested_storage_path,'verified',requested_expires_on,auth.uid(),requested_supersedes_document_id) returning id into document_uuid;
  insert into public.notifications(organization_id,recipient_profile_id,notification_type,title,body,deep_link_path)
  select requested_organization_id,r.profile_id,'agreement_renewed','Agreement renewed','Your updated agreement is ready to view.','/(tenant)/more' from public.residents r where r.id=requested_resident_id and r.profile_id is not null;
  return document_uuid;
end $$;

create or replace function public.record_expense(
  requested_organization_id uuid, requested_property_id uuid, requested_category public.expense_category,
  requested_description text, requested_amount_paise bigint, requested_incurred_on date,
  requested_vendor_name text default '', requested_receipt_path text default ''
) returns uuid language plpgsql security definer set search_path = '' as $$
declare expense_uuid uuid;
begin
  if not public.is_org_member(requested_organization_id,array['owner','manager']::public.membership_role[]) or not public.can_access_property(requested_property_id) or not exists(select 1 from public.properties p where p.id=requested_property_id and p.organization_id=requested_organization_id) then raise exception 'forbidden'; end if;
  if requested_amount_paise<=0 or requested_incurred_on>current_date or char_length(trim(requested_description)) not between 3 and 240 then raise exception 'invalid_expense'; end if;
  if nullif(trim(requested_receipt_path),'') is not null and (split_part(requested_receipt_path,'/',1)<>requested_organization_id::text or split_part(requested_receipt_path,'/',2)<>auth.uid()::text or not exists(select 1 from storage.objects o where o.bucket_id='expense-receipts' and o.name=requested_receipt_path)) then raise exception 'invalid_expense_receipt'; end if;
  insert into public.expenses(organization_id,property_id,category,description,amount_paise,incurred_on,vendor_name,receipt_storage_path,created_by)
  values(requested_organization_id,requested_property_id,requested_category,trim(requested_description),requested_amount_paise,requested_incurred_on,nullif(trim(requested_vendor_name),''),nullif(trim(requested_receipt_path),''),auth.uid()) returning id into expense_uuid;
  insert into public.audit_logs(organization_id,actor_id,action,entity_type,entity_id,after_data)
  values(requested_organization_id,auth.uid(),'expense.recorded','expense',expense_uuid,jsonb_build_object('amountPaise',requested_amount_paise,'propertyId',requested_property_id));
  return expense_uuid;
end $$;

create or replace function public.void_expense(requested_expense_id uuid, requested_reason text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare expense_row public.expenses%rowtype;
begin
  select * into expense_row from public.expenses where id=requested_expense_id for update;
  if expense_row.id is null or not public.is_org_member(expense_row.organization_id,array['owner','manager']::public.membership_role[]) or not public.can_access_property(expense_row.property_id) then raise exception 'forbidden'; end if;
  if expense_row.status='void' then return expense_row.id; end if;
  if char_length(trim(coalesce(requested_reason,'')))<3 then raise exception 'void_reason_required'; end if;
  update public.expenses set status='void',void_reason=trim(requested_reason),voided_at=now(),voided_by=auth.uid() where id=expense_row.id;
  insert into public.audit_logs(organization_id,actor_id,action,entity_type,entity_id,after_data)
  values(expense_row.organization_id,auth.uid(),'expense.voided','expense',expense_row.id,jsonb_build_object('reason',trim(requested_reason)));
  return expense_row.id;
end $$;

create or replace function public.record_manual_payment(
  requested_invoice_id uuid, requested_amount_paise bigint, requested_paid_on date,
  requested_method public.payment_method default 'cash', requested_reference text default '',
  request_idempotency_key text default ''
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare invoice_row public.invoices%rowtype; payment_uuid uuid; receipt_uuid uuid; receipt_value text; remaining bigint;
begin
  select * into invoice_row from public.invoices where id=requested_invoice_id for update;
  if invoice_row.id is null or not public.is_org_member(invoice_row.organization_id,array['owner','manager']::public.membership_role[]) or not public.can_access_property(invoice_row.property_id) then raise exception 'forbidden'; end if;
  if nullif(trim(request_idempotency_key),'') is not null then select p.id into payment_uuid from public.payments p where p.organization_id=invoice_row.organization_id and p.idempotency_key=request_idempotency_key; if payment_uuid is not null then select r.id,r.receipt_number into receipt_uuid,receipt_value from public.receipts r where r.payment_id=payment_uuid; return jsonb_build_object('paymentId',payment_uuid,'receiptId',receipt_uuid,'receiptNumber',receipt_value); end if; end if;
  if requested_amount_paise<=0 or requested_amount_paise>invoice_row.balance_paise or requested_paid_on>current_date or requested_method not in ('cash','upi','bank_transfer','other') then raise exception 'invalid_manual_payment'; end if;
  select t.resident_id into strict payment_uuid from public.tenancies t where t.id=invoice_row.tenancy_id;
  insert into public.payments(organization_id,payer_resident_id,amount_paise,currency,method,paid_on,transaction_reference,status,submitted_by,decided_by,decided_at,idempotency_key)
  values(invoice_row.organization_id,payment_uuid,requested_amount_paise,invoice_row.currency,requested_method,requested_paid_on,nullif(trim(requested_reference),''),'approved',auth.uid(),auth.uid(),now(),nullif(trim(request_idempotency_key),'')) returning id into payment_uuid;
  insert into public.payment_allocations(organization_id,payment_id,invoice_id,amount_paise) values(invoice_row.organization_id,payment_uuid,invoice_row.id,requested_amount_paise);
  remaining:=invoice_row.balance_paise-requested_amount_paise;
  update public.invoices set paid_paise=paid_paise+requested_amount_paise,status=case when remaining=0 then 'paid'::public.invoice_status else 'partially_paid'::public.invoice_status end where id=invoice_row.id;
  receipt_value:='RCT-'||to_char(current_date,'YYYYMMDD')||'-'||upper(substr(replace(payment_uuid::text,'-',''),1,8));
  insert into public.receipts(organization_id,payment_id,receipt_number) values(invoice_row.organization_id,payment_uuid,receipt_value) returning id into receipt_uuid;
  insert into public.audit_logs(organization_id,actor_id,action,entity_type,entity_id,after_data) values(invoice_row.organization_id,auth.uid(),'payment.manual_recorded','payment',payment_uuid,jsonb_build_object('invoiceId',invoice_row.id,'amountPaise',requested_amount_paise));
  return jsonb_build_object('paymentId',payment_uuid,'receiptId',receipt_uuid,'receiptNumber',receipt_value);
end $$;

create or replace function public.monthly_profit_report(requested_organization_id uuid, requested_period_start date)
returns jsonb language sql stable security definer set search_path = '' as $$
  with bounds as (select date_trunc('month',requested_period_start)::date as start_date, (date_trunc('month',requested_period_start)::date + interval '1 month')::date as end_date),
  collected as (select coalesce(sum(p.amount_paise),0)::bigint value from public.payments p,bounds where p.organization_id=requested_organization_id and p.status='approved' and p.paid_on>=bounds.start_date and p.paid_on<bounds.end_date and public.can_access_payment(p.id)),
  expense_rows as (select e.category,coalesce(sum(e.amount_paise),0)::bigint amount from public.expenses e,bounds where e.organization_id=requested_organization_id and e.status='recorded' and e.incurred_on>=bounds.start_date and e.incurred_on<bounds.end_date and public.can_access_property(e.property_id) group by e.category),
  expenses as (select coalesce(sum(amount),0)::bigint value from expense_rows)
  select case when not public.is_org_member(requested_organization_id,array['owner','manager']::public.membership_role[]) then null else jsonb_build_object('collectedPaise',(select value from collected),'expensesPaise',(select value from expenses),'netProfitPaise',(select value from collected)-(select value from expenses),'categories',coalesce((select jsonb_object_agg(category,amount) from expense_rows),'{}'::jsonb)) end;
$$;

alter table public.expenses enable row level security;
revoke all on public.expenses from authenticated;
grant select on public.expenses to authenticated;
create policy expenses_scoped_read on public.expenses for select to authenticated using(
  public.is_org_member(organization_id,array['owner','manager']::public.membership_role[]) and public.can_access_property(property_id)
);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('expense-receipts','expense-receipts',false,15728640,array['application/pdf','image/jpeg','image/png']) on conflict(id) do nothing;
create policy storage_expense_read on storage.objects for select to authenticated using(
  bucket_id='expense-receipts' and exists(select 1 from public.expenses e where e.receipt_storage_path=name and public.is_org_member(e.organization_id,array['owner','manager']::public.membership_role[]) and public.can_access_property(e.property_id))
);
create policy storage_expense_insert on storage.objects for insert to authenticated with check(
  bucket_id='expense-receipts' and (storage.foldername(name))[2]=auth.uid()::text and public.is_org_member(((storage.foldername(name))[1])::uuid,array['owner','manager']::public.membership_role[])
);
create policy storage_expense_delete on storage.objects for delete to authenticated using(bucket_id='expense-receipts' and (storage.foldername(name))[2]=auth.uid()::text);
create policy storage_staff_complaint_read on storage.objects for select to authenticated using(
  bucket_id='complaint-attachments' and exists(select 1 from public.attachments a join public.complaints c on c.id=a.entity_id join public.organization_memberships m on m.id=c.assigned_membership_id where a.entity_type='complaint' and a.storage_path=name and m.profile_id=auth.uid() and m.role='maintenance_staff')
);

grant execute on function public.create_invitation(uuid,uuid,public.membership_role,text,uuid[]) to authenticated;
grant execute on function public.accept_invitation(text) to authenticated;
grant execute on function public.assign_complaint(uuid,uuid,text) to authenticated;
grant execute on function public.transition_complaint(uuid,public.complaint_status,text) to authenticated;
grant execute on function public.renew_agreement(uuid,uuid,text,date,uuid) to authenticated;
grant execute on function public.record_expense(uuid,uuid,public.expense_category,text,bigint,date,text,text) to authenticated;
grant execute on function public.void_expense(uuid,text) to authenticated;
grant execute on function public.record_manual_payment(uuid,bigint,date,public.payment_method,text,text) to authenticated;
grant execute on function public.monthly_profit_report(uuid,date) to authenticated;

commit;
