import { useRouter } from "expo-router";
import { useState } from "react";
import { useAuth } from "@/shared/auth/auth-provider";
import { AuthFormScreen } from "@/shared/components/auth-form-screen";
import { toUserMessage } from "@/shared/errors/to-user-message";

export default function ResetPasswordScreen() {
  const { updatePassword } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  return (
    <AuthFormScreen
      title="Choose a new password"
      body="Use at least eight characters."
      submitLabel="Update password"
      fields={[
        {
          name: "password",
          label: "New password",
          secureTextEntry: true,
          autoComplete: "new-password",
        },
      ]}
      error={error}
      onSubmit={async ({ password }) => {
        const pwd = password ?? "";
        if (pwd.length < 8) {
          setError("Password must contain at least 8 characters.");
          return;
        }
        try {
          await updatePassword(pwd);
          router.replace("/");
        } catch (cause) {
          setError(
            toUserMessage(cause, "Could not update the password. Please try again."),
          );
        }
      }}
    />
  );
}
