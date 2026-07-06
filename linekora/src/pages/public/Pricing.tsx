import React, { useState, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { 
  Check, ShieldCheck, Zap, Star, Building, Users, 
  X, Smartphone, CreditCard, Loader2, AlertCircle, 
  CheckCircle2, Sparkles, ChevronRight, MessageSquare,
  Clock, DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../lib/AuthContext';

interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

export default function Pricing() {
  const { profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'worker' | 'company'>('worker');

  // Persistence for user upgraded plans
  const [currentWorkerTier, setCurrentWorkerTier] = useState<string>(() => {
    return localStorage.getItem('worker_membership_tier') || 'Free Worker';
  });

  const [currentCompanyTier, setCurrentCompanyTier] = useState<string>(() => {
    return localStorage.getItem('company_membership_tier') || 'Free Company';
  });

  // Dual state alignment track for MoMo billing streams
  const [upgradeRequests, setUpgradeRequests] = useState<any[]>(() => {
    const raw = localStorage.getItem('linekora_pricing_upgrade_requests');
    if (raw) {
      try { return JSON.parse(raw); } catch (e) {}
    }
    return [
      {
        id: "req_9921",
        date: "2 hours ago",
        userName: "Gabriel Niyonkuru",
        userEmail: "gabi@niyo.rw",
        role: "worker",
        tierName: "Verified Bronze",
        price: "15,000",
        method: "momo",
        paymentPhoneOrCard: "+250 788 112 345",
        status: "paid_awaiting_admin",
        steps: [
          { title: "Billing request sent to device", date: "2 hours ago", done: true },
          { title: "User paid & PIN authorized", date: "2 hours ago", done: true },
          { title: "Awaiting administrator approval", date: "Just now", done: false }
        ]
      }
    ];
  });

  // Keep state matching the Admin's approvals
  useEffect(() => {
    const handleStorage = () => {
      const raw = localStorage.getItem('linekora_pricing_upgrade_requests');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setUpgradeRequests(parsed);

          // Find if there is an approved request for the logged-in candidate
          const clientEmail = profile?.email || user?.email || "worker@demo.com";
          const approvedOne = parsed.find((r: any) => r.userEmail === clientEmail && r.status === 'approved');
          if (approvedOne) {
            if (approvedOne.role === 'worker') {
              setCurrentWorkerTier(approvedOne.tierName);
              localStorage.setItem('worker_membership_tier', approvedOne.tierName);
            } else {
              setCurrentCompanyTier(approvedOne.tierName);
              localStorage.setItem('company_membership_tier', approvedOne.tierName);
            }
          }
        } catch (e) {}
      }
    };
    window.addEventListener('storage', handleStorage);
    const interval = setTimeout(handleStorage, 1200);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearTimeout(interval);
    };
  }, [profile, user]);

  // Modal / Interaction states
  const [selectedTier, setSelectedTier] = useState<any>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutMethod, setCheckoutMethod] = useState<'momo' | 'card'>('momo');
  const [checkoutPhone, setCheckoutPhone] = useState('+250 788 300 120');
  const [checkoutCardNum, setCheckoutCardNum] = useState('4128 9011 2341 8802');
  const [checkoutCardExp, setCheckoutCardExp] = useState('11/29');
  const [checkoutCardCvc, setCheckoutCardCvc] = useState('515');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  // Interactive Payment Approval OTP or MoMo PIN constraints
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [pinError, setPinError] = useState('');
  const [momoTxRef, setMomoTxRef] = useState('');
  const [verificationInProcess, setVerificationInProcess] = useState(false);

  // Enterprise sales states
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
  const [entName, setEntName] = useState('');
  const [entEmail, setEntEmail] = useState('');
  const [entOrg, setEntOrg] = useState('');
  const [entSize, setEntSize] = useState('10-50');
  const [entMessage, setEntMessage] = useState('');
  const [entLoading, setEntLoading] = useState(false);
  const [entSuccess, setEntSuccess] = useState(false);

  // Active Toast notifications list
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (title: string, message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const handleCtaClick = (tier: any) => {
    // Check if clicking their current tier
    const isCurrent = activeTab === 'worker' 
      ? currentWorkerTier === tier.name 
      : currentCompanyTier === tier.name;

    if (isCurrent) {
      addToast(
        "Active Plan Alignment", 
        `Your profile is already associated with the ${tier.name} level specifications!`, 
        "info"
      );
      return;
    }

    if (tier.cta === "Downgrade" || tier.name.includes("Free")) {
      addToast(
        "Tier Maintained", 
        `You are on details associated with the standard Free account tier.`, 
        "info"
      );
      return;
    }

    // Otherwise setup checkout
    setSelectedTier(tier);
    setCheckoutSuccess(false);
    setCheckoutError('');
    setShowCheckoutModal(true);
    setShowPinPrompt(false);
    setPinValue('');
    setOtpValue('');
    setPinError('');
    setVerificationInProcess(false);
  };

  const handleSecurePurchase = () => {
    if (checkoutMethod === 'momo') {
      if (!checkoutPhone.trim()) {
        setCheckoutError('Please enter a valid sender mobile money number.');
        return;
      }
      if (!momoTxRef.trim()) {
        setCheckoutError('Please enter the MTN MoMo Transaction Reference ID.');
        return;
      }

      setCheckoutError('');
      setCheckoutLoading(true);

      setTimeout(() => {
        setCheckoutLoading(false);
        setCheckoutSuccess(true);

        const clientName = profile?.displayName || user?.displayName || "Shema Honore";
        const clientEmail = profile?.email || user?.email || "worker@demo.com";

        const newReq = {
          id: `req_${Date.now()}`,
          date: "Just now",
          userName: clientName,
          userEmail: clientEmail,
          role: activeTab,
          tierName: selectedTier.name,
          price: selectedTier.price,
          method: "momo",
          paymentPhoneOrCard: checkoutPhone,
          momoTxRef: momoTxRef,
          status: "paid_awaiting_admin",
          steps: [
            { title: "Manual MTN MoMo Payment Sent", date: "Just now", done: true },
            { title: "Transaction Reference ID: " + momoTxRef, date: "Just now", done: true },
            { title: "Awaiting Admin verification at ndivelabs@gmail.com", date: "Pending...", done: false }
          ]
        };

        const updatedReqs = [newReq, ...upgradeRequests.filter((r: any) => r.userEmail !== clientEmail || r.status !== 'request_sent')];
        setUpgradeRequests(updatedReqs);
        localStorage.setItem('linekora_pricing_upgrade_requests', JSON.stringify(updatedReqs));

        addToast(
          "Payment Details Logged 🔐", 
          `Payment details for RWF ${selectedTier.price} submitted! Awaiting administrator receipt verification.`, 
          "success"
        );
      }, 1500);
      return;
    }

    if (checkoutMethod === 'card' && (!checkoutCardNum.trim() || checkoutCardNum.length < 12)) {
      setCheckoutError('Please supply a valid debit card identity signature.');
      return;
    }

    setCheckoutError('');
    setCheckoutLoading(true);

    // Simulate contacting billing host and sending PIN prompt
    setTimeout(() => {
      setCheckoutLoading(false);
      setShowPinPrompt(true);
      addToast(
        "Handshake Dispatched 📲", 
        "Secure 3D Secure Verification code transmitted to your phone.", 
        "info"
      );
    }, 1500);
  };

  const handleVerifyAndApprovePayment = () => {
    if (checkoutMethod === 'momo') {
      if (!pinValue.trim() || pinValue.length < 5) {
        setPinError('Please enter your 5-digit Mobile Money PIN to authenticate.');
        return;
      }
    } else {
      if (!otpValue.trim() || otpValue.length < 6) {
        setPinError('Please enter the 6-digit SMS OTP verification code.');
        return;
      }
    }

    setPinError('');
    setVerificationInProcess(true);

    // Communicate mock telecom API link transaction
    setTimeout(() => {
      setVerificationInProcess(false);
      setShowPinPrompt(false);
      setCheckoutSuccess(true);
      
      const clientName = profile?.displayName || user?.displayName || "Shema Honore";
      const clientEmail = profile?.email || user?.email || "worker@demo.com";

      const newReq = {
        id: `req_${Date.now()}`,
        date: "Just now",
        userName: clientName,
        userEmail: clientEmail,
        role: activeTab,
        tierName: selectedTier.name,
        price: selectedTier.price,
        method: checkoutMethod,
        paymentPhoneOrCard: checkoutMethod === 'momo' ? checkoutPhone : `•••• •••• •••• ${checkoutCardNum.slice(-4)}`,
        status: "paid_awaiting_admin",
        steps: [
          { title: "Billing handshake initialized to handset", date: "Just now", done: true },
          { title: "Subscriber PIN verified & telecom funds secured", date: "Just now", done: true },
          { title: "Awaiting administrator escrow release settlement", date: "Pending...", done: false }
        ]
      };

      const updatedReqs = [newReq, ...upgradeRequests.filter((r: any) => r.userEmail !== clientEmail || r.status !== 'request_sent')];
      setUpgradeRequests(updatedReqs);
      localStorage.setItem('linekora_pricing_upgrade_requests', JSON.stringify(updatedReqs));

      addToast(
        "Escrow Dispatched 🔐", 
        `Payment of RWF ${selectedTier.price} submitted! Awaiting administrator receipt verification.`, 
        "success"
      );
    }, 2000);
  };

  const handleEnterpriseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entName.trim() || !entEmail.trim()) {
      addToast("Format Mismatch ❌", "Name and working corporate email address are mandatory.", "error");
      return;
    }

    setEntLoading(true);
    setTimeout(() => {
      setEntLoading(false);
      setEntSuccess(true);
      addToast(
        "Proposal Forwarded ✈️", 
        "Your managed recruitment inquiries have been secured by our Kigali sales office representatives.", 
        "success"
      );
    }, 1200);
  };

  const workerTiers = [
    {
      name: "Free Worker",
      price: "0",
      features: [
        "Create account & Basic profile",
        "Browse public jobs",
        "Apply to 1 active job at a time",
        "Basic location matching",
        "Receive community support",
        "View company profiles",
        "Save jobs",
        "Basic trust score"
      ],
      limitations: [
        "No verification badge",
        "Lower search ranking",
        "No direct employer chat",
        "Limited applications"
      ],
      cta: currentWorkerTier === "Free Worker" ? "Current Plan" : "Downgrade",
      featured: false,
      color: "gray"
    },
    {
      name: "Verified Bronze",
      price: "15,000",
      subtext: "System Review",
      features: [
        "Everything in Free PLUS:",
        "✔ Verified Bronze Badge",
        "ID & Phone Verification",
        "5 active applications",
        "Email & SMS Alerts",
        "Escrow Protection",
        "Higher search ranking",
        "Priority in recommendations",
        "Fraud protection review"
      ],
      cta: currentWorkerTier === "Verified Bronze" ? "Current Plan" : "Verify Now",
      featured: true,
      color: "orange"
    },
    {
      name: "Verified Silver",
      price: "35,000",
      subtext: "Admin Approved",
      features: [
        "Everything in Bronze PLUS:",
        "✔ Silver Verified Badge",
        "Biometric face matching",
        "Unlimited Applications",
        "Direct Chat Features",
        "Highest worker visibility",
        "Featured in top candidates",
        "Faster support response",
        "Portfolio priority"
      ],
      cta: currentWorkerTier === "Verified Silver" ? "Current Plan" : "Go Silver",
      featured: false,
      color: "blue"
    }
  ];

  const companyTiers = [
    {
      name: "Free Company",
      price: "0",
      features: [
        "Create company profile",
        "Post limited jobs (max 3)",
        "Browse workers",
        "Receive applications",
        "Basic dashboard",
        "Standard visibility",
        "Community support"
      ],
      limitations: [
        "No verified badge",
        "Lower job visibility",
        "Limited candidate search",
        "Fewer active listings"
      ],
      cta: currentCompanyTier === "Free Company" ? "Current Plan" : "Join Free",
      featured: false,
      color: "gray"
    },
    {
      name: "Verified Company",
      price: "25,000",
      subtext: "Verification required",
      features: [
        "Everything in Free PLUS:",
        "✔ Verified Company Badge",
        "Trusted Employer Label",
        "Higher job visibility",
        "Unlimited job postings",
        "Candidate recommendations",
        "Advanced filtering",
        "Priority support",
        "Verified office address",
        "Escrow payment trust"
      ],
      cta: currentCompanyTier === "Verified Company" ? "Current Plan" : "Verify Business",
      featured: true,
      color: "indigo"
    }
  ];

  const currentTiers = activeTab === 'worker' ? workerTiers : companyTiers;

  return (
    <div className="min-h-screen bg-white relative">
      <Navbar />
      
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-105 px-4 py-1.5 rounded-full mb-6">
            <Sparkles size={14} className="text-blue-600 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-800">Verified Professional Ecosystem</span>
          </div>

          <h1 className="text-5xl font-black text-gray-900 font-sans tracking-tight mb-8 uppercase">Membership Tiers</h1>
          
          <div className="inline-flex bg-gray-100 p-1.5 rounded-[2rem] mb-12 shadow-inner border border-gray-200">
            <button 
              onClick={() => setActiveTab('worker')}
              className={`flex items-center gap-2 px-8 py-3 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                activeTab === 'worker' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Users size={16} />
              I am a Worker
            </button>
            <button 
              onClick={() => setActiveTab('company')}
              className={`flex items-center gap-2 px-8 py-3 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                activeTab === 'company' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Building size={16} />
              I am an Employer
            </button>
          </div>

          <p className="text-xl text-gray-500 font-sans font-medium max-w-2xl mx-auto italic">
            {activeTab === 'worker' ? '"Build trust, get hired faster."' : '"Hire verified talent with confidence."'}
          </p>
        </div>

        <div className={`grid grid-cols-1 ${activeTab === 'worker' ? 'lg:grid-cols-3' : 'lg:grid-cols-2 max-w-5xl mx-auto'} gap-8`}>
          {currentTiers.map((tier, i) => {
            const isMyPlan = activeTab === 'worker' 
              ? currentWorkerTier === tier.name 
              : currentCompanyTier === tier.name;

            return (
              <div key={i} className={`
                relative rounded-[3rem] p-10 border-2 transition-all flex flex-col
                ${tier.featured ? 'border-blue-600 shadow-2xl shadow-blue-105 scale-105 z-10 bg-white' : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'}
                ${tier.color === 'orange' ? 'border-orange-500 shadow-orange-105' : ''}
                ${tier.color === 'indigo' ? 'border-indigo-600 shadow-indigo-105' : ''}
                ${isMyPlan ? 'ring-4 ring-offset-2 ring-blue-500' : ''}
              `}>
                {tier.featured && (
                  <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-[10px] font-black px-6 py-2 rounded-full uppercase tracking-widest shadow-lg ${
                    tier.color === 'orange' ? 'bg-orange-500' : tier.color === 'indigo' ? 'bg-indigo-600' : 'bg-blue-600'
                  }`}>
                    {tier.name === 'Verified Company' ? 'Highly Recommended' : 'Most Trusted'}
                  </div>
                )}

                {isMyPlan && (
                  <div className="absolute top-4 right-8 bg-blue-100 text-blue-700 font-sans text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">
                    Your Active Plan
                  </div>
                )}
                
                <div className="mb-8">
                  <h3 className={`text-2xl font-black font-sans uppercase tracking-tight ${
                    tier.color === 'orange' ? 'text-orange-600' : 
                    tier.color === 'blue' ? 'text-blue-600' : 
                    tier.color === 'indigo' ? 'text-indigo-600' : 'text-gray-900'
                  }`}>{tier.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-sm font-black text-gray-400 uppercase font-sans">RWF</span>
                    <span className="text-5xl font-black text-gray-900 font-sans tracking-tighter">{tier.price}</span>
                    <span className="text-gray-400 font-sans font-bold uppercase text-[10px] tracking-widest px-2">
                      {tier.subtext || 'one-time'}
                    </span>
                  </div>
                </div>

                <div className="flex-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Core Benefits</p>
                  <ul className="space-y-4 mb-10">
                    {tier.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-3 text-sm font-bold text-gray-700 font-sans leading-tight">
                        <div className={`mt-0.5 shrink-0 h-4 w-4 rounded-full flex items-center justify-center ${feature.startsWith('✔') ? 'bg-green-100' : 'bg-blue-50'}`}>
                          <Check size={10} className={feature.startsWith('✔') ? 'text-green-600' : 'text-blue-600'} strokeWidth={4} />
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {tier.limitations && (
                    <div className="pt-6 border-t border-gray-200/50">
                      <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-4">Limitations</p>
                      <ul className="space-y-3">
                        {tier.limitations.map((limit, j) => (
                          <li key={j} className="flex items-center gap-3 text-xs font-bold text-gray-400 font-sans italic">
                            <Check size={12} className="text-gray-200" strokeWidth={3} />
                            {limit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => handleCtaClick(tier)}
                  className={`
                    mt-12 w-full py-5 rounded-[2rem] font-sans font-black uppercase tracking-[0.2em] text-[10px] transition-all cursor-pointer
                    ${isMyPlan 
                      ? 'bg-green-600 text-white shadow-xl shadow-green-100' 
                      : tier.featured
                      ? `${tier.color === 'orange' ? 'bg-orange-500 hover:bg-orange-600' : tier.color === 'indigo' ? 'bg-indigo-600' : 'bg-blue-600 hover:bg-blue-700'} text-white shadow-xl hover:translate-y-[-2px]`
                      : 'bg-white border-2 border-gray-150 text-gray-900 hover:border-blue-600 hover:text-blue-600 hover:shadow-lg'}
                  `}
                >
                  {isMyPlan ? "Current Plan" : tier.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* ACTIVE BILLING INTERACTIVE HANDSHAKES FROM ADMIN PORTAL */}
        {(() => {
          const clientEmail = profile?.email || user?.email || "worker@demo.com";
          const pendingPrompt = upgradeRequests.find((r: any) => r.userEmail === clientEmail && r.status === 'request_sent');
          if (!pendingPrompt) return null;
          return (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 bg-amber-500 rounded-3xl p-8 text-black shadow-xl shadow-amber-100/60 border border-amber-400 relative overflow-hidden font-sans"
            >
              <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                <Smartphone size={240} className="stroke-black" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <span className="bg-black text-amber-500 font-sans text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full inline-block mb-3 select-none">
                    🔔 Action Required: Pending MoMo Request
                  </span>
                  <h3 className="text-xl font-black font-sans tracking-tight text-gray-950 uppercase leading-snug">
                    MTN Mobile Money hand-off triggered by Kigali Ops Admin
                  </h3>
                  <p className="text-gray-900 font-sans text-sm mt-1.5 max-w-xl font-medium">
                    An administrative billing request has been dispatched to <strong>{pendingPrompt.paymentPhoneOrCard}</strong> to unlock your <strong>{pendingPrompt.tierName}</strong>. Since MTN sandbox is active, please authorize and enter your secure PIN to complete.
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    setSelectedTier({ name: pendingPrompt.tierName, price: pendingPrompt.price });
                    setCheckoutMethod('momo');
                    setCheckoutPhone(pendingPrompt.paymentPhoneOrCard);
                    setShowPinPrompt(true);
                    setShowCheckoutModal(true);
                  }}
                  className="bg-black text-amber-500 hover:text-amber-400 hover:bg-gray-900 px-8 py-4.5 rounded-[2rem] font-sans font-black uppercase tracking-widest text-xs shadow-xl shadow-amber-950/20 hover:scale-105 transition-all cursor-pointer whitespace-nowrap self-stretch md:self-auto text-center"
                >
                  Confirm & Enter PIN
                </button>
              </div>
            </motion.div>
          );
        })()}

        {/* MY UPGRADE REQUESTS LOG & TIMELINE SECTION */}
        {(() => {
          const clientEmail = profile?.email || user?.email || "worker@demo.com";
          const myRequests = upgradeRequests.filter((r: any) => r.userEmail === clientEmail);
          if (myRequests.length === 0) return null;
          return (
            <div className="mt-20 bg-gray-50/60 border border-gray-100 rounded-[3rem] p-8 md:p-12 font-sans select-none">
              <div className="border-b border-gray-200/60 pb-5 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xs font-black text-gray-405 uppercase tracking-widest">My Billing Escrow Handshakes & Timeline</h3>
                  <p className="text-gray-905 font-sans font-black text-sm mt-0.5">Track your MoMo verification and admin-level approval progress</p>
                </div>
                <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-100 px-3 py-1 rounded-xl text-yellow-805 text-[10px] font-black uppercase tracking-widest">
                  <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-ping"></span>
                  MTN MoMo Sandbox Active
                </div>
              </div>

              <div className="space-y-4">
                {myRequests.map((req: any) => (
                  <div key={req.id} className="p-6 bg-white border border-gray-100/80 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          req.status === 'approved' ? 'bg-green-50 text-green-700 border border-green-100' :
                          req.status === 'rejected' ? 'bg-red-50 text-red-750 border border-red-100' :
                          req.status === 'paid_awaiting_admin' ? 'bg-amber-50 text-amber-700 border border-amber-100 animate-pulse' :
                          'bg-indigo-50 text-indigo-700 border border-indigo-100'
                        }`}>
                          {req.status === 'paid_awaiting_admin' ? 'paid (awaiting admin)' : req.status.replace('_', ' ')}
                        </span>
                        <span className="text-gray-400 font-bold text-[10px] uppercase font-mono">{req.date}</span>
                      </div>

                      <div>
                        <h4 className="text-base font-black text-gray-905 font-sans">{req.tierName} Verification Shield Upgrade</h4>
                        <p className="text-xs text-gray-450 mt-0.5 font-sans font-medium">Payment Account: <span className="font-mono text-gray-700">{req.paymentPhoneOrCard}</span> • Review Fee: <strong className="text-blue-600 font-black font-sans">RWF {req.price}</strong></p>
                      </div>

                      {/* Timeline flow */}
                      <div className="pt-2 border-t border-gray-100 max-w-xl">
                        <p className="text-[9px] font-black text-gray-450 uppercase tracking-widest mb-3 font-sans">Escrow Status Timeline Details</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {req.steps?.map((step: any, idx: number) => (
                            <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-150/50 flex gap-2.5 items-start">
                              <span className={`h-2 w-2 rounded-full shrink-0 mt-1 ${step.done ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                              <div>
                                <p className="text-[10px] font-black text-gray-800 leading-tight uppercase font-sans">{step.title}</p>
                                <p className="text-[8px] text-gray-400 font-bold font-mono uppercase mt-0.5">{step.date || 'Pending...'}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 w-full md:w-auto self-stretch md:self-center flex flex-col justify-center">
                      {req.status === 'request_sent' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTier({ name: req.tierName, price: req.price });
                            setCheckoutMethod('momo');
                            setCheckoutPhone(req.paymentPhoneOrCard);
                            setShowPinPrompt(true);
                            setShowCheckoutModal(true);
                          }}
                          className="w-full md:w-44 py-3 bg-amber-500 hover:bg-amber-600 text-black rounded-xl font-sans font-black uppercase tracking-widest text-[9px] text-center transition-all shadow-md cursor-pointer"
                        >
                          Confirm & Enter PIN
                        </button>
                      ) : req.status === 'paid_awaiting_admin' ? (
                        <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl font-mono text-[9px] text-amber-700 uppercase font-black tracking-widest text-center">
                          Awaiting Admin Settlement
                        </div>
                      ) : req.status === 'approved' ? (
                        <div className="p-3 bg-green-50 border border-green-100 rounded-xl font-mono text-[9px] text-green-700 uppercase font-black tracking-widest text-center flex items-center justify-center gap-1.5 leading-none">
                          <Check size={12} className="text-green-600" />
                          Tier Active Live
                        </div>
                      ) : (
                        <div className="p-3 bg-gray-105 border border-gray-200 rounded-xl font-mono text-[9px] text-gray-400 uppercase font-bold tracking-widest text-center">
                          Rejected log
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Action Call Section at base */}
        <div className="mt-24 bg-blue-600 rounded-[3rem] p-10 md:p-16 text-white text-center shadow-2xl shadow-blue-200 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
            <Building size={400} />
          </div>
          <h2 className="text-3xl font-black font-sans mb-6 relative z-10">Need a custom plan for your organization?</h2>
          <p className="text-white/80 font-sans text-lg mb-10 max-w-2xl mx-auto font-medium relative z-10">
            We offer bulk verification, managed hiring pipelines and custom compliance tracking packages for regional developers, hotels, and agricultural cooperatives.
          </p>
          <button 
            type="button"
            onClick={() => {
              setEntSuccess(false);
              setEntName('');
              setEntEmail('');
              setEntOrg('');
              setEntMessage('');
              setShowEnterpriseModal(true);
            }}
            className="bg-white text-blue-600 px-10 py-5 rounded-[2rem] font-sans font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-900/20 hover:scale-105 transition-transform cursor-pointer relative z-10"
          >
            Contact Enterprise Sales
          </button>
        </div>
      </div>

      <Footer />

      {/* SECURE POPUP MEMBER GATE checkout */}
      <AnimatePresence>
        {showCheckoutModal && selectedTier && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm" 
              onClick={() => { if (!checkoutLoading) setShowCheckoutModal(false); }} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-gray-100 z-10"
            >
              <button 
                disabled={checkoutLoading}
                onClick={() => setShowCheckoutModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>

              {!checkoutSuccess ? (
                showPinPrompt ? (
                  <div>
                    <h2 className="text-xl font-black text-gray-950 font-sans mb-1 uppercase tracking-tight flex items-center gap-2">
                      <Smartphone className="text-amber-500 animate-pulse" />
                      {checkoutMethod === 'momo' ? 'MTN MoMo Approve PIN' : 'SMS OTP Code Verification'}
                    </h2>
                    <p className="text-xs text-gray-400 font-sans italic mb-4">
                      {checkoutMethod === 'momo' 
                        ? 'Confirm authorization using your standard secure device PIN code.' 
                        : 'Verify the security OTP dispatched to complete transaction escrow.'}
                    </p>

                    <div className="mb-4 p-4.5 bg-gray-50 border border-gray-100 rounded-3xl">
                      <div className="text-left space-y-1.5 uppercase font-sans text-[9px] font-black tracking-widest text-gray-500">
                        <div className="flex justify-between">
                          <span>Pay To:</span>
                          <span className="text-gray-955 font-extrabold text-right">LINEKORA LTD</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Service:</span>
                          <span className="text-gray-955 font-extrabold text-right">{selectedTier.name} Status</span>
                        </div>
                        <div className="flex justify-between border-t border-gray-200/60 pt-1.5">
                          <span>Amount:</span>
                          <span className="text-amber-600 font-extrabold text-right">RWF {selectedTier.price}</span>
                        </div>
                      </div>
                    </div>

                    {pinError && (
                      <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-100 text-[9px] font-black uppercase tracking-widest rounded-xl flex items-center gap-1.5 leading-tight animate-bounce">
                        <AlertCircle size={14} className="shrink-0" />
                        <span>{pinError}</span>
                      </div>
                    )}

                    <div className="space-y-4">
                      {checkoutMethod === 'momo' ? (
                        <div>
                          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest font-sans mb-2 text-center">
                            Enter Your 5-Digit Mobile Money PIN
                          </label>
                          <div className="relative max-w-[160px] mx-auto">
                            <input 
                              type="password"
                              maxLength={5}
                              readOnly
                              value={pinValue}
                              placeholder="• • • • •"
                              className="w-full tracking-[1.5em] text-center p-3 rounded-2xl border-2 border-amber-500 outline-none font-sans font-black text-lg bg-amber-50/10 text-gray-955 text-center"
                            />
                          </div>
                          
                          {/* Mini Numeric Keypad */}
                          <div className="grid grid-cols-3 gap-1.5 max-w-[180px] mx-auto mt-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '⌫'].map((key) => (
                              <button
                                type="button"
                                key={key.toString()}
                                disabled={verificationInProcess}
                                onClick={() => {
                                  if (key === 'C') {
                                    setPinValue('');
                                  } else if (key === '⌫') {
                                    setPinValue(prev => prev.slice(0, -1));
                                  } else {
                                    if (pinValue.length < 5) {
                                      setPinValue(prev => prev + key);
                                    }
                                  }
                                }}
                                className="py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200/60 rounded-xl font-sans font-black text-xs text-gray-800 transition-colors cursor-pointer"
                              >
                                {key}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest font-sans mb-2 text-center">
                            Enter the 6-Digit Verification Token (SMS)
                          </label>
                          <div className="relative max-w-[200px] mx-auto">
                            <input 
                              type="text"
                              maxLength={6}
                              disabled={verificationInProcess}
                              value={otpValue}
                              onChange={(e) => {
                                  let val = e.target.value.replace(/\D/g, '');
                                  setOtpValue(val);
                              }}
                              placeholder="• • • • • •"
                              className="w-full tracking-[1.2em] text-center p-3 rounded-2xl border-2 border-blue-500 outline-none font-sans font-black text-base bg-blue-50/10 text-gray-955 text-center font-mono"
                            />
                          </div>
                        </div>
                      )}

                      <div className="pt-2 flex gap-3">
                        <button
                          type="button"
                          disabled={verificationInProcess}
                          onClick={() => setShowPinPrompt(false)}
                          className="w-1/3 py-3.5 bg-gray-100 hover:bg-gray-250 text-gray-500 rounded-2xl font-sans font-black uppercase tracking-widest text-[9px] text-center transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button 
                          type="button"
                          disabled={verificationInProcess}
                          onClick={handleVerifyAndApprovePayment}
                          className={`w-2/3 py-3.5 text-white rounded-2xl font-sans font-black uppercase tracking-widest text-[9px] text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg ${
                            checkoutMethod === 'momo' 
                              ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' 
                              : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                          }`}
                        >
                          {verificationInProcess ? (
                            <>
                              <Loader2 size={12} className="animate-spin" />
                              <span>Charging Wallet...</span>
                            </>
                          ) : (
                            <>
                              <span>Approve Payment</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-black text-gray-950 font-sans mb-1 uppercase tracking-tight">Tier Upgrade</h2>
                    <p className="text-xs text-gray-400 font-sans italic mb-6">Unlock active verified credentials instantly via secured billing handshake</p>

                    <div className="mb-6 p-5 bg-blue-50/60 border border-blue-100 rounded-3xl flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Selected Tier</p>
                        <p className="text-sm font-black text-gray-900 font-sans mt-0.5">{selectedTier.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Review Fee</p>
                        <p className="text-lg font-black text-blue-600 font-sans mt-0.5">RWF {selectedTier.price}</p>
                      </div>
                    </div>

                    {checkoutError && (
                      <div className="mb-6 p-4 bg-red-50 text-red-655 border border-red-100 text-xs font-bold rounded-2xl flex items-start gap-2 animate-pulse text-red-600">
                        <AlertCircle size={16} className="shrink-0" />
                        <span>{checkoutError}</span>
                      </div>
                    )}

                    <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest font-sans mb-3">Gateway Billing Partner</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          type="button"
                          disabled={checkoutLoading}
                          onClick={() => setCheckoutMethod('momo')}
                          className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all cursor-pointer ${
                            checkoutMethod === 'momo' ? 'border-amber-500 bg-amber-50/50 text-amber-950' : 'border-gray-100 text-gray-400 hover:border-blue-600'
                          }`}
                        >
                          <Smartphone size={22} className={checkoutMethod === 'momo' ? 'text-amber-600' : ''} />
                          <span className="font-sans text-[10px] font-black uppercase tracking-tight">MTN MoMo Gateway</span>
                        </button>
                        <button 
                          type="button"
                          disabled={checkoutLoading}
                          onClick={() => setCheckoutMethod('card')}
                          className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all cursor-pointer ${
                            checkoutMethod === 'card' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-100 text-gray-400 hover:border-blue-600'
                          }`}
                        >
                          <CreditCard size={22} className={checkoutMethod === 'card' ? 'text-blue-600' : ''} />
                          <span className="font-sans text-[10px] font-black uppercase tracking-tight">Debit Card Gate</span>
                        </button>
                      </div>
                    </div>

                    {checkoutMethod === 'momo' ? (
                      <div className="space-y-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4.5 text-xs text-amber-950 font-sans leading-relaxed">
                          <p className="font-extrabold text-[10px] uppercase tracking-wider text-amber-900 mb-1 flex items-center gap-1">
                            <span>📲 Manual MTN MoMo Payment Instructions</span>
                          </p>
                          <p className="mb-2">
                            Please send exactly <strong>RWF {selectedTier.price}</strong> from your handset using the following credentials:
                          </p>
                          <div className="bg-white/80 border border-amber-100 rounded-xl p-3 font-mono text-[11px] space-y-1">
                            <div><span className="text-gray-500">Momo Code:</span> <strong className="text-gray-900">*182*8*1*+250783274084#</strong></div>
                            <div><span className="text-gray-500">MTN Number:</span> <strong className="text-gray-900">+250 783 274 084</strong></div>
                            <div><span className="text-gray-500">Account Name:</span> <strong className="text-gray-900">Ndivelabs Ltd</strong></div>
                            <div><span className="text-gray-500">Support Email:</span> <strong className="text-gray-900">ndivelabs@gmail.com</strong></div>
                          </div>
                          
                          <div className="mt-3.5 bg-red-50 border border-red-200 text-red-950 p-3 rounded-xl text-[10.5px] font-sans font-bold leading-normal flex flex-col gap-1">
                            <span className="text-red-750 font-black uppercase text-[9px] tracking-wider">📞 ACTION REQUIRED: CALL ADMIN</span>
                            <p>Once you send the MoMo payment, you MUST call our Admin at <strong className="text-red-700 underline font-mono text-[11px]">+250 783 274 084</strong> to confirm your payment in the Admin Portal. The admin is the only one who grants profile access after payment confirmation!</p>
                          </div>

                          <p className="mt-3 text-[10px] text-amber-805">
                            Once sent, enter your sender phone number and transaction reference details below.
                          </p>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans mb-1.5">Your Sender Phone Number</label>
                          <input 
                            type="text" 
                            disabled={checkoutLoading}
                            value={checkoutPhone}
                            onChange={(e) => setCheckoutPhone(e.target.value)}
                            placeholder="+250 783 274 084"
                            className="w-full p-3.5 rounded-xl border border-gray-200 outline-none font-sans font-bold text-sm bg-gray-50 focus:bg-white focus:border-blue-650 text-gray-950 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans mb-1.5">MTN Transaction Reference / ID</label>
                          <input 
                            type="text" 
                            disabled={checkoutLoading}
                            value={momoTxRef}
                            onChange={(e) => setMomoTxRef(e.target.value)}
                            placeholder="e.g. TxRef-100293482"
                            className="w-full p-3.5 rounded-xl border border-gray-200 outline-none font-sans font-bold text-sm bg-gray-50 focus:bg-white focus:border-blue-650 text-gray-950 font-mono"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest font-sans mb-1.5">Card Identifier Signature</label>
                          <input 
                            type="text" 
                            disabled={checkoutLoading}
                            value={checkoutCardNum}
                            onChange={(e) => setCheckoutCardNum(e.target.value)}
                            className="w-full p-3.5 rounded-xl border border-gray-200 outline-none font-sans font-bold text-sm bg-gray-50 focus:bg-white text-gray-950 font-mono"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans mb-1">Expiry Date</label>
                            <input 
                              type="text" 
                              disabled={checkoutLoading}
                              value={checkoutCardExp}
                              onChange={(e) => setCheckoutCardExp(e.target.value)}
                              className="w-full p-3 rounded-xl border border-gray-200 outline-none font-sans font-bold text-xs bg-gray-50 focus:bg-white text-center font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans mb-1">Security Code (CVC)</label>
                            <input 
                              type="text" 
                              disabled={checkoutLoading}
                              value={checkoutCardCvc}
                              onChange={(e) => setCheckoutCardCvc(e.target.value)}
                              className="w-full p-3 rounded-xl border border-gray-200 outline-none font-sans font-bold text-xs bg-gray-50 focus:bg-white text-center font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <button 
                      type="button"
                      disabled={checkoutLoading}
                      onClick={handleSecurePurchase}
                      className="w-full py-4.5 bg-blue-600 text-white rounded-2xl font-sans font-black uppercase tracking-widest text-xs hover:bg-blue-700 shadow-xl shadow-blue-150 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {checkoutLoading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Submitting Payment Details...</span>
                        </>
                      ) : (
                        <span>{checkoutMethod === 'momo' ? 'Submit MoMo Payment Reference' : 'Verify and Unlock Tier'}</span>
                      )}
                    </button>
                  </div>
                </div>
              )
            ) : (
                <div className="text-center py-4">
                  <div className="h-16 w-16 bg-green-50 text-green-600 border border-green-200 rounded-full flex items-center justify-center mb-6 mx-auto animate-bounce">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-905 font-sans uppercase tracking-tight mb-2">Escrow Sent!</h3>
                  <p className="text-xs font-sans text-amber-600 font-extrabold uppercase tracking-widest mb-4 animate-pulse">
                    Status: Awaiting Admin Approval
                  </p>
                  <p className="text-sm font-sans text-gray-500 leading-relaxed max-w-sm mx-auto mb-6">
                    Your payment details have been successfully logged. Once the Admin verifies the transfer to our official MTN MoMo number <strong>+250 783 274 084</strong>, your <strong>{selectedTier?.name}</strong> membership tier will be activated. For questions, reach out to <strong>ndivelabs@gmail.com</strong>.
                  </p>

                  <div className="bg-red-50 border border-red-200 text-red-950 rounded-2xl p-4.5 text-xs text-left font-sans leading-relaxed mb-6">
                    <p className="font-extrabold text-[10px] uppercase tracking-wider text-red-900 mb-1 flex items-center gap-1.5">
                      <span>📞 CALL ADMIN NOW FOR INSTANT ACTIVATION</span>
                    </p>
                    <p className="mb-2">
                      Because our system is authenticated and secure, the Admin must manually approve and activate your account inside the Admin Portal once payment is verified.
                    </p>
                    <div className="bg-white border border-red-100 rounded-xl p-3 text-center space-y-1">
                      <p className="text-[10px] uppercase font-black tracking-widest text-gray-400">ADMIN PHONE NUMBER TO CALL</p>
                      <p className="text-lg font-black text-red-650 tracking-tight font-mono">+250 783 274 084</p>
                      <p className="text-[9px] text-gray-500 font-bold italic">Call now to activate your access instantly!</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-left space-y-2 mb-8 uppercase font-sans text-[10px] font-black tracking-widest text-gray-500">
                    <div className="flex justify-between">
                      <span>Purchased Plan:</span>
                      <span className="text-gray-955 text-right font-extrabold">{selectedTier.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Merchant Ref:</span>
                      <span className="text-gray-955 text-right font-mono">PAY-TIER-{Math.floor(10000 + Math.random() * 90000)}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setShowCheckoutModal(false)}
                    className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-sans font-black uppercase tracking-widest text-[10px] text-center transition-all shadow-lg cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ENTERPRISE SALES INQUIRY OVERLAY */}
      <AnimatePresence>
        {showEnterpriseModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-950/65 backdrop-blur-sm" 
              onClick={() => { if (!entLoading) setShowEnterpriseModal(false); }} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-gray-100 z-10"
            >
              <button 
                disabled={entLoading}
                onClick={() => setShowEnterpriseModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>

              {!entSuccess ? (
                <form onSubmit={handleEnterpriseSubmit}>
                  <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                    <MessageSquare size={24} />
                  </div>
                  
                  <h2 className="text-2xl font-black text-gray-955 font-sans mb-1 uppercase tracking-tight">Enterprise Booking</h2>
                  <p className="text-xs text-gray-400 font-sans italic mb-4">Get connected to a dedicated Kigali executive on corporate volume hiring</p>

                  <div className="mb-6 p-4 bg-indigo-50/50 border border-indigo-105 rounded-2xl space-y-2 text-[10px] font-sans font-black uppercase tracking-widest text-indigo-900">
                    <div className="flex items-center justify-between">
                      <span>Phone / WhatsApp:</span>
                      <a href="https://wa.me/250783274084" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-extrabold">+250 783 274 084</a>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Office Location:</span>
                      <span className="text-indigo-600 font-extrabold">Kicukiro, Kigali</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Full Name</label>
                        <input 
                          type="text" 
                          required
                          value={entName}
                          onChange={(e) => setEntName(e.target.value)}
                          placeholder="john..."
                          className="w-full p-3 rounded-lg border border-gray-200 outline-none text-xs font-bold font-sans bg-gray-50 focus:bg-white focus:border-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Corporate Email</label>
                        <input 
                          type="email" 
                          required
                          value={entEmail}
                          onChange={(e) => setEntEmail(e.target.value)}
                          placeholder="linekora@company.rw"
                          className="w-full p-3 rounded-lg border border-gray-200 outline-none text-xs font-bold font-sans bg-gray-50 focus:bg-white focus:border-blue-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Organization Name</label>
                        <input 
                          type="text" 
                          value={entOrg}
                          onChange={(e) => setEntOrg(e.target.value)}
                          placeholder="Linekora Devs Ltd"
                          className="w-full p-3 rounded-lg border border-gray-200 outline-none text-xs font-bold font-sans bg-gray-50 focus:bg-white focus:border-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Hiring Volume / Size</label>
                        <select 
                          value={entSize}
                          onChange={(e) => setEntSize(e.target.value)}
                          className="w-full p-3 rounded-lg border border-gray-200 outline-none text-xs font-bold font-sans bg-gray-50 focus:bg-white"
                        >
                          <option value="10-50">10 to 50 active placements</option>
                          <option value="50-200">50 to 200 workers</option>
                          <option value="200+">More than 200 workers</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Tell us about your requirements</label>
                      <textarea 
                        rows={3}
                        value={entMessage}
                        onChange={(e) => setEntMessage(e.target.value)}
                        placeholder="Need biometric validation, custom monthly pay disbursements and tax escrow compliance..."
                        className="w-full p-3 rounded-lg border border-gray-200 outline-none text-xs font-bold font-sans bg-gray-50 focus:bg-white text-gray-900 resize-none"
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={entLoading}
                      className="w-full py-4 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl font-sans font-black uppercase tracking-widest text-[10px] transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {entLoading ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Dispatching Corporate Request...</span>
                        </>
                      ) : (
                        <span>Enquire Enterprise Solution</span>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-6">
                  <div className="h-16 w-16 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-full flex items-center justify-center mb-6 mx-auto animate-bounce">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-905 font-sans uppercase tracking-tight mb-2">Request Processed</h3>
                  <p className="text-sm font-sans text-gray-500 leading-relaxed max-w-sm mx-auto mb-6">
                    Our team received your hiring parameters summary. We will contact you at <strong>{entEmail}</strong> within 12 standard business hours.
                  </p>
                  
                  <button 
                    onClick={() => setShowEnterpriseModal(false)}
                    className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-sans font-black uppercase tracking-widest text-[10px] text-center transition-all shadow-lg cursor-pointer"
                  >
                    Close Dialog
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SYSTEM TOASTS PANEL */}
      <div className="fixed bottom-6 right-6 z-[120] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="pointer-events-auto bg-white rounded-2xl border border-gray-150 p-5 shadow-2xl flex items-start gap-4 relative overflow-hidden"
            >
              <div className={`absolute top-0 bottom-0 left-0 w-1 shrink-0 ${
                t.type === 'error' ? 'bg-red-500' : t.type === 'info' ? 'bg-blue-500' : 'bg-green-500'
              }`} />
              
              <div className="flex-1">
                <p className="font-sans font-black uppercase tracking-[0.1em] text-[8px] text-gray-400 mb-0.5">{t.title}</p>
                <p className="font-sans text-[11px] font-bold text-gray-800 leading-normal">{t.message}</p>
              </div>
              <button 
                onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                className="text-gray-300 hover:text-gray-550 transition-colors p-1 shrink-0 cursor-pointer"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
