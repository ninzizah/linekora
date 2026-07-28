import { useState, useEffect } from 'react';
import { 
  Search, Filter, MapPin, DollarSign, Clock, 
  CheckCircle2, ChevronRight, Bookmark, AlertCircle, Briefcase, 
  Lock, ArrowRight, X, Loader2, RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { readScopedStorage, writeScopedStorage } from '../../lib/userScopedStorage';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'motion/react';
import { getJobs, createApplication, createNotification, Job } from '../../lib/api';
import { formatDistanceToNow } from 'date-fns';

function getRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'Just now';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Just now';
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return 'Just now';
  }
}

export default function BrowseJobs() {
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<number | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [savedIds, setSavedIds] = useState<Set<number>>(() => {
    return new Set(readScopedStorage<number[]>(profile?.id, 'saved_job_ids', []));
  });

  // Filter states
  const [filterCategory, setFilterCategory] = useState('');
  const [filterUrgent, setFilterUrgent] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadJobs = async () => {
    setLoading(true);
    try {
      const params: { urgent?: boolean; category?: string; status?: string } = { status: 'open' };
      if (filterUrgent) params.urgent = true;
      if (filterCategory) params.category = filterCategory;
      const data = await getJobs(params);
      setJobs(data);
    } catch (err) {
      showToast('Failed to load jobs. Check your connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
    // Load previously applied IDs
    const cached = readScopedStorage<number[]>(profile?.id, 'applied_job_ids', []);
    setAppliedIds(new Set(cached));
  }, [filterUrgent, filterCategory]);

  const handleApply = async (job: Job) => {
    if (!profile?.id) {
      showToast('Please sign in to apply.', 'error');
      return;
    }
    if (appliedIds.has(job.id)) {
      showToast('You already applied for this job.', 'info');
      return;
    }

    // Tier check
    const tier = profile.tier || 'Free Account';
    if (tier === 'Free Account' && appliedIds.size >= 2) {
      setShowLimitModal(true);
      return;
    }

    setApplyingId(job.id);
    try {
      await createApplication({ jobId: job.id, workerId: profile.id });

      // Notify the employer in the database
      if (job.employerId) {
        await createNotification({
          userId: job.employerId,
          title: '📥 New Application Received',
          body: `${profile.displayName} has applied for your job: "${job.title}". Review their profile in Applicants.`,
          type: 'info',
        });
      }

      const newApplied = new Set(appliedIds);
      newApplied.add(job.id);
      setAppliedIds(newApplied);
      writeScopedStorage(profile?.id, 'applied_job_ids', [...newApplied]);
      showToast(`Applied for "${job.title}" successfully! 🎉`, 'success');
    } catch (err: any) {
      if (err.message?.includes('Already applied')) {
        const newApplied = new Set(appliedIds);
        newApplied.add(job.id);
        setAppliedIds(newApplied);
        showToast('You already applied for this job.', 'info');
      } else {
        showToast(err.message || 'Failed to apply. Try again.', 'error');
      }
    } finally {
      setApplyingId(null);
    }
  };

  const handleSave = (jobId: number) => {
    const updated = new Set(savedIds);
    if (updated.has(jobId)) { updated.delete(jobId); } 
    else { updated.add(jobId); }
    setSavedIds(updated);
    writeScopedStorage(profile?.id, 'saved_job_ids', [...updated]);
  };

  const getLimitMessage = () => {
    if (profile?.tier === 'Verified Bronze') return 'Verified Bronze accounts are limited to 5 active applications.';
    return 'Free accounts are limited to 2 active applications.';
  };

  const filteredJobs = jobs.filter(job => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      job.title.toLowerCase().includes(q) ||
      (job.employer?.displayName || '').toLowerCase().includes(q) ||
      job.location.toLowerCase().includes(q) ||
      (job.category || '').toLowerCase().includes(q) ||
      job.description.toLowerCase().includes(q)
    );
  });

  const categories = ['Construction', 'Domestic Help', 'Mechanical', 'Security', 'Logistics', 'Creative', 'IT & Tech', 'Hospitality'];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 lg:flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-gray-900 font-sans tracking-tight">Marketplace</h1>
            <p className="text-gray-500 font-sans font-medium mt-1">
              {loading ? 'Loading opportunities...' : `${filteredJobs.length} verified ${filteredJobs.length === 1 ? 'opportunity' : 'opportunities'} available near you.`}
            </p>
          </div>
          <button
            onClick={loadJobs}
            className="mt-4 lg:mt-0 flex items-center gap-2 text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </header>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search by job title, company, location or keyword..." 
              className="w-full pl-12 pr-32 py-4 rounded-2xl bg-white border border-gray-100 shadow-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none font-sans font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') setSearch(''); }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-24 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => {/* search is live on state change */}}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-sans font-black text-xs uppercase tracking-widest transition-all shadow-sm"
            >
              Search
            </button>
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-8 py-4 rounded-2xl border-2 font-sans font-bold transition-all ${
              showFilters ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-900 border-gray-100 hover:border-blue-600'
            }`}
          >
            <Filter size={20} />
            Filters {showFilters ? '▲' : '▼'}
          </button>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm"
            >
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest font-sans mb-3">Category</label>
                <select 
                  value={filterCategory} 
                  onChange={e => setFilterCategory(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-100 font-sans font-bold text-sm outline-none focus:border-blue-600"
                >
                  <option value="">All Categories</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest font-sans mb-3">Job Type</label>
                <div className="flex items-center gap-2 mt-1 bg-red-50/50 p-2.5 border border-red-100 rounded-xl">
                  <input 
                    type="checkbox" 
                    id="urgent-only" 
                    checked={filterUrgent}
                    onChange={e => setFilterUrgent(e.target.checked)}
                    className="h-4 w-4 rounded text-blue-600 accent-blue-600 cursor-pointer" 
                  />
                  <label htmlFor="urgent-only" className="text-xs font-black text-red-700 uppercase tracking-wider cursor-pointer">
                    🚨 Urgent Tasks Only
                  </label>
                </div>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => { setFilterCategory(''); setFilterUrgent(false); }}
                  className="w-full py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-xl font-sans font-black text-xs uppercase tracking-widest transition-all"
                >
                  Reset Filters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest font-sans">Loading live jobs...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredJobs.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
            <Briefcase size={48} className="mx-auto text-gray-200 mb-4" />
            <h3 className="font-black text-gray-900 text-lg uppercase tracking-tight">
              {search ? 'No matches found' : 'No jobs available right now'}
            </h3>
            <p className="text-gray-400 text-sm mt-2 font-sans">
              {search ? `No jobs match "${search}". Try a different keyword.` : 'New jobs are posted daily. Check back soon!'}
            </p>
            {search && (
              <button onClick={() => setSearch('')} className="mt-4 text-blue-600 text-sm font-black hover:underline">
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Jobs Grid */}
        {!loading && filteredJobs.length > 0 && (
          <div className="grid grid-cols-1 gap-6 pb-20">
            {filteredJobs.map((job, i) => (
              <motion.div 
                key={job.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-100 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex gap-5">
                    <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shrink-0">
                      <Briefcase size={28} />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-lg font-black text-gray-900 font-sans tracking-tight">{job.title}</h3>
                        {job.urgent && (
                          <span className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-red-100 animate-pulse">
                            🚨 Urgent
                          </span>
                        )}
                        {job.category && (
                          <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">
                            {job.category}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 font-sans font-bold italic mb-3 text-sm">
                        {job.employer?.displayName || 'Private Client'}
                      </p>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 font-sans uppercase tracking-wider">
                          <MapPin size={13} className="text-gray-300" />
                          {job.location}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 font-sans uppercase tracking-wider">
                          <DollarSign size={13} className="text-gray-300" />
                          {job.salary}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 font-sans uppercase tracking-wider">
                          <Clock size={13} className="text-gray-300" />
                          {getRelativeTime(job.createdAt)}
                        </div>
                      </div>
                      {job.description && (
                        <p className="text-xs text-gray-400 font-sans mt-2 line-clamp-2 italic">
                          "{job.description}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 md:flex-col md:items-end shrink-0">
                    <button 
                      onClick={() => handleApply(job)}
                      disabled={applyingId === job.id || appliedIds.has(job.id)}
                      className={`flex-1 md:flex-none px-6 py-3.5 rounded-2xl font-sans font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                        appliedIds.has(job.id)
                          ? 'bg-green-50 text-green-600 border border-green-200 cursor-default'
                          : applyingId === job.id
                          ? 'bg-blue-100 text-blue-600 cursor-wait'
                          : 'bg-gray-900 text-white hover:bg-black shadow-sm'
                      }`}
                    >
                      {applyingId === job.id ? (
                        <><Loader2 size={16} className="animate-spin" /> Applying...</>
                      ) : appliedIds.has(job.id) ? (
                        <><CheckCircle2 size={16} /> Applied</>
                      ) : (
                        'Quick Apply'
                      )}
                    </button>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleSave(job.id)}
                        className={`p-3 rounded-xl border transition-all ${
                          savedIds.has(job.id) 
                            ? 'border-blue-200 bg-blue-50 text-blue-600' 
                            : 'border-gray-100 text-gray-400 hover:text-blue-600 hover:border-blue-100'
                        }`}
                      >
                        <Bookmark size={18} className={savedIds.has(job.id) ? 'fill-current' : ''} />
                      </button>
                      <button className="p-3 rounded-xl border border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-100 transition-all">
                        <AlertCircle size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Limit Modal */}
        <AnimatePresence>
          {showLimitModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowLimitModal(false)}
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-[3rem] p-10 shadow-2xl border border-gray-100"
              >
                <div className="h-20 w-20 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mb-8 mx-auto">
                  <Lock size={40} />
                </div>
                <h2 className="text-2xl font-black text-gray-900 text-center font-sans tracking-tight mb-4 uppercase">
                  Application Limit Reached
                </h2>
                <p className="text-gray-500 text-center font-sans font-medium mb-8 leading-relaxed italic">
                  "{getLimitMessage()}"
                </p>
                <div className="space-y-4">
                  <Link 
                    to="/dashboard/worker/verify"
                    className="w-full flex items-center justify-between px-6 py-4 bg-blue-600 text-white rounded-2xl font-sans font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-200"
                  >
                    Upgrade Now
                    <ArrowRight size={18} />
                  </Link>
                  <button 
                    onClick={() => setShowLimitModal(false)}
                    className="w-full py-4 text-gray-400 font-sans font-bold text-sm uppercase tracking-widest hover:text-gray-900"
                  >
                    Maybe Later
                  </button>
                </div>
                <button 
                  onClick={() => setShowLimitModal(false)}
                  className="absolute top-6 right-6 text-gray-300 hover:text-gray-900 transition-colors"
                >
                  <X size={24} />
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl font-sans font-bold text-sm flex items-center gap-3 ${
              toast.type === 'success' ? 'bg-green-600 text-white' :
              toast.type === 'error' ? 'bg-red-600 text-white' :
              'bg-gray-900 text-white'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : toast.type === 'error' ? <AlertCircle size={18} /> : <AlertCircle size={18} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
