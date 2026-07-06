import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, MapPin, Star, User, 
  CheckCircle2, ChevronRight, MessageSquare, Briefcase, Zap, 
  X, Check, AlertTriangle, ShieldCheck, DollarSign, Clock, Sparkles, Inbox
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'motion/react';

interface WorkerItem {
  id: number;
  name: string;
  role: string;
  location: string;
  rating: number;
  jobs: number;
  verified: boolean;
  skills: string[];
  trustScore: number;
  experience: string; // '1-2yrs' | '3-5yrs' | '5yrs+'
}

interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

export default function BrowseWorkers() {
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Real Filtering State Variables
  const [selectedDistrict, setSelectedDistrict] = useState('All Districts');
  const [selectedRating, setSelectedRating] = useState('Any Rating');
  const [selectedExperience, setSelectedExperience] = useState<string | null>(null);
  const [onlyHighlyTrusted, setOnlyHighlyTrusted] = useState(false);

  // Workers dataset
  const [workers] = useState<WorkerItem[]>([
    { id: 1, name: 'John Musoke', role: 'Plumber', location: 'Kampala', rating: 4.8, jobs: 142, verified: true, skills: ['Pipe Fitting', 'Emergency Repair', 'Drainage'], trustScore: 850, experience: '5yrs+' },
    { id: 2, name: 'Sarah Namono', role: 'Professional Cleaner', location: 'Entebbe', rating: 4.9, jobs: 86, verified: true, skills: ['Deep Cleaning', 'Office Sanitization', 'Laundry'], trustScore: 920, experience: '3-5yrs' },
    { id: 3, name: 'Peter Okello', role: 'Security Guard', location: 'Mukono', rating: 4.5, jobs: 54, verified: true, skills: ['CCTV Monitoring', 'Crowd Control', 'Night Watch'], trustScore: 780, experience: '3-5yrs' },
    { id: 4, name: 'Grace Akello', role: 'Nanny / Caretaker', location: 'Kira', rating: 5.0, jobs: 24, verified: true, skills: ['First Aid', 'Cooking', 'Early Learning'], trustScore: 950, experience: '1-2yrs' },
    { id: 5, name: 'Emmanuel Sseunda', role: 'Mechanic', location: 'Kampala', rating: 4.7, jobs: 110, verified: false, skills: ['Engine Repair', 'Brake Systems', 'Electrical'], trustScore: 640, experience: '5yrs+' },
    { id: 6, name: 'Fabrice Ndoli', role: 'Electrician', location: 'Kiyovu', rating: 4.9, jobs: 42, verified: true, skills: ['Breaker Repair', 'Wall Wiring', 'LED setup', 'AC install'], trustScore: 915, experience: '3-5yrs' },
    { id: 7, name: 'Kevin Mutara', role: 'Painter', location: 'Kimihurura', rating: 4.6, jobs: 61, verified: true, skills: ['Varnish', 'Wall Stencil', 'Exterior Paint', 'Ceiling Scrape'], trustScore: 810, experience: '5yrs+' },
    { id: 8, name: 'Allen Mugisha', role: 'Chef / House cook', location: 'Kiyovu', rating: 4.9, jobs: 19, verified: false, skills: ['Local Dishes', 'Continental Cookery', 'Kitchen Sanitizing'], trustScore: 710, experience: '1-2yrs' }
  ]);

  // Employer active draft jobs parsed from localStorage to let them match quickly
  const [employerPresetJobs, setEmployerPresetJobs] = useState<any[]>([]);

  // HIRE NOW OPERATION STATES
  const [hiringWorker, setHiringWorker] = useState<WorkerItem | null>(null);
  const [hireStep, setHireStep] = useState<1 | 2 | 3>(1); // 1 = form, 2 = anim escrow, 3 = complete
  const [customTaskTitle, setCustomTaskTitle] = useState('');
  const [useDraftTask, setUseDraftTask] = useState<string>('custom'); // 'custom' or preset ID
  const [offeredBudget, setOfferedBudget] = useState('15000');
  const [offerDate, setOfferDate] = useState('');
  const [offerDirections, setOfferDirections] = useState('');

  // Escrow Loading Phases state inside Step 2
  const [escrowPhase, setEscrowPhase] = useState(0);

  // System alerts state
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    // Load published listings to allow quick assignment dropdown matching
    const loadedAll = localStorage.getItem('all_jobs');
    if (loadedAll) {
      try {
        setEmployerPresetJobs(JSON.parse(loadedAll));
      } catch (e) {
        console.error(e);
      }
    }
  }, [hiringWorker]);

  const addToast = (title: string, message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  // REAL FILTERING LOGIC
  const getFilteredWorkers = () => {
    return workers.filter(w => {
      // 1. Text Search matches Name, Role, or Skills tags
      const query = search.toLowerCase().trim();
      const matchText = !query || 
        w.name.toLowerCase().includes(query) || 
        w.role.toLowerCase().includes(query) || 
        w.skills.some(s => s.toLowerCase().includes(query));

      if (!matchText) return false;

      // 2. District layout filter
      if (selectedDistrict !== 'All Districts') {
        if (w.location.toLowerCase() !== selectedDistrict.toLowerCase()) {
          return false;
        }
      }

      // 3. Rating threshold filter
      if (selectedRating !== 'Any Rating') {
        const minStars = parseFloat(selectedRating); // '4.5+ Stars' -> 4.5
        if (w.rating < minStars) return false;
      }

      // 4. Experience tags toggle filter
      if (selectedExperience) {
        if (w.experience !== selectedExperience) return false;
      }

      // 5. Highly Trusted (800+ Score) checkbox filter
      if (onlyHighlyTrusted) {
        if (w.trustScore < 800) return false;
      }

      return true;
    });
  };

  // Launch the multi-tier escrow simulation on-submit
  const handleTriggerContractSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hiringWorker) return;

    // Validation
    const isCustom = useDraftTask === 'custom';
    if (isCustom && !customTaskTitle.trim()) {
      addToast('Validation Checklist ❌', 'Please specify a task title description.', 'error');
      return;
    }
    if (!offeredBudget || Number(offeredBudget) < 1000) {
      addToast('Threshold Mismatch ⚠️', 'Minimum contract budget is RWF 1,000.', 'error');
      return;
    }
    if (!offerDate) {
      addToast('Validation Checklist ❌', 'Please mention the contract beginning date.', 'error');
      return;
    }

    // Launch Phase 2
    setHireStep(2);
    setEscrowPhase(1);

    // Simulated progress cycle mapping for high compliance Escrow visual
    setTimeout(() => {
      setEscrowPhase(2);
      setTimeout(() => {
        setEscrowPhase(3);
        setTimeout(() => {
          setEscrowPhase(4);
          setTimeout(() => {
            // Complete state
            setHireStep(3);
            
            // Record Contract into local history so they display elsewhere as genuine objects
            const draftObj = isCustom 
              ? { title: customTaskTitle } 
              : employerPresetJobs.find(p => p.id.toString() === useDraftTask);

            const newContract = {
              contractId: Date.now(),
              workerId: hiringWorker.id,
              workerName: hiringWorker.name,
              workerRole: hiringWorker.role,
              taskTitle: draftObj?.title || 'Custom Direct Task',
              amount: Number(offeredBudget),
              startDate: offerDate,
              status: 'Escrow Locked',
              timestamp: 'Just now'
            };

            const existingContracts = localStorage.getItem('active_contracts_history');
            const parsedContracts = existingContracts ? JSON.parse(existingContracts) : [];
            localStorage.setItem('active_contracts_history', JSON.stringify([newContract, ...parsedContracts]));

            addToast(
              'Escrow Locked & Dispatched 🛫',
              `RWF ${Number(offeredBudget).toLocaleString()} secured inside LINEKORA. ${hiringWorker.name} has been notified.`,
              'success'
            );
          }, 1200);
        }, 1100);
      }, 1000);
    }, 1000);
  };

  // Autofills price and details if preset draft is selected
  const handleSelectPresetDraft = (presetId: string) => {
    setUseDraftTask(presetId);
    if (presetId !== 'custom') {
      const match = employerPresetJobs.find(j => j.id.toString() === presetId);
      if (match) {
        // Strip RWF/Per Task to extract raw budget number
        const rawBudget = match.salary.replace(/[^\d]/g, '');
        if (rawBudget) setOfferedBudget(rawBudget);
        setOfferDirections(match.description);
        addToast('Draft Populated 📋', `Selected details from your live post: "${match.title}"`, 'info');
      }
    } else {
      setCustomTaskTitle('');
      setOfferedBudget('15000');
      setOfferDirections('');
    }
  };

  const filteredWorkers = getFilteredWorkers();

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4">
        <header className="mb-8 text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
          <div>
            <h1 className="text-3xl font-black text-gray-900 font-sans tracking-tight uppercase">Talent Pool Workspace</h1>
            <p className="text-gray-500 font-sans font-medium mt-1 italic">
              Hire vetted, identity-audited domestic and commercial professionals directly across Kigali
            </p>
          </div>
          
          {/* Quick Stats banner */}
          <div className="flex gap-4 items-center shrink-0">
            <div className="bg-blue-50/50 border border-blue-100 px-4 py-2.5 rounded-2xl text-center shadow-sm">
              <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest block font-mono">Verified Pool</span>
              <span className="text-lg font-black text-blue-900 font-sans leading-none mt-1 block">8 Active</span>
            </div>
          </div>
        </header>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-405 group-focus-within:text-blue-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search by candidate name, direct role (e.g., Plumber), or skill tag..." 
              className="w-full pl-11 pr-4 py-4 rounded-2xl bg-white border border-gray-100 shadow-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none font-sans font-medium text-sm transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold"
              >
                Clear
              </button>
            )}
          </div>
          <button 
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border-2 font-sans font-black text-xs uppercase tracking-widest transition-all cursor-pointer ${
              showFilters ? 'bg-gray-950 text-white border-gray-950 shadow-md' : 'bg-white text-gray-900 border-gray-100 hover:border-blue-600'
            }`}
          >
            <Filter size={16} />
            Filters {showFilters ? '▲' : '▼'}
          </button>
        </div>

        {/* Stateful Filters Selection Box */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ opacity: 0, y: -12 }} 
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8 bg-white p-6 rounded-3xl border border-gray-150 shadow-lg"
            >
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans mb-2.5">Administrative District</label>
                <select 
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-100 font-sans font-bold text-xs outline-none focus:border-blue-600 bg-gray-50 cursor-pointer"
                >
                  <option value="All Districts">All Areas</option>
                  <option value="Kampala">Kampala Hub</option>
                  <option value="Entebbe">Entebbe District</option>
                  <option value="Mukono">Mukono Sector</option>
                  <option value="Kira">Kira Area</option>
                  <option value="Kiyovu">Kiyovu Ward (Kigali)</option>
                  <option value="Kimihurura">Kimihurura (Kigali)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans mb-2.5">Star Rating</label>
                <select 
                  value={selectedRating}
                  onChange={(e) => setSelectedRating(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-100 font-sans font-bold text-xs outline-none focus:border-blue-600 bg-gray-50 cursor-pointer"
                >
                  <option value="Any Rating">Any Rating stars</option>
                  <option value="4.9">4.9+ Top Tier</option>
                  <option value="4.7">4.7+ High Grade</option>
                  <option value="4.5">4.5+ Average</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans mb-2.5">Experience Level</label>
                <div className="flex flex-wrap gap-1.5 mt-0.5">
                  {['1-2yrs', '3-5yrs', '5yrs+'].map(t => {
                    const isSel = selectedExperience === t;
                    return (
                      <button 
                        type="button"
                        key={t} 
                        onClick={() => setSelectedExperience(isSel ? null : t)}
                        className={`px-2.5 py-1.5 rounded-lg text-[10.5px] font-black font-sans uppercase tracking-[0.05em] border transition-all ${
                          isSel ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans mb-2.5">Confidence Level</label>
                <div className="flex items-center gap-2 mt-1 bg-yellow-50/50 p-2 border border-yellow-100 rounded-xl">
                  <input 
                    type="checkbox" 
                    id="highly-trusted-check" 
                    checked={onlyHighlyTrusted}
                    onChange={(e) => setOnlyHighlyTrusted(e.target.checked)}
                    className="h-4.5 w-4.5 rounded text-blue-600 accent-blue-600 focus:ring-transparent border-gray-300 cursor-pointer" 
                  />
                  <label htmlFor="highly-trusted-check" className="text-[11px] font-black text-yellow-905 font-sans uppercase tracking-wider cursor-pointer">
                    ⭐ 800+ Trust score
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Workers grid render */}
        {filteredWorkers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 pb-20">
            {filteredWorkers.map((worker, i) => (
              <motion.div 
                key={worker.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-blue-500/5 hover:border-blue-150 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4.5">
                    <div className="flex gap-4">
                      {/* Avatar */}
                      <div className="relative h-14 w-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 border border-gray-100 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <User size={28} />
                        {worker.verified && (
                          <div className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white rounded-full p-1 shadow-md border-2 border-white">
                            <CheckCircle2 size={10} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-gray-901 font-sans tracking-tight leading-none mb-1 flex items-center gap-1.5">
                          {worker.name}
                          {worker.verified && <span className="text-[8px] bg-blue-50 text-blue-600 font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-blue-105 leading-none">Vetted</span>}
                        </h3>
                        <p className="text-blue-600 font-sans font-black text-xs uppercase tracking-wider">{worker.role}</p>
                        
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex items-center gap-0.5 text-yellow-500">
                            <Star size={12} fill="currentColor" />
                            <span className="text-xs font-black font-sans">{worker.rating.toFixed(1)}</span>
                          </div>
                          <span className="text-gray-300 text-xs">•</span>
                          <span className="text-[11px] font-bold text-gray-400 font-sans uppercase tracking-[0.05em]">{worker.jobs} completed tasks</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1 bg-yellow-50 text-yellow-705 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-yellow-150 shadow-sm">
                        <Zap size={10} fill="currentColor" />
                        Trust {worker.trustScore}
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 font-mono mt-1">Exp: {worker.experience}</span>
                    </div>
                  </div>

                  {/* Skills tags list */}
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {worker.skills.map((skill, j) => (
                      <span key={j} className="px-2.5 py-1 bg-gray-50 rounded-lg text-[10.5px] font-bold text-gray-500 font-sans border border-gray-100 transform group-hover:scale-95 transition-transform">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions Panel */}
                <div className="flex gap-2.5 pt-3 border-t border-gray-50">
                  <button 
                    type="button"
                    onClick={() => {
                      setHiringWorker(worker);
                      setHireStep(1);
                      setOfferDate('');
                      setCustomTaskTitle('');
                      setOfferDirections('');
                      setUseDraftTask('custom');
                    }}
                    className="flex-1 px-4 py-3 bg-gray-950 text-white rounded-xl font-sans font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <Briefcase size={12} />
                    Hire Now
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      addToast('Ferrying Chat Stream...', `Initializing cryptographically encrypted live dialogue frame with ${worker.name}`, 'info');
                    }}
                    className="px-4 py-3 bg-blue-50 text-blue-600 hover:bg-blue-105 rounded-xl font-sans font-bold text-sm transition-all flex items-center justify-center cursor-pointer"
                  >
                    <MessageSquare size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] p-16 text-center border border-gray-100 max-w-md mx-auto my-12 space-y-4 shadow-sm">
            <Inbox size={48} className="mx-auto text-gray-300" />
            <div>
              <p className="text-sm font-black text-gray-800 uppercase tracking-wider font-sans leading-none">No Candidates match criteria</p>
              <p className="text-xs text-gray-400 italic mt-1.5 font-sans">
                Try widening your administrative district boundaries or resetting star rating metrics.
              </p>
            </div>
            <button 
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedDistrict('All Districts');
                setSelectedRating('Any Rating');
                setSelectedExperience(null);
                setOnlyHighlyTrusted(false);
                addToast('Filters reset', 'Returned search views to baseline verified population.', 'info');
              }}
              className="px-5 py-2.5 bg-blue-600 text-white font-sans text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Reset Search Views
            </button>
          </div>
        )}
      </div>

      {/* FULLY FEATURED SECURED CONTRACT / HIRE NOW DIALOG OVERLAY */}
      <AnimatePresence>
        {hiringWorker && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-950/65 backdrop-blur-sm"
              onClick={() => {
                if (hireStep !== 2) setHiringWorker(null);
              }}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] w-full max-w-lg p-6 md:p-9 shadow-2xl relative border border-gray-100 z-10 overflow-hidden"
            >
              {hireStep !== 2 && (
                <button 
                  onClick={() => setHiringWorker(null)}
                  className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-55 text-gray-400 bg-gray-50 flex items-center justify-center border border-gray-150"
                >
                  <X size={18} />
                </button>
              )}

              {/* STEP 1: Interactive gig proposal form */}
              {hireStep === 1 && (
                <div className="space-y-5 text-left">
                  <div className="flex gap-3.5 items-center pb-4 border-b border-gray-100">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border shrink-0">
                      <User size={20} />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Securing Gig with</span>
                      <h3 className="text-base font-black text-gray-955 uppercase font-sans tracking-tight mt-0.5">{hiringWorker.name}</h3>
                    </div>
                  </div>

                  <form onSubmit={handleTriggerContractSubmit} className="space-y-4">
                    
                    {/* Draft Matching Selector if any preset exists */}
                    {employerPresetJobs.length > 0 && (
                      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        <label className="block text-[9.5px] font-black text-blue-800 uppercase tracking-widest mb-1.5">
                          Match with active job listing (Recommended)
                        </label>
                        <select
                          value={useDraftTask}
                          onChange={(e) => handleSelectPresetDraft(e.target.value)}
                          className="w-full text-xs font-bold p-2.5 rounded bg-white border border-blue-200 cursor-pointer text-gray-800"
                        >
                          <option value="custom">Draft direct customized task offer...</option>
                          {employerPresetJobs.map(j => (
                            <option key={j.id} value={j.id.toString()}>Match post: "{j.title}" ({j.salary})</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {useDraftTask === 'custom' && (
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-0.5">Task Description/Title</label>
                        <input 
                          type="text"
                          value={customTaskTitle}
                          onChange={(e) => setCustomTaskTitle(e.target.value)}
                          placeholder="e.g. Backgarden Clearing Work"
                          className="w-full px-4.5 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-600 outline-none font-sans font-bold text-xs"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-0.5">Escrow wage budget (RWF)</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                          <input 
                            type="number"
                            value={offeredBudget}
                            onChange={(e) => setOfferedBudget(e.target.value)}
                            placeholder="e.g. 15000"
                            className="w-full pl-8 pr-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-600 outline-none font-sans font-bold text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-0.5">Start Commencement Date</label>
                        <input 
                          type="date"
                          value={offerDate}
                          onChange={(e) => setOfferDate(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-600 outline-none font-sans font-bold text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-0.5">Directions / Instructions for Candidate</label>
                      <textarea 
                        rows={2}
                        value={offerDirections}
                        onChange={(e) => setOfferDirections(e.target.value)}
                        placeholder="Detail the neighborhood address or standard milestones..."
                        className="w-full px-4.5 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-600 outline-none font-sans font-bold text-xs resize-none"
                      />
                    </div>

                    <div className="pt-2">
                      <button 
                        type="submit"
                        className="w-full py-4 bg-gray-950 text-white font-sans font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-black shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <ShieldCheck size={14} />
                        Trigger Hire order & Secure Escrow Lock
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* STEP 2: Live Escrow creation animation visual flow */}
              {hireStep === 2 && (
                <div className="py-8 text-center space-y-6">
                  <div className="relative h-16 w-16 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
                    <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-gray-950 font-sans uppercase tracking-tight">Securing escrow contract</h3>
                    <p className="text-xs text-gray-400 italic font-sans max-w-sm mx-auto mt-0.5">
                      Establishing cryptographically isolated escrow account locks...
                    </p>
                  </div>

                  {/* Progressive visual checklist updates during simulation */}
                  <div className="max-w-xs mx-auto bg-gray-50 p-5 rounded-2xl border border-gray-150 text-left space-y-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center text-xs ${
                        escrowPhase >= 1 ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'
                      }`}>
                        {escrowPhase >= 1 ? <Check size={12} strokeWidth={3} /> : '1'}
                      </div>
                      <span className="text-[10.5px] font-black uppercase tracking-wide font-sans text-gray-600">Generating direct wallet link</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center text-xs ${
                        escrowPhase >= 2 ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400 font-mono'
                      }`}>
                        {escrowPhase >= 2 ? <Check size={12} strokeWidth={3} /> : '2'}
                      </div>
                      <span className="text-[10.5px] font-black uppercase tracking-wide font-sans text-gray-600">Locking RWF {Number(offeredBudget).toLocaleString()}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center text-xs ${
                        escrowPhase >= 3 ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400 font-mono'
                      }`}>
                        {escrowPhase >= 3 ? <Check size={12} strokeWidth={3} /> : '3'}
                      </div>
                      <span className="text-[10.5px] font-black uppercase tracking-wide font-sans text-gray-600">Dispatching SMS & push beacons</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Complete screen success visual */}
              {hireStep === 3 && hiringWorker && (
                <div className="py-8 text-center space-y-6">
                  <div className="h-16 w-16 bg-green-50 text-green-500 rounded-3xl flex items-center justify-center mx-auto border border-green-100 animate-bounce">
                    <Sparkles size={32} />
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-gray-955 font-sans uppercase tracking-tight">Contract Engaged!</h3>
                    <p className="text-xs text-gray-505 font-sans max-w-sm mx-auto mt-2 leading-relaxed">
                      Wages of <span className="text-blue-600 font-extrabold">RWF {Number(offeredBudget).toLocaleString()}</span> are held securely in LINEKORA escrow locks. <span className="font-bold text-gray-900">{hiringWorker.name}</span> has been paged immediately and has 12 hours to accept or decline before funds revert bounds.
                    </p>
                  </div>

                  <div className="pt-4 max-w-xs mx-auto">
                    <button 
                      onClick={() => setHiringWorker(null)}
                      className="w-full py-3.5 bg-gray-950 text-white font-sans font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-black transition-all cursor-pointer"
                    >
                      Close Workspace
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOATING SYSTEM TOASTS PANEL */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="pointer-events-auto bg-white rounded-3xl border border-gray-150 p-5 shadow-2xl flex items-start gap-4 relative overflow-hidden"
            >
              <div className={`absolute top-0 bottom-0 left-0 w-1.5 shrink-0 ${
                t.type === 'error' ? 'bg-red-500' : t.type === 'info' ? 'bg-indigo-550' : 'bg-green-500'
              }`} />
              
              <div className="flex-1 pl-1">
                <p className="font-sans font-black uppercase tracking-[0.1em] text-[10px] text-gray-400 mb-0.5">{t.title}</p>
                <p className="font-sans text-[11px] font-bold text-gray-800 leading-normal">{t.message}</p>
              </div>
              <button 
                onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
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
