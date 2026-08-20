import React, { useState } from 'react';
import { 
  PlusSquare, MapPin, DollarSign, Clock, 
  ChevronRight, ChevronLeft, Calendar, Info, Shield, 
  Sparkles, Camera, AlertCircle, Check, X, Plus, Trash, CheckCircle, Phone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../lib/AuthContext';
import { useLanguage } from '../../lib/LanguageContext';
import { readScopedStorage, writeScopedStorage } from '../../lib/userScopedStorage';
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

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

export default function EmployerPostTask() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const catLabel = (v: string) => ({
    'Domestic Cleaning': t('category_domestic_cleaning'),
    'Plumbing Repairs': t('category_plumbing_repairs'),
    'Garden Work': t('category_garden_work'),
    'Mechanical Repairs': t('category_mechanical_repairs'),
    'Security / Guard': t('category_security_guard'),
    'Event Helper': t('category_event_helper'),
    'Moving Support': t('category_moving_support'),
  }[v] || v);

  const tagLabel = (v: string) => ({
    'Floor Mopping': t('tag_floor_mopping'),
    'Dishes & Kitchen': t('tag_dishes_kitchen'),
    'Laundry / Ironing': t('tag_laundry_ironing'),
    'Window Washing': t('tag_window_washing'),
    'Bathroom Sanitation': t('tag_bathroom_sanitation'),
    'Dusting': t('tag_dusting'),
    'Pipe Fitting': t('tag_pipe_fitting'),
    'Emergency Leaks': t('tag_emergency_leaks'),
    'Clogged Drain': t('tag_clogged_drain'),
    'Sewer Check': t('tag_sewer_check'),
    'Tap & Shower Install': t('tag_tap_shower_install'),
    'Lawn Mowing': t('tag_lawn_mowing'),
    'Hedge Trimming': t('tag_hedge_trimming'),
    'Weed Control': t('tag_weed_control'),
    'Soil Tilling': t('tag_soil_tilling'),
    'Fencing repair': t('tag_fencing_repair'),
    'Car Alternator': t('tag_car_alternator'),
    'Brake Pads Replacement': t('tag_brake_pads_replacement'),
    'Engine Noise Check': t('tag_engine_noise_check'),
    'Moto Maintenance': t('tag_moto_maintenance'),
    'Battery Boost': t('tag_battery_boost'),
    'Overnight Patrol': t('tag_overnight_patrol'),
    'Gate Registry': t('tag_gate_registry'),
    'CCTV Setup Check': t('tag_cctv_setup_check'),
    'Access Control': t('tag_access_control'),
    'Marquee Decor': t('tag_marquee_decor'),
    'Server & Catering': t('tag_server_catering'),
    'Guest ushering': t('tag_guest_ushering'),
    'Exhibition Clean up': t('tag_exhibition_clean_up'),
    'Heavy Couch Lifting': t('tag_heavy_couch_lifting'),
    'Fragile packing': t('tag_fragile_packing'),
    'Truck loading': t('tag_truck_loading'),
    'Furniture reassembly': t('tag_furniture_reassembly'),
  }[v] || v);

  
  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Domestic Cleaning');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('8000');
  const [paymentType, setPaymentType] = useState('Per Task');
  const [startDate, setStartDate] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [workerType, setWorkerType] = useState('individual');
  
  // Custom interactive extensions
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [attachedPhotos, setAttachedPhotos] = useState<string[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showSuccessBlast, setShowSuccessBlast] = useState(false);

  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(x => x.id !== id));
    }, 4000);
  };

  // Tag Toggling Handler
  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(x => x !== tag));
    } else {
      if (selectedTags.length >= 4) {
        addToast(t('toast_max_4_tags'), 'info');
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
      addToast(t('toast_budget_calibrated', { amount: median.toLocaleString() }), 'success');
    }
  };

  // Real device photo upload
  const handleRealUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const maxFiles = 5 - attachedPhotos.length;
    const toProcess = Array.from(files).slice(0, maxFiles);
    const MAX_PHOTO_BYTES = 1.5 * 1024 * 1024;
    const MAX_TOTAL_BYTES = 3.5 * 1024 * 1024;
    toProcess.forEach((file: File) => {
      if (file.size > MAX_PHOTO_BYTES) {
        addToast(t('photo_too_large_error'), 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setAttachedPhotos(prev => {
          if (prev.length >= 5) {
            addToast(t('toast_max_5_photos'), 'info');
            return prev;
          }
          const currentBytes = prev.reduce((sum, url) => sum + (url.length * 3) / 4, 0);
          const newBytes = (dataUrl.length * 3) / 4;
          if (currentBytes + newBytes > MAX_TOTAL_BYTES) {
            addToast(t('toast_photo_storage_limit'), 'error');
            return prev;
          }
          addToast(t('toast_photo_attached'), 'success');
          return [...prev, dataUrl];
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleRemovePhoto = (url: string) => {
    setAttachedPhotos(prev => prev.filter(u => u !== url));
    addToast(t('toast_attachment_removed'), 'info');
  };

  // Validation before changing steps
  const handleNextStep = () => {
    if (step === 1) {
      if (!title.trim()) {
        addToast(t('toast_title_required'), 'error');
        return;
      }
      if (!location.trim()) {
        addToast(t('toast_location_required'), 'error');
        return;
      }
      if (!description.trim()) {
        addToast(t('toast_description_required'), 'error');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!budget || Number(budget) <= 0) {
        addToast(t('toast_positive_budget'), 'error');
        return;
      }
      if (!startDate) {
        addToast(t('toast_start_date_required'), 'error');
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    if (!profile?.id) {
      addToast(t('toast_sign_in_to_post'), 'error');
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
        deadline: startDate ? new Date(startDate).toISOString() : undefined,
        phone: phone || undefined,
        photos: attachedPhotos.length > 0 ? JSON.stringify(attachedPhotos) : undefined,
        workerType: workerType,
      });

      // Cache locally too
      const localTask = {
        ...dbJob,
        phone: phone || undefined,
        company: profile.displayName,
        postedAt: new Date(dbJob.createdAt).toISOString(),
        type: isUrgent ? 'Urgent task' : 'Direct Task',
        verified: true,
        photos: attachedPhotos,
        tags: selectedTags
      };

      if (isUrgent) {
        const urgentList = readScopedStorage<any[]>(profile?.id, 'urgent_jobs', []);
        writeScopedStorage(profile?.id, 'urgent_jobs', [localTask, ...urgentList]);
      }
      const jobsList = readScopedStorage<any[]>(profile?.id, 'all_jobs', []);
      writeScopedStorage(profile?.id, 'all_jobs', [localTask, ...jobsList]);

      setLoading(false);
      setShowSuccessBlast(true);
      addToast(t('toast_task_dispatched'), 'success');
    } catch (err: any) {
      setLoading(false);
      addToast(err.message || t('server_error_retry'), 'error');
    }
  };

  const activeCategoryMeta = CATEGORY_METADATA[category] || CATEGORY_METADATA['Domestic Cleaning'];



  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 font-sans">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-black text-gray-900 font-sans tracking-tight uppercase">{t('post_task')}</h1>
          <p className="text-gray-500 font-sans font-medium mt-1 italic text-sm">{t('post_task_subtitle')}</p>
        </header>

        {showSuccessBlast ? (
          <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl p-6 md:p-12 text-center max-w-lg mx-auto py-10 md:py-16 space-y-6">
            <div className="h-20 w-20 bg-green-50 text-green-500 rounded-[2.5rem] flex items-center justify-center mx-auto animate-bounce border border-green-100">
              <CheckCircle size={40} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 font-sans uppercase tracking-tight">{t('post_success_title')}</h2>
              <p className="text-sm font-sans font-medium text-gray-500 mt-2">
                {t('post_success_desc', { title })}
              </p>
            </div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono">
              {t('post_success_redirect')}
            </div>
            <button
              onClick={() => navigate('/dashboard/employer')}
              className="w-full py-4 bg-gray-950 hover:bg-black text-white rounded-2xl font-sans font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-gray-200"
            >
              {t('back_to_dashboard')} →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Steps Left Panel */}
            <div className="lg:col-span-3 space-y-3">
              {[
                { n: 1, text: t('step_basic_info') },
                { n: 2, text: t('step_budget_time') },
                { n: 3, text: t('step_live_preview') }
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
                  {t('safe_job_escrow')}
                </p>
                <p className="text-[11px] text-blue-700/85 font-medium leading-normal font-sans">
                  {t('safe_job_escrow_desc')}
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
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans px-1">{t('what_do_you_need_help')}</label>
                      <input 
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={t('placeholder_living_room')} 
                        className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all text-base border"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans px-1">{t('task_category')}</label>
                        <select 
                          value={category}
                          onChange={(e) => {
                            setCategory(e.target.value);
                            setSelectedTags([]); // Reset tags when category shifts
                          }}
                          className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all cursor-pointer"
                        >
                          <option value="Domestic Cleaning">{catLabel('Domestic Cleaning')}</option>
                          <option value="Plumbing Repairs">{catLabel('Plumbing Repairs')}</option>
                          <option value="Garden Work">{catLabel('Garden Work')}</option>
                          <option value="Mechanical Repairs">{catLabel('Mechanical Repairs')}</option>
                          <option value="Security / Guard">{catLabel('Security / Guard')}</option>
                          <option value="Event Helper">{catLabel('Event Helper')}</option>
                          <option value="Moving Support">{catLabel('Moving Support')}</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans px-1">{t('detailed_hub_location')}</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          <input 
                            type="text" 
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder={t('placeholder_location')} 
                            className="w-full pl-11 pr-4 py-4 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans px-1">{t('contact_phone_label')}</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                          type="tel" 
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. +250 788 123 456" 
                          className="w-full pl-11 pr-4 py-4 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all"
                        />
                      </div>
                    </div>

                    {/* DYNAMIC SUB-TAG SELECTOR */}
                    <div className="space-y-3 bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans">
                          {t('identify_work_specifics')}
                        </label>
                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">
                          {t('tags_selected', { count: selectedTags.length })}
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
                              {tagLabel(tag)}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* TASK PHOTOS UPLOADER */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans px-1">
                        {t('attach_reference_photos')}
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        <div className="md:col-span-4 border-2 border-dashed border-gray-200 hover:border-blue-500 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-gray-50/50" onClick={() => document.getElementById('photo-upload')?.click()}>
                          <Camera className="mx-auto text-gray-400 mb-2" size={24} />
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider">{t('click_to_upload')}</p>
                          <p className="text-[9px] text-gray-400 italic font-sans mt-0.5">{t('max_5_photos')}</p>
                          <input id="photo-upload" type="file" accept="image/*" multiple className="hidden" onChange={handleRealUpload} />
                        </div>
                      </div>

                      {/* Photo Previews with removal action */}
                      {attachedPhotos.length > 0 && (
                        <div className="flex gap-2.5 pt-1.5">
                          {attachedPhotos.map((url, index) => (
                            <div key={index} className="relative h-14 w-14 rounded-xl overflow-hidden border border-gray-200 shadow-sm group">
                              <img src={url} className="h-full w-full object-cover" alt={t('attachment')} />
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
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans px-1">{t('describe_task')}</label>
                      <textarea 
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t('placeholder_task_description')}
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
                              {t('flag_as_urgent_gig')}
                              <span className="bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">{t('instant_alert_blast')}</span>
                            </p>
                            <p className="font-sans text-[10.5px] text-red-700 font-bold mt-0.5 leading-tight">
                              {t('urgent_gig_desc')}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button" 
                          onClick={() => setIsUrgent(!isUrgent)}
                          className={`w-16 h-9 rounded-full p-1 cursor-pointer transition-all flex items-center justify-between shrink-0 self-center md:self-start border-2 shadow-inner ${
                            isUrgent ? 'bg-red-600 border-red-700' : 'bg-slate-800 border-slate-900'
                          }`}
                          aria-label={t('toggle_urgent_gig')}
                        >
                          <span className={`text-[9px] font-black uppercase px-1 transition-opacity ${isUrgent ? 'text-white opacity-100' : 'opacity-0'}`}>{t('on')}</span>
                          <motion.div 
                            layout
                            animate={{ x: isUrgent ? 28 : 0 }}
                            className="h-6 w-6 bg-white rounded-full shadow-lg border border-slate-300 flex items-center justify-center font-black text-[9px] text-slate-900"
                          >
                            {isUrgent ? '✓' : '✕'}
                          </motion.div>
                          <span className={`text-[9px] font-black uppercase px-1 transition-opacity ${!isUrgent ? 'text-slate-300 opacity-100' : 'opacity-0'}`}>{t('off')}</span>
                        </button>
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={handleNextStep}
                      className="w-full py-4.5 bg-blue-600 text-white rounded-2xl font-sans font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 text-xs"
                    >
                      {t('next_budget_details')}
                      <ChevronRight size={16} />
                    </button>                  </div>
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
                            {t('real_time_pricing_estimate', { category: catLabel(category) })}
                          </p>
                          <span className="text-[9px] bg-indigo-200/50 text-indigo-800 font-black px-2 py-0.5 rounded-full uppercase leading-none">
                            {t('high_demand_today')}
                          </span>
                        </div>
                        <p className="text-xs text-indigo-950 font-bold mt-1 font-sans">
                          {t('kigali_market_rate', { range: activeCategoryMeta.range })}
                        </p>
                        <button
                          type="button"
                          onClick={handleApplyRecommendedBudget}
                          className="mt-2 text-[10px] font-black text-indigo-700 uppercase tracking-widest hover:text-indigo-900 transition-colors underline decoration-dotted leading-none"
                        >
                          {t('apply_standard_rate', { amount: Math.round((activeCategoryMeta.min + activeCategoryMeta.max)/2).toLocaleString() })}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans px-1">{t('budget_label')}</label>
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
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans px-1">{t('payment_type')}</label>
                        <select 
                          value={paymentType}
                          onChange={(e) => setPaymentType(e.target.value)}
                          className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all appearance-none cursor-pointer"
                        >
                          <option value="Per Task">{t('payment_per_task_flat')}</option>
                          <option value="Per Hour">{t('payment_per_hour_rate')}</option>
                          <option value="Per Day">{t('payment_per_day_rate')}</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans px-1">{t('when_should_it_start')}</label>
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
                        <p className="text-xs font-black text-blue-900 font-sans uppercase tracking-wider">{t('escrow_system_active')}</p>
                        <p className="text-[11px] text-blue-700 font-medium font-sans mt-0.5 leading-normal">
                          {t('escrow_system_desc')}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button 
                        type="button"
                        onClick={() => setStep(1)}
                        className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-xl font-sans font-black uppercase text-[10px] tracking-widest hover:bg-gray-100 transition-all border"
                      >
                        {t('back')}
                      </button>
                      <button 
                        type="button"
                        onClick={handleNextStep}
                        className="flex-[2] py-4 bg-blue-600 text-white rounded-xl font-sans font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                      >
                        {t('review_preview')}
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Review & Post (The Talent Feed Card Preview) */}
                {step === 3 && (
                  <div className="space-y-8">
                    <div className="text-center">
                      <h3 className="text-xl font-black text-gray-900 font-sans tracking-tight uppercase">{t('task_card_feed_preview')}</h3>
                      <p className="text-[11px] text-gray-400 italic font-sans max-w-sm mx-auto mt-0.5">
                        {t('task_card_feed_preview_desc')}
                      </p>
                    </div>

                    {/* LIVE CARD COMPONENT PREVIEW */}
                    <div className="max-w-md mx-auto bg-white rounded-3xl border border-gray-200 p-6 shadow-xl relative overflow-hidden transition-all hover:border-blue-400/50">
                      {isUrgent && (
                        <div className="absolute top-0 right-0 left-0 bg-red-600 text-white text-[8px] font-black uppercase tracking-widest py-1.5 text-center flex items-center justify-center gap-1">
                          <span className="h-1.5 w-1.5 bg-white rounded-full animate-ping" />
                          {t('urgent_alert_broadcast')}
                        </div>
                      )}
                      
                      <div className={`flex items-start justify-between gap-4 ${isUrgent ? 'mt-4' : ''}`}>
                        <div>
                          <span className="bg-blue-50 text-blue-600 text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border border-blue-100">
                            {catLabel(category)}
                          </span>
                          <h4 className="text-base font-black text-gray-950 font-sans tracking-tight mt-2">{title || t('general_gig_task')}</h4>
                          <p className="text-[10px] text-gray-400 font-sans uppercase font-black tracking-widest mt-0.5">{t('posted_by', { name: profile?.displayName || t('individual_tasks_employer') })}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-black text-blue-600">RWF {Number(budget).toLocaleString()}</p>
                          <p className="text-[9px] font-black text-gray-450 uppercase leading-none">{paymentType}</p>
                        </div>
                      </div>

                      <p className="text-xs text-gray-650 font-sans font-medium mt-3 leading-relaxed whitespace-pre-line bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                        {description || t('no_specialized_directions')}
                      </p>

                      {/* Display active tags if any */}
                      {selectedTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {selectedTags.map(tag => (
                            <span key={tag} className="bg-gray-100 text-gray-600 text-[9px] font-black px-2 py-0.5 rounded-lg border border-gray-150">
                              #{tag.replace(/\s+/g,'')}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Display attached mock images preview */}
                      {attachedPhotos.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-4">
                          {attachedPhotos.map((url, idx) => (
                            <img key={idx} src={url} className="h-12 w-full object-cover rounded-lg border" alt={t('job_snapshot')} />
                          ))}
                        </div>
                      )}

                      <div className="border-t border-gray-100 mt-4 pt-3 flex items-center justify-between text-[10px] font-black uppercase text-gray-400 tracking-wider">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-blue-500" />
                          {location || t('kigali_hub')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-green-500" />
                          {t('start_date_label', { date: startDate })}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row gap-3">
                      <button 
                        type="button"
                        onClick={() => setStep(2)}
                        className="flex-1 py-4 bg-gray-50 text-gray-650 rounded-2xl font-sans font-black uppercase text-[10px] tracking-widest hover:bg-gray-100 transition-all border"
                      >
                        {t('adjust_pricing_info')}
                      </button>
                      <button 
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-2 py-4 bg-blue-600 text-white rounded-2xl font-sans font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                      >
                        {loading ? t('publishing_lockslot') : t('confirm_post_task_now')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Back bottom label */}
              <div className="mt-6 flex items-center gap-3 px-6">
                 <Info className="text-blue-400 shrink-0" size={16} />
                 <p className="text-[11px] text-gray-400 font-bold font-sans italic">
                   {t('escrow_fee_note')}
                 </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FLOATING TOASTS PANEL */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="pointer-events-auto bg-white rounded-2xl border border-gray-150 p-4.5 shadow-xl flex items-center gap-3.5 relative overflow-hidden"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 shrink-0 ${
                toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
              }`} />
              <div className="flex-1 pl-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">{t('task_wizard')}</span>
                <p className="font-sans text-[11px] font-bold text-gray-800 leading-normal mt-0.5">{toast.message}</p>
              </div>
              <button 
                onClick={() => setToasts(prev => prev.filter(x => x.id !== toast.id))}
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
