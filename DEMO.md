# Tenantly — Five-Minute Demo

## Before presenting

1. Apply `20260818000000_demo_operations.sql` to the configured Supabase project.
2. Sign in on separate profiles as an owner, tenant, and maintenance staff member.
3. Prepare one property with a shared room, an active tenancy, one issued invoice, a submitted payment proof, an open complaint, and one agreement document.

## Walkthrough

1. **Owner home** — Show occupancy, collection, pending approvals, complaints, and net profit.
2. **Rent** — Generate invoices, open an invoice ledger, record a cash payment, and show the immutable receipt number.
3. **Complaint** — Open a resident request, assign the maintenance user, and add a status note.
4. **Operations** — Record an expense and show the live collected / expense / profit summary. Upload a renewed agreement with an expiry date.
5. **Tenant** — Show the full notice feed, read state, payment receipt, agreement, and the ability to reopen a resolved request.
6. **Maintenance staff** — Sign in as the assigned worker, open the task, mark it in progress, then resolved.

## Safe fallback

Use the web export only if the Expo preview build is unavailable. Do not demonstrate any workflow until the migration has been applied; the new server-side RPCs deliberately reject requests against the old schema.
