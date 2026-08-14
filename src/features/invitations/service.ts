import { z } from "zod";
import { getSupabaseClient } from "@/shared/api/supabase";
export const invitationSchema = z
  .object({
    organizationId: z.string().uuid(),
    residentId: z.string().uuid().optional(),
    role: z.enum(["manager", "tenant"]),
    email: z.string().email().optional(),
    phone: z
      .string()
      .regex(/^\+?[0-9]{10,15}$/)
      .optional(),
  })
  .refine((value) => value.email || value.phone, {
    message: "Email or phone is required.",
  });
export const invitationService = {
  async create(input: z.input<typeof invitationSchema>) {
    const value = invitationSchema.parse(input);
    const { data, error } = await getSupabaseClient().rpc("create_invitation", {
      requested_organization_id: value.organizationId,
      requested_resident_id: value.residentId ?? null,
      requested_role: value.role,
      requested_email: value.email ?? null,
      requested_phone: value.phone ?? null,
      requested_expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    });
    if (error) throw error;
    return data as { id: string; token: string; expiresAt: string };
  },
  async accept(token: string) {
    const { data, error } = await getSupabaseClient().rpc("accept_invitation", {
      raw_token: token,
    });
    if (error) throw error;
    return data;
  },
};
