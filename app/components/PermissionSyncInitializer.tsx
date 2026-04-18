"use client";

import { useEffect } from "react";
import { useSetupViewModel } from "../setup-root/useSetupViewModel";

export function PermissionSyncInitializer() {
  const { syncRootPermissions } = useSetupViewModel();

  useEffect(() => {
    syncRootPermissions().then((result) => {
      if (result.success && result.insertedCount > 0) {
        console.log(`Added ${result.insertedCount} new permissions.`);
      }
    });
  }, []); // Runs once after mount

  // This component doesn't render anything
  return null;
}
