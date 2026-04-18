import { eq, and } from "drizzle-orm";
import { users } from "../../db/schemas/user";
import { systemConfig } from "../../db/schemas/systemConfig";

export const middlewarePipeline = {
  async checkRootSetup(db: any, pathname: string) {
    // Check if setup has been completed via system_config flag
    const [setupFlag] = await db
      .select()
      .from(systemConfig)
      .where(eq(systemConfig.key, "setup_complete"))
      .limit(1);

    const isSetupComplete = setupFlag && setupFlag.value === "true";

    if (!isSetupComplete && pathname !== "/setup-root") return "/setup-root";
    if (isSetupComplete && pathname === "/setup-root") return "/";
    return null;
  },

  async checkAuth(db: any, pathname: string) {
    const publicPaths = ["/login", "/setup-root"];
    if (publicPaths.includes(pathname)) return null;

    // Use the consistent key from AuthContext
    const sessionStr = localStorage.getItem("pos_session");
    if (!sessionStr) return "/login";

    try {
      const sessionData = JSON.parse(sessionStr);
      if (!sessionData.id) return "/login";

      // Verify UUID and is_active status
      const [userRecord] = await db
        .select()
        .from(users)
        .where(and(eq(users.uuid, sessionData.id), eq(users.is_active, 1)))
        .limit(1);

      return userRecord ? null : "/login";
    } catch {
      return "/login";
    }
  },
};
