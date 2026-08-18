import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pressable, RefreshControl, StyleSheet, Switch, TextInput, View } from "react-native";
import { Check } from "lucide-react-native";
import { getSupabaseClient } from "@/shared/api/supabase";
import { queryKeys } from "@/shared/api/query-keys";
import {
  noticeService,
  type NoticeTargetType,
} from "@/features/notices/service";
import { useAuth } from "@/shared/auth/auth-provider";
import { AppText } from "@/shared/components/app-text";
import { PrimaryButton } from "@/shared/components/primary-button";
import { Screen } from "@/shared/components/screen";
import {
  EmptyLedger,
  LoadingSkeleton,
  StateView,
} from "@/shared/components/state-views";
import { toUserMessage } from "@/shared/errors/to-user-message";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";
export default function NoticesScreen() {
  const { session } = useAuth();
  const colors = useTenantlyColors();
  const cache = useQueryClient();
  const org = session?.activeOrganizationId ?? "";
  const userId = session?.userId ?? "";
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [targetType, setTargetType] = useState<NoticeTargetType>(
    session?.capabilities.publishOrganizationNotices
      ? "organization"
      : "property",
  );
  const [targetIds, setTargetIds] = useState<string[]>(
    session?.capabilities.publishOrganizationNotices ? [org] : [],
  );
  const query = useQuery({
    queryKey: queryKeys.notices(userId, org),
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
  const targets = useQuery({
    queryKey: ["notice-target-options", userId, org, targetType],
    queryFn: async () => {
      const client = getSupabaseClient();
      if (targetType === "organization")
        return [{ id: org, label: "Entire organization" }];
      if (targetType === "property") {
        const { data, error } = await client
          .from("properties")
          .select("id,name")
          .eq("organization_id", org)
          .eq("status", "active")
          .order("name");
        if (error) throw error;
        return data.map((item) => ({ id: item.id, label: item.name }));
      }
      if (targetType === "room") {
        const { data, error } = await client
          .from("rooms")
          .select("id,code")
          .eq("organization_id", org)
          .eq("status", "active")
          .order("code");
        if (error) throw error;
        return data.map((item) => ({ id: item.id, label: item.code }));
      }
      const { data, error } = await client
        .from("residents")
        .select("id,full_name")
        .eq("organization_id", org)
        .eq("status", "active")
        .order("full_name");
      if (error) throw error;
      return data.map((item) => ({ id: item.id, label: item.full_name }));
    },
    enabled: !!org,
  });
  async function publish() {
    setSaving(true);
    setError(null);
    try {
      await noticeService.publish({
        organizationId: org,
        title,
        body,
        isPinned: pinned,
        targetType,
        targetIds,
      });
      setTitle("");
      setBody("");
      setPinned(false);
      const defaultTarget = session?.capabilities.publishOrganizationNotices
        ? "organization"
        : "property";
      setTargetType(defaultTarget);
      setTargetIds(defaultTarget === "organization" ? [org] : []);
      await Promise.all([
        cache.invalidateQueries({
          queryKey: queryKeys.notices(userId, org),
        }),
        cache.invalidateQueries({
          queryKey: queryKeys.tenantDashboard(userId, org),
        }),
      ]);
    } catch (cause) {
      setError(toUserMessage(cause, "Notice could not be published."));
    } finally {
      setSaving(false);
    }
  }
  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={query.isRefetching}
          onRefresh={() => void query.refetch()}
          tintColor={colors.primary}
        />
      }
    >
      <View style={s.header}>
        <AppText variant="heading">Notices</AppText>
        <AppText muted>
          Publish updates to the organization or selected properties, rooms, and
          residents.
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
      <AppText variant="label">Audience</AppText>
      <View style={s.targetTypes}>
        {(
          ["organization", "property", "room", "resident"] as NoticeTargetType[]
        )
          .filter(
            (item) =>
              item !== "organization" ||
              session?.capabilities.publishOrganizationNotices,
          )
          .map((item) => (
            <Pressable
              key={item}
              accessibilityRole="radio"
              accessibilityState={{ selected: targetType === item }}
              aria-checked={targetType === item}
              onPress={() => {
                setTargetType(item);
                setTargetIds(item === "organization" ? [org] : []);
              }}
              style={[
                s.targetType,
                {
                  borderColor:
                    targetType === item ? colors.accent : colors.border,
                  backgroundColor:
                    targetType === item ? colors.accentSoft : colors.surface,
                },
              ]}
            >
              <AppText variant="caption">{item}</AppText>
            </Pressable>
          ))}
      </View>
      <View style={s.targets}>
        {targets.data?.map((item) => {
          const selected = targetIds.includes(item.id);
          return (
            <Pressable
              key={item.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              aria-checked={selected}
              onPress={() =>
                setTargetIds((current) =>
                  selected
                    ? current.filter((id) => id !== item.id)
                    : [...current, item.id],
                )
              }
              style={[
                s.target,
                { borderColor: selected ? colors.accent : colors.border },
              ]}
            >
              <AppText variant="label" style={{ flex: 1 }}>
                {item.label}
              </AppText>
              {selected ? <Check size={18} color={colors.accent} /> : null}
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <AppText accessibilityRole="alert" style={{ color: colors.danger }}>
          {error}
        </AppText>
      ) : null}
      <PrimaryButton
        label={saving ? "Publishing…" : "Publish notice"}
        isDisabled={
          saving ||
          title.trim().length < 3 ||
          body.trim().length < 3 ||
          targetIds.length === 0
        }
        onPress={() => void publish()}
      />
      <AppText variant="section" style={s.section}>
        Published
      </AppText>
      {query.isLoading ? <LoadingSkeleton /> : null}
      {query.isError ? (
        <StateView
          kind="error"
          title="Notices unavailable"
          body="Published notices could not be loaded."
          actionLabel="Retry"
          onAction={() => void query.refetch()}
        />
      ) : null}
      {!query.isLoading && !query.data?.length ? (
        <EmptyLedger
          title="No notices published"
          body="Published updates for your audiences will be kept here."
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
  targetTypes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 10,
  },
  targetType: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: radii.control,
  },
  targets: { gap: 8, marginBottom: spacing.md },
  target: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: radii.control,
  },
});
