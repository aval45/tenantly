drop policy if exists properties_select_authorized on public.properties;

create policy properties_select_authorized
on public.properties for select to authenticated
using (
  public.is_org_member(
    organization_id,
    array['owner', 'manager']::public.membership_role[]
  )
  or public.can_access_property(id)
);
