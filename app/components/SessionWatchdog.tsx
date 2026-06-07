"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export function SessionWatchdog({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const logoutRef = useRef(logout);

  // Keep the latest logout function without causing re‑runs
  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      console.log("Watchdog: User inactive. Logging out...");
      logoutRef.current();
    }, INACTIVITY_TIMEOUT);
  }, []); // resetTimer is stable (no dependencies)

  useEffect(() => {
    // If no user, clear any pending timer and stop tracking
    if (!user) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    // Start the timer for the logged‑in user
    resetTimer();

    // User interactions that reset the timer
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Cleanup on unmount or when user changes
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [user, resetTimer]); // resetTimer is stable, effect only re‑runs when user changes

  return <>{children}</>;
}
