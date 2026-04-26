// useRoleViewModel.ts
import { useEffect, useState } from "react";
import { getDatabase } from "../../../db";
import { roles } from "../../../db/schemas/role";
import { eq } from "drizzle-orm";
import * as yup from "yup";
import { v7 as uuidv7 } from "uuid";
import { useAuth } from "../../../app/context/AuthContext"; // adjust path as needed

const roleSchema = yup.object({
  name: yup
    .string()
    .required("Role name is required")
    .min(2, "Name is too short")
    .notOneOf(
      ["root_admin"],
      'The name "root_admin" is reserved and cannot be used',
    ),
});

export function useRoleViewModel() {
  const { getTenantId } = useAuth(); // get tenant_id from auth context
  const [db, setDb] = useState<any>(null);
  const [rolesList, setRolesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "" });
  const [errors, setErrors] = useState<{ name?: string }>({});

  useEffect(() => {
    getDatabase().then(setDb);
  }, []);

  const loadRoles = async () => {
  if (!db) return;
  setLoading(true);

  try {
    const results = await db.query.roles.findMany({
      where: (rolesTable: any, { isNull }: any) => isNull(rolesTable.deleted_at),
    });

    setRolesList(results);
  } finally {
    setTimeout(() => setLoading(false), 500);
  }
};

  useEffect(() => {
    if (db) loadRoles();
  }, [db]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const valid = await roleSchema.validate(formData, { abortEarly: false });

      const payload: any = {
        name: valid.name,
        sync_status: "updated",
        updated_at: new Date().toISOString(),
      };

      // Automatically assign current tenant_id from auth context
      const tenantId = getTenantId();
      if (tenantId) {
        payload.tenant_id = tenantId;
      }

      if (editingUuid) {
        // Check if editing root_admin
        const [targetRole] = await db
          .select()
          .from(roles)
          .where(eq(roles.uuid, editingUuid))
          .limit(1);
        if (targetRole && targetRole.name === "root_admin") {
          setErrors({ name: "The root_admin role cannot be modified" });
          return;
        }
        await db.update(roles).set(payload).where(eq(roles.uuid, editingUuid));
      } else {
        await db.insert(roles).values({ uuid: uuidv7(), ...payload });
      }

      resetForm();
      loadRoles();
    } catch (err: any) {
      if (err instanceof yup.ValidationError) {
        const validationErrors: any = {};
        err.inner.forEach((error) => {
          if (error.path) validationErrors[error.path] = error.message;
        });
        setErrors(validationErrors);
      } else {
        console.error("Save error:", err);
        setErrors({ name: err.message || "Failed to save role" });
      }
    }
  };

  const deleteRole = async (uuid: string) => {
    if (!db) return;

    const [targetRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.uuid, uuid))
      .limit(1);

    if (targetRole && targetRole.name === "root_admin") {
      setErrors({ name: "The root_admin role cannot be deleted" });
      setTimeout(() => setErrors({}), 3000);
      return;
    }

    await db
      .update(roles)
      .set({
        sync_status: "deleted",
        deleted_at: new Date().toISOString(),
      })
      .where(eq(roles.uuid, uuid));

    loadRoles();
  };

  const startEdit = (role: any) => {
    if (role.name === "root_admin") {
      setErrors({ name: "The root_admin role cannot be edited" });
      setTimeout(() => setErrors({}), 3000);
      return;
    }
    setEditingUuid(role.uuid);
    setFormData({ name: role.name });
    setErrors({});
  };

  const resetForm = () => {
    setEditingUuid(null);
    setFormData({ name: "" });
    setErrors({});
  };

  return {
    rolesList,
    loading,
    editingUuid,
    formData,
    setFormData,
    errors,
    setErrors,
    handleSave,
    deleteRole,
    startEdit,
    resetForm,
  };
}
