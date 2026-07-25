import React, { useState } from 'react';
import { 
  FileText, Clock, CheckCircle2, XCircle, 
  ChevronRight, MapPin, DollarSign, Filter, Search,
  X, Info, Phone, Calendar, ArrowRightLeft, Shield
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'motion/react';

interface Application {
  id: number;
  jobTitle: string;
  company: string;
  location: string;
  salary: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'completion_requested' | 'still_in_progress' | 'disputed' | 'not_trusted';
  date: string;
  logo: string;
  phone: string;
  description: string;
}

export default function WorkerApplications() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected' | 'completed' | 'completion_requested'>('all');
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modalFeedback, setModalFeedback] = useState<{ type: 'withdraw' | 'decline' | 'accept'; title: string; message: string } | null>(null);
  const [confirmingAction, setConfirmingAction] = useState<'withdraw' | 'decline' | null>(null);



  const [apps, setApps] = useState<any[]>(() => {
    // 1. Get raw applications
    let workerApps: any[] = [];
    const cachedApps = localStorage.getItem('worker_applications');
    if (cachedApps) {
      try { workerApps = JSON.parse(cachedApps); } catch (e) { workerApps = []; }
    } else {
      const defaultApps = [
        { 
          id: 1, 
          jobTitle: 'Office Cleaner', 
          company: 'Tech Hub Solutions', 
          location: 'Kigali, Kimihurura', 
          salary: 'RWF 30,005/day',
          status: 'pending',
          date: 'Applied 2 days ago',
          logo: 'TH',
          phone: '+250 788 450 111',
          description: 'Requires cleaning client workspaces, sanitizing meeting rooms, and refilling lounge refreshments thrice weekly.'
        },
        { 
          id: 3, 
          jobTitle: 'Construction Laborer', 
          company: 'BuildRight Ltd', 
          location: 'Kigali, Nyamirambo', 
          salary: 'RWF 25,000/day',
          status: 'rejected',
          date: 'Applied 3 days ago',
          logo: 'BR',
          phone: '+250 783 600 333',
          description: 'Mixing masonry mortar, lifting cement block shipments, and cleaning raw build materials onsite.'
        }
      ];
      localStorage.setItem('worker_applications', JSON.stringify(defaultApps));
      workerApps = defaultApps;
    }

    // 2. Merge with contracts from linekora_contracts database
    let contractList: any[] = [];
    const cachedContracts = localStorage.getItem('linekora_contracts');
    if (cachedContracts) {
      try { contractList = JSON.parse(cachedContracts); } catch (e) { contractList = []; }
    }

    const shemaContracts = contractList.filter(c => c.workerId === 'worker_demo_1');
    const formattedContracts = shemaContracts.map(c => ({
      id: c.id,
      jobTitle: c.jobTitle,
      company: c.company,
      location: c.location,
      salary: c.salary,
      status: c.status,
      date: c.status === 'accepted' ? 'Active Shift Contract' : 
            c.status === 'completion_requested' ? 'Completion Requested' : 
            c.status === 'completed' ? 'Contract Completed 🎉' : 
            c.status === 'still_in_progress' ? 'Revision: In Progress' : 
            c.status === 'disputed' ? 'Disputed milestone' : 'Flagged Untrusted',
      logo: c.logo || 'PJ',
      phone: c.phone || '+250 780 000 000',
      description: c.description || 'Milestone-based professional opportunity nearby.',
      isContract: true
    }));

    return [...formattedContracts, ...workerApps];
  });

  const saveAppsOnly = (newApps: any[]) => {
    // Save applications list only, split out contracts
    const appsOnly = newApps.filter(ap => !ap.isContract);
    localStorage.setItem('worker_applications', JSON.stringify(appsOnly));
  };

  const handleDeclineOrReject = (id: number) => {
    setIsProcessing(true);
    setConfirmingAction(null);
    setTimeout(() => {
      // Mark matching contract in linekora_contracts as rejected
      let contractList: any[] = [];
      const cachedContracts = localStorage.getItem('linekora_contracts');
      if (cachedContracts) {
        try { contractList = JSON.parse(cachedContracts); } catch (e) { contractList = []; }
      }
      const updatedContracts = contractList.map(c => 
        c.id === id ? { ...c, status: 'rejected' } : c
      );
      localStorage.setItem('linekora_contracts', JSON.stringify(updatedContracts));

      // Push alert
      const declinedApp = apps.find(ap => ap.id === id);
      if (declinedApp) {
        const existingAlerts = localStorage.getItem('system_alerts') || '[]';
        let alertsArr = [];
        try { alertsArr = JSON.parse(existingAlerts); } catch (e) { alertsArr = []; }
        alertsArr.push({
          id: Date.now().toString(),
          category: 'urgent',
          title: '❌ Job Offer Declined',
          details: `Worker Shema Honore declined your job offer for "${declinedApp.jobTitle}".`,
          time: 'Just now',
          read: false
        });
        localStorage.setItem('system_alerts', JSON.stringify(alertsArr));
      }

      const updated = apps.map(ap => 
        ap.id === id ? { ...ap, status: 'rejected' as const } : ap
      );
      setApps(updated);
      saveAppsOnly(updated);
      setSelectedApp(prev => prev && prev.id === id ? { ...prev, status: 'rejected' } : prev);
      setIsProcessing(false);
      setModalFeedback({
        type: 'decline',
        title: 'Offer Declined ❌',
        message: 'You have retracted/declined this application contract and alignment safely. No penalties generated.'
      });
    }, 1000);
  };

  const handleWithdraw = (id: number) => {
    setIsProcessing(true);
    setConfirmingAction(null);
    setTimeout(() => {
      const updated = apps.filter(ap => ap.id !== id);
      setApps(updated);
      saveAppsOnly(updated);
      setIsProcessing(false);
      setModalFeedback({
        type: 'withdraw',
        title: 'Withdrawn Successfully 👋',
        message: 'Your job application has been deleted from client matching boards and database registers.'
      });
    }, 1000);
  };

  const handleAcceptOffer = (id: number) => {
    setIsProcessing(true);
    setTimeout(() => {
      const acceptedApp = apps.find(ap => ap.id === id);
      if (acceptedApp) {
        let contractList: any[] = [];
        const cachedContracts = localStorage.getItem('linekora_contracts');
        if (cachedContracts) {
          try { contractList = JSON.parse(cachedContracts); } catch (e) { contractList = []; }
        }

        const exists = contractList.some(c => c.id === id);
        if (!exists) {
          const newContract: any = {
            id: acceptedApp.id,
            jobTitle: acceptedApp.jobTitle,
            company: acceptedApp.company,
            salary: acceptedApp.salary,
            location: acceptedApp.location,
            status: 'accepted',
            workerId: 'worker_demo_1',
            workerName: 'Shema Honore',
            employerId: 'employer_demo_1',
            employerName: acceptedApp.company,
            daysSinceRequest: 0,
            rating: 0,
            review: '',
            commissionPaidWorker: false,
            commissionPaidEmployer: false,
            date: 'Active Shift Contract',
            logo: acceptedApp.logo,
            phone: acceptedApp.phone
          };
          contractList.push(newContract);
        } else {
          contractList = contractList.map(c => 
            c.id === id ? { ...c, status: 'accepted', date: 'Active Shift Contract' } : c
          );
        }
        localStorage.setItem('linekora_contracts', JSON.stringify(contractList));

        // Push alert
        const existingAlerts = localStorage.getItem('system_alerts') || '[]';
        let alertsArr = [];
        try { alertsArr = JSON.parse(existingAlerts); } catch (e) { alertsArr = []; }
        alertsArr.push({
          id: Date.now().toString(),
          category: 'success',
          title: '🤝 Job Offer Approved!',
          details: `Worker Shema Honore approved your job offer for "${acceptedApp.jobTitle}". Contract is now active.`,
          time: 'Just now',
          read: false
        });
        localStorage.setItem('system_alerts', JSON.stringify(alertsArr));
      }

      const updated = apps.map(ap => 
        ap.id === id ? { ...ap, status: 'accepted' as const, date: 'Active Shift Contract' } : ap
      );
      setApps(updated);
      saveAppsOnly(updated);
      setIsProcessing(false);
      setModalFeedback({
        type: 'accept',
        title: 'CONGRATULATIONS! 🎉',
        message: 'Job contract accepted! An automated briefing SMS containing site coordinates and supervisor hotlines was dispatched to your mobile. Feel free to contact the helpline directly!'
      });
    }, 1200);
  };

  const handleRequestCompletion = (id: number) => {
    setIsProcessing(true);
    setTimeout(() => {
      // 1. Read existing contract list
      let contractList: any[] = [];
      const cachedContracts = localStorage.getItem('linekora_contracts');
      if (cachedContracts) {
        try { contractList = JSON.parse(cachedContracts); } catch (e) { contractList = []; }
      }

      // 2. Update the contract status
      const updatedContracts = contractList.map(c => 
        c.id === id ? { ...c, status: 'completion_requested', date: 'Completion Pending' } : c
      );
      localStorage.setItem('linekora_contracts', JSON.stringify(updatedContracts));

      // 3. Dispatch system notification alert to the employer
      const existingAlerts = localStorage.getItem('system_alerts') || '[]';
      let alertsArr = [];
      try { alertsArr = JSON.parse(existingAlerts); } catch (e) { alertsArr = []; }
      alertsArr.push({
        id: Date.now().toString(),
        category: 'urgent',
        title: '⏳ Completion Requested',
        details: `Worker Shema Honore requested completion confirmation for "${updatedContracts.find(c => c.id === id)?.jobTitle || 'Job'}".`,
        time: 'Just now',
        read: false
      });
      localStorage.setItem('system_alerts', JSON.stringify(alertsArr));

      // Reload state
      const refreshedApps = apps.map(ap => 
        ap.id === id ? { ...ap, status: 'completion_requested', date: 'Completion Pending' } : ap
      );
      setApps(refreshedApps);
      setSelectedApp(prev => prev && prev.id === id ? { ...prev, status: 'completion_requested' } : prev);
      setIsProcessing(false);
      setModalFeedback({
        type: 'accept',
        title: 'Completion Dispatched! 🚀',
        message: 'Your request for job completion was dispatched to the micro-client page immediately. You will be notified of reviews shortly.'
      });
    }, 1200);
  };



  const filteredApps = filter === 'all' 
    ? apps 
    : apps.filter(app => {
        if (filter === 'accepted') return app.status === 'accepted' || app.status === 'still_in_progress';
        return app.status === filter;
      });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-50 text-green-600 border-green-150 font-black';
      case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-150 font-black';
      case 'completion_requested': return 'bg-purple-50 text-purple-600 border-purple-150 animate-pulse font-black';
      case 'still_in_progress': return 'bg-amber-50 text-amber-600 border-amber-150 font-black';
      case 'disputed': return 'bg-rose-50 text-rose-600 border-rose-150 font-black';
      case 'not_trusted': return 'bg-red-50 text-red-600 border-red-200 font-bold';
      case 'rejected': return 'bg-gray-100 text-gray-500 border-gray-200 font-black';
      default: return 'bg-yellow-50 text-yellow-600 border-yellow-150 font-black';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle2 size={12} />;
      case 'completed': return <CheckCircle2 size={12} className="text-emerald-500" />;
      case 'completion_requested': return <Clock size={12} className="text-purple-500 animate-spin" />;
      case 'still_in_progress': return <Clock size={12} className="text-amber-550" />;
      case 'disputed': return <Info size={12} className="text-rose-500" />;
      case 'not_trusted': return <Shield size={12} className="text-red-500" />;
      case 'rejected': return <XCircle size={12} />;
      default: return <Clock size={12} />;
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-black text-gray-900 font-sans tracking-tight uppercase">My Applications & Active Jobs</h1>
          <p className="text-gray-500 font-sans font-medium mt-1 italic">Track your job applications, active shift contracts, and completion handovers live.</p>
        </header>

        {/* BILINGUAL HIGH-CONTRAST STATUS NOTICE */}
        <div className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-2 border-amber-500/40 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md">
              🔒
            </div>
            <div className="space-y-1">
              <h3 className="font-sans font-black text-slate-950 text-sm uppercase tracking-wide flex items-center gap-2">
                APPLICATION & PROFILE STATUS / AMABWIRIZA Y'UMWIRONDORO
                <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Notice</span>
              </h3>
              <p className="font-sans text-xs font-bold text-slate-900 leading-relaxed">
                <span className="font-extrabold text-amber-900">[RW]</span> Umwirondoro wawe urakora kandi uragaragara ku bakoresha bose kuri LINEKORA bidasaba amafaranga yandi. Verification na komisiyo biba ari uguhitamo kwawe.
              </p>
              <p className="font-sans text-[11px] font-semibold text-slate-800 leading-relaxed italic">
                <span className="font-extrabold text-amber-900">[EN]</span> Your profile remains fully active and visible to employers across LINEKORA at zero mandatory cost. Verification and optional badges enhance visibility without locking free features.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto scrollbar-none">
            {['all', 'pending', 'accepted', 'completion_requested', 'completed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest font-sans transition-all shrink-0 ${
                  filter === f ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {f === 'accepted' ? 'Active / In Progress' : f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredApps.map((app) => (
              <motion.div
                key={app.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="group bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex gap-6">
                    <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 font-black font-sans group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shrink-0">
                      {app.logo}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-900 font-sans tracking-tight">{app.jobTitle}</h3>
                      <p className="text-gray-500 font-sans font-bold italic mb-3">{app.company}</p>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 font-sans uppercase tracking-widest">
                          <MapPin size={12} />
                          {app.location}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 font-sans uppercase tracking-widest">
                          <DollarSign size={12} />
                          {app.salary}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 font-sans uppercase tracking-widest">
                          <Clock size={12} />
                          {app.date}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:flex-col md:items-end gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-gray-50">
                    <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${getStatusColor(app.status)}`}>
                      {getStatusIcon(app.status)}
                      {app.status}
                    </div>
                    <button 
                      onClick={() => setSelectedApp(app)}
                      className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-all font-sans"
                    >
                      View Details
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredApps.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-[3rem] border border-dashed border-gray-200">
              <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mb-4">
                <FileText size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-900 font-sans">No applications found</h3>
              <p className="text-gray-500 font-sans text-sm mt-1">Try changing your filters or browse new jobs.</p>
            </div>
          )}
        </div>
      </div>

      {/* Details/Reject Modal Dialog Drawer */}
      <AnimatePresence>
        {selectedApp && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="bg-white rounded-[3rem] border border-gray-150 w-full max-w-lg p-8 relative shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <button 
                onClick={() => {
                  setSelectedApp(null);
                  setModalFeedback(null);
                  setConfirmingAction(null);
                }}
                disabled={isProcessing}
                className="absolute top-6 right-6 h-10 w-10 bg-gray-50 hover:bg-gray-100 border border-gray-150 text-gray-400 hover:text-gray-600 rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>

              {isProcessing ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6" />
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Processing Alignment</h3>
                  <p className="text-xs text-gray-400 mt-2 font-sans italic">Broadcasting verified status change to platform ledger...</p>
                </div>
              ) : modalFeedback ? (
                <div className="py-6 flex flex-col items-center justify-center text-center">
                  <div className={`h-16 w-16 ${
                    modalFeedback.type === 'decline' ? 'bg-red-50 text-red-650' :
                    modalFeedback.type === 'withdraw' ? 'bg-amber-50 text-amber-655' :
                    'bg-green-50 text-green-650'
                  } rounded-3xl flex items-center justify-center mb-6 text-2xl font-sans`}>
                    {modalFeedback.type === 'decline' ? <span>✕</span> : modalFeedback.type === 'withdraw' ? <span>👋</span> : <span>✓</span>}
                  </div>
                  <h3 className="text-2xl font-black text-gray-950 font-sans tracking-tight leading-tight uppercase mb-3">
                    {modalFeedback.title}
                  </h3>
                  <p className="text-sm text-gray-500 font-sans leading-relaxed mb-8 max-w-sm">
                    {modalFeedback.message}
                  </p>
                  <button
                    onClick={() => {
                      setSelectedApp(null);
                      setModalFeedback(null);
                      setConfirmingAction(null);
                    }}
                    className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-sans font-black uppercase tracking-widest text-[10px] text-center transition-all shadow-lg"
                  >
                    Close Details
                  </button>
                </div>
              ) : confirmingAction ? (
                <div className="py-6 font-sans">
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Are you sure?</h3>
                  <p className="text-sm text-gray-550 mb-8 leading-relaxed">
                    {confirmingAction === 'withdraw' 
                      ? 'Do you want to completely withdraw this job application? This action will remove your reference entry from the employer pipeline database.'
                      : 'Do you want to decline this verified job contract? Your status will be marked as declined without any penalty points.'
                    }
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        if (confirmingAction === 'withdraw') {
                          handleWithdraw(selectedApp.id);
                        } else {
                          handleDeclineOrReject(selectedApp.id);
                        }
                      }}
                      className="flex-1 py-4 bg-red-650 hover:bg-red-700 text-white rounded-xl font-sans font-black uppercase tracking-widest text-[10px] text-center transition-all shadow-lg"
                    >
                      Yes, Confirm
                    </button>
                    <button
                      onClick={() => setConfirmingAction(null)}
                      className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-sans font-black uppercase tracking-widest text-[10px] text-center transition-all border border-gray-200"
                    >
                      Cancel Action
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-500 font-black font-sans text-2xl">
                      {selectedApp.logo}
                    </div>
                    <div>
                      <span className={`inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-md border border-blue-105 text-[9px] font-black uppercase tracking-widest mb-1.5`}>
                        {selectedApp.company}
                      </span>
                      <h3 className="text-2xl font-black text-gray-950 font-sans uppercase tracking-tight">{selectedApp.jobTitle}</h3>
                    </div>
                  </div>

                  <div className="space-y-6 font-sans mb-8">
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Contract / Task Overview</span>
                      <p className="text-sm font-medium text-gray-650 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        "{selectedApp.description}"
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Offered Salary</span>
                        <span className="text-sm font-black text-blue-600 font-sans tracking-tight">{selectedApp.salary}</span>
                      </div>
                      <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Location</span>
                        <span className="text-sm font-bold text-gray-800">{selectedApp.location}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-start gap-3">
                      <Shield size={18} className="text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-black text-blue-900 uppercase tracking-wider">LINEKORA Guard Secure Escrow</p>
                        <p className="text-[11px] text-blue-700 font-medium leading-relaxed mt-0.5">
                          This job uses our milestone security guarantees. The salary is held in a trust vault prior to milestones being finished to ensure honest payout.
                        </p>
                      </div>
                    </div>

                    {(selectedApp.status === 'accepted' || selectedApp.status === 'still_in_progress' || selectedApp.status === 'completion_requested') && (
                      <div className="p-4 bg-green-50/50 border border-green-150 rounded-2xl animate-fade-in">
                        <span className="text-[9px] font-black text-green-700 uppercase tracking-widest block mb-1">☎ Employer Helpline</span>
                        <p className="text-xs font-black text-green-950 mb-0.5">Reach Out: {selectedApp.phone || '+250 788 123 456'}</p>
                        <p className="text-[10px] text-green-700/80 font-medium font-sans">Give them a call or use our workspace chat to discuss onboarding shift guidelines.</p>
                      </div>
                    )}
                  </div>

                  {/* Action layout */}
                  <div className="border-t border-gray-100 pt-6 flex flex-col gap-3">
                    {/* If it is an active contract and we can request completion */}
                    {selectedApp.isContract && (selectedApp.status === 'accepted' || selectedApp.status === 'still_in_progress') && (
                      <button
                        onClick={() => handleRequestCompletion(selectedApp.id)}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-sans font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                      >
                        🚀 Request Completion
                      </button>
                    )}

                    {selectedApp.status === 'completion_requested' && (
                      <div className="text-center py-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-xs font-black text-indigo-700 uppercase tracking-wider animate-pulse">
                        ⏳ Completion Requested & Blocked
                      </div>
                    )}

                    {selectedApp.status === 'disputed' && (
                      <div className="text-center py-4 bg-red-50 border border-red-150 rounded-2xl text-xs font-black text-red-700 uppercase tracking-wider">
                        ⚠️ Disputed: Under LINEKORA Admin Audit
                      </div>
                    )}

                    {selectedApp.status === 'not_trusted' && (
                      <div className="text-center py-4 bg-rose-50 border border-rose-150 rounded-2xl text-xs font-black text-rose-700 uppercase tracking-wider">
                        🚫 Flagged: Not Trusted Penalty
                      </div>
                    )}

                    <div className="flex gap-3">
                      {selectedApp.status === 'pending' && (
                        <>
                          <button
                            onClick={() => setConfirmingAction('withdraw')}
                            className="flex-1 py-4 bg-red-50 hover:bg-red-100 text-red-650 rounded-2xl font-sans font-black uppercase text-xs tracking-widest transition-all"
                          >
                            Withdraw
                          </button>
                          <button
                            onClick={() => setSelectedApp(null)}
                            className="flex-1 py-4 bg-gray-950 hover:bg-gray-800 text-white rounded-2xl font-sans font-black uppercase text-xs tracking-widest transition-all"
                          >
                            Close Details
                          </button>
                        </>
                      )}

                      {selectedApp.status === 'accepted' && !selectedApp.isContract && (
                        <>
                          <button
                            onClick={() => setConfirmingAction('decline')}
                            className="flex-1 py-4 bg-red-50 hover:bg-red-105 text-red-650 rounded-2xl font-sans font-black uppercase text-xs tracking-widest transition-all"
                          >
                            Decline Offer
                          </button>
                          <button
                            onClick={() => handleAcceptOffer(selectedApp.id)}
                            className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-sans font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-200 transition-all"
                          >
                            Accept Offer
                          </button>
                        </>
                      )}

                      {(!selectedApp.status || selectedApp.status === 'completed' || selectedApp.status === 'rejected' || selectedApp.isContract) && (
                        <button
                          onClick={() => setSelectedApp(null)}
                          className="w-full py-4 bg-gray-950 hover:bg-gray-800 text-white rounded-2xl font-sans font-black uppercase text-xs tracking-widest transition-all"
                        >
                          Close Details
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
