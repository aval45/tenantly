begin;

create extension if not exists pgtap with schema extensions;
select plan(26);

select has_table('public','invitation_properties','manager invitation assignments exist');
select has_column('public','payments','submitted_invoice_id','payments retain the submitted invoice');
select has_function('public','create_complaint_with_attachment','complaint creation RPC exists');
select has_function('public','create_room_with_beds','room creation RPC exists');
select has_function('public','publish_notice','targeted notice RPC exists');
select has_function('public','register_resident_document','document metadata RPC exists');
select has_trigger('public','organization_memberships','organization_memberships_protect_last_owner','last owner is protected');
select has_trigger('public','notice_targets','notice_targets_validate','notice targets are validated');
select has_index('public','occupancy_assignments','occupancy_active_tenancy_idx','one active assignment per tenancy');
select has_index('public','occupancy_assignments','occupancy_active_bed_idx','one active occupant per bed');
select has_constraint('public','tenancies','tenancies_resident_organization_fk','tenancy resident organization is relationally enforced');
select has_constraint('public','complaints','complaints_property_organization_fk','complaint property organization is relationally enforced');
select has_constraint('public','payments','payments_invoice_organization_fk','submitted payment invoice organization is enforced');

insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
  ('11000000-0000-4000-8000-000000000001','release-owner@test.local',now(),'{"full_name":"Release Owner"}'),
  ('11000000-0000-4000-8000-000000000002','scope-manager@test.local',now(),'{"full_name":"Scope Manager"}'),
  ('11000000-0000-4000-8000-000000000003','invited-manager@test.local',now(),'{"full_name":"Invited Manager"}'),
  ('11000000-0000-4000-8000-000000000004','wrong-email@test.local',now(),'{"full_name":"Wrong Email"}'),
  ('11000000-0000-4000-8000-000000000005','tenant@test.local',now(),'{"full_name":"Tenant"}');

insert into public.organizations(id,name,slug,created_by) values
  ('22000000-0000-4000-8000-000000000001','Release Org','release-org','11000000-0000-4000-8000-000000000001'),
  ('22000000-0000-4000-8000-000000000002','Other Org','other-release-org','11000000-0000-4000-8000-000000000001');
insert into public.organization_memberships(id,organization_id,profile_id,role,status,joined_at) values
  ('33000000-0000-4000-8000-000000000001','22000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000001','owner','active',now()),
  ('33000000-0000-4000-8000-000000000002','22000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000002','manager','active',now()),
  ('33000000-0000-4000-8000-000000000005','22000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000005','tenant','active',now());
insert into public.properties(id,organization_id,name,property_type,address_line_1,city,state,postal_code) values
  ('44000000-0000-4000-8000-000000000001','22000000-0000-4000-8000-000000000001','Assigned','pg','1 Road','Pune','MH','411001'),
  ('44000000-0000-4000-8000-000000000002','22000000-0000-4000-8000-000000000001','Unassigned','pg','2 Road','Pune','MH','411002'),
  ('44000000-0000-4000-8000-000000000003','22000000-0000-4000-8000-000000000002','Other','pg','3 Road','Pune','MH','411003');
insert into public.property_memberships(organization_id,organization_membership_id,property_id,role_override)
values('22000000-0000-4000-8000-000000000001','33000000-0000-4000-8000-000000000002','44000000-0000-4000-8000-000000000001','manager');
insert into public.residents(id,organization_id,profile_id,full_name) values
  ('55000000-0000-4000-8000-000000000001','22000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000005','Linked Tenant'),
  ('55000000-0000-4000-8000-000000000002','22000000-0000-4000-8000-000000000002',null,'Other Resident');
insert into public.rooms(id,organization_id,property_id,code,room_type,capacity)
values('66000000-0000-4000-8000-000000000001','22000000-0000-4000-8000-000000000001','44000000-0000-4000-8000-000000000001','A-1','shared',1);
insert into public.beds(id,organization_id,room_id,code)
values('77000000-0000-4000-8000-000000000001','22000000-0000-4000-8000-000000000001','66000000-0000-4000-8000-000000000001','B1');
insert into public.tenancies(id,organization_id,resident_id,property_id,start_date,due_day,rent_paise,status)
values('88000000-0000-4000-8000-000000000001','22000000-0000-4000-8000-000000000001','55000000-0000-4000-8000-000000000001','44000000-0000-4000-8000-000000000001',current_date,5,10000,'active');
insert into public.invoices(id,organization_id,tenancy_id,property_id,period_start,period_end,due_date,total_paise,status,invoice_number)
values('99000000-0000-4000-8000-000000000001','22000000-0000-4000-8000-000000000001','88000000-0000-4000-8000-000000000001','44000000-0000-4000-8000-000000000001',date_trunc('month',current_date)::date,(date_trunc('month',current_date)+interval '1 month - 1 day')::date,current_date,10000,'issued','INV-RELEASE-1');

