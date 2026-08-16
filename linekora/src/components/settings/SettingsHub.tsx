import React, { useState, useEffect, ReactNode } from 'react';
import {
  User, Shield, Bell, BellRing, Palette, Globe, Lock, LifeBuoy, Trash2,
  LogOut, ChevronRight, Check, X, Smartphone, KeyRound, Loader2
} from 'lucide-react';
import { useLanguage, Language } from '../../lib/LanguageContext';
import { useAuth } from '../../lib/AuthContext';
import { signOut, sendPasswordResetEmail, fetchSignInMethodsForEmail, deleteUser } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { deleteUserRecord } from '../../lib/api';
import { applyThemePrefs } from '../../lib/theme';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layout/DashboardLayout';

type SectionId = 'account' | 'security' | 'notifications' | 'appearance' | 'language' | 'privacy' | 'help' | 'delete';

interface SettingsHubProps {
  role: 'WORKER' | 'EMPLOYER' | 'COMPANY';
  accountSection: ReactNode;
}

interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

interface SessionInfo {
  id: string;
  browser: string;
  os: string;
  signedInAt: string;
  current: boolean;
}

const detectBrowser = () => {
  const ua = navigator.userAgent;
  if (ua.includes('Edg/')) return 'Microsoft Edge';
  if (ua.includes('Chrome/')) return 'Chrome';
  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('Safari/')) return 'Safari';
  return 'Unknown';
};

const detectOS = () => {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  return 'Unknown';
};

