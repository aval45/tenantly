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

export function summarizeInvoices<
  T extends { balance_paise: number | null; due_date: string },
>(invoices: T[]) {
  const actionable = invoices
    .filter((invoice) => (invoice.balance_paise ?? 0) > 0)
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
  return {
    outstandingPaise: actionable.reduce(
      (sum, invoice) => sum + (invoice.balance_paise ?? 0),
      0,
    ),
    nextInvoice: actionable[0],
  };
}

export function buildPaymentAllocations<
  T extends { id: string; balance_paise: number | null },
>(amountPaise: number, invoices: T[]) {
  let remaining = amountPaise;
  const allocations = invoices.flatMap((invoice) => {
    if (remaining <= 0) return [];
    const amount = Math.min(remaining, invoice.balance_paise ?? 0);
    remaining -= amount;
    return amount > 0 ? [{ invoiceId: invoice.id, amountPaise: amount }] : [];
  });
  return { allocations, remainingPaise: remaining };
}
export const billingService = {
  async listInvoices(organizationId: string) {
    const { data, error } = await getSupabaseClient()
      .from("invoices")
      .select("*")
      .eq("organization_id", organizationId)
      .order("due_date", { ascending: true });
    if (error) throw error;
    return data;
  },
  async listOwnInvoices() {
    const { data, error } = await getSupabaseClient()
      .from("invoices")
      .select("*")
      .order("due_date", { ascending: true });
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
  async getReceiptDetails(receiptId: string) {
    const client = getSupabaseClient();
    const { data: receipt, error: receiptError } = await client
      .from("receipts")
      .select("*")
      .eq("id", receiptId)
      .single();
    if (receiptError) throw receiptError;
    const { data: payment, error: paymentError } = await client
      .from("payments")
      .select("*")
      .eq("id", receipt.payment_id)
      .single();
    if (paymentError) throw paymentError;
    const { data: allocations, error: allocationError } = await client
      .from("payment_allocations")
      .select("invoice_id,amount_paise")
      .eq("payment_id", payment.id);
    if (allocationError) throw allocationError;
    const allocationRows = allocations ?? [];
    const invoiceIds = allocationRows.map((item) => item.invoice_id);
    const { data: invoices, error: invoiceError } = invoiceIds.length
      ? await client
          .from("invoices")
          .select("id,invoice_number")
          .in("id", invoiceIds)
      : { data: [], error: null };
    if (invoiceError) throw invoiceError;
    const names = new Map(
      invoices.map((item) => [item.id, item.invoice_number]),
    );
    return {
      receipt,
      payment,
      allocations: allocationRows.map((item) => ({
        invoiceNumber: names.get(item.invoice_id) ?? item.invoice_id,
        amountPaise: item.amount_paise,
      })),
    };
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
      requested_reference: value.reference ?? "",
      requested_proof_path: value.proofPath ?? "",
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
  async getSignedProofUrl(storagePath: string, expiresInSeconds = 600) {
    const { data, error } = await getSupabaseClient()
      .storage.from("payment-proofs")
      .createSignedUrl(storagePath, expiresInSeconds);
    if (error) throw error;
    return data.signedUrl;
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
      reason: reason ?? "",
      allocations: allocations as unknown as Json,
    });
    if (error) throw error;
    return data;
  },
};
