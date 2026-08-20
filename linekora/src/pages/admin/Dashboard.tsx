import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, Briefcase, ShieldCheck, Bell, Settings, Activity,
  LogOut, RefreshCw, Search, Eye, Ban, CheckCircle2, XCircle, Check, X,
  Trash2, Send, User, Lock, Mail, Phone, MapPin, CalendarDays, IdCard,
  Percent, DollarSign, Shield, AlertTriangle, Clock, BadgeCheck, Smartphone, Star, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { useLanguage } from '../../lib/LanguageContext';
import {
  getUsers, updateUser, getPendingVerifications, getJobs, updateJob,
  deleteJob, getApplications, createNotification, getStats,
  type UserProfile, type Job, type Application, type VerificationSubmission, type PlatformStats,
} from '../../lib/api';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';

type TabId = 'dashboard' | 'users' | 'jobs' | 'verification' | 'notifications' | 'settings' | 'activity';

interface AuditLog {
  id: string;
  action: string;
  category: 'SECURITY' | 'FINANCIAL' | 'SAFETY' | 'SYSTEM';
  date: string;
  user: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [notification, setNotification] = useState<{ id: number; message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [idleTime, setIdleTime] = useState(0);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);

  // ─── REAL DATA ────────────────────────────────────────────────────────────
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [verificationQueue, setVerificationQueue] = useState<VerificationSubmission[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const cached = localStorage.getItem('admin_audit_logs');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  });

  const [bannedIds, setBannedIds] = useState<string[]>(() => {
    const cached = localStorage.getItem('admin_banned_users');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  });
  const [suspendedIds, setSuspendedIds] = useState<string[]>(() => {
    const cached = localStorage.getItem('admin_suspended_users');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  });

  const persistAudit = (logs: AuditLog[]) => {
    setAuditLogs(logs);
    localStorage.setItem('admin_audit_logs', JSON.stringify(logs));
  };

  const addAudit = (action: string, category: AuditLog['category']) => {
    const entry: AuditLog = {
      id: `log_${Date.now()}`,
      action,
      category,
      date: new Date().toLocaleString(),
      user: 'Linekora Admin',
    };
    persistAudit([entry, ...auditLogs].slice(0, 200));
  };

  const fetchAll = async () => {
    try {
      const [apiUsers, apiJobs, apiApps, pending, apiStats] = await Promise.all([
        getUsers(),
        getJobs({ includeExpired: true }),
        getApplications({}),
        getPendingVerifications(),
        getStats(),
      ]);
      setUsers(apiUsers.filter(u => u.role !== 'ADMIN'));
      setJobs(apiJobs);
      setApplications(apiApps);
      setVerificationQueue(pending);
      setStats(apiStats);
    } catch (err) {
      console.error('Failed to fetch admin data', err);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, []);

  // ─── TOAST ────────────────────────────────────────────────────────────────
  const triggerNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ id: Date.now(), message, type });
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // ─── INACTIVITY AUTO-LOGOUT ──────────────────────────────────────────────
  useEffect(() => {
    let intervalId: any;
    const resetIdleTimer = () => {
      setIdleTime(0);
      setShowInactivityWarning(false);
    };
    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('mousedown', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);
    window.addEventListener('scroll', resetIdleTimer);
    window.addEventListener('touchstart', resetIdleTimer);

    intervalId = setInterval(() => {
      setIdleTime(prev => {
        const nextTime = prev + 1;
        if (nextTime === 270) {
          setShowInactivityWarning(true);
        }
        if (nextTime >= 300) {
          clearInterval(intervalId);
          navigate('/login?reason=idle_timeout');
        }
        return nextTime;
      });
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('mousedown', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
      window.removeEventListener('scroll', resetIdleTimer);
      window.removeEventListener('touchstart', resetIdleTimer);
      clearInterval(intervalId);
    };
  }, [navigate]);

  const handleLogoutAdmin = async () => {
    triggerNotification(t('toast_logging_out'), "info");
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Error signing out admin:', err);
    }
    setTimeout(() => {
      window.location.href = '/login';
    }, 800);
  };

  // ─── HELPERS ──────────────────────────────────────────────────────────────
  const roleLabel = (r: string) => {
    const map: Record<string, string> = {
      WORKER: t('role_worker'),
      EMPLOYER: t('role_employer'),
      COMPANY: t('role_company'),
    };
    return map[r] || r;
  };

  const statusLabel = (u: UserProfile) => {
    if (bannedIds.includes(u.id)) return t('status_banned');
    if (suspendedIds.includes(u.id)) return t('status_suspended');
    if (u.verificationStatus === 'verified') return t('status_verified');
    if (u.verificationStatus === 'pending') return t('status_pending');
    return t('status_unverified');
  };

  const jobStatusLabel = (s: string) => ({
    open: t('jobs_active'),
    accepted: t('status_contract_active'),
    completion_requested: t('status_completion_requested'),
    completed: t('jobs_completed'),
    cancelled: t('jobs_cancelled'),
    expired: t('jobs_expired'),
  }[s] || s);

  const fmtDate = (d?: string) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return d;
    }
  };

  const rejectionReasonOf = (u: UserProfile) => {
    try {
      const raw = u.verificationData;
      if (!raw) return '';
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return parsed?.rejectionReason || '';
    } catch {
      return '';
    }
  };

  const workerNamesForJob = (jobId: number) => {
    const names = applications
      .filter(a => a.jobId === jobId)
      .map(a => a.worker?.displayName)
      .filter(Boolean);
    return names.length ? names.join(', ') : t('not_assigned');
  };

  // ─── USER ACTIONS ─────────────────────────────────────────────────────────
  const handleVerifyUser = async (u: UserProfile) => {
    try {
      const nextTrust = Math.min(u.trustScore + 20, 100);
      await updateUser(u.id, { verificationStatus: 'verified', trustScore: nextTrust });
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, verificationStatus: 'verified', trustScore: nextTrust } : x));
      try {
        await createNotification({
          userId: u.id,
          title: t('verif_notif_approved_title'),
          body: t('verif_notif_approved_body', { name: u.displayName }),
          type: 'success',
        });
      } catch (e) { console.error('Failed to notify user of approval', e); }
      addAudit(t('audit_verification_approved', { name: u.displayName, id: u.id }), 'SECURITY');
      triggerNotification(t('toast_verification_approved', { name: u.displayName }));
    } catch (err) {
      console.error(err);
      triggerNotification(t('toast_action_failed'), 'error');
    }
  };

  const handleSuspendUser = async (u: UserProfile) => {
    const next = new Set(suspendedIds);
    if (next.has(u.id)) {
      next.delete(u.id);
    } else {
      next.add(u.id);
    }
    const arr = Array.from(next);
    setSuspendedIds(arr);
    localStorage.setItem('admin_suspended_users', JSON.stringify(arr));
    addAudit(t('audit_status_modified', { name: u.displayName, status: next.has(u.id) ? t('status_suspended') : t('status_active') }), 'SYSTEM');
    triggerNotification(t('toast_status_adjusted', { status: next.has(u.id) ? t('status_suspended') : t('status_active') }));
  };

  const handleBanUser = async (u: UserProfile) => {
    const next = new Set(bannedIds);
    next.add(u.id);
    const arr = Array.from(next);
    setBannedIds(arr);
    localStorage.setItem('admin_banned_users', JSON.stringify(arr));
    try {
      await updateUser(u.id, { trustScore: 0 });
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, trustScore: 0 } : x));
    } catch (err) {
      console.error(err);
    }
    addAudit(t('audit_account_banned', { reportedName: u.displayName, reason: 'Manual admin action' }), 'SAFETY');
    triggerNotification(t('toast_account_banned', { reportedName: u.displayName }), 'error');
  };

  // ─── JOB ACTIONS ──────────────────────────────────────────────────────────
  const handleHideJob = async (j: Job) => {
    try {
      await updateJob(j.id, { status: 'cancelled' });
      setJobs(prev => prev.map(x => x.id === j.id ? { ...x, status: 'cancelled' } : x));
      addAudit(t('audit_job_hidden', { title: j.title }), 'SYSTEM');
      triggerNotification(t('toast_job_hidden', { title: j.title }));
    } catch (err) {
      console.error(err);
      triggerNotification(t('toast_action_failed'), 'error');
    }
  };

  const handleDeleteJob = async (j: Job) => {
    try {
      await deleteJob(j.id);
      setJobs(prev => prev.filter(x => x.id !== j.id));
      addAudit(t('audit_job_deleted', { title: j.title }), 'SYSTEM');
      triggerNotification(t('toast_job_deleted', { title: j.title }));
    } catch (err) {
      console.error(err);
      triggerNotification(t('toast_action_failed'), 'error');
    }
  };

  // ─── VERIFICATION ACTIONS ─────────────────────────────────────────────────
  const handleApproveVerification = async (v: VerificationSubmission) => {
    try {
      await updateUser(v.id, { verificationStatus: 'verified', trustScore: Math.min(v.trustScore + 15, 100) });
      try {
        await createNotification({
          userId: v.id,
          title: t('verif_notif_approved_title'),
          body: t('verif_notif_approved_body', { name: v.displayName }),
          type: 'success',
        });
      } catch (e) { console.error('Failed to notify user of approval', e); }
      setVerificationQueue(prev => prev.filter(x => x.id !== v.id));
      setUsers(prev => prev.map(u => u.id === v.id ? { ...u, verificationStatus: 'verified' } : u));
      addAudit(t('audit_verification_approved', { name: v.displayName, id: v.id }), 'SECURITY');
      triggerNotification(t('toast_verification_approved', { name: v.displayName }));
    } catch (err) {
      console.error(err);
      triggerNotification(t('toast_action_failed'), 'error');
    }
  };

  const [rejectingVerification, setRejectingVerification] = useState<VerificationSubmission | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleRejectVerification = async (v: VerificationSubmission) => {
    const reason = rejectReason.trim();
    if (!reason) {
      triggerNotification(t('verif_reject_reason_required'), 'error');
      return;
    }
    try {
      const mergedData = { ...((v.verificationData || {}) as any), rejectionReason: reason, rejectedAt: new Date().toISOString() };
      await updateUser(v.id, { verificationStatus: 'unverified', verificationData: JSON.stringify(mergedData) });
      try {
        await createNotification({
          userId: v.id,
          title: t('verif_notif_rejected_title'),
          body: t('verif_notif_rejected_body', { name: v.displayName, reason }),
          type: 'warning',
        });
      } catch (e) { console.error('Failed to notify user of rejection', e); }
      setVerificationQueue(prev => prev.filter(x => x.id !== v.id));
      setUsers(prev => prev.map(u => u.id === v.id ? { ...u, verificationStatus: 'unverified' } : u));
      addAudit(t('audit_verification_rejected', { name: v.displayName, id: v.id }), 'SECURITY');
      triggerNotification(t('toast_verification_rejected', { name: v.displayName }), 'error');
      setRejectingVerification(null);
      setRejectReason('');
    } catch (err) {
      console.error(err);
      triggerNotification(t('toast_action_failed'), 'error');
    }
  };

  // ─── NOTIFICATION COMPOSER ────────────────────────────────────────────────
  const [notifAudience, setNotifAudience] = useState<'all' | 'workers' | 'employers' | 'companies' | 'specific'>('all');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [notifType, setNotifType] = useState<'info' | 'success' | 'urgent' | 'warning'>('info');
  const [notifTargetUser, setNotifTargetUser] = useState<UserProfile | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  const [sentNotifs, setSentNotifs] = useState<{ id: string; title: string; body: string; audience: string; type: string; count: number; date: string }[]>(() => {
    const cached = localStorage.getItem('admin_sent_notifications');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  });

  const persistSentNotifs = (list: typeof sentNotifs) => {
    setSentNotifs(list);
    localStorage.setItem('admin_sent_notifications', JSON.stringify(list));
  };

  const matchingUsers = userSearchQuery.trim()
    ? users.filter(u =>
        u.displayName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        (u.phone || '').toLowerCase().includes(userSearchQuery.toLowerCase())
      ).slice(0, 6)
    : users.slice(0, 6);

  const audienceLabel = (id: typeof notifAudience) => {
    if (id === 'all') return t('notif_all_users');
    if (id === 'workers') return t('users_workers');
    if (id === 'employers') return t('users_employers');
    if (id === 'companies') return t('users_companies');
    return notifTargetUser?.displayName || t('notif_specific_user');
  };

  const notifTargetCount = (() => {
    if (notifAudience === 'specific') return notifTargetUser ? 1 : 0;
    let targets = users;
    if (notifAudience === 'workers') targets = users.filter(u => u.role === 'WORKER');
    if (notifAudience === 'employers') targets = users.filter(u => u.role === 'EMPLOYER');
    if (notifAudience === 'companies') targets = users.filter(u => u.role === 'COMPANY');
    return targets.length;
  })();

  const handleSendNotification = async () => {
    if (!notifTitle.trim() || !notifBody.trim()) {
      triggerNotification(t('notif_fields_required'), 'error');
      return;
    }
    let targets = users;
    if (notifAudience === 'workers') targets = users.filter(u => u.role === 'WORKER');
    if (notifAudience === 'employers') targets = users.filter(u => u.role === 'EMPLOYER');
    if (notifAudience === 'companies') targets = users.filter(u => u.role === 'COMPANY');
    if (notifAudience === 'specific') targets = notifTargetUser ? [notifTargetUser] : [];

    if (targets.length === 0) {
      triggerNotification(t('notif_no_targets'), 'error');
      return;
    }

    try {
      await Promise.all(targets.map(u =>
        createNotification({ userId: u.id, title: notifTitle, body: notifBody, type: notifType })
      ));
      persistSentNotifs([
        {
          id: `sent_${Date.now()}`,
          title: notifTitle,
          body: notifBody,
          audience: audienceLabel(notifAudience),
          type: notifType,
          count: targets.length,
          date: new Date().toLocaleString(),
        },
        ...sentNotifs,
      ].slice(0, 200));
      addAudit(t('audit_notification_sent', { count: targets.length, title: notifTitle }), 'SYSTEM');
      triggerNotification(t('notif_sent_success', { count: targets.length }));
      setNotifTitle('');
      setNotifBody('');
    } catch (err) {
      console.error(err);
      triggerNotification(t('toast_action_failed'), 'error');
    }
  };

  // ─── SETTINGS (localStorage-backed) ───────────────────────────────────────
  const [settings, setSettings] = useState(() => {
    const cached = localStorage.getItem('admin_settings');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return {
      platformName: 'LINEKORA',
      contactEmail: 'Nfivelabs@gmail.com',
      commissionRate: 5,
      smsProvider: 'MTN Rwanda',
      smsSenderId: 'LINEKORA',
      smtpHost: 'smtp.gmail.com',
      smtpFrom: 'Nfivelabs@gmail.com',
    };
  });

  const saveSettings = (patch: Partial<typeof settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    localStorage.setItem('admin_settings', JSON.stringify(next));
    triggerNotification(t('settings_saved'));
  };

  // ─── VIEW MODALS ──────────────────────────────────────────────────────────
  const [inspectingUser, setInspectingUser] = useState<UserProfile | null>(null);
  const [inspectingJob, setInspectingJob] = useState<Job | null>(null);

  // ─── DERIVED DASHBOARD DATA ───────────────────────────────────────────────
  const activeJobsCount = stats?.activeJobs ?? jobs.filter(j => ['open', 'accepted', 'completion_requested'].includes(j.status)).length;
  const totalUsers = stats?.totalUsers ?? users.length;
  const pendingVerifications = stats?.pendingVerifications ?? verificationQueue.length;
  const pendingReports = 0;

  const recentActivities: { icon: string; text: string; time: string; color: string }[] = [];
  const recentUsers = [...users].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const recentJobs = [...jobs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (recentUsers[0]) {
    recentActivities.push({ icon: 'user', text: t('act_new_worker', { name: recentUsers[0].displayName }), time: fmtDate(recentUsers[0].createdAt), color: 'blue' });
  }
  if (verificationQueue.length > 0) {
    recentActivities.push({ icon: 'shield', text: t('act_pending_verification', { count: verificationQueue.length }), time: t('time_recently'), color: 'amber' });
  }
  if (recentJobs[0]) {
    recentActivities.push({ icon: 'briefcase', text: t('act_new_job', { title: recentJobs[0].title }), time: fmtDate(recentJobs[0].createdAt), color: 'green' });
  }
  const verifiedToday = users.filter(u => u.verificationStatus === 'verified');
  if (verifiedToday.length > 0) {
    recentActivities.push({ icon: 'check', text: t('act_verified_accounts', { count: verifiedToday.length }), time: t('time_recently'), color: 'indigo' });
  }
  if (auditLogs.length > 0) {
    recentActivities.push({ icon: 'activity', text: auditLogs[0].action, time: auditLogs[0].date, color: 'gray' });
  }

  // ─── FILTERS ──────────────────────────────────────────────────────────────
  const [userSearch, setUserSearch] = useState('');
  const [userRole, setUserRole] = useState<'all' | 'WORKER' | 'EMPLOYER' | 'COMPANY'>('all');
  const [userStatus, setUserStatus] = useState<'all' | 'verified' | 'pending' | 'suspended'>('all');
  const [jobSearch, setJobSearch] = useState('');
  const [jobStatus, setJobStatus] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [verifTab, setVerifTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const filteredUsers = users.filter(u => {
    const matchRole = userRole === 'all' || u.role === userRole;
    const q = userSearch.toLowerCase();
    const matchSearch = !q || u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone || '').toLowerCase().includes(q);
    const matchStatus =
      userStatus === 'all' ? true :
      userStatus === 'suspended' ? (bannedIds.includes(u.id) || suspendedIds.includes(u.id)) :
      userStatus === 'verified' ? u.verificationStatus === 'verified' :
      u.verificationStatus === 'pending';
    return matchRole && matchSearch && matchStatus;
  });

  const filteredJobs = jobs.filter(j => {
    const matchStatus =
      jobStatus === 'all' ? true :
      jobStatus === 'active' ? ['open', 'accepted', 'completion_requested'].includes(j.status) :
      j.status === jobStatus;
    const q = jobSearch.toLowerCase();
    const matchSearch = !q || j.title.toLowerCase().includes(q) || (j.location || '').toLowerCase().includes(q) || (j.employer?.displayName || '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const approvedUsers = users.filter(u => u.verificationStatus === 'verified');
  const rejectedUsers = users.filter(u => u.verificationStatus === 'unverified');

  const iconFor = (icon: string) => {
    if (icon === 'user') return <User size={14} />;
    if (icon === 'shield') return <ShieldCheck size={14} />;
    if (icon === 'briefcase') return <Briefcase size={14} />;
    if (icon === 'check') return <CheckCircle2 size={14} />;
    return <Activity size={14} />;
  };

  const colorFor = (color: string) => {
    return {
      blue: 'text-blue-400',
      amber: 'text-amber-400',
      green: 'text-green-400',
      indigo: 'text-indigo-400',
      gray: 'text-gray-400',
    }[color] || 'text-gray-400';
  };

  // ─── NAV ITEMS ────────────────────────────────────────────────────────────
  const navItems: { id: TabId; label: string; icon: any; badge?: number }[] = [
    { id: 'dashboard', label: t('nav_dashboard'), icon: LayoutDashboard },
    { id: 'users', label: t('nav_users'), icon: Users, badge: users.length },
    { id: 'jobs', label: t('nav_jobs'), icon: Briefcase, badge: jobs.length },
    { id: 'verification', label: t('nav_verification'), icon: ShieldCheck, badge: verificationQueue.length },
    { id: 'notifications', label: t('nav_notifications'), icon: Bell },
    { id: 'settings', label: t('nav_settings'), icon: Settings },
    { id: 'activity', label: t('nav_activity'), icon: Activity },
  ];

  const headerTitle = (() => {
    switch (activeTab) {
      case 'dashboard': return t('header_dashboard');
      case 'users': return t('header_users');
      case 'jobs': return t('header_jobs');
      case 'verification': return t('header_verification');
      case 'notifications': return t('header_notifications');
      case 'settings': return t('header_settings');
      case 'activity': return t('header_activity');
    }
  })();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col md:flex-row font-sans selection:bg-red-500/25">

      {/* Toast Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-2xl border flex items-center gap-3 font-sans text-xs font-bold max-w-sm ${
              notification.type === 'success' ? 'bg-green-950 text-green-300 border-green-800' :
              notification.type === 'error' ? 'bg-red-950 text-red-300 border-red-900' :
              'bg-blue-950 text-blue-300 border-blue-800'
            }`}
          >
            {notification.type === 'success' && <CheckCircle2 size={18} className="text-green-400 shrink-0" />}
            {notification.type === 'error' && <AlertTriangle size={18} className="text-red-400 shrink-0" />}
            {notification.type === 'info' && <Activity size={18} className="text-blue-400 shrink-0" />}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject verification modal */}
      <AnimatePresence>
        {rejectingVerification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => { setRejectingVerification(null); setRejectReason(''); }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-gray-905 border border-gray-800 rounded-[2rem] p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 bg-red-950/40 text-red-400 border border-red-900/40 rounded-xl flex items-center justify-center shrink-0">
                  <XCircle size={18} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">{t('verif_reject_reason')}</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider truncate">{rejectingVerification.displayName}</p>
                </div>
              </div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={t('verif_reject_reason_placeholder')}
                rows={3}
                autoFocus
                className="w-full p-3 bg-gray-950 border border-gray-900 focus:border-red-600 rounded-xl outline-none font-sans font-bold text-xs text-white resize-none"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setRejectingVerification(null); setRejectReason(''); }}
                  className="flex-1 py-3 bg-gray-950 border border-gray-900 text-gray-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => handleRejectVerification(rejectingVerification)}
                  disabled={!rejectReason.trim()}
                  className="flex-1 py-3 bg-red-650 hover:bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <X size={12} />
                  {t('verif_confirm_reject')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="w-full md:w-72 border-b md:border-b-0 md:border-r border-gray-900 flex flex-col p-6 bg-gray-950 md:sticky md:top-0 md:h-screen shrink-0 font-sans">
        <div className="flex items-center gap-3.5 mb-8">
          <div className="h-10 w-10 bg-red-650 rounded-xl flex items-center justify-center text-white shadow-xl shadow-red-900/10 shrink-0">
            <Lock size={20} />
          </div>
          <div>
            <span className="font-sans text-base font-black tracking-tight block text-white">LINEKORA Admin</span>
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-none bg-gray-900 px-1.5 py-0.5 rounded border border-gray-800">{t('badge_super_ops')}</span>
          </div>
        </div>

        <nav className="space-y-1 my-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-sans text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === item.id
                  ? 'bg-red-650 hover:bg-red-600 text-white shadow-xl shadow-red-950/25 border border-red-500/25'
                  : 'text-gray-400 hover:text-gray-250 hover:bg-gray-900 border border-transparent'
              }`}
            >
              <item.icon size={16} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                  activeTab === item.id ? 'bg-white text-red-600' : 'bg-red-950/40 text-red-500 border border-red-900/40'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}

          {/* Payments — coming soon (escrow architecture is being designed) */}
          <button
            type="button"
            disabled
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-sans text-xs font-black uppercase tracking-wider text-gray-600 border border-gray-900 cursor-not-allowed opacity-70"
            title={t('payments_soon_tip')}
          >
            <DollarSign size={16} />
            <span className="flex-1 text-left">{t('nav_payments')}</span>
            <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-gray-900 text-gray-500 border border-gray-800">{t('badge_soon')}</span>
          </button>
        </nav>

        {/* Admin Profile */}
        <div className="mt-auto border-t border-gray-900 pt-6">
          <div className="flex items-center gap-3 px-2 py-1.5 mb-4 justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-red-950/30 text-red-400 border border-red-900/40 rounded-full flex items-center justify-center text-sm font-black uppercase shadow-inner">
                LA
              </div>
              <div>
                <p className="text-xs font-black text-gray-200 uppercase tracking-wider font-sans leading-none mb-1">Linekora Admin</p>
                <div className="flex items-center gap-1.5 text-[8px] tracking-[0.1em] font-black uppercase text-red-500 select-none">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
                  {t('session_active')}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogoutAdmin}
              title={t('logout_title')}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-950/20 rounded-xl border border-transparent hover:border-red-950/30 transition-all cursor-pointer shrink-0"
            >
              <LogOut size={16} />
            </button>
          </div>
          <button
            type="button"
            onClick={handleLogoutAdmin}
            className="w-full py-3 bg-red-950/15 border border-red-900/30 hover:border-red-600 text-red-400 hover:text-white rounded-xl text-center text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-sm active:scale-95"
          >
            {t('end_session')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto bg-gray-950 select-none font-sans">

        {/* Header */}
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-900 pb-8">
          <div>
            <h1 className="text-2xl font-black font-sans tracking-tight text-white uppercase flex items-center gap-2.5">
              {headerTitle}
            </h1>
            <p className="text-gray-400 font-sans font-black mt-1.5 uppercase tracking-[0.25em] text-[10px] flex items-center gap-1.5 leading-none">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
              {t('ops_desk_cluster')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              fetchAll();
              triggerNotification(t('toast_index_up_to_date'));
            }}
            className="p-2.5 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white rounded-xl border border-gray-800 transition-all cursor-pointer"
            title={t('refresh_title')}
          >
            <RefreshCw size={14} className="hover:rotate-180 transition-transform duration-500" />
          </button>
        </header>

        {/* ═══════════ DASHBOARD ═══════════ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: t('dash_total_users'), value: totalUsers.toLocaleString(), color: 'text-indigo-400', icon: <Users size={18} /> },
                { label: t('dash_active_jobs'), value: activeJobsCount.toLocaleString(), color: 'text-blue-400', icon: <Briefcase size={18} /> },
                { label: t('dash_pending_verifications'), value: pendingVerifications.toLocaleString(), color: 'text-amber-400', icon: <ShieldCheck size={18} /> },
                { label: t('dash_pending_reports'), value: pendingReports.toLocaleString(), color: 'text-red-400', icon: <AlertTriangle size={18} /> },
              ].map((stat, i) => (
                <div key={i} className="p-5 bg-gray-905 border border-gray-900 rounded-[2rem] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                    <span className={stat.color}>{stat.icon}</span>
                  </div>
                  <div className="my-2 flex items-baseline gap-1.5">
                    <span className={`text-2xl font-extrabold font-sans tracking-tight ${stat.color}`}>{stat.value}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Activities */}
              <div className="bg-gray-905 p-6 rounded-[2.5rem] border border-gray-900">
                <h3 className="text-xs font-black text-gray-300 uppercase tracking-widest mb-5">{t('dash_recent_activities')}</h3>
                <div className="space-y-3">
                  {recentActivities.length > 0 ? recentActivities.slice(0, 6).map((act, i) => (
                    <div key={i} className="p-3.5 bg-gray-950 rounded-xl border border-gray-900 flex items-center gap-3">
                      <span className={`h-8 w-8 rounded-lg bg-gray-900 flex items-center justify-center shrink-0 ${colorFor(act.color)}`}>
                        {iconFor(act.icon)}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-200 truncate">{act.text}</p>
                        <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold mt-0.5">{act.time}</p>
                      </div>
                    </div>
                  )) : (
                    <p className="py-12 text-center text-gray-500 font-sans text-xs italic font-semibold">{t('no_system_warnings')}</p>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-905 p-6 rounded-[2.5rem] border border-gray-900">
                <h3 className="text-xs font-black text-gray-300 uppercase tracking-widest mb-5">{t('dash_quick_actions')}</h3>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('verification')}
                    className="w-full p-4 bg-gray-950 border border-gray-900 hover:border-red-600 rounded-2xl flex items-center gap-4 transition-all cursor-pointer text-left"
                  >
                    <span className="h-10 w-10 bg-red-950/30 text-red-400 border border-red-900/40 rounded-xl flex items-center justify-center">
                      <ShieldCheck size={18} />
                    </span>
                    <div>
                      <p className="text-sm font-black text-white">{t('dash_verify_users')}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{t('dash_verify_hint', { count: pendingVerifications })}</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('notifications')}
                    className="w-full p-4 bg-gray-950 border border-gray-900 hover:border-blue-600 rounded-2xl flex items-center gap-4 transition-all cursor-pointer text-left"
                  >
                    <span className="h-10 w-10 bg-blue-950/30 text-blue-400 border border-blue-900/40 rounded-xl flex items-center justify-center">
                      <Bell size={18} />
                    </span>
                    <div>
                      <p className="text-sm font-black text-white">{t('dash_send_notification')}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{t('dash_notify_hint')}</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('activity')}
                    className="w-full p-4 bg-gray-950 border border-gray-900 hover:border-emerald-600 rounded-2xl flex items-center gap-4 transition-all cursor-pointer text-left"
                  >
                    <span className="h-10 w-10 bg-green-950/30 text-green-400 border border-green-900/40 rounded-xl flex items-center justify-center">
                      <Activity size={18} />
                    </span>
                    <div>
                      <p className="text-sm font-black text-white">{t('dash_view_activity')}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{t('dash_activity_hint')}</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ USERS ═══════════ */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Role summary counts */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: t('users_workers'), count: users.filter(u => u.role === 'WORKER').length, color: 'text-blue-400' },
                { label: t('users_employers'), count: users.filter(u => u.role === 'EMPLOYER').length, color: 'text-indigo-400' },
                { label: t('users_companies'), count: users.filter(u => u.role === 'COMPANY').length, color: 'text-emerald-400' },
              ].map((c, i) => (
                <div key={i} className="p-5 bg-gray-905 border border-gray-900 rounded-[2rem]">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{c.label}</p>
                  <p className={`text-2xl font-extrabold font-sans tracking-tight mt-1 ${c.color}`}>{c.count.toLocaleString()}</p>
                </div>
              ))}
            </div>

            {/* Search + filters */}
            <div className="bg-gray-905 p-6 rounded-[2.5rem] border border-gray-900 flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="relative w-full lg:w-80 font-sans">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder={t('users_search_placeholder')}
                  className="w-full pl-10 pr-4 py-3 bg-gray-950 border border-gray-900 rounded-xl text-xs font-bold outline-none focus:border-red-600 font-sans text-white"
                />
              </div>
              <div className="flex gap-2 shrink-0 flex-wrap">
                {(['all', 'WORKER', 'EMPLOYER', 'COMPANY'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setUserRole(r)}
                    className={`px-4 py-2.5 rounded-xl text-[9px] uppercase tracking-wider font-black transition-all cursor-pointer ${
                      userRole === r ? 'bg-red-650 hover:bg-red-600 border border-red-500/25 text-white' : 'bg-gray-950 border border-gray-850 text-gray-400 hover:text-white'
                    }`}
                  >
                    {r === 'all' ? t('filter_all') : roleLabel(r)}
                  </button>
                ))}
              </div>
            </div>

            {/* Status filter */}
            <div className="flex gap-2 flex-wrap">
              {([
                { id: 'all', label: t('filter_all') },
                { id: 'verified', label: t('status_verified') },
                { id: 'pending', label: t('status_pending') },
                { id: 'suspended', label: t('status_suspended') },
              ] as const).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setUserStatus(s.id)}
                  className={`px-3.5 py-2 rounded-xl text-[9px] uppercase tracking-wider font-black transition-all cursor-pointer ${
                    userStatus === s.id ? 'bg-red-650 text-white' : 'bg-gray-900 border border-gray-850 text-gray-400 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Users table */}
            <div className="bg-gray-905 border border-gray-900 rounded-[2.5rem] overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full text-left font-sans min-w-[800px]">
                <thead className="bg-gray-950 border-b border-gray-900 text-[10px] font-black uppercase text-gray-500 tracking-widest">
                  <tr>
                    <th className="px-6 py-4">{t('users_photo')}</th>
                    <th className="px-6 py-4">{t('users_name')}</th>
                    <th className="px-6 py-4">{t('users_phone')}</th>
                    <th className="px-6 py-4">{t('users_status')}</th>
                    <th className="px-6 py-4">{t('users_trust_score')}</th>
                    <th className="px-6 py-4">{t('users_joined')}</th>
                    <th className="px-6 py-4 text-right">{t('users_actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-900">
                  {filteredUsers.length > 0 ? filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-900/15 transition-all">
                      <td className="px-6 py-4">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={u.displayName} className="h-9 w-9 rounded-full object-cover border border-gray-800" />
                        ) : (
                          <div className="h-9 w-9 bg-gray-900 border border-gray-800 rounded-full flex items-center justify-center text-xs font-black text-gray-400 uppercase">
                            {u.displayName.slice(0, 2)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-150 text-sm">{u.displayName}</span>
                          <span className="text-[8px] tracking-wider font-extrabold uppercase bg-gray-950 text-gray-400 border border-gray-800 px-2 py-0.5 rounded">
                            {roleLabel(u.role)}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1 uppercase font-black tracking-wider">{u.email}</p>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-bold text-gray-300">{u.phone || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest inline-flex items-center gap-1 leading-none ${
                          bannedIds.includes(u.id) ? 'bg-red-651/10 text-red-400 border border-red-550/20' :
                          suspendedIds.includes(u.id) ? 'bg-amber-652/10 text-amber-500 border border-amber-550/20' :
                          u.verificationStatus === 'verified' ? 'bg-green-650/10 text-green-400 border border-green-550/20' :
                          u.verificationStatus === 'pending' ? 'bg-yellow-950/30 text-yellow-500 border border-yellow-905' :
                          'bg-gray-900 text-gray-500 border border-gray-800'
                        }`}>
                          {statusLabel(u)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-mono font-black ${u.trustScore >= 80 ? 'text-green-400' : u.trustScore >= 50 ? 'text-yellow-405' : 'text-red-400'}`}>
                          {u.trustScore}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{fmtDate(u.createdAt)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setInspectingUser(u)}
                            className="p-2 text-gray-500 hover:text-blue-400 hover:bg-gray-950 border border-transparent hover:border-gray-800 rounded-lg transition-all cursor-pointer"
                            title={t('users_view')}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleVerifyUser(u)}
                            className="p-2 text-green-500 hover:text-white hover:bg-green-650 rounded-lg transition-all cursor-pointer"
                            title={t('users_verify')}
                          >
                            <BadgeCheck size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSuspendUser(u)}
                            className={`p-2 rounded-lg transition-all cursor-pointer ${suspendedIds.includes(u.id) ? 'text-green-400 hover:bg-green-950/40' : 'text-amber-500 hover:bg-amber-950/30'}`}
                            title={suspendedIds.includes(u.id) ? t('users_unsuspend') : t('users_suspend')}
                          >
                            <Clock size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBanUser(u)}
                            className="p-2 text-red-500 hover:text-white hover:bg-red-650 rounded-lg transition-all cursor-pointer"
                            title={t('users_ban')}
                          >
                            <Ban size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center text-gray-500 font-sans text-xs italic font-semibold">
                        {t('no_users_found')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ JOBS ═══════════ */}
        {activeTab === 'jobs' && (
          <div className="space-y-6">
            {/* Search + filter */}
            <div className="bg-gray-905 p-6 rounded-[2.5rem] border border-gray-900 flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="relative w-full lg:w-80 font-sans">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input
                  type="text"
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  placeholder={t('jobs_search_placeholder')}
                  className="w-full pl-10 pr-4 py-3 bg-gray-950 border border-gray-900 rounded-xl text-xs font-bold outline-none focus:border-red-600 font-sans text-white"
                />
              </div>
              <div className="flex gap-2 shrink-0 flex-wrap">
                {([
                  { id: 'all', label: t('filter_all') },
                  { id: 'active', label: t('jobs_active') },
                  { id: 'completed', label: t('jobs_completed') },
                  { id: 'cancelled', label: t('jobs_cancelled') },
                ] as const).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setJobStatus(s.id)}
                    className={`px-4 py-2.5 rounded-xl text-[9px] uppercase tracking-wider font-black transition-all cursor-pointer ${
                      jobStatus === s.id ? 'bg-red-650 hover:bg-red-600 border border-red-500/25 text-white' : 'bg-gray-950 border border-gray-850 text-gray-400 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Jobs table */}
            <div className="bg-gray-905 border border-gray-900 rounded-[2.5rem] overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full text-left font-sans min-w-[900px]">
                <thead className="bg-gray-950 border-b border-gray-900 text-[10px] font-black uppercase text-gray-500 tracking-widest">
                  <tr>
                    <th className="px-6 py-4">{t('jobs_title')}</th>
                    <th className="px-6 py-4">{t('jobs_employer')}</th>
                    <th className="px-6 py-4">{t('jobs_worker')}</th>
                    <th className="px-6 py-4">{t('jobs_district')}</th>
                    <th className="px-6 py-4">{t('jobs_amount')}</th>
                    <th className="px-6 py-4">{t('jobs_status')}</th>
                    <th className="px-6 py-4">{t('jobs_date')}</th>
                    <th className="px-6 py-4 text-right">{t('users_actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-900">
                  {filteredJobs.length > 0 ? filteredJobs.map((j) => (
                    <tr key={j.id} className="hover:bg-gray-900/15 transition-all">
                      <td className="px-6 py-5">
                        <p className="font-extrabold text-gray-150 font-sans text-sm">{j.title}</p>
                        <span className="text-[9px] uppercase font-black text-gray-500 tracking-wider">{t('job_id', { id: j.id })}</span>
                      </td>
                      <td className="px-6 py-5 font-bold text-gray-400">{j.employer?.displayName || '—'}</td>
                      <td className="px-6 py-5 font-bold text-gray-400">{workerNamesForJob(j.id)}</td>
                      <td className="px-6 py-5 flex items-center gap-1.5 font-bold text-gray-400">
                        <MapPin size={12} className="text-gray-500" />
                        {j.location || '—'}
                      </td>
                      <td className="px-6 py-5 font-sans font-black text-gray-200">{j.salary}</td>
                      <td className="px-6 py-5">
                        <span className={`text-[9px] font-black px-2.5 py-0.5 border rounded uppercase tracking-widest ${
                          j.status === 'open' ? 'bg-blue-955/20 text-blue-400 border-blue-900/30' :
                          j.status === 'accepted' ? 'bg-indigo-955/20 text-indigo-400 border-indigo-900/30' :
                          j.status === 'completion_requested' ? 'bg-yellow-955/20 text-yellow-400 border-yellow-904/30' :
                          j.status === 'completed' ? 'bg-green-955/20 text-green-400 border-green-900/40' :
                          j.status === 'cancelled' ? 'bg-red-955/20 text-red-400 border-red-900/30' :
                          'bg-gray-900 text-gray-500 border-gray-800'
                        }`}>
                          {jobStatusLabel(j.status)}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{fmtDate(j.createdAt)}</td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setInspectingJob(j)}
                            className="p-2 text-gray-500 hover:text-blue-400 hover:bg-gray-950 border border-transparent hover:border-gray-800 rounded-lg transition-all cursor-pointer"
                            title={t('jobs_view')}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleHideJob(j)}
                            className="p-2 text-amber-500 hover:text-white hover:bg-amber-650 rounded-lg transition-all cursor-pointer"
                            title={t('jobs_hide')}
                          >
                            <Shield size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteJob(j)}
                            className="p-2 text-red-500 hover:text-white hover:bg-red-650 rounded-lg transition-all cursor-pointer"
                            title={t('jobs_delete')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-16 text-center text-gray-500 font-sans text-xs italic font-semibold">
                        {t('no_jobs_found')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ VERIFICATION ═══════════ */}
        {activeTab === 'verification' && (
          <div className="space-y-6">
            {/* Sub-tabs */}
            <div className="flex gap-2 flex-wrap">
              {([
                { id: 'pending', label: `${t('verif_pending')} (${verificationQueue.length})` },
                { id: 'approved', label: `${t('verif_approved')} (${approvedUsers.length})` },
                { id: 'rejected', label: `${t('verif_rejected')} (${rejectedUsers.length})` },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setVerifTab(tab.id)}
                  className={`px-4 py-2.5 rounded-xl text-[9px] uppercase tracking-wider font-black transition-all cursor-pointer ${
                    verifTab === tab.id ? 'bg-red-650 hover:bg-red-600 border border-red-500/25 text-white' : 'bg-gray-905 border border-gray-850 text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {verifTab === 'pending' && (
              <div className="space-y-4">
                {verificationQueue.length > 0 ? verificationQueue.map((v) => {
                  const docs = v.verificationData as any;
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={v.id}
                      className="p-6 rounded-[2rem] bg-gray-905 border border-gray-900 hover:border-gray-800 transition-all"
                    >
                      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                        {/* Identity images */}
                        <div className="flex gap-4 items-center">
                          {docs?.selfie ? (
                            <img src={docs.selfie} alt={t('verif_selfie')} referrerPolicy="no-referrer" className="h-16 w-16 rounded-2xl object-cover border border-gray-800 bg-gray-950" />
                          ) : (
                            <div className="h-16 w-16 rounded-2xl border border-dashed border-gray-800 bg-gray-950 flex items-center justify-center">
                              <User size={20} className="text-gray-600" />
                            </div>
                          )}
                          {(docs?.frontId || docs?.backId) && (
                            <div className="grid grid-cols-2 gap-2">
                              {docs.frontId && <img src={docs.frontId} alt={t('front_id')} className="h-16 w-24 object-cover rounded-xl border border-gray-800 bg-gray-950" />}
                              {docs.backId && <img src={docs.backId} alt={t('back_id')} className="h-16 w-24 object-cover rounded-xl border border-gray-800 bg-gray-950" />}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-black text-white font-sans">{v.displayName}</h3>
                              <span className="text-[8px] font-black px-2 py-0.5 bg-gray-900 text-gray-400 rounded border border-gray-800 uppercase tracking-widest">
                                {roleLabel(v.role)}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1 font-semibold">
                              {t('national_id_number')}: <span className="font-mono text-gray-300">{docs?.nationalIdNum || docs?.idNumber || docs?.tinNumber || '—'}</span>
                            </p>
                            <p className="text-[10px] text-gray-500 mt-0.5 font-bold uppercase tracking-wider">
                              {t('verif_submitted_date')}: {docs?.date || fmtDate(v.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* Face match placeholder + actions */}
                        <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
                          <div className="text-center">
                            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">{t('verif_face_match')}</p>
                            <span className="text-[10px] font-black px-2.5 py-1 bg-blue-950/40 text-blue-400 border border-blue-900/40 rounded-lg uppercase tracking-widest">
                              {t('verif_manual')}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleApproveVerification(v)}
                              className="py-2.5 px-4 bg-green-650 hover:bg-green-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-green-950/30"
                            >
                              <Check size={12} />
                              {t('verif_approve')}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setRejectReason(''); setRejectingVerification(v); }}
                              className="py-2.5 px-4 bg-red-950/40 hover:bg-red-950/80 text-red-400 border border-red-900/30 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <X size={12} />
                              {t('verif_reject')}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                }) : (
                  <div className="p-8 md:p-16 text-center bg-gray-905 border border-gray-900 rounded-[2.5rem] flex flex-col items-center justify-center">
                    <CheckCircle2 size={40} className="text-green-500/40 mb-3 animate-pulse" />
                    <p className="font-sans font-black uppercase tracking-wider text-xs text-gray-300">{t('identity_desk_cleared')}</p>
                    <p className="text-gray-500 font-sans text-[10px] mt-1 italic font-semibold">{t('all_pending_processed')}</p>
                  </div>
                )}
              </div>
            )}

            {verifTab === 'approved' && (
              <div className="bg-gray-905 border border-gray-900 rounded-[2.5rem] overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full text-left font-sans min-w-[600px]">
                  <thead className="bg-gray-950 border-b border-gray-900 text-[10px] font-black uppercase text-gray-500 tracking-widest">
                    <tr>
                      <th className="px-6 py-4">{t('users_name')}</th>
                      <th className="px-6 py-4">{t('users_role')}</th>
                      <th className="px-6 py-4">{t('users_email')}</th>
                      <th className="px-6 py-4">{t('users_trust_score')}</th>
                      <th className="px-6 py-4">{t('users_joined')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-900">
                    {approvedUsers.length > 0 ? approvedUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-900/15 transition-all">
                        <td className="px-6 py-4 font-bold text-gray-150 text-sm">{u.displayName}</td>
                        <td className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase">{roleLabel(u.role)}</td>
                        <td className="px-6 py-4 font-mono text-xs font-bold text-gray-400">{u.email}</td>
                        <td className="px-6 py-4 font-mono font-black text-green-400">{u.trustScore}</td>
                        <td className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{fmtDate(u.createdAt)}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 text-center text-gray-500 font-sans text-xs italic font-semibold">{t('no_approved_yet')}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              </div>
            )}

            {verifTab === 'rejected' && (
              <div className="bg-gray-905 border border-gray-900 rounded-[2.5rem] overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full text-left font-sans min-w-[700px]">
                  <thead className="bg-gray-950 border-b border-gray-900 text-[10px] font-black uppercase text-gray-500 tracking-widest">
                    <tr>
                      <th className="px-6 py-4">{t('users_name')}</th>
                      <th className="px-6 py-4">{t('users_role')}</th>
                      <th className="px-6 py-4">{t('users_email')}</th>
                      <th className="px-6 py-4">{t('users_trust_score')}</th>
                      <th className="px-6 py-4">{t('verif_reason_column')}</th>
                      <th className="px-6 py-4">{t('users_joined')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-900">
                    {rejectedUsers.length > 0 ? rejectedUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-900/15 transition-all">
                        <td className="px-6 py-4 font-bold text-gray-150 text-sm">{u.displayName}</td>
                        <td className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase">{roleLabel(u.role)}</td>
                        <td className="px-6 py-4 font-mono text-xs font-bold text-gray-400">{u.email}</td>
                        <td className="px-6 py-4 font-mono font-black text-red-400">{u.trustScore}</td>
                        <td className="px-6 py-4 max-w-[260px]">
                          <p className="text-xs font-sans font-semibold text-amber-400/90 leading-snug">{rejectionReasonOf(u) || t('verif_no_reason')}</p>
                        </td>
                        <td className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{fmtDate(u.createdAt)}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-16 text-center text-gray-500 font-sans text-xs italic font-semibold">{t('no_rejected_yet')}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════ NOTIFICATIONS ═══════════ */}
        {activeTab === 'notifications' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Composer */}
            <div className="bg-gray-905 p-6 rounded-[2.5rem] border border-gray-900 space-y-5">
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-widest mb-2">{t('notif_composer')}</h3>
                <p className="text-gray-400 font-sans text-[10px] leading-relaxed font-bold uppercase tracking-wider">{t('notif_composer_desc')}</p>
              </div>

              <div>
                <label className="block text-[8px] font-black uppercase tracking-widest text-gray-500 mb-2 font-sans">{t('notif_audience')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { id: 'all', label: t('notif_all_users') },
                    { id: 'workers', label: t('users_workers') },
                    { id: 'employers', label: t('users_employers') },
                    { id: 'companies', label: t('users_companies') },
                    { id: 'specific', label: t('notif_specific_user') },
                  ] as const).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setNotifAudience(opt.id);
                        if (opt.id !== 'specific') setNotifTargetUser(null);
                      }}
                      className={`py-2.5 rounded-lg text-[9px] font-black uppercase tracking-wider font-sans cursor-pointer transition-colors border ${
                        notifAudience === opt.id ? 'bg-red-650 border-red-500/40 text-white' : 'bg-gray-950 border-gray-900 text-gray-400 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {notifAudience === 'specific' && (
                  <div className="mt-3 relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        placeholder={t('notif_search_user_placeholder')}
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-950 border border-gray-900 focus:border-blue-600 rounded-xl outline-none font-sans font-bold text-xs text-white"
                      />
                    </div>
                    {userSearchQuery.trim() && (
                      <div className="mt-2 bg-gray-950 border border-gray-800 rounded-xl overflow-hidden">
                        {matchingUsers.length > 0 ? matchingUsers.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => { setNotifTargetUser(u); setUserSearchQuery(''); }}
                            className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-gray-900 transition-colors text-left cursor-pointer"
                          >
                            <span className="h-7 w-7 bg-gray-900 border border-gray-800 rounded-full flex items-center justify-center text-[9px] font-black text-gray-400 uppercase shrink-0">
                              {u.displayName.slice(0, 2)}
                            </span>
                            <span className="min-w-0">
                              <span className="block text-xs font-bold text-gray-200 truncate">{u.displayName}</span>
                              <span className="block text-[9px] text-gray-500 font-bold uppercase tracking-wider truncate">{roleLabel(u.role)} · {u.email}</span>
                            </span>
                            <Check size={12} className={`ml-auto shrink-0 ${notifTargetUser?.id === u.id ? 'text-green-400' : 'text-gray-700'}`} />
                          </button>
                        )) : (
                          <p className="px-3 py-3 text-center text-gray-500 text-[10px] font-bold italic">{t('notif_no_matching_users')}</p>
                        )}
                      </div>
                    )}
                    {notifTargetUser && (
                      <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-blue-950/40 border border-blue-900/40 rounded-xl">
                        <User size={12} className="text-blue-400 shrink-0" />
                        <span className="text-[10px] font-black text-blue-300 uppercase tracking-wider truncate">{notifTargetUser.displayName} · {notifTargetUser.email}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[8px] font-black uppercase tracking-widest text-gray-500 mb-2 font-sans">{t('notif_type_label')}</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {([
                    { id: 'info', label: t('notif_priority_info'), icon: <Info size={11} />, active: 'bg-blue-950/40 border-blue-500/40 text-blue-300', inactive: 'bg-gray-950 border-gray-900 text-gray-400 hover:text-white' },
                    { id: 'success', label: t('notif_priority_success'), icon: <CheckCircle2 size={11} />, active: 'bg-green-650/10 border-green-500/40 text-green-400', inactive: 'bg-gray-950 border-gray-900 text-gray-400 hover:text-white' },
                    { id: 'urgent', label: t('notif_priority_urgent'), icon: <AlertTriangle size={11} />, active: 'bg-red-650/10 border-red-500/40 text-red-400', inactive: 'bg-gray-950 border-gray-900 text-gray-400 hover:text-white' },
                    { id: 'warning', label: t('notif_priority_warning'), icon: <Bell size={11} />, active: 'bg-yellow-950/30 border-yellow-500/40 text-yellow-400', inactive: 'bg-gray-950 border-gray-900 text-gray-400 hover:text-white' },
                  ] as const).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setNotifType(opt.id)}
                      className={`py-2 rounded-lg text-[9px] font-black uppercase tracking-wider font-sans cursor-pointer transition-colors border flex items-center justify-center gap-1.5 ${notifType === opt.id ? opt.active : opt.inactive}`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[8px] font-black uppercase tracking-widest text-gray-500 mb-2 font-sans">{t('notif_title')}</label>
                <input
                  type="text"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  placeholder={t('notif_title_placeholder')}
                  className="w-full p-3 bg-gray-950 border border-gray-900 focus:border-red-600 rounded-xl outline-none font-sans font-bold text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[8px] font-black uppercase tracking-widest text-gray-500 mb-2 font-sans">{t('notif_body')}</label>
                <textarea
                  value={notifBody}
                  onChange={(e) => setNotifBody(e.target.value)}
                  placeholder={t('notif_body_placeholder')}
                  rows={5}
                  className="w-full p-3 bg-gray-950 border border-gray-900 focus:border-red-600 rounded-xl outline-none font-sans font-bold text-xs text-white resize-none"
                />
              </div>

              <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-950 border border-gray-900 rounded-xl">
                <Users size={12} className="text-gray-500 shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">{t('notif_recipient_preview', { count: notifTargetCount })}</span>
              </div>

              <button
                type="button"
                onClick={handleSendNotification}
                className="w-full py-4 bg-red-650 hover:bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-red-950/20 flex items-center justify-center gap-2"
              >
                <Send size={14} />
                {t('notif_send')}
              </button>
            </div>

            {/* Sent-notifications history */}
            <div className="bg-gray-905 p-6 rounded-[2.5rem] border border-gray-900">
              <h3 className="text-xs font-black text-gray-300 uppercase tracking-widest mb-5">{t('notif_history')}</h3>
              <div className="space-y-3">
                {sentNotifs.length > 0 ? sentNotifs.slice(0, 8).map((n) => (
                  <div key={n.id} className="p-4 bg-gray-950 rounded-xl border border-gray-904/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-start md:items-center gap-3 min-w-0">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black shrink-0 ${
                        n.type === 'urgent' ? 'bg-red-955/20 text-red-400 border border-red-900/40' :
                        n.type === 'success' ? 'bg-green-955/20 text-green-400 border border-green-900/40' :
                        n.type === 'warning' ? 'bg-yellow-955/20 text-yellow-400 border border-yellow-904/30' :
                        'bg-blue-950/55 text-blue-400 border border-blue-900/40'
                      }`}>
                        {n.type.toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="text-gray-200 font-sans font-bold tracking-tight leading-snug text-xs truncate">{n.title}</p>
                        <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold mt-0.5">
                          {t('notif_to_audience', { audience: n.audience, count: n.count })}
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] text-gray-550 font-bold font-mono shrink-0">{n.date}</span>
                  </div>
                )) : (
                  <p className="py-12 text-center text-gray-500 font-sans text-xs italic font-semibold">{t('notif_history_empty')}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ SETTINGS ═══════════ */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* General */}
            <div className="bg-gray-905 p-6 rounded-[2.5rem] border border-gray-900 space-y-5">
              <h3 className="text-xs font-black text-white uppercase tracking-widest">{t('settings_general')}</h3>
              <div>
                <label className="block text-[8px] font-black uppercase tracking-widest text-gray-500 mb-2 font-sans">{t('settings_platform_name')}</label>
                <input
                  type="text"
                  value={settings.platformName}
                  onChange={(e) => saveSettings({ platformName: e.target.value })}
                  className="w-full p-3 bg-gray-950 border border-gray-900 focus:border-red-600 rounded-xl outline-none font-sans font-bold text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[8px] font-black uppercase tracking-widest text-gray-500 mb-2 font-sans">{t('settings_contact_email')}</label>
                <input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => saveSettings({ contactEmail: e.target.value })}
                  className="w-full p-3 bg-gray-950 border border-gray-900 focus:border-red-600 rounded-xl outline-none font-sans font-bold text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[8px] font-black uppercase tracking-widest text-gray-500 mb-2 font-sans">{t('settings_commission_rate')}</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={settings.commissionRate}
                    onChange={(e) => saveSettings({ commissionRate: Number(e.target.value) })}
                    className="w-full p-3 bg-gray-950 border border-gray-900 focus:border-red-600 rounded-xl outline-none font-sans font-bold text-xs text-white"
                  />
                  <Percent size={16} className="text-gray-500 shrink-0" />
                </div>
              </div>
            </div>

            {/* SMS + Email */}
            <div className="space-y-8">
              <div className="bg-gray-905 p-6 rounded-[2.5rem] border border-gray-900 space-y-5">
                <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Smartphone size={14} className="text-blue-400" />
                  {t('settings_sms')}
                </h3>
                <div>
                  <label className="block text-[8px] font-black uppercase tracking-widest text-gray-500 mb-2 font-sans">{t('settings_sms_provider')}</label>
                  <input
                    type="text"
                    value={settings.smsProvider}
                    onChange={(e) => saveSettings({ smsProvider: e.target.value })}
                    className="w-full p-3 bg-gray-950 border border-gray-900 focus:border-red-600 rounded-xl outline-none font-sans font-bold text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-black uppercase tracking-widest text-gray-500 mb-2 font-sans">{t('settings_sms_sender')}</label>
                  <input
                    type="text"
                    value={settings.smsSenderId}
                    onChange={(e) => saveSettings({ smsSenderId: e.target.value })}
                    className="w-full p-3 bg-gray-950 border border-gray-900 focus:border-red-600 rounded-xl outline-none font-sans font-bold text-xs text-white"
                  />
                </div>
              </div>

              <div className="bg-gray-905 p-6 rounded-[2.5rem] border border-gray-900 space-y-5">
                <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Mail size={14} className="text-emerald-400" />
                  {t('settings_email')}
                </h3>
                <div>
                  <label className="block text-[8px] font-black uppercase tracking-widest text-gray-500 mb-2 font-sans">{t('settings_smtp_host')}</label>
                  <input
                    type="text"
                    value={settings.smtpHost}
                    onChange={(e) => saveSettings({ smtpHost: e.target.value })}
                    className="w-full p-3 bg-gray-950 border border-gray-900 focus:border-red-600 rounded-xl outline-none font-sans font-bold text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-black uppercase tracking-widest text-gray-500 mb-2 font-sans">{t('settings_smtp_from')}</label>
                  <input
                    type="email"
                    value={settings.smtpFrom}
                    onChange={(e) => saveSettings({ smtpFrom: e.target.value })}
                    className="w-full p-3 bg-gray-950 border border-gray-900 focus:border-red-600 rounded-xl outline-none font-sans font-bold text-xs text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ ACTIVITY CENTER ═══════════ */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            <div className="bg-gray-905 p-6 rounded-[2.5rem] border border-gray-900 space-y-6">
              <div className="flex justify-between items-center border-b border-gray-900 pb-4">
                <div>
                  <h3 className="text-xs font-black text-gray-300 uppercase tracking-widest">{t('activity_center_title')}</h3>
                  <p className="text-[10px] text-gray-500 font-bold italic mt-1 uppercase tracking-wider">{t('audit_ledger_subtitle')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    persistAudit([]);
                    triggerNotification(t('toast_audit_cleared'));
                  }}
                  className="flex items-center gap-1.5 text-[9px] font-black uppercase text-red-500 hover:text-red-400 hover:underline cursor-pointer"
                >
                  <Trash2 size={12} />
                  {t('clear_ledger')}
                </button>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-none font-mono text-[11px] leading-relaxed">
                {auditLogs.length > 0 ? auditLogs.map((log) => (
                  <div key={log.id} className="p-4 bg-gray-950 rounded-xl border border-gray-904/80 flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono hover:border-gray-800 transition-colors">
                    <div className="flex items-start md:items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black shrink-0 ${
                        log.category === 'SECURITY' ? 'bg-blue-950/55 text-blue-400 border border-blue-900/40' :
                        log.category === 'FINANCIAL' ? 'bg-green-955/20 text-green-400 border border-green-900/40' :
                        log.category === 'SAFETY' ? 'bg-red-955/20 text-red-400 border border-red-900/40' :
                        'bg-gray-900 text-gray-400 border border-gray-800'
                      }`}>
                        {log.category}
                      </span>
                      <p className="text-gray-300 font-sans font-semibold tracking-tight leading-snug">{log.action}</p>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-gray-900 pt-2 md:pt-0 shrink-0 uppercase tracking-wider text-[9px] text-gray-550 font-bold">
                      <span>{t('terminal_label', { user: log.user })}</span>
                      <span className="text-gray-500 font-mono">{log.date}</span>
                    </div>
                  </div>
                )) : (
                  <div className="py-16 text-center text-gray-500 font-sans text-xs italic font-semibold">
                    {t('audit_void_msg')}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Inactivity warning modal */}
      <AnimatePresence>
        {showInactivityWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gray-950/80 backdrop-blur-md flex items-center justify-center p-4 font-sans font-medium"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-gray-905 border border-red-900/40 p-8 rounded-[2.5rem] text-center shadow-2xl relative overflow-hidden"
            >
              <div className="mx-auto h-16 w-16 bg-red-950/40 border border-red-500/30 text-red-500 rounded-3xl flex items-center justify-center mb-6 animate-pulse select-none">
                <Lock size={28} />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-widest leading-tight">{t('session_expiring')}</h3>
              <p className="text-[10px] text-red-500 uppercase tracking-widest font-sans font-black mt-1">{t('security_guard_active')}</p>
              <div className="my-6 p-4 bg-gray-950 border border-gray-900 rounded-2xl text-[11px] leading-relaxed text-gray-400">
                <p>{t('inactivity_modal_desc')}</p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <span className="text-gray-500 uppercase font-black text-[9px] tracking-wider leading-none">{t('security_timeout_in')}</span>
                  <span className="font-mono font-black text-white text-base bg-red-955/20 border border-red-900/30 px-2.5 py-0.5 rounded tracking-wide">{300 - idleTime}s</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIdleTime(0);
                    setShowInactivityWarning(false);
                  }}
                  className="w-full py-4 bg-red-650 hover:bg-red-600 border border-transparent text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg cursor-pointer flex items-center justify-center gap-1.5 select-none"
                >
                  {t('confirm_authorize_extend')}
                </button>
                <button
                  type="button"
                  onClick={handleLogoutAdmin}
                  className="w-full py-3.5 bg-gray-900 hover:bg-gray-850 hover:text-white text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer select-none"
                >
                  {t('voluntary_sign_out')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User View Modal */}
      <AnimatePresence>
        {inspectingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gray-950/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans font-medium overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-xl bg-gray-905 border border-gray-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden my-8"
            >
              <button
                type="button"
                onClick={() => setInspectingUser(null)}
                className="absolute top-6 right-6 p-2 rounded-xl bg-gray-950/80 border border-gray-900 text-gray-500 hover:text-white cursor-pointer transition-all hover:border-gray-800"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-3.5 border-b border-gray-900 pb-5 mb-5 select-none">
                {inspectingUser.avatarUrl ? (
                  <img src={inspectingUser.avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover border border-gray-800" />
                ) : (
                  <div className="h-12 w-12 bg-red-950/30 text-red-400 border border-red-900/40 rounded-full flex items-center justify-center font-black">
                    {inspectingUser.displayName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider font-sans leading-none">{inspectingUser.displayName}</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1.5">{roleLabel(inspectingUser.role)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-gray-950 rounded-xl border border-gray-900">
                  <span className="text-[8px] text-gray-500 font-black uppercase tracking-wider block mb-1">{t('users_email')}</span>
                  <span className="font-sans font-bold text-gray-200 break-all">{inspectingUser.email}</span>
                </div>
                <div className="p-3.5 bg-gray-950 rounded-xl border border-gray-900">
                  <span className="text-[8px] text-gray-500 font-black uppercase tracking-wider block mb-1">{t('users_phone')}</span>
                  <span className="font-sans font-bold text-gray-200">{inspectingUser.phone || '—'}</span>
                </div>
                <div className="p-3.5 bg-gray-950 rounded-xl border border-gray-900">
                  <span className="text-[8px] text-gray-500 font-black uppercase tracking-wider block mb-1">{t('users_verification_status')}</span>
                  <span className="font-sans font-bold text-gray-200 uppercase">{statusLabel(inspectingUser)}</span>
                </div>
                <div className="p-3.5 bg-gray-950 rounded-xl border border-gray-900">
                  <span className="text-[8px] text-gray-500 font-black uppercase tracking-wider block mb-1">{t('users_trust_score')}</span>
                  <span className="font-sans font-black text-green-400">{inspectingUser.trustScore}</span>
                </div>
                <div className="p-3.5 bg-gray-950 rounded-xl border border-gray-900 col-span-2">
                  <span className="text-[8px] text-gray-500 font-black uppercase tracking-wider block mb-1">{t('users_location')}</span>
                  <span className="font-sans font-bold text-gray-200 flex items-center gap-1.5">
                    <MapPin size={12} className="text-gray-500" />
                    {inspectingUser.location || 'Kigali, Rwanda'}
                  </span>
                </div>
                <div className="p-3.5 bg-gray-950 rounded-xl border border-gray-900 col-span-2">
                  <span className="text-[8px] text-gray-500 font-black uppercase tracking-wider block mb-1">{t('users_joined')}</span>
                  <span className="font-sans font-bold text-gray-200">{fmtDate(inspectingUser.createdAt)}</span>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-gray-900 flex gap-2">
                <button
                  type="button"
                  onClick={() => { handleVerifyUser(inspectingUser); setInspectingUser(null); }}
                  className="flex-1 py-3 bg-green-650 hover:bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check size={14} />
                  {t('users_verify')}
                </button>
                <button
                  type="button"
                  onClick={() => { handleSuspendUser(inspectingUser); }}
                  className="flex-1 py-3 bg-amber-650 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Clock size={14} />
                  {suspendedIds.includes(inspectingUser.id) ? t('users_unsuspend') : t('users_suspend')}
                </button>
                <button
                  type="button"
                  onClick={() => { handleBanUser(inspectingUser); setInspectingUser(null); }}
                  className="flex-1 py-3 bg-red-950 hover:bg-red-900 text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-red-900/30"
                >
                  <Ban size={14} />
                  {t('users_ban')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Job View Modal */}
      <AnimatePresence>
        {inspectingJob && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gray-950/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans font-medium overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-2xl bg-gray-905 border border-gray-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden my-8"
            >
              <button
                type="button"
                onClick={() => setInspectingJob(null)}
                className="absolute top-6 right-6 p-2 rounded-xl bg-gray-950/80 border border-gray-900 text-gray-500 hover:text-white cursor-pointer transition-all hover:border-gray-800"
              >
                <X size={16} />
              </button>

              <div className="border-b border-gray-900 pb-5 mb-5">
                <h3 className="text-lg font-black text-white font-sans leading-tight">{inspectingJob.title}</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1.5">
                  {t('job_id', { id: inspectingJob.id })}
                </p>
              </div>

              <div className="space-y-5">
                <div className="p-3.5 bg-gray-950 rounded-xl border border-gray-900">
                  <span className="text-[8px] text-gray-500 font-black uppercase tracking-wider block mb-2">{t('jobs_description')}</span>
                  <p className="text-gray-300 font-sans font-semibold text-xs leading-relaxed whitespace-pre-wrap">{inspectingJob.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 bg-gray-950 rounded-xl border border-gray-900">
                    <span className="text-[8px] text-gray-500 font-black uppercase tracking-wider block mb-1">{t('jobs_employer')}</span>
                    <span className="font-sans font-bold text-gray-200">{inspectingJob.employer?.displayName || '—'}</span>
                  </div>
                  <div className="p-3.5 bg-gray-950 rounded-xl border border-gray-900">
                    <span className="text-[8px] text-gray-500 font-black uppercase tracking-wider block mb-1">{t('jobs_worker')}</span>
                    <span className="font-sans font-bold text-gray-200">{workerNamesForJob(inspectingJob.id)}</span>
                  </div>
                  <div className="p-3.5 bg-gray-950 rounded-xl border border-gray-900">
                    <span className="text-[8px] text-gray-500 font-black uppercase tracking-wider block mb-1">{t('jobs_district')}</span>
                    <span className="font-sans font-bold text-gray-200 flex items-center gap-1.5">
                      <MapPin size={12} className="text-gray-500" />
                      {inspectingJob.location || '—'}
                    </span>
                  </div>
                  <div className="p-3.5 bg-gray-950 rounded-xl border border-gray-900">
                    <span className="text-[8px] text-gray-500 font-black uppercase tracking-wider block mb-1">{t('jobs_amount')}</span>
                    <span className="font-sans font-black text-emerald-400">{inspectingJob.salary}</span>
                  </div>
                  <div className="p-3.5 bg-gray-950 rounded-xl border border-gray-900">
                    <span className="text-[8px] text-gray-500 font-black uppercase tracking-wider block mb-1">{t('jobs_status')}</span>
                    <span className="font-sans font-bold text-gray-200 uppercase">{jobStatusLabel(inspectingJob.status)}</span>
                  </div>
                  <div className="p-3.5 bg-gray-950 rounded-xl border border-gray-900">
                    <span className="text-[8px] text-gray-500 font-black uppercase tracking-wider block mb-1">{t('jobs_date')}</span>
                    <span className="font-sans font-bold text-gray-200">{fmtDate(inspectingJob.createdAt)}</span>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-gray-900 flex gap-2">
                  <button
                    type="button"
                    onClick={() => { handleHideJob(inspectingJob); setInspectingJob(null); }}
                    className="flex-1 py-3 bg-amber-650 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Shield size={14} />
                    {t('jobs_hide')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { handleDeleteJob(inspectingJob); setInspectingJob(null); }}
                    className="flex-1 py-3 bg-red-950 hover:bg-red-900 text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-red-900/30"
                  >
                    <Trash2 size={14} />
                    {t('jobs_delete')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
