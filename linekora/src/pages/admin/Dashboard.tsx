import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, AlertTriangle, CheckCircle2, 
  XCircle, ChevronRight, Eye, Search, Filter, 
  TrendingUp, Activity, Lock, Ban, User,
  X, Check, Award, ShieldAlert, ArrowUpRight, 
  DollarSign, LogOut, RefreshCw, Star, Trash2,
  Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import IdentityCardVisual from '../../components/IdentityCardVisual';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { useLanguage } from '../../lib/LanguageContext';
import { getUsers, updateUser, getPendingVerifications } from '../../lib/api';

interface AuditLog {
  id: string;
  action: string;
  category: 'SECURITY' | 'FINANCIAL' | 'SAFETY' | 'SYSTEM';
  date: string;
  user: string;
}

interface UserAccount {
  uid: string;
  name: string;
  role: 'worker' | 'company' | 'individual';
  location: string;
  trustScore: number;
  status: 'active' | 'warning' | 'suspended';
  email: string;
  phone: string;
  verificationStatus: 'unverified' | 'pending' | 'verified';
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'verification' | 'reports' | 'analytics' | 'users' | 'logs' | 'upgrades'>('verification');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'worker' | 'company' | 'individual'>('all');
  const [notification, setNotification] = useState<{ id: number; message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const statusText = (s: string) => ({
    active: t('status_active'),
    warning: t('status_warning'),
    suspended: t('status_suspended'),
    unverified: t('status_unverified'),
    pending: t('status_pending'),
    verified: t('status_verified'),
    accepted: t('status_contract_active'),
    completion_requested: t('status_completion_requested'),
    completed: t('status_completed'),
    released: t('status_released'),
    paid_awaiting_admin: t('status_paid_awaiting'),
    approved: t('status_approved'),
    rejected: t('status_rejected'),
    request_sent: t('status_request_sent'),
    high: t('status_high'),
    medium: t('status_medium'),
    low: t('status_low'),
  }[s] || s);

  const roleLabel = (r: string) => ({
    worker: t('role_worker'),
    company: t('role_company'),
    individual: t('role_individual'),
  }[r] || r);

  const [inspectingUser, setInspectingUser] = useState<UserAccount | null>(null);
  const [idleTime, setIdleTime] = useState(0);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);

  // Upgrade requests state for pricing tier purchases (MoMo etc.)
  const [upgradeRequests, setUpgradeRequests] = useState<any[]>(() => {
    const cached = localStorage.getItem('linekora_pricing_upgrade_requests');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  });

  // Safe localStorage synchronization loop
  useEffect(() => {
    localStorage.setItem('linekora_pricing_upgrade_requests', JSON.stringify(upgradeRequests));
  }, [upgradeRequests]);

