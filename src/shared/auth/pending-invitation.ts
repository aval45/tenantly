import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const key = "tenantly.pending-invitation";

export async function savePendingInvitation(token: string) {
  if (Platform.OS === "web") globalThis.sessionStorage?.setItem(key, token);
  else await SecureStore.setItemAsync(key, token);
}

export async function takePendingInvitation() {
  if (Platform.OS === "web") {
    const token = globalThis.sessionStorage?.getItem(key) ?? null;
    globalThis.sessionStorage?.removeItem(key);
    return token;
  }
  const token = await SecureStore.getItemAsync(key);
  await SecureStore.deleteItemAsync(key);
  return token;
}
