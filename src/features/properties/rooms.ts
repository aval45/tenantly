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
    const roomIds = data.map((room) => room.id);
    const { data: assignments, error: assignmentsError } = roomIds.length
      ? await client
          .from("occupancy_assignments")
          .select("room_id")
          .in("room_id", roomIds)
          .is("ends_at", null)
      : { data: [], error: null };
    if (assignmentsError) throw assignmentsError;
    const occupancy = new Map<string, number>();
    assignments.forEach((item) =>
      occupancy.set(item.room_id, (occupancy.get(item.room_id) ?? 0) + 1),
    );
    return data.map((room) => ({
      id: room.id,
      organizationId: room.organization_id,
      propertyId: room.property_id,
      code: room.code,
      floor: room.floor_label ?? undefined,
      bedCount: room.capacity,
      monthlyRentPaise: room.default_rent_paise,
      depositPaise: room.default_deposit_paise,
      occupiedBeds: occupancy.get(room.id) ?? 0,
    }));
  },
  async create(input: CreateRoomCommand): Promise<string> {
    const command = createRoomCommandSchema.parse(input);
    const { data, error } = await getSupabaseClient().rpc(
      "create_room_with_beds",
      {
        requested_organization_id: command.organizationId,
        requested_property_id: command.propertyId,
        requested_code: command.code,
        requested_floor_label: command.floor ?? null,
        requested_room_type: command.bedCount > 1 ? "shared" : "private",
        requested_capacity: command.bedCount,
        requested_rent_paise: command.monthlyRentPaise,
        requested_deposit_paise: command.depositPaise,
      },
    );
    if (error) throw error;
    return data;
  },
  async archive(id: string) {
    const { error } = await getSupabaseClient()
      .from("rooms")
      .update({ status: "archived", archived_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },
};
