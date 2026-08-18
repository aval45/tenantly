import { useState } from "react";
import { useAuth } from "@/shared/auth/auth-provider";
import { AuthLink } from "@/shared/components/auth-link";
import { AuthFormScreen } from "@/shared/components/auth-form-screen";
import { toUserMessage } from "@/shared/errors/to-user-message";

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
        const normalizedEmail = (email ?? "").trim().toLowerCase();
        if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
          setError("Please enter a valid email address.");
          return;
        }
        try {
          await requestPasswordReset(normalizedEmail);
          setNotice("Check your inbox for the reset link.");
        } catch (cause) {
          setError(
            toUserMessage(cause, "Could not send the password reset link. Please try again."),
          );
        }
      }}
      footer={<AuthLink href="/(auth)/login">Back to sign in</AuthLink>}
    />
  );
}
