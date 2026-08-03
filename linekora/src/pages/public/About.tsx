import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { Shield, Target, Users, Lock } from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';

export default function About() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-black text-gray-900 font-sans tracking-tight mb-8">{t('our_mission')}</h1>
        <p className="text-xl text-gray-600 font-sans leading-relaxed mb-12">
          {t('our_mission_desc')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
              <Shield size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 font-sans mb-3">{t('security_first')}</h3>
            <p className="text-gray-600 font-sans leading-relaxed">
              {t('security_first_desc')}
            </p>
          </div>
          <div>
            <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
              <Target size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 font-sans mb-3">{t('escrow_payments')}</h3>
            <p className="text-gray-600 font-sans leading-relaxed">
              {t('escrow_payments_desc')}
            </p>
          </div>
          <div>
            <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
              <Users size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 font-sans mb-3">{t('community_trust')}</h3>
            <p className="text-gray-600 font-sans leading-relaxed">
              {t('community_trust_desc')}
            </p>
          </div>
          <div>
            <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
              <Lock size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 font-sans mb-3">{t('data_privacy')}</h3>
            <p className="text-gray-600 font-sans leading-relaxed">
              {t('data_privacy_desc')}
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
