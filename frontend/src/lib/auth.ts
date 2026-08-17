export type Role = "tenant" | "manager";

const storageKey = (role: Role) => `pm_${role}_token`;

export function saveToken(role: Role, token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(role), token);
}

export function getToken(role: Role): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(storageKey(role));
}

export function clearToken(role: Role) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKey(role));
}
