import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, Lock, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { auth } from '../../lib/firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { getUser, upsertUser } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { useLanguage, Language } from '../../lib/LanguageContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const { language, setLanguage } = useLanguage();

  const handleAfterAuth = async (uid: string, email?: string) => {
    try {
      const profile = await getUser(uid);
      await refreshProfile();
      const roleRoutes: Record<string, string> = {
        WORKER: '/dashboard/worker',
        COMPANY: '/dashboard/company',
        EMPLOYER: '/dashboard/employer',
        ADMIN: '/admin',
      };
      navigate(roleRoutes[profile.role] || '/dashboard');
    } catch {
      // User exists in Firebase but not in PostgreSQL (e.g. DB reset).
      // Auto-create a minimal record so they don't get stuck redirecting
      // back to register after every login.
      try {
        await upsertUser({
          firebaseUid: uid,
          email: email || '',
          displayName: email?.split('@')[0] || 'User',
        } as any);
        await refreshProfile();
        navigate('/dashboard');
        return;
      } catch {}
      navigate('/register');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      await handleAfterAuth(result.user.uid, result.user.email || email.trim());
    } catch (err: any) {
      const code = err.code;
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please try again.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait a moment and try again.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await handleAfterAuth(result.user.uid, result.user.email || undefined);
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Google sign-in is not enabled. Please enable it in the Firebase Console.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError(null); // User just closed the popup, no error needed
      } else {
        setError(err.message || 'Google login failed.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetError("Please enter your email address.");
      return;
    }
    setResetLoading(true);
    setResetMessage(null);
    setResetError(null);
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetMessage("Password reset email sent! Check your inbox.");
      setResetEmail('');
    } catch (err: any) {
      console.error(err);
      setResetError(err.message || "Failed to send password reset email. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-4">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      {/* Logo + Language Selector */}
      <div className="relative flex flex-col items-center gap-4 mb-10">
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
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 md:p-10"
      >
        {/* Tab toggle */}
        <div className="flex bg-white/5 p-1 rounded-2xl mb-8 border border-white/10">
          <Link
            to="/login"
            className="flex-1 text-center py-3 rounded-xl font-sans text-xs font-black uppercase tracking-widest bg-white text-blue-600 shadow-md"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="flex-1 text-center py-3 rounded-xl font-sans text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors"
          >
            Sign Up
          </Link>
        </div>

        <h2 className="font-sans text-3xl font-extrabold text-white text-center mb-1">Welcome back</h2>
        <p className="text-center text-white/50 font-sans text-sm mb-8">Sign in to your Linekora account</p>

        {/* Google Login */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
          className="w-full py-3.5 bg-white hover:bg-gray-50 text-gray-900 rounded-2xl font-sans font-bold text-sm transition-all flex items-center justify-center gap-3 mb-6 shadow-lg disabled:opacity-60"
        >
          {googleLoading ? (
            <div className="h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          {googleLoading ? 'Signing in...' : 'Continue with Google'}
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
          <div className="relative flex justify-center">
            <span className="bg-transparent px-3 text-white/30 text-xs uppercase font-bold tracking-widest">or with email</span>
          </div>
        </div>

        {/* Email/Password form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold font-sans text-white/70 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none font-sans text-white placeholder-white/20 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold font-sans text-white/70 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none font-sans text-white placeholder-white/20 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={() => {
                  setResetMessage(null);
                  setResetError(null);
                  setShowResetModal(true);
                }}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-500/10 text-red-400 rounded-xl text-sm font-sans font-bold border border-red-500/20 text-center"
            >
              {error}
            </motion.div>
          )}

          <button
            id="login-submit"
            disabled={loading || googleLoading}
            type="submit"
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-sans font-bold text-base transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-900/40 disabled:opacity-60 mt-2"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>Log In <ChevronRight size={20} /></>
            )}
          </button>
        </form>
      </motion.div>

      <p className="mt-8 font-sans text-white/40 text-sm">
        Don't have an account?{' '}
        <Link to="/register" className="text-blue-400 font-bold hover:text-blue-300 transition-colors">
          Join LINEKORA
        </Link>
      </p>

      {/* Forgot Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-8 relative shadow-2xl"
          >
            <button
              onClick={() => setShowResetModal(false)}
              className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
            >
              &times;
            </button>
            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Reset Password</h3>
            <p className="text-white/60 text-xs mb-6 leading-relaxed">
              Enter your registered email address and we'll send you link instructions to reset your password.
            </p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 outline-none font-sans text-sm text-white"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </div>

              {resetMessage && (
                <div className="p-3 bg-green-500/10 text-green-400 rounded-xl text-xs font-bold border border-green-500/20 text-center">
                  {resetMessage}
                </div>
              )}

              {resetError && (
                <div className="p-3 bg-red-500/10 text-red-400 rounded-xl text-xs font-bold border border-red-500/20 text-center">
                  {resetError}
                </div>
              )}

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-sans font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-60"
              >
                {resetLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
