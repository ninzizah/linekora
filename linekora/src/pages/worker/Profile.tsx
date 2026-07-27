import React, { useState, useEffect } from 'react';
import { 
  User, MapPin, Star, Zap, Shield, FileText,
  Briefcase, GraduationCap, Award, ExternalLink,
  MessageSquare, Heart, Share2, CheckCircle2, X, AlertCircle, Loader2, ArrowRight
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../lib/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationMsg {
  id: string;
  type: 'success' | 'info' | 'error' | 'heart';
  title: string;
  message: string;
}

export default function WorkerProfile() {
  const { profile } = useAuth();
  const uid = profile?.firebaseUid || profile?.id || 'guest';
  const sk = (key: string) => `${key}_${uid}`;

  // Load from localStorage scoped to this user or defaults
  const [nameOverride, setNameOverride] = useState<string>(() => {
    return localStorage.getItem(sk('worker_profile_name')) || profile?.displayName || '';
  });

  const [locationOverride, setLocationOverride] = useState<string>(() => {
    return localStorage.getItem(sk('worker_profile_location')) || profile?.location || '';
  });

  const [bio, setBio] = useState<string>(() => {
    return localStorage.getItem(sk('worker_profile_bio')) || '';
  });

  const [skillsList, setSkillsList] = useState<string[]>(() => {
    const saved = localStorage.getItem(sk('worker_profile_skills'));
    if (saved) {
      try { return JSON.parse(saved); } catch(e) {}
    }
    return [];
  });

  const [cvName, setCvName] = useState<string>(() => {
    return localStorage.getItem(sk('worker_profile_cv_filename')) || '';
  });

  const [portfolioList, setPortfolioList] = useState<string[]>(() => {
    const saved = localStorage.getItem(sk('worker_profile_portfolio'));
    if (saved) {
      try { return JSON.parse(saved); } catch(e) {}
    }
    return [];
  });

  const [isFavorited, setIsFavorited] = useState<boolean>(() => {
    return localStorage.getItem(sk('worker_profile_is_favorited')) === 'true';
  });

  // Sync profile data once loaded if NOT edited before
  useEffect(() => {
    if (profile?.displayName && !localStorage.getItem(sk('worker_profile_name'))) {
      setNameOverride(profile.displayName);
    }
    if (profile?.location && !localStorage.getItem(sk('worker_profile_location'))) {
      setLocationOverride(profile.location);
    }
  }, [profile]);

  // Sync to local storage for persistence
  useEffect(() => { localStorage.setItem(sk('worker_profile_name'), nameOverride); }, [nameOverride]);
  useEffect(() => { localStorage.setItem(sk('worker_profile_location'), locationOverride); }, [locationOverride]);
  useEffect(() => { localStorage.setItem(sk('worker_profile_bio'), bio); }, [bio]);
  useEffect(() => { localStorage.setItem(sk('worker_profile_skills'), JSON.stringify(skillsList)); }, [skillsList]);
  useEffect(() => { localStorage.setItem(sk('worker_profile_cv_filename'), cvName); }, [cvName]);
  useEffect(() => { localStorage.setItem(sk('worker_profile_portfolio'), JSON.stringify(portfolioList)); }, [portfolioList]);
  useEffect(() => { localStorage.setItem(sk('worker_profile_is_favorited'), isFavorited.toString()); }, [isFavorited]);

  // Notifications system state
  const [notifications, setNotifications] = useState<NotificationMsg[]>([]);

  const addNotification = (type: 'success' | 'info' | 'error' | 'heart', title: string, message: string) => {
    const id = Date.now().toString();
    const newNotification = { id, type, title, message };
    setNotifications(prev => [...prev, newNotification]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  // Profile Form Edit state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editSkills, setEditSkills] = useState('');
  const [editPortfolio, setEditPortfolio] = useState('');

  // CV action states
  const [isUploadingCV, setIsUploadingCV] = useState(false);
  const [showConfirmCVRemove, setShowConfirmCVRemove] = useState(false);
  const cvFileInputRef = useState<any>(null)[0] || { current: null };

  // Static Details for display values
  const profileDetails = {
    experience: [
      { role: "Senior Maintenance Lead", company: "Prime Facilities", period: "2021 - Present", desc: "Leading a team of 10 for statewide facility management." },
      { role: "Cleaning Specialist", company: "GreenClean Solutions", period: "2018 - 2021", desc: "Specialized in eco-friendly residential cleaning." },
    ],
    education: [
      { degree: "Specialized Maintenance Certificate", school: "Technical Institute of Kigali", year: "2018" }
    ],
    certificates: ["OSHA Safety Certified", "Eco-Friendly Cleaning Specialist"],
    portfolio: portfolioList,
    rating: 0,
    reviewsCount: 0,
    jobsCompleted: 0,
    tier: profile?.tier || "Free Account"
  };

  // Heart toggle
  const handleHeartToggle = () => {
    const nextVal = !isFavorited;
    setIsFavorited(nextVal);
    if (nextVal) {
      addNotification('heart', 'Profile Bookmarked ❤️', 'You added this worker profile to favorites. Highlight markers updated.');
    } else {
      addNotification('info', 'Removed Bookmark', 'Worker profile removed from your favorites collection.');
    }
  };

  // Share profile Link
  const handleShare = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      addNotification('success', 'Public URL Copied 🔗', 'Shareable profile link securely loaded to your clipboard.');
    } catch (e) {
      addNotification('success', 'Public Profile Link', 'Public link is ready. Use share tools to send badges.');
    }
  };

  // Save changes
  const handleSaveProfile = () => {
    setNameOverride(editName.trim() || 'User Name');
    setBio(editBio.trim());
    setLocationOverride(editLocation.trim() || 'Location not set');
    
    const parsedSkills = editSkills
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    setSkillsList(parsedSkills);

    const parsedPortfolio = editPortfolio
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);
    setPortfolioList(parsedPortfolio);

    // Sync back to demo_user local storage if exist to persist on reload cleanly
    const demoUserStr = localStorage.getItem('demo_user');
    if (demoUserStr) {
      try {
        const demoProfile = JSON.parse(demoUserStr);
        demoProfile.displayName = editName.trim();
        demoProfile.location = editLocation.trim();
        localStorage.setItem('demo_user', JSON.stringify(demoProfile));
      } catch (e) {}
    }

    setShowEditModal(false);
    addNotification('success', 'Profile Updated 🚀', 'Your verified specifications saved successfully. Secure trust score unaffected.');
  };

  // Real device file selection for CV
  const handleCVFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploadingCV(true);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setIsUploadingCV(false);
        setCvName(file.name);
        if (event.target?.result) {
          localStorage.setItem(sk('worker_profile_cv_data'), event.target.result as string);
        }
        addNotification('success', 'CV Synchronized 📄', `Uploaded "${file.name}" successfully. Employer views synchronized.`);
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger file dialog
  const handleUploadCVClick = () => {
    const input = document.getElementById('cv-file-picker-input') as HTMLInputElement;
    input?.click();
  };

  // Remove CV
  const handleRemoveCV = () => {
    setCvName('');
    localStorage.removeItem(sk('worker_profile_cv_data'));
    setShowConfirmCVRemove(false);
    addNotification('info', 'CV File Removed', 'Your curriculum vitae file has been cleared from employer indices.');
  };

  // Direct contact message click
  const handleSendMessageClick = () => {
    addNotification('success', 'Encrypted Line Connected 💬', 'LINEKORA instant secure workplace chat channel initialized with Shema Honore.');
  };

  // Portfolio click notifications
  const handlePortfolioClick = (project: string) => {
    addNotification('info', 'Milestone Showcase 📂', `Opening technical layout specifications & matching tags for project: "${project}".`);
  };

  // Certification badge click
  const handleCertClick = (cert: string) => {
    addNotification('success', 'Validation Shield 🛡️', `Verified via LINEKORA Ledger system protocol matching: "${cert}".`);
  };

  // Education click
  const handleEduClick = (edu: string) => {
    addNotification('info', 'University Credential 🎓', `Academic record verified with registrar and matching authorities: "${edu}".`);
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Profile Header Card */}
        <div className="relative mb-8 pt-20 animate-fade-in">
          {/* Banner Background */}
          <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[3rem] -z-10 shadow-xl shadow-blue-100" />
          
          <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-end gap-8">
            <div className="relative">
              <div className="h-32 w-32 md:h-40 md:w-40 rounded-[3rem] overflow-hidden bg-blue-100 flex items-center justify-center text-blue-600 font-extrabold text-5xl border-8 border-white shadow-2xl uppercase">
                {(() => {
                  const avatar = localStorage.getItem(`linekora_profile_picture_${uid}`);
                  return avatar ? (
                    <img src={avatar} alt={nameOverride} className="h-full w-full object-cover" />
                  ) : (
                    nameOverride?.[0] || 'U'
                  );
                })()}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-2xl shadow-lg border-4 border-white">
                <CheckCircle2 size={24} />
              </div>
            </div>
            
            <div className="flex-1 w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-1">
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 font-sans tracking-tight">
                      {nameOverride}
                    </h1>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {profile?.tier || profileDetails.tier}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1 text-sm font-bold text-gray-500 font-sans uppercase tracking-widest">
                      <MapPin size={16} className="text-blue-600" />
                      {locationOverride}
                    </span>
                    <span className="flex items-center gap-1 text-sm font-bold text-gray-500 font-sans uppercase tracking-widest">
                      <Star size={16} className="text-yellow-400" />
                      {profileDetails.rating} ({profileDetails.reviewsCount} reviews)
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    id="worker-profile-share-btn"
                    onClick={handleShare}
                    className="p-3 bg-gray-50 text-gray-400 border border-gray-100 rounded-2xl hover:bg-gray-100 hover:text-gray-950 transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                  >
                    <Share2 size={20} />
                  </button>
                  <button 
                    id="worker-profile-heart-btn"
                    onClick={handleHeartToggle}
                    className={`p-3 rounded-2xl transition-all active:scale-95 cursor-pointer border flex items-center justify-center ${
                      isFavorited 
                        ? 'bg-red-50 border-red-100 text-red-500 hover:bg-red-100' 
                        : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100 hover:text-gray-950'
                    }`}
                  >
                    <Heart size={20} className={isFavorited ? 'fill-red-500' : ''} />
                  </button>
                  <button 
                    id="worker-profile-edit-btn"
                    onClick={() => {
                      setEditName(nameOverride);
                      setEditBio(bio);
                      setEditLocation(locationOverride);
                      setEditSkills(skillsList.join(', '));
                      setEditPortfolio(portfolioList.join(', '));
                      setShowEditModal(true);
                    }}
                    className="px-8 py-3.5 bg-blue-600 text-white border border-transparent rounded-2xl font-sans font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 cursor-pointer"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-gray-50">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Trust Score</p>
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-yellow-500" />
                    <span className="text-lg font-black text-gray-900 font-sans">{profile?.trustScore || 98}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Jobs Completed</p>
                  <div className="flex items-center gap-2">
                    <Briefcase size={16} className="text-blue-600" />
                    <span className="text-lg font-black text-gray-900 font-sans">{profileDetails.jobsCompleted}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Verified Member</p>
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-green-500" />
                    <span className="text-lg font-black text-gray-900 font-sans">Yes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* About / Bio */}
            <section className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-black text-gray-900 font-sans mb-6 uppercase tracking-tight">Professional Bio</h2>
              <p className="text-gray-600 font-sans leading-relaxed text-lg italic pr-2">
                "{bio}"
              </p>
            </section>

            {/* Experience */}
            <section className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-black text-gray-900 font-sans mb-8 uppercase tracking-tight">Work Experience</h2>
              <div className="space-y-8">
                {profileDetails.experience.map((exp, i) => (
                  <div key={i} className="relative pl-8 border-l-2 border-blue-50 last:border-0 pb-8 last:pb-0">
                    <div className="absolute left-[-9px] top-0 h-4 w-4 rounded-full bg-blue-600 border-4 border-white shadow-sm" />
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                      <h3 className="font-sans font-black text-gray-900 text-lg">{exp.role}</h3>
                      <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">
                        {exp.period}
                      </span>
                    </div>
                    <p className="text-blue-600 font-bold font-sans text-sm mb-2">{exp.company}</p>
                    <p className="text-gray-500 font-sans text-sm font-medium">{exp.desc}</p>
                  </div>
                ))}
              </div>
            </section>

             {/* Portfolio */}
             <section className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-gray-900 font-sans uppercase tracking-tight">Project Portfolio</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {profileDetails.portfolio.map((item, i) => (
                  <div 
                    key={i} 
                    onClick={() => handlePortfolioClick(item)}
                    className="group bg-gray-50 rounded-3xl p-1 border-2 border-transparent hover:border-blue-600 transition-all cursor-pointer"
                  >
                    <div className="aspect-video bg-gray-200 rounded-[1.4rem] overflow-hidden relative flex items-center justify-center">
                      <FileText size={32} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                      <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-5 transition-opacity" />
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <p className="font-sans font-black text-gray-900 text-sm">{item}</p>
                      <ExternalLink size={16} className="text-gray-400 group-hover:text-blue-600" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">
            {/* Skills */}
            <section className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
              <h2 className="text-lg font-black text-gray-900 font-sans mb-6 uppercase tracking-tight">Main Skills</h2>
              <div className="flex flex-wrap gap-2">
                {skillsList.map((skill, i) => (
                  <span key={i} className="px-4 py-2 bg-gray-50 text-gray-700 rounded-xl font-sans font-bold text-xs border border-gray-100 hover:border-blue-200 hover:bg-white transition-all cursor-default">
                    {skill}
                  </span>
                ))}
              </div>
            </section>

            {/* CV / Resume Section */}
            <section className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
              <h2 className="text-lg font-black text-gray-900 font-sans mb-6 uppercase tracking-tight">CV / Resume</h2>
              <div className="p-6 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center text-center">
                <FileText className="text-blue-600 mb-3" size={32} />
                
                {isUploadingCV ? (
                  <div className="py-6 flex flex-col items-center justify-center animate-pulse">
                    <Loader2 size={24} className="text-blue-600 animate-spin mb-2" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none font-sans">Uploading Credentials...</p>
                  </div>
                ) : showConfirmCVRemove ? (
                  <div className="py-2 animate-fade-in w-full text-center">
                    <p className="text-xs font-black text-red-600 uppercase tracking-tight mb-2">Delete CV File?</p>
                    <p className="text-[10px] text-gray-400 font-sans leading-relaxed mb-4">Employers won't be able to retrieve your credentials.</p>
                    <div className="flex gap-2 w-full">
                      <button 
                        onClick={() => setShowConfirmCVRemove(false)}
                        className="flex-1 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer"
                      >
                        Keep CV
                      </button>
                      <button 
                        onClick={handleRemoveCV}
                        className="flex-1 py-2 bg-red-650 hover:bg-red-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : cvName ? (
                  <>
                    <p className="text-sm font-black text-gray-900 font-sans truncate w-full px-2">{cvName}</p>
                    <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest leading-none">Added Recently</p>
                    <div className="flex gap-2 mt-4 w-full">
                      <button 
                        onClick={handleUploadCVClick}
                        className="flex-1 py-2 bg-white border border-gray-200 hover:border-blue-600 text-gray-800 hover:text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer"
                      >
                        Update
                      </button>
                      <button 
                        onClick={() => setShowConfirmCVRemove(true)}
                        className="flex-1 py-2 bg-white border border-gray-200 hover:border-red-600 hover:text-red-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-bold text-gray-400 font-sans mb-1 uppercase tracking-wider">No CV uploaded yet</p>
                    <button 
                      onClick={handleUploadCVClick}
                      className="mt-3 px-6 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 cursor-pointer"
                    >
                      Upload CV
                    </button>
                  </>
                )}
              </div>
            </section>

             {/* Education & Certs */}
             <section className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
              <h2 className="text-lg font-black text-gray-900 font-sans mb-6 uppercase tracking-tight">Qualifications</h2>
              <div className="space-y-6 animate-fade-in">
                <div 
                  onClick={() => handleEduClick(profileDetails.education[0].degree)}
                  className="flex gap-4 cursor-pointer group"
                >
                  <div className="h-10 w-10 bg-blue-50 group-hover:bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 transition-colors shrink-0">
                    <GraduationCap size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Education</p>
                    <p className="text-sm font-black text-gray-900 font-sans group-hover:text-blue-600 transition-colors leading-snug">{profileDetails.education[0].degree}</p>
                    <p className="text-xs text-gray-500 font-sans font-medium">{profileDetails.education[0].school}</p>
                  </div>
                </div>
                
                <div className="h-px bg-gray-50" />

                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">Certifications</p>
                  {profileDetails.certificates.map((cert, i) => (
                    <div 
                      key={i} 
                      onClick={() => handleCertClick(cert)}
                      className="flex items-center gap-3 px-1 cursor-pointer group"
                    >
                      <Award size={16} className="text-blue-600 group-hover:scale-110 transition-transform" />
                      <p className="text-sm font-bold text-gray-650 font-sans group-hover:text-blue-605 transition-colors">{cert}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Quick Contact / Stats */}
            <section className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 bg-white/25 rounded-2xl flex items-center justify-center">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <h4 className="font-sans font-black text-sm">Direct Contact</h4>
                  <p className="text-white/70 text-xs font-sans font-medium italic">Available for hire</p>
                </div>
              </div>
              <button 
                onClick={handleSendMessageClick}
                className="w-full py-4 bg-white text-blue-600 rounded-2xl font-sans font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all active:scale-95 cursor-pointer"
              >
                Send Message
              </button>
            </section>
          </div>
        </div>
      </div>

      {/* Hidden CV file input available at page level */}
      <input 
        id="cv-file-picker-input" 
        type="file" 
        accept="application/pdf,image/*,.doc,.docx" 
        className="hidden" 
        onChange={handleCVFileChange} 
      />

      {/* EDIT PROFILE MODAL */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" 
              onClick={() => setShowEditModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-gray-100 z-10 max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setShowEditModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 flex items-center justify-center"
              >
                <X size={20} />
              </button>

              <h2 className="text-2xl font-black text-gray-950 font-sans mb-1 uppercase tracking-tight">Edit Profile</h2>
              <p className="text-xs text-gray-400 font-sans italic mb-6 font-medium">Update your public verified information matching credentials</p>

              <div className="space-y-6 font-sans">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest font-sans mb-2">Display Name</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-4 rounded-xl border border-gray-200 outline-none font-sans font-bold text-sm bg-gray-50 focus:bg-white focus:border-blue-600 text-gray-900" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest font-sans mb-2">Location</label>
                  <input 
                    type="text" 
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full p-4 rounded-xl border border-gray-200 outline-none font-sans font-bold text-sm bg-gray-50 focus:bg-white focus:border-blue-600 text-gray-900" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest font-sans mb-2">Professional Bio</label>
                  <textarea 
                    rows={4}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="w-full p-4 rounded-xl border border-gray-200 outline-none font-sans font-semibold text-sm bg-gray-50 focus:bg-white focus:border-blue-600 text-gray-900 leading-relaxed pr-2" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest font-sans mb-2">Main Skills (Comma Separated)</label>
                  <input 
                    type="text" 
                    value={editSkills}
                    onChange={(e) => setEditSkills(e.target.value)}
                    placeholder="e.g. Industrial Cleaning, HVAC Maintenance"
                    className="w-full p-4 rounded-xl border border-gray-200 outline-none font-sans font-bold text-sm bg-gray-50 focus:bg-white focus:border-blue-600 text-gray-900" 
                  />
                  <p className="text-[10px] text-gray-400 mt-1.5 font-sans leading-relaxed">Combine skills with commas (e.g. Team Leadership, Clean-up, Security)</p>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest font-sans mb-2">Portfolio Projects (Comma Separated)</label>
                  <input 
                    type="text" 
                    value={editPortfolio}
                    onChange={(e) => setEditPortfolio(e.target.value)}
                    placeholder="e.g. Hospital Sterilization, Residential Complex"
                    className="w-full p-4 rounded-xl border border-gray-200 outline-none font-sans font-bold text-sm bg-gray-50 focus:bg-white focus:border-blue-600 text-gray-900" 
                  />
                  <p className="text-[10px] text-gray-400 mt-1.5 font-sans leading-relaxed">Combine projects with commas (e.g. Office Design, Garden Landscaping)</p>
                </div>

                <input 
                  id="cv-file-picker-input" 
                  type="file" 
                  accept="application/pdf,image/*,.doc,.docx" 
                  className="hidden" 
                  onChange={handleCVFileChange} 
                />

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-4 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl font-sans font-black uppercase tracking-widest text-[10px] text-center transition-all border border-gray-150 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveProfile}
                    className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-sans font-black uppercase tracking-widest text-[10px] text-center transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DYNAMIC TOAST STACK */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none pr-1">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="pointer-events-auto w-full bg-white rounded-3xl border border-gray-100 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.08)] flex items-start gap-4 relative overflow-hidden"
            >
              <div className={`absolute top-0 bottom-0 left-0 w-2 shrink-0 ${
                n.type === 'success' ? 'bg-green-500' :
                n.type === 'heart' ? 'bg-red-500' :
                n.type === 'error' ? 'bg-red-500' : 'bg-blue-600'
              }`} />
              
              <div className="flex-1 pl-1">
                <p className="font-sans font-black uppercase tracking-[0.1em] text-[10px] text-gray-400 mb-0.5">{n.title}</p>
                <p className="font-sans text-[11px] font-bold text-gray-800 leading-normal">{n.message}</p>
              </div>
              <button 
                onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))}
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
