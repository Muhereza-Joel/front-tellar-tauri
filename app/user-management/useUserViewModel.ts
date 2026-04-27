// useUserViewModel.ts
import { useEffect, useState } from "react";
import { getDatabase } from "../../db";
import { users } from "../../db/schemas/user";
import { eq, and, ne, isNull } from "drizzle-orm";
import * as yup from "yup";
import bcrypt from "bcryptjs";
import { v7 as uuidv7 } from "uuid";
import { usePagination } from "../hooks/usePagination";
import { useAuth } from "../context/AuthContext";

const userSchema = yup.object({
  name: yup.string().required("Name is required").min(2, "Name too short"),
  email: yup.string().email("Invalid email").required("Email is required"),
  age: yup
    .number()
    .typeError("Age must be a number")
    .required("Required")
    .positive()
    .integer(),
  password: yup.string().when("$isEditing", {
    is: false,
    then: (schema) =>
      schema.required("Password is required").min(6, "Min 6 characters"),
    otherwise: (schema) => schema.nullable().optional(),
  }),
  role_id: yup.string().typeError("Select a role").required("Role is required"),
});

export function useUserViewModel() {
  const { getTenantId, user: currentUser } = useAuth();
  const [db, setDb] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [rolesOptions, setRolesOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [errors, setErrors] = useState<any>({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: "",
    password: "",
    role_id: "",
  });

  const {
    paginatedData,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    totalCount,
    searchTerm,
    setSearchTerm,
  } = usePagination({
    data: usersList,
    initialPageSize: 10,
    searchKeys: ["name", "email"],
  });

  useEffect(() => {
    getDatabase().then(setDb);
  }, []);

  const loadData = async () => {
    if (!db) return;
    setLoading(true);
    try {
      const [uResults, rResults] = await Promise.all([
        db.query.users.findMany({
          where: (u: any, { isNull }: any) => isNull(u.deleted_at),
          orderBy: (u: any, { desc }: any) => desc(u.created_at),
        }),
        db.query.roles.findMany(),
      ]);

      // 🔒 Exclude root_admin role from selection options
      const filteredRoles = rResults.filter(
        (r: any) => r.name !== "root_admin",
      );
      setRolesOptions(filteredRoles);

      const enrichedUsers = uResults.map((user: any) => ({
        ...user,
        role_name:
          rResults.find((r: any) => r.uuid === user.role_id)?.name ||
          "Unknown Role",
      }));

      setUsersList(enrichedUsers);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  useEffect(() => {
    if (db) loadData();
  }, [db]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const valid = await userSchema.validate(formData, {
        abortEarly: false,
        context: { isEditing: !!editingUuid },
      });

      // Email uniqueness check
      const existingUser = await db.query.users.findFirst({
        where: editingUuid
          ? and(
              eq(users.email, valid.email),
              ne(users.uuid, editingUuid),
              isNull(users.deleted_at),
            )
          : and(eq(users.email, valid.email), isNull(users.deleted_at)),
      });

      const user = existingUser?.uuid
        ? {
            uuid: existingUser.uuid[0],
            name: existingUser.uuid[1],
            age: existingUser.uuid[2],
            email: existingUser.uuid[3],
          }
        : null;

      if (user?.uuid) {
        setErrors({ email: "This email is already registered." });
        return;
      }

      const now = new Date().toISOString();
      const tenantId = getTenantId();

      const userData: any = {
        name: valid.name,
        email: valid.email,
        age: valid.age,
        role_id: valid.role_id,
        tenant_id: tenantId,
        sync_status: "updated",
        updated_at: now,
      };

      if (formData.password && formData.password.trim() !== "") {
        const salt = await bcrypt.genSalt(10);
        userData.password = await bcrypt.hash(formData.password, salt);
      }

      if (editingUuid) {
        if (editingUuid === currentUser?.id) {
          setErrors({ form: "You cannot edit your own account from here." });
          return;
        }
        await db.update(users).set(userData).where(eq(users.uuid, editingUuid));
      } else {
        await db.insert(users).values({
          uuid: uuidv7(),
          ...userData,
          is_email_verified: 0,
          is_active: 1,
          sync_status: "created",
          created_at: now,
        });
      }

      resetForm();
      loadData();
    } catch (err: any) {
      if (err instanceof yup.ValidationError) {
        const mappedErrors: Record<string, string> = {};
        err.inner.forEach((e) => {
          if (e.path) mappedErrors[e.path] = e.message;
        });
        setErrors(mappedErrors);
      } else {
        console.error(err);
        setErrors({ form: err.message || "Failed to save user" });
      }
    }
  };

  const deleteUser = async (uuid: string) => {
    if (!db) return;
    if (uuid === currentUser?.id) {
      setErrors({ form: "You cannot delete your own account." });
      setTimeout(() => setErrors({}), 3000);
      return;
    }
    await db
      .update(users)
      .set({ deleted_at: new Date().toISOString(), sync_status: "deleted" })
      .where(eq(users.uuid, uuid));
    loadData();
  };

  const startEdit = (user: any) => {
    if (user.uuid === currentUser?.id) {
      setErrors({ form: "You cannot edit your own account." });
      setTimeout(() => setErrors({}), 3000);
      return;
    }
    setEditingUuid(user.uuid);
    setFormData({
      name: user.name,
      email: user.email,
      age: user.age.toString(),
      password: "",
      role_id: user.role_id.toString(),
    });
    setErrors({});
  };

  const resetForm = () => {
    setEditingUuid(null);
    setFormData({
      name: "",
      email: "",
      age: "",
      password: "",
      role_id: "",
    });
    setErrors({});
  };

  return {
    usersList: paginatedData,
    rolesOptions,
    loading,
    editingUuid,
    errors,
    formData,
    setFormData,
    handleSave,
    deleteUser,
    startEdit,
    resetForm,

    currentPage,
    totalPages,
    pageSize,
    totalCount,
    setCurrentPage,
    setPageSize,

    searchTerm,
    setSearchTerm,
  };
}
