import { useRouter } from "expo-router";
import { useState } from "react";
import { useAuth } from "@/shared/auth/auth-provider";
import { AuthFormScreen } from "@/shared/components/auth-form-screen";

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
        if ((password?.length ?? 0) < 8) {
          setError("Use at least 8 characters.");
          return;
        }
        try {
          await updatePassword(password ?? "");
          router.replace("/");
        } catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not update the password.",
          );
        }
      }}
    />
  );
}
