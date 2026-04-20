"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getDatabase } from "../../../db";
import { middlewarePipeline } from "../../lib/middleware-pipeline";
import { useAuth } from "../../context/AuthContext";

// Routes that do not require authentication or setup checks
const PUBLIC_ROUTES = ["/login", "/setup-root", "/activate"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isVerified, setIsVerified] = useState(false);
  const { loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const runMiddleware = async () => {
      // Wait for AuthContext to finish restoring session
      if (authLoading) return;

      // Public routes should never trigger redirects
      if (PUBLIC_ROUTES.includes(pathname)) {
        setIsVerified(true);
        return;
      }

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

  // Show loading indicator only when necessary, but always allow public routes to render
  if (authLoading || !isVerified) {
    // If it's a public route, render children immediately even during checks
    if (PUBLIC_ROUTES.includes(pathname)) return <>{children}</>;
    // Otherwise, show a minimal loading state (optional)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
