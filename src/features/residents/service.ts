import { z } from "zod";
import { getSupabaseClient } from "@/shared/api/supabase";

export const createResidentCommandSchema = z.object({
  organizationId: z.string().uuid(),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{10,15}$/)
    .optional()
    .or(z.literal("")),
  emergencyName: z.string().trim().max(120).optional(),
  emergencyPhone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{10,15}$/)
    .optional()
    .or(z.literal("")),
});
export type Resident = z.infer<typeof createResidentCommandSchema> & {
  id: string;
  status: "active" | "inactive" | "archived";
};

export const residentService = {
  async create(input: z.input<typeof createResidentCommandSchema>) {
    const value = createResidentCommandSchema.parse(input);
    const { data, error } = await getSupabaseClient()
      .from("residents")
      .insert({
        organization_id: value.organizationId,
        full_name: value.fullName,
        email_normalized: value.email ? value.email.toLowerCase() : null,
        phone_e164: value.phone || null,
        emergency_name: value.emergencyName || null,
        emergency_phone_e164: value.emergencyPhone || null,
      })
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  },
  async update(id: string, input: z.input<typeof createResidentCommandSchema>) {
    const value = createResidentCommandSchema.parse(input);
    const { error } = await getSupabaseClient()
      .from("residents")
      .update({
        full_name: value.fullName,
        email_normalized: value.email ? value.email.toLowerCase() : null,
        phone_e164: value.phone || null,
        emergency_name: value.emergencyName || null,
        emergency_phone_e164: value.emergencyPhone || null,
      })
      .eq("id", id);
    if (error) throw error;
  },
  async list(organizationId: string) {
    const { data, error } = await getSupabaseClient()
      .from("residents")
      .select("*")
      .eq("organization_id", organizationId)
      .neq("status", "archived")
      .order("full_name");
    if (error) throw error;
    return data;
  },
  async listActiveTenancies(organizationId: string) {
    const { data, error } = await getSupabaseClient()
      .from("tenancies")
      .select("*")
      .eq("organization_id", organizationId)
      .in("status", ["active", "notice_period"]);
    if (error) throw error;
    return data;
  },
  async createTenancy(input: {
    organizationId: string;
    residentId: string;
    propertyId: string;
    roomId: string;
    bedId?: string;
    startDate: string;
    dueDay: number;
    rentPaise: number;
    depositPaise: number;
    idempotencyKey: string;
  }) {
    const { data, error } = await getSupabaseClient().rpc(
      "create_tenancy_with_assignment",
      {
        requested_organization_id: input.organizationId,
        requested_resident_id: input.residentId,
        requested_property_id: input.propertyId,
        requested_room_id: input.roomId,
        requested_bed_id: input.bedId ?? (null as never),
        requested_start_date: input.startDate,
        requested_due_day: input.dueDay,
        requested_rent_paise: input.rentPaise,
        requested_deposit_paise: input.depositPaise,
        request_idempotency_key: input.idempotencyKey,
      },
    );
    if (error) throw error;
    return data;
  },
  async transferOrVacate(input: {
    tenancyId: string;
    roomId: string | null;
    bedId?: string;
    reason?: string;
    idempotencyKey: string;
  }) {
    const { data, error } = await getSupabaseClient().rpc(
      "transfer_occupancy",
      {
        requested_tenancy_id: input.tenancyId,
        requested_room_id: input.roomId ?? (null as never),
        requested_bed_id: input.bedId ?? (null as never),
        effective_at: new Date().toISOString(),
        transfer_reason: input.reason ?? "",
        request_idempotency_key: input.idempotencyKey,
      },
    );
    if (error) throw error;
    return data;
  },
};
