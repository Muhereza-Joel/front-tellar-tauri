import { useCallback } from "react";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification as tauriNotify,
} from "@tauri-apps/plugin-notification";
import { platform } from "@tauri-apps/plugin-os";

type NotificationType = "success" | "error" | "info";

export function useNotification() {
  const notify = useCallback(
    async (title: string, body: string, type: NotificationType = "info") => {
      let permission = await isPermissionGranted();
      if (!permission) {
        const permissionResponse = await requestPermission();
        permission = permissionResponse === "granted";
      }

      if (permission) {
        const platformName = await platform();
        let soundPath: string;

        // Use if...else instead of switch with enum
        if (platformName === "macos") {
          soundPath = type === "error" ? "Basso" : "Ping";
        } else if (platformName === "linux") {
          soundPath = type === "error" ? "dialog-error" : "message-new-instant";
        } else if (platformName === "windows") {
          soundPath =
            type === "error" ? "Windows Error.wav" : "notification.wav";
        } else {
          soundPath = "default.wav";
        }

        tauriNotify({
          title,
          body,
          sound: soundPath,
          largeBody:
            type === "success"
              ? "Operation completed successfully."
              : type === "error"
                ? "An error occurred during the operation."
                : "General notification.",
        });
      }
    },
    [],
  );

  const success = (body: string) => notify("Success", body, "success");

  const error = (body: string) => notify("Error", body, "error");

  const info = (body: string) => notify("Info", body, "info");

  return { notify, success, error, info };
}
