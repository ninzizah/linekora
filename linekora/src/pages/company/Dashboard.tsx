import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PlusSquare, Users, Briefcase, TrendingUp, 
  ChevronRight, CheckCircle2, Clock, ShieldCheck, Star, User,
  X, Loader2, Sparkles, AlertCircle, Bookmark, Heart, MessageSquare, Plus, DollarSign, Wallet
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { useLanguage } from '../../lib/LanguageContext';
import ActiveContractsResolver from '../../components/ActiveContractsResolver';

interface NotificationMsg {
  id: string;
  type: 'success' | 'info' | 'error' | 'invite';
  title: string;
  message: string;
}

export default function CompanyDashboard() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Tab controller
  const [dashboardTab, setDashboardTab] = useState<'hiring' | 'subcontracting'>('hiring');

  // Subcontracting / Bidding state
  const [searchLead, setSearchLead] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showBidModal, setShowBidModal] = useState(false);
  const [chosenLeadId, setChosenLeadId] = useState<number | null>(null);

  // Proposal states
  const [proposedPrice, setProposedPrice] = useState<number>(0);
  const [proposedStaff, setProposedStaff] = useState<number>(5);
  const [proposedCoverLetter, setProposedCoverLetter] = useState('');
  const [proposedTimeline, setProposedTimeline] = useState('3 Weeks');

  // Subcontracting leads list
  const [subcontractLeads, setSubcontractLeads] = useState<any[]>([]);

  // Saved corporate bids
  const [companyBids, setCompanyBids] = useState<any[]>(() => {
    const cached = localStorage.getItem('company_bids');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('company_bids', JSON.stringify(companyBids));
  }, [companyBids]);

  // Dynamic state for Stats
  const [activeJobsCount, setActiveJobsCount] = useState(() => {
    const saved = localStorage.getItem('company_active_jobs_count');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [expiredJobsCount, setExpiredJobsCount] = useState(() => {
    const saved = localStorage.getItem('company_expired_jobs_count');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [shortlistCount, setShortlistCount] = useState(() => {
    const saved = localStorage.getItem('company_shortlist_count');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Shortlisted workers database
  const [shortlisted, setShortlisted] = useState<any[]>([]);

  // Expired Jobs database
  const [expiredJobs, setExpiredJobs] = useState<any[]>([]);

  // Modals state
  const [showExpiredJobsModal, setShowExpiredJobsModal] = useState(false);
  const [showShortlistModal, setShowShortlistModal] = useState(false);
  const [renewingJobId, setRenewingJobId] = useState<number | null>(null);

  // Corporate Pay Modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payPhone, setPayPhone] = useState('');
  const [isProcessingPay, setIsProcessingPay] = useState(false);
  const [unpaidCommission, setUnpaidCommission] = useState('0');

  const handlePayCorporateFee = () => {
    if (!payPhone.trim()) {
      addNotification('error', t('toast_missing_phone'), t('toast_momo_phone_required'));
      return;
    }
    setIsProcessingPay(true);
    setTimeout(() => {
      setIsProcessingPay(false);
      setShowPayModal(false);
      addNotification('success', t('toast_payment_processed'), t('toast_corporate_fee_settled', { amount: unpaidCommission, phone: payPhone }));
    }, 2000);
  };

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('company_active_jobs_count', activeJobsCount.toString());
  }, [activeJobsCount]);

  useEffect(() => {
    localStorage.setItem('company_expired_jobs_count', expiredJobsCount.toString());
  }, [expiredJobsCount]);

  useEffect(() => {
    localStorage.setItem('company_shortlist_count', shortlistCount.toString());
  }, [shortlistCount]);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationMsg[]>([]);

  const addNotification = (type: 'success' | 'info' | 'error' | 'invite', title: string, message: string) => {
    const id = Date.now().toString();
    const newNotif = { id, type, title, message };
    setNotifications(prev => [...prev, newNotif]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  // Renew Expired Job Action
  const handleRenewJobOnDashboard = (id: number, title: string) => {
    setRenewingJobId(id);
    setTimeout(() => {
      setExpiredJobs(prev => prev.filter(job => job.id !== id));
      setActiveJobsCount(prev => prev + 1);
      setExpiredJobsCount(prev => Math.max(0, prev - 1));
      setRenewingJobId(null);
      addNotification('success', t('toast_job_renewed'), t('toast_job_renewed_msg', { title }));
    }, 1200);
  };

  // Shortlist Candidate From Recommended Section
  const handleShortlistRecommended = (name: string, skill: string) => {
    const isAlready = shortlisted.some(s => s.name === name);
    if (isAlready) {
      addNotification('info', t('toast_already_shortlisted'), t('toast_already_shortlisted_msg', { name }));
      return;
    }
    const newId = Date.now();
    setShortlisted(prev => [...prev, { id: newId, name, role: skill, avatar: name[0], verified: true }]);
    setShortlistCount(prev => prev + 1);
    addNotification('success', t('toast_candidate_bookmarked'), t('toast_candidate_bookmarked_msg', { name }));
  };

  // Invite Candidate
  const handleInviteCandidate = (name: string) => {
    addNotification('invite', t('toast_interview_pushed'), t('toast_interview_pushed_msg', { name }));
  };

  // Remove Candidate from Shortlist
  const handleRemoveFromShortlist = (id: number, name: string) => {
    setShortlisted(prev => prev.filter(s => s.id !== id));
    setShortlistCount(prev => Math.max(0, prev - 1));
    addNotification('info', t('toast_shortlist_updated'), t('toast_shortlist_updated_msg', { name }));
  };

  // Send Job Offer (Hire)
  const handleSendContractOffer = (name: string) => {
    addNotification('success', t('toast_escrow_contract_pending'), t('toast_escrow_contract_pending_msg', { name }));
  };

  // Subcontract Bidding Actions
  const handleOpenBidModal = (leadId: number) => {
    const lead = subcontractLeads.find(l => l.id === leadId);
    if (lead) {
      setChosenLeadId(leadId);
      // Strip formatting to get numeric suggestion
      const rawPrice = parseInt(lead.budget.replace(/[^0-9]/g, ''), 10) || 500000;
      setProposedPrice(rawPrice);
      setProposedTimeline(lead.duration);
      setProposedStaff(parseInt(lead.teamSizeNeeded, 10) || 6);
      setProposedCoverLetter(t('bid_cover_letter_default', { title: lead.title }));
      setShowBidModal(true);
    }
  };

  const handleSubmitBid = (e: React.FormEvent) => {
    e.preventDefault();
    const lead = subcontractLeads.find(l => l.id === chosenLeadId);
    if (!lead) return;

    const newBidObj = {
      id: Date.now(),
      leadTitle: lead.title,
      bidPrice: proposedPrice,
      teamSize: proposedStaff,
      timeline: proposedTimeline,
      status: 'pending',
      date: t('submitted_just_now'),
      details: proposedCoverLetter
    };

    setCompanyBids(prev => [newBidObj, ...prev]);
    setShowBidModal(false);
    addNotification('success', t('toast_proposal_placed'), t('toast_proposal_placed_msg', { title: lead.title }));
  };

  const handleRetractBid = (id: number, title: string) => {
    setCompanyBids(prev => prev.filter(b => b.id !== id));
    addNotification('info', t('toast_bid_retracted'), t('toast_bid_retracted_msg', { title }));
  };

  const stats = [
    { key: 'active_jobs', label: t('active_jobs'), value: activeJobsCount.toString(), icon: Briefcase, color: 'bg-blue-600' },
    { key: 'expired_jobs', label: t('expired_jobs'), value: expiredJobsCount.toString(), icon: Clock, color: 'bg-red-500' },
    { key: 'applications_count', label: t('applications_count'), value: '0', icon: Users, color: 'bg-indigo-600' },
    { key: 'shortlisted_workers', label: t('shortlisted_workers'), value: shortlistCount.toString(), icon: Star, color: 'bg-green-600' },
    { key: 'company_trust_score', label: t('company_trust_score'), value: profile?.trustScore ? `${profile.trustScore}%` : '0%', icon: ShieldCheck, color: 'bg-yellow-500' },
  ];

  const statusText = (s: string) => ({ active: t('status_active'), closed: t('status_closed'), pending: t('status_pending'), accepted: t('status_accepted'), rejected: t('status_rejected'), shortlisted: t('status_shortlisted') }[s] || s);

  const subCatLabel = (v: string) => ({ all: t('filter_all'), Construction: t('category_construction'), Cleaning: t('category_cleaning'), Plumbing: t('category_plumbing'), Logistics: t('category_logistics') }[v] || v);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 font-sans tracking-tight flex items-center gap-2 uppercase">
              {profile?.displayName || t('company_dashboard')}
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${
                profile?.tier === 'Verified Company' ? 'bg-blue-50 text-blue-600 border-blue-105' : 'bg-gray-100 text-gray-500 border-gray-200'
              }`}>
                {profile?.tier || t('free_company')}
              </span>
              {profile?.verificationStatus === 'verified' && (
                <span className="inline-flex items-center gap-1 bg-green-50 text-green-600 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border border-green-100">
                  <ShieldCheck size={12} />
                  {t('verified_business')}
                </span>
              )}
            </h1>
            <p className="text-gray-500 font-sans font-medium mt-1 italic leading-tight">
              {t('trust_score')}: <span className="text-blue-600 font-black">{profile?.trustScore || 0}%</span> • {t('status')}: <span className="text-gray-900 font-black">{profile?.verificationStatus === 'unverified' ? t('status_unverified') : t('status_verified')}</span>
            </p>
          </div>
          <Link to="/dashboard/company/post" id="dashboard-to-post-btn" className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-sans font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
            <PlusSquare size={20} />
            {t('post_job')}
          </Link>
        </header>

        {/* View Switcher Tabs */}
        <div className="flex border-b border-gray-100 mb-8 overflow-x-auto gap-4 scrollbar-none font-sans scroll-smooth">
          <button
            type="button"
            onClick={() => setDashboardTab('hiring')}
            className={`py-4 px-6 font-sans font-black text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              dashboardTab === 'hiring' 
                ? 'border-blue-600 text-blue-600 font-extrabold pb-3' 
                : 'border-transparent text-gray-400 hover:text-gray-900 pb-3'
            }`}
          >
            <Briefcase size={16} />
            {t('hiring_hub')}
          </button>
          <button
            type="button"
            onClick={() => setDashboardTab('subcontracting')}
            className={`py-4 px-6 font-sans font-black text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              dashboardTab === 'subcontracting' 
                ? 'border-blue-600 text-blue-600 font-extrabold pb-3' 
                : 'border-transparent text-gray-400 hover:text-gray-900 pb-3'
            }`}
          >
            <Sparkles size={16} />
            {t('subcontracting_leadboard')}
          </button>
        </div>

        {dashboardTab === 'hiring' ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
              {stats.map((stat, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => {
                    if (stat.key === 'expired_jobs') {
                      setShowExpiredJobsModal(true);
                    } else if (stat.key === 'shortlisted_workers') {
                      setShowShortlistModal(true);
                    } else if (stat.key === 'recommended_candidates') {
                      addNotification('info', t('toast_recommending_match_makers'), t('toast_recommending_match_makers_msg'));
                    }
                  }}
                  className={`p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4 bg-white transition-all ${
                    stat.key === 'expired_jobs' || stat.key === 'shortlisted_workers' ? 'hover:border-blue-300 hover:shadow-md cursor-pointer' : ''
                  }`}
                >
                  <div className={`h-12 w-12 ${stat.color} rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0`}>
                    <stat.icon size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">{stat.label}</p>
                    <h3 className="text-xl font-black text-gray-900 leading-none font-sans tracking-tight mt-1">{stat.value}</h3>
                  </div>
                  {(stat.key === 'expired_jobs' || stat.key === 'shortlisted_workers') && (
                    <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-wider">{t('configure')}</span>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-10">
                {/* 🚀 CONTRACT RESOLVER CENTER */}
                <ActiveContractsResolver />

                {/* Expired Jobs Card Action */}
                <section className="bg-gray-50 rounded-[3rem] p-8 border border-dashed border-gray-250">
                  <div className="flex flex-col items-center text-center">
                      <Clock className="text-gray-300 mb-4 animate-pulse" size={40} />
                      <h3 className="font-sans font-black text-gray-900 uppercase tracking-tight">{t('need_to_repost_job')}</h3>
                      <p className="text-gray-550 font-sans text-xs mt-1.5 max-w-xs font-semibold italic">{t('expired_jobs_renew_hint', { count: expiredJobsCount })}</p>
                      <button 
                        type="button"
                        onClick={() => setShowExpiredJobsModal(true)}
                        className="mt-6 px-6 py-3 bg-white border border-gray-200 rounded-xl font-sans font-black text-[10px] uppercase tracking-widest hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm shadow-blue-500/5"
                      >
                        {t('view_expired_jobs')}
                      </button>
                  </div>
                </section>
              </div>

              <div className="space-y-8">
                {/* Compact Shortlist Card */}
                <section className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">{t('shortlisted_workers_count', { count: shortlisted.length })}</h3>
                    {shortlisted.length > 0 ? (
                      <div className="space-y-6">
                        {shortlisted.map((app, i) => (
                          <div key={app.id} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center font-black text-indigo-500 text-xs uppercase shrink-0">
                                {app.avatar}
                              </div>
                              <div>
                                <p className="text-sm font-black text-gray-900 font-sans leading-none">{app.name}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-sans mt-1">{app.role}</p>
                              </div>
                            </div>
                            <button 
                              type="button"
                              onClick={() => handleSendContractOffer(app.name)}
                              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                            >
                              {t('hire')}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-gray-400 text-xs italic font-semibold">
                        {t('no_shortlisted_bookmarked')}
                      </div>
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowShortlistModal(true)}
                    className="w-full mt-8 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 text-gray-900 font-sans font-black text-xs uppercase tracking-wider hover:border-blue-600 hover:bg-white transition-all cursor-pointer"
                  >
                    {t('manage_shortlist')}
                  </button>
                </section>

                <section className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-200">
                  <ShieldCheck size={32} className="mb-4 text-blue-200 animate-bounce" />
                  <h3 className="text-lg font-black font-sans leading-tight mb-2 uppercase tracking-tight">
                      {profile?.tier === 'Verified Company' ? t('business_verified') : t('verify_business')}
                  </h3>
                  <p className="text-blue-100 font-sans text-[10px] font-bold uppercase tracking-widest leading-relaxed mb-6 italic opacity-80">
                      {profile?.tier === 'Verified Company' 
                        ? t('verified_company_full_access') 
                        : t('verified_employers_more_applicants')}
                  </p>
                  <Link 
                    to="/dashboard/company/verify" 
                    className="block w-full py-3 bg-white text-blue-600 rounded-xl text-center font-sans font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all hover:scale-105"
                  >
                    {profile?.tier === 'Verified Company' ? t('check_status') : t('start_verification')}
                  </Link>
                </section>
              </div>
            </div>
          </>
        ) : (
          /* ========================================================
             🤝 NEW CORPORATE SUBCONTRACTING / BID MARKETPLACE PANEL
             ======================================================== */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 font-sans leading-relaxed">
            
            {/* Primary Left Column: Available Opportunities to Bid */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Category Filter & Search row */}
              <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex-1 w-full relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                  <input
                    type="text"
                    value={searchLead}
                    onChange={(e) => setSearchLead(e.target.value)}
                    placeholder={t('search_subcontract_placeholder')}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-600 font-sans text-xs font-bold font-semibold"
                  />
                </div>
                
                <div className="flex flex-wrap gap-2 shrink-0">
                  {['all', 'Construction', 'Cleaning', 'Plumbing', 'Logistics'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2.5 rounded-xl font-sans font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                        selectedCategory === cat 
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-100' 
                          : 'bg-gray-50 text-gray-505 hover:bg-gray-100'
                      }`}
                    >
                      {subCatLabel(cat)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feed List */}
              <div className="space-y-4">
                {subcontractLeads
                  .filter(lead => {
                    const matchCat = selectedCategory === 'all' || lead.category === selectedCategory;
                    const matchSearch = lead.title.toLowerCase().includes(searchLead.toLowerCase()) || 
                                        lead.scope.toLowerCase().includes(searchLead.toLowerCase());
                    return matchCat && matchSearch;
                  })
                  .map((lead) => {
                    const hasActiveBid = companyBids.some(b => b.leadTitle === lead.title);
                    return (
                      <motion.div
                        key={lead.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm hover:border-blue-600/30 transition-all space-y-6"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="text-[8px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-2.5 py-1 rounded">
                                {lead.category}
                              </span>
                              <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                                {t('posted_by', { name: lead.poster })}
                              </span>
                            </div>
                            
                            <h3 className="text-xl font-black text-gray-905 tracking-tight font-sans">
                              {lead.title}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                              {t('lead_project_term', { location: lead.location })}<span className="font-bold text-gray-800">{lead.duration}</span>
                            </p>
                          </div>

                          <div className="text-left sm:text-right">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                              {t('max_allocation_budget')}
                            </span>
                            <span className="text-lg font-black text-blue-600">
                              {lead.budget}
                            </span>
                          </div>
                        </div>

                        <div className="p-5 bg-gray-50 rounded-2xl text-xs font-medium text-gray-550 leading-relaxed font-sans border border-gray-100">
                          <span className="font-black text-gray-900 block mb-1 uppercase tracking-wider text-[9px]">{t('project_scope')}</span>
                          {lead.scope}
                        </div>

                        <div className="flex justify-between items-center gap-4 pt-2 border-t border-gray-50">
                          <div className="text-xs text-gray-400">
                            {t('required_capacity')}<span className="font-black text-gray-800">{lead.teamSizeNeeded}</span>
                          </div>
                          
                          {hasActiveBid ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-green-600 font-black uppercase">
                              {t('sealed_bid_dispatched')}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenBidModal(lead.id)}
                              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-blue-100 active:scale-95 transition-all cursor-pointer"
                            >
                              {t('dispatch_bid_proposal')}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            </div>

            {/* Subcontracting Right Column: Bids Tracking Center */}
            <div className="space-y-6">
              
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-150 shadow-sm space-y-6">
                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                    {t('bids_proposals_tracking')}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-medium italic">
                    {t('bids_tracking_desc')}
                  </p>
                </div>

                <div className="space-y-4">
                  {companyBids.map((bid) => (
                    <div key={bid.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-sans font-black text-xs text-gray-900 line-clamp-1">
                            {bid.leadTitle}
                          </h4>
                          <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                            bid.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {statusText(bid.status)}
                          </span>
                        </div>
                        <p className="text-[9px] text-gray-400 leading-none">{bid.date}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-gray-100 text-center text-xs">
                        <div>
                          <span className="text-[8px] text-gray-400 uppercase font-black tracking-widest block">{t('bid_price')}</span>
                          <span className="font-bold text-blue-600">RWF {(bid.bidPrice / 1000).toLocaleString()}k</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-gray-400 uppercase font-black tracking-widest block">{t('team')}</span>
                          <span className="font-bold text-gray-700">{bid.teamSize} pax</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-gray-400 uppercase font-black tracking-widest block">{t('timeline')}</span>
                          <span className="font-bold text-gray-700">{bid.timeline}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center gap-2 pt-1">
                        <span className="text-[10px] italic text-gray-400">
                          {bid.status === 'accepted' ? t('escrow_funded') : t('waiting_review')}
                        </span>
                        
                        {bid.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleRetractBid(bid.id, bid.leadTitle)}
                            className="text-[9px] font-black uppercase text-red-500 hover:underline"
                          >
                            {t('retract_bid')}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Company Info Box */}
              <div className="p-8 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2.5rem] text-white shadow-xl">
                <Sparkles size={32} className="text-yellow-400 mb-4 animate-spin" />
                <h4 className="text-sm font-black uppercase tracking-tight mb-2">{t('corporate_placement_power')}</h4>
                <p className="text-xs text-indigo-150 leading-relaxed font-sans mb-4">
                  {t('corporate_placement_power_prefix')}<span className="font-bold text-green-400">{t('verified_business_trust_score')}</span>{t('corporate_placement_power_suffix')}
                </p>
                <div className="h-2 bg-indigo-950 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: profile?.trustScore ? `${profile.trustScore}%` : '0%' }} />
                </div>
                <div className="flex justify-between items-center text-[10px] text-indigo-200 mt-2">
                  <span>{t('trust_level')}</span>
                  <span>{profile?.trustScore ? t('trust_rating_percent', { score: profile.trustScore }) : t('no_score_yet')}</span>
                </div>
              </div>

            </div>

          </div>
        )}
      </div>

      {/* EXPIRED JOBS MANAGER MODAL */}
      <AnimatePresence>
        {showExpiredJobsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-950/55 backdrop-blur-sm" 
              onClick={() => setShowExpiredJobsModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-gray-100 z-10"
            >
              <button 
                onClick={() => setShowExpiredJobsModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-50 text-gray-400 hover:text-gray-700 bg-gray-50 flex items-center justify-center border border-gray-100"
              >
                <X size={20} />
              </button>

              <h3 className="text-xl font-black text-gray-900 font-sans uppercase tracking-tight mb-2">{t('expired_opportunities')}</h3>
              <p className="text-xs text-gray-400 font-sans italic mb-6">{t('expired_opportunities_desc')}</p>

              {expiredJobs.length > 0 ? (
                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
                  {expiredJobs.map(job => (
                    <div key={job.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-3 justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="font-sans font-black text-sm text-gray-900">{job.title}</h4>
                          <span className="text-[8px] font-black text-red-655 bg-red-50 border border-red-100 px-2 py-0.5 rounded tracking-wide uppercase">{t('expired_at', { date: job.expiredAt })}</span>
                        </div>
                        <p className="text-[10px] text-gray-550 mt-1 font-sans">{t('job_location_budget', { location: job.location, salary: job.salary })}</p>
                      </div>

                      <button 
                        onClick={() => handleRenewJobOnDashboard(job.id, job.title)}
                        disabled={renewingJobId === job.id}
                        className="py-3 bg-white hover:bg-blue-600 hover:text-white text-gray-800 rounded-xl border border-gray-200 transition-all font-sans font-black uppercase text-[9px] tracking-wider flex items-center justify-center gap-1.5"
                      >
                        {renewingJobId === job.id ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            <span>{t('re_aligning_parameters')}</span>
                          </>
                        ) : (
                          <>
                            <span>{t('renew_posting')}</span>
                            <Plus size={12} />
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-150">
                  <Clock className="mx-auto text-gray-300 mb-2" size={32} />
                  <p className="text-xs font-bold text-gray-450 uppercase tracking-wide">{t('no_expired_opportunity_logs')}</p>
                  <p className="text-[10px] text-gray-405 italic mt-1 font-sans">{t('all_opportunities_active')}</p>
                </div>
              )}

              <button 
                onClick={() => setShowExpiredJobsModal(false)}
                className="w-full mt-6 py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-sans font-black uppercase tracking-widest text-[9px] text-center transition-all"
              >
                {t('close_history')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SHORTLIST INTEGRATED MANAGER MODAL */}
      <AnimatePresence>
        {showShortlistModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-950/50 backdrop-blur-sm" 
              onClick={() => setShowShortlistModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-gray-100 z-10"
            >
              <button 
                onClick={() => setShowShortlistModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-50 text-gray-400 hover:text-gray-750 bg-gray-50 flex items-center justify-center border border-gray-100"
              >
                <X size={20} />
              </button>

              <h3 className="text-xl font-black text-gray-905 font-sans uppercase tracking-tight mb-2">{t('manage_shortlist_title')}</h3>
              <p className="text-xs text-gray-400 font-sans italic mb-6">{t('manage_shortlist_desc')}</p>

              {shortlisted.length > 0 ? (
                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                  {shortlisted.map(candidate => (
                    <div key={candidate.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-500 text-sm font-black uppercase">
                          {candidate.avatar}
                        </div>
                        <div>
                          <h4 className="font-sans font-black text-sm text-gray-900 leading-none">{candidate.name}</h4>
                          <p className="text-[10px] text-gray-500 font-sans font-semibold mt-1 uppercase tracking-wider">{candidate.role}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => handleSendContractOffer(candidate.name)}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors"
                        >
                          {t('hire')}
                        </button>
                        <button 
                          onClick={() => handleRemoveFromShortlist(candidate.id, candidate.name)}
                          className="p-2 bg-white hover:bg-red-50 text-gray-400 hover:text-red-650 rounded-lg border border-gray-200 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-150">
                  <Star className="mx-auto text-gray-300 mb-2" size={32} />
                  <p className="text-xs font-bold text-gray-450 uppercase tracking-wide">{t('shortlist_empty')}</p>
                  <p className="text-[10px] text-gray-400 mt-1 font-sans italic">{t('shortlist_empty_desc')}</p>
                </div>
              )}

              <button 
                onClick={() => setShowShortlistModal(false)}
                className="w-full mt-6 py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-sans font-black uppercase tracking-widest text-[9px] text-center transition-all"
              >
                {t('close_list')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TOAST SYSTEM ON THE DASHBOARD TOO */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none pr-1">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="pointer-events-auto w-full bg-white rounded-3xl border border-gray-105 p-5 shadow-2xl flex items-start gap-4 relative overflow-hidden"
            >
              <div className={`absolute top-0 bottom-0 left-0 w-2 shrink-0 ${
                n.type === 'success' ? 'bg-green-500' :
                n.type === 'invite' ? 'bg-teal-500' :
                n.type === 'error' ? 'bg-red-500' : 'bg-blue-600'
              }`} />
              
              <div className="flex-1 pl-1">
                <p className="font-sans font-black uppercase tracking-[0.1em] text-[10px] text-gray-405 mb-0.5">{n.title}</p>
                <p className="font-sans text-[11px] font-bold text-gray-850 leading-normal">{n.message}</p>
              </div>
              <button 
                onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))}
                className="text-gray-300 hover:text-gray-500 transition-colors p-1 shrink-0 cursor-pointer"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 💳 CORPORATE INVOICE PAY DRAWER */}
      <AnimatePresence>
        {showPayModal && (
          <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
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
                  {t('corporate_placement_momo_desc_prefix')}<span className="font-bold">RWF {unpaidCommission}</span>{t('corporate_placement_momo_desc_suffix')}
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
                  {isProcessingPay ? t('processing_payout') : t('settle_invoice', { amount: unpaidCommission })}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GLOBAL SUBCONTRACT BID DISPATCHER MODAL */}
      <AnimatePresence>
        {showBidModal && chosenLeadId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-950/50 backdrop-blur-sm" 
              onClick={() => setShowBidModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xl bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-gray-100 z-10 font-sans"
            >
              <button 
                type="button"
                onClick={() => setShowBidModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-50 text-gray-400 hover:text-gray-700 bg-gray-50 flex items-center justify-center border border-gray-100 cursor-pointer"
              >
                <X size={20} />
              </button>

              <form onSubmit={handleSubmitBid} className="space-y-6">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded">
                    {t('corporate_proposal_bid')}
                  </span>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight mt-2 leading-tight">
                    {subcontractLeads.find(l => l.id === chosenLeadId)?.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {t('bidding_on_behalf_of')}<span className="font-bold text-gray-750">{profile?.displayName || t('your_enterprise')}</span>
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Proposed Pricing */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-2">
                      {t('proposed_price_offer')}
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-black">RWF</span>
                      <input
                        type="number"
                        required
                        value={proposedPrice}
                        onChange={(e) => setProposedPrice(Number(e.target.value))}
                        className="w-full pl-14 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl font-mono text-sm font-bold focus:bg-white focus:border-blue-600 outline-none"
                      />
                    </div>
                  </div>

                  {/* Twin Columns: Staff count and Timeline */}
                  <div className="grid grid-cols-2 gap-4 font-sans">
                    <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-2">
                        {t('deployed_workforce')}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        required
                        value={proposedStaff}
                        onChange={(e) => setProposedStaff(Number(e.target.value))}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold font-sans text-xs focus:bg-white focus:border-blue-600 outline-none"
                      />
                      <span className="text-[9px] text-gray-400 font-medium mt-1 block">{t('pax_members')}</span>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-2">
                        {t('execution_timeline')}
                      </label>
                      <input
                        type="text"
                        required
                        value={proposedTimeline}
                        onChange={(e) => setProposedTimeline(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold font-sans text-xs focus:bg-white focus:border-blue-600 outline-none"
                      />
                      <span className="text-[9px] text-gray-400 font-medium mt-1 block">{t('placeholder_timeline')}</span>
                    </div>
                  </div>

                  {/* Cover Letter */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                      {t('corporate_pitch')}
                    </label>
                    <textarea
                      required
                      value={proposedCoverLetter}
                      onChange={(e) => setProposedCoverLetter(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-sans text-xs font-semibold focus:bg-white focus:border-blue-600 outline-none resize-none leading-relaxed"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBidModal(false)}
                    className="flex-1 py-4 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-wider text-[10px] transition-all cursor-pointer text-center"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-wider text-[10px] transition-all cursor-pointer shadow-lg shadow-blue-100"
                  >
                    {t('transmit_sealed_proposal')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </DashboardLayout>
  );
}
