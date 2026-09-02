import { ChatAttachment } from './api';

export const MAX_ATTACHMENTS = 2;
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

export const ALLOWED_ATTACHMENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export function isAllowedAttachmentType(type: string): boolean {
  return ALLOWED_ATTACHMENT_TYPES.includes(type);
}

export function isImageAttachment(type: string): boolean {
  return type.startsWith('image/');
}

export function isPdfAttachment(type: string): boolean {
  return type === 'application/pdf';
}

export interface AttachmentCandidate {
  file: File;
  name: string;
  type: string;
  dataUrl: string;
  size: number;
}

export type AttachmentReject = 'too_many' | 'bad_type' | 'too_big' | 'max_reached';

// Reads file(s) to base64 data URLs, enforcing count/size/type limits.
// On failure returns { errorCode, name } for the caller to localize.
export function processAttachmentFiles(
  files: FileList | File[],
  alreadySelected = 0,
): {
  candidates: AttachmentCandidate[];
  errorCode?: AttachmentReject;
  name?: string;
} {
  const list = Array.from(files);

  if (alreadySelected + list.length > MAX_ATTACHMENTS) {
    return { candidates: [], errorCode: 'max_reached' };
  }
  if (list.length > MAX_ATTACHMENTS) {
    return { candidates: [], errorCode: 'too_many' };
  }

  const candidates: AttachmentCandidate[] = [];
  for (const file of list) {
    if (!isAllowedAttachmentType(file.type)) {
      return { candidates, errorCode: 'bad_type', name: file.name };
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      return { candidates, errorCode: 'too_big', name: file.name };
    }
    candidates.push({ file, name: file.name, type: file.type, dataUrl: '', size: file.size });
  }

  return { candidates };
}

export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function toChatAttachment(c: AttachmentCandidate): ChatAttachment {
  return { name: c.name, type: c.type, dataUrl: c.dataUrl };
}
