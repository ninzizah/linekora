import React, { useState, useEffect } from 'react';
import { 
  Settings, User, Bell, Shield, 
  CreditCard, Eye, EyeOff, ChevronRight,
  Save, LogOut, Trash2
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../lib/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=150&q=80',
];

export default function WorkerSettings() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const navigate = useNavigate();

  // Inputs State
  const [displayName, setDisplayName] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(localStorage.getItem('worker_profile_name') || profile.displayName || 'Shema Honore');
      setLocation(localStorage.getItem('worker_profile_location') || profile.location || 'Kigali, Rwanda');
      setBio(localStorage.getItem('worker_profile_bio') || "Passionate professional with over 5 years of experience in high-quality facility management.");
      setSelectedAvatar(
        localStorage.getItem(`linekora_profile_picture_${profile.uid || 'guest'}`) || 
        AVATAR_PRESETS[0]
      );
    }
  }, [profile]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('worker_profile_name', displayName);
    localStorage.setItem('worker_profile_location', location);
    localStorage.setItem('worker_profile_bio', bio);
    if (profile?.uid) {
      localStorage.setItem(`linekora_profile_picture_${profile.uid}`, selectedAvatar);
    } else {
      localStorage.setItem(`linekora_profile_picture_guest`, selectedAvatar);
    }
    
    // Also update demo_user if cached
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
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'payments', label: 'Billing', icon: CreditCard },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-black text-gray-900 font-sans tracking-tight">Account Settings</h1>
          <p className="text-gray-500 font-sans font-medium mt-1 italic">Manage your profile, visibility and account preferences.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Tabs Sidebar */}
          <div className="md:col-span-1 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-sans font-bold text-sm transition-all ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                    : 'text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-sm border border-transparent'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
            
            <div className="pt-6 mt-6 border-t border-gray-100">
               <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-sans font-bold text-sm text-red-500 hover:bg-red-50 transition-all"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm">
              {activeTab === 'profile' && (
                <div className="space-y-8 font-sans">
                  <div className="flex flex-col md:flex-row md:items-center gap-8 mb-4">
                    <div className="relative group">
                      <div className="h-24 w-24 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl bg-blue-50 shrink-0">
                        <img 
                          src={selectedAvatar || null} 
                          alt={displayName} 
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-900 font-sans mb-1">{displayName || 'User Name'}</h3>
                      <p className="text-sm font-bold text-gray-400 font-sans uppercase tracking-[0.2em]">{profile?.role || 'Worker'}</p>
                      <p className="text-xs text-gray-400 mt-1">Pick a curated professional profile picture preset from the options below.</p>
                    </div>
                  </div>

                  {/* Curated Preset Selector */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans px-1">Curated Avatar Presets</label>
                    <div className="flex flex-wrap gap-3">
                      {AVATAR_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedAvatar(preset)}
                          className={`h-14 w-14 rounded-2xl overflow-hidden border-4 transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                            selectedAvatar === preset ? 'border-blue-600 scale-105 shadow-md shadow-blue-105' : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={preset} alt={`Preset ${idx + 1}`} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between gap-4">
                      {isSaved ? (
                        <span className="text-xs font-black uppercase text-green-600 animate-pulse font-sans">
                          ✅ Verified Information Preserved Cleanly!
                        </span>
                      ) : <span />}
                      <button 
                        type="submit"
                        className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-sans font-black text-sm shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all cursor-pointer"
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
                      { title: 'Marketing', desc: 'Ocassional updates about new LINEKORA features and tips.', active: false },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                        <div>
                          <p className="font-sans font-black text-sm text-gray-900 mb-0.5">{item.title}</p>
                          <p className="font-sans text-xs text-gray-500 font-medium">{item.desc}</p>
                        </div>
                        <button className={`w-12 h-6 rounded-full p-1 transition-colors relative ${item.active ? 'bg-blue-600' : 'bg-gray-300'}`}>
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
                    <button className="w-full flex items-center justify-between p-6 bg-gray-50 rounded-[2rem] border border-gray-100 hover:border-blue-600 transition-all group text-left">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                          <EyeOff size={20} />
                        </div>
                        <div>
                          <p className="font-sans font-black text-sm text-gray-900">Change Password</p>
                          <p className="font-sans text-xs text-gray-500 font-medium tracking-tight">Last changed 3 months ago</p>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-600" />
                    </button>

                    <button className="w-full flex items-center justify-between p-6 bg-gray-50 rounded-[2rem] border border-gray-100 hover:border-blue-600 transition-all group text-left">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                          <Shield size={20} />
                        </div>
                        <div>
                          <p className="font-sans font-black text-sm text-gray-900">Two-Factor Authentication</p>
                          <p className="font-sans text-xs text-gray-500 font-medium tracking-tight">Currently Disabled</p>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-600" />
                    </button>

                    <div className="pt-6 mt-10 border-t border-gray-50">
                      <button className="flex items-center gap-2 text-red-500 font-sans font-black text-xs uppercase tracking-widest hover:underline">
                        <Trash2 size={14} />
                        Deactivate Account
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
