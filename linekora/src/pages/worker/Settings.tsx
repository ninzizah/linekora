import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Bell, Shield, 
  CreditCard, EyeOff, ChevronRight,
  Save, LogOut, Trash2, Camera, X
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../lib/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';

export default function WorkerSettings() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inputs State
  const [displayName, setDisplayName] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    if (profile) {
      setDisplayName(localStorage.getItem('worker_profile_name') || profile.displayName || '');
      setLocation(localStorage.getItem('worker_profile_location') || profile.location || 'Kigali, Rwanda');
      setBio(localStorage.getItem('worker_profile_bio') || "Passionate professional with over 5 years of experience.");
      setAvatarUrl(
        localStorage.getItem(`linekora_profile_picture_${profile.uid || 'guest'}`) || ''
      );
    }
  }, [profile]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  // Handle photo file selection
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Photo must be smaller than 2MB.');
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('worker_profile_name', displayName);
    localStorage.setItem('worker_profile_location', location);
    localStorage.setItem('worker_profile_bio', bio);

    const key = profile?.uid ? `linekora_profile_picture_${profile.uid}` : `linekora_profile_picture_guest`;
    if (avatarUrl) {
      localStorage.setItem(key, avatarUrl);
    } else {
      localStorage.removeItem(key);
    }
    
    const demoUserStr = localStorage.getItem('demo_user');
    if (demoUserStr) {
      try {
        const parsed = JSON.parse(demoUserStr);
        parsed.displayName = displayName;
        parsed.location = location;
        localStorage.setItem('demo_user', JSON.stringify(parsed));
      } catch (e) {}
    }

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Alerts', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'payments', label: 'Billing', icon: CreditCard },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-2 sm:px-4">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 font-sans tracking-tight">Account Settings</h1>
          <p className="text-gray-500 font-sans font-medium mt-1 italic text-sm">Manage your profile, photo and account preferences.</p>
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
            Sign Out
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
                  <h3 className="text-xl font-black text-gray-900 font-sans mb-1">{displayName || 'Your Name'}</h3>
                  <p className="text-sm font-bold text-gray-400 font-sans uppercase tracking-[0.2em]">{profile?.role || 'Worker'}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Tap the <span className="text-blue-600 font-bold">camera icon</span> to upload your profile photo or logo.<br/>
                    Max size: 2MB. JPG, PNG, or WEBP.
                  </p>
                  {uploadError && (
                    <p className="text-xs text-red-500 font-bold mt-1">{uploadError}</p>
                  )}
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest font-sans px-1">Full Name</label>
                    <input 
                      type="text" 
                      value={displayName} 
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest font-sans px-1">Location</label>
                    <input 
                      type="text" 
                      value={location} 
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all text-sm"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest font-sans px-1">Email Address</label>
                  <input 
                    type="email" 
                    defaultValue={profile?.email} 
                    disabled
                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-100 border-2 border-transparent text-gray-400 outline-none font-sans font-bold text-sm cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest font-sans px-1">Professional Bio</label>
                  <textarea 
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell employers about your skills and experience..."
                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all text-sm resize-none"
                  />
                </div>

                <div className="pt-4 border-t border-gray-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {isSaved ? (
                    <span className="text-xs font-black uppercase text-green-600 animate-pulse font-sans">
                      ✅ Profile saved successfully!
                    </span>
                  ) : <span />}
                  <button 
                    type="submit"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-sans font-black text-sm shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all cursor-pointer"
                  >
                    <Save size={18} />
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-8">
              <h3 className="text-xl font-black text-gray-900 font-sans mb-8">Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { title: 'Job Matches', desc: 'Get notified when new jobs match your skills.', active: true },
                  { title: 'Message Alerts', desc: 'Receive alerts when an employer sends you a message.', active: true },
                  { title: 'Payment Updates', desc: 'Alerts for deposits, escrow and successful withdrawals.', active: false },
                  { title: 'Marketing', desc: 'Occasional updates about new LINEKORA features and tips.', active: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 sm:p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                    <div className="pr-4">
                      <p className="font-sans font-black text-sm text-gray-900 mb-0.5">{item.title}</p>
                      <p className="font-sans text-xs text-gray-500 font-medium">{item.desc}</p>
                    </div>
                    <button className={`w-12 h-6 rounded-full p-1 transition-colors relative shrink-0 ${item.active ? 'bg-blue-600' : 'bg-gray-300'}`}>
                      <div className={`h-4 w-4 bg-white rounded-full shadow-sm transition-transform ${item.active ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-8">
              <h3 className="text-xl font-black text-gray-900 font-sans mb-8">Security & Privacy</h3>
              <div className="space-y-6">
                <button className="w-full flex items-center justify-between p-5 sm:p-6 bg-gray-50 rounded-[2rem] border border-gray-100 hover:border-blue-600 transition-all group text-left">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm shrink-0">
                      <EyeOff size={20} />
                    </div>
                    <div>
                      <p className="font-sans font-black text-sm text-gray-900">Change Password</p>
                      <p className="font-sans text-xs text-gray-500 font-medium tracking-tight">Last changed 3 months ago</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-600 shrink-0" />
                </button>

                <button className="w-full flex items-center justify-between p-5 sm:p-6 bg-gray-50 rounded-[2rem] border border-gray-100 hover:border-blue-600 transition-all group text-left">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm shrink-0">
                      <Shield size={20} />
                    </div>
                    <div>
                      <p className="font-sans font-black text-sm text-gray-900">Two-Factor Authentication</p>
                      <p className="font-sans text-xs text-gray-500 font-medium tracking-tight">Currently Disabled</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-600 shrink-0" />
                </button>

                <div className="pt-6 mt-4 border-t border-gray-50">
                  <button className="flex items-center gap-2 text-red-500 font-sans font-black text-xs uppercase tracking-widest hover:underline">
                    <Trash2 size={14} />
                    Deactivate Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-6">
              <h3 className="text-xl font-black text-gray-900 font-sans">Billing & Payments</h3>
              <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 text-center">
                <CreditCard size={32} className="mx-auto text-blue-400 mb-3" />
                <p className="font-bold text-blue-700 text-sm">No active subscriptions</p>
                <p className="text-xs text-blue-500 mt-1">You are on the Free Account tier. Upgrade for premium features.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
