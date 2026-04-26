"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getDatabase } from "../../db";
import { users } from "../../db/schemas/user";
import { roles } from "../../db/schemas/role";
import { permissions } from "../../db/schemas/permission";
import { tenants } from "../../db/schemas/tenant";
import { systemConfig } from "../../db/schemas/systemConfig";
import { v7 as uuidv7 } from "uuid";
import bcrypt from "bcryptjs";
import { eq, and } from "drizzle-orm";

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

// Helper to generate tenant code and slug from organization name
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

export function useSetupViewModel() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [syncing, setSyncing] = useState(false);

  const initializeSystem = async (formData: {
    name: string;
    email: string;
    password: string;
    age: string;
    organization: string;
  }) => {
    setLoading(true);
    setErrors({});

    // --- NEW PASSWORD VALIDATION ---
    if (formData.password.length < 8) {
      setErrors({ password: "Password must be at least 8 characters long." });
      setLoading(false);
      return; // Stop execution
    }
    // -------------------------------

    try {
      const db = await getDatabase();

      // 1. Check if setup has already been completed
      const [setupFlag] = await db
        .select()
        .from(systemConfig)
        .where(eq(systemConfig.key, "setup_complete"))
        .limit(1);

      if (setupFlag && setupFlag.value === "true") {
        throw new Error("System already initialized. Redirecting to login.");
      }

      // 2. Create tenant using user-provided organization name
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

      // 3. Create root_admin role with tenant_id
      const rootRoleId = uuidv7();
      await db.insert(roles).values({
        uuid: rootRoleId,
        name: "root_admin",
        tenant_id: tenantId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sync_status: "created",
      });

      // 4. Assign all permissions to this role
      const allPermissions = generateAllPermissions(rootRoleId, tenantId);
      if (allPermissions.length > 0) {
        await db.insert(permissions).values(allPermissions);
      }

      // 5. Create the master user
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

      // 6. Mark setup as complete
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

  /**
   * Intelligently syncs permissions for all root_admin roles.
   * - Detects which permissions from ALL_RESOURCES are missing per role+tenant.
   * - Inserts only the missing ones.
   * - Safe to call repeatedly (idempotent).
   * - Call this in a layout or after login to automatically apply new permissions from updates.
   */
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

      // 1. Verify system setup is complete
      const [setupFlag] = await db
        .select()
        .from(systemConfig)
        .where(eq(systemConfig.key, "setup_complete"))
        .limit(1);

      if (!setupFlag || setupFlag.value !== "true") {
        // System not yet set up, nothing to sync
        return { success: true, insertedCount: 0 };
      }

      // 2. Fetch all tenants
      const allTenants = await db.select().from(tenants);
      if (allTenants.length === 0) {
        return { success: true, insertedCount: 0 };
      }

      // 3. For each tenant, find root_admin roles and sync permissions
      for (const tenant of allTenants) {
        const rootRoles = await db
          .select()
          .from(roles)
          .where(
            and(eq(roles.tenant_id, tenant.uuid), eq(roles.name, "root_admin")),
          );

        for (const role of rootRoles) {
          // Generate all expected permissions for this role & tenant
          const expectedPerms = generateAllPermissions(role.uuid, tenant.uuid);
          new Set(expectedPerms.map((p) => p.name));

          // Fetch existing permission names for this role & tenant
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

          // Determine missing permissions
          const missingPerms = expectedPerms.filter(
            (p) => !existingNames.has(p.name),
          );

          if (missingPerms.length > 0) {
            // Insert missing permissions in batches (optional: batch insert)
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
    initializeSystem,
    syncRootPermissions,
  };
}
