import { Link } from "expo-router";
import { useState } from "react";
import { useAuth } from "@/shared/auth/auth-provider";
import { AuthFormScreen } from "@/shared/components/auth-form-screen";

export default function ForgotPasswordScreen() {
  const { requestPasswordReset } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  return (
    <AuthFormScreen
      title="Reset password"
      body="We will email a secure password-reset link."
      submitLabel="Send reset link"
      fields={[
        {
          name: "email",
          label: "Email",
          autoComplete: "email",
          keyboardType: "email-address",
        },
      ]}
      error={error}
      notice={notice}
      onSubmit={async ({ email }) => {
        setError(null);
        try {
          await requestPasswordReset(email ?? "");
          setNotice("Check your inbox for the reset link.");
        } catch (cause) {
          setError(
            cause instanceof Error ? cause.message : "Could not send the link.",
          );
        }
      }}
      footer={<Link href="/(auth)/login">Back to sign in</Link>}
    />
  );
}
