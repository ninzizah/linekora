import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Briefcase, Building, User, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { auth } from '../../lib/firebase';
import { upsertUser } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { useLanguage } from '../../lib/LanguageContext';

type Role = 'WORKER' | 'COMPANY' | 'EMPLOYER';

export default function RoleSelection() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const { t } = useLanguage();

  const roles = [
    { id: 'WORKER' as Role, label: t('role_worker'), icon: Briefcase, desc: t('role_worker_desc') },
    { id: 'COMPANY' as Role, label: t('role_company'), icon: Building, desc: t('role_company_desc') },
    { id: 'EMPLOYER' as Role, label: t('role_employer'), icon: User, desc: t('role_employer_desc') },
  ];

  const handleSelectRole = async (selectedRole: Role) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await upsertUser({
        firebaseUid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        role: selectedRole,
      });
      await refreshProfile();
      localStorage.setItem('lastAuthMethod', 'google');
      navigate(selectedRole === 'WORKER' ? '/dashboard/worker' : '/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to set up your account');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center gap-4 mb-10 mt-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-900/50">
          <Shield size={24} strokeWidth={2.5} />
        </div>
        <span className="font-sans text-2xl font-black tracking-tight text-white">LINEKORA</span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 md:p-10"
      >
        <h2 className="font-sans text-3xl font-extrabold text-white text-center mb-2">{t('welcome')}</h2>
        <p className="text-center text-white/50 font-sans text-sm mb-8">{t('select_account_type')}</p>

        {user && (
          <p className="text-center text-white/30 text-xs mb-6 font-sans">
            {user.email}
          </p>
        )}

        <div className="space-y-4">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => handleSelectRole(r.id)}
              disabled={loading}
              className="w-full flex items-center gap-5 p-5 rounded-2xl border border-white/10 hover:border-blue-500 hover:bg-blue-500/10 transition-all text-left group disabled:opacity-50"
            >
              <div className="h-14 w-14 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                <r.icon size={26} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-sans text-base font-bold text-white">{r.label}</h3>
                <p className="font-sans text-sm text-white/40">{r.desc}</p>
              </div>
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
              ) : (
                <ChevronRight className="text-white/20 group-hover:text-blue-400 shrink-0" />
              )}
            </button>
          ))}
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 p-4 bg-red-500/10 text-red-400 rounded-xl text-sm font-sans font-bold border border-red-500/20 text-center"
          >
            {error}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
