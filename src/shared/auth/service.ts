import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { createSupabaseOrganizationService } from "@/features/organizations/service";
import { getSupabaseClient } from "@/shared/api/supabase";

import { capabilitiesFor, type AppSession, type Membership } from "./types";

const activeOrganizationKey = "tenantly.active-organization";

async function getSavedOrganizationId() {
  if (Platform.OS === "web")
    return globalThis.localStorage?.getItem(activeOrganizationKey) ?? null;
  return SecureStore.getItemAsync(activeOrganizationKey);
}

async function saveOrganizationId(value: string | null) {
  if (Platform.OS === "web") {
    if (value) globalThis.localStorage?.setItem(activeOrganizationKey, value);
    else globalThis.localStorage?.removeItem(activeOrganizationKey);
    return;
  }
  if (value) await SecureStore.setItemAsync(activeOrganizationKey, value);
  else await SecureStore.deleteItemAsync(activeOrganizationKey);
}

async function hydrateSession(
  session: Session | null,
): Promise<AppSession | null> {
  if (!session) return null;
  const client = getSupabaseClient();
  const [profileResult, memberships] = await Promise.all([
    client
      .from("profiles")
      .select("full_name,phone_e164")
      .eq("id", session.user.id)
      .single(),
    createSupabaseOrganizationService(client).listActiveMemberships(),
  ]);
  if (profileResult.error) throw profileResult.error;
  const saved = await getSavedOrganizationId();
  const activeOrganizationId = memberships.some(
    (item) => item.organizationId === saved,
  )
    ? saved
    : (memberships[0]?.organizationId ?? null);
  const normalizedMemberships = memberships.map((item): Membership => ({
    ...item,
    status: "active",
  }));
  const activeRole = normalizedMemberships.find(
    (item) => item.organizationId === activeOrganizationId,
  )?.role;
  return {
    userId: session.user.id,
    profile: {
      fullName: profileResult.data.full_name,
      email: session.user.email ?? "",
      phone: profileResult.data.phone_e164,
    },
    memberships: normalizedMemberships,
    activeOrganizationId,
    capabilities: capabilitiesFor(activeRole),
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
  async setActiveOrganization(organizationId: string) {
    await saveOrganizationId(organizationId);
  },
  async signOut() {
    const { error } = await getSupabaseClient().auth.signOut();
    if (error) throw error;
    await saveOrganizationId(null);
  },
};

export type AuthService = typeof supabaseAuthService;
