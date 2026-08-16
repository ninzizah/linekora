export const applyThemePrefs = (roleKey: string) => {
  const root = document.documentElement;
  const dark = localStorage.getItem(`linekora_dark_${roleKey}`) === 'true';
  const motion = localStorage.getItem(`linekora_motion_${roleKey}`) === 'true';
  root.classList.toggle('dark', dark);
  root.classList.toggle('reduce-motion', motion);
};
