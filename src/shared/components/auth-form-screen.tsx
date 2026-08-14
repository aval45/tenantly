import type { ReactNode } from "react";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText } from "./app-text";
import { BrandMark } from "./brand-mark";
import { PrimaryButton } from "./primary-button";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";

type Field = {
  name: string;
  label: string;
  secureTextEntry?: boolean;
  autoComplete?: "email" | "name" | "current-password" | "new-password";
  keyboardType?: "default" | "email-address";
};
export function AuthFormScreen({
  title,
  body,
  fields,
  submitLabel,
  error,
  notice,
  footer,
  onSubmit,
}: {
  title: string;
  body: string;
  fields: Field[];
  submitLabel: string;
  error?: string | null;
  notice?: string | null;
  footer?: ReactNode;
  onSubmit(values: Record<string, string>): Promise<void>;
}) {
  const colors = useTenantlyColors();
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  async function submit() {
    setSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.page}>
          <View style={styles.brandLine}>
            <BrandMark />
            <View style={styles.wordmark}>
              <AppText variant="eyebrow" style={{ color: colors.accent }}>
                TENANTLY
              </AppText>
              <AppText variant="caption" muted>
                RENT, KEPT WELL
              </AppText>
            </View>
          </View>
          <AppText variant="display">{title}</AppText>
          <AppText muted>{body}</AppText>
          <View style={styles.form}>
            {fields.map((field) => (
              <View key={field.name} style={styles.field}>
                <AppText variant="label">{field.label}</AppText>
                <TextInput
                  accessibilityLabel={field.label}
                  autoCapitalize={
                    field.keyboardType === "email-address" ? "none" : "words"
                  }
                  autoComplete={field.autoComplete}
                  keyboardType={field.keyboardType}
                  secureTextEntry={field.secureTextEntry}
                  value={values[field.name] ?? ""}
                  onChangeText={(value) =>
                    setValues((current) => ({
                      ...current,
                      [field.name]: value,
                    }))
                  }
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: colors.surfaceRaised,
                    },
                  ]}
                />
              </View>
            ))}
            {error ? (
              <AppText
                accessibilityRole="alert"
                style={{ color: colors.danger }}
              >
                {error}
              </AppText>
            ) : null}
            {notice ? (
              <AppText
                accessibilityRole="alert"
                style={{ color: colors.success }}
              >
                {notice}
              </AppText>
            ) : null}
            <PrimaryButton
              label={submitting ? "Please wait…" : submitLabel}
              isDisabled={submitting}
              onPress={() => void submit()}
            />
          </View>
          <View style={styles.footer}>{footer}</View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1 },
  page: {
    flex: 1,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    justifyContent: "center",
    padding: spacing.content,
    gap: 10,
  },
  brandLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: spacing.lg,
  },
  wordmark: { gap: 1 },
  form: { gap: spacing.md, marginTop: spacing.lg },
  field: { gap: 7 },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderLeftWidth: 3,
    borderRadius: radii.control,
    paddingHorizontal: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
  },
  footer: {
    minHeight: 48,
    marginTop: spacing.md,
    gap: 12,
    alignItems: "center",
  },
});
