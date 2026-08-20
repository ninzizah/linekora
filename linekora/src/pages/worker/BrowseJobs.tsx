import { useState, useEffect } from 'react';
import { 
  Search, Filter, MapPin, DollarSign, Clock, 
  CheckCircle2, ChevronRight, Bookmark, AlertCircle, Briefcase, 
  Loader2, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { readScopedStorage, writeScopedStorage } from '../../lib/userScopedStorage';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'motion/react';
import { getJobs, createApplication, createNotification, Job } from '../../lib/api';
import { formatDistanceToNow } from 'date-fns';
import { useLanguage } from '../../lib/LanguageContext';

function getRelativeTime(dateStr: string | undefined, t: (key: string) => string): string {
  if (!dateStr) return t('just_now');
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return t('just_now');
    return formatDistanceToNow(d, { addSuffix: true });
  } catch { return t('just_now'); }
}

export default function BrowseJobs() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
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
  const [filterNearby, setFilterNearby] = useState(false);

  // Worker's own location for "near you" matching
  const myLocation = (profile?.location || '').trim();
  const myLocationTokens = myLocation.toLowerCase().split(/[\s,]+/).filter(Boolean);

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
      showToast(t('failed_to_load_jobs'), 'error');
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
      showToast(t('please_sign_in_to_apply'), 'error');
      return;
    }
    if (appliedIds.has(job.id)) {
      showToast(t('already_applied_for_job'), 'info');
      return;
    }

    setApplyingId(job.id);
    try {
      await createApplication({
        jobId: job.id,
        workerId: profile.id,
      });

      // Notify the employer in the database
      if (job.employerId) {
        await createNotification({
          userId: job.employerId,
          title: t('new_application_received'),
          body: t('applied_for_job_notification', { name: profile.displayName, title: job.title }),
          type: 'info',
        });
      }

      const newApplied = new Set(appliedIds);
      newApplied.add(job.id);
      setAppliedIds(newApplied);
      writeScopedStorage(profile?.id, 'applied_job_ids', [...newApplied]);
      showToast(t('applied_success_toast', { title: job.title }), 'success');
    } catch (err: any) {
      if (err.message?.includes('Already applied')) {
        const newApplied = new Set(appliedIds);
        newApplied.add(job.id);
        setAppliedIds(newApplied);
        showToast(t('already_applied_for_job'), 'info');
      } else {
        showToast(err.message || t('failed_to_apply_try_again'), 'error');
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

  const filteredJobs = jobs.filter(job => {
    if (filterNearby && myLocationTokens.length > 0) {
      const jobLoc = (job.location || '').toLowerCase();
      const nearby = myLocationTokens.some(token => token.length >= 3 && jobLoc.includes(token));
      if (!nearby) return false;
    }
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

  // Keep the subtitle honest: only claim "near you" when the nearby filter is active
  const nearbyActive = filterNearby && myLocationTokens.length > 0;
  const subtitleCount = `${filteredJobs.length} verified ${filteredJobs.length === 1 ? t('opportunity') : t('opportunities')}`;

  const categories = [
    { value: 'Construction', key: 'category_construction' },
    { value: 'Domestic Help', key: 'category_domestic_help' },
    { value: 'Mechanical', key: 'category_mechanical' },
    { value: 'Security', key: 'category_security' },
    { value: 'Logistics', key: 'category_logistics' },
    { value: 'Creative', key: 'category_creative' },
    { value: 'IT & Tech', key: 'category_it_tech' },
    { value: 'Hospitality', key: 'category_hospitality' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 lg:flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-gray-900 font-sans tracking-tight">{t('marketplace')}</h1>
            <p className="text-gray-500 font-sans font-medium mt-1">
              {loading ? t('loading_opportunities') : `${subtitleCount} ${nearbyActive ? `${t('available_near_you')}.` : t('available')}.`}
            </p>
          </div>
          <button
            onClick={loadJobs}
            className="mt-4 lg:mt-0 flex items-center gap-2 text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {t('refresh')}
          </button>
        </header>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder={t('search_placeholder')} 
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
                {t('clear')}
              </button>
            )}
            <button
              onClick={() => {/* search is live on state change */}}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-sans font-black text-xs uppercase tracking-widest transition-all shadow-sm"
            >
              {t('search')}
            </button>
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-8 py-4 rounded-2xl border-2 font-sans font-bold transition-all ${
              showFilters ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-900 border-gray-100 hover:border-blue-600'
            }`}
          >
            <Filter size={20} />
            {t('filters')} {showFilters ? '▲' : '▼'}
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
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest font-sans mb-3">{t('category')}</label>
                <select 
                  value={filterCategory} 
                  onChange={e => setFilterCategory(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-100 font-sans font-bold text-sm outline-none focus:border-blue-600"
                >
                  <option value="">{t('all_categories')}</option>
                  {categories.map(c => <option key={c.value} value={c.value}>{t(c.key)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest font-sans mb-3">{t('job_type')}</label>
                <div className="flex items-center gap-2 mt-1 bg-red-50/50 p-2.5 border border-red-100 rounded-xl">
                  <input 
                    type="checkbox" 
                    id="urgent-only" 
                    checked={filterUrgent}
                    onChange={e => setFilterUrgent(e.target.checked)}
                    className="h-4 w-4 rounded text-blue-600 accent-blue-600 cursor-pointer" 
                  />
                  <label htmlFor="urgent-only" className="text-xs font-black text-red-700 uppercase tracking-wider cursor-pointer">
                    {t('urgent_tasks_only')}
                  </label>
                </div>
                <div className="flex items-center gap-2 mt-2 bg-blue-50/50 p-2.5 border border-blue-100 rounded-xl">
                  <input 
                    type="checkbox" 
                    id="nearby-only" 
                    checked={filterNearby}
                    onChange={e => setFilterNearby(e.target.checked)}
                    className="h-4 w-4 rounded text-blue-600 accent-blue-600 cursor-pointer" 
                  />
                  <label htmlFor="nearby-only" className="text-xs font-black text-blue-700 uppercase tracking-wider cursor-pointer">
                    {t('nearby_only')}
                  </label>
                </div>
                {filterNearby && !myLocation && (
                  <p className="text-[10px] font-bold text-amber-600 mt-1.5 italic">{t('nearby_location_hint')}</p>
                )}
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => { setFilterCategory(''); setFilterUrgent(false); setFilterNearby(false); }}
                  className="w-full py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-xl font-sans font-black text-xs uppercase tracking-widest transition-all"
                >
                  {t('reset_filters')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest font-sans">{t('loading_live_jobs')}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredJobs.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
            <Briefcase size={48} className="mx-auto text-gray-200 mb-4" />
            <h3 className="font-black text-gray-900 text-lg uppercase tracking-tight">
              {search ? t('no_matches_found') : t('no_jobs_right_now')}
            </h3>
            <p className="text-gray-400 text-sm mt-2 font-sans">
              {search ? t('no_jobs_match', { query: search }) : t('new_jobs_daily')}
            </p>
            {search && (
              <button onClick={() => setSearch('')} className="mt-4 text-blue-600 text-sm font-black hover:underline">
                {t('clear_search')}
              </button>
            )}
          </div>
        )}

        {/* Jobs Grid */}
        {!loading && filteredJobs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
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
                            {t('urgent_badge')}
                          </span>
                        )}
                        {job.category && (
                          <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">
                            {job.category}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 font-sans font-bold italic mb-3 text-sm">
                        {job.employer?.displayName || t('private_client')}
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
                          {getRelativeTime(job.createdAt, t)}
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
                        <><Loader2 size={16} className="animate-spin" /> {t('applying')}</>
                      ) : appliedIds.has(job.id) ? (
                        <><CheckCircle2 size={16} /> {t('applied')}</>
                      ) : (
                        t('quick_apply')
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
