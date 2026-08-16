export const NATIONAL_ID_DIGITS = 16;
export const TIN_DIGITS = 9;

export function normalizeNationalId(value: string): string {
  return value.replace(/[\s\-_.]/g, '');
}

export function isValidNationalId(value: string): boolean {
  const digits = normalizeNationalId(value);
  return /^\d{16}$/.test(digits);
}

export function isValidTin(value: string): boolean {
  const digits = normalizeNationalId(value);
  return /^\d{9}$/.test(digits);
}

export interface IdImageCheck {
  valid: boolean;
  landscape: boolean;
  width: number;
  height: number;
  aspectRatio: number;
  message: 'file_not_image' | 'id_portrait_warning' | 'id_ratio_warning' | null;
}

export function checkIdImage(file: File): Promise<IdImageCheck> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve({ valid: false, landscape: false, width: 0, height: 0, aspectRatio: 0, message: 'file_not_image' });
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = img.width / img.height;
      const landscape = img.width > img.height;
      const okRatio = ratio >= 1.2 && ratio <= 2.2;

      if (!landscape) {
        resolve({
          valid: false,
          landscape,
          width: img.width,
          height: img.height,
          aspectRatio: ratio,
          message: 'id_portrait_warning',
        });
        return;
      }

      resolve({
        valid: okRatio,
        landscape,
        width: img.width,
        height: img.height,
        aspectRatio: ratio,
        message: okRatio ? null : 'id_ratio_warning',
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ valid: false, landscape: false, width: 0, height: 0, aspectRatio: 0, message: 'file_not_image' });
    };
    img.src = url;
  });
}
