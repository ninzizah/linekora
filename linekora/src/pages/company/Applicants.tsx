import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Star, 
  CheckCircle2, XCircle, MessageSquare, ChevronRight,
  Shield, MapPin, Info, X, Briefcase, Award, Loader2, RefreshCw
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../lib/AuthContext';
import { getApplications, updateApplication, createNotification } from '../../lib/api';

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
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [selectedApplicant, setSelectedApplicant] = useState<any | null>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const loadApplications = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const apps = await getApplications({ employerId: profile.id });
      setApplicants(apps);
    } catch (err) {
      console.error('Failed to load applications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadApplications(); }, [profile?.id]);

  const handleStatusChange = async (appId: number, newStatus: 'accepted' | 'rejected') => {
    const app = applicants.find(a => a.id === appId);
    if (!app) return;
    setProcessingId(appId);
    try {
      await updateApplication(appId, { status: newStatus });
      
      // If hired, record active contract in local store for escrow/review workflow
      if (newStatus === 'accepted') {
        let contractList: any[] = [];
        const cachedContracts = localStorage.getItem('linekora_contracts');
        if (cachedContracts) {
          try { contractList = JSON.parse(cachedContracts); } catch (e) { contractList = []; }
        }
        const exists = contractList.some(c => c.id === app.id);
        if (!exists) {
          contractList.push({
            id: app.id,
            jobTitle: app.job?.title || 'Contract Gig',
            company: profile?.displayName || 'Employer',
            salary: app.job?.salary || 'RWF 20,000 / Task',
            location: app.job?.location || 'Kigali',
            status: 'accepted',
            workerId: app.workerId || 'worker_demo_1',
            workerName: app.worker?.displayName || 'Worker',
            employerId: profile?.id,
            employerName: profile?.displayName || 'Employer',
            daysSinceRequest: 0,
            rating: 0,
            review: '',
            commissionPaidWorker: false,
            commissionPaidEmployer: false,
            date: 'Active Shift Contract',
            logo: 'PJ',
            phone: app.worker?.phone || '+250 780 000 000'
          });
          localStorage.setItem('linekora_contracts', JSON.stringify(contractList));
        }
      }

      // Notify the worker
      if (app.workerId) {
        await createNotification({
          userId: app.workerId,
          title: newStatus === 'accepted' ? '🎉 Application Accepted!' : '❌ Application Rejected',
          body: newStatus === 'accepted'
            ? `Congratulations! Your application for "${app.job?.title || 'the job'}" has been accepted. The employer will contact you soon.`
            : `Your application for "${app.job?.title || 'the job'}" was not accepted this time. Keep applying!`,
          type: newStatus === 'accepted' ? 'success' : 'info',
        });
      }
      setApplicants(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
      if (selectedApplicant?.id === appId) setSelectedApplicant((prev: any) => ({ ...prev, status: newStatus }));
      showToast(newStatus === 'accepted' ? `✅ Candidate hired & contract initiated!` : `Candidate rejected.`);
    } catch (err) {
      showToast('Failed to update application status.');
    } finally {
      setProcessingId(null);
    }
  };

  // Filter & Search Logic
  const filteredApplicants = applicants.filter(app => {
    const workerName = app.worker?.displayName || '';
    const jobTitle = app.job?.title || '';
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesQuery =
      workerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesQuery;
  });


  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-gray-900 font-sans tracking-tight uppercase">Job Applicants</h1>
            <p className="text-gray-500 font-sans font-medium mt-1 italic">
              {loading ? 'Loading...' : `${filteredApplicants.length} ${filteredApplicants.length === 1 ? 'applicant' : 'applicants'} found`}
            </p>
          </div>
          <button onClick={loadApplications} className="flex items-center gap-2 text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
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

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <Loader2 size={24} className="animate-spin" />
            <span className="font-bold text-sm uppercase tracking-widest font-sans">Loading applicants...</span>
          </div>
        )}

        {/* Applicants List */}
        {!loading && (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredApplicants.map((applicant) => {
              const workerName = applicant.worker?.displayName || applicant.name || 'Unknown Worker';
              const jobTitle = applicant.job?.title || applicant.job || 'Unknown Job';
              const avatarLetters = workerName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
              const isVerified = applicant.worker?.verificationStatus === 'verified' || applicant.verified;
              const trustScore = applicant.worker?.trustScore || applicant.trustScore || 0;
              const workerLocation = applicant.worker?.location || applicant.location || 'Kigali';
              return (
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
                        {avatarLetters}
                      </div>
                      {isVerified && (
                        <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-1 rounded-lg border-2 border-white">
                          <Shield size={10} fill="currentColor" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-black text-gray-900 font-sans tracking-tight">{workerName}</h3>
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-0.5 rounded-full">Score: {trustScore}</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                          applicant.status === 'accepted' ? 'bg-green-50 text-green-600 border-green-100' :
                          applicant.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                          'bg-yellow-50 text-yellow-600 border-yellow-105'
                        }`}>
                          {applicant.status}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-gray-500 font-sans flex items-center gap-2 mb-2">
                         Applied for <span className="text-gray-900 italic underline decoration-blue-600/30">{jobTitle}</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-gray-400">
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
                          <MapPin size={12} />
                          {workerLocation}
                        </div>
                        <div className="text-[10px] font-bold text-gray-400 italic">
                          Applied {applicant.createdAt ? new Date(applicant.createdAt).toLocaleDateString() : 'recently'}
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
                          disabled={processingId === applicant.id}
                          className="p-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all disabled:opacity-50"
                          title="Reject Application"
                        >
                          {processingId === applicant.id ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
                        </button>
                        <button 
                          onClick={() => handleStatusChange(applicant.id, 'accepted')}
                          disabled={processingId === applicant.id}
                          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-sans font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                          {processingId === applicant.id ? <><Loader2 size={14} className="animate-spin" /> Hiring...</> : <>Hire Now <ChevronRight size={16} /></>}
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
            );
            })}
          </AnimatePresence>

          {filteredApplicants.length === 0 && (
            <div className="bg-white rounded-[3rem] border border-dashed border-gray-200 py-16 text-center">
              <Users className="text-gray-300 mx-auto mb-4" size={36} />
              <p className="font-sans font-black text-gray-900 uppercase">No applicants found</p>
            </div>
          )}
        </div>
        )}
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
                  {(selectedApplicant.worker?.displayName || selectedApplicant.name || 'W').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-black text-gray-950 font-sans uppercase tracking-tight">
                      {selectedApplicant.worker?.displayName || selectedApplicant.name || 'Worker'}
                    </h3>
                    {(selectedApplicant.worker?.verificationStatus === 'verified' || selectedApplicant.verified) && (
                      <Shield size={16} className="text-green-500" fill="currentColor" />
                    )}
                  </div>
                  <p className="text-xs font-black text-blue-600 uppercase tracking-widest font-sans mt-0.5">
                    Trust Score: {selectedApplicant.worker?.trustScore || selectedApplicant.trustScore || 0}
                  </p>
                  {selectedApplicant.worker?.email && (
                    <p className="text-xs text-gray-500 font-bold mt-0.5">{selectedApplicant.worker.email}</p>
                  )}
                  <span className={`mt-1 inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                    selectedApplicant.status === 'accepted' ? 'bg-green-50 text-green-600 border-green-100' :
                    selectedApplicant.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                    'bg-yellow-50 text-yellow-600 border-yellow-100'
                  }`}>{selectedApplicant.status}</span>
                </div>
              </div>

              <div className="space-y-6 mb-8 font-sans">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Applying For Position</p>
                  <p className="text-base font-bold text-gray-900 italic">"{selectedApplicant.job?.title || selectedApplicant.job || 'N/A'}"</p>
                </div>

                {selectedApplicant.coverLetter && (
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <Info size={12} className="text-blue-500" />
                      Cover Letter
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed italic bg-blue-50/20 p-4 rounded-xl border border-blue-50/50">
                      "{selectedApplicant.coverLetter}"
                    </p>
                  </div>
                )}

                {selectedApplicant.worker?.bio && (
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <Award size={12} className="text-blue-500" />
                      Worker Bio
                    </h4>
                    <p className="text-sm font-bold text-gray-800 leading-relaxed bg-blue-50/20 p-4 rounded-xl border border-blue-50/50">
                      {selectedApplicant.worker.bio}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Contact Line</span>
                    <span className="font-bold text-gray-900">{selectedApplicant.worker?.phone || selectedApplicant.phone || 'Not provided'}</span>
                  </div>
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Work Location</span>
                    <span className="font-bold text-gray-900 truncate block">{selectedApplicant.worker?.location || selectedApplicant.location || 'Kigali'}</span>
                  </div>
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Applied On</span>
                    <span className="font-bold text-gray-900">{selectedApplicant.createdAt ? new Date(selectedApplicant.createdAt).toLocaleDateString() : 'Recently'}</span>
                  </div>
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Verification</span>
                    <span className={`font-black ${selectedApplicant.worker?.verificationStatus === 'verified' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {selectedApplicant.worker?.verificationStatus || 'Unverified'}
                    </span>
                  </div>
                </div>

                {selectedApplicant.worker?.verificationStatus === 'verified' && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-2xl">
                    <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                    <p className="text-[11px] font-black text-green-900 uppercase tracking-wide">National ID Registration Verified with RDB</p>
                  </div>
                )}
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

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl bg-gray-900 text-white font-sans font-bold text-sm flex items-center gap-3"
          >
            <CheckCircle2 size={18} className="text-green-400" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>

  );
}
