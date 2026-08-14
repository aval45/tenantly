import { z } from "zod";

import { getSupabaseClient } from "@/shared/api/supabase";

export const noticeTargetTypeSchema = z.enum([
  "organization",
  "property",
  "room",
  "resident",
]);
export type NoticeTargetType = z.infer<typeof noticeTargetTypeSchema>;

const publishNoticeSchema = z.object({
  organizationId: z.uuid(),
  title: z.string().trim().min(3).max(160),
  body: z.string().trim().min(3).max(4000),
  isPinned: z.boolean(),
  targetType: noticeTargetTypeSchema,
  targetIds: z.array(z.uuid()).min(1),
});

export const noticeService = {
  async publish(input: z.input<typeof publishNoticeSchema>) {
    const value = publishNoticeSchema.parse(input);
    const { data, error } = await getSupabaseClient().rpc("publish_notice", {
      requested_organization_id: value.organizationId,
      requested_title: value.title,
      requested_body: value.body,
      requested_is_pinned: value.isPinned,
      requested_target_type: value.targetType,
      requested_target_ids: value.targetIds,
    });
    if (error) throw error;
    return data;
  },
};
