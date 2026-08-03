import React, { useState, useEffect, useRef } from 'react';
import { 
  User, CreditCard,
  Save, LogOut, Trash2, Camera, X, FileText, Upload, Loader2, Download, File
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../lib/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { updateUser } from '../../lib/api';
import { useLanguage } from '../../lib/LanguageContext';

export default function WorkerSettings() {
  const { t } = useLanguage();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);
  
  const uid = profile?.firebaseUid || profile?.id || 'guest';
  const sk = (key: string) => `${key}_${uid}`;

  // Inputs State
  const [displayName, setDisplayName] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // CV & Portfolio upload states
  const [cvFile, setCvFile] = useState<{ name: string; size: string; dataUrl: string; date: string } | null>(() => {
    const cached = localStorage.getItem(sk('worker_cv_data'));
    if (cached) {
      try { return JSON.parse(cached); } catch (e) { return null; }
    }
    return null;
  });
  const [isUploadingCv, setIsUploadingCv] = useState(false);
  const [cvUploadProgress, setCvUploadProgress] = useState(0);
  const [cvError, setCvError] = useState('');

  useEffect(() => {
    if (profile) {
      setDisplayName(localStorage.getItem(sk('worker_profile_name')) || profile.displayName || '');
      setLocation(localStorage.getItem(sk('worker_profile_location')) || profile.location || '');
      setPhone(profile.phone || '');
      setBio(localStorage.getItem(sk('worker_profile_bio')) || '');
      setAvatarUrl(
        localStorage.getItem(`linekora_profile_picture_${uid}`) || ''
      );
    }
  }, [profile?.id]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      navigate('/');
    }
  };

  // Handle photo file selection
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setUploadError(t('photo_size_error'));
      return;
    }
    setUploadError('');

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setAvatarUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(sk('worker_profile_name'), displayName);
    localStorage.setItem(sk('worker_profile_location'), location);
    localStorage.setItem(sk('worker_profile_bio'), bio);
    // Keep legacy key for DashboardLayout display name
    localStorage.setItem('worker_profile_name', displayName);

    const avatarKey = `linekora_profile_picture_${uid}`;
    if (avatarUrl) {
      localStorage.setItem(avatarKey, avatarUrl);
    } else {
      localStorage.removeItem(avatarKey);
    }

    // Persist to DB
    const dbId = profile?.id || profile?.firebaseUid;
    if (dbId) {
      try {
        await updateUser(dbId, { displayName, location, phone, bio, avatarUrl: avatarUrl || undefined } as any);
      } catch (err) {
        console.warn('Failed to persist to DB:', err);
      }
    }

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setCvError(t('cv_size_error'));
      return;
    }
    setCvError('');
    setIsUploadingCv(true);
    setCvUploadProgress(10);

    const interval = setInterval(() => {
      setCvUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 20;
      });
    }, 150);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setTimeout(() => {
        clearInterval(interval);
        setCvUploadProgress(100);
        const cvObj = {
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
          dataUrl,
          date: new Date().toLocaleDateString()
        };
        setCvFile(cvObj);
        localStorage.setItem(sk('worker_cv_data'), JSON.stringify(cvObj));
        setIsUploadingCv(false);
      }, 800);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCv = () => {
    setCvFile(null);
    localStorage.removeItem(sk('worker_cv_data'));
  };

  const tabs = [
    { id: 'profile', label: t('profile'), icon: User },
    { id: 'portfolio', label: t('cv_portfolio'), icon: FileText },
    { id: 'payments', label: t('billing'), icon: CreditCard },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-2 sm:px-4">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 font-sans tracking-tight">{t('account_settings')}</h1>
          <p className="text-gray-500 font-sans font-medium mt-1 italic text-sm">{t('account_settings_subtitle')}</p>
        </header>

        {/* Tab Bar — horizontal scroll on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-sans font-bold text-xs whitespace-nowrap transition-all shrink-0 ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                  : 'text-gray-500 bg-white border border-gray-100 hover:border-blue-200'
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-sans font-bold text-xs whitespace-nowrap shrink-0 text-red-500 bg-red-50 border border-red-100 hover:bg-red-100 transition-all ml-auto"
          >
            <LogOut size={15} />
            {t('sign_out')}
          </button>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl sm:rounded-[3rem] p-5 sm:p-10 border border-gray-100 shadow-sm">
          {activeTab === 'profile' && (
            <div className="space-y-8 font-sans">

              {/* Avatar Upload */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="relative self-start sm:self-auto">
                  <div className="h-24 w-24 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl bg-blue-50 shrink-0">
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt={displayName} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                        <User size={36} className="text-blue-400" />
                      </div>
                    )}
                  </div>
                  {/* Camera button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 h-9 w-9 bg-blue-600 text-white rounded-xl shadow-lg flex items-center justify-center hover:bg-blue-700 transition-all border-2 border-white"
                  >
                    <Camera size={16} />
                  </button>
                  {/* Remove button */}
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all border-2 border-white"
                    >
                      <X size={10} />
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 font-sans mb-1">{displayName || t('your_name')}</h3>
                  <p className="text-sm font-bold text-gray-400 font-sans uppercase tracking-[0.2em]">{profile?.role || t('worker')}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {t('camera_upload_hint')}<br/>
                    {t('max_size_hint')}
                  </p>
                  {uploadError && (
                    <p className="text-xs text-red-500 font-bold mt-1">{uploadError}</p>
                  )}
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest font-sans px-1">{t('full_name')}</label>
                    <input 
                      type="text" 
                      value={displayName} 
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest font-sans px-1">{t('location')}</label>
                    <input 
                      type="text" 
                      value={location} 
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all text-sm"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest font-sans px-1">{t('email_address')}</label>
                  <input 
                    type="email" 
                    defaultValue={profile?.email} 
                    disabled
                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-100 border-2 border-transparent text-gray-400 outline-none font-sans font-bold text-sm cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest font-sans px-1">{t('phone_number')}</label>
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+250 788 123 456"
                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest font-sans px-1">{t('professional_bio')}</label>
                  <textarea 
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder={t('settings_bio_placeholder')}
                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all text-sm resize-none"
                  />
                </div>

                <div className="pt-4 border-t border-gray-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {isSaved ? (
                    <span className="text-xs font-black uppercase text-green-600 animate-pulse font-sans">
                      {t('profile_saved_success')}
                    </span>
                  ) : <span />}
                  <button 
                    type="submit"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-sans font-black text-sm shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all cursor-pointer"
                  >
                    <Save size={18} />
                    {t('save_changes')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div className="space-y-8 font-sans">
              <div>
                <h3 className="text-xl font-black text-gray-900 font-sans mb-1">{t('cv_work_portfolio')}</h3>
                <p className="text-xs text-gray-500 font-sans italic">{t('cv_portfolio_desc')}</p>
              </div>

              <input 
                ref={cvInputRef}
                type="file" 
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" 
                className="hidden" 
                onChange={handleCvChange}
              />

              <div className="space-y-6">
                <div 
                  onClick={() => cvInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 hover:border-blue-600 rounded-[2.5rem] p-8 text-center cursor-pointer transition-all bg-gray-50/60 hover:bg-blue-50/30 group"
                >
                  <div className="h-16 w-16 bg-white border border-gray-150 rounded-2xl flex items-center justify-center mx-auto text-gray-400 group-hover:text-blue-600 group-hover:border-blue-200 shadow-sm transition-all mb-4">
                    {isUploadingCv ? <Loader2 size={32} className="animate-spin text-blue-600" /> : <Upload size={32} />}
                  </div>
                  <h4 className="text-base font-black text-gray-900 uppercase tracking-tight font-sans">
                    {isUploadingCv ? t('uploading_document') : t('upload_cv_portfolio')}
                  </h4>
                  <p className="text-xs text-gray-400 font-sans mt-1">{t('file_types_hint')}</p>
                  
                  {isUploadingCv && (
                    <div className="w-full max-w-md mx-auto bg-gray-200 h-2 rounded-full overflow-hidden mt-4">
                      <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${cvUploadProgress}%` }} />
                    </div>
                  )}
                </div>

                {cvError && (
                  <p className="text-xs text-red-500 font-bold text-center bg-red-50 py-2 rounded-xl border border-red-100">{cvError}</p>
                )}

                {cvFile ? (
                  <div className="bg-blue-50/60 border-2 border-blue-200 rounded-3xl p-6 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 shrink-0">
                        <FileText size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-sans font-black text-sm text-gray-900 leading-tight">{cvFile.name}</h5>
                          <span className="bg-green-100 text-green-700 text-[8px] font-black uppercase px-2 py-0.5 rounded">{t('active_cv')}</span>
                        </div>
                        <p className="text-xs text-gray-500 font-sans font-medium mt-0.5">{t('cv_meta', { size: cvFile.size, date: cvFile.date })}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a 
                        href={cvFile.dataUrl} 
                        download={cvFile.name}
                        className="p-3 bg-white text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl border border-blue-200 shadow-sm transition-all"
                        title={t('download_cv')}
                      >
                        <Download size={16} />
                      </a>
                      <button 
                        type="button"
                        onClick={handleRemoveCv}
                        className="p-3 bg-white text-red-500 hover:bg-red-500 hover:text-white rounded-xl border border-red-100 shadow-sm transition-all"
                        title={t('remove_cv')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <File size={28} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest font-sans">{t('no_cv_uploaded')}</p>
                    <p className="text-[10px] text-gray-400 mt-1 font-sans italic">{t('no_cv_hint')}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-6">
              <h3 className="text-xl font-black text-gray-900 font-sans">{t('billing_payments')}</h3>
              <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 text-center">
                <CreditCard size={32} className="mx-auto text-blue-400 mb-3" />
                <p className="font-bold text-blue-700 text-sm">{t('no_active_subscriptions')}</p>
                <p className="text-xs text-blue-500 mt-1">{t('free_tier_upgrade')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
