import { Button, type ButtonRootProps } from "heroui-native/button";
import type { PressableStateCallbackType } from "react-native";
import { useTenantlyColors } from "@/shared/theme/tokens";
import { motion } from "@/shared/theme/motion";

export type PrimaryButtonProps = {
  label: string;
  onPress(): void;
  isDisabled?: boolean;
  style?: ButtonRootProps["style"];
};

export function PrimaryButton({
  label,
  onPress,
  isDisabled = false,
  style,
}: PrimaryButtonProps) {
  const colors = useTenantlyColors();
  const buttonStyle = (state: PressableStateCallbackType) => [
    {
      backgroundColor: colors.accent,
      borderBottomWidth: 3,
      borderBottomColor: colors.accentPressed,
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
