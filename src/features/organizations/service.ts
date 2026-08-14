import { z } from "zod";

import type { MembershipRole } from "@/shared/api/database.types";
import type { TenantlySupabaseClient } from "@/shared/api/supabase";

export const createOrganizationCommandSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(63)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  idempotencyKey: z.string().min(8).max(128),
});

export type CreateOrganizationCommand = z.infer<
  typeof createOrganizationCommandSchema
>;
export type OrganizationMembershipSummary = {
  id: string;
  organizationId: string;
  organizationName: string;
  role: MembershipRole;
};

export type OrganizationService = {
  createOrganization(command: CreateOrganizationCommand): Promise<string>;
  listActiveMemberships(): Promise<OrganizationMembershipSummary[]>;
};

export function createSupabaseOrganizationService(
  client: TenantlySupabaseClient,
): OrganizationService {
  return {
    async createOrganization(input) {
      const command = createOrganizationCommandSchema.parse(input);
      const { data, error } = await client.rpc(
        "create_organization_with_owner",
        {
          organization_name: command.name,
          organization_slug: command.slug,
          request_idempotency_key: command.idempotencyKey,
        },
      );
      if (error) throw error;
      return data;
    },
    async listActiveMemberships() {
      const { data: memberships, error: membershipsError } = await client
        .from("organization_memberships")
        .select("id, organization_id, role")
        .eq("status", "active");
      if (membershipsError) throw membershipsError;

      return Promise.all(
        memberships.map(async (membership) => {
          const { data: organization, error: organizationError } = await client
            .from("organizations")
            .select("name")
            .eq("id", membership.organization_id)
            .single();
          if (organizationError) throw organizationError;
          return {
            id: membership.id,
            organizationId: membership.organization_id,
            organizationName: organization.name,
            role: membership.role,
          };
        }),
      );
    },
  };
}
