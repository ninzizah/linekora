import { Wrench, MessageCircle } from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';

interface PaymentsUnderDevelopmentProps {
  compact?: boolean;
}

const WHATSAPP_URL = 'https://wa.me/250783274084';

export default function PaymentsUnderDevelopment({ compact }: PaymentsUnderDevelopmentProps) {
  const { t } = useLanguage();

  return (
    <div className={`rounded-[2rem] border border-amber-200 bg-amber-50 flex gap-4 ${compact ? 'p-4 items-start' : 'p-6 items-center'}`}>
      <div className="h-10 w-10 bg-white text-amber-500 rounded-xl flex items-center justify-center border border-amber-100 shadow-sm shrink-0">
        <Wrench size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-black text-amber-900 uppercase tracking-wider font-sans">{t('wallet_under_development')}</h4>
        <p className="text-xs font-bold text-amber-700 mt-1 leading-relaxed">{t('wallet_under_development_desc')}</p>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[11px] font-black text-amber-800 bg-white border border-amber-200 rounded-xl px-3 py-1.5 mt-2 hover:bg-amber-100 transition-colors"
        >
          <MessageCircle size={13} />
          {t('wallet_under_development_contact')}
        </a>
      </div>
    </div>
  );
}
