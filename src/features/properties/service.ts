import { z } from "zod";

import { getSupabaseClient } from "@/shared/api/supabase";

export const createPropertyCommandSchema = z.object({
  name: z.string().trim().min(2).max(120),
  addressLine1: z.string().trim().min(3).max(160),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  postalCode: z
    .string()
    .trim()
    .regex(/^[1-9][0-9]{5}$/),
  propertyType: z.enum(["apartment", "pg", "hostel", "house"]),
});
export type CreatePropertyCommand = z.infer<typeof createPropertyCommandSchema>;
export type PropertySummary = CreatePropertyCommand & {
  id: string;
  occupied: number;
  capacity: number;
};

export const propertyService = {
  async list(organizationId: string): Promise<PropertySummary[]> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("properties")
      .select("id,name,address_line_1,city,state,postal_code,property_type")
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .order("name");
    if (error) throw error;
    return Promise.all(
      data.map(async (property) => {
        const { data: rooms, error: roomError } = await client
          .from("rooms")
          .select("id,capacity")
          .eq("property_id", property.id)
          .eq("status", "active");
        if (roomError) throw roomError;
        const roomIds = rooms.map((room) => room.id);
        const occupancy = roomIds.length
          ? await client
              .from("occupancy_assignments")
              .select("id")
              .in("room_id", roomIds)
              .is("ends_at", null)
          : { data: [], error: null };
        if (occupancy.error) throw occupancy.error;
        return {
          id: property.id,
          name: property.name,
          addressLine1: property.address_line_1,
          city: property.city,
          state: property.state,
          postalCode: property.postal_code,
          propertyType:
            property.property_type as CreatePropertyCommand["propertyType"],
          occupied: occupancy.data?.length ?? 0,
          capacity: rooms.reduce((sum, room) => sum + room.capacity, 0),
        };
      }),
    );
  },
  async get(organizationId: string, id: string) {
    const items = await this.list(organizationId);
    return items.find((property) => property.id === id) ?? null;
  },
  async create(
    organizationId: string,
    input: CreatePropertyCommand,
  ): Promise<string> {
    const command = createPropertyCommandSchema.parse(input);
    const { data, error } = await getSupabaseClient()
      .from("properties")
      .insert({
        organization_id: organizationId,
        name: command.name,
        property_type: command.propertyType,
        address_line_1: command.addressLine1,
        city: command.city,
        state: command.state,
        postal_code: command.postalCode,
      })
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  },
  async archive(id: string) {
    const { error } = await getSupabaseClient()
      .from("properties")
      .update({ status: "archived", archived_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },
};
