import React, { useState } from 'react';
import { 
  Users, Search, Filter, Star, 
  CheckCircle2, XCircle, MessageSquare, ChevronRight,
  Shield, MapPin, Info, X, Briefcase, Award
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'motion/react';

interface Applicant {
  id: number;
  name: string;
  job: string;
  location: string;
  trustScore: number;
  verified: boolean;
  lastActive: string;
  avatar: string;
  status: 'pending' | 'accepted' | 'rejected';
  phone: string;
  experience: string;
  bio: string;
  documentsMatched: boolean;
}

export default function CompanyApplicants() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);

  const [applicants, setApplicants] = useState<Applicant[]>(() => {
    const defaultApplicants: Applicant[] = [
      { 
        id: 1, 
        name: 'John Mweru', 
        job: 'Office Cleaner', 
        location: 'Kigali, Nyarugenge', 
        trustScore: 820, 
        verified: true,
        lastActive: '10m ago',
        avatar: 'JM',
        status: 'pending',
        phone: '+250 788 123 456',
        experience: '3 years at Kigali Business Center as lead facility cleaner.',
        bio: 'Dedicated and punctual sanitation professional. Trustworthy and comfortable working night shifts. Background check approved by RDB registry.',
        documentsMatched: true
      },
      { 
        id: 2, 
        name: 'Sarah Nakato', 
        job: 'Office Cleaner', 
        location: 'Kigali, Kimihurura', 
        trustScore: 750, 
        verified: true,
        lastActive: '1h ago',
        avatar: 'SN',
        status: 'accepted',
        phone: '+250 782 987 654',
        experience: '2 years working for private embassies.',
        bio: 'Professional cleaner and domestic organizer. Thorough attention to detail, eco-products certified, highly reliable.',
        documentsMatched: true
      },
      { 
        id: 3, 
        name: 'David Okello', 
        job: 'Security Guard', 
        location: 'Kigali, Remera', 
        trustScore: 680, 
        verified: false,
        lastActive: '2d ago',
        avatar: 'DO',
        status: 'rejected',
        phone: '+250 783 555 123',
        experience: '1 year as neighborhood watch guard.',
        bio: 'Committed to safety and active patrols. Seeking full-time warehouse guard role.',
        documentsMatched: false
      }
    ];

    const cached = localStorage.getItem('company_applicants');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return defaultApplicants;
      }
    }
    localStorage.setItem('company_applicants', JSON.stringify(defaultApplicants));
    return defaultApplicants;
  });

  const saveToStorage = (updated: Applicant[]) => {
    setApplicants(updated);
    localStorage.setItem('company_applicants', JSON.stringify(updated));
  };

  const handleStatusChange = (id: number, newStatus: 'accepted' | 'rejected') => {
    const updated = applicants.map(app => 
      app.id === id ? { ...app, status: newStatus } : app
    );
    saveToStorage(updated);
    if (selectedApplicant && selectedApplicant.id === id) {
      setSelectedApplicant({ ...selectedApplicant, status: newStatus });
    }
  };

  // Filter & Search Logic
  const filteredApplicants = applicants.filter(app => {
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesQuery = 
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.job.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-black text-gray-900 font-sans tracking-tight uppercase">Job Applicants</h1>
          <p className="text-gray-500 font-sans font-medium mt-1 italic">Review, view details, accept or reject talent for your open positions.</p>
        </header>

        {/* Filter Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200 shadow-sm overflow-x-auto scrollbar-none">
            {(['all', 'pending', 'accepted', 'rejected'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest font-sans transition-all shrink-0 ${
                  statusFilter === f 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="relative group flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, skill or job..." 
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-gray-150 shadow-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none font-sans text-sm font-bold"
            />
          </div>
        </div>

        {/* Applicants List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredApplicants.map((applicant) => (
              <motion.div 
                key={applicant.id} 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="h-16 w-16 bg-blue-100 rounded-[1.5rem] flex items-center justify-center text-blue-600 font-black font-sans text-xl">
                        {applicant.avatar}
                      </div>
                      {applicant.verified && (
                        <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-1 rounded-lg border-2 border-white">
                          <Shield size={10} fill="currentColor" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-black text-gray-900 font-sans tracking-tight">{applicant.name}</h3>
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-0.5 rounded-full">Score: {applicant.trustScore}</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                          applicant.status === 'accepted' ? 'bg-green-50 text-green-600 border-green-100' :
                          applicant.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                          'bg-yellow-50 text-yellow-600 border-yellow-105'
                        }`}>
                          {applicant.status}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-gray-500 font-sans flex items-center gap-2 mb-2">
                         Applied for <span className="text-gray-900 italic underline decoration-blue-600/30">{applicant.job}</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-gray-400">
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
                          <MapPin size={12} />
                          {applicant.location}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
                          <Star size={12} fill="currentColor" className="text-yellow-400 border-none" />
                          4.9 (24 reviews)
                        </div>
                        <div className="text-[10px] font-bold text-gray-400 italic">
                          Last active: {applicant.lastActive}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button 
                      onClick={() => setSelectedApplicant(applicant)}
                      className="px-5 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-sans font-black text-xs uppercase tracking-widest transition-all"
                    >
                      View Details
                    </button>
                    {applicant.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleStatusChange(applicant.id, 'rejected')}
                          className="p-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all"
                          title="Reject Application"
                        >
                          <XCircle size={18} />
                        </button>
                        <button 
                          onClick={() => handleStatusChange(applicant.id, 'accepted')}
                          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-sans font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
                        >
                          Hire Now
                          <ChevronRight size={16} />
                        </button>
                      </>
                    )}
                    {applicant.status === 'accepted' && (
                      <span className="text-green-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 bg-green-50 px-4 py-2 rounded-xl">
                        <CheckCircle2 size={12} /> Hired Successfully
                      </span>
                    )}
                    {applicant.status === 'rejected' && (
                      <span className="text-red-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 bg-red-50 px-4 py-2 rounded-xl">
                        <XCircle size={12} /> Rejected
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredApplicants.length === 0 && (
            <div className="bg-white rounded-[3rem] border border-dashed border-gray-200 py-16 text-center">
              <Users className="text-gray-300 mx-auto mb-4" size={36} />
              <p className="font-sans font-black text-gray-900 uppercase">No applicants found</p>
              <p className="text-gray-400 font-sans text-xs mt-1">Try resetting search parameters or checking other statuses.</p>
            </div>
          )}
        </div>
      </div>

      {/* Applicant Details Modal */}
      <AnimatePresence>
        {selectedApplicant && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[3rem] border border-gray-100 w-full max-w-xl p-8 relative shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <button 
                onClick={() => setSelectedApplicant(null)}
                className="absolute top-6 right-6 h-10 w-10 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 flex items-center justify-center transition-colors border border-gray-150"
              >
                <X size={20} />
              </button>

              <div className="flex items-start gap-4 mb-6">
                <div className="h-16 w-16 bg-blue-100 text-blue-600 font-sans font-black text-xl rounded-2xl flex items-center justify-center">
                  {selectedApplicant.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-black text-gray-950 font-sans uppercase tracking-tight">{selectedApplicant.name}</h3>
                    {selectedApplicant.verified && <Shield size={16} className="text-green-500" fill="currentColor" />}
                  </div>
                  <p className="text-xs font-black text-blue-600 uppercase tracking-widest font-sans mt-0.5">Trust Score: {selectedApplicant.trustScore}</p>
                </div>
              </div>

              <div className="space-y-6 mb-8 font-sans">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Applying For Position</p>
                  <p className="text-base font-bold text-gray-900 italic">"{selectedApplicant.job}"</p>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Award size={12} className="text-blue-500" />
                    Professional Experience
                  </h4>
                  <p className="text-sm font-bold text-gray-800 leading-relaxed bg-blue-50/20 p-4 rounded-xl border border-blue-50/50">
                    {selectedApplicant.experience}
                  </p>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Info size={12} className="text-blue-500" />
                    Candidate Bio / Statement
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed italic">
                    "{selectedApplicant.bio}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Contact Line</span>
                    <span className="font-bold text-gray-900">{selectedApplicant.phone}</span>
                  </div>
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Work Location</span>
                    <span className="font-bold text-gray-900 truncate block">{selectedApplicant.location}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-150 rounded-2xl">
                  <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                  <p className="text-[11px] font-black text-green-900 uppercase tracking-wide">
                    National ID Registration Verified with RDB
                  </p>
                </div>
              </div>

              {/* Action State inside details */}
              <div className="border-t border-gray-100 pt-6 flex gap-3">
                {selectedApplicant.status === 'pending' ? (
                  <>
                    <button 
                      onClick={() => {
                        handleStatusChange(selectedApplicant.id, 'rejected');
                        setSelectedApplicant(null);
                      }}
                      className="flex-1 py-4 bg-red-50 hover:bg-red-100 text-red-600 font-sans font-black uppercase text-xs tracking-widest rounded-2xl transition-all"
                    >
                      Reject Application
                    </button>
                    <button 
                      onClick={() => {
                        handleStatusChange(selectedApplicant.id, 'accepted');
                        setSelectedApplicant(null);
                      }}
                      className="flex-2 py-4 bg-blue-600 hover:bg-blue-700 text-white font-sans font-black uppercase text-xs tracking-widest rounded-2xl shadow-lg shadow-blue-150 transition-all text-center"
                    >
                      Hire Candidate Indeed
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setSelectedApplicant(null)}
                    className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white font-sans font-black uppercase text-xs tracking-widest rounded-2xl transition-all"
                  >
                    Close Candidate Profile
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
