import { getSupabaseClient } from "@/shared/api/supabase";
export async function getTenantContext() {
  const client = getSupabaseClient();
  const { data: resident, error } = await client
    .from("residents")
    .select("*")
    .eq("profile_id", (await client.auth.getUser()).data.user?.id ?? "")
    .single();
  if (error) throw error;
  const { data: tenancies, error: tenancyError } = await client
    .from("tenancies")
    .select("*")
    .eq("resident_id", resident.id)
    .in("status", ["active", "notice_period"])
    .limit(1);
  if (tenancyError) throw tenancyError;
  return { resident, tenancy: tenancies[0] ?? null };
}
