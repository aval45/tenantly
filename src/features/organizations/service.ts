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
  assignedPropertyIds: string[];
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

      const organizationIds = [
        ...new Set(memberships.map((item) => item.organization_id)),
      ];
      const membershipIds = memberships.map((item) => item.id);
      const [organizationsResult, assignmentsResult] = await Promise.all([
        client
          .from("organizations")
          .select("id,name")
          .in("id", organizationIds),
        membershipIds.length
          ? client
              .from("property_memberships")
              .select("organization_membership_id,property_id")
              .in("organization_membership_id", membershipIds)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (organizationsResult.error) throw organizationsResult.error;
      if (assignmentsResult.error) throw assignmentsResult.error;
      const organizationNames = new Map(
        organizationsResult.data.map((item) => [item.id, item.name]),
      );
      return memberships.map((membership) => ({
        id: membership.id,
        organizationId: membership.organization_id,
        organizationName:
          organizationNames.get(membership.organization_id) ?? "Organization",
        role: membership.role,
        assignedPropertyIds: assignmentsResult.data
          .filter((item) => item.organization_membership_id === membership.id)
          .map((item) => item.property_id),
      }));
    },
  };
}
