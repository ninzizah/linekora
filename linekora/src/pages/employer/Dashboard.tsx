import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PlusSquare, Users, Search, Heart, 
  ChevronRight, CheckCircle2, MapPin, ShieldCheck, X, DollarSign, Wallet
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { useLanguage } from '../../lib/LanguageContext';
import ActiveContractsResolver from '../../components/ActiveContractsResolver';

export default function EmployerDashboard() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  
  // Commission settings
  const [unpaidCommission, setUnpaidCommission] = useState(() => 
    Number(localStorage.getItem('company_unpaid_commission') || '0')
  );
  const [showPayModal, setShowPayModal] = useState(false);
  const [payPhone, setPayPhone] = useState('+250 788 ');
  const [isProcessingPay, setIsProcessingPay] = useState(false);

  const handlePayCorporateFee = () => {
    setIsProcessingPay(true);
    setTimeout(() => {
      localStorage.setItem('company_unpaid_commission', '0');
      localStorage.setItem('company_completed_jobs_since_last_payment', '0');
      setUnpaidCommission(0);
      setIsProcessingPay(false);
      setShowPayModal(false);

      // Add system alert
      const existingAlerts = localStorage.getItem('system_alerts') || '[]';
      let alertsArr = [];
      try { alertsArr = JSON.parse(existingAlerts); } catch (e) { alertsArr = []; }
      alertsArr.push({
        id: Date.now().toString(),
        category: 'success',
        title: t('toast_corporate_fee_received'),
        details: t('toast_corporate_fee_received_desc', { amount: unpaidCommission.toLocaleString() }),
        time: t('just_now'),
        read: false
      });
      localStorage.setItem('system_alerts', JSON.stringify(alertsArr));
    }, 1200);
  };

  const needs = [
    { name: t('need_cleaner'), icon: Search },
    { name: t('need_mechanic'), icon: Search },
    { name: t('need_gardener'), icon: Search },
    { name: t('need_nanny'), icon: Search },
    { name: t('need_mover'), icon: Search },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* ⚠️ OUTSTANDING INVOICE WARNER */}
        {unpaidCommission > 0 && (
          <div className="mb-10 bg-gradient-to-r from-red-650 to-orange-600 p-6 rounded-[2.5rem] border border-red-200 text-white shadow-xl shadow-red-100 flex flex-col md:flex-row md:items-center justify-between gap-6 animate-pulse">
            <div className="space-y-1">
              <h3 className="text-lg font-black uppercase tracking-tight font-sans flex items-center gap-2">
                {t('placement_restricted')}
              </h3>
              <p className="text-xs font-bold text-red-50/90 leading-relaxed font-sans max-w-2xl">
                {t('placement_restricted_desc', { amount: unpaidCommission.toLocaleString() })}
              </p>
            </div>
            <button
              onClick={() => setShowPayModal(true)}
              className="bg-white text-red-600 px-6 py-3.5 rounded-2xl hover:bg-red-50 transition-all font-sans font-black uppercase tracking-widest text-xs shrink-0 shadow-lg"
            >
              {t('resolve_invoice', { amount: unpaidCommission.toLocaleString() })}
            </button>
          </div>
        )}

        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 font-sans tracking-tight uppercase flex items-center gap-2">
              {t('greeting_hi', { name: profile?.displayName || t('employer') })}
              {profile?.verificationStatus === 'verified' && (
                <span className="inline-flex items-center gap-1 bg-green-50 text-green-600 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">
                  <CheckCircle2 size={12} />
                  {t('verified_client')}
                </span>
              )}
            </h1>
            <p className="text-gray-500 font-sans font-medium mt-1 italic">{t('dashboard_subtitle')}</p>
          </div>
          <Link to="/dashboard/employer/post" className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-sans font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
            <PlusSquare size={20} />
            {t('post_simple_task')}
          </Link>
        </header>

        <section className="mb-12">
          <h2 className="text-lg font-bold text-gray-400 uppercase tracking-widest font-sans mb-6">{t('what_do_you_need')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {needs.map((need, i) => (
              <button key={i} className="flex flex-col items-center justify-center p-6 rounded-3xl bg-white border border-gray-100 hover:border-blue-600 hover:shadow-lg transition-all group">
                <div className="h-12 w-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 mb-3">
                  <need.icon size={24} />
                </div>
                <span className="text-xs font-bold font-sans text-gray-900">{need.name}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            {/* 🚀 CONTRACT RESOLVER CENTER */}
            <ActiveContractsResolver />

            <section className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-gray-900 font-sans">{t('recently_posted_tasks')}</h3>
                <button className="text-sm font-bold text-blue-600 hover:underline">{t('see_all')}</button>
              </div>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <p className="text-gray-900 font-sans font-bold">{t('no_active_tasks')}</p>
                <p className="text-gray-500 font-sans text-sm mt-1">{t('post_a_task_to_find')}</p>
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <section className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl shadow-indigo-100 font-sans">
              <ShieldCheck className="mb-4" size={32} />
              <h3 className="text-xl font-bold font-sans mb-2">{t('verified_only')}</h3>
              <p className="text-white/80 font-sans text-sm mb-6 leading-relaxed">
                {t('verified_only_desc')}
              </p>
              <Link to="/dashboard/employer/browse" className="block text-center w-full bg-white text-indigo-600 py-3 rounded-xl font-sans font-bold shadow-lg text-sm transition-transform hover:scale-105">
                {t('browse_verified_talent')}
              </Link>
            </section>
          </div>
        </div>
      </div>

      {/* 💳 INVOICE POPUP DRAWERS MTNMOMO */}
      <AnimatePresence>
        {showPayModal && (
          <div className="fixed inset-0 bg-black/60 z-55 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[3rem] border border-gray-150 p-8 w-full max-w-sm relative shadow-2xl font-sans text-center"
            >
              <button
                onClick={() => setShowPayModal(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
              <div className="space-y-4">
                <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto text-xl font-mono font-black">
                  MTN
                </div>
                <h3 className="text-xl font-black font-sans uppercase tracking-tight text-gray-950">{t('corporate_placement_momo')}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {t('corporate_placement_momo_desc', { amount: unpaidCommission.toLocaleString() })}
                </p>

                <div className="text-left space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">{t('momo_account_phone')}</label>
                  <input
                    type="text"
                    value={payPhone}
                    onChange={(e) => setPayPhone(e.target.value)}
                    className="w-full text-sm font-black p-4 rounded-xl border border-gray-150 outline-none focus:border-blue-600 text-center tracking-widest"
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-xl flex justify-between text-xs font-mono font-bold text-gray-500">
                  <span>{t('merchant_title')}</span>
                  <span>{t('merchant_linekora_placement')}</span>
                </div>

                <button
                  onClick={handlePayCorporateFee}
                  disabled={isProcessingPay}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg transition-all"
                >
                  {isProcessingPay ? t('processing_payout') : t('settle_invoice', { amount: unpaidCommission.toLocaleString() })}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
