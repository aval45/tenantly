import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import * as ImagePicker from "expo-image-picker";
import { ImagePlus } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { complaintService } from "@/features/complaints/service";
import { getTenantContext } from "@/features/tenant/api";
import { getSupabaseClient } from "@/shared/api/supabase";
import { useAuth } from "@/shared/auth/auth-provider";
import { AppText } from "@/shared/components/app-text";
import { PrimaryButton } from "@/shared/components/primary-button";
import { Screen } from "@/shared/components/screen";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";
export default function TenantRequests() {
  const { session } = useAuth();
  const colors = useTenantlyColors();
  const cache = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const query = useQuery({
    queryKey: ["tenant-requests"],
    queryFn: async () => ({
      context: await getTenantContext(),
      complaints: await complaintService.list(),
    }),
  });
  async function pickAttachment() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
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
    try {
      const complaintId = await complaintService.create({
        organizationId: context.resident.organization_id,
        residentId: context.resident.id,
        tenancyId: context.tenancy.id,
        propertyId: context.tenancy.property_id,
        category: "general",
        title,
        description,
        priority: "normal",
      });
      if (asset) {
        const path = `${context.resident.organization_id}/${session?.userId}/${Crypto.randomUUID()}.jpg`;
        const bytes = await (await fetch(asset.uri)).arrayBuffer();
        const client = getSupabaseClient();
        const { error: uploadError } = await client.storage
          .from("complaint-attachments")
          .upload(path, bytes, {
            contentType: asset.mimeType ?? "image/jpeg",
            upsert: false,
          });
        if (uploadError) throw uploadError;
        const { error } = await client.from("attachments").insert({
          organization_id: context.resident.organization_id,
          entity_type: "complaint",
          entity_id: complaintId,
          storage_path: path,
          media_type: asset.mimeType ?? "image/jpeg",
          uploaded_by: session?.userId,
        });
        if (error) throw error;
      }
      setTitle("");
      setDescription("");
      setAsset(null);
      await cache.invalidateQueries({ queryKey: ["tenant-requests"] });
    } finally {
      setSaving(false);
    }
  }
  return (
    <Screen>
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
      <AppText variant="section" style={s.section}>
        Your requests
      </AppText>
      {query.data?.complaints.map((item) => (
        <View key={item.id} style={[s.item, { borderColor: colors.border }]}>
          <AppText variant="label">{item.title}</AppText>
          <AppText variant="caption" muted>
            {item.priority} · {item.status.replace("_", " ")}
          </AppText>
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
