import { useState, type ReactNode, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { ArrowRight, CheckCircle2 } from "lucide-react-native";
import { Controller, useForm } from "react-hook-form";
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

import {
  createOrganizationCommandSchema,
  type CreateOrganizationCommand,
} from "@/features/organizations/service";
import { useAuth } from "@/shared/auth/auth-provider";
import { AppText } from "@/shared/components/app-text";
import { BrandMark } from "@/shared/components/brand-mark";
import { PrimaryButton } from "@/shared/components/primary-button";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";
import { toUserMessage } from "@/shared/errors/to-user-message";

type SetupForm = Pick<CreateOrganizationCommand, "name" | "slug">;
const setupSchema = createOrganizationCommandSchema.pick({
  name: true,
  slug: true,
});

export default function OrganizationSetupScreen() {
  const colors = useTenantlyColors();
  const router = useRouter();
  const { completeOwnerSetup, signOut } = useAuth();
  const slugRef = useRef<TextInput>(null);
  const [rootError, setRootError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SetupForm>({
    resolver: zodResolver(setupSchema),
    defaultValues: { name: "", slug: "" },
  });

  async function onSubmit(values: SetupForm) {
    setRootError(null);
    try {
      await completeOwnerSetup({
        organizationName: values.name.trim(),
        slug: values.slug.trim(),
      });
      router.replace("/(owner)");
    } catch (cause) {
      setRootError(toUserMessage(cause, "Could not create workspace. Please try again."));
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.safe}
      >
        <ScrollView
          automaticallyAdjustKeyboardInsets
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.page}
        >
          <View style={styles.header}>
            <BrandMark compact />
            <AppText variant="section">Tenantly</AppText>
            <AppText variant="caption" muted style={styles.step}>
              Step 1 of 1
            </AppText>
          </View>

          <View style={styles.intro}>
            <View style={[styles.rule, { backgroundColor: colors.accent }]} />
            <AppText variant="eyebrow" style={{ color: colors.accent }}>
              OWNER SETUP
            </AppText>
            <AppText variant="display">Name your workspace.</AppText>
            <AppText muted style={styles.description}>
              This creates your organization and owner membership in Supabase.
              Property details come next.
            </AppText>
          </View>

          <View style={[styles.note, { backgroundColor: colors.primarySoft }]}>
            <CheckCircle2 size={18} color={colors.primary} aria-hidden />
            <AppText variant="caption" style={styles.noteText}>
              Your first workspace begins with an owner membership. Property
              details come next.
            </AppText>
          </View>

          <View style={styles.form}>
            <Field label="Workspace name" error={errors.name?.message}>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    accessibilityLabel="Workspace name"
                    autoCapitalize="words"
                    autoComplete="organization"
                    returnKeyType="next"
                    onSubmitEditing={() => slugRef.current?.focus()}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="e.g. Greenwood Living"
                    placeholderTextColor={colors.textMuted}
                    style={[
                      styles.input,
                      {
                        borderColor: errors.name
                          ? colors.danger
                          : colors.border,
                        backgroundColor: colors.surfaceRaised,
                        color: colors.text,
                      },
                    ]}
                    value={value}
                  />
                )}
              />
            </Field>

            <Field
              label="Workspace address"
              error={errors.slug?.message}
              hint="Lowercase letters, numbers, and hyphens only."
            >
              <Controller
                control={control}
                name="slug"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    style={[
                      styles.slugInput,
                      {
                        borderColor: errors.slug
                          ? colors.danger
                          : colors.border,
                        backgroundColor: colors.surfaceRaised,
                      },
                    ]}
                  >
                    <AppText variant="body" muted>
                      tenantly.app/
                    </AppText>
                    <TextInput
                      ref={slugRef}
                      accessibilityLabel="Workspace address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={() => void handleSubmit(onSubmit)()}
                      onBlur={onBlur}
                      onChangeText={(text) =>
                        onChange(text.toLowerCase().replace(/\s+/g, "-"))
                      }
                      placeholder="greenwood-living"
                      placeholderTextColor={colors.textMuted}
                      style={[styles.slugText, { color: colors.text }]}
                      value={value}
                    />
                  </View>
                )}
              />
            </Field>
          </View>

          <View style={styles.footer}>
            {rootError ? (
              <AppText accessibilityRole="alert" style={{ color: colors.danger }}>
                {rootError}
              </AppText>
            ) : null}
            <PrimaryButton
              label={isSubmitting ? "Creating workspace…" : "Create workspace"}
              isDisabled={isSubmitting}
              onPress={() => void handleSubmit(onSubmit)()}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to sign in"
              onPress={() => {
                void signOut().then(() => router.replace("/(auth)/login"));
              }}
              style={styles.back}
            >
              <AppText variant="label" style={{ color: colors.primary }}>
                Back to sign in
              </AppText>
              <ArrowRight size={16} color={colors.primary} aria-hidden />
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  children,
  error,
  hint,
  label,
}: {
  children: ReactNode;
  error?: string;
  hint?: string;
  label: string;
}) {
  const colors = useTenantlyColors();
  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      {children}
      {error ? (
        <AppText variant="caption" style={{ color: colors.danger }}>
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" muted>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  page: {
    flex: 1,
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    paddingHorizontal: spacing.content,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  step: { marginLeft: "auto" },
  intro: {
    marginTop: "auto",
    gap: 11,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  rule: { width: 40, height: 4, borderRadius: 2 },
  description: { fontSize: 16, lineHeight: 24 },
  note: {
    borderRadius: radii.card,
    padding: spacing.md,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  noteText: { flex: 1, lineHeight: 19 },
  form: { marginTop: spacing.lg, gap: spacing.md },
  field: { gap: 7 },
  input: {
    minHeight: 52,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.control,
    paddingHorizontal: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
  },
  slugInput: {
    minHeight: 52,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.control,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  slugText: {
    flex: 1,
    minHeight: 50,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    paddingLeft: 1,
  },
  footer: { marginTop: "auto", paddingTop: spacing.lg, gap: 14 },
  back: {
    minHeight: 44,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
  },
});
