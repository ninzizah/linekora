import { useState } from 'react';
import { Download, X } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { useInstallPrompt } from '../lib/useInstallPrompt';

interface InstallAppButtonProps {
  className?: string;
  iconSize?: number;
}

export default function InstallAppButton({ className, iconSize = 16 }: InstallAppButtonProps) {
  const { t } = useLanguage();
  const { hasPrompt, isStandalone, isIOS, promptInstall } = useInstallPrompt();
  const [showHelp, setShowHelp] = useState(false);

  // Already running as an installed app — nothing to offer.
  if (isStandalone) return null;

  const handleClick = async () => {
    if (hasPrompt) {
      await promptInstall();
      return;
    }
    // iOS Safari never fires beforeinstallprompt, and some desktop browsers
    // (Firefox) have no programmatic install. The dialog explains those paths.
    setShowHelp(true);
  };

  return (
    <>
      <button type="button" onClick={handleClick} className={className}>
        <Download size={iconSize} />
        {t('download_app')}
      </button>

      {showHelp && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              aria-label={t('install_help_dismiss')}
              className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
            >
              <X size={15} />
            </button>
            <h3 className="pr-8 font-sans text-lg font-bold text-gray-900">{t('install_help_title')}</h3>
            <p className="mt-2 font-sans text-sm leading-relaxed text-gray-600">
              {isIOS ? t('download_app_ios_hint') : t('install_help_desc')}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
