"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getJwt, validateJwt, deleteJwt } from "../lib/license";
import {
  ShieldCheck,
  Loader2,
  WifiOff,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { useNotifications } from "../context/NotificationContext";

const CACHE_KEY = "auth_license_cache";
const GRACE_PERIOD_DAYS = 7;
const GRACE_PERIOD_MS = GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;

/**
 * Self-contained notification with its own collapse state
 */
function OfflineNotification({
  daysRemaining,
  onClose,
}: {
  daysRemaining: number;
  onClose: () => void;
}) {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-900/50 p-4 rounded-2xl shadow-2xl max-w-sm w-full">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
          <WifiOff className="h-5 w-5 text-amber-600 dark:text-amber-500" />
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between w-full text-sm font-bold text-zinc-900 dark:text-zinc-100">
            <span>Offline Mode</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setCollapsed((prev) => !prev)}>
                {collapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </button>
              <button onClick={onClose}>
                <X className="h-4 w-4 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200" />
              </button>
            </div>
          </div>

          {!collapsed && (
            <div className="mt-2">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Verification server is unreachable. Please reconnect within
                <span className="font-bold text-amber-700 dark:text-amber-500">
                  {" "}
                  {daysRemaining} days
                </span>{" "}
                to maintain access.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400"
              >
                <RefreshCw className="h-3 w-3" />
                Retry Connection
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LicenseGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  const activeNotificationId = useRef<string | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const { addNotification, removeNotification } = useNotifications();

  useEffect(() => {
    const checkLicense = async () => {
      const jwt = await getJwt();
      if (!jwt) {
        if (pathname !== "/activate") router.push("/activate");
        setIsValid(false);
        return;
      }

      try {
        const response = await validateJwt(jwt);
        if (response.valid) {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              lastValidated: Date.now(),
              expiresAt: response.expiresAt,
              plan: response.plan,
            }),
          );
          setIsValid(true);
          setIsOffline(false);
        } else {
          // Should not happen with current validateJwt, but handle defensively
          await deleteJwt();
          localStorage.removeItem(CACHE_KEY);
          if (pathname !== "/activate") router.push("/activate");
          setIsValid(false);
        }
      } catch (err: any) {
        // 🔥 Distinguish between 401 (Unauthorized) and real network errors
        if (err?.message === "Unauthorized") {
          // License has been revoked or expired on the server
          await deleteJwt();
          localStorage.removeItem(CACHE_KEY);
          if (pathname !== "/activate") router.push("/activate");
          setIsValid(false);
          return;
        }

        // Network error / server unreachable – try offline grace period
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const { lastValidated, expiresAt } = JSON.parse(cachedData);
          const now = Date.now();
          const timeSinceLastCheck = now - lastValidated;
          const isLicenseExpired = new Date(expiresAt).getTime() < now;

          if (timeSinceLastCheck < GRACE_PERIOD_MS && !isLicenseExpired) {
            const msLeft = GRACE_PERIOD_MS - timeSinceLastCheck;
            const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
            setDaysRemaining(daysLeft);
            setIsValid(true);
            setIsOffline(true);
            return;
          }
        }

        // No valid cache or grace period expired → require reactivation
        if (pathname !== "/activate") router.push("/activate");
        setIsValid(false);
      }
    };

    checkLicense();
  }, [pathname, router]);

  // Offline notification handling (unchanged)
  useEffect(() => {
    if (isOffline && daysRemaining !== null && !activeNotificationId.current) {
      const id = addNotification(
        <OfflineNotification
          daysRemaining={daysRemaining}
          onClose={() => {
            if (activeNotificationId.current) {
              removeNotification(activeNotificationId.current);
              activeNotificationId.current = null;
            }
          }}
        />,
      );
      activeNotificationId.current = id;
    }

    return () => {
      if (!isOffline && activeNotificationId.current) {
        removeNotification(activeNotificationId.current);
        activeNotificationId.current = null;
      }
    };
  }, [isOffline, daysRemaining, addNotification, removeNotification]);

  if (pathname === "/activate") return <>{children}</>;

  if (isValid === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <ShieldCheck className="h-12 w-12 text-blue-600 dark:text-blue-500" />
        <Loader2 className="h-4 w-4 animate-spin mt-4" />
        <span className="text-sm font-medium">Verifying activation...</span>
      </div>
    );
  }

  if (!isValid) return null;

  return <>{children}</>;
}
