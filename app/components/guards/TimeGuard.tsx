"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
  Clock,
  RefreshCw,
  ShieldAlert,
  Settings2,
  Activity,
} from "lucide-react";
import Head from "next/head";

const MAX_DRIFT_MINUTES = 5;
const CACHE_KEY = "lastVerifiedServerTime";
const MAX_CACHE_AGE_HOURS = 24; // optional: reject caches older than 1 day

const TIME_SOURCES = ["https://api.famkonect.com/api/v1/time/server"];

interface TimeCache {
  serverTime: number; // timestamp from server
  localTime: number; // Date.now() when cache was created
}

export default function TimeGuard({ children }: { children: React.ReactNode }) {
  const [isChecking, setIsChecking] = useState(true);
  const [isOutOfSync, setIsOutOfSync] = useState(false);
  const [timeDiff, setTimeDiff] = useState<number | null>(null);
  const pathname = usePathname();

  const checkTime = useCallback(async () => {
    setIsChecking(true);
    let success = false;

    // 1. Try online sources
    for (const source of TIME_SOURCES) {
      try {
        const start = Date.now();
        const response = await fetch(`${source}?t=${start}`, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`Failed at ${source}`);

        const data = await response.json();
        const serverTime = new Date(
          data.datetime ||
            data.dateTime ||
            data.utc_datetime ||
            data.currentLocalTime,
        ).getTime();

        const localTime = Date.now();
        const cache: TimeCache = { serverTime, localTime };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));

        const driftMinutes = Math.abs(serverTime - localTime) / 1000 / 60;
        if (driftMinutes > MAX_DRIFT_MINUTES) {
          setTimeDiff(Math.round(driftMinutes));
          setIsOutOfSync(true);
        } else {
          setIsOutOfSync(false);
        }

        success = true;
        break;
      } catch (err) {
        console.warn("Time source failed:", source, err);
      }
    }

    // 2. Offline fallback using cached data
    if (!success) {
      const cachedRaw = localStorage.getItem(CACHE_KEY);
      if (cachedRaw) {
        try {
          const cached: TimeCache = JSON.parse(cachedRaw);
          const now = Date.now();
          const elapsedLocal = now - cached.localTime;

          // Optional: reject extremely old caches (e.g., >24h)
          const maxCacheMs = MAX_CACHE_AGE_HOURS * 60 * 60 * 1000;
          if (elapsedLocal > maxCacheMs) {
            console.warn("Cached time is too old, require online sync");
            setTimeDiff(null);
            setIsOutOfSync(true);
          } else {
            // Reconstruct expected server time based on local clock progression
            const expectedServerNow = cached.serverTime + elapsedLocal;
            const drift = Math.abs(expectedServerNow - now);
            const driftMinutes = drift / 1000 / 60;

            if (driftMinutes > MAX_DRIFT_MINUTES) {
              setTimeDiff(Math.round(driftMinutes));
              setIsOutOfSync(true);
            } else {
              setIsOutOfSync(false);
            }
          }
        } catch (e) {
          console.error("Failed to parse cached time", e);
          setIsOutOfSync(true);
        }
      } else {
        // No cache and offline – cannot verify clock safety
        console.warn("No time cache available, locking until online sync");
        setTimeDiff(null);
        setIsOutOfSync(true);
      }
    }

    setTimeout(() => setIsChecking(false), 800);
  }, []);

  useEffect(() => {
    checkTime();
    const interval = setInterval(checkTime, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkTime]);

  const bypassPaths = ["/setup-root"];
  if (bypassPaths.includes(pathname)) return <>{children}</>;

  // --- UI COMPONENTS (unchanged, but adapt timeDiff display) ---
  const Layout = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-[#09090b] text-zinc-400 flex flex-col items-center justify-center p-6 selection:bg-blue-500/30">
      <div className="relative z-10 w-full max-w-[440px] animate-in fade-in zoom-in-95 duration-500">
        {children}
      </div>
    </div>
  );

  if (isChecking && !isOutOfSync) {
    return (
      <Layout>
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl animate-pulse" />
            <Clock className="h-12 w-12 text-blue-500 relative animate-spin [animation-duration:3s]" />
          </div>
          <h2 className="text-zinc-100 font-semibold tracking-tight text-lg">
            Synchronizing Environment
          </h2>
          <div className="mt-4 flex items-center gap-3 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-full">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest">
              Validating Global NTP Sources
            </span>
          </div>
        </div>
      </Layout>
    );
  }

  if (isOutOfSync) {
    const offsetText =
      timeDiff !== null ? `~${timeDiff}m` : "unknown (no sync data)";
    return (
      <Layout>
        <Head>
          <meta
            name="last-verified-server-time"
            content={(() => {
              const cached = localStorage.getItem(CACHE_KEY);
              if (cached) {
                try {
                  return JSON.parse(cached).serverTime;
                } catch {}
              }
              return "";
            })()}
          />
        </Head>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
          <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">
                System Clock Drift
              </span>
            </div>
            <div className="text-[10px] font-mono text-red-500/70 leading-none">
              ERR_CLOCK_SKEW
            </div>
          </div>

          <div className="p-8">
            <div className="space-y-1 mb-8">
              <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
                Time Synchronization Failed
              </h1>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Security protocols require your system clock to match the global
                standard. Your clock is offset by{" "}
                <span className="text-zinc-100 font-mono font-bold bg-zinc-800 px-1 rounded">
                  {offsetText}
                </span>
                .
              </p>
            </div>

            <div className="space-y-3 mb-8">
              <div className="group flex items-start gap-4 p-3 rounded-xl hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-zinc-700">
                <div className="h-8 w-8 shrink-0 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-100 font-mono text-xs border border-zinc-700">
                  01
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-200">
                    Access Date & Time Settings
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Open your OS system preference panel.
                  </p>
                </div>
              </div>

              <div className="group flex items-start gap-4 p-3 rounded-xl hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-zinc-700">
                <div className="h-8 w-8 shrink-0 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-100 font-mono text-xs border border-zinc-700">
                  02
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-200">
                    Force Protocol Sync
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Toggle "Set time automatically" or click "Sync Now".
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={checkTime}
              disabled={isChecking}
              className="w-full relative group bg-zinc-100 hover:bg-white disabled:bg-zinc-800 text-zinc-950 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-3 overflow-hidden"
            >
              {isChecking ? (
                <RefreshCw className="h-4 w-4 animate-spin text-zinc-950" />
              ) : (
                <>
                  <Activity className="h-4 w-4 transition-transform group-hover:scale-110" />
                  <span>Revalidate System Time</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-zinc-950/50 px-6 py-4 border-t border-zinc-800 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-tighter text-zinc-500">
                  Security Layer
                </span>
                <span className="text-[10px] font-mono text-zinc-300">
                  TAURI-V2-CLOCK-GUARD
                </span>
              </div>
            </div>
            <Settings2 className="h-4 w-4 text-zinc-700 hover:text-zinc-400 cursor-pointer transition-colors" />
          </div>
        </div>

        <div className="mt-8 flex justify-between items-center px-2">
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-red-500" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">
              Protocol: Locked
            </span>
          </div>
          <span className="text-[10px] font-mono text-zinc-600">
            v4.0.1-stable
          </span>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <meta
          name="last-verified-server-time"
          content={(() => {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
              try {
                return JSON.parse(cached).serverTime;
              } catch {}
            }
            return "";
          })()}
        />
      </Head>
      {children}
    </>
  );
}
