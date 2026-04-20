"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMachineHash, activateLicense, storeJwt } from "../lib/license";
import { KeyRound, ShieldCheck, Loader2 } from "lucide-react";

export default function ActivatePage() {
  const [machineHash, setMachineHash] = useState<string | null>(null);
  const [licenseKey, setLicenseKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    getMachineHash().then(setMachineHash).catch(setError);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKey.trim() || !machineHash) return;
    setLoading(true);
    setError(null);
    try {
      const { jwt } = await activateLicense(licenseKey, machineHash);
      await storeJwt(jwt);
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-8 shadow-sm">
        <div className="text-center mb-6">
          <ShieldCheck className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-4 text-xl font-bold">Activate License</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Enter your license key to continue
          </p>
        </div>

        {machineHash && (
          <div className="bg-zinc-100 dark:bg-zinc-900 rounded-md p-2 text-xs font-mono break-all mb-4">
            <span className="text-zinc-500">Machine hash:</span> {machineHash}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              License Key
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="e.g. 0194b9a0-1234-7def-8abc-123456789abc"
                className="w-full pl-9 pr-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-black"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !machineHash}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Activating..." : "Activate"}
          </button>
        </form>

        <p className="text-xs text-center text-zinc-400 mt-6">
          Your machine hash is unique and never shared. License keys are bound
          to this device.
        </p>
      </div>
    </div>
  );
}
