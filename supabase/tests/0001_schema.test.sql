begin;

create extension if not exists pgtap with schema extensions;
select plan(20);

select has_table('public', 'profiles', 'profiles exists');
select has_table('public', 'organizations', 'organizations exists');
select has_table('public', 'organization_memberships', 'organization memberships exist');
select has_table('public', 'properties', 'properties exists');
select has_table('public', 'property_memberships', 'property memberships exist');
select has_table('public', 'rooms', 'rooms exist');
select has_table('public', 'beds', 'beds exist');

select has_pk('public', 'profiles', 'profiles has a primary key');
select has_pk('public', 'organizations', 'organizations has a primary key');
select has_pk('public', 'organization_memberships', 'organization memberships has a primary key');
select has_pk('public', 'properties', 'properties has a primary key');
select has_pk('public', 'property_memberships', 'property memberships has a primary key');
select has_pk('public', 'rooms', 'rooms has a primary key');
select has_pk('public', 'beds', 'beds has a primary key');

select has_function('public', 'create_organization_with_owner', array['text', 'text', 'text'], 'idempotent organization function exists');
select has_function('public', 'is_org_member', array['uuid', 'membership_role[]'], 'organization membership helper exists');
select has_function('public', 'shares_organization_with', array['uuid'], 'shared organization helper exists');
select has_function('public', 'can_access_property', array['uuid'], 'property access helper exists');

select results_eq(
  $$
    select count(*)::bigint
    from pg_class relation
    join pg_namespace namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relname in (
        'profiles',
        'organizations',
        'organization_memberships',
        'properties',
        'property_memberships',
        'rooms',
        'beds'
      )
      and relation.relrowsecurity
  $$,
  $$ values (7::bigint) $$,
  'RLS is enabled on every exposed foundation table'
);

select has_trigger('auth', 'users', 'on_auth_user_created', 'auth signup creates a profile');

select * from finish();
rollback;