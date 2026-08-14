import { Redirect } from "expo-router";
import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { getSupabaseClient } from "@/shared/api/supabase";
import { useAuth } from "@/shared/auth/auth-provider";
import { AppText } from "@/shared/components/app-text";
import { PrimaryButton } from "@/shared/components/primary-button";
import { Screen } from "@/shared/components/screen";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";
export default function ProfileRoute() {
  const { status } = useAuth();
  if (status === "unconfigured")
    return <Redirect href={"/configuration-required" as never} />;
  if (status === "restoring") return null;
  if (status === "unauthenticated") return <Redirect href="/(auth)/login" />;
  return <ProfileScreen />;
}

function ProfileScreen() {
  const { session, refreshSession } = useAuth();
  const colors = useTenantlyColors();
  const [name, setName] = useState(session?.profile.fullName ?? "");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  async function save() {
    setSaving(true);
    try {
      const { error } = await getSupabaseClient()
        .from("profiles")
        .update({ full_name: name, phone_e164: phone || null })
        .eq("id", session?.userId ?? "");
      if (error) throw error;
      await refreshSession();
      setNotice("Profile updated.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <Screen>
      <View style={s.header}>
        <AppText variant="heading">Profile</AppText>
        <AppText muted>Update your shared account details.</AppText>
      </View>
      <View style={s.field}>
        <AppText variant="label">Full name</AppText>
        <TextInput
          accessibilityLabel="Full name"
          value={name}
          onChangeText={setName}
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
        <AppText variant="label">Phone (E.164)</AppText>
        <TextInput
          accessibilityLabel="Phone"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          placeholder="+919876543210"
          placeholderTextColor={colors.textMuted}
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
      {notice ? (
        <AppText style={{ color: colors.success }}>{notice}</AppText>
      ) : null}
      <PrimaryButton
        label={saving ? "Saving…" : "Save profile"}
        isDisabled={saving || name.trim().length < 2}
        onPress={() => void save()}
      />
    </Screen>
  );
}
const s = StyleSheet.create({
  header: { gap: 5, paddingVertical: spacing.lg },
  field: { gap: 7, marginBottom: spacing.md },
  input: {
    minHeight: 52,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.control,
    paddingHorizontal: 14,
    fontSize: 16,
  },
});
