"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  ShieldCheck,
  ArrowRight,
  LayoutDashboard,
  Loader2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { getDatabase } from "../../db";
import { users } from "../../db/schemas/user";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const router = useRouter();

  const inputStyle = (hasError: boolean) => `
    w-full bg-white dark:bg-black border rounded-md px-3 py-2.5 text-sm outline-none transition-all
    ${
      hasError
        ? "border-red-500 focus:ring-1 focus:ring-red-500"
        : "border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-600/50"
    }
  `;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const db = await getDatabase();

      const result = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      const user = result[0];

      if (!user) {
        throw new Error("Invalid email or password");
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new Error("Invalid email or password");
      }

      if (user.is_active !== 1) {
        throw new Error("Account is currently disabled");
      }

      const userData = {
        id: user.uuid,
        name: user.name,
        role: user.role_id,
        tenant_id: user.tenant_id, // <-- include tenant_id
        loginTime: new Date().toISOString(),
      };

      await login(userData);
      router.replace("/");
    } catch (err: any) {
      setError(err.message || "An error occurred during sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black text-zinc-900 dark:text-zinc-100">
      <header className="flex w-full items-center justify-between border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-black shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-600 text-white shadow-sm">
            <LayoutDashboard size={20} />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-none">Smart POS</h1>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">
              Terminal Access • v1.0.4
            </p>
          </div>
        </div>
        <ThemeSwitcher />
      </header>

      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-blue-500 shadow-sm">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Welcome Back</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Sign in to manage your inventory and sales
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            className="space-y-5 rounded-md border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-black"
          >
            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-xs text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 ml-1">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-3 text-zinc-400"
                  size={16}
                />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  className={`${inputStyle(!!error)} pl-10`}
                  placeholder="admin@smartpos.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-3 text-zinc-400"
                  size={16}
                />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  className={`${inputStyle(!!error)} pl-10`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-700 active:scale-[0.98] shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  Sign In <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <footer className="text-center">
            <p className="text-[10px] text-zinc-500 dark:text-zinc-500 uppercase tracking-tighter">
              Secured FrontTella Instance • Enterprise Grade Security
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
