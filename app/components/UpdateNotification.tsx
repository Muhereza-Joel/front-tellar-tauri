"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { X, DownloadCloud, RefreshCcw } from "lucide-react";
import { useNotifications } from "../context/NotificationContext";

/* ---------------- Update Notification Content Component ---------------- */

function UpdateNotificationContent({
  update,
  onClose,
}: {
  update: any;
  onClose: () => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const [contentLength, setContentLength] = useState(0);
  const [downloaded, setDownloaded] = useState(0);

  const handleUpdate = async () => {
    if (!update) return;
    setDownloading(true);

    await update.downloadAndInstall((event: any) => {
      switch (event.event) {
        case "Started":
          setContentLength(event.data.contentLength || 0);
          break;
        case "Progress":
          setDownloaded((prev) => prev + event.data.chunkLength);
          break;
        case "Finished":
          console.log("Download finished");
          break;
      }
    });

    await relaunch();
  };

  const progress =
    contentLength > 0 ? Math.round((downloaded / contentLength) * 100) : 0;

  return (
    <div className="w-80 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-right-8">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
              <DownloadCloud className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold">New Update Available!</h4>
              <p className="text-xs text-zinc-500">
                Version {update.version} is ready to install.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {downloading ? (
          <div className="space-y-2">
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-medium text-zinc-500 uppercase">
              <span>Downloading...</span>
              <span>{progress}%</span>
            </div>
          </div>
        ) : (
          <button
            onClick={handleUpdate}
            className="w-full py-2 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Download & Install Update
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------------- Logic Component ---------------- */

export default function UpdateNotification() {
  const { addNotification, removeNotification } = useNotifications();
  // Ref to track the existing notification and prevent duplicates
  const activeNotificationId = useRef<string | null>(null);

  const checkForUpdates = useCallback(
    async (manual = false) => {
      // If we already have a notification on screen, don't check/add another one
      if (activeNotificationId.current) return;

      try {
        const updateFound = await check();

        if (updateFound && !activeNotificationId.current) {
          const id = addNotification(
            <UpdateNotificationContent
              update={updateFound}
              onClose={() => {
                removeNotification(id);
                activeNotificationId.current = null;
              }}
            />,
          );
          activeNotificationId.current = id;
        } else if (manual) {
          console.log("No updates found.");
        }
      } catch (error) {
        console.error("Failed to check for updates:", error);
      }
    },
    [addNotification, removeNotification],
  );

  // Initial check
  useEffect(() => {
    checkForUpdates();
  }, [checkForUpdates]);

  // Re-check on window focus (e.g. coming back to the app)
  useEffect(() => {
    const handleFocus = () => checkForUpdates(true);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [checkForUpdates]);

  return null;
}
