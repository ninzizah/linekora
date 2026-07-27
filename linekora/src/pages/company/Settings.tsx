import React, { useState, useEffect } from 'react';
import { 
  Building, Phone, 
  ShieldCheck, Save, CheckCircle2, LogOut
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../lib/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';

const COMPANY_AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=150&q=80',
];

export default function CompanySettings() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Controlled states
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [headquarters, setHeadquarters] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [strictHiring, setStrictHiring] = useState(false);

  const storageKey = (key: string) => `${key}_${profile?.id || profile?.uid || 'guest'}`;

  useEffect(() => {
    if (profile) {
      setCompanyName(localStorage.getItem(storageKey('company_name')) || profile.displayName || '');
      setIndustry(localStorage.getItem(storageKey('company_industry')) || '');
      setEmail(localStorage.getItem(storageKey('company_email')) || profile.email || '');
      setPhone(localStorage.getItem(storageKey('company_phone')) || profile.phone || '');
      setHeadquarters(localStorage.getItem(storageKey('company_location')) || profile.location || '');
      setStrictHiring(localStorage.getItem(storageKey('company_strict_hiring')) === 'true');
      setSelectedAvatar(
        localStorage.getItem(`linekora_profile_picture_${profile.uid || profile.id || 'guest'}`) || 
        COMPANY_AVATAR_PRESETS[0]
      );
    }
  }, [profile?.id]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(storageKey('company_name'), companyName);
    localStorage.setItem(storageKey('company_industry'), industry);
    localStorage.setItem(storageKey('company_email'), email);
    localStorage.setItem(storageKey('company_phone'), phone);
    localStorage.setItem(storageKey('company_location'), headquarters);
    localStorage.setItem(storageKey('company_strict_hiring'), strictHiring.toString());
    // Keep legacy key for DashboardLayout display name
    localStorage.setItem('company_display_name_override', companyName);
    
    const avatarKey = `linekora_profile_picture_${profile?.uid || profile?.id || 'guest'}`;
    if (selectedAvatar) localStorage.setItem(avatarKey, selectedAvatar);

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto font-sans">
        <header className="mb-10">
          <h1 className="text-3xl font-black text-gray-900 font-sans tracking-tight uppercase">Company Settings</h1>
          <p className="text-gray-500 font-sans font-medium mt-1 italic">Manage your corporate profile and hiring preferences.</p>
        </header>

        <form onSubmit={handleSave} className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm space-y-12">
          
          {/* Avatar Presets Selection */}
          <section className="space-y-6">
            <h3 className="text-xl font-black text-gray-900 font-sans tracking-tight flex items-center gap-3">
              <div className="h-16 w-16 rounded-2xl overflow-hidden shadow-md">
                <img src={selectedAvatar || null} alt="Company Avatar" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div>
                <span>Corporate Identity Visual</span>
                <p className="text-xs font-semibold text-gray-400 mt-0.5 normal-case font-sans">Select a professional branded placeholder banner or logo.</p>
              </div>
            </h3>
            
            <div className="flex flex-wrap gap-4 pt-2">
              {COMPANY_AVATAR_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedAvatar(preset)}
                  className={`h-16 w-16 rounded-2xl overflow-hidden border-4 transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                    selectedAvatar === preset ? 'border-blue-600 scale-105 shadow-md shadow-blue-105' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={preset} alt={`Company preset ${idx + 1}`} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </section>

          <section className="pt-2 border-t border-gray-50">
            <h3 className="text-xl font-black text-gray-900 font-sans tracking-tight mb-8 flex items-center gap-3">
              <Building size={24} className="text-blue-600" />
              Company Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Company Name</label>
                <input 
                  type="text" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Industry</label>
                <input 
                  type="text" 
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Technology / Logistics"
                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Official Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Headquarters</label>
                <input 
                  type="text" 
                  value={headquarters}
                  onChange={(e) => setHeadquarters(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Telephone Number</label>
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
                  Trust & Security
                </h3>
                <p className="text-sm font-medium text-gray-500 font-sans mt-1">Manage who can interact with your company.</p>
              </div>
            </div>
            <div className="p-6 bg-gray-50 rounded-[2rem] flex items-center justify-between border border-transparent hover:border-blue-100 transition-all group">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h4 className="font-sans font-black text-gray-900 text-sm">Strict Hiring Only</h4>
                  <p className="text-xs text-gray-500 font-medium">Only verified workers can apply to our jobs.</p>
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
              Sign Out
            </button>
            <div className="flex items-center gap-4">
              {isSaved && (
                <span className="text-xs font-black text-green-600 animate-pulse uppercase">
                  ✅ Saved Company Details!
                </span>
              )}
              <button type="submit" className="px-10 py-4 bg-blue-600 text-white rounded-[2.5rem] font-sans font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-3 active:scale-95 cursor-pointer">
                <Save size={20} />
                Save Company Profile
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
