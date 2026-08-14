import { create } from "zustand";

export type AppTheme = "light" | "dark";

type AppContextState = {
  activeOrganizationId: string | null;
  theme: AppTheme;
  setActiveOrganizationId(value: string | null): void;
  setTheme(value: AppTheme): void;
};

export const useAppContextStore = create<AppContextState>((set) => ({
  activeOrganizationId: null,
  theme: "light",
  setActiveOrganizationId: (activeOrganizationId) =>
    set({ activeOrganizationId }),
  setTheme: (theme) => set({ theme }),
}));
