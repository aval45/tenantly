import { Button, type ButtonRootProps } from "heroui-native/button";
import type { PressableStateCallbackType } from "react-native";
import { useTenantlyColors } from "@/shared/theme/tokens";
import { motion } from "@/shared/theme/motion";

export type PrimaryButtonProps = {
  label: string;
  onPress(): void;
  isDisabled?: boolean;
  style?: ButtonRootProps["style"];
  tone?: "primary" | "danger" | "secondary";
};

export function PrimaryButton({
  label,
  onPress,
  isDisabled = false,
  style,
  tone = "primary",
}: PrimaryButtonProps) {
  const colors = useTenantlyColors();
  const buttonStyle = (state: PressableStateCallbackType) => [
    {
      backgroundColor:
        tone === "danger"
          ? colors.danger
          : tone === "secondary"
            ? colors.secondary
            : colors.accent,
      borderBottomWidth: 3,
      borderBottomColor:
        tone === "danger"
          ? colors.danger
          : tone === "secondary"
            ? colors.primary
            : colors.accentPressed,
      opacity: state.pressed ? motion.pressedOpacity : 1,
    },
    typeof style === "function" ? style(state) : style,
  ];

  return (
    <Button
      accessibilityRole="button"
      className="min-h-12 rounded-control px-5"
      feedbackVariant="none"
      isDisabled={isDisabled}
      onPress={onPress}
      style={buttonStyle}
    >
      <Button.Label className="font-semibold text-white">{label}</Button.Label>
    </Button>
  );
}
