import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, Lock, Unlock, X, Eye, EyeOff, ShieldCheck, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdminUnlockModal({ isOpen, onClose, onSuccess }: AdminUnlockModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the username input automatically when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      setUsername('');
      setPassword('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Simulated secure latency for operational verification
    setTimeout(() => {
      // SECURE ADMINISTRATIVE CREDENTIALS
      const CORRECT_USERNAME = 'linekora_admin';
      const CORRECT_PASSWORD = 'linekora_SafeOps_2026!';

      if (username === CORRECT_USERNAME && password === CORRECT_PASSWORD) {
        onSuccess();
      } else {
        setError('UNAUTHORIZED CREDENTIALS. Secure access is denied.');
        setLoading(false);
      }
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Deep Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-gray-950/90 backdrop-blur-xl"
        />

        {/* Challenge Box Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-gray-900 border border-red-950/50 rounded-[2rem] p-8 shadow-2xl shadow-red-950/20 overflow-hidden font-sans select-none"
        >
          {/* Subtle Cyber Grid Lines inside */}
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white bg-gray-950/40 rounded-xl transition-all hover:bg-gray-800"
          >
            <X size={16} />
          </button>

          {/* Header */}
          <div className="flex flex-col items-center text-center mt-2 mb-8">
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-white mb-4 shadow-xl transition-all duration-300 ${
              error ? 'bg-red-600 animate-shake' : 'bg-red-950/50 border border-red-900 text-red-500'
            }`}>
              <ShieldAlert size={26} />
            </div>
            <h2 className="text-xl font-black font-sans tracking-tight text-white uppercase">LINEKORA Secure Gate</h2>
            <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-widest mt-1.5 px-3 py-1 bg-gray-950 rounded border border-gray-850">
              Operations Control Area
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-950/20 border border-red-900/40 text-red-400 text-xs font-bold rounded-xl text-center font-mono uppercase tracking-tight"
              >
                {error}
              </motion.div>
            )}

            {/* Username Entry */}
            <div>
              <label className="block text-[9px] font-black uppercase text-gray-500 tracking-wider mb-1.5">
                Admin Username
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-650">
                  <Key size={14} />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  required
                  disabled={loading}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. linekora_admin"
                  className="w-full pl-11 pr-4 py-3 bg-gray-950 border border-gray-850 rounded-xl text-xs font-bold text-white outline-none focus:border-red-600 transition-colors"
                />
              </div>
            </div>

            {/* Password Entry */}
            <div>
              <label className="block text-[9px] font-black uppercase text-gray-500 tracking-wider mb-1.5">
                Admin Passkey
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-650">
                  <Lock size={14} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="•••••••••••••••••"
                  className="w-full pl-11 pr-12 py-3 bg-gray-950 border border-gray-850 rounded-xl text-xs font-bold text-white outline-none focus:border-red-600 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Explanatory Guide hint */}
            <div className="p-3 bg-gray-950 rounded-xl border border-gray-900 text-[10px] text-gray-400 font-medium leading-relaxed">
              <span className="font-extrabold text-red-500 uppercase block mb-0.5">Note:</span>
              Please input terminal administrative operator profile credentials. Keep security credentials confidential.
            </div>

            {/* Action button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 text-white shadow-xl shadow-red-950/20 ${
                loading 
                  ? 'bg-red-900 border border-red-950 cursor-wait' 
                  : 'bg-red-650 hover:bg-red-600 hover:border-red-500/20 active:scale-95 border border-transparent'
              }`}
            >
              {loading ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0"></div>
                  Verifying Operator...
                </>
              ) : (
                <>
                  <Unlock size={13} />
                  Authorize Portal Access
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
