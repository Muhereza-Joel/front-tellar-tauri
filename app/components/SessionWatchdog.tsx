"use client";

import React, { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

// 2 hours in milliseconds (2 * 60 * 60 * 1000)
const INACTIVITY_TIMEOUT = 7200000;

export function SessionWatchdog({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // If there is no logged-in user, we don't need to track inactivity
    if (!user) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    const resetTimer = () => {
      // Clear the existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set a new timeout to log the user out after 2 hours
      timeoutRef.current = setTimeout(() => {
        console.log("Watchdog: User inactive for 2 hours. Logging out...");
        logout();
      }, INACTIVITY_TIMEOUT);
    };

    // List of user interactions to track
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    // Initialize the timer on mount/user change
    resetTimer();

    // Add event listeners to reset the timer on activity
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Cleanup listeners and timeouts on unmount or when user changes
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [user, logout]);

  return <>{children}</>;
}
