"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { getDatabase } from "../../db";
import { users } from "../../db/schemas/user";
import { permissions } from "../../db/schemas/permission";
import { eq, and } from "drizzle-orm";

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  getTenantId: () => string | null;
  hasPermission: (permissionName: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  getTenantId: () => null,
  hasPermission: () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  // Helper to fetch permissions for a given role and tenant (memoized)
  const fetchPermissions = useCallback(
    async (roleId: string, tenantId: string | null) => {
      try {
        const db = await getDatabase();

        // Build conditions array
        const conditions = [eq(permissions.role_id, roleId)];
        if (tenantId) {
          conditions.push(eq(permissions.tenant_id, tenantId));
        } else {
          conditions.push(eq(permissions.tenant_id, ""));
        }

        const whereClause = and(...conditions);
        if (!whereClause) {
          throw new Error("Failed to build permission query conditions");
        }

        const result = await db
          .select({ name: permissions.name })
          .from(permissions)
          .where(whereClause);

        return result.map((p) => p.name);
      } catch (error) {
        console.error("Failed to fetch permissions:", error);
        return [];
      }
    },
    [],
  );

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedSession = sessionStorage.getItem("pos_session");
        if (!savedSession) return;

        const sessionData = JSON.parse(savedSession);
        const db = await getDatabase();

        const [dbUser] = await db
          .select()
          .from(users)
          .where(and(eq(users.uuid, sessionData.id), eq(users.is_active, 1)))
          .limit(1);

        if (dbUser) {
          const userObj = {
            id: dbUser.uuid,
            name: dbUser.name,
            role: dbUser.role_id,
            email: dbUser.email,
            tenant_id: dbUser.tenant_id,
          };
          setUser(userObj);

          const perms = await fetchPermissions(
            dbUser.role_id,
            dbUser.tenant_id,
          );
          setUserPermissions(perms);
        }
      } catch (e) {
        console.error("AuthContext: Restore failed", e);
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, [fetchPermissions]);

  const login = useCallback(
    async (userData: any) => {
      console.log("AuthContext: Logging in...", userData);
      sessionStorage.setItem("pos_session", JSON.stringify(userData));
      setUser(userData);

      if (userData.role && userData.tenant_id !== undefined) {
        const perms = await fetchPermissions(userData.role, userData.tenant_id);
        setUserPermissions(perms);
      } else {
        setUserPermissions([]);
      }
    },
    [fetchPermissions],
  );

  const logout = useCallback(async () => {
    console.log("AuthContext: Logout function TRIGGERED");
    try {
      sessionStorage.removeItem("pos_session");
      setUser(null);
      setUserPermissions([]);
      console.log("AuthContext: Session cleared, redirecting...");
      window.location.href = "/login";
    } catch (e) {
      console.error("AuthContext: Logout error", e);
    }
  }, []);

  const getTenantId = useCallback(() => {
    return user?.tenant_id || null;
  }, [user]);

  const hasPermission = useCallback(
    (permissionName: string): boolean => {
      return userPermissions.includes(permissionName);
    },
    [userPermissions],
  );

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, getTenantId, hasPermission }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
