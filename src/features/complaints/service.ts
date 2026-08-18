import { z } from "zod";
import { getSupabaseClient } from "@/shared/api/supabase";
import type { ComplaintStatus } from "@/shared/api/database.types";

export const complaintSchema = z.object({
  organizationId: z.string().uuid(),
  residentId: z.string().uuid(),
  tenancyId: z.string().uuid().optional(),
  propertyId: z.string().uuid(),
  roomId: z.string().uuid().optional(),
  category: z.string().trim().min(2).max(60),
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().min(5).max(2000),
  priority: z.enum(["low", "normal", "high", "urgent"]),
});
export const complaintService = {
  async list(organizationId?: string) {
    let query = getSupabaseClient()
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false });
    if (organizationId) query = query.eq("organization_id", organizationId);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
  async create(
    input: z.input<typeof complaintSchema> & {
      storagePath?: string;
      mediaType?: string;
    },
  ) {
    const value = complaintSchema.parse(input);
    if (!value.tenancyId) throw new Error("tenancy_required");
    if (Boolean(input.storagePath) !== Boolean(input.mediaType)) {
      throw new Error("invalid_attachment");
    }
    const { data, error } = await getSupabaseClient().rpc(
      "create_complaint_with_attachment",
      {
        requested_tenancy_id: value.tenancyId,
        requested_category: value.category,
        requested_priority: value.priority,
        requested_title: value.title,
        requested_description: value.description,
        ...(input.storagePath
          ? {
              requested_storage_path: input.storagePath,
              requested_media_type: input.mediaType,
            }
          : {}),
      },
    );
    if (error) throw error;
    return data;
  },
  async transition(id: string, status: ComplaintStatus, note?: string) {
    const { data, error } = await getSupabaseClient().rpc(
      "transition_complaint",
      {
        requested_complaint_id: id,
        requested_status: status,
        transition_note: note ?? "",
      },
    );
    if (error) throw error;
    return data;
  },
  async details(id: string) {
    const client = getSupabaseClient();
    const [complaint, events, attachments] = await Promise.all([
      client.from("complaints").select("*").eq("id", id).single(),
      client
        .from("complaint_events")
        .select("*")
        .eq("complaint_id", id)
        .order("created_at", { ascending: true }),
      client
        .from("attachments")
        .select("*")
        .eq("entity_type", "complaint")
        .eq("entity_id", id),
    ]);
    if (complaint.error) throw complaint.error;
    if (events.error) throw events.error;
    if (attachments.error) throw attachments.error;
    return {
      complaint: complaint.data,
      events: events.data,
      attachments: attachments.data,
    };
  },
  async assign(id: string, membershipId: string, note?: string) {
    const { data, error } = await getSupabaseClient().rpc("assign_complaint", {
      requested_complaint_id: id,
      requested_membership_id: membershipId,
      assignment_note: note ?? "",
    });
    if (error) throw error;
    return data;
  },
};
