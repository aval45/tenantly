import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import { Platform, Pressable, Share, StyleSheet, View } from "react-native";
import { billingService } from "@/features/billing/service";
import { residentService } from "@/features/residents/service";
import { getSupabaseClient } from "@/shared/api/supabase";
import { useAuth } from "@/shared/auth/auth-provider";
import { AppText } from "@/shared/components/app-text";
import { PrimaryButton } from "@/shared/components/primary-button";
import { Screen } from "@/shared/components/screen";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";

function downloadWeb(name: string, content: string) {
  if (typeof document === "undefined") return;
  const url = URL.createObjectURL(
    new Blob([content], { type: "text/csv;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}
export default function ReportsScreen() {
  const { session } = useAuth();
  const colors = useTenantlyColors();
  const cache = useQueryClient();
  const [exporting, setExporting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [residentId, setResidentId] = useState("");
  const [notice, setNotice] = useState("");
  const org = session?.activeOrganizationId ?? "";
  const residents = useQuery({
    queryKey: ["residents", org],
    queryFn: () => residentService.list(org),
    enabled: !!org,
  });
  const effectiveResidentId =
    residentId ||
    (residents.data?.length === 1 ? (residents.data[0]?.id ?? "") : "");
  async function exportInvoices() {
    setExporting(true);
    try {
      const invoices = await billingService.listInvoices(org);
      const csv = [
        "Invoice number,Period,Due date,Total paise,Paid paise,Balance paise,Status",
        ...invoices.map((item) =>
          [
            item.invoice_number,
            item.period_start,
            item.due_date,
            item.total_paise,
            item.paid_paise,
            item.balance_paise,
            item.status,
          ].join(","),
        ),
      ].join("\n");
      if (Platform.OS === "web") downloadWeb("tenantly-invoices.csv", csv);
      else
        await Share.share({ title: "Tenantly invoice export", message: csv });
    } finally {
      setExporting(false);
    }
  }
  async function uploadDocument() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/jpeg", "image/png"],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    setUploading(true);
    try {
      const asset = result.assets[0];
      if (!asset) return;
      const bytes = await (await fetch(asset.uri)).arrayBuffer();
      const extension = asset.name.split(".").pop()?.toLowerCase() ?? "pdf";
      const path = `${org}/${session?.userId}/${Crypto.randomUUID()}.${extension}`;
      const client = getSupabaseClient();
      const { error: uploadError } = await client.storage
        .from("resident-documents")
        .upload(path, bytes, {
          contentType: asset.mimeType ?? "application/pdf",
          upsert: false,
        });
      if (uploadError) throw uploadError;
      const { error } = await client.from("documents").insert({
        organization_id: org,
        resident_id: effectiveResidentId,
        profile_id: null,
        document_type: "resident_document",
        storage_path: path,
        uploaded_by: session?.userId,
      });
      if (error) throw error;
      setNotice("Document uploaded privately.");
      await cache.invalidateQueries({ queryKey: ["documents", org] });
    } finally {
      setUploading(false);
    }
  }
  return (
    <Screen>
      <View style={s.header}>
        <AppText variant="heading">Documents & reports</AppText>
        <AppText muted>
          Export organization invoice data as CSV. Private resident documents
          remain in Supabase Storage.
        </AppText>
      </View>
      <PrimaryButton
        label={exporting ? "Preparing export…" : "Export invoices CSV"}
        isDisabled={exporting}
        onPress={() => void exportInvoices()}
      />
      <AppText variant="section" style={s.section}>
        Upload resident document
      </AppText>
      <View style={s.choices}>
        {residents.data?.map((resident) => (
          <Pressable
            key={resident.id}
            accessibilityRole="radio"
            accessibilityState={{
              selected: resident.id === effectiveResidentId,
            }}
            onPress={() => setResidentId(resident.id)}
            style={[
              s.choice,
              {
                borderColor:
                  resident.id === effectiveResidentId
                    ? colors.accent
                    : colors.border,
                backgroundColor:
                  resident.id === effectiveResidentId
                    ? colors.accentSoft
                    : colors.surface,
              },
            ]}
          >
            <AppText
              variant="caption"
              style={
                resident.id === effectiveResidentId
                  ? { color: colors.accent }
                  : undefined
              }
            >
              {resident.id === effectiveResidentId ? "✓  " : ""}
              {resident.full_name}
            </AppText>
          </Pressable>
        ))}
      </View>
      <PrimaryButton
        label={uploading ? "Uploading…" : "Choose PDF or image"}
        isDisabled={uploading || !effectiveResidentId}
        onPress={() => void uploadDocument()}
      />
      {notice ? (
        <AppText style={{ color: colors.success }}>{notice}</AppText>
      ) : null}
    </Screen>
  );
}
const s = StyleSheet.create({
  header: { gap: 5, paddingVertical: spacing.lg },
  section: { marginTop: spacing.xl, marginBottom: 10 },
  choices: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: spacing.md,
  },
  choice: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: radii.control,
  },
});
