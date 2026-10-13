import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt: () => Promise<void>;
}

// The inline script in index.html captures the event before the app bundle runs
// (Chrome can fire it very early, and React mounts too late to catch it).
declare global {
  interface Window {
    __linekoraInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

function currentPrompt(): BeforeInstallPromptEvent | null {
  return typeof window !== 'undefined' ? window.__linekoraInstallPrompt ?? null : null;
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => currentPrompt());
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    const sync = () => setDeferredPrompt(currentPrompt());

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      window.__linekoraInstallPrompt = event as BeforeInstallPromptEvent;
      sync();
    };

    const onInstalled = () => {
      window.__linekoraInstallPrompt = null;
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    // Pick up an event that already fired before this effect attached.
    sync();

    window.addEventListener('linekora-install-available', sync);
    window.addEventListener('linekora-installed', onInstalled);
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('linekora-install-available', sync);
      window.removeEventListener('linekora-installed', onInstalled);
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const isIOS =
    typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent) && !isStandalone;

  const promptInstall = useCallback(async () => {
    const prompt = deferredPrompt ?? currentPrompt();
    if (!prompt) return false;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    window.__linekoraInstallPrompt = null;
    setDeferredPrompt(null);
    return outcome === 'accepted';
  }, [deferredPrompt]);

  return {
    canInstall: !isStandalone && (!!deferredPrompt || isIOS),
    hasPrompt: !!deferredPrompt,
    isIOS,
    isStandalone,
    promptInstall,
  };
}
