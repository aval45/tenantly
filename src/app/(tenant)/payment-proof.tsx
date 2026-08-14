import * as ImagePicker from "expo-image-picker";
import * as Crypto from "expo-crypto";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ImagePlus } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { billingService } from "@/features/billing/service";
import { getSupabaseClient } from "@/shared/api/supabase";
import { useAuth } from "@/shared/auth/auth-provider";
import type { PaymentMethod } from "@/shared/api/database.types";
import { AppText } from "@/shared/components/app-text";
import { PrimaryButton } from "@/shared/components/primary-button";
import { Screen } from "@/shared/components/screen";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";
const methods: PaymentMethod[] = ["upi", "bank_transfer", "cash", "other"];
export default function PaymentProof() {
  const { invoiceId, amountPaise } = useLocalSearchParams<{
    invoiceId: string;
    amountPaise: string;
  }>();
  const { session } = useAuth();
  const router = useRouter();
  const colors = useTenantlyColors();
  const [amount, setAmount] = useState(String(Number(amountPaise) / 100));
  const [method, setMethod] = useState<PaymentMethod>("upi");
  const [reference, setReference] = useState("");
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  async function pick() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Photo access is required to attach a proof image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled) setAsset(result.assets[0] ?? null);
  }
  async function submit() {
    setSaving(true);
    setError(null);
    try {
      let path: string | undefined;
      if (asset) {
        const response = await fetch(asset.uri);
        const bytes = await response.arrayBuffer();
        path = `${session?.activeOrganizationId}/${session?.userId}/${Crypto.randomUUID()}.jpg`;
        const { error: uploadError } = await getSupabaseClient()
          .storage.from("payment-proofs")
          .upload(path, bytes, {
            contentType: asset.mimeType ?? "image/jpeg",
            upsert: false,
          });
        if (uploadError) throw uploadError;
      }
      await billingService.submitPayment({
        invoiceId,
        amountPaise: Math.round(Number(amount) * 100),
        method,
        paidOn: new Date().toISOString().slice(0, 10),
        reference,
        proofPath: path,
        idempotencyKey: `payment-${invoiceId}-${Date.now()}`,
      });
      router.replace("/(tenant)/payments" as never);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Payment submission failed.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <Screen>
      <View style={s.header}>
        <AppText variant="heading">Submit payment proof</AppText>
        <AppText muted>
          The owner must approve this before your invoice balance changes.
        </AppText>
      </View>
      <View style={s.field}>
        <AppText variant="label">Amount paid (₹)</AppText>
        <TextInput
          accessibilityLabel="Amount paid"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
          style={[
            s.input,
            {
              color: colors.text,
              borderColor: colors.border,
              backgroundColor: colors.surfaceRaised,
            },
          ]}
        />
      </View>
      <View style={s.field}>
        <AppText variant="label">Payment method</AppText>
        <View style={s.methods}>
          {methods.map((item) => (
            <Pressable
              key={item}
              accessibilityRole="radio"
              accessibilityState={{ selected: item === method }}
              onPress={() => setMethod(item)}
              style={[
                s.method,
                {
                  borderColor: item === method ? colors.accent : colors.border,
                  backgroundColor:
                    item === method ? colors.accentSoft : colors.surface,
                },
              ]}
            >
              <AppText variant="caption">{item.replace("_", " ")}</AppText>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={s.field}>
        <AppText variant="label">Transaction reference</AppText>
        <TextInput
          accessibilityLabel="Transaction reference"
          value={reference}
          onChangeText={setReference}
          style={[
            s.input,
            {
              color: colors.text,
              borderColor: colors.border,
              backgroundColor: colors.surfaceRaised,
            },
          ]}
        />
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => void pick()}
        style={[s.picker, { borderColor: colors.border }]}
      >
        <ImagePlus size={20} color={colors.primary} />
        <AppText variant="label">
          {asset ? "Proof image selected" : "Choose proof image"}
        </AppText>
      </Pressable>
      {error ? (
        <AppText style={{ color: colors.danger }}>{error}</AppText>
      ) : null}
      <PrimaryButton
        label={saving ? "Submitting…" : "Submit for review"}
        isDisabled={
          saving ||
          Number(amount) <= 0 ||
          ((method === "upi" || method === "bank_transfer") && !asset)
        }
        onPress={() => void submit()}
      />
    </Screen>
  );
}
const s = StyleSheet.create({
  header: { gap: 5, paddingVertical: spacing.lg },
  field: { gap: 8, marginBottom: spacing.md },
  input: {
    minHeight: 52,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.control,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  methods: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  method: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: radii.control,
  },
  picker: {
    minHeight: 52,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderRadius: radii.control,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
});
