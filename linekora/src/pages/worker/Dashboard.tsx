import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, TrendingUp, CheckCircle2, Clock, 
  ChevronRight, MapPin, DollarSign, Star, Zap, Shield, Wallet, Briefcase, MessageSquare,
  Bell, AlertCircle, Smartphone, X, Phone, Info, Bookmark, Check, Loader2, RefreshCw
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../lib/AuthContext';
import { readScopedStorage, writeScopedStorage } from '../../lib/userScopedStorage';
import { getJobs, createApplication, createNotification, applyToJob, getApplications, Job } from '../../lib/api';
import { formatDistanceToNow } from 'date-fns';
import { useLanguage } from '../../lib/LanguageContext';
import { useLiveChat } from '../../lib/useLiveChat';

function getRelativeTime(dateStr: string | undefined, t: (key: string) => string): string {
  if (!dateStr) return t('just_now');
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return t('just_now');
    return formatDistanceToNow(d, { addSuffix: true });
  } catch { return t('just_now'); }
}

export default function WorkerDashboard() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { chatsList, openChat } = useLiveChat(profile?.id);
  const [acceptedJobId, setAcceptedJobId] = useState<number | null>(null);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modalFeedback, setModalFeedback] = useState<{ type: 'claim' | 'apply' | 'already' | 'limit'; title: string; message: string } | null>(null);
  
  // Real-time stateful saved jobs aligned with local storage
  const [savedJobs, setSavedJobs] = useState<any[]>(() => {
    return readScopedStorage<any[]>(profile?.id, 'worker_saved_jobs', []);
  });

  const [urgentJobs, setUrgentJobs] = useState<any[]>(() => {
    const parsed = readScopedStorage<any[]>(profile?.id, 'urgent_jobs', []);
    return Array.from(new Map(parsed.map((item: any) => [item.id, item])).values());
  });

  // Re-sync whenever dashboard loads
  useEffect(() => {
    const syncJobs = () => {
      const parsed = readScopedStorage<any[]>(profile?.id, 'urgent_jobs', []);
      const unique = Array.from(new Map(parsed.map((item: any) => [item.id, item])).values());
      setUrgentJobs(unique);
    };
    window.addEventListener('storage', syncJobs);
    return () => window.removeEventListener('storage', syncJobs);
  }, []);

  const handleAcceptJob = async (id: number) => {
    if (!profile?.id) return;
    setAcceptedJobId(id);
    setIsProcessing(true);
    try {
      await applyToJob(id, profile.id);

      // Notify employer
      const job = [...dbUrgentJobs, ...urgentJobs].find((j: any) => j.id === id);
      if (job?.employerId) {
        await createNotification({
          userId: job.employerId,
          title: t('hot_task_claimed'),
          body: t('claimed_task_notification', { name: profile.displayName, title: job.title }),
          type: 'success',
          linkTarget: 'contracts',
        });
      }

      const newApplied = new Set(appliedIds);
      newApplied.add(id);
      setAppliedIds(newApplied);
      writeScopedStorage(profile?.id, 'applied_job_ids', [...newApplied]);

      setAcceptedJobId(null);
      setIsProcessing(false);
      setModalFeedback({
        type: 'claim',
        title: t('gig_claimed_securely'),
        message: t('gig_claimed_message', { title: job?.title || t('gig') }),
      });
    } catch (err: any) {
      setAcceptedJobId(null);
      setIsProcessing(false);
      if (err.message?.includes('Already applied')) {
        const newApplied = new Set(appliedIds);
        newApplied.add(id);
        setAppliedIds(newApplied);
        setModalFeedback({ type: 'already', title: t('already_applied'), message: t('already_claimed_gig') });
      } else {
        showJobToast(err.message || t('failed_to_claim_job'), 'error');
      }
    }
  };

  const handleToggleSave = (job: any, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const isSaved = savedJobs.some(sj => sj.id === job.id || sj.title === job.title);
    let updated;
    if (isSaved) {
      updated = savedJobs.filter(sj => sj.id !== job.id && sj.title !== job.title);
    } else {
      updated = [...savedJobs, job];
    }
    setSavedJobs(updated);
    writeScopedStorage(profile?.id, 'worker_saved_jobs', updated);
  };

  const [applyingId, setApplyingId] = useState<number | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<number>>(() => {
    return new Set(readScopedStorage<number[]>(profile?.id, 'applied_job_ids', []));
  });
  const [dbUrgentJobs, setDbUrgentJobs] = useState<Job[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [nearbyJobs, setNearbyJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobToast, setJobToast] = useState<{ msg: string; type: 'success'|'error'|'info' } | null>(null);

  const showJobToast = (msg: string, type: 'success'|'error'|'info' = 'success') => {
    setJobToast({ msg, type });
    setTimeout(() => setJobToast(null), 4000);
  };

  const loadAllJobs = async () => {
    setJobsLoading(true);
    try {
      const [urgent, all] = await Promise.all([
        getJobs({ urgent: true, status: 'open' }),
        getJobs({ status: 'open' }),
      ]);
      setDbUrgentJobs(urgent);
      // Merge: recommended = non-urgent open jobs, nearby = first 4 of all
      const nonUrgent = all.filter(j => !j.urgent);
      setRecommendedJobs(nonUrgent.slice(0, 6));
      setNearbyJobs(all.slice(0, 4));
    } catch (err) {
      console.error('Failed to load jobs', err);
    } finally {
      setJobsLoading(false);
    }
  };

  const handleApplyFromModal = async (job: any) => {
    if (!profile?.id) return;
    if (appliedIds.has(job.id)) {
      setModalFeedback({ type: 'already', title: t('already_applied'), message: t('already_applied_for', { title: job.title }) });
      return;
    }
    setIsProcessing(true);
    try {
      await createApplication({ jobId: job.id, workerId: profile.id });
      if (job.employerId) {
        await createNotification({
          userId: job.employerId,
          title: t('new_application_received'),
          body: t('applied_for_notification', { name: profile.displayName, title: job.title }),
          type: 'info',
          linkTarget: 'applications',
        });
      }
      const newApplied = new Set(appliedIds);
      newApplied.add(job.id);
      setAppliedIds(newApplied);
      writeScopedStorage(profile?.id, 'applied_job_ids', [...newApplied]);
      setIsProcessing(false);
      setModalFeedback({ type: 'apply', title: t('applied_successfully'), message: t('applied_success_message', { name: job.employer?.displayName || t('the_client') }) });
    } catch (err: any) {
      setIsProcessing(false);
      if (err.message?.includes('Already applied')) {
        const newApplied = new Set(appliedIds);
        newApplied.add(job.id);
        setAppliedIds(newApplied);
        setModalFeedback({ type: 'already', title: t('already_applied'), message: t('already_applied_for', { title: job.title }) });
      } else {
        showJobToast(err.message || t('failed_to_apply'), 'error');
      }
    }
  };

  useEffect(() => {
    loadAllJobs();
    // Load applied jobs from DB
    if (profile?.id) {
      getApplications({ workerId: profile.id }).then(apps => {
        const ids = new Set(apps.map(a => a.jobId));
        setAppliedIds(ids);
        writeScopedStorage(profile?.id, 'applied_job_ids', [...ids]);
      }).catch(() => {
        // fallback to localStorage
        const cached = readScopedStorage<number[]>(profile?.id, 'applied_job_ids', []);
        setAppliedIds(new Set(cached));
      });
    }
    // Also sync localStorage urgentJobs (employer hot tasks from their session)
    const parsed = readScopedStorage<any[]>(profile?.id, 'urgent_jobs', []);
    if (parsed.length > 0) {
      setUrgentJobs(parsed);
    }
  }, [profile?.id]);

  const verificationText = (s?: string) => ({ verified: t('status_verified'), unverified: t('status_unverified') }[s || ''] || s?.replace('_', ' ') || '');

  const stats = [
    {
      icon: Briefcase,
      label: t('jobs_applied'),
      value: appliedIds.size || 0,
      color: 'bg-blue-600',
      trend: appliedIds.size > 0 ? t('active_plus') : t('start'),
    },
    {
      icon: CheckCircle2,
      label: t('status'),
      value: profile?.verificationStatus === 'verified' ? t('verified') : t('unverified'),
      color: profile?.verificationStatus === 'verified' ? 'bg-green-600' : 'bg-gray-400',
      trend: profile?.verificationStatus === 'verified' ? t('active') : t('upgrade'),
    },
    {
      icon: Star,
      label: t('trust_score'),
      value: profile?.trustScore || 50,
      color: 'bg-yellow-500',
      trend: (profile?.trustScore || 50) > 80 ? t('high') : t('grow'),
    },
    {
      icon: Zap,
      label: t('account_tier'),
      value: profile?.tier || t('free'),
      color: 'bg-purple-600',
      trend: t('active'),
    },
  ];


  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 font-sans tracking-tight uppercase flex items-center gap-2 flex-wrap">
              {t('hi_user', { name: profile?.displayName || t('user') })}
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${
                profile?.tier === 'Verified Bronze' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                profile?.tier === 'Silver Verified' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                'bg-gray-100 text-gray-500 border-gray-200'
              }`}>
                {profile?.tier || t('free_account')}
              </span>
              {profile?.verificationStatus === 'verified' && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase">
                  <CheckCircle2 size={12} />
                  {t('verified_worker')}
                </span>
              )}
            </h1>
            <p className="text-gray-500 font-sans font-medium mt-1 italic">
              {t('status')}: <span className="text-blue-600 font-bold capitalize">{verificationText(profile?.verificationStatus)}</span>
            </p>
          </div>
          <button 
            onClick={() => navigate('/dashboard/worker/browse')}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-sans font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
          >
            <Search size={20} />
            {t('find_jobs')}
          </button>
        </header>

        {/* Stats Cards (kept compact + horizontal-scroll on phones) */}
        <div className="flex gap-2.5 mb-10 overflow-x-auto md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-hidden snap-x snap-mandatory md:snap-none scrollbar-none">
          {stats.map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="min-w-[44vw] md:min-w-0 snap-center md:snap-none p-3.5 md:p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3 bg-white transition-all shrink-0 md:shrink"
            >
              <div className={`h-10 w-10 md:h-11 md:w-11 ${stat.color} rounded-xl flex items-center justify-center text-white shadow-md shrink-0`}>
                <stat.icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans text-[9px] font-black text-gray-400 uppercase tracking-widest truncate">{stat.label}</p>
                <h3 className="text-lg md:text-xl font-black text-gray-900 leading-none font-sans tracking-tight mt-1">{stat.value}</h3>
              </div>
              <span className="text-[8px] font-black text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                {stat.trend}
              </span>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* Urgent Tasks Notifications Board */}
            <section className="bg-red-50/50 rounded-[3rem] p-6 md:p-8 border-2 border-red-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 h-32 w-32 bg-red-500/5 rounded-full blur-2xl" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  <div>
                    <h2 className="text-lg font-black text-red-950 font-sans tracking-tight uppercase flex items-center gap-1.5">
                      {t('hot_tasks_nearby')}
                    </h2>
                    <p className="text-[10px] uppercase font-black tracking-widest text-red-700 font-sans">{t('verified_gigs_sms_live')}</p>
                  </div>
                </div>
                <div className="bg-red-100 text-red-700 font-sans font-black uppercase text-[9px] tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 self-start">
                  <Bell size={10} className="animate-bounce" />
                  {t('hot_tasks_badge')}
                </div>
              </div>

              {(() => {
                const combined = [...dbUrgentJobs, ...urgentJobs];
                const uniqueHotJobs = Array.from(
                  new Map(combined.map(j => [j.id || j.title, j])).values()
                );
                if (uniqueHotJobs.length === 0) {
                  return (
                    <div className="text-center py-6 bg-white/40 rounded-2xl border border-red-100/30">
                      <p className="font-sans font-bold text-red-900 text-sm">{t('hot_tasks_claimed')}</p>
                      <p className="text-[10px] text-red-600/70 uppercase tracking-widest font-black mt-1">{t('ready_for_cell_towers')}</p>
                    </div>
                  );
                }
                return (
                  <div className="space-y-4">
                    {uniqueHotJobs.map((job) => (
                    <div 
                      key={job.id} 
                      onClick={() => setSelectedJob(job)}
                      className="bg-white p-5 rounded-2xl border border-red-100 hover:border-red-400 hover:shadow-lg shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-red-100 text-red-600 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded">
                            {job.category || t('urgent')}
                          </span>
                          <span className="text-[10px] text-gray-400 font-sans font-medium">{getRelativeTime(job.createdAt || job.postedAt, t)} </span>
                        </div>
                        <h3 className="font-sans font-black text-gray-950 text-base leading-tight">
                          {job.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-gray-500 font-sans">
                            <MapPin size={12} className="text-red-400" />
                            {job.location}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-blue-600 font-sans">
                            <DollarSign size={12} />
                            {job.salary}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-sans font-medium italic mt-1 line-clamp-1">
                          "{job.description}"
                        </p>
                      </div>

                      <button
                        disabled={acceptedJobId !== null || appliedIds.has(job.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcceptJob(job.id);
                        }}
                        className={`px-5 py-3 rounded-xl font-sans font-black uppercase tracking-widest text-[9px] shrink-0 transition-all text-center ${
                          appliedIds.has(job.id)
                            ? 'bg-green-100 text-green-700 border border-green-200 cursor-default'
                            : acceptedJobId === job.id
                            ? 'bg-amber-500 text-white animate-pulse'
                            : 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-100'
                        }`}
                      >
                        {appliedIds.has(job.id) ? t('applied_check') : acceptedJobId === job.id ? t('securing') : t('claim_job')}
                      </button>
                    </div>
                  ))}
                </div>
              );
            })()}
          </section>

            {/* Recommended Jobs */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 font-sans flex items-center gap-2">
                  <TrendingUp className="text-blue-600" size={20} />
                  {t('recommended_for_you')}
                </h2>
                <button 
                  onClick={() => navigate('/dashboard/worker/browse')}
                  className="text-sm font-bold text-blue-600 hover:underline font-sans cursor-pointer"
                >
                  {t('view_all')}
                </button>
              </div>
              <div className="space-y-4">
                {jobsLoading ? (
                  <div className="flex items-center justify-center py-8 gap-3 text-gray-400">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="text-sm font-bold uppercase tracking-widest font-sans">{t('loading_jobs')}</span>
                  </div>
                ) : recommendedJobs.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <Briefcase size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest font-sans">{t('no_jobs_available_yet')}</p>
                    <p className="text-xs text-gray-300 mt-1 font-sans">{t('check_back_soon')}</p>
                  </div>
                ) : recommendedJobs.map((job) => (
                  <div 
                    key={job.id} 
                    onClick={() => setSelectedJob(job)}
                    className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-600 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="h-12 w-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                          <Briefcase size={24} />
                        </div>
                        <div>
                          <h3 className="font-sans font-bold text-gray-900 flex flex-wrap items-center gap-2">
                            {job.title}
                            <CheckCircle2 size={16} className="text-blue-600" />
                          </h3>
                          <p className="font-sans text-sm text-gray-500 font-medium">{job.employer?.displayName || t('private_client')}</p>
                          <div className="flex flex-wrap items-center gap-4 mt-3">
                            <span className="flex items-center gap-1 text-xs font-bold text-gray-400 font-sans uppercase">
                              <MapPin size={12} />
                              {job.location}
                            </span>
                            <span className="flex items-center gap-1 text-xs font-bold text-gray-400 font-sans uppercase">
                              <DollarSign size={12} />
                              {job.salary}
                            </span>
                            <span className="flex items-center gap-1 text-xs font-bold text-gray-400 font-sans">
                              <Clock size={12} />
                              {getRelativeTime(job.createdAt, t)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleToggleSave(job, e)}
                          className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Bookmark 
                            size={16} 
                            className={savedJobs.some(sj => sj.title === job.title) ? "fill-blue-600 text-blue-600" : ""}
                          />
                        </button>
                        <ChevronRight className="text-gray-300 group-hover:text-blue-600" size={20} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Nearby Jobs */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 font-sans flex items-center gap-2">
                  <MapPin className="text-red-500" size={20} />
                  {t('jobs_nearby')}
                </h2>
                <button 
                  onClick={() => navigate('/dashboard/worker/browse')}
                  className="text-xs font-black text-blue-600 hover:underline uppercase tracking-widest font-sans"
                >
                  {t('configure_radius')}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {nearbyJobs.length === 0 && !jobsLoading ? (
                  <div className="col-span-2 text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <MapPin size={28} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest font-sans">{t('no_nearby_jobs')}</p>
                  </div>
                ) : nearbyJobs.map((job) => (
                  <div 
                    key={job.id} 
                    onClick={() => setSelectedJob(job)}
                    className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-600 hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-sans font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{job.title}</h4>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{job.location} • {job.salary}</p>
                      <p className="text-[10px] text-gray-300 mt-0.5 font-sans">{getRelativeTime(job.createdAt, t)}</p>
                    </div>
                    <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                      <ChevronRight size={16} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Recent Messages */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 font-sans flex items-center gap-2">
                  <MessageSquare className="text-blue-500" size={20} />
                  {t('recent_messages')}
                </h2>
                <button 
                  onClick={() => navigate('/dashboard/worker/messages')}
                  className="text-sm font-bold text-blue-600 hover:underline font-sans cursor-pointer"
                >
                  {t('open_inbox')}
                </button>
              </div>
              <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                {chatsList.length === 0 ? (
                  <div className="p-6 text-center">
                    <MessageSquare size={28} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest font-sans">{t('no_chats_yet')}</p>
                  </div>
                ) : (
                  chatsList.slice(0, 4).map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => {
                        openChat(chat.id);
                        navigate('/dashboard/worker/messages');
                      }}
                      className="w-full p-4 flex items-center gap-3 hover:bg-blue-50/40 transition-colors text-left border-b border-gray-50 last:border-b-0"
                    >
                      <div className="relative shrink-0">
                        <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 font-sans font-black text-xs flex items-center justify-center border border-blue-100">
                          {chat.avatar}
                        </div>
                        {chat.online && <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-sans font-black text-gray-900 text-sm truncate">{chat.name}</p>
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest shrink-0">{chat.time}</span>
                        </div>
                        <p className="text-xs text-gray-500 truncate font-sans font-medium">{chat.lastMsg}</p>
                      </div>
                      {chat.unread > 0 && (
                        <span className="h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0">{chat.unread}</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Sidebar / Sidebar Content */}
          <div className="space-y-8">
            <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-blue-200">
              <h3 className="text-xl font-bold font-sans mb-2 uppercase tracking-tight">{t('level_up_profile')}</h3>
              <p className="text-white/80 font-sans text-xs mb-6 leading-relaxed italic">
                {profile?.tier === 'Silver Verified' 
                  ? t('silver_visibility') 
                  : t('verified_visibility')}
              </p>
              <Link 
                to="/dashboard/worker/verify" 
                className="block w-full bg-white text-blue-600 py-3 rounded-xl font-sans font-black uppercase tracking-widest text-[10px] text-center hover:scale-[1.02] transition-transform shadow-lg"
              >
                {profile?.tier === 'Silver Verified' ? t('verification_status') : t('upgrade_premium')}
              </Link>
            </section>

            <section className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold font-sans text-gray-900">{t('saved_jobs')}</h3>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg font-sans">
                  {savedJobs.length}
                </span>
              </div>
              <div className="space-y-4">
                {savedJobs.length === 0 ? (
                  <p className="text-xs text-gray-400 font-sans italic py-2">{t('no_saved_jobs')}</p>
                ) : (
                  savedJobs.map((job) => (
                    <div 
                      key={job.id} 
                      onClick={() => setSelectedJob(job)}
                      className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600">
                          <Briefcase size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-sans font-bold text-gray-900">{job.title}</p>
                          <p className="text-[10px] font-sans text-gray-400">{job.company || t('private_client')}</p>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-600 shrink-0" />
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold font-sans text-gray-900 mb-6 font-semibold">{t('recent_activity')}</h3>
              <div className="space-y-6">
                {[]}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* JOB DETAILS MODAL */}
      <AnimatePresence>
        {selectedJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isProcessing) {
                  setSelectedJob(null);
                  setModalFeedback(null);
                }
              }}
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-gray-100 z-10 max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => {
                  setSelectedJob(null);
                  setModalFeedback(null);
                }}
                disabled={isProcessing}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-150 text-gray-400 hover:text-gray-755 transition-colors bg-gray-50 flex items-center justify-center disabled:opacity-50"
              >
                <X size={20} />
              </button>

              {isProcessing ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6" />
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">{t('processing_action')}</h3>
                  <p className="text-xs text-gray-400 mt-2 font-sans italic">{t('linking_credentials')}</p>
                </div>
              ) : modalFeedback ? (
                <div className="py-6 flex flex-col items-center justify-center text-center">
                  <div className={`h-16 w-16 ${
                    modalFeedback.type === 'limit' ? 'bg-red-50 text-red-650 border border-red-100' :
                    modalFeedback.type === 'already' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                    'bg-green-50 text-green-650'
                  } rounded-3xl flex items-center justify-center mb-6 text-2xl`}>
                    {modalFeedback.type === 'limit' ? <span>⚠️</span> : modalFeedback.type === 'already' ? <span>ℹ️</span> : <span>✓</span>}
                  </div>
                  <h3 className="text-2xl font-black text-gray-950 font-sans tracking-tight leading-tight uppercase mb-3">
                    {modalFeedback.title}
                  </h3>
                  <p className="text-sm text-gray-500 font-sans leading-relaxed mb-8 max-w-sm">
                    {modalFeedback.message}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    {modalFeedback.type === 'apply' && (
                      <button
                        onClick={() => {
                          setSelectedJob(null);
                          setModalFeedback(null);
                          navigate('/dashboard/worker/applications');
                        }}
                        className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-sans font-black uppercase tracking-widest text-[10px] text-center transition-all shadow-lg"
                      >
                        {t('track_progress')}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedJob(null);
                        setModalFeedback(null);
                      }}
                      className="flex-1 py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-sans font-black uppercase tracking-widest text-[10px] text-center transition-all shadow-lg"
                    >
                      {t('close_details')}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-4 mt-2">
                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded ${
                      selectedJob.urgent
                        ? 'bg-red-50 text-red-600 border border-red-100 animate-pulse'
                        : 'bg-blue-50 text-blue-600 border border-blue-100'
                    }`}>
                      {selectedJob.category ? selectedJob.category : selectedJob.urgent ? t('urgent_gig') : t('recommended_opportunity')}
                    </span>
                    {selectedJob.verified && (
                      <span className="flex items-center gap-1 bg-green-50 text-green-600 px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest">
                        <CheckCircle2 size={10} /> {t('status_verified')}
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-black text-gray-950 font-sans tracking-tight mb-2 leading-tight">
                    {selectedJob.title}
                  </h3>
                  <p className="text-sm font-sans font-black text-blue-650 italic mb-6">
                    {selectedJob.company || t('direct_premium_client')}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-gray-50/70 border border-gray-100 rounded-2xl">
                      <span className="text-[10px] uppercase font-black tracking-widest text-gray-400 block mb-1">{t('compensation')}</span>
                      <span className="text-sm font-black text-gray-900 font-sans flex items-center gap-1">
                        <DollarSign size={14} className="text-gray-500" />
                        {selectedJob.salary}
                      </span>
                    </div>
                    <div className="p-4 bg-gray-50/70 border border-gray-100 rounded-2xl">
                      <span className="text-[10px] uppercase font-black tracking-widest text-gray-400 block mb-1">{t('work_location')}</span>
                      <span className="text-sm font-bold text-gray-950 font-sans flex items-center gap-1 max-w-full truncate">
                        <MapPin size={14} className="text-red-500 shrink-0" />
                        {selectedJob.location}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-widest text-gray-400 block mb-2">{t('scope_of_work')}</span>
                      <p className="text-xs text-gray-650 font-sans font-medium leading-relaxed italic border-l-2 border-blue-100 pl-3">
                        "{selectedJob.description || t('description_fallback')}"
                      </p>
                    </div>

                    <div className="pt-2">
                      <span className="text-[10px] uppercase font-black tracking-widest text-gray-400 block mb-2">{t('contact_channel')}</span>
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-805 bg-blue-50/50 p-3 rounded-xl border border-blue-50 font-sans">
                        <Phone size={14} className="text-blue-500" />
                        <span>{selectedJob.phone || '+250 788 300 120'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleToggleSave(selectedJob)}
                      className={`flex-1 py-4 rounded-xl font-sans font-black uppercase tracking-widest text-[10px] text-center border transition-all flex items-center justify-center gap-2 ${
                        savedJobs.some(sj => sj.id === selectedJob.id || sj.title === selectedJob.title)
                          ? 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-blue-600 hover:text-blue-600'
                      }`}
                    >
                      <Bookmark size={14} className={savedJobs.some(sj => sj.id === selectedJob.id || sj.title === selectedJob.title) ? "fill-blue-600 text-blue-600" : ""} />
                      {savedJobs.some(sj => sj.id === selectedJob.id || sj.title === selectedJob.title) ? t('saved') : t('save_job')}
                    </button>

                    {selectedJob.urgent ? (
                      <button
                        disabled={acceptedJobId !== null || isProcessing}
                        onClick={() => handleAcceptJob(selectedJob.id)}
                        className={`flex-[2] py-4 rounded-xl font-sans font-black uppercase tracking-widest text-[10px] text-center text-white transition-all shadow-lg ${
                          acceptedJobId === selectedJob.id 
                            ? 'bg-amber-500 animate-pulse'
                            : 'bg-red-600 hover:bg-red-700 shadow-red-100'
                        }`}
                      >
                        {acceptedJobId === selectedJob.id ? t('claiming_gig') : t('claim_urgent_gig')}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApplyFromModal(selectedJob)}
                        disabled={isProcessing}
                        className="flex-[2] py-4 rounded-xl bg-gray-900 hover:bg-black font-sans font-black uppercase tracking-widest text-[10px] text-center text-white transition-all shadow-lg shadow-gray-200"
                      >
                        {t('quick_apply_now')}
                      </button>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
