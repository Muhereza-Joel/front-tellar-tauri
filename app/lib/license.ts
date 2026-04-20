const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getMachineHash(): Promise<string> {
  const { invoke } = await import("@tauri-apps/api/core");
  return await invoke<string>("get_machine_hash");
}

export async function storeJwt(jwt: string): Promise<void> {
  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("store_secure", { key: "license_jwt", value: jwt });
}

export async function getJwt(): Promise<string | null> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<string>("get_secure", { key: "license_jwt" });
  } catch {
    // This catches the "No matching entry" error from Tauri
    return null;
  }
}

export async function deleteJwt(): Promise<void> {
  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("delete_secure", { key: "license_jwt" });
}

export async function activateLicense(
  key: string,
  machineHash: string,
): Promise<{ jwt: string; expiresAt: string; plan: string }> {
  const response = await fetch(`${API_URL}/licenses/activate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, machine_hash: machineHash }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Activation failed");
  return { jwt: data.jwt, expiresAt: data.expires_at, plan: data.plan };
}

export async function validateJwt(
  jwt: string,
): Promise<{ valid: boolean; expiresAt?: string; plan?: string }> {
  const response = await fetch(`${API_URL}/licenses/validate`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });

  // 🛑 If the server says 401, the key/session is dead.
  if (response.status === 401) {
    throw new Error("Unauthorized");
  }

  if (response.ok) {
    const data = await response.json();
    return { valid: true, expiresAt: data.expires_at, plan: data.plan };
  }
  return { valid: false };
}

export async function deactivateLicense(machineHash: string): Promise<boolean> {
  const response = await fetch(`${API_URL}/licenses/deactivate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ machine_hash: machineHash }),
  });
  if (response.ok) {
    await deleteJwt();
    return true;
  }
  return false;
}
