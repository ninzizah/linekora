import React, { useState, useEffect, useRef } from 'react';
import { 
  Building, Phone, 
  ShieldCheck, Save, CheckCircle2, LogOut, Camera, X, User
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../lib/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { updateUser } from '../../lib/api';
import { useLanguage } from '../../lib/LanguageContext';

export default function CompanySettings() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Controlled states
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [headquarters, setHeadquarters] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [strictHiring, setStrictHiring] = useState(false);

  const companyUid = profile?.firebaseUid || profile?.id || 'guest';
  const storageKey = (key: string) => `${key}_${companyUid}`;

  useEffect(() => {
    if (profile) {
      setCompanyName(localStorage.getItem(storageKey('company_name')) || profile.displayName || '');
      setIndustry(localStorage.getItem(storageKey('company_industry')) || '');
      setEmail(localStorage.getItem(storageKey('company_email')) || profile.email || '');
      setPhone(localStorage.getItem(storageKey('company_phone')) || profile.phone || '');
      setHeadquarters(localStorage.getItem(storageKey('company_location')) || profile.location || '');
      setStrictHiring(localStorage.getItem(storageKey('company_strict_hiring')) === 'true');
      setSelectedAvatar(
        localStorage.getItem(`linekora_profile_picture_${companyUid}`) || ''
      );
    }
  }, [profile?.id]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setUploadError(t('photo_size_error'));
      return;
    }
    setUploadError('');
    const reader = new FileReader();
    reader.onload = (ev) => setSelectedAvatar(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(storageKey('company_name'), companyName);
    localStorage.setItem(storageKey('company_industry'), industry);
    localStorage.setItem(storageKey('company_email'), email);
    localStorage.setItem(storageKey('company_phone'), phone);
    localStorage.setItem(storageKey('company_location'), headquarters);
    localStorage.setItem(storageKey('company_strict_hiring'), strictHiring.toString());
    // Keep legacy key for DashboardLayout display name
    localStorage.setItem('company_display_name_override', companyName);
    
    const avatarKey = `linekora_profile_picture_${companyUid}`;
    if (selectedAvatar) {
      localStorage.setItem(avatarKey, selectedAvatar);
    } else {
      localStorage.removeItem(avatarKey);
    }

    // Persist to DB
    const dbId = profile?.id || profile?.firebaseUid;
    if (dbId) {
      try {
        await updateUser(dbId, { displayName: companyName, location: headquarters, phone, avatarUrl: selectedAvatar || undefined } as any);
      } catch (err) {
        console.warn('Failed to persist to DB:', err);
    }
    }

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto font-sans">
        <header className="mb-10">
          <h1 className="text-3xl font-black text-gray-900 font-sans tracking-tight uppercase">{t('company_settings')}</h1>
          <p className="text-gray-500 font-sans font-medium mt-1 italic">{t('company_settings_subtitle')}</p>
        </header>

        <form onSubmit={handleSave} className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm space-y-12">
          
          {/* Avatar Upload */}
          <section className="space-y-6">
            <h3 className="text-xl font-black text-gray-900 font-sans tracking-tight flex items-center gap-3">
              <div className="relative">
                <div className="h-20 w-20 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl bg-blue-50 shrink-0">
                  {selectedAvatar ? (
                    <img src={selectedAvatar} alt={t('company_avatar')} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                      <User size={32} className="text-blue-400" />
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
                {selectedAvatar && (
                  <button
                    type="button"
                    onClick={() => setSelectedAvatar('')}
                    className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all border-2 border-white"
                  >
                    <X size={10} />
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </div>
              <div>
                <span>{t('corporate_identity_visual')}</span>
                <p className="text-xs font-semibold text-gray-400 mt-0.5 normal-case font-sans">{t('photo_upload_hint_prefix')} <span className="text-blue-600 font-bold">{t('camera_icon')}</span> {t('photo_upload_hint_suffix')}<br/>{t('photo_upload_limits')}</p>
                {uploadError && <p className="text-xs text-red-500 font-bold mt-1">{uploadError}</p>}
              </div>
            </h3>
          </section>

          <section className="pt-2 border-t border-gray-50">
            <h3 className="text-xl font-black text-gray-900 font-sans tracking-tight mb-8 flex items-center gap-3">
              <Building size={24} className="text-blue-600" />
              {t('company_information')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">{t('company_name')}</label>
                <input 
                  type="text" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">{t('industry')}</label>
                <input 
                  type="text" 
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder={t('placeholder_industry')}
                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">{t('official_email')}</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">{t('headquarters')}</label>
                <input 
                  type="text" 
                  value={headquarters}
                  onChange={(e) => setHeadquarters(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">{t('telephone_number')}</label>
                <div className="relative">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+250..."
                    className="w-full pl-14 pr-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="pt-10 border-t border-gray-50">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-gray-900 font-sans tracking-tight flex items-center gap-3">
                  <ShieldCheck size={24} className="text-blue-600" />
                  {t('trust_and_security')}
                </h3>
                <p className="text-sm font-medium text-gray-500 font-sans mt-1">{t('manage_interactions')}</p>
              </div>
            </div>
            <div className="p-6 bg-gray-50 rounded-[2rem] flex items-center justify-between border border-transparent hover:border-blue-100 transition-all group">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h4 className="font-sans font-black text-gray-900 text-sm">{t('strict_hiring_only')}</h4>
                  <p className="text-xs text-gray-500 font-medium">{t('strict_hiring_only_desc')}</p>
                </div>
              </div>
            <button 
              type="button" 
              onClick={() => setStrictHiring(v => !v)}
              className={`h-6 w-12 rounded-full p-1 transition-colors relative shrink-0 ${strictHiring ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <div className={`h-4 w-4 bg-white rounded-full shadow-sm transition-transform ${strictHiring ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
            </div>
          </section>

          <div className="pt-10 border-t border-gray-50 flex justify-between items-center gap-4">
            <button 
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-500 font-sans font-black text-xs uppercase tracking-widest hover:bg-red-50 px-4 py-2 rounded-xl transition-all"
            >
              <LogOut size={18} />
              {t('sign_out')}
            </button>
            <div className="flex items-center gap-4">
              {isSaved && (
                <span className="text-xs font-black text-green-600 animate-pulse uppercase">
                  {t('saved_company_details')}
                </span>
              )}
              <button type="submit" className="px-10 py-4 bg-blue-600 text-white rounded-[2.5rem] font-sans font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-3 active:scale-95 cursor-pointer">
                <Save size={20} />
                {t('save_company_profile')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
