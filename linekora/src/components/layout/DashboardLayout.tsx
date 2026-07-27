import React, { ReactNode, useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Search, FileText, MessageSquare, 
  ShieldCheck, Star, Wallet, Settings, LogOut, Menu, X, 
  Briefcase, PlusSquare, Users, ShieldAlert, Shield, User, TrendingUp,
  Bell, Trash, Inbox, ChevronRight, Sparkles, Lock,
  Home
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { getNotifications, markAllNotificationsRead } from '../../lib/api';
import { formatDistanceToNow } from 'date-fns';
import { useLanguage, Language } from '../../lib/LanguageContext';

interface DashboardLayoutProps {
  children: ReactNode;
}

interface WebAlert {
  id: string;
  category: 'urgent' | 'success' | 'alert' | 'general';
  title: string;
  details: string;
  time: string;
  read: boolean;
}

interface ChatPreview {
  id: string;
  sender: string;
  role: string;
  body: string;
  time: string;
  unread: boolean;
}

// Map DB role (uppercase) → layout key (lowercase)
function getRoleKey(role?: string | null): 'worker' | 'company' | 'individual' | 'admin' {
  if (!role) return 'individual';
  const map: Record<string, 'worker' | 'company' | 'individual' | 'admin'> = {
    WORKER: 'worker', worker: 'worker',
    COMPANY: 'company', company: 'company',
    EMPLOYER: 'individual', individual: 'individual', employer: 'individual',
    ADMIN: 'admin', admin: 'admin',
  };
  return map[role] ?? 'individual';
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { profile: user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const roleKey = getRoleKey(user?.role);
  const { language, setLanguage, t } = useLanguage();

  // Unified Notification & Message Panel state
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'alerts' | 'messages'>('alerts');
  const panelRef = useRef<HTMLDivElement>(null);

  // Customized Alerts DB based on role
  const [alerts, setAlerts] = useState<WebAlert[]>([]);
  const [chats, setChats] = useState<ChatPreview[]>([]);

  useEffect(() => {
    if (!user?.id) return;

    const readLocalSystemAlerts = (): WebAlert[] => {
      try {
        const raw = localStorage.getItem('system_alerts');
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return parsed.map((a: any) => ({
          id: `local_${a.id}`,
          category: (a.category === 'urgent' ? 'urgent' : a.category === 'success' ? 'success' : 'general') as WebAlert['category'],
          title: a.title,
          details: a.details,
          time: a.time || 'Just now',
          read: a.read || false,
        }));
      } catch {
        return [];
      }
    };

    const loadNotifications = async () => {
      // Always pull local system_alerts (written by contracts, applicants, etc.)
      const localAlerts = readLocalSystemAlerts();

      try {
        const dbNotifs = await getNotifications(user.id);
        if (dbNotifs.length > 0) {
          const dbAlerts = dbNotifs.map(n => ({
            id: String(n.id),
            category: (n.type === 'urgent' ? 'urgent' : n.type === 'success' ? 'success' : n.type === 'warning' ? 'alert' : 'general') as WebAlert['category'],
            title: n.title,
            details: n.body,
            time: formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }),
            read: n.read,
          }));
          // Merge: local alerts first (most recent events), then DB
          const merged = [...localAlerts, ...dbAlerts].reduce((acc: WebAlert[], cur) => {
            if (!acc.find(x => x.title === cur.title && x.details === cur.details)) acc.push(cur);
            return acc;
          }, []);
          setAlerts(merged);
        } else {
          // No DB notifications yet - show only real local events
          setAlerts(localAlerts);
        }
      } catch (err) {
        console.error('Failed to load notifications', err);
        // Even on failure, show local alerts
        if (localAlerts.length > 0) setAlerts(localAlerts);
      }
    };

    loadNotifications();
    // Poll for new notifications every 8 seconds (faster for better UX)
    const pollInterval = setInterval(loadNotifications, 8000);
    return () => clearInterval(pollInterval);
  }, [user?.id, roleKey]);

  // Load real chats from localStorage (set by the messaging pages)
  useEffect(() => {
    if (!user?.id) return;
    try {
      const raw = localStorage.getItem(`linekora_chats_${user.id}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        setChats(parsed);
      } else {
        setChats([]);
      }
    } catch {
      setChats([]);
    }
  }, [user?.id]);


  // Handle click outside to close the notifications panel
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsPanelOpen(false);
      }
    }
    if (isPanelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPanelOpen]);

  const handleLogout = async () => {
    try {
      console.log('Attempting to sign out...');
      localStorage.removeItem('demo_user');
      await signOut(auth);
      console.log('Successfully signed out');
      navigate('/');
    } catch (err) {
      console.error('Error signing out:', err);
      localStorage.removeItem('demo_user');
      navigate('/');
    }
  };

  const menuItems = {
    worker: [
      { name: t('public_home'), icon: Home, path: '/' },
      { name: t('dashboard'), icon: LayoutDashboard, path: '/dashboard/worker' },
      { name: t('profile'), icon: User, path: '/dashboard/worker/profile' },
      { name: t('browse_jobs'), icon: Search, path: '/dashboard/worker/browse' },
      { name: t('applications'), icon: FileText, path: '/dashboard/worker/applications' },
      { name: t('messages'), icon: MessageSquare, path: '/dashboard/worker/messages' },
      { name: t('verification'), icon: ShieldCheck, path: '/dashboard/worker/verify' },
      { name: t('reviews'), icon: Star, path: '/dashboard/worker/reviews' },
      { name: t('wallet'), icon: Wallet, path: '/dashboard/worker/wallet' },
      { name: t('settings'), icon: Settings, path: '/dashboard/worker/settings' },
    ],
    company: [
      { name: t('public_home'), icon: Home, path: '/' },
      { name: t('dashboard'), icon: LayoutDashboard, path: '/dashboard/company' },
      { name: t('post_job'), icon: PlusSquare, path: '/dashboard/company/post' },
      { name: t('manage_jobs'), icon: Briefcase, path: '/dashboard/company/jobs' },
      { name: t('applicants'), icon: Users, path: '/dashboard/company/applicants' },
      { name: t('messages'), icon: MessageSquare, path: '/dashboard/company/messages' },
      { name: t('verification'), icon: ShieldCheck, path: '/dashboard/company/verify' },
      { name: t('payments'), icon: Wallet, path: '/dashboard/company/payments' },
      { name: t('analytics'), icon: TrendingUp, path: '/dashboard/company/analytics' },
      { name: t('settings'), icon: Settings, path: '/dashboard/company/settings' },
    ],
    individual: [
      { name: t('public_home'), icon: Home, path: '/' },
      { name: t('dashboard'), icon: LayoutDashboard, path: '/dashboard/employer' },
      { name: t('post_task'), icon: PlusSquare, path: '/dashboard/employer/post' },
      { name: t('browse_workers'), icon: Search, path: '/dashboard/employer/browse' },
      { name: t('messages'), icon: MessageSquare, path: '/dashboard/employer/messages' },
      { name: t('verification'), icon: ShieldCheck, path: '/dashboard/employer/verify' },
      { name: t('wallet'), icon: Wallet, path: '/dashboard/employer/wallet' },
      { name: t('settings'), icon: Settings, path: '/dashboard/employer/settings' },
    ],
    admin: [
      { name: t('public_home'), icon: Home, path: '/' },
      { name: t('dashboard'), icon: LayoutDashboard, path: '/admin' },
    ]
  };

  const currentMenuItems = menuItems[roleKey] || [];

  // Notifications calculation helper
  const unreadAlertsCount = alerts.filter(a => !a.read).length;
  const unreadChatsCount = chats.filter(c => c.unread).length;
  const totalAlertBadge = unreadAlertsCount + unreadChatsCount;

  const handleMarkAlertAsRead = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  };

  const handleMarkAllRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
    setChats(prev => prev.map(c => ({ ...c, unread: false })));
  };

  const handleDeleteAlert = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const handleChatClick = (id: string) => {
    setChats(prev => prev.map(c => c.id === id ? { ...c, unread: false } : c));
    setIsPanelOpen(false);
    const routes: Record<string, string> = {
      worker: '/dashboard/worker/messages',
      company: '/dashboard/company/messages',
      individual: '/dashboard/employer/messages',
      admin: '/admin',
    };
    navigate(routes[roleKey] || '/dashboard/employer/messages');
  };

  const getSettingsPath = () => {
    const paths: Record<string, string> = {
      worker: '/dashboard/worker/settings',
      company: '/dashboard/company/settings',
      individual: '/dashboard/employer/settings',
      admin: '/admin',
    };
    return paths[roleKey] || '/';
  };

  const getAvatarUrl = () => {
    const saved = localStorage.getItem(`linekora_profile_picture_${user?.uid || 'guest'}`);
    return saved || null;
  };

  if (loading) return null;

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Shield size={24} strokeWidth={2.5} />
            </div>
            <span className="font-sans text-xl font-bold tracking-tight text-gray-900">LINEKORA</span>
            <button className="lg:hidden ml-auto text-gray-400" onClick={() => setIsSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 space-y-1">
            {currentMenuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl font-sans font-bold text-sm transition-all
                  ${location.pathname === item.path 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
                `}
              >
                <item.icon size={20} />
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-gray-100">
            {/* Clickable avatar → goes to Settings */}
            <Link
              to={getSettingsPath()}
              onClick={() => setIsSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl hover:bg-gray-50 transition-all group"
            >
              <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-blue-100 shadow-sm shrink-0 group-hover:border-blue-400 transition-colors bg-blue-50 flex items-center justify-center">
                {getAvatarUrl() ? (
                  <img 
                    src={getAvatarUrl()!}
                    alt={user?.displayName || 'Avatar'} 
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-sm font-black text-blue-600 uppercase">{(user?.displayName || 'U')[0]}</span>
                )}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-bold text-gray-900 truncate font-sans">
                {roleKey === 'worker' ? (localStorage.getItem('worker_profile_name') || user?.displayName || 'User') :
                 roleKey === 'company' ? (localStorage.getItem('company_display_name_override') || user?.displayName || 'User') :
                 roleKey === 'individual' ? (localStorage.getItem('current_username') || user?.displayName || 'User') :
                 (user?.displayName || 'User')}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-1.5 py-0.5 rounded ${
                    roleKey === 'company' ? 'bg-blue-600 text-white' : 
                    roleKey === 'worker' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {user?.role || 'Member'}
                  </span>
                  <span className="text-[8px] text-gray-400 font-bold group-hover:text-blue-500 transition-colors">→ Settings</span>
                </div>
              </div>
            </Link>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-sans font-bold text-sm text-red-500 hover:bg-red-50 transition-all"
            >
              <LogOut size={20} />
              Log Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-10 relative z-[100]">
          <button className="lg:hidden text-gray-500 p-1" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-3 ml-auto">
            {user?.role?.toUpperCase() === 'ADMIN' && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/10 text-red-600 hover:bg-red-600 hover:text-white rounded-lg text-xs font-black border border-red-900/30 transition-all uppercase tracking-wider shadow-sm"
              >
                <Lock size={13} />
                Admin Portal 🛡️
              </Link>
            )}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg text-xs font-bold border border-yellow-100">
              <ShieldAlert size={14} />
              Trust Score: {user?.trustScore || 0}%
            </div>
            <div className="hidden md:block h-8 w-px bg-gray-100" />
            
            {/* Language Switcher */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-gray-50 border border-gray-255 text-gray-700 text-xs font-bold py-1.5 px-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans cursor-pointer"
            >
              <option value="en">English (EN)</option>
              <option value="rw">Kinyarwanda (RW)</option>
              <option value="fr">Français (FR)</option>
              <option value="sw">Kiswahili (SW)</option>
            </select>

            <div className="h-8 w-px bg-gray-100 hidden md:block" />

            {/* INBOX/NOTIFICATION INTEGRATIVE POPUP TOGGLER */}
            <div className="relative" ref={panelRef}>
              <button 
                id="header-notification-bell-btn"
                onClick={() => {
                  const opening = !isPanelOpen;
                  setIsPanelOpen(opening);
                  // Mark all DB notifications as read when panel opens
                  if (opening && user?.id && alerts.some(a => !a.read)) {
                    markAllNotificationsRead(user.id).catch(() => {});
                    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
                  }
                }}
                className={`relative p-2.5 rounded-xl transition-all ${isPanelOpen ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
              >
                <MessageSquare size={20} />
                {totalAlertBadge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-blue-600 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                    {totalAlertBadge}
                  </span>
                )}
              </button>

              {/* Mobile backdrop when panel open */}
              {isPanelOpen && (
                <div
                  className="fixed inset-0 z-[190] bg-black/30 md:hidden"
                  onClick={() => setIsPanelOpen(false)}
                />
              )}

              <AnimatePresence>
                {isPanelOpen && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="fixed md:absolute right-0 left-0 md:left-auto bottom-0 md:bottom-auto top-auto md:top-full md:mt-3 w-full md:w-96 bg-white md:rounded-3xl rounded-t-3xl border border-gray-150 shadow-2xl z-[200] overflow-hidden"
                  >
                    <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                      <div>
                        <h4 className="font-sans font-black text-xs text-gray-950 uppercase tracking-widest flex items-center gap-1.5">
                          Alerts & Inbox
                          <span className="bg-blue-100 text-blue-700 text-[8px] font-black px-2 py-0.5 rounded-full">
                            {totalAlertBadge} New
                          </span>
                        </h4>
                        <p className="text-[10px] text-gray-400 font-sans font-medium italic mt-0.5">Real-time matching system updates</p>
                      </div>
                      {totalAlertBadge > 0 && (
                        <button 
                          onClick={handleMarkAllRead}
                          className="text-[9px] font-black text-blue-600 uppercase tracking-wider hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    {/* Tab Selectors */}
                    <div className="flex border-b border-gray-100 bg-white">
                      <button 
                        onClick={() => setActiveTab('alerts')}
                        className={`flex-1 py-3 text-center text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'alerts' ? 'text-blue-650 border-blue-600 bg-blue-50/15' : 'text-gray-405 border-transparent hover:text-gray-900 bg-white'}`}
                      >
                        System Alerts ({unreadAlertsCount})
                      </button>
                      <button 
                        onClick={() => setActiveTab('messages')}
                        className={`flex-1 py-3 text-center text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'messages' ? 'text-blue-650 border-blue-600 bg-blue-50/15' : 'text-gray-405 border-transparent hover:text-gray-900 bg-white'}`}
                      >
                        Unread Chats ({unreadChatsCount})
                      </button>
                    </div>

                    {/* Panel Body */}
                    <div className="max-h-[360px] overflow-y-auto bg-white divide-y divide-gray-50">
                      {activeTab === 'alerts' ? (
                        alerts.length > 0 ? (
                          alerts.map((alert) => (
                            <div 
                              key={alert.id}
                              onClick={() => handleMarkAlertAsRead(alert.id)}
                              className={`p-4 hover:bg-gray-50/80 transition-colors cursor-pointer flex items-start gap-3 relative group ${!alert.read ? 'bg-blue-50/10' : ''}`}
                            >
                              {!alert.read && (
                                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-blue-600" />
                              )}
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                                alert.category === 'urgent' ? 'bg-red-50 text-red-655' : 
                                alert.category === 'success' ? 'bg-green-50 text-green-600' :
                                alert.category === 'alert' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-500'
                              }`}>
                                {alert.category === 'urgent' ? <Sparkles size={14} /> : <Bell size={14} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="font-sans font-black text-xs text-gray-900 leading-tight flex items-center gap-1">
                                  {alert.title}
                                </h5>
                                <p className="text-[11px] text-gray-500 mt-0.5 leading-normal font-sans font-medium">{alert.details}</p>
                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mt-1">{alert.time}</span>
                              </div>
                              <button 
                                onClick={(e) => handleDeleteAlert(alert.id, e)}
                                className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-md bg-white shrink-0 shadow-sm border border-gray-100"
                              >
                                <Trash size={12} />
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="py-12 px-6 text-center">
                            <Inbox className="mx-auto text-gray-300 mb-2" size={32} />
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">All clear</p>
                            <p className="text-[10px] text-gray-400 font-sans italic mt-1">No system warnings outstanding.</p>
                          </div>
                        )
                      ) : (
                        chats.length > 0 ? (
                          chats.map((chat) => (
                            <div 
                              key={chat.id}
                              onClick={() => handleChatClick(chat.id)}
                              className={`p-4 hover:bg-gray-50/80 transition-colors cursor-pointer flex items-start gap-3 relative ${chat.unread ? 'bg-blue-50/15' : ''}`}
                            >
                              {chat.unread && (
                                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                              )}
                              <div className="h-9 w-9 rounded-full bg-blue-105 text-blue-700 flex items-center justify-center font-sans font-black text-xs shrink-0 border border-blue-200">
                                {chat.sender[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h5 className="font-sans font-black text-xs text-gray-950 leading-none">{chat.sender}</h5>
                                  <span className="text-[8px] text-gray-405 font-black uppercase tracking-widest shrink-0">{chat.time}</span>
                                </div>
                                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-0.5 leading-none">{chat.role}</p>
                                <p className="text-[11px] text-gray-500 mt-1 truncate font-sans font-medium">{chat.body}</p>
                              </div>
                              <ChevronRight size={14} className="text-gray-300 self-center" />
                            </div>
                          ))
                        ) : (
                          <div className="py-12 px-6 text-center">
                            <MessageSquare className="mx-auto text-gray-300 mb-2" size={32} />
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">Your inbox is empty</p>
                            <p className="text-[10px] text-gray-400 font-sans italic mt-1">No live conversations.</p>
                          </div>
                        )
                      )}
                    </div>

                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center">
                      <button 
                        onClick={() => {
                          setIsPanelOpen(false);
                          const routes: Record<string, string> = {
                            worker: '/dashboard/worker/messages',
                            company: '/dashboard/company/messages',
                            individual: '/dashboard/employer/messages',
                            admin: '/admin',
                          };
                          navigate(routes[roleKey] || '/dashboard/employer/messages');
                        }}
                        className="text-[10px] font-black text-blue-600 hover:text-blue-750 uppercase tracking-widest flex items-center gap-1 transition-all font-sans"
                      >
                        Open Active Chat Center
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Clickable Header Avatar for direct Settings access on mobile & desktop */}
            <Link 
              to={getSettingsPath()}
              className="h-9 w-9 rounded-full overflow-hidden border border-gray-200 hover:border-blue-500 transition-colors shrink-0 flex items-center justify-center bg-white"
              title="Go to Settings"
            >
              {getAvatarUrl() ? (
                <img 
                  src={getAvatarUrl()!} 
                  alt="Avatar" 
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-sm font-black text-blue-600 uppercase">{(user?.displayName || 'U')[0]}</span>
              )}
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}

