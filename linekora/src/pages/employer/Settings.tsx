import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Shield, LogOut, Save, CheckCircle, 
  X, AlertTriangle, FileCheck, Camera, Phone
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../lib/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

export default function EmployerSettings() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Inputs State
  const [displayName, setDisplayName] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('+250 788 345 612');
  const [bio, setBio] = useState('Home owner based in Kiyovi looking for gardening, cleaning and plumbing tasks assistance.');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadError, setUploadError] = useState('');
  
  // Verification states
  const [isVerified, setIsVerified] = useState(false);
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);
  const [nationalId, setNationalId] = useState('');
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  // Saving state
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Initialize from context state
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setLocation(profile.location || '');
      setIsVerified(profile.verificationStatus === 'verified');
    }

    const savedOverrides = localStorage.getItem('employer_profile_overrides');
    if (savedOverrides) {
      try {
        const parsed = JSON.parse(savedOverrides);
        if (parsed.displayName) setDisplayName(parsed.displayName);
        if (parsed.location) setLocation(parsed.location);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.bio) setBio(parsed.bio);
      } catch (e) {
        console.error('Error parsing profile settings overrides', e);
      }
    }

    // Load avatar
    const empUid = profile?.firebaseUid || profile?.id || 'guest';
    const avatarKey = `linekora_profile_picture_${empUid}`;
    const saved = localStorage.getItem(avatarKey);
    if (saved) setAvatarUrl(saved);
  }, [profile]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Photo must be smaller than 2MB.');
      return;
    }
    setUploadError('');
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const addToast = (title: string, message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const handleSaveChanges = () => {
    if (!displayName.trim()) {
      addToast('Validation Failure ❌', 'Display Name cannot be blank.', 'error');
      return;
    }

    setSaving(true);
    const payload = {
      displayName, location, phone, bio, isVerified
    };
    localStorage.setItem('employer_profile_overrides', JSON.stringify(payload));
    localStorage.setItem('current_username', displayName);
    localStorage.setItem('current_user_location', location);

    // Save avatar
    const empUid = profile?.firebaseUid || profile?.id || 'guest';
    const avatarKey = `linekora_profile_picture_${empUid}`;
    if (avatarUrl) {
      localStorage.setItem(avatarKey, avatarUrl);
    } else {
      localStorage.removeItem(avatarKey);
    }

    setTimeout(() => {
      setSaving(false);
      addToast('Settings Saved 💾', 'Your profile updates have been saved.', 'success');
    }, 800);
  };

  // Mock Verification process
  const triggerVerifyVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nationalId.trim() || nationalId.length < 16) {
      addToast('Format Mismatch 🔍', 'Kigali National Registration ID must comprise exactly 16 characters.', 'error');
      return;
    }

    setIsSubmittingVerification(true);
    setTimeout(() => {
      setIsSubmittingVerification(false);
      setIsVerified(true);
      setShowVerifyModal(false);
      
      // Update overrides with verified state
      const payload = {
        displayName,
        location,
        phone,
        bio,
        isVerified: true
      };
      localStorage.setItem('employer_profile_overrides', JSON.stringify(payload));
      
      addToast('Shield Verification Active 🛡️', 'Validation complete. Security Shield attached to your profile feeds successfully!', 'success');
    }, 1500);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 relative">
        <header className="mb-10 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 font-sans tracking-tight uppercase">Employer Settings</h1>
            <p className="text-gray-500 font-sans font-medium mt-1 italic">Configure account specifications, security credentials, and alerts.</p>
          </div>
          
          {/* Top Info Banner featuring active verification score */}
          <div className="bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3 shrink-0">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center border shrink-0 ${
              isVerified ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-yellow-50 text-yellow-600 border-yellow-200'
            }`}>
              <Shield size={20} className={isVerified ? '' : 'animate-pulse'} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Security Level</p>
              <p className="text-xs font-black text-gray-900 font-sans mt-0.5 uppercase tracking-wide">
                {isVerified ? '🛡️ Level 3 Verified' : '⚠️ Unverified Profile'}
              </p>
            </div>
          </div>
        </header>

        <div className="bg-white rounded-3xl sm:rounded-[3rem] p-5 sm:p-10 border border-gray-100 shadow-xl space-y-10">
          
          {/* AVATAR / LOGO UPLOAD */}
          <section className="space-y-4">
            <h3 className="text-lg font-black text-gray-900 font-sans tracking-tight flex items-center gap-2.5 uppercase border-b border-gray-50 pb-3">
              <Camera size={20} className="text-blue-600" />
              Profile Photo / Logo
            </h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative">
                <div className="h-24 w-24 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl bg-blue-50 shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                      <User size={36} className="text-blue-400" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 h-9 w-9 bg-blue-600 text-white rounded-xl shadow-lg flex items-center justify-center hover:bg-blue-700 transition-all border-2 border-white"
                >
                  <Camera size={16} />
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all border-2 border-white"
                  >
                    <X size={10} />
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </div>
              <div>
                <p className="text-sm font-black text-gray-900">{displayName}</p>
                <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mt-0.5">Individual Employer</p>
                <p className="text-xs text-gray-400 mt-2">Tap the <span className="text-blue-600 font-bold">camera icon</span> to upload your photo or company logo.<br/>Max: 2MB. JPG, PNG, or WEBP.</p>
                {uploadError && <p className="text-xs text-red-500 font-bold mt-1">{uploadError}</p>}
              </div>
            </div>
          </section>

          {/* BIO SECTION & CORE INFO */}
          <section className="space-y-6">
            <h3 className="text-lg font-black text-gray-905 font-sans tracking-tight flex items-center gap-2.5 uppercase border-b border-gray-50 pb-3">
              <User size={20} className="text-blue-600" />
              Information Profile
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Display Name / Identity</label>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Kigali Workspace Location</label>
                <input 
                  type="text" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Mobile Telephone Contact</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold" size={14} />
                  <input 
                    type="text" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+250..."
                    className="w-full pl-11 pr-5 py-4 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Account Role status</label>
                <div className="px-5 py-4 rounded-xl bg-blue-50/50 border border-blue-100 text-blue-700 font-sans text-xs font-black uppercase tracking-wider leading-none">
                  💼 Individual Tasks Employer
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Brief Description / Bio details</label>
              <textarea 
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write description about yourself, site specifications, or standard gigs schedules..."
                className="w-full px-5 py-3.5 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all text-sm resize-none"
              />
            </div>
          </section>

          {/* VERIFICATION SECTION */}
          <section className="pt-8 border-t border-gray-50 space-y-6">
            <h3 className="text-lg font-black text-gray-905 font-sans tracking-tight flex items-center gap-2.5 uppercase border-b border-gray-50 pb-3">
              <Shield size={20} className="text-blue-600" />
              Identity verification
            </h3>

            {isVerified ? (
              <div className="p-5 bg-green-50/50 border border-green-200 rounded-3xl flex items-start gap-4">
                <div className="h-10 w-10 bg-green-105 text-green-600 rounded-xl flex items-center justify-center border border-green-200 shadow-sm shrink-0">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-xs font-black text-green-905 uppercase tracking-wider font-sans">Verification Shield Badge Active</p>
                    <span className="bg-green-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded leading-none uppercase">Verified Employer</span>
                  </div>
                  <p className="text-xs text-green-700 font-bold font-sans mt-0.5 italic leading-normal">
                    "Your identity file has been audited against standard Kigali administrative registries. Workers prioritize verified employers."
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-yellow-50/50 border border-yellow-250 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 bg-white text-yellow-600 rounded-xl flex items-center justify-center border border-yellow-100 shadow-sm shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-yellow-905 uppercase tracking-wider font-sans">Shield Verification Pending</p>
                    <p className="text-[11px] text-yellow-700 font-bold mt-0.5 leading-normal">
                      Submit 16-digit Rwandan Registration Identification Document to display a Verified badge and trigger 3.5x higher application volumes.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(true)}
                  className="px-5 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-yellow-100 self-start md:self-auto shrink-0"
                >
                  Verify Now
                </button>
              </div>
            )}
          </section>

          {/* ACTIONS AND OUT */}
          <div className="pt-8 border-t border-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <button 
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-red-500 font-sans font-black text-[10px] uppercase tracking-widest hover:bg-red-50 px-4 py-2.5 rounded-xl transition-all self-stretch sm:self-auto text-center justify-center cursor-pointer"
            >
              <LogOut size={14} />
              Sign Out Account
            </button>
            <button 
              type="button"
              disabled={saving}
              onClick={handleSaveChanges}
              className="px-6 py-4.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-sans font-black text-[10px] tracking-widest shadow-xl shadow-blue-105 transition-all flex items-center justify-center gap-2 self-stretch sm:self-auto uppercase cursor-pointer"
            >
              {saving ? (
                <span>Preserving changes...</span>
              ) : (
                <>
                  <Save size={14} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* SECURE NATIONAL ID VERIFICATION OVERLAY SCREEN */}
      <AnimatePresence>
        {showVerifyModal && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-950/65 backdrop-blur-sm"
              onClick={() => setShowVerifyModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md p-8 md:p-10 shadow-2xl relative border border-gray-100 z-10"
            >
              <button 
                onClick={() => setShowVerifyModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-55 text-gray-400 bg-gray-50 flex items-center justify-center border border-gray-150"
              >
                <X size={18} />
              </button>

              <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <FileCheck size={24} />
              </div>

              <h3 className="text-xl font-black text-gray-950 font-sans uppercase">Identity Audit Console</h3>
              <p className="text-xs text-gray-400 font-sans italic mt-1 mb-6">
                Rwandan National ID document checking coordinates instantly with district administrative records for premium security.
              </p>

              <form onSubmit={triggerVerifyVerify} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">16-Digit National ID Number</label>
                  <input 
                    type="text"
                    maxLength={16}
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="e.g. 1199580045123456"
                    className="w-full px-5 py-4 rounded-xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold text-sm text-gray-950 transition-all font-mono"
                  />
                  <span className="text-[9px] text-gray-400 block mt-1.5 leading-snug px-1 italic">
                    Note: For simulation, input any 16 characters or numbers. Your mock certificate matches instantly.
                  </span>
                </div>

                <div className="pt-2 grid grid-cols-2 gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowVerifyModal(false)}
                    className="py-3.5 bg-gray-50 hover:bg-gray-100 border border-gray-150 text-gray-650 rounded-xl font-sans font-black uppercase text-[10px] tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmittingVerification}
                    className="py-3.5 bg-blue-650 hover:bg-blue-700 text-white rounded-xl font-sans font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmittingVerification ? (
                      <span>Auditing Document...</span>
                    ) : (
                      <>
                        <Shield size={12} />
                        <span>Submit Document</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOATING SYSTEM TOASTS PANEL */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="pointer-events-auto bg-white rounded-3xl border border-gray-150 p-5 shadow-2xl flex items-start gap-4 relative overflow-hidden"
            >
              <div className={`absolute top-0 bottom-0 left-0 w-1.5 shrink-0 ${
                t.type === 'error' ? 'bg-red-500' : t.type === 'info' ? 'bg-indigo-550' : 'bg-green-500'
              }`} />
              
              <div className="flex-1 pl-1">
                <p className="font-sans font-black uppercase tracking-[0.1em] text-[10px] text-gray-400 mb-0.5">{t.title}</p>
                <p className="font-sans text-[11px] font-bold text-gray-800 leading-normal">{t.message}</p>
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
