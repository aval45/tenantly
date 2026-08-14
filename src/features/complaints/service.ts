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
  async create(input: z.input<typeof complaintSchema>) {
    const value = complaintSchema.parse(input);
    const { data, error } = await getSupabaseClient()
      .from("complaints")
      .insert({
        organization_id: value.organizationId,
        resident_id: value.residentId,
        tenancy_id: value.tenancyId ?? null,
        property_id: value.propertyId,
        room_id: value.roomId ?? null,
        category: value.category,
        title: value.title,
        description: value.description,
        priority: value.priority,
      })
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  },
  async transition(id: string, status: ComplaintStatus, note?: string) {
    const { data, error } = await getSupabaseClient().rpc(
      "transition_complaint",
      {
        requested_complaint_id: id,
        requested_status: status,
        transition_note: note ?? null,
      },
    );
    if (error) throw error;
    return data;
  },
};
