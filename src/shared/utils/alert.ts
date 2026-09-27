import { type AlertButton } from "react-native";
import { useDialogStore, type DialogButton } from "@/stores/dialog-store";

export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
) {
  const dialogButtons: DialogButton[] =
    buttons && buttons.length > 0
      ? buttons.map((b) => ({
          text: b.text ?? "OK",
          onPress: b.onPress,
          style: b.style,
        }))
      : [{ text: "OK", style: "default" }];

  useDialogStore.getState().show(title, message, dialogButtons);
}
