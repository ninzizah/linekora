import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Shield, FileText, Lock, Cookie, Receipt, HelpCircle, ChevronRight, Check } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { motion } from 'motion/react';
import { useLanguage } from '../../lib/LanguageContext';

type LegalTab = 'privacy' | 'terms' | 'cookies' | 'refund';

export default function Legal() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // Set default tab based onhash or search parameter or path query
  const getTabFromPath = (): LegalTab => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab') as LegalTab;
    if (tabParam && ['privacy', 'terms', 'cookies', 'refund'].includes(tabParam)) {
      return tabParam;
    }
    return 'privacy';
  };

  const [activeTab, setActiveTab ] = useState<LegalTab>(getTabFromPath());

  useEffect(() => {
    setActiveTab(getTabFromPath());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location]);

  const changeTab = (tab: LegalTab) => {
    navigate(`/legal?tab=${tab}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <Navbar />

      <main className="flex-grow pt-32 pb-24">
        {/* Decorative Top Banner */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-12">
          <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-blue-950 rounded-[3rem] p-10 md:p-16 text-white text-center md:text-left relative overflow-hidden shadow-2xl">
            <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-radial from-blue-500/10 to-transparent pointer-events-none" />
            <div className="max-w-3xl relative z-10">
              <span className="bg-blue-600 text-white text-[9px] font-black uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-full leading-none">{t('legal_compliance_hub')}</span>
              <h1 className="text-4xl md:text-5xl font-black font-sans tracking-tight uppercase mt-6">{t('trust_reliability_standards')}</h1>
              <p className="text-gray-350 text-base md:text-lg font-sans font-medium mt-4 text-gray-300">
                {t('legal_intro')}
              </p>
            </div>
          </div>
        </div>

        {/* Content Section with sidebar */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Sidebar selectors */}
            <div className="lg:col-span-3 space-y-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2.5">{t('platform_documents')}</p>
              
              <div className="bg-white rounded-[2rem] p-4 border border-gray-100 shadow-xl shadow-gray-200/40 space-y-2">
                {[
                  { id: 'privacy', label: t('privacy_policy'), icon: <Lock size={16} /> },
                  { id: 'terms', label: t('terms_of_service'), icon: <FileText size={16} /> },
                  { id: 'cookies', label: t('cookie_policy'), icon: <Cookie size={16} /> },
                  { id: 'refund', label: t('refund_policy'), icon: <Receipt size={16} /> }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => changeTab(item.id as LegalTab)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl font-sans font-black uppercase text-[10px] tracking-widest transition-all ${
                      activeTab === item.id
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight size={14} className={activeTab === item.id ? 'opacity-100' : 'opacity-30'} />
                  </button>
                ))}
              </div>

              {/* Instant support card */}
              <div className="bg-gradient-to-b from-blue-50 to-white rounded-[2rem] p-6 border border-blue-100 text-center">
                <div className="h-10 w-10 bg-white text-blue-600 border border-blue-200 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <HelpCircle size={18} />
                </div>
                <h4 className="text-xs font-black text-blue-900 font-sans uppercase tracking-widest">{t('need_assistance')}</h4>
                <p className="text-[10px] text-blue-750 font-sans font-medium mt-1 leading-relaxed text-blue-800">
                  {t('need_assistance_desc')}
                </p>
                <a 
                  href="https://wa.me/250783274084" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="mt-4 block w-full py-3 bg-white hover:bg-blue-50 border border-blue-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-blue-600 transition-all text-center"
                >
                  {t('whatsapp_support')}
                </a>
              </div>
            </div>

            {/* Main Policy details */}
            <div className="lg:col-span-9 bg-white rounded-[3rem] border border-gray-100 p-8 md:p-12 shadow-2xl">
              
              {activeTab === 'privacy' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-inner">
                      <Lock size={22} />
                    </span>
                    <div>
                      <h2 className="text-2xl font-black text-gray-950 font-sans uppercase tracking-tight">{t('privacy_policy')}</h2>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t('legal_effective_date')}</p>
                    </div>
                  </div>

                  <hr className="border-gray-100 my-8" />

                  <div className="prose prose-blue max-w-none text-sm text-gray-500 font-sans leading-relaxed space-y-6">
                    <p className="font-bold text-gray-800 text-base">
                      {t('privacy_intro')}
                    </p>

                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest pt-4">{t('privacy_h1')}</h3>
                    <p>
                      {t('privacy_h1_intro')}
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><strong>{t('privacy_li1_label')}</strong> {t('privacy_li1_body')}</li>
                      <li><strong>{t('privacy_li2_label')}</strong> {t('privacy_li2_body')}</li>
                      <li><strong>{t('privacy_li3_label')}</strong> {t('privacy_li3_body')}</li>
                      <li><strong>{t('privacy_li4_label')}</strong> {t('privacy_li4_body')}</li>
                    </ul>

                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest pt-4">{t('privacy_h2')}</h3>
                    <p>
                      {t('privacy_h2_intro')}
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>{t('privacy_h2_li1')}</li>
                      <li>{t('privacy_h2_li2')}</li>
                      <li>{t('privacy_h2_li3')}</li>
                    </ul>

                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest pt-4">{t('privacy_h3')}</h3>
                    <p>
                      {t('privacy_h3_body')}
                    </p>
                  </div>
                </motion.div>
              )}

              {activeTab === 'terms' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-inner">
                      <FileText size={22} />
                    </span>
                    <div>
                      <h2 className="text-2xl font-black text-gray-950 font-sans uppercase tracking-tight">{t('terms_of_service')}</h2>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t('legal_effective_date')}</p>
                    </div>
                  </div>

                  <hr className="border-gray-100 my-8" />

                  <div className="prose prose-blue max-w-none text-sm text-gray-500 font-sans leading-relaxed space-y-6">
                    <p className="font-bold text-gray-800 text-base">
                      {t('terms_intro')}
                    </p>

                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest pt-4">{t('terms_h1')}</h3>
                    <p>
                      {t('terms_h1_body')}
                    </p>

                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest pt-4">{t('terms_h2')}</h3>
                    <p>
                      {t('terms_h2_body')}
                    </p>

                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest pt-4">{t('terms_h3')}</h3>
                    <p>
                      {t('terms_h3_body')}
                    </p>
                  </div>
                </motion.div>
              )}

              {activeTab === 'cookies' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-inner">
                      <Cookie size={22} />
                    </span>
                    <div>
                      <h2 className="text-2xl font-black text-gray-950 font-sans uppercase tracking-tight">{t('cookie_policy')}</h2>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t('legal_effective_date')}</p>
                    </div>
                  </div>

                  <hr className="border-gray-100 my-8" />

                  <div className="prose prose-blue max-w-none text-sm text-gray-500 font-sans leading-relaxed space-y-6">
                    <p className="font-bold text-gray-800 text-base">
                      {t('cookies_intro')}
                    </p>

                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest pt-4">{t('cookies_h1')}</h3>
                    <p>
                      {t('cookies_h1_body')}
                    </p>

                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest pt-4">{t('cookies_h2')}</h3>
                    <p>
                      {t('cookies_h2_body')}
                    </p>

                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest pt-4">{t('cookies_h3')}</h3>
                    <p>
                      {t('cookies_h3_body')}
                    </p>
                  </div>
                </motion.div>
              )}

              {activeTab === 'refund' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-inner">
                      <Receipt size={22} />
                    </span>
                    <div>
                      <h2 className="text-2xl font-black text-gray-955 font-sans uppercase tracking-tight">{t('refund_policy')}</h2>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t('legal_effective_date')}</p>
                    </div>
                  </div>

                  <hr className="border-gray-100 my-8" />

                  <div className="prose prose-blue max-w-none text-sm text-gray-500 font-sans leading-relaxed space-y-6">
                    <p className="font-bold text-gray-800 text-base">
                      {t('refund_intro')}
                    </p>

                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest pt-4">{t('refund_h1')}</h3>
                    <p>
                      {t('refund_h1_body_1')}<strong>{t('refund_non_refundable')}</strong>{t('refund_h1_body_2')}
                    </p>

                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest pt-4">{t('refund_h2')}</h3>
                    <p>
                      {t('refund_h2_body')}
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>{t('refund_h2_li1')}</li>
                      <li>{t('refund_h2_li2')}</li>
                      <li>{t('refund_h2_li3')}</li>
                    </ul>

                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest pt-4">{t('refund_h3')}</h3>
                    <p>
                      {t('refund_h3_body')}
                    </p>
                  </div>
                </motion.div>
              )}

            </div>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
