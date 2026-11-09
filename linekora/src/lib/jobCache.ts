// Best-effort local cache for recently posted jobs.
// The database is the source of truth, so cache writes must NEVER throw or
// report a publish failure. localStorage has a small quota (~5MB) and photos
// are stored as base64 data URLs, so we strip them and trim old entries.

const MAX_CACHED_JOBS = 30;
const MIN_CACHED_JOBS = 5;

function isQuotaError(err: unknown): boolean {
  const e = err as { name?: string; code?: number; message?: string } | undefined;
  if (!e) return false;
  return (
    e.name === 'QuotaExceededError' ||
    e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    e.code === 22 ||
    e.code === 1014 ||
    /quota/i.test(e.message || '')
  );
}

function stripHeavyFields(job: any): any {
  if (!job || typeof job !== 'object') return job;
  let photos: unknown = job.photos;
  if (typeof photos === 'string') {
    photos = photos.length < 500 ? photos : undefined;
  } else if (Array.isArray(photos)) {
    photos = photos.filter((p: unknown) => typeof p === 'string' && p.length < 500);
  }
  return { ...job, photos };
}

function buildList(existing: any[], job: any, max: number): any[] {
  const withoutDuplicate = existing.filter((j) => j?.id !== job?.id);
  return [job, ...withoutDuplicate].slice(0, max);
}

function tryWrite(key: string, list: any[]): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(list));
    return true;
  } catch (err) {
    if (!isQuotaError(err)) {
      console.warn(`[jobCache] Could not cache ${key}`, err);
    }
    return false;
  }
}

function pruneOtherJobCaches(keepKey: string): void {
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k !== keepKey && /(^|_)(all_jobs|urgent_jobs)(_|$)/.test(k)) {
        toRemove.push(k);
      }
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  } catch {}
}

export function cacheJob(rawKey: string, job: any, max = MAX_CACHED_JOBS): void {
  if (!rawKey || !job) return;

  let existing: any[] = [];
  try {
    const raw = localStorage.getItem(rawKey);
    const parsed = raw ? JSON.parse(raw) : [];
    existing = Array.isArray(parsed) ? parsed : [];
  } catch {
    existing = [];
  }

  const full = buildList(existing, job, max);
  if (tryWrite(rawKey, full)) return;

  const slim = full.map(stripHeavyFields);
  if (tryWrite(rawKey, slim)) return;

  const minimal = slim.slice(0, MIN_CACHED_JOBS);
  if (tryWrite(rawKey, minimal)) return;

  pruneOtherJobCaches(rawKey);
  if (tryWrite(rawKey, minimal)) return;

  try {
    localStorage.removeItem(rawKey);
  } catch {}
}
