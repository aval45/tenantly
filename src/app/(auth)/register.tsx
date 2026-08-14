import { Link, useRouter } from "expo-router";
import { useState } from "react";

import { useAuth } from "@/shared/auth/auth-provider";
import { AuthFormScreen } from "@/shared/components/auth-form-screen";

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
        if ((values.password?.length ?? 0) < 8) {
          setError("Use at least 8 characters.");
          return;
        }
        try {
          const verify = await signUp({
            fullName: values.fullName ?? "",
            email: values.email ?? "",
            password: values.password ?? "",
          });
          router.replace(
            (verify
              ? {
                  pathname: "/(auth)/verify-email",
                  params: { email: values.email ?? "" },
                }
              : "/") as never,
          );
        } catch (cause) {
          setError(
            cause instanceof Error ? cause.message : "Account creation failed.",
          );
        }
      }}
      footer={
        <Link href={"/(auth)/login" as never}>Already have an account?</Link>
      }
    />
  );
}
