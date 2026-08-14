import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

export const motion = {
  duration: 180,
  pressedOpacity: 0.68,
} as const;

export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReducedMotion(enabled);
    });

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReducedMotion,
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reducedMotion;
}

export function useNavigationAnimation() {
  return useReducedMotion() ? ("none" as const) : ("fade" as const);
}
