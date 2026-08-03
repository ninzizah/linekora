import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield, ChevronRight, Briefcase, Building, User,
  Mail, Lock, Eye, EyeOff, Phone, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../../lib/firebase';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile } from 'firebase/auth';
import { upsertUser } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { useLanguage, Language } from '../../lib/LanguageContext';

type Role = 'WORKER' | 'COMPANY' | 'EMPLOYER' | null;

export default function Register() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    location: '',
    phone: '',
    skills: '',
    experience: '',
    education: '',
    registrationNumber: '',
    taxId: '',
    responsiblePerson: '',
  });

  const field = (key: keyof typeof formData) => ({
    value: formData[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setFormData((prev) => ({ ...prev, [key]: e.target.value })),
  });

  /** After Firebase auth, sync user to our PostgreSQL database */
  const syncToDatabase = async (
    firebaseUid: string,
    email: string,
    displayName: string,
    selectedRole: Role
  ) => {
    await upsertUser({
      firebaseUid,
      email,
      displayName,
      role: selectedRole as any,
      phone: formData.phone || undefined,
      location: formData.location || undefined,
      trustScore: 0,
      verificationStatus: 'unverified',
    });
  };

  const handleGoogleRegister = async () => {
    if (!role) { setError(t('error_select_account_type')); return; }
    setLoading(true);
    setError(null);
    try {
      // If already authenticated (e.g. redirected from Login), skip re-auth
      const fbUser = user ?? (await signInWithPopup(auth, new GoogleAuthProvider())).user;
      await syncToDatabase(fbUser.uid, fbUser.email!, fbUser.displayName || 'User', role);
      await refreshProfile();
      navigate('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') return;
      setError(err.message || t('error_google_registration_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setLoading(true);
    setError(null);

    try {
      if (user) {
        // Already authenticated (e.g. redirected from Login after DB record was missing)
        await syncToDatabase(user.uid, user.email || formData.email, formData.displayName, role);
        await refreshProfile();
        navigate('/dashboard');
      } else {
        // New registration: create Firebase user
        const credential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const fbUser = credential.user;
        await updateProfile(fbUser, { displayName: formData.displayName });
        await syncToDatabase(fbUser.uid, formData.email, formData.displayName, role);
        await refreshProfile();
        navigate('/dashboard');
      }
    } catch (err: any) {
      const code = err.code;
      if (code === 'auth/email-already-in-use') {
        setError(t('error_email_already_registered'));
      } else if (code === 'auth/weak-password') {
        setError(t('error_weak_password'));
      } else if (code === 'auth/operation-not-allowed') {
        setError(t('error_signin_not_enabled'));
      } else {
        setError(err.message || t('error_registration_failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: 'WORKER', label: t('role_worker'), icon: Briefcase, desc: t('role_worker_desc') },
    { id: 'COMPANY', label: t('role_company'), icon: Building, desc: t('role_company_desc') },
    { id: 'EMPLOYER', label: t('role_employer'), icon: User, desc: t('role_employer_desc') },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-4">
      {/* Background glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      {/* Logo + Language Selector */}
      <div className="relative flex flex-col items-center gap-4 mb-10 mt-10">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-900/50">
            <Shield size={24} strokeWidth={2.5} />
          </div>
          <span className="font-sans text-2xl font-black tracking-tight text-white">LINEKORA</span>
        </Link>
        {/* Language Switcher */}
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="bg-white/10 border border-white/20 text-white text-xs font-bold py-1.5 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer backdrop-blur-sm"
        >
          <option value="en" className="text-gray-900">English (EN)</option>
          <option value="rw" className="text-gray-900">Kinyarwanda (RW)</option>
          <option value="fr" className="text-gray-900">Français (FR)</option>
          <option value="sw" className="text-gray-900">Kiswahili (SW)</option>
        </select>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-2xl bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 md:p-12 mb-10"
      >
        {/* Tab toggle */}
        <div className="flex bg-white/5 p-1 rounded-2xl mb-8 border border-white/10 max-w-sm mx-auto">
          <Link
            to="/login"
            className="flex-1 text-center py-3 rounded-xl font-sans text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors"
          >
            {t('login')}
          </Link>
          <Link
            to="/register"
            className="flex-1 text-center py-3 rounded-xl font-sans text-xs font-black uppercase tracking-widest bg-white text-blue-600 shadow-md"
          >
            {t('sign_up')}
          </Link>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-2 rounded-full transition-all ${step >= s ? 'w-8 bg-blue-500' : 'w-2 bg-white/20'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── STEP 1: Choose role ── */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <h2 className="font-sans text-3xl font-extrabold text-white text-center mb-2">{t('join')}</h2>
              <p className="text-center text-white/50 font-sans text-sm mb-10">{t('select_account_type')}</p>
              <div className="grid grid-cols-1 gap-4">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => { setRole(r.id as Role); setStep(2); }}
                    className="flex items-center gap-5 p-6 rounded-2xl border border-white/10 hover:border-blue-500 hover:bg-blue-500/10 transition-all text-left group"
                  >
                    <div className="h-14 w-14 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                      <r.icon size={26} />
                    </div>
                    <div>
                      <h3 className="font-sans text-base font-bold text-white">{r.label}</h3>
                      <p className="font-sans text-sm text-white/40">{r.desc}</p>
                    </div>
                    <ChevronRight className="ml-auto text-white/20 group-hover:text-blue-400 shrink-0" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Credentials ── */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="font-sans text-2xl font-extrabold text-white text-center mb-2">{t('create_account')}</h2>
              <p className="text-center text-white/50 font-sans text-sm mb-8">
                {t('registering_as', { role: role?.replace('_', ' ') ?? '' })}
              </p>

              {user ? (
                <div className="text-center">
                  <p className="text-white/70 text-sm mb-6">
                    {t('signed_in_as', { email: user.email ?? '' })}
                  </p>
                  <button type="button" onClick={() => setStep(3)}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-sans font-bold transition-all shadow-xl shadow-blue-900/40 flex items-center justify-center gap-2">
                    {t('continue_to_profile_details')} <ChevronRight size={18} />
                  </button>
                </div>
              ) : (
                <>
                  {/* Google option */}
                  <button
                    type="button"
                    onClick={handleGoogleRegister}
                    disabled={loading}
                    className="w-full py-3.5 bg-white hover:bg-gray-50 text-gray-900 rounded-2xl font-sans font-bold text-sm transition-all flex items-center justify-center gap-3 mb-6 shadow-lg disabled:opacity-60"
                  >
                    {loading ? <div className="h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> : (
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    )}
                    {loading ? t('registering') : t('sign_up_google')}
                  </button>

                  <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                    <div className="relative flex justify-center">
                      <span className="bg-transparent px-3 text-white/30 text-xs uppercase font-bold tracking-widest">{t('or_with_email')}</span>
                    </div>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-white/70 mb-2">{t('email_address')}</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                        <input type="email" required placeholder="you@example.com" {...field('email')}
                          className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none font-sans text-white placeholder-white/20 transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-white/70 mb-2">{t('password')}</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                        <input type={showPassword ? 'text' : 'password'} required minLength={6} placeholder={t('min_6_characters')} {...field('password')}
                          className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none font-sans text-white placeholder-white/20 transition-all" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <button type="submit"
                      className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-sans font-bold transition-all shadow-xl shadow-blue-900/40 flex items-center justify-center gap-2">
                      {t('next_profile_details')} <ChevronRight size={18} />
                    </button>
                  </form>
                </>
              )}

              <button type="button" onClick={() => setStep(1)} className="w-full py-3 mt-3 text-white/40 font-sans font-bold text-sm hover:text-white/70 transition-colors">
                {t('go_back')}
              </button>
            </motion.div>
          )}

          {/* ── STEP 3: Profile details ── */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="font-sans text-2xl font-extrabold text-white text-center mb-2">{t('profile_details')}</h2>
              <p className="text-center text-white/50 text-sm mb-8">{t('tell_us_about')}</p>

              <form onSubmit={handleFinalSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-white/70 mb-2">
                      {role === 'COMPANY' ? t('company_name') : t('full_name')}
                    </label>
                    <input type="text" required placeholder={role === 'COMPANY' ? 'Tech Solutions Ltd' : 'Jean Claude'} {...field('displayName')}
                      className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 outline-none font-sans text-white placeholder-white/20 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white/70 mb-2">{t('phone_number')}</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                      <input type="tel" required placeholder="+250..." {...field('phone')}
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 outline-none font-sans text-white placeholder-white/20 transition-all" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-white/70 mb-2">{t('location_district')}</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                    <input type="text" required placeholder="e.g. Gasabo, Kigali" {...field('location')}
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 outline-none font-sans text-white placeholder-white/20 transition-all" />
                  </div>
                </div>

                {role === 'WORKER' && (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-white/70 mb-2">{t('skills_comma_separated')}</label>
                      <input type="text" placeholder="Cleaning, Plumbing, Gardening" {...field('skills')}
                        className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 outline-none font-sans text-white placeholder-white/20 transition-all" />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-bold text-white/70 mb-2">{t('years_experience')}</label>
                        <input type="number" placeholder="e.g. 3" {...field('experience')}
                          className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 outline-none font-sans text-white placeholder-white/20 transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-white/70 mb-2">{t('education')}</label>
                        <input type="text" placeholder="Secondary / Diploma" {...field('education')}
                          className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 outline-none font-sans text-white placeholder-white/20 transition-all" />
                      </div>
                    </div>
                  </>
                )}

                {role === 'COMPANY' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-white/70 mb-2">{t('registration_number')}</label>
                      <input type="text" required placeholder="RDB Cert. Number" {...field('registrationNumber')}
                        className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 outline-none font-sans text-white placeholder-white/20 transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-white/70 mb-2">{t('tax_id')}</label>
                      <input type="text" required placeholder="Your TIN Number" {...field('taxId')}
                        className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 outline-none font-sans text-white placeholder-white/20 transition-all" />
                    </div>
                  </div>
                )}

                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="p-4 bg-red-500/10 text-red-400 rounded-xl text-sm font-sans font-bold border border-red-500/20 text-center">
                    {error}
                  </motion.div>
                )}

                <button disabled={loading} type="submit"
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-sans font-bold transition-all shadow-xl shadow-blue-900/40 flex items-center justify-center gap-2 disabled:opacity-60">
                  {loading ? (
                    <div className="h-5 w-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>{t('complete_registration')} <ChevronRight size={18} /></>
                  )}
                </button>

                <button type="button" onClick={() => setStep(2)} className="w-full py-3 text-white/40 font-sans font-bold text-sm hover:text-white/70 transition-colors">
                  {t('go_back')}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
