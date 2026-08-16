import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Save, CheckCircle, 
  X, AlertTriangle, Camera, Phone
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { useLanguage } from '../../lib/LanguageContext';
import { updateUser } from '../../lib/api';
import SettingsHub from '../../components/settings/SettingsHub';

export default function EmployerSettings() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Inputs State
  const [displayName, setDisplayName] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadError, setUploadError] = useState('');

  // Verification state
  const [isVerified, setIsVerified] = useState(false);

  // Saving state
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Initialize from context state
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setLocation(profile.location || '');
      setPhone(profile.phone || '');
      setBio('');
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
      setUploadError(t('photo_too_large_error'));
      return;
    }
    setUploadError('');
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveChanges = async () => {
    if (!displayName.trim()) {
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

    // Persist to DB
    const dbId = profile?.id || profile?.firebaseUid;
    if (dbId) {
      try {
        await updateUser(dbId, { displayName, location, phone, avatarUrl: avatarUrl || undefined } as any);
      } catch (err) {
        console.warn('Failed to persist to DB:', err);
      }
    }

    setTimeout(() => {
      setSaving(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }, 800);
  };

  return (
    <SettingsHub role="EMPLOYER" accountSection={
      <div className="space-y-10 font-sans">

        {/* AVATAR / LOGO UPLOAD */}
        <section className="space-y-4">
          <h3 className="text-lg font-black text-gray-900 font-sans tracking-tight flex items-center gap-2.5 uppercase border-b border-gray-50 pb-3">
            <Camera size={20} className="text-blue-600" />
            {t('profile_photo_logo')}
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
              <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mt-0.5">{t('individual_tasks_employer')}</p>
              <p className="text-xs text-gray-400 mt-2">{t('photo_upload_hint_prefix')} <span className="text-blue-600 font-bold">{t('camera_icon')}</span> {t('photo_upload_hint_suffix')}<br/>Max: 2MB. JPG, PNG, or WEBP.</p>
              {uploadError && <p className="text-xs text-red-500 font-bold mt-1">{uploadError}</p>}
            </div>
          </div>
        </section>

        {/* BIO SECTION & CORE INFO */}
        <section className="space-y-6">
          <h3 className="text-lg font-black text-gray-900 font-sans tracking-tight flex items-center gap-2.5 uppercase border-b border-gray-50 pb-3">
            <User size={20} className="text-blue-600" />
            {t('information_profile')}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{t('display_name_identity')}</label>
              <input 
                type="text" 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{t('kigali_workspace_location')}</label>
              <input 
                type="text" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{t('mobile_telephone_contact')}</label>
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
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{t('account_role_status')}</label>
              <div className="px-5 py-4 rounded-xl bg-blue-50/50 border border-blue-100 text-blue-700 font-sans text-xs font-black uppercase tracking-wider leading-none">
                {t('individual_tasks_employer')}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{t('bio_details')}</label>
            <textarea 
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t('bio_placeholder')}
              className="w-full px-5 py-3.5 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all text-sm resize-none"
            />
          </div>
        </section>

        {/* VERIFICATION SECTION */}
        <section className="pt-8 border-t border-gray-50 space-y-6">
          <h3 className="text-lg font-black text-gray-900 font-sans tracking-tight flex items-center gap-2.5 uppercase border-b border-gray-50 pb-3">
            <User size={20} className="text-blue-600" />
            {t('identity_verification')}
          </h3>

          {isVerified ? (
            <div className="p-5 bg-green-50/50 border border-green-200 rounded-3xl flex items-start gap-4">
              <div className="h-10 w-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center border border-green-200 shadow-sm shrink-0">
                <CheckCircle size={20} />
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-xs font-black text-green-800 uppercase tracking-wider font-sans">{t('verification_shield_badge_active')}</p>
                  <span className="bg-green-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded leading-none uppercase">{t('verified_employer')}</span>
                </div>
                <p className="text-xs text-green-700 font-bold font-sans mt-0.5 italic leading-normal">
                  {t('verified_employer_desc')}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-yellow-50/50 border border-yellow-200 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 bg-white text-yellow-600 rounded-xl flex items-center justify-center border border-yellow-100 shadow-sm shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <p className="text-xs font-black text-yellow-900 uppercase tracking-wider font-sans">{t('shield_verification_pending')}</p>
                  <p className="text-[11px] text-yellow-700 font-bold mt-0.5 leading-normal">
                    {t('verification_pending_desc')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => window.location.href = '/dashboard/employer/verify'}
                className="px-5 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-yellow-100 self-start md:self-auto shrink-0"
              >
                {t('verify_now')}
              </button>
            </div>
          )}
        </section>

        {/* SAVE ACTION */}
        <div className="pt-8 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-end gap-4">
          {isSaved && (
            <span className="text-xs font-black uppercase text-green-600 animate-pulse font-sans">
              {t('profile_saved_success')}
            </span>
          )}
          <button 
            type="button"
            disabled={saving}
            onClick={handleSaveChanges}
            className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-sans font-black text-[10px] tracking-widest shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-2 self-stretch sm:self-auto uppercase cursor-pointer disabled:opacity-60"
          >
            {saving ? (
              <span>{t('preserving_changes')}</span>
            ) : (
              <>
                <Save size={14} />
                <span>{t('save_changes')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    } />
  );
}
