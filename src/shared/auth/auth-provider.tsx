import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { createSupabaseOrganizationService } from "@/features/organizations/service";
import { getSupabaseClient, isSupabaseConfigured } from "@/shared/api/supabase";

import { supabaseAuthService, type Credentials } from "./service";
import type { AppSession, Membership } from "./types";

export type AuthStatus =
  "restoring" | "authenticated" | "unauthenticated" | "unconfigured";
type AuthContextValue = {
  status: AuthStatus;
  session: AppSession | null;
  activeMembership: Membership | null;
  signIn(input: Credentials): Promise<void>;
  signUp(input: Credentials & { fullName: string }): Promise<boolean>;
  resendSignUpConfirmation(email: string): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
  completeOwnerSetup(input: {
    organizationName: string;
    slug: string;
  }): Promise<void>;
  selectOrganization(organizationId: string): Promise<void>;
  refreshSession(): Promise<void>;
  signOut(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AppSession | null>(null);
  const [status, setStatus] = useState<AuthStatus>(
    isSupabaseConfigured() ? "restoring" : "unconfigured",
  );
  const refreshSession = useCallback(async () => {
    const next = await supabaseAuthService.refresh();
    setSession(next);
    setStatus(next ? "authenticated" : "unauthenticated");
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let mounted = true;
    void supabaseAuthService
      .restore()
      .then((next) => {
        if (!mounted) return;
        setSession(next);
        setStatus(next ? "authenticated" : "unauthenticated");
      })
      .catch(() => {
        if (mounted) setStatus("unauthenticated");
      });
    const subscription = supabaseAuthService.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setSession(null);
        setStatus("unauthenticated");
      } else if (
        event === "SIGNED_IN" ||
        event === "PASSWORD_RECOVERY" ||
        event === "TOKEN_REFRESHED"
      ) {
        setTimeout(() => void refreshSession(), 0);
      }
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [refreshSession]);

  const activeMembership =
    session?.memberships.find(
      (item) => item.organizationId === session.activeOrganizationId,
    ) ?? null;
  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      activeMembership,
      async signIn(input) {
        const next = await supabaseAuthService.signIn(input);
        setSession(next);
        setStatus(next ? "authenticated" : "unauthenticated");
      },
      async signUp(input) {
        const result = await supabaseAuthService.signUp(input);
        setSession(result.session);
        setStatus(result.session ? "authenticated" : "unauthenticated");
        return result.requiresVerification;
      },
      resendSignUpConfirmation:
        supabaseAuthService.resendSignUpConfirmation,
      requestPasswordReset: supabaseAuthService.requestPasswordReset,
      updatePassword: supabaseAuthService.updatePassword,
      async completeOwnerSetup({ organizationName, slug }) {
        await createSupabaseOrganizationService(
          getSupabaseClient(),
        ).createOrganization({
          name: organizationName,
          slug,
          idempotencyKey: `owner-setup-${session?.userId ?? "unknown"}-${slug}`,
        });
        await refreshSession();
      },
      async selectOrganization(organizationId) {
        supabaseAuthService.setActiveOrganization(organizationId);
        setSession((current) =>
          current ? { ...current, activeOrganizationId: organizationId } : null,
        );
      },
      refreshSession,
      async signOut() {
        await supabaseAuthService.signOut();
        setSession(null);
        setStatus("unauthenticated");
      },
    }),
    [activeMembership, refreshSession, session, status],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider.");
  return value;
}
