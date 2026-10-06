import { useEffect, useRef } from 'react';

// Closes a dialog when the user presses Escape.
//
// Escape means "back out of this", never "go ahead". So this hook only ever
// calls the dismiss callback — it can never reach the confirm handler. Without
// it, dialogs were inconsistent: some closed on Escape, some silently ignored
// it, so a user reaching for Escape to cancel a destructive dialog would
// sometimes be stuck on it.
//
// Pass an `enabled` guard that turns the hook off while a request is in flight,
// so Escape cannot dismiss a dialog mid-submit and leave the screen out of sync
// with the server.
//
// The callback is held in a ref so an inline arrow function does not tear down
// and re-add the listener on every render.
//
// Deliberately not used on forms with typed input (payments, reports): losing
// what someone typed to a stray keypress is its own kind of accident.
export function useEscapeToClose(
  onDismiss: () => void,
  enabled = true,
) {
  const dismissRef = useRef(onDismiss);

  // Keep the ref pointing at the newest closure without re-running the effect.
  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        dismissRef.current();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled]);
}
