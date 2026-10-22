const GLOBAL_DARK_KEY = 'linekora_dark';

/**
 * Reads the saved dark-mode preference. The preference is global (shared by
 * every account/role on the device), with a fallback to the legacy per-role
 * key so existing users keep their choice.
 */
export const getDarkMode = (roleKey?: string): boolean => {
  const globalPref = localStorage.getItem(GLOBAL_DARK_KEY);
  if (globalPref !== null) return globalPref === 'true';
  if (roleKey) return localStorage.getItem(`linekora_dark_${roleKey}`) === 'true';
  return false;
};

export const setDarkMode = (enabled: boolean, roleKey?: string) => {
  localStorage.setItem(GLOBAL_DARK_KEY, String(enabled));
  if (roleKey) localStorage.setItem(`linekora_dark_${roleKey}`, String(enabled));
  applyThemePrefs(roleKey);
};

export const applyThemePrefs = (roleKey?: string) => {
  const root = document.documentElement;
  const dark = getDarkMode(roleKey);
  const motion = roleKey
    ? localStorage.getItem(`linekora_motion_${roleKey}`) === 'true'
    : false;
  root.classList.toggle('dark', dark);
  if (roleKey) root.classList.toggle('reduce-motion', motion);
};
