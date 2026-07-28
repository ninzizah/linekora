// Helper to get a user-scoped localStorage key
export function scopedKey(userId: string | undefined, key: string): string {
  return userId ? `${key}_${userId}` : key;
}

// Helper to read from user-scoped localStorage
export function readScopedStorage<T>(userId: string | undefined, key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(scopedKey(userId, key));
    if (raw) return JSON.parse(raw);
  } catch {}
  return fallback;
}

// Helper to write to user-scoped localStorage
export function writeScopedStorage(userId: string | undefined, key: string, value: any): void {
  localStorage.setItem(scopedKey(userId, key), JSON.stringify(value));
}

// Helper to remove from user-scoped localStorage
export function removeScopedStorage(userId: string | undefined, key: string): void {
  localStorage.removeItem(scopedKey(userId, key));
}
