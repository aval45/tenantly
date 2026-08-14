import { Link, useRouter } from "expo-router";
import { useState } from "react";

import { useAuth } from "@/shared/auth/auth-provider";
import { AuthFormScreen } from "@/shared/components/auth-form-screen";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  return (
    <AuthFormScreen
      title="Welcome back"
      body="Sign in to your private property workspace."
      submitLabel="Sign in"
      fields={[
        {
          name: "email",
          label: "Email",
          autoComplete: "email",
          keyboardType: "email-address",
        },
        {
          name: "password",
          label: "Password",
          secureTextEntry: true,
          autoComplete: "current-password",
        },
      ]}
      error={error}
      onSubmit={async (values) => {
        setError(null);
        try {
          await signIn({
            email: values.email ?? "",
            password: values.password ?? "",
          });
          router.replace("/");
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "Sign in failed.");
        }
      }}
      footer={
        <>
          <Link href={"/(auth)/forgot-password" as never}>
            Forgot password?
          </Link>
          <Link href={"/(auth)/register" as never}>
            Create an owner account
          </Link>
        </>
      }
    />
  );
}
