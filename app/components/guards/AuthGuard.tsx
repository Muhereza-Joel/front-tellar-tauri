"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getDatabase } from "../../../db";
import { middlewarePipeline } from "../../lib/middleware-pipeline";
import { useAuth } from "../../context/AuthContext";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isVerified, setIsVerified] = useState(false);
  const { loading: authLoading } = useAuth(); // Use context loading state
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const runMiddleware = async () => {
      // Don't run checks if AuthContext is still restoring the session
      if (authLoading) return;

      try {
        const db = await getDatabase();

        // 1. Root Setup check
        const setupRedirect = await middlewarePipeline.checkRootSetup(
          db,
          pathname,
        );
        if (setupRedirect) {
          router.replace(setupRedirect);
          return;
        }

        // 2. Auth Check
        const authRedirect = await middlewarePipeline.checkAuth(db, pathname);
        if (authRedirect) {
          router.replace(authRedirect);
          return;
        }

        setIsVerified(true);
      } catch (error) {
        console.error("Middleware System Error:", error);
      }
    };

    runMiddleware();
  }, [pathname, router, authLoading]);

  // Show a loading screen while either the context or the guard is verifying
  if (authLoading || !isVerified) {
    if (["/login", "/setup-root"].includes(pathname)) return <>{children}</>;
  }

  return <>{children}</>;
}
