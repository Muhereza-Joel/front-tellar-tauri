import { useEffect, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { X, DownloadCloud } from "lucide-react";

export default function UpdateNotification() {
  const [update, setUpdate] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);
  const [contentLength, setContentLength] = useState(0);
  const [downloaded, setDownloaded] = useState(0);

  useEffect(() => {
    async function checkForUpdates() {
      const updateFound = await check();
      if (updateFound) setUpdate(updateFound);
    }
    checkForUpdates();
  }, []);

  const handleUpdate = async () => {
    if (!update) return;
    setDownloading(true);

    // downloadAndInstall takes a callback to track progress
    await update.downloadAndInstall((event: any) => {
      switch (event.event) {
        case "Started":
          setContentLength(event.data.contentLength || 0);
          console.log(`Started downloading ${event.data.contentLength} bytes`);
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

  // Calculate percentage
  const progress =
    contentLength > 0 ? Math.round((downloaded / contentLength) * 100) : 0;

  if (!update) return null;

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-right-8">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
              <DownloadCloud className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold">New Version Ready</h4>
              <p className="text-xs text-zinc-500">
                v{update.version} is available
              </p>
            </div>
          </div>
          <button
            onClick={() => setUpdate(null)}
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
            <div className="flex justify-between text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
              <span>Downloading...</span>
              <span>{progress}%</span>
            </div>
          </div>
        ) : (
          <button
            onClick={handleUpdate}
            className="w-full py-2 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            Update & Restart
          </button>
        )}
      </div>
    </div>
  );
}
