import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import * as Linking from "expo-linking";

import { createSupabaseOrganizationService } from "@/features/organizations/service";
import { getSupabaseClient } from "@/shared/api/supabase";

import type { AppSession, Membership } from "./types";

const activeOrganizationKey = "tenantly.active-organization";

function getSavedOrganizationId() {
  if (typeof globalThis.localStorage === "undefined") return null;
  return globalThis.localStorage.getItem(activeOrganizationKey);
}

function saveOrganizationId(value: string | null) {
  if (typeof globalThis.localStorage === "undefined") return;
  if (value) globalThis.localStorage.setItem(activeOrganizationKey, value);
  else globalThis.localStorage.removeItem(activeOrganizationKey);
}

async function hydrateSession(
  session: Session | null,
): Promise<AppSession | null> {
  if (!session) return null;
  const client = getSupabaseClient();
  const [profileResult, memberships] = await Promise.all([
    client
      .from("profiles")
      .select("full_name")
      .eq("id", session.user.id)
      .single(),
    createSupabaseOrganizationService(client).listActiveMemberships(),
  ]);
  if (profileResult.error) throw profileResult.error;
  const saved = getSavedOrganizationId();
  const activeOrganizationId = memberships.some(
    (item) => item.organizationId === saved,
  )
    ? saved
    : (memberships[0]?.organizationId ?? null);
  return {
    userId: session.user.id,
    profile: {
      fullName: profileResult.data.full_name,
      email: session.user.email ?? "",
    },
    memberships: memberships.map((item): Membership => ({
      ...item,
      status: "active",
    })),
    activeOrganizationId,
  };
}

export type Credentials = { email: string; password: string };

function getAuthCallbackUrl(next?: "reset-password") {
  return Linking.createURL("auth/callback", {
    queryParams: next ? { next } : undefined,
  });
}

export const supabaseAuthService = {
  async restore() {
    const { data, error } = await getSupabaseClient().auth.getSession();
    if (error) throw error;
    return hydrateSession(data.session);
  },
  onAuthStateChange(callback: (event: AuthChangeEvent) => void) {
    return getSupabaseClient().auth.onAuthStateChange((event) =>
      callback(event),
    ).data.subscription;
  },
  async signIn(input: Credentials) {
    const { data, error } =
      await getSupabaseClient().auth.signInWithPassword(input);
    if (error) throw error;
    return hydrateSession(data.session);
  },
  async signUp(input: Credentials & { fullName: string }) {
    const { data, error } = await getSupabaseClient().auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: { full_name: input.fullName },
        emailRedirectTo: getAuthCallbackUrl(),
      },
    });
    if (error) throw error;
    return {
      session: await hydrateSession(data.session),
      requiresVerification: !data.session,
    };
  },
  async resendSignUpConfirmation(email: string) {
    const { error } = await getSupabaseClient().auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: getAuthCallbackUrl() },
    });
    if (error) throw error;
  },
  async requestPasswordReset(email: string) {
    const { error } = await getSupabaseClient().auth.resetPasswordForEmail(
      email,
      { redirectTo: getAuthCallbackUrl("reset-password") },
    );
    if (error) throw error;
  },
  async updatePassword(password: string) {
    const { error } = await getSupabaseClient().auth.updateUser({ password });
    if (error) throw error;
  },
  async refresh() {
    const { data, error } = await getSupabaseClient().auth.getSession();
    if (error) throw error;
    return hydrateSession(data.session);
  },
  setActiveOrganization(organizationId: string) {
    saveOrganizationId(organizationId);
  },
  async signOut() {
    const { error } = await getSupabaseClient().auth.signOut();
    if (error) throw error;
    saveOrganizationId(null);
  },
};

export type AuthService = typeof supabaseAuthService;
