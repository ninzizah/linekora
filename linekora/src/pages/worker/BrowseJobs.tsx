import { useState } from 'react';
import { 
  Search, Filter, MapPin, DollarSign, Clock, 
  CheckCircle2, ChevronRight, Bookmark, AlertCircle, Briefcase, 
  Lock, ArrowRight, X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'motion/react';

export default function BrowseJobs() {
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [hasActiveApplication, setHasActiveApplication] = useState(true); // Simulate they already applied
  const [showLimitModal, setShowLimitModal] = useState(false);

  const getLimitMessage = () => {
    if (profile?.tier === 'Verified Bronze') return "Verified Bronze accounts are limited to 5 active applications.";
    if (profile?.tier === 'Silver Verified') return ""; // No limit
    return "Free accounts are limited to 1 active application.";
  };

  const handleApply = () => {
    const isAtLimit = 
      (!profile?.role_data?.tier && hasActiveApplication) || 
      (profile?.tier === 'Verified Bronze' && false); // Simplified
    
    if (isAtLimit && profile?.tier !== 'Silver Verified') {
      setShowLimitModal(true);
    } else {
      // Proceed with application
    }
  };

  const [jobs, setJobs] = useState<any[]>(() => {
    const hardcoded = [
      { id: 1, title: 'Professional Nanny', company: 'The Musoke Family', location: 'Kampala', salary: 'RWF 150k/mo', type: 'Full-time', verified: true, postedAt: '2h ago', category: 'Domestic' },
      { id: 2, title: 'Lead Plumber', company: 'FlowRight Plumbing', location: 'Entebbe', salary: 'RWF 20k/day', type: 'Contract', verified: true, postedAt: '5h ago', category: 'Mechanic' },
      { id: 3, title: 'Security Guard', company: 'SafeGuard International', location: 'Mukono', salary: 'RWF 120k/mo', type: 'Full-time', verified: true, postedAt: '1d ago', category: 'Security' },
      { id: 4, title: 'Delivery Rider', company: 'QuickDrop Logistics', location: 'Kampala', salary: 'RWF 5k/trip', type: 'On-demand', verified: false, postedAt: '3h ago', category: 'Delivery' },
      { id: 5, title: 'IT Support Intern', company: 'Digital Innovations', location: 'Kira', salary: 'Stipend', type: 'Part-time', verified: true, postedAt: '4h ago', category: 'IT / Tech' },
    ];

    const localUrgent = localStorage.getItem('urgent_jobs');
    const urgentList = localUrgent ? JSON.parse(localUrgent) : [];

    const localAll = localStorage.getItem('all_jobs');
    const generalList = localAll ? JSON.parse(localAll) : [];

    return [...urgentList, ...generalList, ...hardcoded];
  });

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 lg:flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-gray-900 font-sans tracking-tight">Marketplace</h1>
            <p className="text-gray-500 font-sans font-medium mt-1">Discover thousands of verified opportunities near you.</p>
          </div>
          {hasActiveApplication && profile?.tier !== 'Silver Verified' && (
            <div className="mt-4 lg:mt-0 flex items-center gap-3 bg-yellow-50 border border-yellow-100 p-4 rounded-2xl">
              <AlertCircle size={20} className="text-yellow-600" />
              <p className="text-xs font-bold text-yellow-800 font-sans">
                {profile?.tier || 'Free Tier'}: {getLimitMessage()} <Link to="/dashboard/worker/verification" className="underline font-black">Upgrade to apply for more</Link>
              </p>
            </div>
          )}
        </header>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search by job title, skill or keyword..." 
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-gray-100 shadow-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none font-sans font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-8 py-4 rounded-2xl border-2 font-sans font-bold transition-all ${
              showFilters ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-900 border-gray-100 hover:border-blue-600'
            }`}
          >
            <Filter size={20} />
            Filters
          </button>
        </div>

        {showFilters && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm"
          >
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest font-sans mb-3">District</label>
              <select className="w-full p-3 rounded-xl border border-gray-100 font-sans font-bold text-sm outline-none focus:border-blue-600">
                <option>All Locations</option>
                <option>Kampala</option>
                <option>Entebbe</option>
                <option>Mukono</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest font-sans mb-3">Category</label>
              <select className="w-full p-3 rounded-xl border border-gray-100 font-sans font-bold text-sm outline-none focus:border-blue-600">
                <option>All Categories</option>
                <option>Domestic</option>
                <option>Construction</option>
                <option>Security</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest font-sans mb-3">Job Type</label>
              <div className="flex flex-wrap gap-2">
                {['Full-time', 'Part-time', 'Contract'].map(t => (
                  <button key={t} className="px-3 py-1.5 rounded-lg border border-gray-100 text-xs font-bold font-sans hover:border-blue-600">{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest font-sans mb-3">Verification</label>
              <div className="flex items-center gap-2 mt-1">
                <input type="checkbox" id="verified-only" className="h-5 w-5 rounded-md border-gray-300 text-blue-600" />
                <label htmlFor="verified-only" className="text-sm font-bold text-gray-600 font-sans">Verified only</label>
              </div>
            </div>
          </motion.div>
        )}

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 gap-6">
          {jobs.map((job, i) => (
            <motion.div 
              key={job.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-100 transition-all cursor-pointer"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex gap-6">
                  <div className="h-20 w-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <Briefcase size={32} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-black text-gray-900 font-sans tracking-tight">{job.title}</h3>
                      {job.urgent && (
                        <div className="flex items-center gap-1 bg-red-50 text-red-600 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-red-100 animate-pulse">
                          <span>🚨 Urgent Task</span>
                        </div>
                      )}
                      {job.verified && (
                        <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest">
                          <CheckCircle2 size={10} />
                          Verified
                        </div>
                      )}
                    </div>
                    <p className="text-gray-500 font-sans font-bold italic mb-4">{job.company}</p>
                    
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 font-sans uppercase tracking-wider">
                        <MapPin size={14} className="text-gray-300" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 font-sans uppercase tracking-wider">
                        <DollarSign size={14} className="text-gray-300" />
                        {job.salary}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 font-sans uppercase tracking-wider">
                        <Clock size={14} className="text-gray-300" />
                        {job.postedAt}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 md:flex-col md:items-end">
                  <button 
                    onClick={handleApply}
                    className="flex-1 md:flex-none px-8 py-3.5 bg-gray-900 text-white rounded-2xl font-sans font-bold hover:bg-black transition-all"
                  >
                    Quick Apply
                  </button>
                  <div className="flex gap-2">
                    <button className="p-3.5 rounded-xl border border-gray-100 text-gray-400 hover:text-blue-600 hover:border-blue-100 transition-all">
                      <Bookmark size={20} />
                    </button>
                    <button className="p-3.5 rounded-xl border border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-100 transition-all">
                      <AlertCircle size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Limit Modal */}
        <AnimatePresence>
          {showLimitModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowLimitModal(false)}
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-[3rem] p-10 shadow-2xl border border-gray-100"
              >
                <div className="h-20 w-20 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mb-8 mx-auto">
                  <Lock size={40} />
                </div>
                <h2 className="text-2xl font-black text-gray-900 text-center font-sans tracking-tight mb-4 uppercase">
                  Application Limit Reached
                </h2>
                <p className="text-gray-500 text-center font-sans font-medium mb-8 leading-relaxed italic">
                  "{getLimitMessage()}"
                </p>
                
                <div className="space-y-4">
                  <Link 
                    to="/dashboard/worker/verification"
                    className="w-full flex items-center justify-between px-6 py-4 bg-blue-600 text-white rounded-2xl font-sans font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-200"
                  >
                    Upgrade Now
                    <ArrowRight size={18} />
                  </Link>
                  <button 
                    onClick={() => setShowLimitModal(false)}
                    className="w-full py-4 text-gray-400 font-sans font-bold text-sm uppercase tracking-widest hover:text-gray-900"
                  >
                    Maybe Later
                  </button>
                </div>

                <button 
                  onClick={() => setShowLimitModal(false)}
                  className="absolute top-6 right-6 text-gray-300 hover:text-gray-900 transition-colors"
                >
                  <X size={24} />
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
