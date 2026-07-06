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
import ActiveContractsResolver from '../../components/ActiveContractsResolver';

interface NotificationMsg {
  id: string;
  type: 'success' | 'info' | 'error' | 'invite';
  title: string;
  message: string;
}

export default function CompanyDashboard() {
  const { profile } = useAuth();
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
  const [subcontractLeads, setSubcontractLeads] = useState([
    { id: 1001, title: 'Kigali Airport Passenger Terminal Assembly', poster: 'Chongqing Civil Eng Ltd', location: 'Kanombe, Kigali', budget: 'RWF 14,500,000', teamSizeNeeded: '15-20 workers', duration: '3 Months', scope: 'Requires professional masonry and structural steel teams to assist with airport terminal assembly. Certified supervisor mandatory.', category: 'Construction' },
    { id: 1002, title: 'Remera Corporate Park Janitorial Subcontract', poster: 'Milestone Holdings', location: 'Remera, Kigali', budget: 'RWF 3,800,000', teamSizeNeeded: '8-10 cleaners', duration: '6 Months', scope: 'Complete facility sanitation, floor stripping & waxing, and glass washing. Must supply eco-safe detergents.', category: 'Cleaning' },
    { id: 1003, title: 'Commercial Plaza Copper Piping Fit-out', poster: 'Legacy Real Estates RW', location: 'Nyarugenge, Kigali', budget: 'RWF 5,200,500', teamSizeNeeded: '5 plumbers', duration: '4 Weeks', scope: 'Retrofitting multi-unit residential piping, installing smart flow meters, and completing copper tube joints.', category: 'Plumbing' },
    { id: 1004, title: 'High-Density Logistics Pallet Sorting', poster: 'SafeTransit Logistics', location: 'Magerwa Trade Complex', budget: 'RWF 2,400,000', teamSizeNeeded: '4 logistical handlers', duration: '2 Weeks', scope: 'Provide a structured workforce team to manage inventory sorting during peak customs clearance month.', category: 'Logistics' },
  ]);

  // Saved corporate bids
  const [companyBids, setCompanyBids] = useState<any[]>(() => {
    const cached = localStorage.getItem('company_bids');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [
      { id: 2001, leadTitle: 'Kigali Airport Passenger Terminal Assembly', bidPrice: 13800000, teamSize: 15, timeline: '2.5 Months', status: 'pending', date: 'Submitted 1 day ago', details: 'Profound expertise in structural masonry and steel welding layouts.' },
      { id: 2002, leadTitle: 'Remera Corporate Park Janitorial Subcontract', bidPrice: 3800000, teamSize: 8, timeline: '6 Months', status: 'accepted', date: 'Accepted 6 hours ago', details: 'Using top-tier industrial HEPA filters and professional green chemicals.' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('company_bids', JSON.stringify(companyBids));
  }, [companyBids]);

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
      addNotification('success', 'Corporate Invoice Cleared ✅', 'Your RWF 5,000 corporate commission of Job Placement has been verified.');
    }, 1200);
  };

  // Dynamic state for Stats
  const [activeJobsCount, setActiveJobsCount] = useState(() => {
    const saved = localStorage.getItem('company_active_jobs_count');
    return saved ? parseInt(saved, 10) : 4;
  });

  const [expiredJobsCount, setExpiredJobsCount] = useState(() => {
    const saved = localStorage.getItem('company_expired_jobs_count');
    return saved ? parseInt(saved, 10) : 2;
  });

  const [shortlistCount, setShortlistCount] = useState(() => {
    const saved = localStorage.getItem('company_shortlist_count');
    return saved ? parseInt(saved, 10) : 12;
  });

  // Shortlisted workers database
  const [shortlisted, setShortlisted] = useState([
    { id: 301, name: 'John Musoke', role: 'Security Guard', avatar: 'J', verified: true },
    { id: 302, name: 'Sarah Namono', role: 'Office Cleaner', avatar: 'S', verified: true },
    { id: 303, name: 'Grace Akello', role: 'Nanny / Caretaker', avatar: 'G', verified: true }
  ]);

  // Expired Jobs database
  const [expiredJobs, setExpiredJobs] = useState([
    { id: 401, title: 'Temporary Warehouse Assistant', location: 'Remera, Kigali', expiredAt: '5 days ago', salary: 'RWF 18,000/day' },
    { id: 402, title: 'Retail Stock Manager', location: 'Nyamirambo', expiredAt: '12 days ago', salary: 'RWF 250,000/mo' }
  ]);

  // Recommended candidates pool
  const recommendedCandidates = [
    { name: 'Moses Byaruhanga', skill: 'Senior Mason', match: '98%', location: 'Kigali', verified: true },
    { name: 'Aline Umutoni', skill: 'Logistics Manager', match: '95%', location: 'Remera', verified: true },
    { name: 'Jean Bosco', skill: 'Plumbing Expert', match: '92%', location: 'Nyamirambo', verified: true },
  ];

  // Modals state
  const [showExpiredJobsModal, setShowExpiredJobsModal] = useState(false);
  const [showShortlistModal, setShowShortlistModal] = useState(false);
  const [renewingJobId, setRenewingJobId] = useState<number | null>(null);

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
      addNotification('success', 'Job Posting Renewed 🔄', `"${title}" is reinstated on the active index feed for another 30 days.`);
    }, 1200);
  };

  // Shortlist Candidate From Recommended Section
  const handleShortlistRecommended = (name: string, skill: string) => {
    const isAlready = shortlisted.some(s => s.name === name);
    if (isAlready) {
      addNotification('info', 'Already Shortlisted 📂', `${name} is already saved in your shortlist pool.`);
      return;
    }
    const newId = Date.now();
    setShortlisted(prev => [...prev, { id: newId, name, role: skill, avatar: name[0], verified: true }]);
    setShortlistCount(prev => prev + 1);
    addNotification('success', 'Candidate Bookmarked ⭐', `${name} added to your active shortlist.`);
  };

  // Invite Candidate
  const handleInviteCandidate = (name: string) => {
    addNotification('invite', 'Direct Interview Pushed ✉️', `Verified notification blast successfully sent to ${name}. Waiting for confirm.`);
  };

  // Remove Candidate from Shortlist
  const handleRemoveFromShortlist = (id: number, name: string) => {
    setShortlisted(prev => prev.filter(s => s.id !== id));
    setShortlistCount(prev => Math.max(0, prev - 1));
    addNotification('info', 'Shortlist Updated', `Cleared ${name} from your dashboard shortlist indices.`);
  };

  // Send Job Offer (Hire)
  const handleSendContractOffer = (name: string) => {
    addNotification('success', 'Escrow Contract Pending 📝', `Proposed hiring smart-agreement dispatched to ${name}'s verified mobile app.`);
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
      setProposedCoverLetter(`Greetings, our company has analyzed your requirements for "${lead.title}". We have a robust, fully vetted mobile workforce ready to execute this immediately.`);
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
      date: 'Submitted just now',
      details: proposedCoverLetter
    };

    setCompanyBids(prev => [newBidObj, ...prev]);
    setShowBidModal(false);
    addNotification('success', 'Proposal Placed 📨', `Your subcontracting bid for "${lead.title}" has been successfully broadcast to the poster!`);
  };

  const handleRetractBid = (id: number, title: string) => {
    setCompanyBids(prev => prev.filter(b => b.id !== id));
    addNotification('info', 'Bid Retracted 🔄', `Your commercial bid for "${title}" has been successfully retracted.`);
  };

  const stats = [
    { label: 'Active Jobs', value: activeJobsCount.toString(), icon: Briefcase, color: 'bg-blue-600' },
    { label: 'Expired Jobs', value: expiredJobsCount.toString(), icon: Clock, color: 'bg-red-500' },
    { label: 'Applications Count', value: '128', icon: Users, color: 'bg-indigo-600' },
    { label: 'Shortlisted Workers', value: shortlistCount.toString(), icon: Star, color: 'bg-green-600' },
    { label: 'Recommended Candidates', value: '3', icon: User, color: 'bg-purple-600' },
    { label: 'Company Trust Score', value: profile?.trustScore || '96%', icon: ShieldCheck, color: 'bg-yellow-500' },
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
                Your company profile has an unpaid LINEKORA placement fee of <span className="font-extrabold underline">RWF {unpaidCommission}</span> due on active completed contracts. While shifts remain active, you are blocked from posting new jobs until this invoice is cleared.
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
            <h1 className="text-3xl font-black text-gray-900 font-sans tracking-tight flex items-center gap-2 uppercase">
              {profile?.displayName || 'Company Dashboard'}
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${
                profile?.tier === 'Verified Company' ? 'bg-blue-50 text-blue-600 border-blue-105' : 'bg-gray-100 text-gray-500 border-gray-200'
              }`}>
                {profile?.tier || 'Free Company'}
              </span>
              {profile?.verificationStatus === 'verified' && (
                <span className="inline-flex items-center gap-1 bg-green-50 text-green-600 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border border-green-100">
                  <ShieldCheck size={12} />
                  Verified Business
                </span>
              )}
            </h1>
            <p className="text-gray-500 font-sans font-medium mt-1 italic leading-tight">
              Trust Score: <span className="text-blue-600 font-black">{profile?.trustScore || '96'}%</span> • Status: <span className="text-gray-900 font-black">{profile?.verificationStatus === 'unverified' ? 'UNVERIFIED' : 'VERIFIED'}</span>
            </p>
          </div>
          <Link to="/dashboard/company/post" id="dashboard-to-post-btn" className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-sans font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
            <PlusSquare size={20} />
            Post Job
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
            Hiring Hub (Post & Find Workers)
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
            Subcontracting Leadboard (Commercial Bids)
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
                    if (stat.label === 'Expired Jobs') {
                      setShowExpiredJobsModal(true);
                    } else if (stat.label === 'Shortlisted Workers') {
                      setShowShortlistModal(true);
                    } else if (stat.label === 'Recommended Candidates') {
                      addNotification('info', 'Recommending match-makers', 'Scroll down to the Recommended section to manage matches.');
                    }
                  }}
                  className={`p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4 bg-white transition-all ${
                    stat.label === 'Expired Jobs' || stat.label === 'Shortlisted Workers' ? 'hover:border-blue-300 hover:shadow-md cursor-pointer' : ''
                  }`}
                >
                  <div className={`h-12 w-12 ${stat.color} rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0`}>
                    <stat.icon size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">{stat.label}</p>
                    <h3 className="text-xl font-black text-gray-900 leading-none font-sans tracking-tight mt-1">{stat.value}</h3>
                  </div>
                  {(stat.label === 'Expired Jobs' || stat.label === 'Shortlisted Workers') && (
                    <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-wider">Configure</span>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-10">
                {/* 🚀 CONTRACT RESOLVER CENTER */}
                <ActiveContractsResolver />

                {/* Recommended Candidates Section */}
                <section>
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-black text-gray-900 font-sans tracking-tight uppercase flex items-center gap-2 italic">
                      <Star className="text-yellow-500" size={20} />
                      Recommended Candidates
                    </h2>
                    <Link to="/dashboard/company/browse" className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline">View All Workers</Link>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {recommendedCandidates.map((candidate, i) => (
                      <div key={i} className="group bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:border-blue-600 hover:shadow-xl hover:shadow-blue-500/5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-5">
                          <div className="h-14 w-14 bg-gray-50 rounded-2xl flex items-center justify-center border-2 border-transparent group-hover:border-blue-100 group-hover:bg-blue-50 transition-all">
                            <span className="text-lg font-black text-gray-400 group-hover:text-blue-600 uppercase">{candidate.name[0]}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-sans font-black text-gray-900 text-lg">{candidate.name}</h4>
                              {candidate.verified && <CheckCircle2 size={16} className="text-blue-600" />}
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{candidate.skill} • {candidate.location}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3.5 self-end sm:self-center">
                          <div className="text-right mr-2 hidden sm:block">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Match Score</p>
                            <span className="text-sm font-black text-green-600 bg-green-50 px-3 py-1 rounded-full">{candidate.match}</span>
                          </div>
                          
                          <button 
                            type="button"
                            onClick={() => handleInviteCandidate(candidate.name)}
                            className="py-2.5 px-4 bg-gray-900 hover:bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                          >
                            Invite
                          </button>

                          <button 
                            type="button"
                            onClick={() => handleShortlistRecommended(candidate.name, candidate.skill)}
                            className="p-2.5 bg-white text-gray-400 hover:text-blue-600 rounded-xl hover:bg-blue-50 border border-gray-100 transition-all shadow-sm"
                          >
                            <Bookmark size={16} className="fill-current" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Expired Jobs Card Action */}
                <section className="bg-gray-50 rounded-[3rem] p-8 border border-dashed border-gray-250">
                  <div className="flex flex-col items-center text-center">
                      <Clock className="text-gray-300 mb-4 animate-pulse" size={40} />
                      <h3 className="font-sans font-black text-gray-900 uppercase tracking-tight">Need to repost a job?</h3>
                      <p className="text-gray-550 font-sans text-xs mt-1.5 max-w-xs font-semibold italic">You currently have {expiredJobsCount} expired jobs that can be renewed onto live index lines.</p>
                      <button 
                        type="button"
                        onClick={() => setShowExpiredJobsModal(true)}
                        className="mt-6 px-6 py-3 bg-white border border-gray-200 rounded-xl font-sans font-black text-[10px] uppercase tracking-widest hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm shadow-blue-500/5"
                      >
                        View Expired Jobs
                      </button>
                  </div>
                </section>
              </div>

              <div className="space-y-8">
                {/* Compact Shortlist Card */}
                <section className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Shortlisted Workers ({shortlisted.length})</h3>
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
                              Hire
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-gray-400 text-xs italic font-semibold">
                        No shortlisted bookmarked.
                      </div>
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowShortlistModal(true)}
                    className="w-full mt-8 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 text-gray-900 font-sans font-black text-xs uppercase tracking-wider hover:border-blue-600 hover:bg-white transition-all cursor-pointer"
                  >
                    Manage shortlist
                  </button>
                </section>

                <section className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-200">
                  <ShieldCheck size={32} className="mb-4 text-blue-200 animate-bounce" />
                  <h3 className="text-lg font-black font-sans leading-tight mb-2 uppercase tracking-tight">
                      {profile?.tier === 'Verified Company' ? 'Business Verified' : 'Verify Business'}
                  </h3>
                  <p className="text-blue-100 font-sans text-[10px] font-bold uppercase tracking-widest leading-relaxed mb-6 italic opacity-80">
                      {profile?.tier === 'Verified Company' 
                        ? 'You have full access to all employer features.' 
                        : 'Verified employers get 3.5x more applicants and a trust badge.'}
                  </p>
                  <Link 
                    to="/dashboard/company/verify" 
                    className="block w-full py-3 bg-white text-blue-600 rounded-xl text-center font-sans font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all hover:scale-105"
                  >
                    {profile?.tier === 'Verified Company' ? 'Check Status' : 'Start Verification'}
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
                    placeholder="Search heavy construction, janitor contracts..."
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
                      {cat}
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
                                By {lead.poster}
                              </span>
                            </div>
                            
                            <h3 className="text-xl font-black text-gray-905 tracking-tight font-sans">
                              {lead.title}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                              📍 {lead.location} • 📅 Project Term: <span className="font-bold text-gray-800">{lead.duration}</span>
                            </p>
                          </div>

                          <div className="text-left sm:text-right">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                              Max Allocation Budget
                            </span>
                            <span className="text-lg font-black text-blue-600">
                              {lead.budget}
                            </span>
                          </div>
                        </div>

                        <div className="p-5 bg-gray-50 rounded-2xl text-xs font-medium text-gray-550 leading-relaxed font-sans border border-gray-100">
                          <span className="font-black text-gray-900 block mb-1 uppercase tracking-wider text-[9px]">Project Scope / Specs:</span>
                          {lead.scope}
                        </div>

                        <div className="flex justify-between items-center gap-4 pt-2 border-t border-gray-50">
                          <div className="text-xs text-gray-400">
                            Required capacity: <span className="font-black text-gray-800">{lead.teamSizeNeeded}</span>
                          </div>
                          
                          {hasActiveBid ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-green-600 font-black uppercase">
                              🛡️ Sealed Bid Dispatched
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenBidModal(lead.id)}
                              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-blue-100 active:scale-95 transition-all cursor-pointer"
                            >
                              Dispatch Bid Proposal
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
                    Bids & Proposals Tracking
                  </h3>
                  <p className="text-[10px] text-gray-400 font-medium italic">
                    Live bidding indicators with real-time feedback.
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
                            {bid.status}
                          </span>
                        </div>
                        <p className="text-[9px] text-gray-400 leading-none">{bid.date}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-gray-100 text-center text-xs">
                        <div>
                          <span className="text-[8px] text-gray-400 uppercase font-black tracking-widest block">Bid Price</span>
                          <span className="font-bold text-blue-600">RWF {(bid.bidPrice / 1000).toLocaleString()}k</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-gray-400 uppercase font-black tracking-widest block">Team</span>
                          <span className="font-bold text-gray-700">{bid.teamSize} pax</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-gray-400 uppercase font-black tracking-widest block">Timeline</span>
                          <span className="font-bold text-gray-700">{bid.timeline}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center gap-2 pt-1">
                        <span className="text-[10px] italic text-gray-400">
                          {bid.status === 'accepted' ? '💵 Escrow Funded!' : 'Waiting review'}
                        </span>
                        
                        {bid.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleRetractBid(bid.id, bid.leadTitle)}
                            className="text-[9px] font-black uppercase text-red-500 hover:underline"
                          >
                            Retract Bid
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
                <h4 className="text-sm font-black uppercase tracking-tight mb-2">Corporate Placement Power</h4>
                <p className="text-xs text-indigo-150 leading-relaxed font-sans mb-4">
                  Did you know? Companies bidding with a <span className="font-bold text-green-400">Verified Business trust score above 95%</span> are 3 times more likely to win competitive corporate plumbing or mason contracts!
                </p>
                <div className="h-2 bg-indigo-950 rounded-full overflow-hidden">
                  <div className="h-full w-[96%] bg-blue-500 rounded-full" />
                </div>
                <div className="flex justify-between items-center text-[10px] text-indigo-200 mt-2">
                  <span>Trust Level</span>
                  <span>96% Optimal Rating</span>
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

              <h3 className="text-xl font-black text-gray-900 font-sans uppercase tracking-tight mb-2">Expired Opportunities</h3>
              <p className="text-xs text-gray-400 font-sans italic mb-6">Renew historical postings instantly to publish matching requests back onto feeds.</p>

              {expiredJobs.length > 0 ? (
                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
                  {expiredJobs.map(job => (
                    <div key={job.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-3 justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="font-sans font-black text-sm text-gray-900">{job.title}</h4>
                          <span className="text-[8px] font-black text-red-655 bg-red-50 border border-red-100 px-2 py-0.5 rounded tracking-wide uppercase">Expired {job.expiredAt}</span>
                        </div>
                        <p className="text-[10px] text-gray-550 mt-1 font-sans">{job.location} • Budget: {job.salary}</p>
                      </div>

                      <button 
                        onClick={() => handleRenewJobOnDashboard(job.id, job.title)}
                        disabled={renewingJobId === job.id}
                        className="py-3 bg-white hover:bg-blue-600 hover:text-white text-gray-800 rounded-xl border border-gray-200 transition-all font-sans font-black uppercase text-[9px] tracking-wider flex items-center justify-center gap-1.5"
                      >
                        {renewingJobId === job.id ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            <span>Re-aligning parameters...</span>
                          </>
                        ) : (
                          <>
                            <span>Renew Posting (30 Days Active)</span>
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
                  <p className="text-xs font-bold text-gray-450 uppercase tracking-wide">No Expired Opportunity Logs</p>
                  <p className="text-[10px] text-gray-405 italic mt-1 font-sans">All outstanding opportunities are currently active.</p>
                </div>
              )}

              <button 
                onClick={() => setShowExpiredJobsModal(false)}
                className="w-full mt-6 py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-sans font-black uppercase tracking-widest text-[9px] text-center transition-all"
              >
                Close History
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

              <h3 className="text-xl font-black text-gray-905 font-sans uppercase tracking-tight mb-2">Manage Shortlist</h3>
              <p className="text-xs text-gray-400 font-sans italic mb-6">Dispatch contracts or delete matching profiles currently saved under reference indexes.</p>

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
                          Hire
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
                  <p className="text-xs font-bold text-gray-450 uppercase tracking-wide">Shortlist is empty</p>
                  <p className="text-[10px] text-gray-400 mt-1 font-sans italic">Save recommended candidates or browse more workers.</p>
                </div>
              )}

              <button 
                onClick={() => setShowShortlistModal(false)}
                className="w-full mt-6 py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-sans font-black uppercase tracking-widest text-[9px] text-center transition-all"
              >
                Close List
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
                    Corporate Proposal Bid
                  </span>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight mt-2 leading-tight">
                    {subcontractLeads.find(l => l.id === chosenLeadId)?.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Bidding on behalf of <span className="font-bold text-gray-750">{profile?.displayName || 'Your Enterprise'}</span>
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Proposed Pricing */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-2">
                      Proposed Price Offer (RWF)
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
                        Deployed workforce
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
                      <span className="text-[9px] text-gray-400 font-medium mt-1 block">pax (members)</span>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-2">
                        Execution Timeline
                      </label>
                      <input
                        type="text"
                        required
                        value={proposedTimeline}
                        onChange={(e) => setProposedTimeline(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold font-sans text-xs focus:bg-white focus:border-blue-600 outline-none"
                      />
                      <span className="text-[9px] text-gray-400 font-medium mt-1 block">e.g. 5 Weeks</span>
                    </div>
                  </div>

                  {/* Cover Letter */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                      Corporate pitch / Capabilities statement
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
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-wider text-[10px] transition-all cursor-pointer shadow-lg shadow-blue-100"
                  >
                    Transmit Sealed Proposal
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
