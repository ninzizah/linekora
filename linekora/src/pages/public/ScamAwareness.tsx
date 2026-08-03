import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { AlertTriangle, ShieldCheck, UserX, Wallet, CheckCircle2, Lock } from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';

export default function ScamAwareness() {
  const { t } = useLanguage();
  const tips = [
    {
      title: t('tip_never_pay_upfront'),
      desc: t('tip_never_pay_upfront_desc'),
      icon: Wallet
    },
    {
      title: t('tip_keep_chat_on_platform'),
      desc: t('tip_keep_chat_on_platform_desc'),
      icon: Lock
    },
    {
      title: t('tip_verify_badges'),
      desc: t('tip_verify_badges_desc'),
      icon: ShieldCheck
    },
    {
      title: t('tip_report_suspicious'),
      desc: t('tip_report_suspicious_desc'),
      icon: UserX
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-14 w-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
            <AlertTriangle size={32} />
          </div>
          <h1 className="text-4xl font-black text-gray-900 font-sans tracking-tight">{t('scam_awareness')}</h1>
        </div>
        
        <p className="text-xl text-gray-600 font-sans leading-relaxed mb-16">
          {t('scam_awareness_intro')}
        </p>

        <div className="space-y-12 mb-20">
          {tips.map((tip, i) => (
            <div key={i} className="flex gap-8 group">
              <div className="shrink-0 h-16 w-16 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center transition-colors group-hover:bg-blue-600 group-hover:text-white">
                <tip.icon size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 font-sans mb-3">{tip.title}</h3>
                <p className="text-gray-600 font-sans leading-relaxed text-lg">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-green-50 rounded-[3rem] p-10 border border-green-100">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle2 className="text-green-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-900 font-sans">{t('security_pledge')}</h2>
          </div>
          <ul className="space-y-4">
            {[
              t('pledge_item_1'),
              t('pledge_item_2'),
              t('pledge_item_3'),
              t('pledge_item_4')
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 font-sans font-medium text-gray-700">
                <div className="h-1.5 w-1.5 rounded-full bg-green-600 mt-2.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <Footer />
    </div>
  );
}
