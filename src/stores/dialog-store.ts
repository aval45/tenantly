import { create } from "zustand";

export type DialogButton = {
  text: string;
  onPress?: () => void | Promise<void>;
  style?: "default" | "cancel" | "destructive";
};

export type DialogState = {
  isOpen: boolean;
  title: string;
  message?: string;
  buttons: DialogButton[];
  show(title: string, message?: string, buttons?: DialogButton[]): void;
  hide(): void;
};

export const useDialogStore = create<DialogState>((set) => ({
  isOpen: false,
  title: "",
  message: undefined,
  buttons: [],
  show: (title, message, buttons) =>
    set({
      isOpen: true,
      title,
      message,
      buttons:
        buttons && buttons.length > 0
          ? buttons
          : [{ text: "OK", style: "default" }],
    }),
  hide: () => set({ isOpen: false }),
}));
