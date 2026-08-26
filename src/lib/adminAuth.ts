/** Client-side admin password storage (local). */

const STORAGE_KEY = "albridge_admin_security_v3";
const LEGACY_KEYS = ["albridge_admin_security_v2", "albridge_admin_security_v1"] as const;
export const DEFAULT_ADMIN_PASSWORD = "1234";

export type AdminSecurityState = {
  passwordHash: string;
};

async function hashSecret(value: string): Promise<string> {
  const data = new TextEncoder().encode(`albridge-admin:${value.trim()}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function writeState(state: AdminSecurityState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  for (const key of LEGACY_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}

function readRaw(): AdminSecurityState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_KEYS[0]) ??
      window.localStorage.getItem(LEGACY_KEYS[1]);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { passwordHash?: string };
    if (!parsed?.passwordHash || typeof parsed.passwordHash !== "string") return null;
    return { passwordHash: parsed.passwordHash };
  } catch {
    return null;
  }
}

export async function getAdminSecurity(): Promise<AdminSecurityState> {
  const existing = readRaw();
  if (existing) {
    writeState(existing);
    return existing;
  }
  const passwordHash = await hashSecret(DEFAULT_ADMIN_PASSWORD);
  const state = { passwordHash };
  if (typeof window !== "undefined") writeState(state);
  return state;
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const state = await getAdminSecurity();
  const hash = await hashSecret(password);
  return hash === state.passwordHash;
}

export type ChangePasswordResult =
  { ok: true } | { ok: false; error: "password" | "mismatch" | "weak" };

/** Change admin password immediately after verifying the current one. */
export async function changeAdminPassword(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<ChangePasswordResult> {
  const { currentPassword, newPassword, confirmPassword } = input;
  if (newPassword.trim().length < 4) return { ok: false, error: "weak" };
  if (newPassword !== confirmPassword) return { ok: false, error: "mismatch" };
  if (!(await verifyAdminPassword(currentPassword))) return { ok: false, error: "password" };

  const passwordHash = await hashSecret(newPassword);
  writeState({ passwordHash });
  return { ok: true };
}
