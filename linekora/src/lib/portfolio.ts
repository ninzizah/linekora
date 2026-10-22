import { readAsDataUrl } from './attachments';

/**
 * Project portfolio entries ("Imirimo Yakoze").
 *
 * A worker can attach proof to each project: PDF documents (contracts,
 * certificates) and photos of the workplace. Everything is stored inside the
 * existing User.portfolio TEXT column as a JSON array, so legacy entries
 * (plain strings / comma-separated lists) still parse.
 */

export interface PortfolioFile {
  name: string;
  dataUrl: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  docs: PortfolioFile[];
  photos: PortfolioFile[];
}

export const PORTFOLIO_MAX_PHOTOS = 5;
export const PORTFOLIO_MAX_DOCS = 3;
/** Hard cap per uploaded proof document (PDF contracts are small). */
export const PORTFOLIO_MAX_DOC_BYTES = 8 * 1024 * 1024;
/** Pre-compression cap — photos are downscaled before storage. */
export const PORTFOLIO_MAX_PHOTO_BYTES = 15 * 1024 * 1024;

function normalizeFiles(raw: unknown): PortfolioFile[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((f: any) => ({
      name: String(f?.name || 'file'),
      dataUrl: typeof f?.dataUrl === 'string' ? f.dataUrl : '',
    }))
    .filter((f) => f.dataUrl.startsWith('data:'));
}

function normalizeEntry(entry: unknown, index: number): PortfolioItem | null {
  if (typeof entry === 'string') {
    const title = entry.trim();
    return title ? { id: `portfolio-${index}`, title, docs: [], photos: [] } : null;
  }
  if (entry && typeof entry === 'object') {
    const e = entry as Record<string, any>;
    const title = String(e.title || e.name || '').trim();
    if (!title) return null;
    return {
      id: String(e.id || `portfolio-${index}`),
      title,
      docs: normalizeFiles(e.docs || e.documents),
      photos: normalizeFiles(e.photos || e.images),
    };
  }
  return null;
}

/** Accepts a JSON array (objects or legacy strings) or a legacy comma list. */
export function parsePortfolio(raw: unknown): PortfolioItem[] {
  let list: unknown[] = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
    } catch {
      list = raw.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  return list
    .map((entry, i) => normalizeEntry(entry, i))
    .filter((entry): entry is PortfolioItem => entry !== null);
}

export function newPortfolioId(): string {
  return `portfolio-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function readPortfolioFile(file: File): Promise<PortfolioFile> {
  return { name: file.name, dataUrl: await readAsDataUrl(file) };
}

/**
 * Downscale a photo (max 1280px, JPEG) so a project's 5 photos don't bloat
 * the profile row. Falls back to the original file when decoding fails
 * (e.g. HEIC on browsers that cannot decode it).
 */
export async function compressPhoto(file: File): Promise<PortfolioFile> {
  const raw = await readAsDataUrl(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('image decode failed'));
      el.src = raw;
    });
    const maxDim = 1280;
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { name: file.name, dataUrl: raw };
    ctx.drawImage(img, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    return { name: file.name, dataUrl: dataUrl.length < raw.length ? dataUrl : raw };
  } catch {
    return { name: file.name, dataUrl: raw };
  }
}
