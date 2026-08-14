import { z } from "zod";
import { getSupabaseClient } from "@/shared/api/supabase";

export const createRoomCommandSchema = z.object({
  organizationId: z.string().uuid(),
  propertyId: z.string().uuid(),
  code: z.string().trim().min(1).max(24),
  floor: z.string().trim().max(24).optional(),
  bedCount: z.coerce.number().int().min(1).max(12),
  monthlyRentPaise: z.number().int().min(0).default(0),
  depositPaise: z.number().int().min(0).default(0),
});
export type CreateRoomCommand = z.infer<typeof createRoomCommandSchema>;
export type RoomSummary = CreateRoomCommand & {
  id: string;
  occupiedBeds: number;
};

export const roomService = {
  async listForProperty(propertyId: string): Promise<RoomSummary[]> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("rooms")
      .select(
        "id,organization_id,property_id,code,floor_label,capacity,default_rent_paise,default_deposit_paise",
      )
      .eq("property_id", propertyId)
      .eq("status", "active")
      .order("code");
    if (error) throw error;
    return Promise.all(
      data.map(async (room) => {
        const { count, error: countError } = await client
          .from("occupancy_assignments")
          .select("id", { count: "exact", head: true })
          .eq("room_id", room.id)
          .is("ends_at", null);
        if (countError) throw countError;
        return {
          id: room.id,
          organizationId: room.organization_id,
          propertyId: room.property_id,
          code: room.code,
          floor: room.floor_label ?? undefined,
          bedCount: room.capacity,
          monthlyRentPaise: room.default_rent_paise,
          depositPaise: room.default_deposit_paise,
          occupiedBeds: count ?? 0,
        };
      }),
    );
  },
  async create(input: CreateRoomCommand): Promise<string> {
    const command = createRoomCommandSchema.parse(input);
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("rooms")
      .insert({
        organization_id: command.organizationId,
        property_id: command.propertyId,
        code: command.code,
        floor_label: command.floor,
        room_type: command.bedCount > 1 ? "shared" : "private",
        capacity: command.bedCount,
        default_rent_paise: command.monthlyRentPaise,
        default_deposit_paise: command.depositPaise,
      })
      .select("id")
      .single();
    if (error) throw error;
    if (command.bedCount > 1) {
      const { error: bedsError } = await client.from("beds").insert(
        Array.from({ length: command.bedCount }, (_, index) => ({
          organization_id: command.organizationId,
          room_id: data.id,
          code: `B${index + 1}`,
        })),
      );
      if (bedsError) throw bedsError;
    }
    return data.id;
  },
  async archive(id: string) {
    const { error } = await getSupabaseClient()
      .from("rooms")
      .update({ status: "archived", archived_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },
};
