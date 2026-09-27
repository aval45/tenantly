import React from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useDialogStore } from "@/stores/dialog-store";
import { AppText } from "./app-text";
import { motion } from "@/shared/theme/motion";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";

export function AppDialog() {
  const colors = useTenantlyColors();
  const { isOpen, title, message, buttons, hide } = useDialogStore();

  if (!isOpen) return null;

  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="fade"
      onRequestClose={hide}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={hide} />
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surfaceRaised,
              borderColor: colors.border,
            },
          ]}
        >
          {title ? (
            <AppText variant="section" style={{ color: colors.text }}>
              {title}
            </AppText>
          ) : null}

          {message ? (
            <AppText
              variant="body"
              muted
              style={{ marginTop: spacing.sm, color: colors.textMuted }}
            >
              {message}
            </AppText>
          ) : null}

          <View style={styles.actions}>
            {buttons.map((btn, idx) => {
              const isCancel = btn.style === "cancel";
              const isDestructive = btn.style === "destructive";

              let bg: string = colors.accent;
              let textColor: string = "#ffffff";

              if (isCancel) {
                bg = colors.surfaceSubtle;
                textColor = colors.text;
              } else if (isDestructive) {
                bg = colors.danger;
                textColor = "#ffffff";
              }

              return (
                <Pressable
                  key={idx}
                  accessibilityRole="button"
                  onPress={async () => {
                    hide();
                    await btn.onPress?.();
                  }}
                  style={({ pressed }) => [
                    styles.button,
                    {
                      backgroundColor: bg,
                      opacity: pressed ? motion.pressedOpacity : 1,
                    },
                  ]}
                >
                  <AppText
                    variant="label"
                    style={[styles.buttonLabel, { color: textColor }]}
                  >
                    {btn.text}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.md,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    borderRadius: radii.card,
    borderWidth: 1,
    padding: spacing.lg,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.lg,
    flexWrap: "wrap",
  },
  button: {
    minHeight: 40,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radii.control,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
});
