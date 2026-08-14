import type { ExpoConfig } from "expo/config";

type AppEnvironment = "local" | "staging" | "production";

function getEnvironment(): AppEnvironment {
  const value = process.env.EXPO_PUBLIC_APP_ENV ?? "local";
  if (!["local", "staging", "production"].includes(value)) {
    throw new Error(
      "EXPO_PUBLIC_APP_ENV must be local, staging, or production.",
    );
  }
  return value as AppEnvironment;
}

const environment = getEnvironment();
if (environment !== "local") {
  const required = [
    "EXPO_PUBLIC_SUPABASE_URL",
    "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  ];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required public environment values: ${missing.join(", ")}`,
    );
  }
}

const config: ExpoConfig = {
  name: "Tenantly",
  slug: "tenantly",
  version: "1.0.0",
  orientation: "default",
  scheme: "tenantly",
  userInterfaceStyle: "automatic",
  icon: "./assets/images/icon.png",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "in.tenantly.app",
  },
  android: {
    package: "in.tenantly.app",
    predictiveBackGestureEnabled: true,
    adaptiveIcon: {
      backgroundColor: "#FAFAFA",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-image-picker",
    "expo-document-picker",
    "expo-notifications",
    "expo-sharing",
    "expo-sqlite",
    "@sentry/react-native",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#FAFAFA",
        image: "./assets/images/splash-icon.png",
        imageWidth: 88,
      },
    ],
  ],
  experiments: { typedRoutes: true, reactCompiler: true },
  extra: { appEnvironment: environment },
};

export default config;
