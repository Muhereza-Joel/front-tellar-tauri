"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { invoke } from "@tauri-apps/api/core";
import { getDatabase } from "../../db";
import { users } from "../../db/schemas/user";
import { roles } from "../../db/schemas/role";
import { permissions } from "../../db/schemas/permission";
import { tenants } from "../../db/schemas/tenant";
import { systemConfig } from "../../db/schemas/systemConfig";
import { v7 as uuidv7 } from "uuid";
import bcrypt from "bcryptjs";
import { eq, and } from "drizzle-orm";
import { getJwt } from "../lib/license";

const ALL_RESOURCES = [
  {
    name: "Module",
    actions: [
      "inventory",
      "customers",
      "sales",
      "reports",
      "accounts",
      "settings",
    ],
  },
  { name: "User", actions: ["view", "create", "edit", "delete"] },
  { name: "Role", actions: ["view", "create", "edit", "delete"] },
  { name: "Permission", actions: ["view", "create", "edit", "delete"] },
  { name: "Branch", actions: ["view", "create", "edit", "delete"] },
  { name: "Units", actions: ["view", "create", "edit", "delete"] },
  { name: "Orders", actions: ["view", "create", "edit", "delete"] },
  { name: "Sales", actions: ["view", "create", "edit", "delete"] },
  { name: "Service", actions: ["view", "create", "edit", "delete"] },
  { name: "Category", actions: ["view", "create", "edit", "delete"] },
  { name: "Payment", actions: ["view", "create", "edit", "delete"] },
  { name: "Types", actions: ["view", "create", "edit", "delete"] },
  {
    name: "Customer",
    actions: ["view", "create", "edit", "delete", "import", "export"],
  },
  {
    name: "Product",
    actions: ["view", "create", "edit", "delete", "import", "export"],
  },
  {
    name: "Purchases",
    actions: ["view", "create", "edit", "delete", "import", "export"],
  },
  { name: "Attributes", actions: ["view", "create", "edit", "delete"] },
  { name: "Variants", actions: ["view", "create", "edit", "delete"] },
  { name: "Suppliers", actions: ["view", "create", "edit", "delete"] },
  { name: "Brands", actions: ["view", "create", "edit", "delete"] },
  { name: "Settings", actions: ["view", "update"] },
];

function generateAllPermissions(roleId: string, tenantId: string): any[] {
  const now = new Date().toISOString();
  const perms: any[] = [];
  for (const resource of ALL_RESOURCES) {
    for (const action of resource.actions) {
      perms.push({
        uuid: uuidv7(),
        name: `${action}_${resource.name.toLowerCase()}`,
        role_id: roleId,
        tenant_id: tenantId,
        created_at: now,
        updated_at: now,
        sync_status: "created",
      });
    }
  }
  return perms;
}

function generateTenantMetadata(orgName: string) {
  const code = orgName
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 4)
    .toUpperCase();
  const slug = orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return { code: code || "SYS", slug: slug || "system" };
}

interface SyncResult {
  success: boolean;
  message: string;
  new_timestamp?: number;
}

export interface RestoreProgress {
  percent: number;
  status: "connecting" | "syncing" | "finalizing" | "done" | "error";
  message: string;
}

