import { z } from "zod";
import { getSupabaseClient } from "@/shared/api/supabase";
export const invitationSchema = z
  .object({
    organizationId: z.string().uuid(),
    residentId: z.string().uuid().optional(),
    role: z.enum(["manager", "maintenance_staff", "tenant"]),
    email: z.email(),
    propertyIds: z.array(z.uuid()).default([]),
  })
  .refine(
    (value) =>
      value.role === "tenant"
        ? !!value.residentId && value.propertyIds.length === 0
        : !value.residentId && value.propertyIds.length > 0,
    {
      message:
        "Tenant invitations require a resident; operator invitations require assigned properties.",
    },
  );
export const invitationService = {
  async create(input: z.input<typeof invitationSchema>) {
    const value = invitationSchema.parse(input);
    const { data, error } = await getSupabaseClient().rpc("create_invitation", {
      requested_organization_id: value.organizationId,
      requested_resident_id: value.residentId ?? (null as never),
      requested_role: value.role,
      requested_email: value.email,
      requested_property_ids: value.propertyIds,
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
