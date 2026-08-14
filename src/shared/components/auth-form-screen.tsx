import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react-native";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>(
    {},
  );
  const inputRefs = useRef<Record<string, TextInput | null>>({});
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
        <ScrollView
          contentContainerStyle={styles.page}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
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
            {fields.map((field, index) => (
              <View key={field.name} style={styles.field}>
                <AppText variant="label">{field.label}</AppText>
                <View
                  style={[
                    styles.inputShell,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.surfaceRaised,
                    },
                  ]}
                >
                  <TextInput
                    ref={(ref) => {
                      inputRefs.current[field.name] = ref;
                    }}
                    accessibilityLabel={field.label}
                    autoCapitalize={
                      field.keyboardType === "email-address"
                        ? "none"
                        : field.secureTextEntry
                          ? "none"
                          : "words"
                    }
                    autoComplete={field.autoComplete}
                    keyboardType={field.keyboardType}
                    secureTextEntry={
                      field.secureTextEntry && !visibleFields[field.name]
                    }
                    returnKeyType={
                      index === fields.length - 1 ? "done" : "next"
                    }
                    onSubmitEditing={() => {
                      const next = fields[index + 1];
                      if (next) inputRefs.current[next.name]?.focus();
                      else void submit();
                    }}
                    value={values[field.name] ?? ""}
                    onChangeText={(value) =>
                      setValues((current) => ({
                        ...current,
                        [field.name]: value,
                      }))
                    }
                    style={[styles.input, { color: colors.text }]}
                  />
                  {field.secureTextEntry ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={
                        visibleFields[field.name]
                          ? `Hide ${field.label}`
                          : `Show ${field.label}`
                      }
                      onPress={() =>
                        setVisibleFields((current) => ({
                          ...current,
                          [field.name]: !current[field.name],
                        }))
                      }
                      style={styles.visibility}
                    >
                      {visibleFields[field.name] ? (
                        <EyeOff size={20} color={colors.textMuted} />
                      ) : (
                        <Eye size={20} color={colors.textMuted} />
                      )}
                    </Pressable>
                  ) : null}
                </View>
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1 },
  page: {
    flexGrow: 1,
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
    flex: 1,
    minHeight: 52,
    paddingHorizontal: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
  },
  inputShell: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderLeftWidth: 3,
    borderRadius: radii.control,
  },
  visibility: {
    width: 48,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    minHeight: 48,
    marginTop: spacing.md,
    gap: 12,
    alignItems: "center",
  },
});
