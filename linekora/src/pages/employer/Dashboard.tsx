import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PlusSquare, Users, Search, Heart, 
  ChevronRight, CheckCircle2, MapPin, ShieldCheck, X, DollarSign, Wallet
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import ActiveContractsResolver from '../../components/ActiveContractsResolver';

export default function EmployerDashboard() {
  const { profile } = useAuth();
  
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
        title: '💼 Corporate Fee Received',
        details: 'You safely cleared your RWF 5,000 corporate commission invoice. Placement services reinstated.',
        time: 'Just now',
        read: false
      });
      localStorage.setItem('system_alerts', JSON.stringify(alertsArr));
    }, 1200);
  };

  const needs = [
    { name: 'Need Cleaner', icon: Search },
    { name: 'Need Mechanic', icon: Search },
    { name: 'Need Gardener', icon: Search },
    { name: 'Need Nanny', icon: Search },
    { name: 'Need Mover', icon: Search },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* ⚠️ OUTSTANDING INVOICE WARNER */}
        {unpaidCommission > 0 && (
          <div className="mb-10 bg-gradient-to-r from-red-650 to-orange-600 p-6 rounded-[2.5rem] border border-red-200 text-white shadow-xl shadow-red-100 flex flex-col md:flex-row md:items-center justify-between gap-6 animate-pulse">
            <div className="space-y-1">
              <h3 className="text-lg font-black uppercase tracking-tight font-sans flex items-center gap-2">
                🔒 Placement Functions Restricted
              </h3>
              <p className="text-xs font-bold text-red-50/90 leading-relaxed font-sans max-w-2xl">
                Your professional profile has an unpaid LINEKORA placement fee of <span className="font-extrabold underline">RWF {unpaidCommission}</span> due on active completed contracts. While shifts remain active, you are blocked from posting new jobs until this invoice is cleared.
              </p>
            </div>
            <button
              onClick={() => setShowPayModal(true)}
              className="bg-white text-red-600 px-6 py-3.5 rounded-2xl hover:bg-red-50 transition-all font-sans font-black uppercase tracking-widest text-xs shrink-0 shadow-lg"
            >
              Resolve Invoice (RWF {unpaidCommission})
            </button>
          </div>
        )}

        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 font-sans tracking-tight uppercase flex items-center gap-2">
              Hi, {profile?.displayName || 'Employer'} 👋
              {profile?.verificationStatus === 'verified' && (
                <span className="inline-flex items-center gap-1 bg-green-50 text-green-600 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">
                  <CheckCircle2 size={12} />
                  Verified Client
                </span>
              )}
            </h1>
            <p className="text-gray-500 font-sans font-medium mt-1 italic">Hire verified workers for your home and personal tasks.</p>
          </div>
          <Link to="/dashboard/employer/post" className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-sans font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
            <PlusSquare size={20} />
            Post Simple Task
          </Link>
        </header>

        <section className="mb-12">
          <h2 className="text-lg font-bold text-gray-400 uppercase tracking-widest font-sans mb-6">What do you need today?</h2>
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
                <h3 className="text-xl font-bold text-gray-900 font-sans">Recently Posted Tasks</h3>
                <button className="text-sm font-bold text-blue-600 hover:underline">See all</button>
              </div>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <p className="text-gray-900 font-sans font-bold">No active tasks</p>
                <p className="text-gray-500 font-sans text-sm mt-1">Post a task to find verified workers near you.</p>
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <section className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl shadow-indigo-100 font-sans">
              <ShieldCheck className="mb-4" size={32} />
              <h3 className="text-xl font-bold font-sans mb-2">Verified Only</h3>
              <p className="text-white/80 font-sans text-sm mb-6 leading-relaxed">
                By default, we only show your tasks to workers who have completed their biometric ID checks.
              </p>
              <Link to="/dashboard/employer/browse" className="block text-center w-full bg-white text-indigo-600 py-3 rounded-xl font-sans font-bold shadow-lg text-sm transition-transform hover:scale-105">
                Browse Verified Talent
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
                <h3 className="text-xl font-black font-sans uppercase tracking-tight text-gray-950">Corporate Placement MoMo</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Clear outstanding corporate placement dues of <span className="font-bold">RWF {unpaidCommission}</span> instantly via registered MTN Mobile Money handles.
                </p>

                <div className="text-left space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">MoMo Account Phone</label>
                  <input
                    type="text"
                    value={payPhone}
                    onChange={(e) => setPayPhone(e.target.value)}
                    className="w-full text-sm font-black p-4 rounded-xl border border-gray-150 outline-none focus:border-blue-600 text-center tracking-widest"
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-xl flex justify-between text-xs font-mono font-bold text-gray-500">
                  <span>Merchant Title:</span>
                  <span>LINEKORA Placement</span>
                </div>

                <button
                  onClick={handlePayCorporateFee}
                  disabled={isProcessingPay}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg transition-all"
                >
                  {isProcessingPay ? 'Processing Payout...' : `Settle RWF ${unpaidCommission} Invoice`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
