import { z } from "zod";
import { getSupabaseClient } from "@/shared/api/supabase";
import type { Json, PaymentMethod } from "@/shared/api/database.types";

export const paymentSubmissionSchema = z.object({
  invoiceId: z.string().uuid(),
  amountPaise: z.number().int().positive(),
  method: z.enum(["cash", "upi", "bank_transfer", "other"]),
  paidOn: z.string().date(),
  reference: z.string().trim().max(120).optional(),
  proofPath: z.string().max(500).optional(),
  idempotencyKey: z.string().min(8).max(128),
});
export const billingService = {
  async listInvoices(organizationId: string) {
    const { data, error } = await getSupabaseClient()
      .from("invoices")
      .select("*")
      .eq("organization_id", organizationId)
      .order("due_date", { ascending: false });
    if (error) throw error;
    return data;
  },
  async listOwnInvoices() {
    const { data, error } = await getSupabaseClient()
      .from("invoices")
      .select("*")
      .order("due_date", { ascending: false });
    if (error) throw error;
    return data;
  },
  async listOwnReceipts() {
    const { data, error } = await getSupabaseClient()
      .from("receipts")
      .select("*")
      .order("generated_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  async generateMonth(organizationId: string, periodStart: string) {
    const { data, error } = await getSupabaseClient().rpc(
      "generate_monthly_invoices",
      {
        requested_organization_id: organizationId,
        requested_period_start: periodStart,
      },
    );
    if (error) throw error;
    return data;
  },
  async submitPayment(input: z.input<typeof paymentSubmissionSchema>) {
    const value = paymentSubmissionSchema.parse(input);
    const { data, error } = await getSupabaseClient().rpc("submit_payment", {
      requested_invoice_id: value.invoiceId,
      requested_amount_paise: value.amountPaise,
      requested_method: value.method as PaymentMethod,
      requested_paid_on: value.paidOn,
      requested_reference: value.reference ?? null,
      requested_proof_path: value.proofPath ?? null,
      request_idempotency_key: value.idempotencyKey,
    });
    if (error) throw error;
    return data;
  },
  async listPendingPayments(organizationId: string) {
    const { data, error } = await getSupabaseClient()
      .from("payments")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("status", "submitted")
      .order("created_at");
    if (error) throw error;
    return data;
  },
  async listAllocatableInvoices(residentId: string) {
    const client = getSupabaseClient();
    const { data: tenancies, error: tenancyError } = await client
      .from("tenancies")
      .select("id")
      .eq("resident_id", residentId);
    if (tenancyError) throw tenancyError;
    const ids = tenancies.map((item) => item.id);
    if (!ids.length) return [];
    const { data, error } = await client
      .from("invoices")
      .select("*")
      .in("tenancy_id", ids)
      .gt("balance_paise", 0)
      .in("status", ["issued", "partially_paid", "overdue"])
      .order("due_date");
    if (error) throw error;
    return data;
  },
  async decidePayment(
    paymentId: string,
    approve: boolean,
    reason: string | null,
    allocations: { invoiceId: string; amountPaise: number }[],
  ) {
    const { data, error } = await getSupabaseClient().rpc("decide_payment", {
      requested_payment_id: paymentId,
      approve,
      reason,
      allocations: allocations as unknown as Json,
    });
    if (error) throw error;
    return data;
  },
};
