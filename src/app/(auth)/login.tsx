import { useRouter } from "expo-router";
import { useState } from "react";

import { useAuth } from "@/shared/auth/auth-provider";
import { takePendingInvitation } from "@/shared/auth/pending-invitation";
import { AuthLink } from "@/shared/components/auth-link";
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
          const invitationToken = await takePendingInvitation();
          router.replace(
            invitationToken
              ? (`/accept-invitation?token=${encodeURIComponent(invitationToken)}` as never)
              : "/",
          );
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "Sign in failed.");
        }
      }}
      footer={
        <>
          <AuthLink href={"/(auth)/forgot-password" as never}>
            Forgot password?
          </AuthLink>
          <AuthLink href={"/(auth)/register" as never}>
            Create an owner account
          </AuthLink>
        </>
      }
    />
  );
}
