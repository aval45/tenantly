import { z } from "zod";
import { getSupabaseClient } from "@/shared/api/supabase";
import type { ExpenseRow } from "@/shared/api/database.types";

export const expenseSchema = z.object({
  organizationId: z.uuid(),
  propertyId: z.uuid(),
  category: z.enum([
    "maintenance",
    "utilities",
    "supplies",
    "staff",
    "taxes",
    "other",
  ]),
  description: z.string().trim().min(3).max(240),
  amountPaise: z.number().int().positive(),
  incurredOn: z.string().date(),
  vendorName: z.string().trim().max(120).optional(),
  receiptPath: z.string().max(500).optional(),
});

export type ProfitReport = {
  collectedPaise: number;
  expensesPaise: number;
  netProfitPaise: number;
  categories: Record<string, number>;
};

export const operationsService = {
  async listExpenses(organizationId: string, periodStart: string) {
    const periodEnd = new Date(`${periodStart}T00:00:00`);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    const { data, error } = await getSupabaseClient()
      .from("expenses")
      .select("*")
      .eq("organization_id", organizationId)
      .gte("incurred_on", periodStart)
      .lt("incurred_on", periodEnd.toISOString().slice(0, 10))
      .order("incurred_on", { ascending: false });
    if (error) throw error;
    return data as ExpenseRow[];
  },
  async recordExpense(input: z.input<typeof expenseSchema>) {
    const value = expenseSchema.parse(input);
    const { data, error } = await getSupabaseClient().rpc("record_expense", {
      requested_organization_id: value.organizationId,
      requested_property_id: value.propertyId,
      requested_category: value.category,
      requested_description: value.description,
      requested_amount_paise: value.amountPaise,
      requested_incurred_on: value.incurredOn,
      requested_vendor_name: value.vendorName ?? "",
      requested_receipt_path: value.receiptPath ?? "",
    });
    if (error) throw error;
    return data;
  },
  async voidExpense(expenseId: string, reason: string) {
    const { data, error } = await getSupabaseClient().rpc("void_expense", {
      requested_expense_id: expenseId,
      requested_reason: reason,
    });
    if (error) throw error;
    return data;
  },
  async getProfit(organizationId: string, periodStart: string) {
    const { data, error } = await getSupabaseClient().rpc(
      "monthly_profit_report",
      {
        requested_organization_id: organizationId,
        requested_period_start: periodStart,
      },
    );
    if (error) throw error;
    return data as unknown as ProfitReport;
  },
  async renewAgreement(input: {
    organizationId: string;
    residentId: string;
    storagePath: string;
    expiresOn: string;
    supersedesDocumentId?: string;
  }) {
    const { data, error } = await getSupabaseClient().rpc("renew_agreement", {
      requested_organization_id: input.organizationId,
      requested_resident_id: input.residentId,
      requested_storage_path: input.storagePath,
      requested_expires_on: input.expiresOn,
      requested_supersedes_document_id: input.supersedesDocumentId,
    });
    if (error) throw error;
    return data;
  },
};
