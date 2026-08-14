import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export type AppTheme = "system" | "light" | "dark";

type AppContextState = {
  theme: AppTheme;
  setTheme(value: AppTheme): void;
};

const storage: StateStorage = {
  getItem: (name) =>
    Platform.OS === "web"
      ? (globalThis.localStorage?.getItem(name) ?? null)
      : SecureStore.getItemAsync(name),
  setItem: (name, value) =>
    Platform.OS === "web"
      ? globalThis.localStorage?.setItem(name, value)
      : SecureStore.setItemAsync(name, value),
  removeItem: (name) =>
    Platform.OS === "web"
      ? globalThis.localStorage?.removeItem(name)
      : SecureStore.deleteItemAsync(name),
};

export const useAppContextStore = create<AppContextState>()(
  persist((set) => ({ theme: "system", setTheme: (theme) => set({ theme }) }), {
    name: "tenantly.appearance",
    storage: createJSONStorage(() => storage),
  }),
);
