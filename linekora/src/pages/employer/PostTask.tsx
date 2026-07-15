import React, { useState } from 'react';
import { 
  PlusSquare, MapPin, DollarSign, Clock, 
  ChevronRight, ChevronLeft, Calendar, Info, Shield, 
  Sparkles, Camera, AlertCircle, Check, X, Plus, Trash, CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../lib/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { createJob } from '../../lib/api';

// Recommended range lookup and custom tags for each category
const CATEGORY_METADATA: Record<string, { range: string; min: number; max: number; tags: string[] }> = {
  'Domestic Cleaning': { 
    range: '5,000 - 15,000 RWF', 
    min: 5000, 
    max: 15000, 
    tags: ['Floor Mopping', 'Dishes & Kitchen', 'Laundry / Ironing', 'Window Washing', 'Bathroom Sanitation', 'Dusting'] 
  },
  'Plumbing Repairs': { 
    range: '15,000 - 45,000 RWF', 
    min: 15000, 
    max: 45000, 
    tags: ['Pipe Fitting', 'Emergency Leaks', 'Clogged Drain', 'Sewer Check', 'Tap & Shower Install'] 
  },
  'Garden Work': { 
    range: '5,000 - 20,000 RWF', 
    min: 5000, 
    max: 20000, 
    tags: ['Lawn Mowing', 'Hedge Trimming', 'Weed Control', 'Soil Tilling', 'Fencing repair'] 
  },
  'Mechanical Repairs': { 
    range: '20,000 - 75,000 RWF', 
    min: 20000, 
    max: 75000, 
    tags: ['Car Alternator', 'Brake Pads Replacement', 'Engine Noise Check', 'Moto Maintenance', 'Battery Boost'] 
  },
  'Security / Guard': { 
    range: '10,000 - 35,000 RWF', 
    min: 10000, 
    max: 35000, 
    tags: ['Overnight Patrol', 'Gate Registry', 'CCTV Setup Check', 'Access Control'] 
  },
  'Event Helper': { 
    range: '7,000 - 18,000 RWF', 
    min: 7000, 
    max: 18000, 
    tags: ['Marquee Decor', 'Server & Catering', 'Guest ushering', 'Exhibition Clean up'] 
  },
  'Moving Support': { 
    range: '12,000 - 40,000 RWF', 
    min: 12000, 
    max: 40000, 
    tags: ['Heavy Couch Lifting', 'Fragile packing', 'Truck loading', 'Furniture reassembly'] 
  }
};

// Preset sample images for simulated upload
const SAMPLE_PHOTOS = [
  { id: '1', url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=200&q=80', label: 'Cleaning sample' },
  { id: '2', url: 'https://images.unsplash.com/photo-1542013936693-8848e574047a?auto=format&fit=crop&w=200&q=80', label: 'Leaks sample' },
  { id: '3', url: 'https://images.unsplash.com/photo-1584473457406-6240486418e9?auto=format&fit=crop&w=200&q=80', label: 'Yard sample' }
];

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

export default function EmployerPostTask() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Check if there are active uncompleted contracts in database
  const [hasUncompleted, setHasUncompleted] = useState(() => {
    let contractsList: any[] = [];
    const cachedContracts = localStorage.getItem('linekora_contracts');
    if (cachedContracts) {
      try { contractsList = JSON.parse(cachedContracts); } catch (e) { contractsList = []; }
    }
    return contractsList.some(c => c.status !== 'completed' && c.status !== 'not_trusted');
  });
  
  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Domestic Cleaning');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('8000');
  const [paymentType, setPaymentType] = useState('Per Task');
  const [startDate, setStartDate] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  
  // Custom interactive extensions
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [attachedPhotos, setAttachedPhotos] = useState<string[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showSuccessBlast, setShowSuccessBlast] = useState(false);

  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Tag Toggling Handler
  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag));
    } else {
      if (selectedTags.length >= 4) {
        addToast('Maximum 4 tag attributes are permitted.', 'info');
        return;
      }
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  // Apply Median Price Recommendation
  const handleApplyRecommendedBudget = () => {
    const meta = CATEGORY_METADATA[category];
    if (meta) {
      const median = Math.round((meta.min + meta.max) / 2);
      setBudget(median.toString());
      addToast(`Budget calibrated to standard median: RWF ${median.toLocaleString()}`, 'success');
    }
  };

  // Simulated Custom Photo Upload
  const handleSimulatedUpload = (url: string) => {
    if (attachedPhotos.includes(url)) {
      setAttachedPhotos(prev => prev.filter(u => u !== url));
      addToast('Media thumbnail detached.', 'info');
    } else {
      if (attachedPhotos.length >= 3) {
        addToast('Maximum 3 sample attachments allowed in draft.', 'info');
        return;
      }
      setAttachedPhotos(prev => [...prev, url]);
      addToast('Simulated image attached successfully!', 'success');
    }
  };

  const handleRemovePhoto = (url: string) => {
    setAttachedPhotos(prev => prev.filter(u => u !== url));
    addToast('Attachment removed.', 'info');
  };

  // Validation before changing steps
  const handleNextStep = () => {
    if (step === 1) {
      if (!title.trim()) {
        addToast('Please input a clear title context for the task.', 'error');
        return;
      }
      if (!location.trim()) {
        addToast('Please declare the work neighborhood/sector.', 'error');
        return;
      }
      if (!description.trim()) {
        addToast('Describe the task details briefly so workers can scope it.', 'error');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!budget || Number(budget) <= 0) {
        addToast('Value must represent a positive RWF budget.', 'error');
        return;
      }
      if (!startDate) {
        addToast('Please specify a target commencement date.', 'error');
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    if (!profile?.id) {
      addToast('Please sign in to post a task.', 'error');
      setLoading(false);
      return;
    }
    
    const finalDescription = description.trim() + 
      (selectedTags.length > 0 ? `\n\n[TASK SUB-SCOPES: ${selectedTags.join(', ')}]` : '');

    try {
      // ✅ Write to real PostgreSQL database
      const dbJob = await createJob({
        title: title || 'Urgent Short task',
        description: finalDescription,
        salary: `RWF ${Number(budget).toLocaleString()} / ${paymentType}`,
        location: location || 'Kigali',
        category: category,
        status: 'open',
        urgent: isUrgent,
        employerId: profile.id,
      });

      // Cache locally too
      const localTask = {
        ...dbJob,
        company: profile.displayName,
        postedAt: new Date(dbJob.createdAt).toISOString(),
        type: isUrgent ? 'Urgent task' : 'Direct Task',
        verified: true,
        photos: attachedPhotos,
        tags: selectedTags
      };

      if (isUrgent) {
        const existingUrgent = localStorage.getItem('urgent_jobs');
        const urgentList = existingUrgent ? JSON.parse(existingUrgent) : [];
        localStorage.setItem('urgent_jobs', JSON.stringify([localTask, ...urgentList]));
      }
      const existingJobs = localStorage.getItem('all_jobs');
      const jobsList = existingJobs ? JSON.parse(existingJobs) : [];
      localStorage.setItem('all_jobs', JSON.stringify([localTask, ...jobsList]));

      setLoading(false);
      setShowSuccessBlast(true);
      addToast('Task dispatched to database! Workers can now find it.', 'success');
    } catch (err: any) {
      setLoading(false);
      addToast(err.message || 'Server error. Please try again.', 'error');
    }
  };

  const activeCategoryMeta = CATEGORY_METADATA[category] || CATEGORY_METADATA['Domestic Cleaning'];



  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 font-sans">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-black text-gray-900 font-sans tracking-tight uppercase">Post a Task</h1>
          <p className="text-gray-500 font-sans font-medium mt-1 italic text-sm">Draft dynamic micro-gigs & instant verification alerts in Kigali</p>
        </header>

        {hasUncompleted ? (
          <div className="bg-white rounded-[3rem] border border-red-150 shadow-2xl p-8 md:p-12 text-center max-w-2xl mx-auto py-16 space-y-6 font-sans">
            <div className="h-20 w-20 bg-red-50 text-red-500 rounded-[2.5rem] flex items-center justify-center mx-auto border border-red-105">
              <AlertCircle size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight font-sans">Active Milestone Blockage 🔒</h2>
              <p className="text-gray-400 uppercase tracking-widest font-black text-[10px]">LINEKORA Platform Quality Guarantee</p>
              <p className="text-sm font-sans font-medium text-gray-500 max-w-md mx-auto leading-relaxed">
                Platform safety directives require clients to first update, evaluate, or approve outstanding active assignments and leave ratings/reviews before posting more new listings.
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-100 p-5 rounded-3xl max-w-lg mx-auto text-left text-amber-900 text-xs font-medium leading-relaxed font-sans">
              <span className="font-extrabold uppercase tracking-wider block mb-1">💡 Resolve instantly on your Dashboard:</span>
              Browse down your workspace, select the active task submitted by your worker, and click <span className="font-bold">"Approve & Complete"</span> to release escrow holdings and rate the performance.
            </div>
            <button
              onClick={() => navigate('/dashboard/employer')}
              className="px-8 py-4 bg-gray-950 hover:bg-gray-800 text-white rounded-2xl font-sans font-black uppercase tracking-widest text-xs transition-colors"
            >
              Go to Workspace Dashboard
            </button>
          </div>
        ) : showSuccessBlast ? (
          <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl p-12 text-center max-w-lg mx-auto py-16 space-y-6">
            <div className="h-20 w-20 bg-green-50 text-green-500 rounded-[2.5rem] flex items-center justify-center mx-auto animate-bounce border border-green-100">
              <CheckCircle size={40} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 font-sans uppercase tracking-tight">Active Dispatch!</h2>
              <p className="text-sm font-sans font-medium text-gray-500 mt-2">
                Your gig <span className="text-blue-600 font-black">"{title}"</span> is validated. It is now published live onto the LINEKORA worker dashboard.
              </p>
            </div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono">
              Redirecting you back to your workspace...
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Steps Left Panel */}
            <div className="lg:col-span-3 space-y-3">
              {[
                { n: 1, text: 'Basic Info' },
                { n: 2, text: 'Budget & Time' },
                { n: 3, text: 'Live Card Preview' }
              ].map((s) => (
                <div key={s.n} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                  step === s.n ? 'bg-blue-600 text-white shadow-xl shadow-blue-300/30 border-blue-600' : 'bg-white text-gray-400 border-gray-100'
                }`}>
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-black font-sans text-xs ${
                    step === s.n ? 'bg-white/20 text-white' : 'bg-gray-50 text-gray-400'
                  }`}>
                    {s.n}
                  </div>
                  <span className="text-[10.5px] font-black uppercase tracking-wider font-sans">{s.text}</span>
                </div>
              ))}

              {/* Informative helper widget */}
              <div className="p-5 bg-blue-50/70 border border-blue-100 rounded-3xl mt-6 hidden lg:block">
                <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <Shield size={12} />
                  Safe Job Escrow
                </p>
                <p className="text-[11px] text-blue-700/85 font-medium leading-normal font-sans">
                  Kigali LINEKORA maintains locklots of task wages statically inside a digital wallet until works are finalized. No upfront direct-cash risk!
                </p>
              </div>
            </div>

            {/* Form Right Panel */}
            <div className="lg:col-span-9">
              <div className="bg-white p-6 md:p-10 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/20">
                
                {/* STEP 1: Basic Info */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans px-1">What do you need help with?</label>
                      <input 
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Immediate Living Room Painting or Office Cleaning" 
                        className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all text-base border"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans px-1">Task Category</label>
                        <select 
                          value={category}
                          onChange={(e) => {
                            setCategory(e.target.value);
                            setSelectedTags([]); // Reset tags when category shifts
                          }}
                          className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all cursor-pointer"
                        >
                          <option value="Domestic Cleaning">Domestic Cleaning</option>
                          <option value="Plumbing Repairs">Plumbing Repairs</option>
                          <option value="Garden Work">Garden Work</option>
                          <option value="Mechanical Repairs">Mechanical Repairs</option>
                          <option value="Security / Guard">Security / Guard</option>
                          <option value="Event Helper">Event Helper</option>
                          <option value="Moving Support">Moving Support</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans px-1">Detailed Hub Location</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          <input 
                            type="text" 
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="e.g. Nyarugenge, Kiyovu, Hill 4" 
                            className="w-full pl-11 pr-4 py-4 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* DYNAMIC SUB-TAG SELECTOR */}
                    <div className="space-y-3 bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans">
                          Identify Work Specifics (Max 4)
                        </label>
                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">
                          {selectedTags.length} / 4 Selected
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {activeCategoryMeta.tags.map(tag => {
                          const isActive = selectedTags.includes(tag);
                          return (
                            <button
                              type="button"
                              key={tag}
                              onClick={() => handleToggleTag(tag)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-sans font-bold transition-all flex items-center gap-1.5 border ${
                                isActive 
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100' 
                                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              {isActive ? <Check size={12} strokeWidth={3} /> : <Plus size={12} />}
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* SIMULATED TASK PHOTOS UPLOADER */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans px-1">
                        Attach Reference Photos (Simulated)
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        <div className="md:col-span-4 border-2 border-dashed border-gray-200 hover:border-blue-500 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-gray-50/50">
                          <Camera className="mx-auto text-gray-400 mb-2" size={24} />
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Simulate Click upload</p>
                          <p className="text-[9px] text-gray-400 italic font-sans mt-0.5">Choose presets right here:</p>
                        </div>
                        <div className="md:col-span-8 flex gap-3 overflow-x-auto py-1">
                          {SAMPLE_PHOTOS.map(p => {
                            const isAttached = attachedPhotos.includes(p.url);
                            return (
                              <button
                                type="button"
                                key={p.id}
                                onClick={() => handleSimulatedUpload(p.url)}
                                className={`relative flex-shrink-0 h-16 w-24 rounded-xl overflow-hidden border-2 transition-all ${
                                  isAttached ? 'border-blue-500 scale-95 shadow-md' : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <img src={p.url} className="h-full w-full object-cover" alt={p.label} />
                                <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                                  <span className="text-[8px] font-black text-white bg-black/60 px-1 py-0.5 rounded leading-none">
                                    {isAttached ? '✅ Added' : '+ Add'}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Photo Previews with removal action */}
                      {attachedPhotos.length > 0 && (
                        <div className="flex gap-2.5 pt-1.5">
                          {attachedPhotos.map((url, index) => (
                            <div key={index} className="relative h-14 w-14 rounded-xl overflow-hidden border border-gray-200 shadow-sm group">
                              <img src={url} className="h-full w-full object-cover" alt="Attachment" />
                              <button
                                type="button"
                                onClick={() => handleRemovePhoto(url)}
                                className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans px-1">Describe what needs to be done</label>
                      <textarea 
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="State any specific details or physical labor required, timing details, or access entry points..."
                        className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all resize-none border"
                      />
                    </div>

                    {/* Urgent Flag toggle */}
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex flex-col md:flex-row items-start justify-between p-4 bg-red-50/50 rounded-2xl border border-red-100 gap-4">
                        <div className="flex gap-3">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${isUrgent ? 'bg-red-600 text-white shadow-lg shadow-red-200 animate-pulse' : 'bg-white text-red-500 border border-red-100'}`}>
                            <AlertCircle size={20} />
                          </div>
                          <div>
                            <p className="font-sans font-black text-[10.5px] uppercase tracking-wider text-red-950 flex items-center gap-1.5">
                              🚨 Flag as Urgent Gig
                              <span className="bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Instant alert blast</span>
                            </p>
                            <p className="font-sans text-[10.5px] text-red-700 font-bold mt-0.5 leading-tight">
                              Triggers instant real-time SMS broadcasts and matches to closest verified Kigali professionals immediately.
                            </p>
                          </div>
                        </div>
                        <div 
                          onClick={() => setIsUrgent(!isUrgent)}
                          className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors flex items-center shrink-0 self-center md:self-start ${isUrgent ? 'bg-red-600' : 'bg-gray-200'}`}
                        >
                          <motion.div 
                            layout
                            animate={{ x: isUrgent ? 20 : 0 }}
                            className="h-5 w-5 bg-white rounded-full shadow-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={handleNextStep}
                      className="w-full py-4.5 bg-blue-600 text-white rounded-2xl font-sans font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 text-xs"
                    >
                      Next: Budget Details
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}

                {/* STEP 2: Budget & Time */}
                {step === 2 && (
                  <div className="space-y-6">
                    {/* LIVE ESTIMATOR GUIDE BANNER */}
                    <div className="p-5 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl flex items-start gap-4">
                      <div className="h-10 w-10 rounded-xl bg-white text-indigo-600 flex items-center justify-center shadow-sm shrink-0 border border-indigo-50">
                        <Sparkles size={18} className="animate-pulse" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="text-[10px] font-black text-indigo-900 uppercase tracking-wider">
                            ✨ Real-time Pricing estimate ({category})
                          </p>
                          <span className="text-[9px] bg-indigo-200/50 text-indigo-800 font-black px-2 py-0.5 rounded-full uppercase leading-none">
                            High Demand today
                          </span>
                        </div>
                        <p className="text-xs text-indigo-950 font-bold mt-1 font-sans">
                          Kigali market rate: <span className="text-indigo-600 font-extrabold">{activeCategoryMeta.range}</span>. Matching standard rates yields 4.5x quicker worker acceptances.
                        </p>
                        <button
                          type="button"
                          onClick={handleApplyRecommendedBudget}
                          className="mt-2 text-[10px] font-black text-indigo-700 uppercase tracking-widest hover:text-indigo-900 transition-colors underline decoration-dotted leading-none"
                        >
                          ⚡ Apply Standard rate ({Math.round((activeCategoryMeta.min + activeCategoryMeta.max)/2).toLocaleString()} RWF)
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans px-1">Budget (RWF)</label>
                        <div className="relative">
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          <input 
                            type="number" 
                            value={budget}
                            onChange={(e) => setBudget(e.target.value)}
                            placeholder="e.g. 10000" 
                            className="w-full pl-10 pr-4 py-4 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all text-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans px-1">Payment Type</label>
                        <select 
                          value={paymentType}
                          onChange={(e) => setPaymentType(e.target.value)}
                          className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all appearance-none cursor-pointer"
                        >
                          <option value="Per Task">Per Task flat</option>
                          <option value="Per Hour">Per Hour rate</option>
                          <option value="Per Day">Per Day rate</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans px-1">When should it start?</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                          type="date" 
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full pl-11 pr-4 py-4 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex gap-4">
                      <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0 shadow-sm">
                        <Shield size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-blue-900 font-sans uppercase tracking-wider">Escrow System Active</p>
                        <p className="text-[11px] text-blue-700 font-medium font-sans mt-0.5 leading-normal">
                          Lodge your funding confidently. Funds are only triggered for payout once the partner uploads photographic proof of completed work.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button 
                        type="button"
                        onClick={() => setStep(1)}
                        className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-xl font-sans font-black uppercase text-[10px] tracking-widest hover:bg-gray-100 transition-all border"
                      >
                        Back
                      </button>
                      <button 
                        type="button"
                        onClick={handleNextStep}
                        className="flex-[2] py-4 bg-blue-600 text-white rounded-xl font-sans font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                      >
                        Review Preview
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Review & Post (The Talent Feed Card Preview) */}
                {step === 3 && (
                  <div className="space-y-8">
                    <div className="text-center">
                      <h3 className="text-xl font-black text-gray-900 font-sans tracking-tight uppercase">Task Card Feed Preview</h3>
                      <p className="text-[11px] text-gray-400 italic font-sans max-w-sm mx-auto mt-0.5">
                        Below is exactly how close workers will see your posting inside their search grid:
                      </p>
                    </div>

                    {/* LIVE CARD COMPONENT PREVIEW */}
                    <div className="max-w-md mx-auto bg-white rounded-3xl border border-gray-200 p-6 shadow-xl relative overflow-hidden transition-all hover:border-blue-400/50">
                      {isUrgent && (
                        <div className="absolute top-0 right-0 left-0 bg-red-600 text-white text-[8px] font-black uppercase tracking-widest py-1.5 text-center flex items-center justify-center gap-1">
                          <span className="h-1.5 w-1.5 bg-white rounded-full animate-ping" />
                          🔴 High Priority Urgent Alert Broadcast Active
                        </div>
                      )}
                      
                      <div className={`flex items-start justify-between gap-4 ${isUrgent ? 'mt-4' : ''}`}>
                        <div>
                          <span className="bg-blue-50 text-blue-600 text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border border-blue-100">
                            {category}
                          </span>
                          <h4 className="text-base font-black text-gray-950 font-sans tracking-tight mt-2">{title || 'General Gig Task'}</h4>
                          <p className="text-[10px] text-gray-400 font-sans uppercase font-black tracking-widest mt-0.5">By {profile?.displayName || 'Individual Landlord'}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-black text-blue-600">RWF {Number(budget).toLocaleString()}</p>
                          <p className="text-[9px] font-black text-gray-450 uppercase leading-none">{paymentType}</p>
                        </div>
                      </div>

                      <p className="text-xs text-gray-650 font-sans font-medium mt-3 leading-relaxed whitespace-pre-line bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                        {description || 'No specialized directions attached...'}
                      </p>

                      {/* Display active tags if any */}
                      {selectedTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {selectedTags.map(t => (
                            <span key={t} className="bg-gray-100 text-gray-600 text-[9px] font-black px-2 py-0.5 rounded-lg border border-gray-150">
                              #{t.replace(/\s+/g,'')}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Display attached mock images preview */}
                      {attachedPhotos.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-4">
                          {attachedPhotos.map((url, idx) => (
                            <img key={idx} src={url} className="h-12 w-full object-cover rounded-lg border" alt="Job Snapshot" />
                          ))}
                        </div>
                      )}

                      <div className="border-t border-gray-100 mt-4 pt-3 flex items-center justify-between text-[10px] font-black uppercase text-gray-400 tracking-wider">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-blue-500" />
                          {location || 'Kigali Hub'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-green-500" />
                          Start: {startDate}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row gap-3">
                      <button 
                        type="button"
                        onClick={() => setStep(2)}
                        className="flex-1 py-4 bg-gray-50 text-gray-650 rounded-2xl font-sans font-black uppercase text-[10px] tracking-widest hover:bg-gray-100 transition-all border"
                      >
                        Adjust pricing info
                      </button>
                      <button 
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-2 py-4 bg-blue-600 text-white rounded-2xl font-sans font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                      >
                        {loading ? 'Publishing Lockslot...' : 'Confirm & Post Task Now'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Back bottom label */}
              <div className="mt-6 flex items-center gap-3 px-6">
                 <Info className="text-blue-400 shrink-0" size={16} />
                 <p className="text-[11px] text-gray-400 font-bold font-sans italic">
                   Once posted, the escrow fee of 0.0% is applied. You can edit or delete this task inside your dashboard at any point.
                 </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FLOATING TOASTS PANEL */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="pointer-events-auto bg-white rounded-2xl border border-gray-150 p-4.5 shadow-xl flex items-center gap-3.5 relative overflow-hidden"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 shrink-0 ${
                t.type === 'error' ? 'bg-red-500' : 'bg-green-500'
              }`} />
              <div className="flex-1 pl-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Task Wizard</span>
                <p className="font-sans text-[11px] font-bold text-gray-800 leading-normal mt-0.5">{t.message}</p>
              </div>
              <button 
                onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                className="text-gray-300 hover:text-gray-500 transition-colors cursor-pointer"
              >
                <X size={12} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
