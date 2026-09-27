-- Fix email regex in create_invitation to correctly match standard email addresses
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
  if normalized_email is null or normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then raise exception 'valid_email_required'; end if;
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

grant execute on function public.create_invitation(uuid,uuid,public.membership_role,text,uuid[]) to authenticated;
