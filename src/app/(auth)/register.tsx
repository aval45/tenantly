import { useRouter } from "expo-router";
import { useState } from "react";

import { useAuth } from "@/shared/auth/auth-provider";
import { AuthLink } from "@/shared/components/auth-link";
import { AuthFormScreen } from "@/shared/components/auth-form-screen";

import { toUserMessage } from "@/shared/errors/to-user-message";

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  return (
    <AuthFormScreen
      title="Create your workspace"
      body="Start with an owner account. You can invite residents after setup."
      submitLabel="Create account"
      fields={[
        { name: "fullName", label: "Full name", autoComplete: "name" },
        {
          name: "email",
          label: "Email",
          autoComplete: "email",
          keyboardType: "email-address",
        },
        {
          name: "password",
          label: "Password (8+ characters)",
          secureTextEntry: true,
          autoComplete: "new-password",
        },
      ]}
      error={error}
      onSubmit={async (values) => {
        setError(null);
        const fullName = (values.fullName ?? "").trim();
        const email = (values.email ?? "").trim().toLowerCase();
        const password = values.password ?? "";

        if (!fullName || fullName.length < 2) {
          setError("Please enter your full name (at least 2 characters).");
          return;
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          setError("Please enter a valid email address.");
          return;
        }
        if (password.length < 8) {
          setError("Password must contain at least 8 characters.");
          return;
        }

        try {
          const verify = await signUp({
            fullName,
            email,
            password,
          });
          router.replace(
            (verify
              ? {
                  pathname: "/(auth)/verify-email",
                  params: { email },
                }
              : "/") as never,
          );
        } catch (cause) {
          setError(
            toUserMessage(cause, "Account creation failed. Please try again."),
          );
        }
      }}
      footer={
        <AuthLink href={"/(auth)/login" as never}>
          Already have an account?
        </AuthLink>
      }
    />
  );
}