set local role authenticated;
select set_config('request.jwt.claim.sub','11000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"11000000-0000-4000-8000-000000000001","email":"release-owner@test.local"}',true);
select throws_ok(
  $$ update public.organization_memberships set status='revoked' where id='33000000-0000-4000-8000-000000000001' $$,
  'P0001','last_owner_required','final owner cannot be revoked'
);
select throws_ok(
  $$ select public.create_invitation('22000000-0000-4000-8000-000000000001','55000000-0000-4000-8000-000000000002','tenant','tenant@test.local',array[]::uuid[]) $$,
  'P0001','resident_unavailable','cross-organization resident invitations are rejected'
);
create temporary table invitation_result(value jsonb);
insert into invitation_result select public.create_invitation(
  '22000000-0000-4000-8000-000000000001',null,'manager','invited-manager@test.local',
  array['44000000-0000-4000-8000-000000000001'::uuid]
);
select is((select value->>'expiresAt' is not null from invitation_result),true,'invitation expiry is generated server-side');
select throws_ok(
  $$ select public.create_invitation('22000000-0000-4000-8000-000000000001',null,'manager','INVITED-MANAGER@test.local',array['44000000-0000-4000-8000-000000000001'::uuid]) $$,
  'P0001','active_invitation_exists','duplicate active invitation emails are normalized and rejected'
);

select set_config('request.jwt.claim.sub','11000000-0000-4000-8000-000000000004',true);
select set_config('request.jwt.claims','{"sub":"11000000-0000-4000-8000-000000000004","email":"wrong-email@test.local"}',true);
select throws_ok(
  $$ select public.accept_invitation((select value->>'token' from invitation_result)) $$,
  'P0001','invitation_email_mismatch','invitation requires its verified matching email'
);

select set_config('request.jwt.claim.sub','11000000-0000-4000-8000-000000000003',true);
select set_config('request.jwt.claims','{"sub":"11000000-0000-4000-8000-000000000003","email":"invited-manager@test.local"}',true);
select lives_ok(
  $$ select public.accept_invitation((select value->>'token' from invitation_result)) $$,
  'matching manager can accept invitation'
);
select results_eq(
  $$ select count(*)::bigint from public.property_memberships pm join public.organization_memberships m on m.id=pm.organization_membership_id where m.profile_id='11000000-0000-4000-8000-000000000003' $$,
  $$ values(1::bigint) $$,
  'manager property assignments copy atomically'
);

select set_config('request.jwt.claim.sub','11000000-0000-4000-8000-000000000002',true);
select results_eq(
  $$ select count(*)::bigint from public.properties where organization_id='22000000-0000-4000-8000-000000000001' $$,
  $$ values(1::bigint) $$,
  'manager reads assigned properties only'
);

select set_config('request.jwt.claim.sub','11000000-0000-4000-8000-000000000005',true);
select throws_ok(
  $$ select public.submit_payment('99000000-0000-4000-8000-000000000001',10001,'cash',current_date,null,null,'overpay-release-1') $$,
  'P0001','invalid_payment_amount','overpayments are rejected'
);
select throws_ok(
  $$ select public.submit_payment('99000000-0000-4000-8000-000000000001',1000,'upi',current_date,null,null,'proof-release-1') $$,
  'P0001','payment_proof_required','UPI payments require proof'
);
select lives_ok(
  $$ select public.submit_payment('99000000-0000-4000-8000-000000000001',4000,'cash',current_date,'CASH-1',null,'payment-release-1') $$,
  'partial invoice payment may be submitted'
);

select set_config('request.jwt.claim.sub','11000000-0000-4000-8000-000000000002',true);
select throws_ok(
  $$ select public.decide_payment((select id from public.payments where idempotency_key='payment-release-1'),true,null,'[{"invoiceId":"99000000-0000-4000-8000-000000000001","amountPaise":3000}]'::jsonb) $$,
  'P0001','allocation_total_mismatch','payment approval requires exact allocation'
);
select lives_ok(
  $$ select public.decide_payment((select id from public.payments where idempotency_key='payment-release-1'),true,null,'[{"invoiceId":"99000000-0000-4000-8000-000000000001","amountPaise":4000}]'::jsonb) $$,
  'exact payment allocation is accepted'
);

select * from finish();
rollback;