export default function SettingsHub({ role, accountSection }: SettingsHubProps) {
  const { t, language, setLanguage } = useLanguage();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState<SectionId>('account');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const roleKey = role.toLowerCase();
  const storageKey = (key: string) => `${key}_${roleKey}`;

  // Notification prefs (shared across roles)
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => {
    const cached = localStorage.getItem(`linekora_prefs_${roleKey}`);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return { email: true, sms: false, inApp: true };
  });

  // Appearance prefs
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem(`linekora_dark_${roleKey}`) === 'true');
  const [reduceMotion, setReduceMotion] = useState(() => localStorage.getItem(`linekora_motion_${roleKey}`) === 'true');

  useEffect(() => {
    applyThemePrefs(roleKey);
  }, [roleKey]);

  const [isSaved, setIsSaved] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [authProvider, setAuthProvider] = useState<'google' | 'password' | 'unknown'>('unknown');
  const [session, setSession] = useState<SessionInfo>(() => {
    const cached = localStorage.getItem(`linekora_session_${roleKey}`);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    const rec: SessionInfo = {
      id: Date.now().toString(),
      browser: detectBrowser(),
      os: detectOS(),
      signedInAt: new Date().toLocaleString(),
      current: true,
    };
    localStorage.setItem(`linekora_session_${roleKey}`, JSON.stringify(rec));
    return rec;
  });

  useEffect(() => {
    if (!profile?.email) return;
    fetchSignInMethodsForEmail(auth, profile.email)
      .then((methods) => setAuthProvider(methods.includes('google.com') ? 'google' : 'password'))
      .catch(() => setAuthProvider('password'));
  }, [profile?.email]);

  const addToast = (title: string, message: string, type: Toast['type'] = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const savePrefs = (next: Record<string, boolean>) => {
    setPrefs(next);
    localStorage.setItem(`linekora_prefs_${roleKey}`, JSON.stringify(next));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
    addToast(t('settings_saved'), t('section_saved'), 'success');
  };

  const sendTestNotification = () => {
    if (!prefs.inApp) {
      addToast(t('settings_notifications'), t('enable_inapp_first'), 'error');
      return;
    }
    try {
      const raw = localStorage.getItem('system_alerts');
      const list = raw ? JSON.parse(raw) : [];
      list.unshift({
        id: Date.now(),
        category: 'general',
        title: t('test_notification_title'),
        details: t('test_notification_body'),
        time: t('just_now'),
        read: false,
      });
      localStorage.setItem('system_alerts', JSON.stringify(list.slice(0, 30)));
      addToast(t('settings_notifications'), t('test_notification_sent'), 'success');
    } catch (err) {
      console.error('Failed to send test notification:', err);
      addToast(t('settings_notifications'), t('error_sending'), 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      navigate('/');
    }
  };

  const clearUserData = (uid: string, rk: string) => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (key.startsWith(`linekora_${uid}`) || key === `linekora_profile_picture_${uid}` || key.endsWith(`_${uid}`)) {
          keysToRemove.push(key);
        }
      }
      ['linekora_session_', 'linekora_prefs_', 'linekora_dark_', 'linekora_motion_'].forEach((prefix) => {
        keysToRemove.push(`${prefix}${rk}`);
      });
      if (rk === 'worker') keysToRemove.push('worker_profile_name');
      if (rk === 'company') keysToRemove.push('company_display_name_override');
      if (rk === 'employer') keysToRemove.push('current_username', 'employer_profile_overrides');
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (err) {
      console.error('Failed to clear local data:', err);
    }
  };

  const handleDeleteAccount = async () => {
    if (!profile?.email) return;
    if (deleteEmail.trim().toLowerCase() !== profile.email.toLowerCase()) {
      addToast(t('settings_delete'), t('delete_email_mismatch'), 'error');
      return;
    }
    setDeleteLoading(true);
    const uid = profile?.firebaseUid || profile?.id || 'guest';
    try {
      try {
        await deleteUser(auth.currentUser!);
      } catch (err) {
        console.warn('Firebase user could not be deleted (may require recent sign-in):', err);
      }
      try {
        await deleteUserRecord(uid);
      } catch (err) {
        console.warn('Backend record could not be deleted:', err);
      }
      clearUserData(uid, roleKey);
      try {
        await signOut(auth);
      } catch (err) {
        console.warn('Sign out after deletion:', err);
      }
      navigate('/');
    } catch (err) {
      console.error('Account deletion failed:', err);
      addToast(t('settings_delete'), t('delete_failed'), 'error');
      setDeleteLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!profile?.email) {
      addToast(t('security_desc'), t('error_email_required'), 'error');
      return;
    }
    setSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, profile.email);
      addToast(t('security_change_password'), t('change_password_sent'), 'success');
    } catch (err) {
      addToast(t('security_change_password'), t('error_google_failed'), 'error');
    } finally {
      setSendingReset(false);
    }
  };

  const sections: { id: SectionId; label: string; icon: React.ElementType; desc: string }[] = [
    { id: 'account', label: t('settings_account'), icon: User, desc: t('settings_account_desc') },
    { id: 'security', label: t('settings_security'), icon: Shield, desc: t('settings_security_desc') },
    { id: 'notifications', label: t('settings_notifications'), icon: Bell, desc: t('settings_notifications_desc') },
    { id: 'appearance', label: t('settings_appearance'), icon: Palette, desc: t('settings_appearance_desc') },
    { id: 'language', label: t('settings_language'), icon: Globe, desc: t('settings_language_desc') },
    { id: 'privacy', label: t('settings_privacy'), icon: Lock, desc: t('settings_privacy_desc') },
    { id: 'help', label: t('settings_help'), icon: LifeBuoy, desc: t('settings_help_desc') },
    { id: 'delete', label: t('settings_delete'), icon: Trash2, desc: t('settings_delete_desc') },
  ];

  const Toggle = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className={`h-6 w-12 rounded-full p-1 transition-colors relative shrink-0 cursor-pointer ${on ? 'bg-blue-600' : 'bg-gray-300'}`}
      role="switch"
      aria-checked={on}
    >
      <div className={`h-4 w-4 bg-white rounded-full shadow-sm transition-transform ${on ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  );

  const RowCard = ({ title, desc, children, onClick }: { title: string; desc: string; children?: ReactNode; onClick?: () => void }) => (
    <div
      onClick={onClick}
      className={`p-6 bg-gray-50 rounded-[2rem] border border-transparent hover:border-blue-100 transition-all flex items-center justify-between gap-4 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div>
        <h4 className="font-sans font-black text-gray-900 text-sm">{title}</h4>
        <p className="text-xs text-gray-500 font-medium mt-0.5">{desc}</p>
      </div>
      {children}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto font-sans">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 font-sans tracking-tight uppercase">{t('account_settings')}</h1>
          <p className="text-gray-500 font-sans font-medium mt-1 italic text-sm">{t('account_settings_subtitle')}</p>
        </header>

        {/* Section Nav — horizontal scroll on mobile, vertical stack on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3">
            <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-sans font-bold text-xs whitespace-nowrap transition-all shrink-0 lg:w-full text-left ${
                    activeSection === s.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                      : 'text-gray-500 bg-white border border-gray-100 hover:border-blue-200'
                  }`}
                >
                  <s.icon size={16} />
                  <span className="flex-1">{s.label}</span>
                  <ChevronRight size={14} className={`hidden lg:block ${activeSection === s.id ? 'text-white/60' : 'text-gray-300'}`} />
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl font-sans font-bold text-xs whitespace-nowrap shrink-0 lg:w-full text-left text-red-500 bg-red-50 border border-red-100 hover:bg-red-100 transition-all"
              >
                <LogOut size={16} />
                {t('sign_out')}
              </button>
            </div>
          </div>

          <div className="lg:col-span-9">
            <div className="bg-white rounded-3xl sm:rounded-[3rem] p-5 sm:p-10 border border-gray-100 shadow-sm">
              {activeSection === 'account' && accountSection}

              {activeSection === 'security' && (
                <div className="space-y-4">
                  <div className="mb-6">
                    <h3 className="text-xl font-black text-gray-900 font-sans">{t('settings_security')}</h3>
                    <p className="text-xs text-gray-500 italic font-sans mt-1">{t('settings_security_desc')}</p>
                  </div>
                  <RowCard title={t('security_change_password')} desc={t('security_change_password_desc')}>
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={handlePasswordReset}
                        disabled={sendingReset}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
                      >
                        <KeyRound size={13} />
                        {sendingReset ? t('signing_in') : t('reset')}
                      </button>
                      {authProvider !== 'unknown' && (
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                          {authProvider === 'google' ? t('signed_in_with_google') : t('email_password_account')}
                        </span>
                      )}
                    </div>
                  </RowCard>

                  <div className="p-6 bg-gray-50 rounded-[2rem] border border-transparent hover:border-blue-100 transition-all">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h4 className="font-sans font-black text-gray-900 text-sm">{t('security_sessions')}</h4>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">{t('security_sessions_desc')}</p>
                      </div>
                      <span className="text-[9px] font-black text-green-600 bg-green-50 px-2.5 py-1 rounded-full uppercase tracking-widest shrink-0">{t('this_device')}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-gray-100 p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                          <Smartphone size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-gray-900">{session.browser} · {session.os}</p>
                          <p className="text-[11px] text-gray-400 font-medium mt-0.5">{t('session_signed_in_at', { time: session.signedInAt })}</p>
                        </div>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all cursor-pointer self-start sm:self-auto shrink-0"
                      >
                        {t('sign_out_device')}
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400 italic mt-3">{t('security_session_hint')}</p>
                  </div>

                  <RowCard title={t('security_two_factor')} desc={t('security_two_factor_desc')}>
                    <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-widest">{t('two_factor_soon')}</span>
                  </RowCard>
                </div>
              )}

              {activeSection === 'notifications' && (
                <div className="space-y-4">
                  <div className="mb-6">
                    <h3 className="text-xl font-black text-gray-900 font-sans">{t('settings_notifications')}</h3>
                    <p className="text-xs text-gray-500 italic font-sans mt-1">{t('settings_notifications_desc')}</p>
                  </div>
                  <RowCard title={t('notif_email_alerts')} desc={t('notif_email_alerts_desc')}>
                    <div className="flex flex-col items-end gap-1.5">
                      <Toggle on={prefs.email} onClick={() => savePrefs({ ...prefs, email: !prefs.email })} />
                      <span className={`text-[9px] font-black uppercase tracking-widest ${prefs.email ? 'text-green-600' : 'text-gray-400'}`}>
                        {prefs.email ? t('enabled') : t('disabled')}
                      </span>
                    </div>
                  </RowCard>
                  <RowCard title={t('notif_sms_alerts')} desc={t('notif_sms_alerts_desc')}>
                    <div className="flex flex-col items-end gap-1.5">
                      <Toggle on={prefs.sms} onClick={() => savePrefs({ ...prefs, sms: !prefs.sms })} />
                      <span className={`text-[9px] font-black uppercase tracking-widest ${prefs.sms ? 'text-green-600' : 'text-gray-400'}`}>
                        {prefs.sms ? t('enabled') : t('disabled')}
                      </span>
                    </div>
                  </RowCard>
                  <RowCard title={t('notif_in_app')} desc={t('notif_in_app_desc')}>
                    <div className="flex flex-col items-end gap-1.5">
                      <Toggle on={prefs.inApp} onClick={() => savePrefs({ ...prefs, inApp: !prefs.inApp })} />
                      <span className={`text-[9px] font-black uppercase tracking-widest ${prefs.inApp ? 'text-green-600' : 'text-gray-400'}`}>
                        {prefs.inApp ? t('enabled') : t('disabled')}
                      </span>
                    </div>
                  </RowCard>

                  <div className="p-6 bg-blue-50/60 border border-blue-100 rounded-[2rem] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 bg-white text-blue-600 rounded-xl flex items-center justify-center border border-blue-100 shadow-sm shrink-0">
                        <BellRing size={18} />
                      </div>
                      <div>
                        <h4 className="font-sans font-black text-gray-900 text-sm">{t('notifications_test')}</h4>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">{t('notifications_test_desc')}</p>
                      </div>
                    </div>
                    <button
                      onClick={sendTestNotification}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 transition-all cursor-pointer shrink-0 self-start sm:self-auto flex items-center gap-2"
                    >
                      <BellRing size={13} />
                      {t('send_test')}
                    </button>
                  </div>

                  {isSaved && (
                    <p className="text-xs font-black text-green-600 animate-pulse uppercase pt-2">{t('section_saved')}</p>
                  )}
                </div>
              )}

              {activeSection === 'appearance' && (
                <div className="space-y-4">
                  <div className="mb-6">
                    <h3 className="text-xl font-black text-gray-900 font-sans">{t('settings_appearance')}</h3>
                    <p className="text-xs text-gray-500 italic font-sans mt-1">{t('settings_appearance_desc')}</p>
                  </div>
                  <RowCard title={t('dark_mode')} desc={t('dark_mode_desc')}>
                    <div className="flex flex-col items-end gap-1.5">
                      <Toggle
                        on={darkMode}
                        onClick={() => {
                          const next = !darkMode;
                          setDarkMode(next);
                          localStorage.setItem(`linekora_dark_${roleKey}`, String(next));
                          applyThemePrefs(roleKey);
                          addToast(t('settings_appearance'), t('section_saved'), 'success');
                        }}
                      />
                      <span className={`text-[9px] font-black uppercase tracking-widest ${darkMode ? 'text-green-600' : 'text-gray-400'}`}>
                        {darkMode ? t('enabled') : t('disabled')}
                      </span>
                    </div>
                  </RowCard>
                  <RowCard title={t('reduce_motion')} desc={t('reduce_motion_desc')}>
                    <div className="flex flex-col items-end gap-1.5">
                      <Toggle
                        on={reduceMotion}
                        onClick={() => {
                          const next = !reduceMotion;
                          setReduceMotion(next);
                          localStorage.setItem(`linekora_motion_${roleKey}`, String(next));
                          applyThemePrefs(roleKey);
                          addToast(t('settings_appearance'), t('section_saved'), 'success');
                        }}
                      />
                      <span className={`text-[9px] font-black uppercase tracking-widest ${reduceMotion ? 'text-green-600' : 'text-gray-400'}`}>
                        {reduceMotion ? t('enabled') : t('disabled')}
                      </span>
                    </div>
                  </RowCard>
                </div>
              )}

              {activeSection === 'language' && (
                <div className="space-y-4">
                  <div className="mb-6">
                    <h3 className="text-xl font-black text-gray-900 font-sans">{t('settings_language')}</h3>
                    <p className="text-xs text-gray-500 italic font-sans mt-1">{t('settings_language_desc')}</p>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-[2rem]">
                    <h4 className="font-sans font-black text-gray-900 text-sm mb-4">{t('language_label')}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {([['en', 'English'], ['rw', 'Kinyarwanda'], ['fr', 'Français'], ['sw', 'Kiswahili']] as [Language, string][]).map(([code, label]) => (
                        <button
                          key={code}
                          onClick={() => setLanguage(code)}
                          className={`px-4 py-3 rounded-2xl font-sans font-black text-xs uppercase tracking-wider transition-all border cursor-pointer flex items-center justify-center gap-2 ${
                            language === code
                              ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100'
                              : 'bg-white text-gray-500 border-gray-200 hover:border-blue-200'
                          }`}
                        >
                          {label}
                          {language === code && <Check size={14} />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'privacy' && (
                <div className="space-y-4">
                  <div className="mb-6">
                    <h3 className="text-xl font-black text-gray-900 font-sans">{t('settings_privacy')}</h3>
                    <p className="text-xs text-gray-500 italic font-sans mt-1">{t('settings_privacy_desc')}</p>
                  </div>
                  <RowCard title={t('privacy_manage')} desc={t('privacy_manage_desc')}>
                    <button
                      onClick={() => navigate('/legal?tab=privacy')}
                      className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all cursor-pointer"
                    >
                      {t('view_privacy_policy')}
                    </button>
                  </RowCard>
                  <RowCard title={t('privacy_biometric_consent')} desc={t('privacy_biometric_consent_desc')}>
                    <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-widest">{t('coming_soon')}</span>
                  </RowCard>
                </div>
              )}

              {activeSection === 'help' && (
                <div className="space-y-4">
                  <div className="mb-6">
                    <h3 className="text-xl font-black text-gray-900 font-sans">{t('settings_help')}</h3>
                    <p className="text-xs text-gray-500 italic font-sans mt-1">{t('settings_help_desc')}</p>
                  </div>
                  <RowCard title={t('help_center')} desc={t('help_center_desc')}>
                    <ChevronRight size={18} className="text-gray-300" />
                  </RowCard>
                  <RowCard title={t('contact_support')} desc={t('contact_support_desc')}>
                    <a href="mailto:Ndivelabs@gmail.com" className="text-xs font-black text-blue-600 hover:underline">Ndivelabs@gmail.com</a>
                  </RowCard>
                  <RowCard title={t('whatsapp_support')} desc={t('whatsapp_support_desc')}>
                    <a
                      href="https://wa.me/250788345612"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-green-700 transition-all cursor-pointer"
                    >
                      {t('chat_now')}
                    </a>
                  </RowCard>
                </div>
              )}

              {activeSection === 'delete' && (
                <div className="space-y-4">
                  <div className="mb-6">
                    <h3 className="text-xl font-black text-gray-900 font-sans">{t('settings_delete')}</h3>
                    <p className="text-xs text-gray-500 italic font-sans mt-1">{t('settings_delete_desc')}</p>
                  </div>
                  {showDeleteConfirm ? (
                    <div className="p-6 bg-red-50 rounded-[2rem] border-2 border-red-200 space-y-4">
                      <p className="text-sm font-black text-red-600 uppercase tracking-widest">{t('delete_account_confirm')}</p>
                      <p className="text-xs text-red-500 font-medium font-sans leading-relaxed">{t('delete_account_warning')}</p>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-red-400 uppercase tracking-widest">{t('delete_email_confirm_hint')}</label>
                        <input
                          type="email"
                          value={deleteEmail}
                          onChange={(e) => setDeleteEmail(e.target.value)}
                          placeholder={t('delete_email_placeholder')}
                          disabled={deleteLoading}
                          className="w-full px-5 py-3.5 rounded-2xl bg-white border-2 border-red-200 focus:border-red-500 outline-none font-sans font-bold transition-all text-sm disabled:opacity-60"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setDeleteEmail('');
                          }}
                          disabled={deleteLoading}
                          className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50"
                        >
                          {t('cancel')}
                        </button>
                        <button
                          onClick={handleDeleteAccount}
                          disabled={deleteLoading || deleteEmail.trim().toLowerCase() !== (profile?.email || '').toLowerCase()}
                          className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
                        >
                          {deleteLoading ? (
                            <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> {t('delete_processing')}</span>
                          ) : (
                            <span className="flex items-center gap-2"><X size={14} /> {t('delete_permanently')}</span>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <RowCard title={t('delete_my_account')} desc={t('delete_account_warning')}>
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-5 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all cursor-pointer"
                      >
                        {t('delete_my_account')}
                      </button>
                    </RowCard>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Toast stack */}
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none pr-1">
          {toasts.map(toast => (
            <div key={toast.id} className="pointer-events-auto w-full bg-white rounded-3xl border border-gray-100 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.08)] flex items-start gap-4 relative overflow-hidden">
              <div className={`absolute top-0 bottom-0 left-0 w-2 shrink-0 ${toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-600'}`} />
              <div className="flex-1 pl-1">
                <p className="font-sans font-black uppercase tracking-[0.1em] text-[10px] text-gray-400 mb-0.5">{toast.title}</p>
                <p className="font-sans text-[11px] font-bold text-gray-800 leading-normal">{toast.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
