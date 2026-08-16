import { ShieldOff, Wrench, ArrowLeft, Mail, MessageCircle } from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';
import DashboardLayout from '../layout/DashboardLayout';

interface VerificationUnavailableProps {
  dashboardPath: string;
}

const WHATSAPP_URL = 'https://wa.me/250783274084';

export default function VerificationUnavailable({ dashboardPath }: VerificationUnavailableProps) {
  const { t } = useLanguage();

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto py-16 px-4">
        <div className="text-center mb-10">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 text-amber-500 mb-6 border border-amber-100">
            <ShieldOff size={32} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 font-sans tracking-tight">{t('verification_unavailable_title')}</h1>
          <p className="text-gray-500 font-sans font-medium mt-2 max-w-xl mx-auto leading-relaxed">{t('verification_unavailable_desc')}</p>
        </div>

        <div className="bg-amber-50/50 border border-amber-100 rounded-3xl p-8 mb-8">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 bg-white text-amber-500 rounded-xl flex items-center justify-center border border-amber-100 shadow-sm shrink-0">
              <Wrench size={20} />
            </div>
            <div>
              <p className="text-sm font-black text-amber-900 uppercase tracking-wider font-sans">{t('verification_unavailable_note')}</p>
              <p className="text-xs text-amber-700 font-bold mt-1 leading-relaxed">{t('verification_unavailable_contact')}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={dashboardPath}
            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-sans font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <ArrowLeft size={16} />
            {t('back_to_dashboard')}
          </a>
          <div className="flex items-center gap-4 text-gray-500">
            <a href="mailto:Ndivelabs@gmail.com" className="flex items-center gap-1.5 text-xs font-bold hover:text-blue-600 transition-colors">
              <Mail size={14} />
              Ndivelabs@gmail.com
            </a>
            <a href="https://wa.me/250783274084" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-bold hover:text-blue-600 transition-colors">
              <MessageCircle size={14} />
              WhatsApp 0783 274 084
            </a>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
