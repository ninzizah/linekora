import React, { useState, useEffect } from 'react';
import { 
  Briefcase, MoreVertical, MapPin, DollarSign, 
  Users, Clock, CheckCircle2, XCircle, Search, Plus, Edit, Trash2, ToggleLeft, ToggleRight, X, Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useLanguage } from '../../lib/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../lib/AuthContext';
import { getJobs, getApplications, updateJob, deleteJob } from '../../lib/api';
import { readScopedStorage, writeScopedStorage } from '../../lib/userScopedStorage';

interface JobItem {
  id: number;
  title: string;
  location: string;
  salary: string;
  status: string;
  applicants: number;
  posted: string;
  views: number;
}

interface ToastAlert {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

export default function CompanyManageJobs() {
  const { t } = useLanguage();
  const { profile } = useAuth();
  const [jobsList, setJobsList] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Dropdown & Modal States
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [editingJob, setEditingJob] = useState<JobItem | null>(null);
  const [showDeleteConfirmId, setShowDeleteConfirmId] = useState<number | null>(null);

  // Quick edit forms
  const [editTitle, setEditTitle] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editSalary, setEditSalary] = useState('');

  // Notification Toast state
  const [toasts, setToasts] = useState<ToastAlert[]>([]);

  const addToast = (title: string, message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const statusText = (s: string) => ({ active: t('status_active'), closed: t('status_closed'), pending: t('status_pending'), accepted: t('status_accepted'), rejected: t('status_rejected'), shortlisted: t('status_shortlisted') }[s] || s);

  // ── Local cache helpers (posts are mirrored into localStorage for offline views) ──
  const updateJobInCaches = (id: number, patch: Partial<any>) => {
    const apply = (list: any) => list.map((j: any) => Number(j.id) === id ? { ...j, ...patch } : j);
    ['all_jobs', 'urgent_jobs'].forEach(k => {
      const scoped = readScopedStorage<any[]>(profile?.id, k, []);
      if (scoped.length) writeScopedStorage(profile?.id, k, apply(scoped));
      try {
        const raw = localStorage.getItem(k);
        if (raw) localStorage.setItem(k, JSON.stringify(apply(JSON.parse(raw))));
      } catch {}
    });
  };

  const purgeJobFromCaches = (id: number) => {
    const filter = (list: any) => list.filter((j: any) => Number(j.id) !== id);
    ['all_jobs', 'urgent_jobs'].forEach(k => {
      const scoped = readScopedStorage<any[]>(profile?.id, k, []);
      if (scoped.length) writeScopedStorage(profile?.id, k, filter(scoped));
      try {
        const raw = localStorage.getItem(k);
        if (raw) localStorage.setItem(k, JSON.stringify(filter(JSON.parse(raw))));
      } catch {}
    });
  };

  const loadJobs = async () => {
    setLoading(true);
    try {
      const [dbJobs, apps] = await Promise.all([
        profile?.id ? getJobs({ employerId: profile.id, includeExpired: true }) : Promise.resolve([]),
        profile?.id ? getApplications({ employerId: profile.id }) : Promise.resolve([]),
      ]);
      const appCount = (jobId: number) => apps.filter(a => a.jobId === jobId).length;

      // Collect locally cached posts (scoped + unscoped) to merge with the DB
      const localMap = new Map<number, any>();
      ['all_jobs', 'urgent_jobs'].forEach(k => {
        readScopedStorage<any[]>(profile?.id, k, []).forEach(j => { if (j?.id != null) localMap.set(Number(j.id), j); });
        try {
          JSON.parse(localStorage.getItem(k) || '[]').forEach((j: any) => { if (j?.id != null) localMap.set(Number(j.id), j); });
        } catch {}
      });

      const byId = new Map<number, JobItem>();
      dbJobs.forEach(j => byId.set(j.id, {
        id: j.id,
        title: j.title,
        location: j.location,
        salary: j.salary,
        status: j.status === 'open' ? 'active' : (j.status === 'closed' ? 'closed' : j.status),
        applicants: appCount(j.id),
        posted: new Date(j.createdAt).toLocaleDateString(),
        views: 0,
      }));
      localMap.forEach((j, id) => {
        if (!byId.has(id)) {
          byId.set(id, {
            id,
            title: j.title || 'Untitled Job',
            location: j.location || '',
            salary: j.salary || '',
            status: (j.status === 'open' ? 'active' : j.status) || 'active',
            applicants: appCount(id),
            posted: j.postedAt ? new Date(j.postedAt).toLocaleDateString() : '—',
            views: 0,
          });
        }
      });

      setJobsList(Array.from(byId.values()));
    } catch (err) {
      console.error('Failed to load jobs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadJobs(); }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Toggle dropdown
  const toggleMenu = (id: number) => {
    if (activeMenuId === id) {
      setActiveMenuId(null);
    } else {
      setActiveMenuId(id);
    }
  };

  // Action: Toggle job status (persisted to DB + caches)
  const handleToggleStatus = async (id: number) => {
    const target = jobsList.find(j => j.id === id);
    const nextStatus = target?.status === 'active' ? 'closed' : 'active';
    setJobsList(prev => prev.map(job => job.id === id ? { ...job, status: nextStatus } : job));
    setActiveMenuId(null);
    try {
      await updateJob(id, { status: nextStatus === 'active' ? 'open' : 'closed' });
      updateJobInCaches(id, { status: nextStatus === 'active' ? 'open' : 'closed' });
      addToast(
        t('status_updated'), 
        t('status_updated_msg', { title: target?.title || '', status: nextStatus.toUpperCase() }),
        'success'
      );
    } catch (err) {
      addToast(t('toast_publish_failed'), t('server_error_retry'), 'error');
      loadJobs();
    }
  };

  // Action: Block Quick Edit
  const handleOpenEdit = (job: JobItem) => {
    setEditingJob(job);
    setEditTitle(job.title);
    setEditLocation(job.location);
    setEditSalary(job.salary);
    setActiveMenuId(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;

    setJobsList(prev => prev.map(job => {
      if (job.id === editingJob.id) {
        return {
          ...job,
          title: editTitle,
          location: editLocation,
          salary: editSalary
        };
      }
      return job;
    }));

    try {
      await updateJob(editingJob.id, { title: editTitle, location: editLocation, salary: editSalary });
      updateJobInCaches(editingJob.id, { title: editTitle, location: editLocation, salary: editSalary });
      addToast(t('post_updated'), t('post_updated_msg', { title: editTitle }), 'success');
    } catch (err) {
      addToast(t('toast_publish_failed'), t('server_error_retry'), 'error');
      loadJobs();
    }
    setEditingJob(null);
  };

  // Action: Delete Job Posting (persisted to DB + caches)
  const handleDeleteJob = async (id: number) => {
    const target = jobsList.find(j => j.id === id);
    if (!target) return;

    // Save deleted job temporary to allow Undo
    const backupJob = { ...target };

    setJobsList(prev => prev.filter(j => j.id !== id));
    setShowDeleteConfirmId(null);
    setActiveMenuId(null);

    try {
      await deleteJob(id);
      purgeJobFromCaches(id);
      addToast(
        t('posting_deleted'), 
        t('posting_deleted_msg', { title: backupJob.title }), 
        'info'
      );
    } catch (err) {
      addToast(t('toast_publish_failed'), t('server_error_retry'), 'error');
      loadJobs();
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto relative">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 font-sans tracking-tight uppercase">{t('manage_job_postings')}</h1>
            <p className="text-gray-500 font-sans font-medium mt-1 italic">{t('manage_job_postings_desc')}</p>
          </div>
          <Link to="/dashboard/company/post" className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-sans font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
            <Plus size={20} />
            {t('post_new_job')}
          </Link>
        </header>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-center bg-white border border-gray-100 rounded-[3rem]">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest font-sans">{t('loading_jobs')}</p>
          </div>
        ) : jobsList.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 pb-20">
            {jobsList.map((job) => (
              <div key={job.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all group relative">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-black text-gray-900 font-sans tracking-tight">{job.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${
                        job.status === 'active' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-400 border-gray-100'
                      }`}>
                        {statusText(job.status)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-gray-400">
                      <div className="flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase">
                        <MapPin size={14} />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase">
                        <DollarSign size={14} />
                        {job.salary}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase">
                        <Clock size={14} />
                        {t('posted_at', { date: job.posted })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-10">
                    <div className="text-center">
                      <p className="text-2xl font-black text-blue-600 font-sans leading-none">{job.applicants}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{t('applicants_count')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black text-gray-900 font-sans leading-none">{job.views}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{t('views')}</p>
                    </div>
                    <div className="flex gap-2 relative">
                      <Link to={`/dashboard/company/applicants?jobId=${job.id}`} className="px-6 py-2.5 bg-gray-50 text-gray-700 rounded-xl font-sans font-black text-xs uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600 transition-all">
                        {t('view_talent')}
                      </Link>
                      
                      {/* 3 DOTS MENU CONTAINER */}
                      <div className="relative">
                        <button 
                          onClick={() => toggleMenu(job.id)}
                          className={`p-2.5 rounded-xl transition-all ${
                            activeMenuId === job.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-105 hover:text-gray-900'
                          }`}
                        >
                          <MoreVertical size={20} />
                        </button>

                        <AnimatePresence>
                          {activeMenuId === job.id && (
                            <>
                              <div className="fixed inset-0 z-30" onClick={() => setActiveMenuId(null)} />
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                transition={{ duration: 0.12 }}
                                className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-gray-150 shadow-2xl z-40 p-2 overflow-hidden"
                              >
                                <button 
                                  onClick={() => handleToggleStatus(job.id)}
                                  className="w-full text-left px-4 py-3 text-xs font-black text-gray-700 hover:text-blue-600 hover:bg-blue-50/55 rounded-xl transition-all flex items-center gap-2.5 uppercase tracking-wider"
                                >
                                  {job.status === 'active' ? (
                                    <>
                                      <ToggleRight size={16} className="text-green-500" />
                                      <span>{t('close_application')}</span>
                                    </>
                                  ) : (
                                    <>
                                      <ToggleLeft size={16} className="text-gray-400" />
                                      <span>{t('publish_active')}</span>
                                    </>
                                  )}
                                </button>
                                
                                <button 
                                  onClick={() => handleOpenEdit(job)}
                                  className="w-full text-left px-4 py-3 text-xs font-black text-gray-700 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl transition-all flex items-center gap-2.5 uppercase tracking-wider"
                                >
                                  <Edit size={16} className="text-indigo-550" />
                                  <span>{t('edit_details')}</span>
                                </button>

                                <div className="border-t border-gray-100 my-1.5" />

                                <button 
                                  onClick={() => {
                                    setShowDeleteConfirmId(job.id);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-3 text-xs font-black text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all flex items-center gap-2.5 uppercase tracking-wider animate-pulse"
                                >
                                  <Trash2 size={16} />
                                  <span>{t('delete_post')}</span>
                                </button>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-white border border-dashed border-gray-200 rounded-[3rem]">
            <Briefcase className="mx-auto text-gray-300 mb-4 animate-bounce" size={48} />
            <h3 className="text-xl font-black text-gray-900 font-sans uppercase">{t('no_job_postings_tracked')}</h3>
            <p className="text-gray-400 font-sans italic text-sm mt-1 max-w-sm mx-auto">{t('no_job_postings_tracked_desc')}</p>
            <Link to="/dashboard/company/post" className="inline-flex items-center gap-2 bg-blue-600 text-white mt-8 px-6 py-3.5 rounded-2xl font-sans font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
              <Plus size={16} />
              {t('publish_first_job')}
            </Link>
          </div>
        )}
      </div>

      {/* QUICK DETAILS EDIT MODAL */}
      <AnimatePresence>
        {editingJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-950/65 backdrop-blur-sm"
              onClick={() => setEditingJob(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 md:p-10 shadow-2xl relative border border-gray-100 z-10"
            >
              <button 
                onClick={() => setEditingJob(null)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-50 text-gray-400 bg-gray-50 flex items-center justify-center border border-gray-100"
              >
                <X size={20} />
              </button>

              <h3 className="text-2xl font-black text-gray-900 font-sans uppercase tracking-tight mb-1">{t('edit_job_details')}</h3>
              <p className="text-xs text-gray-400 font-sans italic mb-8">{t('edit_job_details_desc')}</p>

              <form onSubmit={handleSaveEdit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('job_title')}</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-5 py-3.5 rounded-xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold text-sm text-gray-950 transition-all focus:ring-4 focus:ring-blue-10%"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('location_city')}</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-5 py-3.5 rounded-xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold text-sm text-gray-950 transition-all focus:ring-4 focus:ring-blue-10%"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('salary_budget')}</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-5 py-3.5 rounded-xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold text-sm text-gray-950 transition-all focus:ring-4 focus:ring-blue-10%"
                      value={editSalary}
                      onChange={(e) => setEditSalary(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-6 grid grid-cols-2 gap-3.5">
                  <button 
                    type="button" 
                    onClick={() => setEditingJob(null)}
                    className="py-4 bg-gray-50 hover:bg-gray-100 rounded-2xl border border-gray-150 text-gray-600 font-sans font-black uppercase text-[10px] tracking-widest transition-all"
                  >
                    {t('cancel')}
                  </button>
                  <button 
                    type="submit"
                    className="py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-sans font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-1.5"
                  >
                    {t('save_changes')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION INTERACTIVE DIALOG */}
      <AnimatePresence>
        {showDeleteConfirmId !== null && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm"
              onClick={() => setShowDeleteConfirmId(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl relative border border-gray-100 z-10 text-center"
            >
              <div className="h-14 w-14 bg-red-50 text-red-655 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Trash2 size={24} />
              </div>
              <h3 className="text-xl font-black text-gray-950 font-sans uppercase">{t('delete_posting_confirm')}</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-sans font-semibold italic mt-2">
                {t('delete_posting_confirm_desc')}
              </p>

              <div className="mt-8 grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setShowDeleteConfirmId(null)}
                  className="py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl font-sans font-black uppercase text-[9px] tracking-widest transition-all"
                >
                  {t('no_keep')}
                </button>
                <button 
                  onClick={() => handleDeleteJob(showDeleteConfirmId)}
                  className="py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-sans font-black uppercase text-[9px] tracking-widest transition-all"
                >
                  {t('yes_delete')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOATING TOAST SYSTEM */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="pointer-events-auto w-full bg-white rounded-3xl border border-gray-150 p-5 shadow-2xl flex items-start gap-4 relative overflow-hidden"
            >
              <div className={`absolute top-0 bottom-0 left-0 w-2 shrink-0 ${
                t.type === 'error' ? 'bg-red-500' : 'bg-green-500'
              }`} />
              
              <div className="flex-1 pl-1">
                <p className="font-sans font-black uppercase tracking-[0.1em] text-[10px] text-gray-400 mb-0.5">{t.title}</p>
                <p className="font-sans text-[11.5px] font-bold text-gray-850 leading-normal">{t.message}</p>
              </div>
              <button 
                onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                className="text-gray-300 hover:text-gray-500 transition-colors p-1 shrink-0 cursor-pointer"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

