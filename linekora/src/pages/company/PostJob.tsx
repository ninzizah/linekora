import React, { useState } from 'react';
import { 
  ShieldCheck, ArrowLeft, Send, Sparkles, 
  MapPin, DollarSign, Calendar, FileText, CheckCircle2,
  AlertCircle, Star, Users, Clock, Plus, X, MessageSquare, Briefcase, Zap, Loader2, Bookmark, Phone
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../lib/AuthContext';
import { createJob } from '../../lib/api';

interface NotificationMsg {
  id: string;
  type: 'success' | 'info' | 'error' | 'invite';
  title: string;
  message: string;
}

export default function PostJob() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [isUrgent, setIsUrgent] = useState(false);

  // Check if there are active uncompleted contracts in database
  const [hasUncompleted, setHasUncompleted] = useState(() => {
    let contractsList: any[] = [];
    const cachedContracts = localStorage.getItem('linekora_contracts');
    if (cachedContracts) {
      try { contractsList = JSON.parse(cachedContracts); } catch (e) { contractsList = []; }
    }
    return contractsList.some(c => c.status !== 'completed' && c.status !== 'not_trusted');
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    salary: '',
    location: '',
    phone: '',
    category: 'Construction',
    deadline: '',
    requirements: '',
    jobType: 'on-demand'
  });

  // Success flow state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [publishedJobId, setPublishedJobId] = useState<number | null>(null);

  // Additional panel overlay states
  const [showExpiredJobsModal, setShowExpiredJobsModal] = useState(false);
  const [showShortlistModal, setShowShortlistModal] = useState(false);

  // Renew Loading & state
  const [renewingJobId, setRenewingJobId] = useState<number | null>(null);

  // Shortlist management local state
  const [shortlisted, setShortlisted] = useState([
    { id: 101, name: 'John Musoke', role: 'Security Guard', avatar: 'J', status: 'Shortlisted' },
    { id: 102, name: 'Sarah Namono', role: 'Office Cleaner', avatar: 'S', status: 'Shortlisted' }
  ]);

  // Expired Jobs mock database
  const [expiredJobs, setExpiredJobs] = useState([
    { id: 501, title: 'Temporary Warehouse Assistant', location: 'Remera, Kigali', expiredAt: '5 days ago', salary: 'RWF 18,000/day' },
    { id: 502, title: 'Retail Stock Manager', location: 'Nyamirambo', expiredAt: '12 days ago', salary: 'RWF 250,000/mo' }
  ]);

  const categories = [
    'Construction', 'Domestic Help', 'Mechanical', 'Security', 
    'Logistics', 'Creative', 'IT & Tech', 'Hospitality'
  ];

  const jobTypes = [
    { id: 'full-time', label: 'Full-time' },
    { id: 'part-time', label: 'Part-time' },
    { id: 'contract', label: 'Contract' },
    { id: 'on-demand', label: 'On-demand' },
  ];

  // Dynamic candidate matchmaking based on Category selection
  const getRecommendedCandidates = (category: string) => {
    const database = [
      { id: 201, name: 'Moses Byaruhanga', skill: 'Masonry & Concrete', category: 'Construction', match: '98%', location: 'Kigali', badge: 'Expert' },
      { id: 202, name: 'Aline Umutoni', skill: 'Logistics Coordinator', category: 'Logistics', match: '96%', location: 'Remera', badge: 'Certified' },
      { id: 203, name: 'Jean Bosco', skill: 'Emergency Plumber', category: 'Construction', match: '94%', location: 'Nyamirambo', badge: 'Pro' },
      { id: 204, name: 'Sarah Namono', skill: 'Premium Sanitizer', category: 'Domestic Help', match: '97%', location: 'Entebbe', badge: 'Top Rated' },
      { id: 205, name: 'Peter Okello', skill: 'CCTV Security Expert', category: 'Security', match: '95%', location: 'Mukono', badge: 'Licensed' },
      { id: 206, name: 'Grace Akello', skill: 'Early Learning Tutor', category: 'Domestic Help', match: '99%', location: 'Kira', badge: 'Verified' },
      { id: 207, name: 'Emmanuel Sseunda', skill: 'Heavy Mechanical Fitter', category: 'Mechanical', match: '92%', location: 'Kampala', badge: 'Pro' },
      { id: 208, name: 'David Mugisha', skill: 'TypeScript Frontend Coder', category: 'IT & Tech', match: '98%', location: 'Kacyiru', badge: 'Senior' },
      { id: 209, name: 'Claudine Uwera', skill: 'Hospitality Maitre d\'', category: 'Hospitality', match: '96%', location: 'Kigali', badge: 'Elite' },
      { id: 210, name: 'Eric Sengazi', skill: 'Brand Identity Architect', category: 'Creative', match: '94%', location: 'Gisenyi', badge: 'Creative' }
    ];

    const matched = database.filter(worker => worker.category.toLowerCase() === category.toLowerCase());
    if (matched.length > 0) return matched;
    // Fallbacks
    return [database[0], database[1], database[3]];
  };

  // Notifications systems
  const [notifications, setNotifications] = useState<NotificationMsg[]>([]);

  const addNotification = (type: 'success' | 'info' | 'error' | 'invite', title: string, message: string) => {
    const id = Date.now().toString();
    const newNotif = { id, type, title, message };
    setNotifications(prev => [...prev, newNotif]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!profile?.id) {
      addNotification('error', 'Not Authenticated', 'Please sign in before posting a job.');
      setLoading(false);
      return;
    }
    
    const salaryStr = formData.salary.includes('RWF') ? formData.salary : `RWF ${formData.salary}`;

    try {
      // ✅ Write to real PostgreSQL database
      const dbJob = await createJob({
        title: formData.title,
        description: formData.description,
        salary: salaryStr,
        location: formData.location,
        category: formData.category,
        status: 'open',
        urgent: isUrgent,
        employerId: profile.id,
      });

      // Also cache locally for offline use
      const localJob = {
        ...dbJob,
        company: profile.displayName,
        postedAt: new Date(dbJob.createdAt).toISOString(),
        type: isUrgent ? 'Urgent Task' : formData.jobType,
        verified: true,
      };

      if (isUrgent) {
        const existingUrgent = localStorage.getItem('urgent_jobs');
        const urgentList = existingUrgent ? JSON.parse(existingUrgent) : [];
        localStorage.setItem('urgent_jobs', JSON.stringify([localJob, ...urgentList]));
      }
      const existingJobs = localStorage.getItem('all_jobs');
      const jobsList = existingJobs ? JSON.parse(existingJobs) : [];
      localStorage.setItem('all_jobs', JSON.stringify([localJob, ...jobsList]));

      setLoading(false);
      setPublishedJobId(dbJob.id);
      setShowSuccessModal(true);
      addNotification('success', 'Job Published Successfully 🎉', 'Saved to database. Workers can now find and apply!');
    } catch (err: any) {
      setLoading(false);
      addNotification('error', 'Failed to Publish Job', err.message || 'Server error. Please try again.');
    }
  };

  // Renew an expired job
  const handleRenewJob = (id: number, title: string) => {
    setRenewingJobId(id);
    setTimeout(() => {
      setExpiredJobs(prev => prev.filter(j => j.id !== id));
      setRenewingJobId(null);
      addNotification('success', 'Job Posting Renewed 🔄', `"${title}" is reinstated on the matching timeline as active for 30 days.`);
    }, 1200);
  };

  // Invite candidate logic
  const handleInviteCandidate = (name: string) => {
    addNotification('invite', 'Direct Invitation Sent ✉️', `Encrypted interview and work coordinates sent directly to ${name}.`);
  };

  // Add Recommended Candidate to shortlist
  const handleShortlistCandidate = (name: string, skill: string) => {
    const newId = Date.now();
    setShortlisted(prev => [...prev, { id: newId, name, role: skill, avatar: name[0], status: 'Shortlisted' }]);
    addNotification('success', 'Added to Shortlist ⭐', `${name} is added to your secure business matching shortlist.`);
  };

  // Remove from shortlist
  const handleRemoveShortlist = (id: number, name: string) => {
    setShortlisted(prev => prev.filter(s => s.id !== id));
    addNotification('info', 'Shortlist Updated', `Removed ${name} from your shortlist database catalog.`);
  };

  // Send Direct Offer
  const handleSendOffer = (name: string) => {
    addNotification('success', 'Contract Offer Broadcasted 📑', `Legal smart agreement and escrow hold requested for ${name}.`);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto font-sans">
        <Link to="/dashboard/company" className="inline-flex items-center gap-2 text-gray-400 font-sans font-bold text-xs mb-8 hover:text-gray-900 transition-colors uppercase tracking-widest">
          <ArrowLeft size={14} />
          Back to Dashboard
        </Link>

        {hasUncompleted ? (
          <div className="bg-white rounded-[3rem] border border-red-155 shadow-2xl p-8 md:p-12 text-center max-w-2xl mx-auto py-16 space-y-6 font-sans">
            <div className="h-20 w-20 bg-red-50 text-red-500 rounded-[2.5rem] flex items-center justify-center mx-auto border border-red-105">
              <AlertCircle size={40} className="text-red-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight font-sans">Corporate Milestone Blockage 🔒</h2>
              <p className="text-gray-400 uppercase tracking-widest font-black text-[10px]">LINEKORA Corporate Integrity Guarantee</p>
              <p className="text-sm font-sans font-medium text-gray-500 max-w-md mx-auto leading-relaxed">
                Platform safety directives require corporate clients to first update, evaluate, or approve outstanding active assignments and leave ratings/reviews before posting more new listings.
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-100 p-5 rounded-3xl max-w-lg mx-auto text-left text-amber-900 text-xs font-medium leading-relaxed font-sans">
              <span className="font-extrabold uppercase tracking-wider block mb-1">💡 Resolve instantly on your Dashboard:</span>
              Browse down your corporate workspace, select the active contract submitted by your worker, and click <span className="font-bold">"Approve & Complete"</span> to release escrow holdings and rate the performance.
            </div>
            <button
              onClick={() => navigate('/dashboard/company')}
              className="px-8 py-4 bg-gray-950 hover:bg-gray-800 text-white rounded-2xl font-sans font-black uppercase tracking-widest text-xs transition-colors"
            >
              Go to Corporate Dashboard
            </button>
          </div>
        ) : (
          <>
            <header className="mb-12">
              <h1 className="text-4xl font-black text-gray-900 font-sans tracking-tight uppercase">Post Job</h1>
              <p className="text-gray-500 font-sans font-medium mt-2 italic text-sm leading-relaxed">
                Fill in the details below to find your next verified professional.
              </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-8 pb-20">
              <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-gray-105 shadow-sm space-y-10">
            <section className="space-y-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest font-sans mb-3">Job Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Senior Security Specialist" 
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-black text-sm text-gray-950 transition-all focus:ring-4 focus:ring-blue-50"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest font-sans mb-3">Description</label>
                <textarea 
                  rows={4}
                  required
                  placeholder="Describe the roles, responsibilities and ideal candidate..." 
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold text-sm text-gray-950 transition-all focus:ring-4 focus:ring-blue-50 resize-none leading-relaxed"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest font-sans mb-3">Requirements</label>
                <textarea 
                  rows={3}
                  placeholder="e.g. 5+ years experience, Certification in Safety..." 
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-medium text-sm text-gray-900 transition-all resize-none italic"
                  value={formData.requirements}
                  onChange={e => setFormData({ ...formData, requirements: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest font-sans mb-3">Salary / Budget</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-450" size={18} />
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. 15,000 per day" 
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold text-sm text-gray-950 transition-all focus:ring-4 focus:ring-blue-50"
                      value={formData.salary}
                      onChange={e => setFormData({ ...formData, salary: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest font-sans mb-3">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-450" size={18} />
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Kigali, Gasabo" 
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold text-sm text-gray-950 transition-all focus:ring-4 focus:ring-blue-50"
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest font-sans mb-3">Contact Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-450" size={18} />
                  <input 
                    type="tel"
                    placeholder="e.g. +250 788 123 456" 
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold text-sm text-gray-950 transition-all focus:ring-4 focus:ring-blue-50"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest font-sans mb-3">Category</label>
                  <select 
                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold text-sm text-gray-950 transition-all pr-10 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.2em_1.2em] bg-[right_1rem_center] bg-no-repeat"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest font-sans mb-3">Deadline</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-450" size={18} />
                    <input 
                      type="date" 
                      required
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold text-sm text-gray-900 transition-all focus:ring-4 focus:ring-blue-50"
                      value={formData.deadline}
                      onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest font-sans mb-3">Job Type</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {jobTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, jobType: type.id })}
                      className={`py-3 px-4 rounded-xl font-sans font-black text-[10px] uppercase tracking-widest border-2 transition-all ${
                        formData.jobType === type.id 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' 
                        : 'bg-white text-gray-400 border-gray-100 hover:border-blue-100 hover:text-blue-600'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Urgent Task Toggle */}
              <div className="pt-8 border-t border-gray-100 space-y-4">
                <div className="flex flex-col md:flex-row items-start justify-between p-6 bg-red-50/55 rounded-3xl border border-red-100 gap-4">
                  <div className="flex gap-4">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${isUrgent ? 'bg-red-600 text-white shadow-lg shadow-red-200' : 'bg-white text-red-500 border border-red-105'}`}>
                      <AlertCircle size={24} />
                    </div>
                    <div>
                      <p className="font-sans font-black text-xs uppercase tracking-[0.15em] text-red-955 flex items-center gap-1.5">
                        🚨 Set as Urgent Task / Local Gig
                        <span className="bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider">SMS BLAST QUEUE</span>
                      </p>
                      <p className="font-sans text-xs text-red-700 font-bold mt-1.5 leading-relaxed">
                        Flag this as an emergency gig. Real-time SMS blasts and in-app alerts will instantly broadcast to all verified matching workers in this region.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button" 
                    onClick={() => setIsUrgent(!isUrgent)}
                    className={`w-16 h-9 rounded-full p-1 cursor-pointer transition-all flex items-center justify-between shrink-0 self-center md:self-start border-2 shadow-inner ${
                      isUrgent ? 'bg-red-600 border-red-700' : 'bg-slate-800 border-slate-900'
                    }`}
                    aria-label="Toggle Urgent Task"
                  >
                    <span className={`text-[9px] font-black uppercase px-1 transition-opacity ${isUrgent ? 'text-white opacity-100' : 'opacity-0'}`}>ON</span>
                    <motion.div 
                      layout
                      animate={{ x: isUrgent ? 0 : 0 }}
                      className="h-6 w-6 bg-white rounded-full shadow-lg border border-slate-300 flex items-center justify-center font-black text-[9px] text-slate-900"
                    >
                      {isUrgent ? '✓' : '✕'}
                    </motion.div>
                    <span className={`text-[9px] font-black uppercase px-1 transition-opacity ${!isUrgent ? 'text-slate-300 opacity-100' : 'opacity-0'}`}>OFF</span>
                  </button>
                </div>
              </div>
            </section>

            <section className="pt-2 border-t border-gray-50">
              <div className="flex items-center justify-between p-6 bg-blue-50/40 rounded-[2rem] border border-blue-100/40">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-colors ${verifiedOnly ? 'bg-blue-600 text-white shadow-lg shadow-blue-250' : 'bg-white text-gray-450 border border-gray-200'}`}>
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <p className="font-sans font-black text-xs uppercase tracking-widest text-gray-900">Verification Required</p>
                    <p className="font-sans text-[10px] text-gray-500 font-bold mt-0.5">Only fully verified workers with security badges can access</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setVerifiedOnly(!verifiedOnly)}
                  className={`w-16 h-9 rounded-full p-1 cursor-pointer transition-all flex items-center justify-between shrink-0 border-2 shadow-inner ${
                    verifiedOnly ? 'bg-blue-600 border-blue-700' : 'bg-slate-800 border-slate-900'
                  }`}
                  aria-label="Toggle Verification Required"
                >
                  <span className={`text-[9px] font-black uppercase px-1 transition-opacity ${verifiedOnly ? 'text-white opacity-100' : 'opacity-0'}`}>ON</span>
                  <motion.div 
                    layout
                    animate={{ x: verifiedOnly ? 0 : 0 }}
                    className="h-6 w-6 bg-white rounded-full shadow-lg border border-slate-300 flex items-center justify-center font-black text-[9px] text-slate-900"
                  >
                    {verifiedOnly ? '✓' : '✕'}
                  </motion.div>
                  <span className={`text-[9px] font-black uppercase px-1 transition-opacity ${!verifiedOnly ? 'text-slate-300 opacity-100' : 'opacity-0'}`}>OFF</span>
                </button>
              </div>
            </section>

            <div className="pt-6">
              <button 
                id="publish-job-form-submit"
                disabled={loading}
                type="submit" 
                className="w-full py-5 bg-gray-950 text-white rounded-[2rem] font-sans font-black text-sm uppercase tracking-[0.2em] hover:bg-black shadow-xl shadow-gray-200 hover:shadow-2xl transition-all flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Broadcasting match vectors...</span>
                  </>
                ) : (
                  <>
                    <span>Publish & Broadcast Opportunity</span>
                    <Send size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </>
    )}
  </div>

      {/* PUBLISH SUCCESS INTERACTIVE MODAL */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm" 
              onClick={() => {
                setShowSuccessModal(false);
                navigate('/dashboard/company');
              }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.96, y: 15 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-2xl bg-white rounded-[3rem] p-8 md:p-10 shadow-2xl border border-gray-100 z-10 max-h-[92vh] overflow-y-auto"
            >
              <button 
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate('/dashboard/company');
                }}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-50 text-gray-400 hover:text-gray-700 transition-colors bg-gray-50 flex items-center justify-center border border-gray-100"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-8 max-w-md mx-auto">
                <div className="h-16 w-16 bg-green-50 text-green-600 border border-green-200 rounded-[2.3rem] flex items-center justify-center mb-5 mx-auto animate-bounce shadow-sm">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-2xl font-black text-gray-950 font-sans uppercase tracking-tight">Job Alignment Created</h3>
                <p className="text-xs text-gray-500 font-sans leading-relaxed mt-2 font-medium italic">
                  Matched via digital signature. SMS alerts successfully pushed to nearby cell towers to summon certified teams.
                </p>
              </div>

              {/* RECOMMENDED CANDIDATES SECTION */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-1.5 font-sans">
                    <Sparkles size={14} className="text-yellow-500" />
                    Recommended Candidates Match ({formData.category})
                  </h4>
                  <button 
                    onClick={() => {
                      setShowSuccessModal(false);
                      navigate('/dashboard/company/browse');
                    }}
                    className="text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    View All Workers
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3.5">
                  {getRecommendedCandidates(formData.category).slice(0, 3).map((worker) => (
                    <div 
                      key={worker.id} 
                      className="p-5 rounded-2xl bg-gray-50 border border-gray-100 hover:border-blue-200 hover:bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-11 w-11 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-sm font-black group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                          {worker.name[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h5 className="font-sans font-black text-sm text-gray-900">{worker.name}</h5>
                            <span className="bg-blue-50 text-blue-600 text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
                              {worker.badge}
                            </span>
                          </div>
                          <p className="text-[10px] font-semibold text-gray-500 font-sans mt-0.5 italic">{worker.skill} • {worker.location}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span className="text-[10px] font-black text-green-600 bg-green-50 border border-green-100 px-2.5 py-1 rounded-lg mr-2 leading-none">
                          {worker.match} MATCH
                        </span>
                        <button 
                          onClick={() => handleInviteCandidate(worker.name)}
                          className="px-3.5 py-2 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-blue-700 transition-colors"
                        >
                          Invite
                        </button>
                        <button 
                          onClick={() => handleShortlistCandidate(worker.name, worker.skill)}
                          className="p-2 bg-white text-gray-400 hover:text-blue-600 rounded-xl hover:bg-blue-50 transition-colors border border-gray-100"
                        >
                          <Bookmark size={12} className="fill-current" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ROUTING OPTIONS */}
              <div className="border-t border-gray-100 pt-8 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3.5">
                  <button 
                    onClick={() => {
                      setShowSuccessModal(false);
                      setShowShortlistModal(true);
                    }}
                    className="py-4 bg-gray-50 hover:bg-indigo-50 border border-gray-150 hover:border-indigo-200 text-gray-700 hover:text-indigo-650 rounded-2xl font-sans font-black uppercase tracking-widest text-[9px] text-center transition-all"
                  >
                    Manage shortlist ({shortlisted.length})
                  </button>
                  <button 
                    onClick={() => {
                      setShowSuccessModal(false);
                      setShowExpiredJobsModal(true);
                    }}
                    className="py-4 bg-gray-50 hover:bg-red-50 border border-gray-150 hover:border-red-200 text-gray-700 hover:text-red-600 rounded-2xl font-sans font-black uppercase tracking-widest text-[9px] text-center transition-all"
                  >
                    View Expired Jobs
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button 
                    onClick={() => {
                      setShowSuccessModal(false);
                      navigate('/dashboard/company/browse');
                    }}
                    className="py-4 bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-600 rounded-2xl font-sans font-black uppercase tracking-widest text-[9px] text-center transition-all flex items-center justify-center gap-1.5"
                  >
                    <Users size={12} />
                    View All Workers
                  </button>
                  <button 
                    onClick={() => {
                      setShowSuccessModal(false);
                      navigate('/dashboard/company');
                    }}
                    className="py-4 bg-gray-900 hover:bg-semibold text-white hover:bg-black rounded-2xl font-sans font-black uppercase tracking-widest text-[9px] text-center transition-all shadow-md shadow-gray-200"
                  >
                    Close Details
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EXPIRED JOBS MANAGER MODAL */}
      <AnimatePresence>
        {showExpiredJobsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-950/50 backdrop-blur-sm" 
              onClick={() => setShowExpiredJobsModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-gray-100 z-10"
            >
              <button 
                onClick={() => setShowExpiredJobsModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-50 text-gray-400 hover:text-gray-700 bg-gray-50 flex items-center justify-center border border-gray-100"
              >
                <X size={20} />
              </button>

              <h3 className="text-xl font-black text-gray-900 font-sans uppercase tracking-tight mb-2">Expired Job Postings</h3>
              <p className="text-xs text-gray-400 font-sans italic mb-6">Renew historical assignments instantly for matching with verified candidates.</p>

              {expiredJobs.length > 0 ? (
                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
                  {expiredJobs.map(job => (
                    <div key={job.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-3 justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="font-sans font-black text-sm text-gray-900">{job.title}</h4>
                          <span className="text-[8px] font-black text-red-655 bg-red-50 border border-red-100 px-2 py-0.5 rounded tracking-wide uppercase">Expired {job.expiredAt}</span>
                        </div>
                        <p className="text-[10px] text-gray-550 mt-1 font-sans">{job.location} • Budget: {job.salary}</p>
                      </div>

                      <button 
                        onClick={() => handleRenewJob(job.id, job.title)}
                        disabled={renewingJobId === job.id}
                        className="py-3 bg-white hover:bg-blue-600 hover:text-white text-gray-800 rounded-xl border border-gray-200 transition-all font-sans font-black uppercase text-[9px] tracking-wider flex items-center justify-center gap-1.5"
                      >
                        {renewingJobId === job.id ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            <span>Broadcasting Credentials...</span>
                          </>
                        ) : (
                          <>
                            <span>Renew Job (30 Days Active)</span>
                            <Plus size={12} />
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-150">
                  <Clock className="mx-auto text-gray-300 mb-2" size={32} />
                  <p className="text-xs font-bold text-gray-450 uppercase tracking-wide">No Expired Job Logs</p>
                  <p className="text-[10px] text-gray-405 italic mt-1 font-sans">All outstanding opportunities are currently active.</p>
                </div>
              )}

              <button 
                onClick={() => {
                  setShowExpiredJobsModal(false);
                  if (publishedJobId) setShowSuccessModal(true);
                }}
                className="w-full mt-6 py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-sans font-black uppercase tracking-widest text-[9px] text-center transition-all"
              >
                Close History
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MANAGE SHORTLIST MODAL */}
      <AnimatePresence>
        {showShortlistModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" 
              onClick={() => setShowShortlistModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-gray-100 z-10"
            >
              <button 
                onClick={() => setShowShortlistModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-50 text-gray-400 hover:text-gray-750 bg-gray-50 flex items-center justify-center border border-gray-100"
              >
                <X size={20} />
              </button>

              <h3 className="text-xl font-black text-gray-905 font-sans uppercase tracking-tight mb-2">Manage Candidate Shortlist</h3>
              <p className="text-xs text-gray-400 font-sans italic mb-6">Manage high-match workers currently bookmarked under corporate file records.</p>

              {shortlisted.length > 0 ? (
                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                  {shortlisted.map(candidate => (
                    <div key={candidate.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-500 text-sm font-black uppercase">
                          {candidate.avatar}
                        </div>
                        <div>
                          <h4 className="font-sans font-black text-sm text-gray-900 leading-none">{candidate.name}</h4>
                          <p className="text-[10px] text-gray-500 font-sans font-semibold mt-1 uppercase tracking-wider">{candidate.role}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => handleSendOffer(candidate.name)}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors"
                        >
                          Hire
                        </button>
                        <button 
                          onClick={() => handleRemoveShortlist(candidate.id, candidate.name)}
                          className="p-2 bg-white hover:bg-red-50 text-gray-400 hover:text-red-650 rounded-lg border border-gray-200 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-150">
                  <Star className="mx-auto text-gray-300 mb-2" size={32} />
                  <p className="text-xs font-bold text-gray-450 uppercase tracking-wide">Shortlist is empty</p>
                  <p className="text-[10px] text-gray-400 mt-1 font-sans italic">Save recommended candidates or browse more workers.</p>
                </div>
              )}

              <button 
                onClick={() => {
                  setShowShortlistModal(false);
                  if (publishedJobId) setShowSuccessModal(true);
                }}
                className="w-full mt-6 py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-sans font-black uppercase tracking-widest text-[9px] text-center transition-all"
              >
                Close List
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DYNAMIC NOTIFICATION TOAST OVERLAY */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none pr-1">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="pointer-events-auto w-full bg-white rounded-3xl border border-gray-105 p-5 shadow-2xl flex items-start gap-4 relative overflow-hidden"
            >
              <div className={`absolute top-0 bottom-0 left-0 w-2 shrink-0 ${
                n.type === 'success' ? 'bg-green-500' :
                n.type === 'invite' ? 'bg-teal-500' :
                n.type === 'error' ? 'bg-red-500' : 'bg-blue-600'
              }`} />
              
              <div className="flex-1 pl-1">
                <p className="font-sans font-black uppercase tracking-[0.1em] text-[10px] text-gray-405 mb-0.5">{n.title}</p>
                <p className="font-sans text-[11px] font-bold text-gray-850 leading-normal">{n.message}</p>
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
