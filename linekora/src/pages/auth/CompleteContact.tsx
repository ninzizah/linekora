import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Phone, ChevronRight, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { updateUser } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { useLanguage } from '../../lib/LanguageContext';

const HOME_FOR_ROLE: Record<string, string> = {
  WORKER: '/dashboard/worker',
  COMPANY: '/dashboard/company',
  EMPLOYER: '/dashboard/employer',
  ADMIN: '/admin',
};

/**
 * Catch-all for accounts created before a phone number became mandatory.
 * Blocks the rest of the app until a contact number is on file.
 */
export default function CompleteContact() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError(t('error_phone_required'));
      return;
    }
    const id = profile?.id || profile?.firebaseUid;
    if (!id) {
      setError(t('error_phone_save_failed'));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await updateUser(id, { phone: phone.trim() });
      await refreshProfile();
      navigate(HOME_FOR_ROLE[profile?.role || 'WORKER'] || '/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || t('error_phone_save_failed'));
    } finally {
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
        <h2 className="font-sans text-3xl font-extrabold text-white text-center mb-2">
          {t('complete_your_contact')}
        </h2>
        <p className="text-center text-white/50 font-sans text-sm mb-8">
          {t('complete_your_contact_desc')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-white/70 mb-2">{t('phone_number')}</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input
                type="tel"
                required
                autoFocus
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+250 788 123 456"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none font-sans text-white placeholder-white/20 transition-all"
              />
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-red-500/10 text-red-400 rounded-xl text-sm font-sans font-bold border border-red-500/20 text-center"
            >
              {error}
            </motion.div>
          )}

          <button
            disabled={loading}
            type="submit"
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-sans font-bold transition-all shadow-xl shadow-blue-900/40 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>{t('save_changes')} <ChevronRight size={18} /></>
            )}
          </button>
        </form>

        <button
          type="button"
          onClick={() => signOut(auth)}
          className="w-full py-3 mt-3 text-white/40 hover:text-white/70 font-sans font-bold text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <LogOut size={16} /> {t('logout')}
        </button>
      </motion.div>
    </div>
  );
}
