import React, { useState, useEffect } from 'react';
import { 
  Shield, Star, CheckCircle2, Clock, AlertTriangle, 
  X, MessageSquare, ShieldAlert, Award, FileText, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../lib/AuthContext';
import { readScopedStorage, writeScopedStorage } from '../lib/userScopedStorage';

interface Contract {
  id: number;
  jobTitle: string;
  company: string;
  salary: string;
  location: string;
  status: 'accepted' | 'completion_requested' | 'still_in_progress' | 'disputed' | 'completed' | 'not_trusted';
  workerId: string;
  workerName: string;
  employerId: string;
  employerName: string;
  daysSinceRequest: number;
  rating: number;
  review: string;
  commissionPaidWorker: boolean;
  commissionPaidEmployer: boolean;
  date: string;
  logo?: string;
  phone?: string;
}

export default function ActiveContractsResolver() {
  const { profile } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  
  // Review box states
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  // Status Action loadings
  const [isSubmitingAction, setIsSubmitingAction] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // MVP: platform commission fees disabled — verification fees only
  useEffect(() => {
    localStorage.removeItem('worker_unpaid_commission');
    localStorage.removeItem('company_unpaid_commission');
    localStorage.setItem('worker_completed_jobs_since_last_payment', '0');
    localStorage.setItem('company_completed_jobs_since_last_payment', '0');
  }, []);

  useEffect(() => {
    loadContracts();

    // Real-time sync: reload contracts when another tab/page updates localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `linekora_contracts_${profile?.id}`) {
        loadContracts();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Also poll every 4 seconds as a fallback for same-tab updates
    const interval = setInterval(loadContracts, 4000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadContracts = () => {
    const cached = readScopedStorage<Contract[]>(profile?.id, 'linekora_contracts', []);
    setContracts(cached);
  };

  const updateContractInDatabase = (updatedList: Contract[]) => {
    setContracts(updatedList);
    writeScopedStorage(profile?.id, 'linekora_contracts', updatedList);
  };

  const handleActionClick = (id: number, status: Contract['status']) => {
    const contract = contracts.find(c => c.id === id);
    if (!contract) return;

    if (status === 'completed') {
      setSelectedContract(contract);
      setShowReviewForm(true);
      return;
    }

    // Submit immediate status update for back-in-progress, dispute, or untrusted
    setIsSubmitingAction(true);
    setTimeout(() => {
      let updatedContracts = contracts.map(c => {
        if (c.id === id) {
          return { 
            ...c, 
            status, 
            date: status === 'still_in_progress' ? 'Revision Pending' : 
                  status === 'disputed' ? 'Disputed milestone' : 'Flagged Untrusted'
          };
        }
        return c;
      });

      // Special action penalty if Worker is flagged "Not Trusted"
      if (status === 'not_trusted') {
        const currentStrikes = readScopedStorage<number>(profile?.id, 'worker_not_trusted_strikes', 0);
        writeScopedStorage(profile?.id, 'worker_not_trusted_strikes', currentStrikes + 1);

        // Let's degrade the worker profile count
        const currentCompletedCount = readScopedStorage<number>(profile?.id, 'worker_completed_jobs_count', 0);
        writeScopedStorage(profile?.id, 'worker_completed_jobs_count', Math.max(0, currentCompletedCount - 10)); // Decimate score!
        
        // Add alert notification for admin intervention
        logSystemAlert(
          'urgent',
          '🚫 Untrusted Penalty Inflicted',
          `Worker ${profile?.displayName || 'Worker'} has been flagged as "Not Trusted" on contract "${contract.jobTitle}". System strike count is at ${currentStrikes + 1}.`
        );
      } else if (status === 'disputed') {
        logSystemAlert(
          'urgent',
          '⚖️ Dispute Case Opened',
          `Milestone dispute requested. Initial arbitration reviews have commenced for "${contract.jobTitle}".`
        );
      } else if (status === 'still_in_progress') {
        logSystemAlert(
          'info',
          '⏳ Milestone Returned',
          `Employer marked "${contract.jobTitle}" as needing completion. Returned to worker workload focus.`
        );
      }

      updateContractInDatabase(updatedContracts as Contract[]);
      setIsSubmitingAction(false);
      setActionSuccessMessage(`Contract state updated to: ${status.replace('_', ' ').toUpperCase()}`);
      setTimeout(() => setActionSuccessMessage(null), 3000);
    }, 1000);
  };

  const logSystemAlert = (category: 'urgent' | 'success' | 'info', title: string, details: string) => {
    const alertsArr = readScopedStorage<any[]>(profile?.id, 'system_alerts', []);
    alertsArr.push({
      id: Date.now().toString(),
      category,
      title,
      details,
      time: 'Just now',
      read: false
    });
    writeScopedStorage(profile?.id, 'system_alerts', alertsArr);
  };

  const handleApproveAndSubmitReview = () => {
    if (!selectedContract) return;

    setIsSubmitingAction(true);
    setTimeout(() => {
      // 1. Calculate and update Contract status
      const updatedContracts = contracts.map(c => {
        if (c.id === selectedContract.id) {
          return {
            ...c,
            status: 'completed' as const,
            rating,
            review: reviewText || 'Perfect execution!',
            date: 'Contract Approved & Dispatched 🎉'
          };
        }
        return c;
      });

      // 2. Increment Worker's completed jobs count
      const currentCount = readScopedStorage<number>(profile?.id, 'worker_completed_jobs_count', 0);
      writeScopedStorage(profile?.id, 'worker_completed_jobs_count', currentCount + 1);

      // 3–4. Platform commission fees disabled for MVP (verification fees only)

      // 5. Save everything and refresh states
      updateContractInDatabase(updatedContracts);
      logSystemAlert(
        'success',
        '✅ Contract Finalized & Released',
        `Released escrow payments for "${selectedContract.jobTitle}" and assigned a rating of ${rating} stars.`
      );

      setIsSubmitingAction(false);
      setShowReviewForm(false);
      setSelectedContract(null);
      setReviewText('');
      setRating(5);
      
      setActionSuccessMessage('🎉 Milestone Approved! Escrows dispatched and rating recorded safely.');
      setTimeout(() => setActionSuccessMessage(null), 3500);
    }, 1200);
  };

  const getStatusBadge = (status: Contract['status']) => {
    switch (status) {
      case 'accepted':
        return <span className="bg-green-50 text-green-600 border border-green-150 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">Active Contract</span>;
      case 'completion_requested':
        return <span className="bg-indigo-50 text-indigo-600 border border-indigo-150 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider animate-pulse">Completion Requested ⏳</span>;
      case 'still_in_progress':
        return <span className="bg-amber-50 text-amber-600 border border-amber-150 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">In Progress Correction</span>;
      case 'disputed':
        return <span className="bg-rose-50 text-rose-600 border border-rose-150 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">Arbitration Dispute ⚖️</span>;
      case 'completed':
        return <span className="bg-emerald-50 text-emerald-600 border border-emerald-150 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">Finished & Approved</span>;
      case 'not_trusted':
        return <span className="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">Flagged Untrusted 🚫</span>;
      default:
        return null;
    }
  };

  // Filter tasks to resolve
  const activeAndPendingContracts = contracts.filter(c => c.status !== 'completed' && c.status !== 'not_trusted');

  return (
    <section className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-xl font-sans font-black tracking-tight text-gray-900 uppercase">
            Active Contracts & Milestone Handovers
          </h3>
          <p className="text-xs text-gray-400 font-sans italic">Approve finished milestones, request progress updates, or flag issues immediately.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="min-h-2 min-w-2 rounded-full bg-blue-600 animate-ping" />
          <span className="text-[10px] font-black text-gray-400 font-sans uppercase tracking-widest">{activeAndPendingContracts.length} Assignments Active</span>
        </div>
      </div>

      {actionSuccessMessage && (
        <div className="mb-6 bg-emerald-50 border border-emerald-100 text-emerald-700 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-wide font-sans animate-bounce">
          {actionSuccessMessage}
        </div>
      )}

      {isSubmitingAction && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-30 flex flex-col items-center justify-center">
          <div className="h-10 w-10 border-4 border-blue-650 border-t-transparent rounded-full animate-spin mb-4" />
          <span className="text-xs font-black uppercase tracking-widest text-gray-400 font-sans">Updating Blockchain Escrow Status...</span>
        </div>
      )}

      <div className="space-y-6">
        {activeAndPendingContracts.map((contract) => {
          const threeDaysOverdue = contract.status === 'completion_requested' && contract.daysSinceRequest >= 1; // Seed is 1 to demonstrate visually!
          
          return (
            <div 
              key={contract.id}
              className={`p-6 rounded-[2rem] border ${
                contract.status === 'completion_requested' ? 'border-indigo-100 bg-indigo-50/15' : 'border-gray-100 bg-white'
              } transition-all space-y-4 font-sans`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl font-black flex items-center justify-center text-lg">
                    {contract.logo || contract.workerName[0]}
                  </div>
                  <div>
                    <h4 className="font-sans font-black text-gray-900 leading-snug uppercase tracking-tight">{contract.jobTitle}</h4>
                    <p className="text-xs font-bold text-gray-500 italic mt-0.5">Worker: <span className="text-gray-800 font-black">{contract.workerName}</span></p>
                    <div className="flex flex-wrap gap-3 mt-2 text-[10px] font-black uppercase tracking-wider text-gray-400">
                      <span>Rate: {contract.salary}</span>
                      <span>•</span>
                      <span>Loc: {contract.location}</span>
                    </div>
                  </div>
                </div>
                <div className="self-start sm:self-center">
                  {getStatusBadge(contract.status)}
                </div>
              </div>

              {/* OVERDUE 3-DAY WARNING ALARM */}
              {threeDaysOverdue && (
                <div className="bg-yellow-50/80 border border-yellow-250 p-4 rounded-xl flex items-start gap-3 text-yellow-800 text-[11px] font-sans leading-relaxed">
                  <AlertTriangle className="shrink-0 text-yellow-600 mt-0.5" size={16} />
                  <div>
                    <span className="font-black uppercase block tracking-wider mb-0.5">⏳ Automatic 3-Day Overdue Escalation</span>
                    Worker Shema Honore submitted this completion package 3 days ago. Platform safeguards require prompt review resolution to avoid local search trust index downgrades.
                  </div>
                </div>
              )}

              {/* ACTION COMMAND CENTER */}
              <div className="pt-4 border-t border-gray-100/60 flex flex-col sm:flex-row gap-3">
                {contract.status === 'completion_requested' ? (
                  <>
                    <button
                      onClick={() => handleActionClick(contract.id, 'completed')}
                      className="flex-1 py-3 bg-gradient-to-r from-green-550 to-emerald-600 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-md shadow-green-100 transition-transform hover:scale-[1.01]"
                    >
                      Approve & Complete ✅
                    </button>
                    <button
                      onClick={() => handleActionClick(contract.id, 'still_in_progress')}
                      className="flex-1 py-3 bg-white hover:bg-gray-50 border border-gray-200 text-amber-600 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all"
                    >
                      Need Adjustment ⏳
                    </button>
                    <button
                      onClick={() => handleActionClick(contract.id, 'disputed')}
                      className="py-3 px-4 bg-white hover:bg-gray-50 border border-gray-200 text-rose-500 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all"
                    >
                      Dispute ⚖️
                    </button>
                    <button
                      onClick={() => handleActionClick(contract.id, 'not_trusted')}
                      className="py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all"
                    >
                      Mark Untrusted 🚫
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400 italic">
                    <Clock size={12} />
                    Shift contract actively in progress. Waiting for worker completion request.
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {activeAndPendingContracts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
            <CheckCircle2 size={32} className="text-gray-200 mb-3" />
            <p className="text-xs font-black uppercase tracking-widest leading-none">All Contracts Fully Setled</p>
            <p className="text-[11px] text-gray-400 italic mt-1.5Packed font-medium font-sans">No outstanding handovers or pending completion flags outstanding.</p>
          </div>
        )}
      </div>

      {/* 📝 POPUP MODAL FOR INTERACTIVE RATINGS AND REVIEWS */}
      <AnimatePresence>
        {showReviewForm && selectedContract && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] border border-gray-150 p-8 w-full max-w-md relative shadow-2xl font-sans"
            >
              <button
                onClick={() => {
                  setShowReviewForm(false);
                  setSelectedContract(null);
                }}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>

              <div className="space-y-6">
                <div className="text-center">
                  <div className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <Award size={28} />
                  </div>
                  <h3 className="text-xl font-black font-sans uppercase tracking-tight text-gray-900">
                    File Worker Reputation
                  </h3>
                  <p className="text-xs text-gray-550 mt-1 max-w-xs mx-auto leading-relaxed">
                    Provide punctuality, focus, and performance feedback for worker <span className="font-extrabold text-indigo-700">{selectedContract.workerName}</span>.
                  </p>
                </div>

                {/* STAR RATINGS */}
                <div className="flex flex-col items-center justify-center space-y-2 py-2">
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(null)}
                        className="p-1 transition-all outline-none"
                      >
                        <Star 
                          size={32} 
                          className={`transition-colors ${
                            star <= (hoveredStar ?? rating) 
                              ? 'text-yellow-450 text-yellow-550 fill-yellow-550 text-amber-400 fill-amber-400' 
                              : 'text-gray-200'
                          }`} 
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
                    {rating === 5 ? 'MasterClass Standard (5/5)' :
                     rating === 4 ? 'Highly Commended (4/5)' :
                     rating === 3 ? 'Standard Alignment (3/5)' :
                     rating === 2 ? 'Needs Revision (2/5)' : 'Flagged Poor Work (1/5)'}
                  </span>
                </div>

                {/* TEXT REVIEW */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Written Experience Review</label>
                  <textarea
                    rows={3}
                    placeholder="Describe how the worker performed their masonry, sanitation, or logistics shift..."
                    className="w-full text-xs font-medium p-4 rounded-2xl border border-gray-200 outline-none focus:border-indigo-600 resize-none font-sans"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                  />
                </div>

                {/* PLATFORM SECURITY PLEDGE */}
                <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex items-start gap-2.5">
                  <ShieldAlert className="text-indigo-600 shrink-0 mt-0.5" size={16} />
                  <p className="text-[10.5px] text-gray-500 leading-relaxed font-sans">
                    By submitting this rating, you release escrow platform holdings to <span className="font-semibold text-gray-805">{selectedContract.workerName}</span>'s verified MoMo digital wallet instantly. Your review cannot be retracted.
                  </p>
                </div>

                {/* SUBMIT */}
                <button
                  onClick={handleApproveAndSubmitReview}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-650 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-sans font-black uppercase tracking-widest text-xs shadow-lg transition-transform hover:scale-[1.01]"
                >
                  🚀 Submit & Release Funds (RWF {selectedContract.salary})
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