export function useSetupViewModel() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [syncing, setSyncing] = useState(false);
  const [restoreProgress, setRestoreProgress] =
    useState<RestoreProgress | null>(null);

  const initializeSystem = async (formData: {
    name: string;
    email: string;
    password: string;
    age: string;
    organization: string;
  }) => {
    setLoading(true);
    setErrors({});

    if (formData.password.length < 8) {
      setErrors({ password: "Password must be at least 8 characters long." });
      setLoading(false);
      return;
    }

    try {
      const db = await getDatabase();

      const [setupFlag] = await db
        .select()
        .from(systemConfig)
        .where(eq(systemConfig.key, "setup_complete"))
        .limit(1);

      if (setupFlag && setupFlag.value === "true") {
        throw new Error("System already initialized. Redirecting to login.");
      }

      const { code, slug } = generateTenantMetadata(formData.organization);
      const tenantId = uuidv7();
      await db.insert(tenants).values({
        uuid: tenantId,
        name: formData.organization,
        code: code,
        slug: slug,
        tenant_id: tenantId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sync_status: "created",
      });

      const rootRoleId = uuidv7();
      await db.insert(roles).values({
        uuid: rootRoleId,
        name: "root_admin",
        tenant_id: tenantId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sync_status: "created",
      });

      const allPermissions = generateAllPermissions(rootRoleId, tenantId);
      if (allPermissions.length > 0) {
        await db.insert(permissions).values(allPermissions);
      }

      const hashedPassword = await bcrypt.hash(formData.password, 10);
      await db.insert(users).values({
        uuid: uuidv7(),
        name: formData.name,
        email: formData.email,
        password: hashedPassword,
        age: 30,
        role_id: rootRoleId,
        tenant_id: tenantId,
        is_active: 1,
        is_email_verified: 1,
        sync_status: "created",
      });

      await db.insert(systemConfig).values({
        key: "setup_complete",
        value: "true",
        updated_at: new Date().toISOString(),
      });

      router.push("/login");
    } catch (err: any) {
      console.error("Setup initialization error:", err);
      setErrors({ form: err.message || "Failed to initialize system." });
    } finally {
      setLoading(false);
    }
  };

  const restoreSystem = async (tenantId: string) => {
    setLoading(true);
    setErrors({});
    setRestoreProgress({
      percent: 0,
      status: "connecting",
      message: "Connecting to server...",
    });

    if (!tenantId || tenantId.trim() === "") {
      setErrors({ form: "Please enter a valid Tenant ID." });
      setLoading(false);
      setRestoreProgress(null);
      return;
    }

    try {
      // Step 1: Get JWT
      setRestoreProgress({
        percent: 10,
        status: "connecting",
        message: "Verifying license...",
      });
      const jwt = await getJwt();
      if (!jwt) {
        throw new Error(
          "No valid license found. Please activate your license first.",
        );
      }

      // Step 2: Check existing setup flag
      setRestoreProgress({
        percent: 20,
        status: "connecting",
        message: "Preparing local database...",
      });
      const db = await getDatabase();
      const [setupFlag] = await db
        .select()
        .from(systemConfig)
        .where(eq(systemConfig.key, "setup_complete"))
        .limit(1);

      if (setupFlag && setupFlag.value === "true") {
        console.warn(
          "Setup already exists locally; restoring will overwrite data.",
        );
      }

      // Step 3: Perform full sync
      setRestoreProgress({
        percent: 30,
        status: "syncing",
        message: "Syncing data from server...",
      });
      console.log(`Starting restore for tenant: ${tenantId}`);

      // We can't get fine-grained progress from the Rust sync_all, but we'll simulate a bit
      // and then rely on the fact that it takes time. Optionally, we could call sync_table per table for better progress.
      const syncResult = await invoke<SyncResult>("sync_all", {
        jwt,
        tenantUuid: tenantId,
        lastPulledAt: null,
      });

      if (!syncResult.success) {
        throw new Error(syncResult.message || "Sync failed during restore.");
      }

      setRestoreProgress({
        percent: 70,
        status: "finalizing",
        message: "Verifying restored data...",
      });

      // Step 4: Verify tenant exists locally
      const [tenantRecord] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.uuid, tenantId))
        .limit(1);

      if (!tenantRecord) {
        throw new Error(
          "Tenant not found after sync. Please ensure the Tenant ID is correct and you have access.",
        );
      }

      // Step 5: Find root_admin role and sync permissions
      setRestoreProgress({
        percent: 80,
        status: "finalizing",
        message: "Setting up permissions...",
      });

      const rootRoles = await db
        .select()
        .from(roles)
        .where(and(eq(roles.tenant_id, tenantId), eq(roles.name, "root_admin")))
        .limit(1);

      if (rootRoles.length === 0) {
        throw new Error(
          "Root admin role not found after restore. Please contact support.",
        );
      }

      const rootRoleId = rootRoles[0].uuid;

      // Generate and insert missing permissions for this role
      const expectedPermissions = generateAllPermissions(rootRoleId, tenantId);
      const existingPerms = await db
        .select({ name: permissions.name })
        .from(permissions)
        .where(
          and(
            eq(permissions.role_id, rootRoleId),
            eq(permissions.tenant_id, tenantId),
          ),
        );

      const existingNames = new Set(existingPerms.map((p) => p.name));
      const missingPerms = expectedPermissions.filter(
        (p) => !existingNames.has(p.name),
      );

      if (missingPerms.length > 0) {
        await db.insert(permissions).values(missingPerms);
        console.log(
          `Added ${missingPerms.length} missing permissions for root_admin`,
        );
      }

      // Step 6: Mark setup as complete
      setRestoreProgress({
        percent: 95,
        status: "finalizing",
        message: "Completing setup...",
      });

      if (setupFlag && setupFlag.value === "true") {
        await db
          .update(systemConfig)
          .set({ value: "true", updated_at: new Date().toISOString() })
          .where(eq(systemConfig.key, "setup_complete"));
      } else {
        await db.insert(systemConfig).values({
          key: "setup_complete",
          value: "true",
          updated_at: new Date().toISOString(),
        });
      }

      setRestoreProgress({
        percent: 100,
        status: "done",
        message: "Restore complete! Redirecting...",
      });

      // Brief pause to show 100%
      await new Promise((resolve) => setTimeout(resolve, 800));

      router.push("/login");
    } catch (err: any) {
      console.error("Restore error:", err);
      setErrors({
        form:
          err.message ||
          "Failed to restore system. Please check your Tenant ID and try again.",
      });
      setRestoreProgress(null);
    } finally {
      setLoading(false);
    }
  };

  const syncRootPermissions = async (): Promise<{
    success: boolean;
    insertedCount: number;
    errors?: string[];
  }> => {
    setSyncing(true);
    let totalInserted = 0;
    const errorsList: string[] = [];

    try {
      const db = await getDatabase();

      const [setupFlag] = await db
        .select()
        .from(systemConfig)
        .where(eq(systemConfig.key, "setup_complete"))
        .limit(1);

      if (!setupFlag || setupFlag.value !== "true") {
        return { success: true, insertedCount: 0 };
      }

      const allTenants = await db.select().from(tenants);
      if (allTenants.length === 0) {
        return { success: true, insertedCount: 0 };
      }

      for (const tenant of allTenants) {
        const rootRoles = await db
          .select()
          .from(roles)
          .where(
            and(eq(roles.tenant_id, tenant.uuid), eq(roles.name, "root_admin")),
          );

        for (const role of rootRoles) {
          const expectedPerms = generateAllPermissions(role.uuid, tenant.uuid);
          const existingPerms = await db
            .select({ name: permissions.name })
            .from(permissions)
            .where(
              and(
                eq(permissions.role_id, role.uuid),
                eq(permissions.tenant_id, tenant.uuid),
              ),
            );

          const existingNames = new Set(existingPerms.map((p) => p.name));
          const missingPerms = expectedPerms.filter(
            (p) => !existingNames.has(p.name),
          );

          if (missingPerms.length > 0) {
            await db.insert(permissions).values(missingPerms);
            totalInserted += missingPerms.length;
            console.log(
              `Synced ${missingPerms.length} permissions for role ${role.uuid} (tenant ${tenant.uuid})`,
            );
          }
        }
      }

      return { success: true, insertedCount: totalInserted };
    } catch (err: any) {
      console.error("Permission sync error:", err);
      errorsList.push(err.message || "Unknown error during permission sync");
      return {
        success: false,
        insertedCount: totalInserted,
        errors: errorsList,
      };
    } finally {
      setSyncing(false);
    }
  };

  return {
    loading,
    errors,
    syncing,
    restoreProgress,
    initializeSystem,
    restoreSystem,
    syncRootPermissions,
  };
}
