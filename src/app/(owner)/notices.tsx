import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { StyleSheet, Switch, TextInput, View } from "react-native";
import { getSupabaseClient } from "@/shared/api/supabase";
import { useAuth } from "@/shared/auth/auth-provider";
import { AppText } from "@/shared/components/app-text";
import { PrimaryButton } from "@/shared/components/primary-button";
import { Screen } from "@/shared/components/screen";
import { EmptyLedger } from "@/shared/components/state-views";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";
export default function NoticesScreen() {
  const { session } = useAuth();
  const colors = useTenantlyColors();
  const cache = useQueryClient();
  const org = session?.activeOrganizationId ?? "";
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const query = useQuery({
    queryKey: ["notices", org],
    queryFn: async () => {
      const { data, error } = await getSupabaseClient()
        .from("notices")
        .select("*")
        .eq("organization_id", org)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!org,
  });
  async function publish() {
    setSaving(true);
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("notices")
        .insert({
          organization_id: org,
          author_id: session?.userId,
          title,
          body,
          is_pinned: pinned,
          category: "general",
        })
        .select("id")
        .single();
      if (error) throw error;
      const { error: targetError } = await client
        .from("notice_targets")
        .insert({
          organization_id: org,
          notice_id: data.id,
          target_type: "organization",
          target_id: org,
        });
      if (targetError) throw targetError;
      setTitle("");
      setBody("");
      await cache.invalidateQueries({ queryKey: ["notices", org] });
    } finally {
      setSaving(false);
    }
  }
  return (
    <Screen>
      <View style={s.header}>
        <AppText variant="heading">Notices</AppText>
        <AppText muted>
          Publish organization-wide updates for residents.
        </AppText>
      </View>
      <TextInput
        accessibilityLabel="Notice title"
        placeholder="Notice title"
        placeholderTextColor={colors.textMuted}
        value={title}
        onChangeText={setTitle}
        style={[
          s.input,
          {
            color: colors.text,
            borderColor: colors.border,
            backgroundColor: colors.surfaceRaised,
          },
        ]}
      />
      <TextInput
        accessibilityLabel="Notice body"
        placeholder="Write the update"
        placeholderTextColor={colors.textMuted}
        multiline
        value={body}
        onChangeText={setBody}
        style={[
          s.input,
          s.body,
          {
            color: colors.text,
            borderColor: colors.border,
            backgroundColor: colors.surfaceRaised,
          },
        ]}
      />
      <View style={s.pin}>
        <AppText variant="label">Pin notice</AppText>
        <Switch value={pinned} onValueChange={setPinned} />
      </View>
      <PrimaryButton
        label={saving ? "Publishing…" : "Publish notice"}
        isDisabled={saving || title.trim().length < 3 || body.trim().length < 3}
        onPress={() => void publish()}
      />
      <AppText variant="section" style={s.section}>
        Published
      </AppText>
      {!query.isLoading && !query.data?.length ? (
        <EmptyLedger
          title="No notices published"
          body="Your organization-wide updates will be kept here."
        />
      ) : null}
      {query.data?.map((item) => (
        <View key={item.id} style={[s.notice, { borderColor: colors.border }]}>
          <AppText variant="label">
            {item.is_pinned ? "Pinned · " : ""}
            {item.title}
          </AppText>
          <AppText muted>{item.body}</AppText>
        </View>
      ))}
    </Screen>
  );
}
const s = StyleSheet.create({
  header: { gap: 5, paddingVertical: spacing.lg },
  input: {
    minHeight: 52,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.control,
    padding: 14,
    marginBottom: 10,
  },
  body: { minHeight: 100, textAlignVertical: "top" },
  pin: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  section: { marginTop: spacing.xl, marginBottom: 10 },
  notice: {
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    gap: 5,
    marginBottom: 8,
  },
});
