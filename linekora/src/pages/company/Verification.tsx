import React, { useState } from 'react';
import { 
  ShieldCheck, FileText, Globe, Building, 
  ChevronRight, CheckCircle2, ShieldAlert,
  Upload, MapPin, Smartphone, Loader2, Star, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../lib/AuthContext';
import { saveVerificationDocs, updateUser } from '../../lib/api';
import { useLanguage } from '../../lib/LanguageContext';

type VerificationStep = 'intro' | 'documents' | 'address' | 'otp' | 'completed';

export default function CompanyVerification() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [step, setStep] = useState<VerificationStep>('intro');
  const [isUploading, setIsUploading] = useState(false);
  const [tinNumber, setTinNumber] = useState('');
  const [certFile, setCertFile] = useState<string | null>(null);
  const [certFileName, setCertFileName] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');

  const handleAutoFillSampleCompanyDocs = () => {
    setTinNumber('109876543');
    setCertFileName('RDB_Business_Registration_2026.pdf');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCertFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCertFile(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = async () => {
    setIsUploading(true);

    // Save verification docs to server when leaving documents step
    if (step === 'documents' && profile) {
      try {
        const verificationPayload = {
          tinNumber,
          certFile: certFile || undefined,
          certFileName,
          address,
          website,
          date: new Date().toLocaleString()
        };
        const userId = profile.firebaseUid || profile.id;
        await saveVerificationDocs(userId, verificationPayload);
        await updateUser(profile.id, {
          verificationStatus: 'pending',
        });
        localStorage.setItem('company_verification_docs', JSON.stringify(verificationPayload));
      } catch (e) {
        console.error('Failed to save company verification', e);
      }
    }

    setTimeout(() => {
      setIsUploading(false);
      const steps: VerificationStep[] = ['intro', 'documents', 'address', 'otp', 'completed'];
      const nextIdx = steps.indexOf(step) + 1;
      if (nextIdx < steps.length) setStep(steps[nextIdx]);
    }, 1500);
  };

  const isAlreadyVerified = profile?.verificationStatus === 'verified';
  const isPending = profile?.verificationStatus === 'pending';

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto py-10 px-4">
        <header className="text-center mb-12">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 mb-6 border border-blue-100">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 font-sans tracking-tight uppercase">{t('company_verification')}</h1>
          <p className="text-gray-500 font-sans font-medium mt-2 italic">{t('verification_required_employer_badge')}</p>
        </header>

        {isAlreadyVerified ? (
          <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-gray-100 shadow-xl shadow-gray-200/50">
            <div className="flex flex-col items-center text-center">
              <div className="h-24 w-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-8 border border-green-100 shadow-lg shadow-green-100">
                <ShieldCheck size={48} strokeWidth={2.5} />
              </div>
              <h2 className="text-3xl font-black text-gray-900 font-sans mb-4 tracking-tight uppercase">{t('already_verified')}</h2>
              <p className="text-gray-500 font-sans text-sm mb-6 leading-relaxed max-w-sm italic">
                {t('company_already_verified_desc')}
              </p>
              <div className="bg-green-50 border border-green-200 p-6 rounded-3xl text-xs font-sans font-bold leading-relaxed mb-8 max-w-md">
                <span className="text-green-700 font-black uppercase text-[10px] tracking-wider block mb-2">{t('verified_company_badge_active')}</span>
                <p className="text-green-800">{t('verified_company_badge_desc')}</p>
              </div>
              <button onClick={() => window.location.href = '/dashboard/company'} className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-sans font-black uppercase tracking-widest text-sm hover:translate-y-[-2px] transition-all">
                {t('go_to_dashboard')}
              </button>
            </div>
          </div>
        ) : isPending ? (
          <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-gray-100 shadow-xl shadow-gray-200/50">
            <div className="flex flex-col items-center text-center">
              <div className="h-24 w-24 bg-yellow-50 text-yellow-500 rounded-full flex items-center justify-center mb-8 border border-yellow-100 shadow-lg shadow-yellow-100">
                <ShieldCheck size={48} strokeWidth={2.5} className="animate-pulse" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 font-sans mb-4 tracking-tight uppercase">{t('under_review')}</h2>
              <p className="text-gray-500 font-sans text-sm mb-6 leading-relaxed max-w-sm italic">
                {t('company_under_review_desc')}
              </p>
              <button onClick={() => window.location.href = '/dashboard/company'} className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-sans font-black uppercase tracking-widest text-sm hover:translate-y-[-2px] transition-all">
                {t('go_to_dashboard')}
              </button>
            </div>
          </div>
        ) : (
        <div>
        {/* Progress Stepper */}
        <div className="flex justify-center gap-2 mb-12">
          {['documents', 'address', 'otp'].map((s, i) => {
            const steps: VerificationStep[] = ['intro', 'documents', 'address', 'otp', 'completed'];
            const currentIdx = steps.indexOf(step);
            const stepIdx = i + 1;
            return (
              <div key={s} className="flex items-center">
                <div className={`h-2 w-8 rounded-full transition-all ${
                  currentIdx > stepIdx 
                    ? 'bg-blue-600' 
                    : currentIdx === stepIdx
                    ? 'bg-blue-600 w-12'
                    : 'bg-gray-200'
                }`} />
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-gray-100 shadow-xl shadow-gray-200/50">
          <AnimatePresence mode="wait">
            {step === 'intro' && (
              <motion.div key="intro" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h3 className="text-2xl font-black text-gray-900 font-sans mb-6 uppercase tracking-tight">{t('employer_trust_program')}</h3>
                <div className="space-y-6 mb-10">
                  {[
                    { title: t('feat_verified_badge'), desc: t('feat_verified_badge_desc'), icon: <Building size={20} className="text-blue-600" /> },
                    { title: t('feat_trust_label'), desc: t('feat_trust_label_desc'), icon: <ShieldCheck size={20} className="text-green-500" /> },
                    { title: t('feat_unlimited_postings'), desc: t('feat_unlimited_postings_desc'), icon: <Zap size={20} className="text-yellow-500" /> }
                  ].map((feat, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                        {feat.icon}
                      </div>
                      <div>
                        <p className="font-sans font-black text-gray-900 uppercase tracking-widest text-[10px] mb-1">{feat.title}</p>
                        <p className="text-gray-500 text-sm font-sans font-medium">{feat.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setStep('documents')} className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-sans font-black uppercase tracking-widest text-sm hover:translate-y-[-2px] hover:shadow-xl hover:shadow-blue-200 transition-all flex items-center justify-center gap-2">
                  {t('start_business_verification')}
                  <ChevronRight size={20} />
                </button>
              </motion.div>
            )}

            {step === 'documents' && (
              <motion.div key="docs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-black text-gray-900 font-sans uppercase tracking-tight">{t('business_registration')}</h3>
                  <button
                    type="button"
                    onClick={handleAutoFillSampleCompanyDocs}
                    className="text-xs font-bold text-blue-600 hover:underline font-sans cursor-pointer bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100"
                  >
                    {t('autofill_sample_docs')}
                  </button>
                </div>
                <p className="text-gray-500 font-sans mb-10 text-sm italic">{t('upload_rdb_certificate')}</p>
                
                <div className="space-y-6 mb-10">
                  <div className="space-y-2 px-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('tax_id_tin_number')}</label>
                    <input 
                      type="text" 
                      placeholder={t('placeholder_tin')}
                      value={tinNumber}
                      onChange={(e) => setTinNumber(e.target.value)}
                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all shadow-sm"
                    />
                  </div>

                  <label 
                    htmlFor="company-cert-upload"
                    className={`border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group ${
                      certFile ? 'border-green-500 bg-green-50/10' : 'border-gray-100 hover:border-blue-600 bg-gray-50/50'
                    }`}
                  >
                    <input 
                      id="company-cert-upload"
                      type="file" 
                      accept="image/*,application/pdf" 
                      className="hidden" 
                      onChange={handleFileChange} 
                    />
                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-4 shadow-sm transition-all ${
                      certFile ? 'bg-green-100 text-green-600' : 'bg-white text-gray-400 group-hover:text-blue-600'
                    }`}>
                      <Upload size={28} />
                    </div>
                    <p className="text-xs font-black text-gray-900 uppercase tracking-widest italic">
                      {certFileName ? t('selected_file', { name: certFileName }) : t('upload_certificate')}
                    </p>
                    {certFile && (
                      <p className="text-[10px] text-green-600 font-bold mt-2">{t('certificate_attached')}</p>
                    )}
                    <p className="text-[10px] text-gray-400 font-medium mt-2">{t('max_size_click_browse')}</p>
                  </label>
                </div>

                <button 
                  disabled={isUploading || !tinNumber.trim() || !certFile}
                  onClick={handleNext} 
                  className={`w-full py-5 rounded-[2rem] font-sans font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 ${
                    (tinNumber.trim() && certFile)
                      ? 'bg-blue-600 text-white hover:bg-blue-700 hover:translate-y-[-2px] shadow-xl shadow-blue-200 cursor-pointer' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isUploading ? <Loader2 size={24} className="animate-spin" /> : t('confirm_and_proceed')}
                  {!isUploading && <ChevronRight size={20} />}
                </button>
              </motion.div>
            )}

            {step === 'address' && (
              <motion.div key="address" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <h3 className="text-2xl font-black text-gray-900 font-sans mb-2 uppercase tracking-tight text-center">{t('office_location')}</h3>
                <p className="text-gray-500 font-sans mb-10 text-sm italic text-center">{t('verify_business_location')}</p>
                
                <div className="space-y-6 mb-10">
                  <div className="space-y-2 px-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('physical_address')}</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="text" 
                        placeholder={t('placeholder_physical_address')}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 px-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('company_website_optional')}</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="url" 
                        placeholder="https://yourcompany.com"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  disabled={isUploading}
                  onClick={handleNext} 
                  className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-sans font-black uppercase tracking-widest text-sm hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2"
                >
                  {isUploading ? <Loader2 size={24} className="animate-spin" /> : t('save_and_continue')}
                </button>
              </motion.div>
            )}

            {step === 'otp' && (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <h3 className="text-2xl font-black text-gray-900 font-sans mb-2 uppercase tracking-tight text-center text-red-600">{t('admin_matching_review')}</h3>
                <p className="text-gray-500 font-sans mb-6 text-sm italic text-center">{t('verification_matches_corporate')}</p>
                
                <div className="bg-red-50 border border-red-200 text-red-950 p-6 rounded-3xl text-xs font-sans font-bold leading-relaxed mb-8 space-y-4">
                  <div>
                    <span className="text-red-750 font-black uppercase text-[10px] tracking-wider block mb-1">{t('phone_security_bypassed_corporate')}</span>
                    <p>
                      {t('phone_bypassed_corporate_desc')}
                    </p>
                  </div>
                  
                  <div className="bg-white border border-red-100 rounded-2xl p-4 text-center space-y-1">
                    <p className="text-[9px] uppercase font-black tracking-widest text-gray-400">{t('admin_phone_to_call')}</p>
                    <p className="text-lg font-black text-red-600 tracking-tight font-mono">+250 783 274 084</p>
                    <p className="text-[9px] text-gray-500 font-bold italic">{t('admin_phone_hint')}</p>
                  </div>
                </div>

                <button 
                  disabled={isUploading}
                  onClick={handleNext} 
                  className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-sans font-black uppercase tracking-widest text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  {isUploading ? <Loader2 size={24} className="animate-spin" /> : t('confirm_proceed_completed')}
                  {!isUploading && <ChevronRight size={20} />}
                </button>
              </motion.div>
            )}

            {step === 'completed' && (
              <motion.div key="comp" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="flex flex-col items-center text-center">
                  <div className="h-24 w-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-8 border border-blue-100 shadow-lg shadow-blue-100">
                    <ShieldCheck size={48} strokeWidth={2.5} />
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 font-sans mb-4 tracking-tight uppercase">{t('under_review_completed')}</h2>
                  <p className="text-gray-500 font-sans text-sm mb-6 leading-relaxed max-w-sm italic">
                    {t('company_review_sent_desc')}
                  </p>
                  
                  <div className="bg-red-50 border border-red-200 text-red-950 p-6 rounded-3xl text-xs font-sans font-bold leading-relaxed mb-8 max-w-md text-left space-y-3">
                    <span className="text-red-750 font-black uppercase text-[10px] tracking-wider block">{t('contact_admin_for_activation')}</span>
                    <p>
                      {t('contact_admin_corporate_desc')}
                    </p>
                    <div className="bg-white border border-red-100 rounded-2xl p-4 text-center">
                      <p className="text-[9px] uppercase font-black tracking-widest text-gray-400">{t('admin_phone_number')}</p>
                      <p className="text-lg font-black text-red-600 tracking-tight font-mono">+250 783 274 084</p>
                      <p className="text-[9px] text-gray-500 font-bold italic mt-1">{t('admin_whatsapp_hint')}</p>
                    </div>
                  </div>

                  <button onClick={() => window.location.href = '/dashboard/company'} className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-sans font-black uppercase tracking-widest text-sm hover:translate-y-[-2px] transition-all">
                    {t('go_to_dashboard')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-12 bg-blue-50 p-8 rounded-[3rem] border border-blue-200 flex gap-6">
          <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm flex-shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h4 className="text-xs font-black text-blue-900 font-sans uppercase tracking-widest mb-2">{t('why_verification_matters')}</h4>
            <p className="text-[10px] text-blue-800 font-bold font-sans italic">
              {t('why_verification_matters_desc')}
            </p>
          </div>
        </div>
        </div>
        )}
      </div>
    </DashboardLayout>
  );
}