  useEffect(() => {
    const syncRequests = () => {
      const cached = localStorage.getItem('linekora_pricing_upgrade_requests');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (JSON.stringify(parsed) !== JSON.stringify(upgradeRequests)) {
            setUpgradeRequests(parsed);
          }
        } catch (e) {}
      }
    };
    window.addEventListener('storage', syncRequests);
    const interval = setTimeout(syncRequests, 1200);
    return () => {
      window.removeEventListener('storage', syncRequests);
      clearTimeout(interval);
    };
  }, [upgradeRequests]);

  // Actions for Approval & Rejection of MTN MoMo payment handshakes
  const handleApproveUpgrade = (reqId: string) => {
    const updated = upgradeRequests.map(req => {
      if (req.id === reqId) {
        // Complete the steps
        const completedSteps = req.steps.map((st: any, idx: number) => {
          if (idx === 2) {
            return { ...st, title: t('step_payment_verified'), date: t('time_just_now'), done: true };
          }
          return { ...st, done: true };
        });

        const newTier = req.tierName;
        // Also update actual user_membership_tier so Pricing displays it correctly
        if (req.role === 'worker') {
          localStorage.setItem('worker_membership_tier', newTier);
        } else {
          localStorage.setItem('company_membership_tier', newTier);
        }

        // Now find that user in users directory and set verified
        setUsers(prevUsers => prevUsers.map(u => {
          if (u.email === req.userEmail || u.phone === req.paymentPhoneOrCard) {
            const nextTrustScore = Math.min(u.trustScore + 30, 100);
            updateUser(u.uid, {
              verificationStatus: 'verified',
              trustScore: nextTrustScore,
            }).catch(e => console.error('API update failed', e));
            return { ...u, verificationStatus: 'verified', trustScore: nextTrustScore };
          }
          return u;
        }));

        return { 
          ...req, 
          status: 'approved', 
          steps: [
            ...completedSteps,
            { title: t('step_membership_activated'), date: t('time_just_now'), done: true }
          ] 
        };
      }
      return req;
    });

    setUpgradeRequests(updated);
    localStorage.setItem('linekora_pricing_upgrade_requests', JSON.stringify(updated));

    // Audit Log entry
    const matched = upgradeRequests.find(r => r.id === reqId);
    const logMsg = matched 
      ? t('audit_upgrade_approved', { price: matched.price, userName: matched.userName, tierName: matched.tierName })
      : t('audit_upgrade_approved_fallback', { reqId });

    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      action: logMsg,
      category: 'FINANCIAL',
      date: t('time_just_now'),
      user: 'Linekora Admin'
    };
    setAuditLogs(prev => [newLog, ...prev]);

    triggerNotification(t('toast_upgrade_approved'), "success");
  };

  const handleRejectUpgrade = (reqId: string) => {
    const updated = upgradeRequests.map(req => {
      if (req.id === reqId) {
        return { 
          ...req, 
          status: 'rejected', 
          steps: [
            ...req.steps,
            { title: t('step_payment_declined'), date: t('time_just_now'), done: false }
          ] 
        };
      }
      return req;
    });

    setUpgradeRequests(updated);
    localStorage.setItem('linekora_pricing_upgrade_requests', JSON.stringify(updated));

    const matched = upgradeRequests.find(r => r.id === reqId);
    const logMsg = matched 
      ? t('audit_upgrade_declined', { userName: matched.userName })
      : t('audit_upgrade_rejected_fallback', { reqId });

    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      action: logMsg,
      category: 'FINANCIAL',
      date: t('time_just_now'),
      user: 'Linekora Admin'
    };
    setAuditLogs(prev => [newLog, ...prev]);

    triggerNotification(t('toast_payment_rejected'), "error");
  };

  // Directly initiate a MoMo phone query on behalf of administrative support
  const [adminSendPhone, setAdminSendPhone] = useState('');
  const [adminSelectUser, setAdminSelectUser] = useState('');
  const [adminSelectTier, setAdminSelectTier] = useState('Verified Bronze');
  const [adminSendRole, setAdminSendRole] = useState<'worker' | 'company'>('worker');

  const handleCreatePaymentRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSendPhone.trim()) {
      triggerNotification(t('toast_phone_required'), "error");
      return;
    }

    const matchedUser = users.find(u => u.phone === adminSendPhone) || {
      name: adminSelectUser || "Gisagara Guest",
      email: `${adminSendPhone.replace(/\s+/g, '')}@momo.rw`
    };

    const targetPrice = adminSelectTier === 'Verified Bronze' ? '15,000' : '35,000';

    const newRequest = {
      id: `req_${Date.now()}`,
      date: t('time_just_now'),
      userName: matchedUser.name,
      userEmail: matchedUser.email,
      role: adminSendRole,
      tierName: adminSelectTier,
      price: targetPrice,
      method: "momo",
      paymentPhoneOrCard: adminSendPhone,
      status: "request_sent",
      steps: [
        { title: t('step_billing_dispatched'), date: t('time_just_now'), done: true },
        { title: t('step_awaiting_pin'), date: t('time_pending'), done: false },
        { title: t('step_receipt_verification'), date: t('time_pending'), done: false }
      ]
    };

    const updated = [newRequest, ...upgradeRequests];
    setUpgradeRequests(updated);
    localStorage.setItem('linekora_pricing_upgrade_requests', JSON.stringify(updated));

    // Audit log
    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      action: t('audit_billing_dispatched', { targetPrice, adminSendPhone, adminSelectTier }),
      category: 'SYSTEM',
      date: t('time_just_now'),
      user: 'Linekora Admin'
    };
    setAuditLogs(prev => [newLog, ...prev]);

    triggerNotification(t('toast_billing_sent'), "success");
    setAdminSendPhone('');
    setAdminSelectUser('');
  };

  // Stateful Queues initialized with mock data that mirrors the system's requirements
  const [verificationQueue, setVerificationQueue] = useState<any[]>([]);

  const [reports, setReports] = useState<any[]>([]);

  const [users, setUsers] = useState<UserAccount[]>([]);

  // Fetch real users from PostgreSQL API
  const fetchRealUsers = async () => {
    try {
      const apiUsers = await getUsers();
      const realUsers: UserAccount[] = [];
      const realPendingVerifications: any[] = [];

      // Fetch verification documents from server-side database
      let serverDocs: any[] = [];
      try {
        serverDocs = await getPendingVerifications();
      } catch (e) {
        console.warn('Could not fetch verification docs from API, falling back to localStorage', e);
      }

      apiUsers.forEach((u) => {
        if (u.role === 'ADMIN') return;
        realUsers.push({
          uid: u.id,
          name: u.displayName,
          role: u.role.toLowerCase() as any,
          location: u.location || 'Kigali, Rwanda',
          trustScore: u.trustScore,
          status: 'active',
          email: u.email,
          phone: u.phone || '',
          verificationStatus: u.verificationStatus as any,
        });
        if (u.verificationStatus === 'pending') {
          const isWorker = u.role === 'WORKER';
          const isCompany = u.role === 'COMPANY';
          const typeLabel = isWorker ? 'worker' : isCompany ? 'company' : 'individual';
          const idType = isWorker ? 'National ID / Passport' : isCompany ? 'Business Registration (TIN)' : 'ID Document';

          // Find matching server-side docs by userId
          const serverDoc = serverDocs.find((d: any) => d.id === u.id);
          const docs = serverDoc?.verificationData || null;

          realPendingVerifications.push({
            id: `v_${u.id}`,
            user: u.displayName,
            type: typeLabel,
            date: docs?.date || t('time_recently'),
            status: 'pending',
            idType,
            details: t('verif_pending_details', { email: u.email }),
            code: `UID-${u.id.slice(0, 4).toUpperCase()}`,
            userId: u.id,
            // Attach actual uploaded images from server-side storage
            frontId: docs?.frontId || null,
            backId: docs?.backId || null,
            selfie: docs?.selfie || docs?.capturedPhoto || null,
            nationalIdNum: docs?.nationalIdNum || docs?.idNumber || docs?.tinNumber || null,
            selectedTier: docs?.selectedTier || null,
            // Company-specific fields
            certFile: docs?.certFile || null,
            certFileName: docs?.certFileName || null,
            address: docs?.address || null,
            website: docs?.website || null,
          });
        }
      });

      setUsers(realUsers);
      setVerificationQueue(realPendingVerifications);
    } catch (err) {
      console.error('Failed to fetch users from API', err);
    }
  };

  useEffect(() => {
    fetchRealUsers();
    const interval = setInterval(fetchRealUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const cached = localStorage.getItem('admin_audit_logs');
    if (cached) {
      try { return JSON.parse(cached); } catch(e) {}
    }
    return [];
  });

  const [selectedVerification, setSelectedVerification] = useState<typeof verificationQueue[0] | null>(null);

  const [contracts, setContracts] = useState<any[]>(() => {
    const cached = localStorage.getItem('linekora_contracts');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  });

  const [workerUnpaid, setWorkerUnpaid] = useState(() => {
    return Number(localStorage.getItem('worker_unpaid_commission') || '0');
  });

  const [companyUnpaid, setCompanyUnpaid] = useState(() => {
    return Number(localStorage.getItem('company_unpaid_commission') || '0');
  });

  const activeEscrowSum = contracts.reduce((acc, c) => {
    if (c.status === 'accepted' || c.status === 'completion_requested') {
      const val = Number(c.salary?.replace(/[^0-9]/g, '') || '0');
      return acc + (isNaN(val) ? 0 : val);
    }
    return acc;
  }, 0);

  const totalCommissions = workerUnpaid + companyUnpaid;

  // Cash stats for administrative visualization using live system info
  const statsOverview = {
    escrowTotal: activeEscrowSum > 0 ? `RWF ${activeEscrowSum.toLocaleString()}` : 'RWF 0',
    totalUsers: users.length.toString(),
    unpaidCommission: totalCommissions > 0 ? `RWF ${totalCommissions.toLocaleString()}` : 'RWF 0',
    activeContractsCount: t('stat_active_count', { count: contracts.filter(c => c.status === 'accepted' || c.status === 'completion_requested').length }),
    suspiciousFlags: reports.length.toString()
  };

  // Recharts Volume Data
  const volumeData: { name: string; Escrowed: number; Commissions: number }[] = [];

  const distributionData = [
    { name: t('segment_workers'), count: users.filter(u => u.role === 'worker').length },
    { name: t('segment_companies'), count: users.filter(u => u.role === 'company').length },
    { name: t('segment_individuals'), count: users.filter(u => u.role === 'individual').length },
  ];




  // Display toast function
  const triggerNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ id: Date.now(), message, type });
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Secure compliance: auto-logout after 5 minutes (300 seconds) of inactivity
  useEffect(() => {
    let intervalId: any;

    const resetIdleTimer = () => {
      setIdleTime(0);
      setShowInactivityWarning(false);
    };

    // Tracking interaction vectors on Kigali ops panels
    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('mousedown', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);
    window.addEventListener('scroll', resetIdleTimer);
    window.addEventListener('touchstart', resetIdleTimer);

    intervalId = setInterval(() => {
      setIdleTime((prevTime) => {
        const nextTime = prevTime + 1;
        
        // 4.5 minutes (270s) idle triggers secure modal caution
        if (nextTime === 270) {
          setShowInactivityWarning(true);
          triggerNotification(t('toast_inactivity_warning'), "error");
        }

        // 5 minutes (300s) idle triggers secure session destruction
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
  }, []);

  // Actions
  const handleApproveVerification = (id: string, name: string) => {
    // 1. Remove from queue
    setVerificationQueue(prev => prev.filter(v => v.id !== id));
    
    // 2. Clear detail lock
    if (selectedVerification?.id === id) {
      setSelectedVerification(null);
    }

    // 3. Update User Directory verification status & boost trust rating!
    setUsers(prev => prev.map(u => {
      if (u.name === name) {
        const nextTrustScore = Math.min(u.trustScore + 15, 100);
        updateUser(u.uid, {
          verificationStatus: 'verified',
          trustScore: nextTrustScore,
        }).catch(e => console.error('API update failed', e));
        return { ...u, verificationStatus: 'verified', trustScore: nextTrustScore };
      }
      return u;
    }));

    // 4. Create audit log
    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      action: t('audit_verification_approved', { name, id }),
      category: 'SECURITY',
      date: t('time_just_now'),
      user: 'Linekora Admin'
    };
    setAuditLogs(prev => [newLog, ...prev]);

    triggerNotification(t('toast_verification_approved', { name }));
  };

  const handleRejectVerification = (id: string, name: string) => {
    setVerificationQueue(prev => prev.filter(v => v.id !== id));
    if (selectedVerification?.id === id) {
      setSelectedVerification(null);
    }

    setUsers(prev => prev.map(u => {
      if (u.name === name) {
        updateUser(u.uid, { verificationStatus: 'unverified' })
          .catch(e => console.error('API update failed', e));
        return { ...u, verificationStatus: 'unverified' };
      }
      return u;
    }));

    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      action: t('audit_verification_rejected', { name, id }),
      category: 'SECURITY',
      date: t('time_just_now'),
      user: 'Linekora Admin'
    };
    setAuditLogs(prev => [newLog, ...prev]);

    triggerNotification(t('toast_verification_rejected', { name }), 'error');
  };

  const handleResolveReport = (id: string, reportedName: string) => {
    setReports(prev => prev.filter(r => r.id !== id));
    
    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      action: t('audit_report_resolved', { reportedName }),
      category: 'SAFETY',
      date: t('time_just_now'),
      user: 'Linekora Admin'
    };
    setAuditLogs(prev => [newLog, ...prev]);

    triggerNotification(t('toast_report_resolved', { reportedName }));
  };

  const handleBanAccount = (id: string, reportedName: string, reason: string) => {
    setReports(prev => prev.filter(r => r.id !== id));
    
    setUsers(prev => prev.map(u => {
      if (u.name === reportedName) {
        updateUser(u.uid, { trustScore: 0 })
          .catch(e => console.error('API update failed', e));
        return { ...u, status: 'suspended', trustScore: 0 };
      }
      return u;
    }));

    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      action: t('audit_account_banned', { reportedName, reason }),
      category: 'SAFETY',
      date: t('time_just_now'),
      user: 'Linekora Admin'
    };
    setAuditLogs(prev => [newLog, ...prev]);

    triggerNotification(t('toast_account_banned', { reportedName }), 'error');
  };

  const handleSetTrustScore = (uid: string, newScore: number) => {
    setUsers(prev => prev.map(u => {
      if (u.uid === uid) {
        updateUser(uid, { trustScore: newScore })
          .catch(e => console.error('API update failed', e));
        return { ...u, trustScore: newScore };
      }
      return u;
    }));
    triggerNotification(t('toast_trust_reevaluated'));
  };

  const handleToggleUserStatus = (uid: string, currentStatus: string) => {
    const targetStatus: 'active' | 'warning' | 'suspended' = 
      currentStatus === 'active' ? 'warning' : currentStatus === 'warning' ? 'suspended' : 'active';
    
    setUsers(prev => prev.map(u => {
      if (u.uid === uid) {
        const nextTrustScore = targetStatus === 'suspended' ? 0 : u.trustScore;
        updateUser(uid, { trustScore: nextTrustScore })
          .catch(e => console.error('API update failed', e));
        return { ...u, status: targetStatus, trustScore: nextTrustScore };
      }
      return u;
    }));

    const targetUser = users.find(u => u.uid === uid);
    if (targetUser) {
      const newLog: AuditLog = {
        id: `log_${Date.now()}`,
        action: t('audit_status_modified', { name: targetUser.name, status: targetStatus.toUpperCase() }),
        category: 'SYSTEM',
        date: t('time_just_now'),
        user: 'Linekora Admin'
      };
      setAuditLogs(prev => [newLog, ...prev]);
    }

    triggerNotification(t('toast_status_adjusted', { status: targetStatus.toUpperCase() }));
  };

  const handleLogoutAdmin = () => {
    triggerNotification(t('toast_logging_out'), "info");
    setTimeout(() => {
      window.location.href = '/login';
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col md:flex-row font-sans selection:bg-red-500/25">
      
      {/* Dynamic Toast Notifications */}
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
            {notification.type === 'error' && <ShieldAlert size={18} className="text-red-400 shrink-0" />}
            {notification.type === 'info' && <Activity size={18} className="text-blue-400 shrink-0" />}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Sidebar */}
      <aside className="w-full md:w-80 border-b md:border-b-0 md:border-r border-gray-900 flex flex-col p-6 bg-gray-950 md:sticky md:top-0 md:h-screen shrink-0 font-sans">
        <div className="flex items-center gap-3.5 mb-10">
          <div className="h-10 w-10 bg-red-650 rounded-xl flex items-center justify-center text-white shadow-xl shadow-red-900/10 shrink-0">
            <Lock size={20} />
          </div>
          <div>
            <span className="font-sans text-lg font-black tracking-tight block text-white">LINEKORA Admin</span>
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-none bg-gray-900 px-1.5 py-0.5 rounded border border-gray-800">{t('badge_super_ops')}</span>
          </div>
        </div>
        
        <nav className="space-y-1 my-2">
          {[
            { id: 'verification', label: t('nav_verification_queue'), icon: Shield, badge: verificationQueue.length },
            { id: 'reports', label: t('nav_safety_incidents'), icon: AlertTriangle, badge: reports.length },
            { id: 'upgrades', label: t('nav_payment_upgrades'), icon: DollarSign, badge: upgradeRequests.filter(r => r.status === 'paid_awaiting_admin' || r.status === 'request_sent').length },
            { id: 'analytics', label: t('nav_financial_analytics'), icon: TrendingUp },
            { id: 'users', label: t('nav_user_directory'), icon: Users, badge: users.length },
            { id: 'logs', label: t('nav_audit_log_trail'), icon: Activity },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveTab(item.id as any);
                setSelectedVerification(null);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-sans text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
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
        </nav>

        {/* Administration User Profile card */}
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

      {/* Main Administrative Control Desk */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto bg-gray-950 select-none font-sans">
        
        {/* Dynamic header */}
        <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-900 pb-8">
          <div>
            <h1 className="text-2xl font-black font-sans tracking-tight text-white uppercase flex items-center gap-2.5">
              {activeTab === 'verification' && <Shield className="text-red-505" size={24} />}
              {activeTab === 'reports' && <AlertTriangle className="text-yellow-505" size={24} />}
              {activeTab === 'upgrades' && <DollarSign className="text-emerald-505" size={24} />}
              {activeTab === 'analytics' && <TrendingUp className="text-blue-505" size={24} />}
              {activeTab === 'users' && <Users className="text-indigo-505" size={24} />}
              {activeTab === 'logs' && <Activity className="text-teal-505" size={24} />}
              {activeTab === 'verification' && t('header_identity_vetting')}
              {activeTab === 'reports' && t('header_safety_reports')}
              {activeTab === 'upgrades' && t('header_momo_escrows')}
              {activeTab === 'analytics' && t('header_financial_ledger')}
              {activeTab === 'users' && t('header_security_registry')}
              {activeTab === 'logs' && t('header_intelligence_logs')}
            </h1>
            <p className="text-gray-400 font-sans font-black mt-1.5 uppercase tracking-[0.25em] text-[10px] flex items-center gap-1.5 leading-none">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
              {t('ops_desk_cluster')}
            </p>
          </div>
          
          <div className="flex gap-2">
            <div className="flex bg-gray-900 p-1 rounded-xl border border-gray-800">
              <button type="button" className="px-3 py-1.5 bg-gray-800 rounded-lg text-[9px] font-black uppercase tracking-widest text-white border border-gray-700 select-none">{t('live_ops')}</button>
              <button 
                type="button" 
                onClick={() => triggerNotification(t('toast_archive_synced'))}
                className="px-3 py-1.5 text-gray-500 hover:text-gray-300 text-[9px] font-black uppercase tracking-widest cursor-pointer"
              >
                {t('archives')}
              </button>
            </div>
            <button 
              type="button"
              onClick={() => {
                fetchRealUsers();
                triggerNotification(t('toast_index_up_to_date'));
              }}
              className="p-2.5 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white rounded-xl border border-gray-800 transition-all cursor-pointer"
              title={t('refresh_title')}
            >
              <RefreshCw size={14} className="hover:rotate-180 transition-transform duration-500" />
            </button>
          </div>
        </header>

        {/* Dynamic Widget Grid for analytics on tab switch */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: t('stat_active_escrow'), value: statsOverview.escrowTotal, color: 'text-blue-400', desc: t('stat_secure_funds') },
            { label: t('stat_commissions_due'), value: statsOverview.unpaidCommission, color: 'text-green-400', desc: t('stat_service_revenue') },
            { label: t('stat_registered_directory'), value: statsOverview.totalUsers, color: 'text-indigo-400', desc: t('stat_vetted_files') },
            { label: t('stat_unresolved_complaints'), value: statsOverview.suspiciousFlags, color: 'text-red-400', desc: t('stat_flag_reports') },
          ].map((stat, i) => (
            <div key={i} className="p-5 bg-gray-905 border border-gray-900 rounded-[2rem] flex flex-col justify-between">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <div className="my-2 flex items-baseline gap-1.5">
                <span className={`text-xl font-extrabold font-sans tracking-tight ${stat.color}`}>{stat.value}</span>
              </div>
              <p className="text-[9px] font-bold text-gray-500 italic mt-1 leading-none">{stat.desc}</p>
            </div>
          ))}
        </div>

        {/* ==========================================
            UPGRADES VIEW: MTN MOMO GATEWAY MONITORING
            ========================================== */}
        {activeTab === 'upgrades' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left section: Queue list */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-gray-905 p-6 rounded-[2rem] border border-gray-900">
                <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4">{t('upgrades_title')}</h3>
                <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider leading-relaxed mb-6">
                  {t('upgrades_desc')}
                </p>

                <div className="space-y-4">
                  {upgradeRequests.length > 0 ? (
                    upgradeRequests.map((req) => (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        key={req.id}
                        className="p-5 bg-gray-950 rounded-2xl border border-gray-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-gray-800 transition-all font-sans"
                      >
                        <div className="space-y-3 flex-1 font-sans">
                          <div className="flex items-center gap-3 font-sans">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest font-sans ${
                              req.status === 'approved' ? 'bg-green-950/45 text-green-400 border border-green-900/40' :
                              req.status === 'rejected' ? 'bg-red-950/45 text-red-400 border border-red-900/40' :
                              req.status === 'paid_awaiting_admin' ? 'bg-amber-955/20 text-amber-400 border border-amber-900/40 animate-pulse' :
                              'bg-indigo-950/45 text-indigo-400 border border-indigo-900/40'
                            }`}>
                              {statusText(req.status)}
                            </span>
                            <span className="text-gray-550 font-black text-[9px] uppercase tracking-wider">{req.date}</span>
                          </div>

                          <div>
                            <h4 className="text-sm font-black text-white leading-tight font-sans">{req.userName}</h4>
                            <p className="text-[10px] text-gray-450 font-mono mt-0.5">
                              {req.userEmail} • {t('phone_label')}: {req.paymentPhoneOrCard}
                              {req.momoTxRef && <span className="text-amber-400 font-bold ml-2">{t('tx_ref')} {req.momoTxRef}</span>}
                            </p>
                          </div>

                          <div className="p-3.5 bg-gray-905 rounded-xl border border-gray-900 max-w-sm">
                            <div className="flex justify-between items-center text-[10px] font-bold">
                              <span className="text-gray-455 uppercase tracking-widest text-[9px]">{t('selected_tier')}</span>
                              <span className="text-white font-black">{req.tierName}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] font-extrabold mt-1 border-t border-gray-900/60 pt-1.5">
                              <span className="text-gray-455 uppercase tracking-widest text-[9px]">{t('review_fee')}</span>
                              <span className="text-emerald-400">RWF {req.price}</span>
                            </div>
                          </div>

                          {/* Process Timeline Steps inside the list */}
                          <div className="pt-2">
                            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-2 font-sans">{t('process_logs_timeline')}</p>
                            <div className="space-y-1.5 border-l border-gray-900 pl-3">
                              {req.steps?.map((step: any, sIdx: number) => (
                                <div key={sIdx} className="flex items-center gap-2">
                                  <span className={`h-1.5 w-1.5 rounded-full ${step.done ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`}></span>
                                  <p className="text-[9px] font-bold text-gray-400 font-sans italic">
                                    {step.title} <span className="text-gray-555 font-mono not-italic text-[8px]">({step.date})</span>
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto self-stretch sm:self-center justify-center">
                          {req.status === 'paid_awaiting_admin' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApproveUpgrade(req.id)}
                                className="w-full sm:w-36 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-emerald-950/30 flex items-center justify-center gap-1.5"
                              >
                                <CheckCircle2 size={12} />
                                {t('approve_verify')}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectUpgrade(req.id)}
                                className="w-full sm:w-36 py-2.5 px-4 bg-red-950/40 hover:bg-red-950/80 text-red-400 border border-red-900/30 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <XCircle size={12} />
                                {t('reject_clear')}
                              </button>
                            </>
                          ) : req.status === 'request_sent' ? (
                            <div className="text-center p-3 bg-indigo-950/25 border border-indigo-900/35 rounded-xl font-mono text-[9px] text-indigo-305 uppercase font-black tracking-widest">
                              <Smartphone className="mx-auto mb-1 animate-bounce text-indigo-400" size={16} />
                              {t('awaiting_user_pin')}
                            </div>
                          ) : req.status === 'approved' ? (
                            <div className="text-center p-3 bg-emerald-955/10 border border-emerald-900/30 rounded-xl font-mono text-[9px] text-emerald-400 uppercase font-black tracking-widest">
                              {t('approved_shield_live')}
                            </div>
                          ) : (
                            <div className="text-center p-3 bg-gray-900 border border-gray-805 rounded-xl font-mono text-[9px] text-gray-500 uppercase font-bold tracking-widest">
                              {t('rejected_log')}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="p-12 text-center bg-gray-950 border border-gray-904 rounded-2xl">
                      <p className="text-gray-500 font-sans text-xs italic">{t('no_active_upgrades')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right section: Form query directly on user phone */}
            <div className="space-y-6">
              <div className="bg-gray-905 p-6 rounded-[2rem] border border-gray-900 shadow-sm">
                <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4">{t('direct_push_title')}</h3>
                <p className="text-gray-400 font-sans text-[10px] leading-relaxed mb-6 font-bold uppercase">
                  {t('direct_push_desc')}
                </p>

                <form onSubmit={handleCreatePaymentRequest} className="space-y-4 font-sans">
                  <div>
                    <label className="block text-[8px] font-black uppercase tracking-widest text-gray-500 mb-2 font-sans">{t('target_user_name')}</label>
                    <input 
                      type="text"
                      required
                      placeholder="Shema Honore"
                      value={adminSelectUser}
                      onChange={(e) => setAdminSelectUser(e.target.value)}
                      className="w-full p-3 bg-gray-950 border border-gray-900 focus:border-emerald-500 rounded-xl outline-none font-sans font-bold text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-black uppercase tracking-widest text-gray-500 mb-2 font-sans">{t('momo_mobile_number')}</label>
                    <input 
                      type="text"
                      required
                      placeholder="+250 788 300 120"
                      value={adminSendPhone}
                      onChange={(e) => setAdminSendPhone(e.target.value)}
                      className="w-full p-3 bg-gray-950 border border-gray-900 focus:border-emerald-500 rounded-xl outline-none font-sans font-black text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-black uppercase tracking-widest text-gray-500 mb-2 font-sans">{t('target_role')}</label>
                    <div className="grid grid-cols-2 gap-2 bg-gray-950 p-1 rounded-xl border border-gray-900">
                      <button 
                        type="button" 
                        onClick={() => setAdminSendRole('worker')}
                        className={`py-2 rounded-lg text-[9px] font-black uppercase tracking-wider font-sans cursor-pointer transition-colors ${adminSendRole === 'worker' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'}`}
                      >
                        {t('role_worker')}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setAdminSendRole('company')}
                        className={`py-2 rounded-lg text-[9px] font-black uppercase tracking-wider font-sans cursor-pointer transition-colors ${adminSendRole === 'company' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'}`}
                      >
                        {t('role_company')}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[8px] font-black uppercase tracking-widest text-gray-500 mb-2 font-sans">{t('membership_shield_level')}</label>
                    <select 
                      value={adminSelectTier}
                      onChange={(e) => setAdminSelectTier(e.target.value)}
                      className="w-full p-3 bg-gray-950 border border-gray-900 focus:border-emerald-500 rounded-xl outline-none font-sans font-bold text-xs text-white cursor-pointer"
                    >
                      <option value="Verified Bronze">Verified Bronze (RWF 15,000)</option>
                      <option value="Verified Silver">Verified Silver (RWF 35,000)</option>
                    </select>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
                  >
                    <Smartphone size={14} className="animate-bounce" />
                    {t('dispatch_handshake')}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            1. TAB VIEW: VERIFICATION QUEUE
            ========================================== */}
        {activeTab === 'verification' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Verification Feed list */}
            <div className="lg:col-span-2 space-y-4">
              {verificationQueue.length > 0 ? (
                verificationQueue.map((item) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    key={item.id} 
                    className={`p-6 rounded-[2rem] flex flex-col sm:flex-row items-start sm:items-center justify-between border transition-all gap-4 bg-gray-905 ${
                      selectedVerification?.id === item.id 
                        ? 'border-red-500/40 bg-red-950/5 shadow-lg shadow-red-950/10' 
                        : 'border-gray-900 hover:border-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-gray-900 rounded-xl flex items-center justify-center text-gray-500 border border-gray-800 shrink-0">
                        <User size={22} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-black text-white font-sans">{item.user}</h3>
                          <span className="text-[8px] font-black px-2 py-0.5 bg-gray-900 text-gray-400 rounded border border-gray-800 uppercase tracking-widest">{roleLabel(item.type)}</span>
                        </div>
                        <p className="text-gray-400 text-[10px] mt-1 font-semibold">
                          {t('submitted_file')}: <span className="font-mono text-gray-300 bg-gray-900 px-1.5 py-0.5 rounded text-[9px] border border-gray-800">{item.idType}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button 
                        type="button"
                        onClick={() => setSelectedVerification(item)}
                        className="py-2.5 px-3.5 bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-850 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Eye size={12} />
                        {t('review_folder')}
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleApproveVerification(item.id, item.user)}
                        className="p-2.5 bg-green-950/35 hover:bg-green-650 text-green-400 hover:text-white border border-green-900/40 hover:border-green-600 rounded-lg transition-all cursor-pointer"
                        title={t('grant_badge_tip')}
                      >
                        <Check size={14} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleRejectVerification(item.id, item.user)}
                        className="p-2.5 bg-red-950/30 hover:bg-red-650 text-red-400 hover:text-white border border-red-900/30 hover:border-red-600 rounded-lg transition-all cursor-pointer"
                        title={t('reject_id_tip')}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-12 text-center bg-gray-905 border border-gray-900 rounded-[2.5rem] flex flex-col items-center justify-center">
                  <CheckCircle2 size={40} className="text-green-500/40 mb-3 animate-pulse" />
                  <p className="font-sans font-black uppercase tracking-wider text-xs text-gray-300">{t('identity_desk_cleared')}</p>
                  <p className="text-gray-500 font-sans text-[10px] mt-1 italic font-semibold">{t('all_pending_processed')}</p>
                </div>
              )}
            </div>

            {/* Verification Folder detail pane (Right column) */}
            <div className="bg-gray-905 p-6 rounded-[2.5rem] border border-gray-900 space-y-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center justify-between border-b border-gray-900 pb-4">
                <span>{t('verification_file_detail')}</span>
                <span className="text-[8px] tracking-normal font-bold bg-gray-900 px-1.5 py-0.5 rounded border border-gray-805">{t('audit_locker')}</span>
              </h3>

              {selectedVerification ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-red-950/20 text-red-400 border border-red-900/50 rounded-lg flex items-center justify-center font-black text-[9px]">
                      {selectedVerification.code}
                    </div>
                    <div>
                      <h4 className="font-black text-white text-sm leading-none">{selectedVerification.user}</h4>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{t('pending_type_verification', { type: roleLabel(selectedVerification.type) })}</p>
                    </div>
                  </div>

                  {/* Real uploaded ID document images */}
                  {(selectedVerification.frontId || selectedVerification.backId) ? (
                    <div className="space-y-3">
                      <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest block leading-none">{t('uploaded_id_documents')}</span>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedVerification.frontId ? (
                          <div className="space-y-1">
                            <p className="text-[8px] text-gray-600 font-black uppercase tracking-widest">{t('front_id')}</p>
                            <img
                              src={selectedVerification.frontId}
                              alt={t('front_id')}
                              className="w-full h-28 object-cover rounded-xl border border-gray-800 bg-gray-950"
                            />
                          </div>
                        ) : (
                          <div className="h-28 rounded-xl border border-dashed border-gray-800 bg-gray-950 flex items-center justify-center">
                            <p className="text-[9px] text-gray-600 font-bold uppercase">{t('no_front_id')}</p>
                          </div>
                        )}
                        {selectedVerification.backId ? (
                          <div className="space-y-1">
                            <p className="text-[8px] text-gray-600 font-black uppercase tracking-widest">{t('back_id')}</p>
                            <img
                              src={selectedVerification.backId}
                              alt={t('back_id')}
                              className="w-full h-28 object-cover rounded-xl border border-gray-800 bg-gray-950"
                            />
                          </div>
                        ) : (
                          <div className="h-28 rounded-xl border border-dashed border-gray-800 bg-gray-950 flex items-center justify-center">
                            <p className="text-[9px] text-gray-600 font-bold uppercase">{t('no_back_id')}</p>
                          </div>
                        )}
                      </div>
                      {selectedVerification.selfie && (
                        <div className="space-y-1">
                          <p className="text-[8px] text-gray-600 font-black uppercase tracking-widest">{t('biometric_selfie')}</p>
                          <img
                            src={selectedVerification.selfie}
                            alt={t('biometric_selfie')}
                            referrerPolicy="no-referrer"
                            className="w-24 h-24 object-cover rounded-2xl border border-gray-800 bg-gray-950"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-3">
                      <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest block mb-2 leading-none">{t('scanned_identity_artifact')}</span>
                      <IdentityCardVisual 
                        name={selectedVerification.user}
                        type={selectedVerification.type}
                        idType={selectedVerification.idType}
                        details={selectedVerification.details}
                        code={selectedVerification.code}
                      />
                    </div>
                  )}

                  <div className="space-y-3 text-xs leading-relaxed">
                    {selectedVerification.nationalIdNum && (
                      <div className="p-3 bg-gray-950 rounded-xl border border-gray-900">
                        <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider block mb-1">{t('national_id_number')}</span>
                        <p className="font-mono font-black text-white tracking-widest">{selectedVerification.nationalIdNum}</p>
                      </div>
                    )}

                    <div className="p-3 bg-gray-950 rounded-xl border border-gray-900">
                      <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider block mb-1">{t('uploaded_document_type')}</span>
                      <p className="font-black text-white">{selectedVerification.idType}</p>
                    </div>

                    {selectedVerification.selectedTier && (
                      <div className="p-3 bg-gray-950 rounded-xl border border-gray-900">
                        <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider block mb-1">{t('requested_verification_tier')}</span>
                        <p className="font-black text-orange-400 uppercase tracking-wider">{selectedVerification.selectedTier}</p>
                      </div>
                    )}

                    {selectedVerification.certFile && (
                      <div className="p-3 bg-gray-950 rounded-xl border border-gray-900 space-y-2">
                        <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider block mb-1">{t('business_registration_cert')}</span>
                        {selectedVerification.certFile.startsWith('data:') ? (
                          <img src={selectedVerification.certFile} alt={t('business_certificate_alt')} className="w-full h-32 object-cover rounded-lg border border-gray-800" />
                        ) : (
                          <p className="font-bold text-gray-300 text-xs">{selectedVerification.certFileName || t('certificate_uploaded')}</p>
                        )}
                      </div>
                    )}

                    {selectedVerification.address && (
                      <div className="p-3 bg-gray-950 rounded-xl border border-gray-900">
                        <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider block mb-1">{t('office_address')}</span>
                        <p className="font-bold text-gray-200">{selectedVerification.address}</p>
                      </div>
                    )}

                    {selectedVerification.website && (
                      <div className="p-3 bg-gray-950 rounded-xl border border-gray-900">
                        <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider block mb-1">{t('company_website')}</span>
                        <p className="font-bold text-blue-400">{selectedVerification.website}</p>
                      </div>
                    )}

                    <div className="p-3 bg-gray-950 rounded-xl border border-gray-900">
                      <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider block mb-1">{t('submission_timestamp')}</span>
                      <p className="text-gray-400 font-mono font-bold">{selectedVerification.date}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-900">
                    <button
                      type="button"
                      onClick={() => handleApproveVerification(selectedVerification.id, selectedVerification.user)}
                      className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-green-950/20"
                    >
                      <CheckCircle2 size={14} />
                      {t('approve_file')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRejectVerification(selectedVerification.id, selectedVerification.user)}
                      className="flex-1 py-3 bg-red-950 hover:bg-red-900 text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-red-900/30"
                    >
                      <XCircle size={14} />
                      {t('reject_flag')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-gray-500 font-sans text-xs italic font-semibold flex flex-col items-center justify-center">
                  <Eye size={24} className="text-gray-502 mb-2 stroke-1" />
                  {t('select_folder_hint')}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ==========================================
            2. TAB VIEW: SAFETY & REPORTS
            ========================================== */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-gray-905 border border-gray-900 rounded-[2.5rem] overflow-hidden">
              <div className="p-6 bg-gray-900/50 border-b border-gray-900 flex justify-between items-center">
                <h3 className="text-xs font-black text-gray-300 uppercase tracking-widest">{t('active_safety_incidents_log')}</h3>
                <span className="text-[9px] font-black uppercase bg-red-955/20 text-red-500 border border-red-900/30 px-2.5 py-0.5 rounded">{t('emergency_escrow_monitor')}</span>
              </div>
              
              {reports.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-900 bg-gray-950 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                      <th className="px-6 py-4">{t('th_reported_account')}</th>
                      <th className="px-6 py-4">{t('th_issue_description')}</th>
                      <th className="px-6 py-4 text-center">{t('th_severity')}</th>
                      <th className="px-6 py-4">{t('th_filer_info')}</th>
                      <th className="px-6 py-4 text-right">{t('th_emergency_actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-900 font-sans">
                    {reports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-900/20 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-gray-900 rounded-lg flex items-center justify-center text-xs font-black text-gray-400 shrink-0 select-none">
                              {report.reported[0]}
                            </div>
                            <div>
                              <p className="font-bold text-gray-200 text-sm">{report.reported}</p>
                              <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider">{report.date}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 max-w-sm">
                          <p className="text-xs font-black text-gray-350 tracking-tight leading-relaxed">{report.reason}</p>
                          <p className="text-[10px] text-gray-400 mt-1 italic font-medium line-clamp-2 leading-relaxed">{report.details}</p>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                            report.severity === 'high' ? 'bg-red-950/40 text-red-400 border border-red-900/40' : 'bg-yellow-950/30 text-yellow-500 border border-yellow-905'
                          }`}>
                            {statusText(report.severity)}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-xs text-gray-400 font-semibold">{report.reporter}</td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleResolveReport(report.id, report.reported)}
                              className="px-3.5 py-1.5 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-lg text-[9px] font-black uppercase tracking-wider border border-gray-850 cursor-pointer"
                            >
                              {t('dismiss_false_alarm')}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleBanAccount(report.id, report.reported, report.reason)}
                              className="px-3.5 py-1.5 bg-red-650 hover:bg-red-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider shadow-lg shadow-red-950/20 cursor-pointer flex items-center gap-1"
                            >
                              <Ban size={10} />
                              {t('ban_account_file')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-16 text-center flex flex-col items-center justify-center">
                  <ShieldAlert size={48} className="text-green-500/20 mb-3 animate-bounce" />
                  <p className="font-sans font-black uppercase tracking-wider text-xs text-gray-300">{t('operations_fully_vetted')}</p>
                  <p className="text-gray-500 font-sans text-[10px] mt-1 italic font-semibold">{t('zero_active_reports')}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==========================================
            3. TAB VIEW: FINANCIAL ANALYTICS
            ========================================== */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            
            {/* Visual Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Main Area Chart: Platform Volume flow */}
              <div className="lg:col-span-2 bg-gray-905 p-6 rounded-[2.5rem] border border-gray-900">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">{t('system_escrow_volume')}</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={volumeData}>
                      <defs>
                        <linearGradient id="colorEscrow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#4b5563" fontSize={10} tickLine={false} />
                      <YAxis stroke="#4b5563" fontSize={10} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px' }}
                        labelStyle={{ fontWeight: 'bold', color: '#fff', fontSize: '11px' }}
                        itemStyle={{ color: '#ef4444', fontSize: '11px' }}
                      />
                      <Area type="monotone" dataKey="Escrowed" stroke="#ef4444" fillOpacity={1} fill="url(#colorEscrow)" strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex gap-6 text-[10px] text-gray-500 font-black uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-red-500"></span>
                    RWF {t('cumulative_transferred_volume')}
                  </span>
                </div>
              </div>

              {/* Bar Chart: User Demographics */}
              <div className="bg-gray-905 p-6 rounded-[2.5rem] border border-gray-900">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">{t('platform_segment_distribution')}</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distributionData}>
                      <XAxis dataKey="name" stroke="#4b5563" fontSize={9} tickLine={false} />
                      <YAxis stroke="#4b5563" fontSize={10} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px' }}
                        itemStyle={{ color: '#f59e0b', fontSize: '11px' }}
                      />
                      <Bar dataKey="count" fill="#4f46e5" radius={[10, 10, 0, 0]} barSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-center text-[9px] text-gray-500 font-bold italic uppercase tracking-wider">
                  {t('directory_distribution_metrics')}
                </div>
              </div>

            </div>

            {/* Platform Commission Controls */}
            <div className="bg-gray-905 p-6 rounded-[2.5rem] border border-gray-900">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="text-xs font-black text-gray-300 uppercase tracking-widest text-white">{t('outstanding_commission_controls')}</h4>
                  <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-wider">{t('commission_controls_desc')}</p>
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="px-4 py-2 bg-gray-950 border border-gray-900 rounded-xl text-xs font-sans">
                    <span className="text-gray-500 uppercase font-black text-[8px] block mb-0.5 tracking-wider font-sans leading-none">{t('worker_account_due')}</span>
                    <span className="font-black text-gray-200 font-mono">RWF {workerUnpaid.toLocaleString()}</span>
                  </div>
                  <div className="px-4 py-2 bg-gray-950 border border-gray-900 rounded-xl text-xs font-sans">
                    <span className="text-gray-500 uppercase font-black text-[8px] block mb-0.5 tracking-wider font-sans leading-none">{t('company_account_due')}</span>
                    <span className="font-black text-gray-200 font-mono">RWF {companyUnpaid.toLocaleString()}</span>
                  </div>
                  {(workerUnpaid > 0 || companyUnpaid > 0) && (
                    <button
                      type="button"
                      onClick={() => {
                        setWorkerUnpaid(0);
                        setCompanyUnpaid(0);
                        
                        const logEntry: AuditLog = {
                          id: `log_${Date.now()}`,
                          action: t('audit_commissions_waived'),
                          category: 'FINANCIAL',
                          date: t('time_just_now'),
                          user: 'Linekora Admin'
                        };
                        setAuditLogs(prev => [logEntry, ...prev]);
                        triggerNotification(t('toast_commissions_waived'));
                      }}
                      className="px-4 py-3.5 bg-green-650 hover:bg-green-600 border border-transparent text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-green-950/25"
                    >
                      <CheckCircle2 size={12} />
                      {t('waive_all_commissions')}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Financial Ledger Details Table - LIVE INFO */}
            <div className="bg-gray-905 border border-gray-900 rounded-[2.5rem] overflow-hidden">
              <div className="p-6 bg-gray-900/40 border-b border-gray-900 flex justify-between items-center">
                <h3 className="text-xs font-black text-white uppercase tracking-widest">{t('commission_escrow_ledger')}</h3>
                <span className="text-[8px] font-black uppercase tracking-widest bg-blue-950 text-blue-400 px-2.5 py-1 rounded border border-blue-900/30 font-sans">{t('total_records_count', { count: contracts.length })}</span>
              </div>
              <table className="w-full text-left">
                <thead className="bg-gray-950 text-gray-500 text-[9px] font-black uppercase tracking-widest border-b border-gray-900">
                  <tr>
                    <th className="px-6 py-4">{t('th_transaction_scope')}</th>
                    <th className="px-6 py-4">{t('th_source_employer')}</th>
                    <th className="px-6 py-4">{t('th_assigned_worker')}</th>
                    <th className="px-6 py-4">{t('th_verification_check')}</th>
                    <th className="px-6 py-4">{t('th_escrow_value')}</th>
                    <th className="px-6 py-4 text-right font-black">{t('th_authorized_operations')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-900 text-xs font-sans text-gray-300">
                  {contracts.length > 0 ? (
                    contracts.map((contract) => {
                      const amount = Number(contract.salary?.replace(/[^0-9]/g, '') || '0');
                      const platformFee = Math.round(amount * 0.05); // 5% dynamic fee representation
                      return (
                        <tr key={contract.id} className="hover:bg-gray-900/15 transition-all">
                          <td className="px-6 py-5">
                            <div>
                              <p className="font-extrabold text-gray-250 font-sans text-sm">{contract.jobTitle}</p>
                              <span className="text-[9px] uppercase font-black text-gray-500 tracking-wider">{t('locker_token_id', { id: contract.id })}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 font-bold text-gray-400">{contract.company || contract.employerName}</td>
                          <td className="px-6 py-5 font-bold text-gray-400">{contract.workerName || t('not_assigned')}</td>
                          <td className="px-6 py-5">
                            <span className={`text-[9px] font-black px-2.5 py-0.5 border rounded uppercase tracking-widest ${
                              contract.status === 'accepted' ? 'bg-blue-955/20 text-blue-400 border-blue-900/30' :
                              contract.status === 'completion_requested' ? 'bg-yellow-955/20 text-yellow-400 border-yellow-904/30' :
                              contract.status === 'completed' ? 'bg-green-955/20 text-green-400 border-green-900/40' :
                              'bg-gray-900 text-gray-500 border-gray-800'
                            }`}>
                              {statusText(contract.status)}
                            </span>
                          </td>
                          <td className="px-6 py-5 font-sans font-black text-gray-200">{contract.salary}</td>
                          <td className="px-6 py-5 text-right font-sans">
                            <div className="flex justify-end gap-2">
                              {(contract.status === 'accepted' || contract.status === 'completion_requested') && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Manually Complete Contract / Release Escrow
                                    setContracts(prev => prev.map(c => 
                                      c.id === contract.id ? { ...c, status: 'completed', commissionPaidWorker: true, commissionPaidEmployer: true } : c
                                    ));
                                    
                                    // Record audit trail
                                    const logEntry: AuditLog = {
                                      id: `log_${Date.now()}`,
                                      action: t('audit_escrow_released', { salary: contract.salary, jobTitle: contract.jobTitle, id: contract.id }),
                                      category: 'FINANCIAL',
                                      date: t('time_just_now'),
                                      user: 'Linekora Admin'
                                    };
                                    setAuditLogs(prev => [logEntry, ...prev]);
                                    triggerNotification(t('toast_escrow_released', { salary: contract.salary, workerName: contract.workerName }));
                                  }}
                                  className="px-3.5 py-2 bg-red-650 hover:bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-red-950/15 cursor-pointer block border border-transparent hover:border-red-500/25 active:scale-95"
                                >
                                  {t('release_escrow')}
                                </button>
                              )}
                              
                              <button
                                type="button"
                                onClick={() => {
                                  triggerNotification(t('toast_contract_synced', { id: contract.id }));
                                }}
                                className="px-3.5 py-2 bg-gray-900 hover:bg-gray-850 border border-gray-850 text-gray-400 hover:text-white text-[9px] font-black uppercase tracking-widest rounded-xl cursor-pointer block transition-all"
                              >
                                {t('audit_file')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center text-gray-500 font-sans text-xs italic font-semibold">
                        {t('no_active_contracts')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ==========================================
            4. TAB VIEW: USER DIRECTORY
            ========================================== */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            
            {/* Search and filter controls */}
            <div className="bg-gray-905 p-6 rounded-[2.5rem] border border-gray-900 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-80 font-sans">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('search_registry_placeholder')}
                  className="w-full pl-10 pr-4 py-3 bg-gray-950 border border-gray-900 rounded-xl text-xs font-bold outline-none focus:border-red-600 font-sans"
                />
              </div>

              <div className="flex gap-2 shrink-0 flex-wrap">
                {['all', 'worker', 'company', 'individual'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setRoleFilter(role as any)}
                    className={`px-4 py-2.5 rounded-xl text-[9px] uppercase tracking-wider font-black transition-all cursor-pointer ${
                      roleFilter === role 
                        ? 'bg-red-650 hover:bg-red-600 border border-red-500/25 text-white' 
                        : 'bg-gray-950 border border-gray-850 text-gray-400 hover:text-white'
                    }`}
                  >
                    {t('segment_label', { role: roleLabel(role) })}
                  </button>
                ))}
              </div>
            </div>

            {/* Registry List table */}
            <div className="bg-gray-905 border border-gray-900 rounded-[2.5rem] overflow-hidden">
              <table className="w-full text-left font-sans">
                <thead className="bg-gray-950 border-b border-gray-900 text-[10px] font-black uppercase text-gray-500 tracking-widest">
                  <tr>
                    <th className="px-6 py-4">{t('th_account_file')}</th>
                    <th className="px-6 py-4 text-center">{t('th_trust_rating')}</th>
                    <th className="px-6 py-4">{t('th_identity_vetting')}</th>
                    <th className="px-6 py-4">{t('th_profile_status')}</th>
                    <th className="px-6 py-4 text-right">{t('th_force_overrides')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-900">
                  {users
                    .filter(user => {
                      const matchRole = roleFilter === 'all' || user.role === roleFilter;
                      const matchSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                          user.location.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
                      return matchRole && matchSearch;
                    })
                    .map((user) => (
                      <tr key={user.uid} className="hover:bg-gray-900/15 transition-all">
                        <td className="px-6 py-5">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-150 text-sm">{user.name}</span>
                              <span className="text-[8px] tracking-wider font-extrabold uppercase bg-gray-950 text-gray-400 border border-gray-800 px-2 py-0.5 rounded">
                                {roleLabel(user.role)}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1 uppercase font-black tracking-wider font-mono">
                              {t('email_loc', { email: user.email, loc: user.location })}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-5 max-w-xs">
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-mono font-black shrink-0 ${
                              user.trustScore >= 80 ? 'text-green-400' : user.trustScore >= 50 ? 'text-yellow-405' : 'text-red-400'
                            }`}>
                              {t('trust_vetted', { score: user.trustScore })}
                            </span>
                            
                            {/* Adjustment slider to dynamically demonstrate editing in real-time */}
                            <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              value={user.trustScore}
                              onChange={(e) => handleSetTrustScore(user.uid, Number(e.target.value))}
                              className="w-24 accent-red-600 bg-gray-950 rounded-lg h-1.5 focus:outline-none cursor-pointer"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest ${
                            user.verificationStatus === 'verified' ? 'bg-green-950/40 text-green-300 border border-green-900/40' :
                            user.verificationStatus === 'pending' ? 'bg-yellow-950/30 text-yellow-500 border border-yellow-905' :
                            'bg-gray-900 text-gray-500 border border-gray-800'
                          }`}>
                            {statusText(user.verificationStatus)}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest inline-flex items-center gap-1 leading-none ${
                            user.status === 'active' ? 'bg-green-650/10 text-green-400 border border-green-550/20' :
                            user.status === 'warning' ? 'bg-amber-652/10 text-amber-500 border border-amber-550/20' :
                            'bg-red-651/10 text-red-400 border border-red-550/20 shadow-inner'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              user.status === 'active' ? 'bg-green-500' :
                              user.status === 'warning' ? 'bg-amber-500 animate-pulse' :
                              'bg-red-500 animate-ping'
                            }`}></span>
                            {statusText(user.status)}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right font-sans">
                          <div className="flex justify-end gap-2.5">
                            <button
                              type="button"
                              onClick={() => {
                                setInspectingUser(user);
                                triggerNotification(t('toast_audit_requested', { name: user.name }), "info");
                              }}
                              className="p-2 text-gray-500 hover:text-blue-400 hover:bg-gray-950 border border-transparent hover:border-gray-800 rounded-lg transition-all cursor-pointer"
                              title={t('inspect_folder_tip')}
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleUserStatus(user.uid, user.status)}
                              className={`py-1.5 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                                user.status === 'active' ? 'bg-yellow-950/20 border-yellow-900/40 text-yellow-500 hover:bg-yellow-650 hover:text-white hover:border-yellow-600' :
                                user.status === 'warning' ? 'bg-red-955/20 border-red-900/40 text-red-400 hover:bg-red-650 hover:text-white hover:border-red-600' :
                                'bg-green-955/20 border-green-900/40 text-green-400 hover:bg-green-650 hover:text-white hover:border-green-600'
                              }`}
                            >
                              {user.status === 'active' ? t('btn_warn_profile') : user.status === 'warning' ? t('btn_suspend_profile') : t('btn_restore_active')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ==========================================
            5. TAB VIEW: SYSTEM AUDIT LOGS
            ========================================== */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            <div className="bg-gray-905 p-6 rounded-[2.5rem] border border-gray-900 space-y-6">
              
              <div className="flex justify-between items-center border-b border-gray-900 pb-4">
                <div>
                  <h3 className="text-xs font-black text-gray-300 uppercase tracking-widest">{t('core_audit_log_trail')}</h3>
                  <p className="text-[10px] text-gray-500 font-bold italic mt-1 uppercase tracking-wider">{t('audit_ledger_subtitle')}</p>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    setAuditLogs([]);
                    triggerNotification(t('toast_audit_cleared'));
                  }}
                  className="flex items-center gap-1.5 text-[9px] font-black uppercase text-red-500 hover:text-red-400 hover:underline cursor-pointer"
                >
                  <Trash2 size={12} />
                  {t('clear_ledger')}
                </button>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-none font-mono text-[11px] leading-relaxed">
                {auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
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
                  ))
                ) : (
                  <div className="py-16 text-center text-gray-500 font-sans text-xs italic font-semibold">
                    {t('audit_void_msg')}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </main>

      {/* ==========================================
          ADMIN SECURITY COMPLIANCE: 5-MIN INACTIVITY AUTO-LOGOUT WARNING MODAL
          ========================================== */}
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
              {/* Pulsing Caution Icon */}
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
                    triggerNotification(t('toast_session_extended'), "info");
                  }}
                  className="w-full py-4 bg-red-650 hover:bg-red-600 border border-transparent text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg cursor-pointer flex items-center justify-center gap-1.5 hover:shadow-red-950/10 hover:translate-y-[-1px] select-none"
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

      {/* ==========================================
          DURABLE MODAL: DETAILED USER CREDENTIALS VETTING & OVERRIDES
          ========================================== */}
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
              {/* Close Button */}
              <button 
                type="button"
                onClick={() => setInspectingUser(null)}
                className="absolute top-6 right-6 p-2 rounded-xl bg-gray-950/80 border border-gray-900 text-gray-500 hover:text-white cursor-pointer transition-all hover:border-gray-800"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-3.5 border-b border-gray-900 pb-5 mb-5 select-none">
                <div className="h-10 w-10 bg-red-950/30 text-red-400 border border-red-900/40 rounded-xl flex items-center justify-center">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider font-sans leading-none">{inspectingUser.name}</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1.5">{t('segment_registry_uid', { role: roleLabel(inspectingUser.role), uid: inspectingUser.uid })}</p>
                </div>
              </div>

              {/* Subliminal ID Preview Section */}
              <div className="space-y-5">
                <div>
                  <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest block mb-2 leading-none">{t('dossier_document_vetted')}</span>
                  <IdentityCardVisual 
                    name={inspectingUser.name}
                    type={inspectingUser.role === 'company' ? 'Company' : 'Worker'}
                    idType={inspectingUser.role === 'company' ? 'Certificate of Inc.' : 'National ID'}
                    details={inspectingUser.role === 'company' ? `Company Reg Code: C-2025-${inspectingUser.uid.toUpperCase()}` : `NID: 1199${inspectingUser.uid.toUpperCase()}054231`}
                    code={inspectingUser.uid.toUpperCase()}
                  />
                </div>

                {/* Account details & information list */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 bg-gray-950 rounded-xl border border-gray-900">
                    <span className="text-[8px] text-gray-500 font-black uppercase tracking-wider block mb-1">{t('contact_email_address')}</span>
                    <span className="font-sans font-bold text-gray-200">{inspectingUser.email}</span>
                  </div>
                  <div className="p-3.5 bg-gray-950 rounded-xl border border-gray-900">
                    <span className="text-[8px] text-gray-500 font-black uppercase tracking-wider block mb-1">{t('geographic_headquarters')}</span>
                    <span className="font-sans font-bold text-gray-200">{inspectingUser.location}</span>
                  </div>
                </div>

                {/* Live Overrides Section */}
                <div className="bg-gray-950/40 border border-gray-900 p-5 rounded-2xl space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-900/60 pb-2">{t('active_admin_compliance')}</h4>
                  
                  {/* Verification Vetting Overrides */}
                  <div className="flex items-center justify-between gap-4 py-1">
                    <div>
                      <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest block mb-1">{t('verified_trust_status')}</span>
                      <p className="text-[10px] text-gray-500 leading-normal max-w-xs">{t('verified_trust_hint')}</p>
                    </div>

                    {inspectingUser.verificationStatus === 'verified' ? (
                      <button
                        type="button"
                        onClick={() => {
                          const updatedUsers = users.map((u) => 
                            u.uid === inspectingUser.uid ? { ...u, verificationStatus: 'unverified' as const, trustScore: Math.max(u.trustScore - 15, 0) } : u
                          );
                          setUsers(updatedUsers);
                          setInspectingUser(prev => prev ? { ...prev, verificationStatus: 'unverified', trustScore: Math.max(prev.trustScore - 15, 0) } : null);
                          
                          const logEntry: AuditLog = {
                            id: `log_${Date.now()}`,
                            action: t('audit_revoked_badge', { name: inspectingUser.name }),
                            category: 'SECURITY',
                            date: t('time_just_now'),
                            user: 'Linekora Admin'
                          };
                          setAuditLogs(prev => [logEntry, ...prev]);
                          triggerNotification(t('toast_revoked_badge', { name: inspectingUser.name }), "error");
                        }}
                        className="px-3.5 py-2.5 bg-red-950 border border-red-900/30 text-red-400 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-red-900 hover:text-white transition-all cursor-pointer shrink-0"
                      >
                        {t('revoke_badge')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const updatedUsers = users.map((u) => 
                            u.uid === inspectingUser.uid ? { ...u, verificationStatus: 'verified' as const, trustScore: Math.min(u.trustScore + 20, 100) } : u
                          );
                          setUsers(updatedUsers);
                          setInspectingUser(prev => prev ? { ...prev, verificationStatus: 'verified', trustScore: Math.min(prev.trustScore + 20, 100) } : null);

                          const logEntry: AuditLog = {
                            id: `log_${Date.now()}`,
                            action: t('audit_doc_optin', { name: inspectingUser.name }),
                            category: 'SECURITY',
                            date: t('time_just_now'),
                            user: 'Linekora Admin'
                          };
                          setAuditLogs(prev => [logEntry, ...prev]);
                          triggerNotification(t('toast_doc_optin', { name: inspectingUser.name }));
                        }}
                        className="px-3.5 py-2.5 bg-green-950/50 border border-green-900/40 text-green-400 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-green-650 hover:text-white transition-all cursor-pointer shrink-0"
                      >
                        {t('approve_credentials')}
                      </button>
                    )}
                  </div>

                  {/* Trust Adjuster Slider inside Modal */}
                  <div className="pt-2 border-t border-gray-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest block mb-1">{t('direct_trust_score', { score: inspectingUser.trustScore })}</span>
                      <p className="text-[10px] text-gray-500 leading-normal">{t('trust_slider_hint')}</p>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={inspectingUser.trustScore}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        handleSetTrustScore(inspectingUser.uid, val);
                        setInspectingUser(prev => prev ? { ...prev, trustScore: val } : null);
                      }}
                      className="accent-red-650 w-full sm:w-32 bg-gray-950 rounded-lg h-2"
                    />
                  </div>

                  {/* Profile Status Override buttons */}
                  <div className="pt-2.5 border-t border-gray-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest block mb-1">{t('force_system_interventions')}</span>
                      <p className="text-[10px] text-gray-500 leading-normal">{t('force_state_hint')}</p>
                    </div>
                    <div className="flex gap-1.5">
                      {(['active', 'warning', 'suspended'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => {
                            handleToggleUserStatus(inspectingUser.uid, st === 'active' ? 'suspended' : st === 'warning' ? 'active' : 'warning'); // custom cycle helper
                            // Or let's apply a precise status update code
                            setUsers(prev => prev.map(u => u.uid === inspectingUser.uid ? { ...u, status: st } : u));
                            setInspectingUser(prev => prev ? { ...prev, status: st } : null);
                            
                            const logEntry: AuditLog = {
                              id: `log_${Date.now()}`,
                              action: t('audit_force_state', { name: inspectingUser.name, status: st.toUpperCase() }),
                              category: 'SAFETY',
                              date: t('time_just_now'),
                              user: 'Linekora Admin'
                            };
                            setAuditLogs(prev => [logEntry, ...prev]);
                            triggerNotification(t('toast_force_status', { name: inspectingUser.name, status: st.toUpperCase() }), st === 'active' ? 'success' : 'error');
                          }}
                          className={`px-2.5 py-1.5 text-[8px] font-black uppercase tracking-wider rounded border transition-all cursor-pointer ${
                            inspectingUser.status === st 
                              ? 'bg-red-955/20 border-red-900/55 text-red-400' 
                              : 'bg-gray-900 border-gray-850 text-gray-500 hover:text-white'
                          }`}
                        >
                          {st === 'active' ? t('state_override_active') : st === 'warning' ? t('state_override_warn') : t('state_override_ban')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Close Bottom Area */}
              <div className="mt-8 pt-5 border-t border-gray-900 text-right">
                <button
                  type="button"
                  onClick={() => setInspectingUser(null)}
                  className="px-5 py-3 bg-gray-950 border border-gray-900 hover:bg-gray-900 text-gray-400 hover:text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer select-none"
                >
                  {t('close_dossier_file')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
