begin;

create extension if not exists pgtap with schema extensions;
select plan(30);

select has_table('public','invitations','invitations exist');
select has_table('public','residents','residents exist');
select has_table('public','tenancies','tenancies exist');
select has_table('public','occupancy_assignments','occupancy history exists');
select has_table('public','invoices','invoices exist');
select has_table('public','invoice_items','invoice items exist');
select has_table('public','payments','payments exist');
select has_table('public','payment_allocations','payment allocations exist');
select has_table('public','receipts','receipts exist');
select has_table('public','complaints','complaints exist');
select has_table('public','complaint_events','complaint events exist');
select has_table('public','attachments','attachments exist');
select has_table('public','notices','notices exist');
select has_table('public','notice_targets','notice targets exist');
select has_table('public','notice_reads','notice reads exist');
select has_table('public','documents','documents exist');
select has_table('public','notifications','notifications exist');
select has_table('public','push_devices','push devices exist');
select has_table('public','audit_logs','audit logs exist');

select has_function('public','create_tenancy_with_assignment','tenancy assignment RPC exists');
select has_function('public','transfer_occupancy','occupancy transfer RPC exists');
select has_function('public','generate_monthly_invoices','invoice generation RPC exists');
select has_function('public','submit_payment','payment submission RPC exists');
select has_function('public','decide_payment','payment decision RPC exists');
select has_function('public','transition_complaint','complaint transition RPC exists');
select has_function('public','owner_dashboard','dashboard RPC exists');
select has_function('public','create_invitation','invitation creation RPC exists');
select has_function('public','accept_invitation','invitation acceptance RPC exists');

select results_eq(
  $$
    select count(*)::bigint from pg_class c
    join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname in (
      'invitations','property_media','residents','tenancies','occupancy_assignments',
      'invoices','invoice_items','payments','payment_allocations','receipts',
      'complaints','complaint_events','attachments','notices','notice_targets',
      'notice_reads','documents','notifications','push_devices','audit_logs'
    ) and c.relrowsecurity
  $$,
  $$ values(20::bigint) $$,
  'RLS is enabled on every P0 table'
);

select has_trigger('public','payments','payments_notify_decision','payment decisions notify residents');

select * from finish();
rollback;
