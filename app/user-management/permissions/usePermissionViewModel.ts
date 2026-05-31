import { useEffect, useState } from "react";
import { getDatabase } from "../../../db";
import { roles as rolesTable } from "../../../db/schemas/role";
import { permissions as permissionsTable } from "../../../db/schemas/permission";
import { eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { useAuth } from "../../../app/context/AuthContext";
import { useNotification } from "../../hooks/useNotification";

export interface ResourceConfig {
  name: string;
  actions: string[];
}

export function usePermissionViewModel() {
  const { getTenantId } = useAuth();
  const [db, setDb] = useState<any>(null);
  const [roles, setRoles] = useState<{ uuid: string; name: string }[]>([]);
  const [resources, setResources] = useState<ResourceConfig[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [assignedPermissions, setAssignedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRootAdmin, setIsRootAdmin] = useState(false);

  const { success, error } = useNotification();

  useEffect(() => {
    getDatabase().then(setDb);
  }, []);

  const loadInitialData = async () => {
    if (!db) return;
    setLoading(true);
    try {
      const rResults = await db.select().from(rolesTable);
      setRoles(rResults);

      // If there's a selected role, check if it's root_admin
      if (selectedRoleId) {
        const selected = rResults.find((r: any) => r.uuid === selectedRoleId);
        setIsRootAdmin(selected?.name === "root_admin");
      }

      const fetchedResources: ResourceConfig[] = [
        {
          name: "Module",
          actions: [
            "inventory",
            "customers",
            "sales",
            "expenses",
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
        { name: "Expenses", actions: ["view", "create", "edit", "delete"] },
        { name: "Notes", actions: ["view", "create", "edit", "delete"] },
        { name: "Discounts", actions: ["view", "create", "edit", "delete"] },
        { name: "Attributes", actions: ["view", "create", "edit", "delete"] },
        { name: "Variants", actions: ["view", "create", "edit", "delete"] },
        { name: "Suppliers", actions: ["view", "create", "edit", "delete"] },
        { name: "Brands", actions: ["view", "create", "edit", "delete"] },
        { name: "Settings", actions: ["view", "update"] },
      ];

      setResources(fetchedResources);
      if (rResults.length > 0 && !selectedRoleId) {
        setSelectedRoleId(rResults[0].uuid);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (db) loadInitialData();
  }, [db]);

  const fetchRolePermissions = async (roleId: string) => {
    if (!db || !roleId) return;
    setLoading(true);
    try {
      const results = await db
        .select()
        .from(permissionsTable)
        .where(eq(permissionsTable.role_id, roleId));
      setAssignedPermissions(results.map((p: any) => p.name));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRoleId) {
      fetchRolePermissions(selectedRoleId);
      // Check if selected role is root_admin
      const selected = roles.find((r) => r.uuid === selectedRoleId);
      setIsRootAdmin(selected?.name === "root_admin");
    }
  }, [selectedRoleId, db, roles]);

  const togglePermission = (permName: string) => {
    if (isRootAdmin) return; // prevent toggling for root_admin
    setAssignedPermissions((prev) =>
      prev.includes(permName)
        ? prev.filter((p) => p !== permName)
        : [...prev, permName],
    );
  };

  const selectAllForResource = (resourceName: string, actions: string[]) => {
    if (isRootAdmin) return;
    const resourcePerms = actions.map(
      (a) => `${a}_${resourceName.toLowerCase()}`,
    );
    setAssignedPermissions((prev) => {
      const otherPerms = prev.filter((p) => !resourcePerms.includes(p));
      const allSelected = resourcePerms.every((p) => prev.includes(p));
      return allSelected ? otherPerms : [...otherPerms, ...resourcePerms];
    });
  };

  const handleSave = async () => {
    if (!db || !selectedRoleId) return;
    if (isRootAdmin) {
      await error("The root_admin role permissions cannot be modified.");
      return;
    }

    setLoading(true);
    try {
      const now = new Date().toISOString();
      const tenantId = getTenantId();

      // Delete old permissions for this role
      await db
        .delete(permissionsTable)
        .where(eq(permissionsTable.role_id, selectedRoleId));

      // Insert new permissions with tenant_id
      if (assignedPermissions.length > 0) {
        const insertData = assignedPermissions.map((name) => ({
          uuid: uuidv7(),
          name: name,
          role_id: selectedRoleId,
          tenant_id: tenantId, // <-- assign current tenant's ID
          created_at: now,
          updated_at: now,
        }));
        await db.insert(permissionsTable).values(insertData);
      }

      await success("Permissions saved successfully.");
    } catch (err) {
      console.error("Save failed:", err);
      await error("Could not save permissions to the database.");
    } finally {
      setLoading(false);
    }
  };

  return {
    roles,
    resources,
    selectedRoleId,
    setSelectedRoleId,
    assignedPermissions,
    togglePermission,
    selectAllForResource,
    searchTerm,
    setSearchTerm,
    loading,
    handleSave,
    isRootAdmin,
  };
}
