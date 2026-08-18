import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import * as ImagePicker from "expo-image-picker";
import { ImagePlus } from "lucide-react-native";
import { useState } from "react";
import { Pressable, RefreshControl, StyleSheet, TextInput, View } from "react-native";
import { complaintService } from "@/features/complaints/service";
import { getTenantContext } from "@/features/tenant/api";
import { getSupabaseClient } from "@/shared/api/supabase";
import { queryKeys } from "@/shared/api/query-keys";
import { useAuth } from "@/shared/auth/auth-provider";
import { AppText } from "@/shared/components/app-text";
import { PrimaryButton } from "@/shared/components/primary-button";
import { Screen } from "@/shared/components/screen";
import { useRouter } from "expo-router";
import {
  EmptyLedger,
  LoadingSkeleton,
  StateView,
} from "@/shared/components/state-views";
import { toUserMessage } from "@/shared/errors/to-user-message";
import { prepareProofImage, removeUpload } from "@/shared/storage/uploads";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";
export default function TenantRequests() {
  const { session } = useAuth();
  const router = useRouter();
  const colors = useTenantlyColors();
  const cache = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const query = useQuery({
    queryKey: queryKeys.complaints(
      session?.userId ?? "",
      session?.activeOrganizationId ?? "",
    ),
    queryFn: async () => ({
      context: await getTenantContext(),
      complaints: await complaintService.list(),
    }),
  });
  async function pickAttachment() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Photo access is required to attach an image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled) setAsset(result.assets[0] ?? null);
  }
  async function create() {
    const context = query.data?.context;
    if (!context?.tenancy) return;
    setSaving(true);
    setError(null);
    let uploadedPath: string | null = null;
    try {
      let mediaType: string | undefined;
      if (asset) {
        const prepared = await prepareProofImage(asset);
        uploadedPath = `${context.resident.organization_id}/${session?.userId}/${Crypto.randomUUID()}.${prepared.extension}`;
        mediaType = prepared.contentType;
        const { error: uploadError } = await getSupabaseClient()
          .storage.from("complaint-attachments")
          .upload(uploadedPath, prepared.bytes, {
            contentType: prepared.contentType,
            upsert: false,
          });
        if (uploadError) throw uploadError;
      }
      await complaintService.create({
        organizationId: context.resident.organization_id,
        residentId: context.resident.id,
        tenancyId: context.tenancy.id,
        propertyId: context.tenancy.property_id,
        category: "general",
        title,
        description,
        priority: "normal",
        storagePath: uploadedPath ?? undefined,
        mediaType,
      });
      setTitle("");
      setDescription("");
      setAsset(null);
      await Promise.all([
        query.refetch(),
        cache.invalidateQueries({
          queryKey: queryKeys.complaints(
            session?.userId ?? "",
            session?.activeOrganizationId ?? "",
          ),
        }),
        cache.invalidateQueries({
          queryKey: queryKeys.tenantDashboard(
            session?.userId ?? "",
            session?.activeOrganizationId ?? "",
          ),
        }),
        cache.invalidateQueries({
          queryKey: queryKeys.ownerDashboard(
            session?.userId ?? "",
            session?.activeOrganizationId ?? "",
          ),
        }),
        cache.invalidateQueries({
          queryKey: queryKeys.maintenanceTasks(
            session?.userId ?? "",
            session?.activeOrganizationId ?? "",
          ),
        }),
      ]);
    } catch (cause) {
      if (uploadedPath)
        await removeUpload("complaint-attachments", uploadedPath);
      setError(toUserMessage(cause, "Request could not be submitted."));
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
        <AppText variant="heading">Requests</AppText>
        <AppText muted>Report a maintenance or service issue.</AppText>
      </View>
      <TextInput
        accessibilityLabel="Request title"
        placeholder="Short title"
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
      <Pressable
        accessibilityRole="button"
        onPress={() => void pickAttachment()}
        style={[s.attachment, { borderColor: colors.border }]}
      >
        <ImagePlus size={19} color={colors.primary} />
        <AppText variant="label">
          {asset ? "Photo selected" : "Add optional photo"}
        </AppText>
      </Pressable>
      <TextInput
        accessibilityLabel="Request description"
        placeholder="Describe what is happening"
        placeholderTextColor={colors.textMuted}
        multiline
        value={description}
        onChangeText={setDescription}
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
      <PrimaryButton
        label={saving ? "Submitting…" : "Submit request"}
        isDisabled={
          saving || title.trim().length < 3 || description.trim().length < 5
        }
        onPress={() => void create()}
      />
      {error ? (
        <AppText accessibilityRole="alert" style={{ color: colors.danger }}>
          {error}
        </AppText>
      ) : null}
      <AppText variant="section" style={s.section}>
        Your requests
      </AppText>
      {query.isLoading ? <LoadingSkeleton /> : null}
      {query.isError ? (
        <StateView
          kind="error"
          title="Requests unavailable"
          body="We could not load your requests."
          actionLabel="Retry"
          onAction={() => void query.refetch()}
        />
      ) : null}
      {!query.isLoading && !query.isError && !query.data?.complaints.length ? (
        <EmptyLedger
          title="No requests yet"
          body="Submitted maintenance requests will appear here."
        />
      ) : null}
      {query.data?.complaints.map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: "/(tenant)/complaint/[id]" as never,
              params: { id: item.id },
            })
          }
          style={[s.item, { borderColor: colors.border }]}
        >
          <AppText variant="label">{item.title}</AppText>
          <AppText variant="caption" muted>
            {item.priority} · {item.status.replace("_", " ")}
          </AppText>
        </Pressable>
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
  attachment: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: radii.control,
    marginBottom: 10,
  },
  section: { marginTop: spacing.xl, marginBottom: 10 },
  item: {
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    gap: 4,
    marginBottom: 8,
  },
});
