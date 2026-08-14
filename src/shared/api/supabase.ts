import * as SecureStore from "expo-secure-store";
import {
  createClient,
  type SupabaseClient,
  type SupportedStorage,
} from "@supabase/supabase-js";
import { Platform } from "react-native";

import type { Database } from "./database.types";

const secureStorePrefix = "tenantly.supabase.";
const memoryStorage = new Map<string, string>();

const authStorage: SupportedStorage = {
  async getItem(key) {
    if (Platform.OS === "web") {
      return typeof globalThis.localStorage === "undefined"
        ? (memoryStorage.get(key) ?? null)
        : globalThis.localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(`${secureStorePrefix}${key}`);
  },
  async setItem(key, value) {
    if (Platform.OS === "web") {
      if (typeof globalThis.localStorage === "undefined")
        memoryStorage.set(key, value);
      else globalThis.localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(`${secureStorePrefix}${key}`, value);
  },
  async removeItem(key) {
    if (Platform.OS === "web") {
      if (typeof globalThis.localStorage === "undefined")
        memoryStorage.delete(key);
      else globalThis.localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(`${secureStorePrefix}${key}`);
  },
};

export type TenantlySupabaseClient = SupabaseClient<Database>;

let client: TenantlySupabaseClient | null = null;

export function isSupabaseConfigured() {
  return Boolean(
    process.env.EXPO_PUBLIC_SUPABASE_URL &&
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function getSupabaseClient(): TenantlySupabaseClient {
  if (client) return client;

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error(
      "Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  client = createClient<Database>(url, publishableKey, {
    auth: {
      storage: authStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  return client;
}
