import { useRouter } from "expo-router";
import { useState } from "react";

import { useAuth } from "@/shared/auth/auth-provider";
import { takePendingInvitation } from "@/shared/auth/pending-invitation";
import { AuthLink } from "@/shared/components/auth-link";
import { AuthFormScreen } from "@/shared/components/auth-form-screen";

import { toUserMessage } from "@/shared/errors/to-user-message";

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
        const email = (values.email ?? "").trim().toLowerCase();
        const password = values.password ?? "";
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          setError("Please enter a valid email address.");
          return;
        }
        if (!password) {
          setError("Please enter your password.");
          return;
        }
        try {
          await signIn({
            email,
            password,
          });
          const invitationToken = await takePendingInvitation();
          router.replace(
            invitationToken
              ? (`/accept-invitation?token=${encodeURIComponent(invitationToken)}` as never)
              : "/",
          );
        } catch (cause) {
          setError(toUserMessage(cause, "Sign in failed. Check your credentials and try again."));
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
