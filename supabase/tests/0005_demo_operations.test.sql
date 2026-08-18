begin;

create extension if not exists pgtap with schema extensions;
select plan(11);

select has_table('public','expenses','expense ledger exists');
select has_column('public','documents','supersedes_document_id','agreement document history is retained');
select has_type('public','expense_category','expense categories are typed');
select has_type('public','expense_status','expense lifecycle is typed');
select has_index('public','expenses','expenses_org_incurred_idx','expense reporting index exists');
select has_function('public','record_expense','expense recording RPC exists');
select has_function('public','void_expense','expense void RPC exists');
select has_function('public','monthly_profit_report','profit report RPC exists');
select has_function('public','record_manual_payment','manual payment RPC exists');
select has_function('public','assign_complaint','maintenance assignment RPC exists');
select has_function('public','renew_agreement','agreement renewal RPC exists');

select * from finish();
rollback;
