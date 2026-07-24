import React, { useState } from 'react';
import { 
  ShieldCheck, FileText, Globe, Building, 
  ChevronRight, CheckCircle2, ShieldAlert,
  Upload, MapPin, Smartphone, Loader2, Star, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DashboardLayout from '../../components/layout/DashboardLayout';

type VerificationStep = 'intro' | 'documents' | 'address' | 'otp' | 'completed';

export default function CompanyVerification() {
  const [step, setStep] = useState<VerificationStep>('intro');
  const [isUploading, setIsUploading] = useState(false);
  const [tinNumber, setTinNumber] = useState('');
  const [certFile, setCertFile] = useState<string | null>(null);
  const [certFileName, setCertFileName] = useState('');

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

  const handleNext = () => {
    setIsUploading(true);
    // Simulate API call
    setTimeout(() => {
      setIsUploading(false);
      const steps: VerificationStep[] = ['intro', 'documents', 'address', 'otp', 'completed'];
      const nextIdx = steps.indexOf(step) + 1;
      
      if (step === 'otp') {
        // Final step - update demo user
        const demoUserStr = localStorage.getItem('demo_user');
        if (demoUserStr) {
          const user = JSON.parse(demoUserStr);
          user.tier = 'Verified Company';
          user.verificationStatus = 'verified';
          user.trustScore = 95;
          localStorage.setItem('demo_user', JSON.stringify(user));
        }
        
        // Save to localStorage for admin preview
        localStorage.setItem('company_verification_docs', JSON.stringify({
          tinNumber,
          certFile,
          certFileName,
          date: new Date().toLocaleString()
        }));
      }

      if (nextIdx < steps.length) setStep(steps[nextIdx]);
    }, 1500);
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto py-10 px-4">
        <header className="text-center mb-12">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 mb-6 border border-blue-100">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 font-sans tracking-tight uppercase">Company Verification</h1>
          <p className="text-gray-500 font-sans font-medium mt-2 italic">Official verification is required for the "Verified Employer" badge.</p>
        </header>

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
                <h3 className="text-2xl font-black text-gray-900 font-sans mb-6 uppercase tracking-tight">Employer Trust Program</h3>
                <div className="space-y-6 mb-10">
                  {[
                    { title: "Verified Badge", desc: "Show workers your business is legitimate and verified by admin.", icon: <Building size={20} className="text-blue-600" /> },
                    { title: "Trust Label", desc: "Attract 3x more professional talent with a 'Trusted Employer' label.", icon: <ShieldCheck size={20} className="text-green-500" /> },
                    { title: "Unlimited Postings", desc: "Remove limits and post as many job openings as you need.", icon: <Zap size={20} className="text-yellow-500" /> }
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
                  Start Business Verification
                  <ChevronRight size={20} />
                </button>
              </motion.div>
            )}

            {step === 'documents' && (
              <motion.div key="docs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-2xl font-black text-gray-900 font-sans mb-2 uppercase tracking-tight text-center">Business Registration</h3>
                <p className="text-gray-500 font-sans mb-10 text-sm italic text-center">Upload your official RDB certificate or Business License.</p>
                
                <div className="space-y-6 mb-10">
                  <div className="space-y-2 px-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Tax ID / TIN Number</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 102345678"
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
                      {certFileName ? `Selected: ${certFileName}` : 'Upload Certificate (PDF/Image)'}
                    </p>
                    {certFile && (
                      <p className="text-[10px] text-green-600 font-bold mt-2">✓ Certificate Attached Successfully</p>
                    )}
                    <p className="text-[10px] text-gray-400 font-medium mt-2">Max size: 5MB — click here to browse</p>
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
                  {isUploading ? <Loader2 size={24} className="animate-spin" /> : 'Confirm & Proceed'}
                  {!isUploading && <ChevronRight size={20} />}
                </button>
              </motion.div>
            )}

            {step === 'address' && (
              <motion.div key="address" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <h3 className="text-2xl font-black text-gray-900 font-sans mb-2 uppercase tracking-tight text-center">Office Location</h3>
                <p className="text-gray-500 font-sans mb-10 text-sm italic text-center">Verify where your business operates.</p>
                
                <div className="space-y-6 mb-10">
                  <div className="space-y-2 px-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Physical Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Kigali City Tower, Floor 4, Suite 402"
                        className="w-full pl-12 pr-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 px-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Company Website (Optional)</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="url" 
                        placeholder="https://yourcompany.com"
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
                  {isUploading ? <Loader2 size={24} className="animate-spin" /> : 'Save & Continue'}
                </button>
              </motion.div>
            )}

            {step === 'otp' && (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <h3 className="text-2xl font-black text-gray-900 font-sans mb-2 uppercase tracking-tight text-center text-red-600">Admin Matching & Review</h3>
                <p className="text-gray-500 font-sans mb-6 text-sm italic text-center">Verification matches corporate documents and representative info.</p>
                
                <div className="bg-red-50 border border-red-200 text-red-950 p-6 rounded-3xl text-xs font-sans font-bold leading-relaxed mb-8 space-y-4">
                  <div>
                    <span className="text-red-750 font-black uppercase text-[10px] tracking-wider block mb-1">🚫 REPRESENTATIVE PHONE SECURITY BYPASSED</span>
                    <p>
                      For now, we do not require SMS phone security codes. Instead, we have directly sent a **Direct Review Notification** to our Admin containing your full registration, Corporate ID, address, and representative info!
                    </p>
                  </div>
                  
                  <div className="bg-white border border-red-100 rounded-2xl p-4 text-center space-y-1">
                    <p className="text-[9px] uppercase font-black tracking-widest text-gray-400">ADMIN PHONE NUMBER TO CALL</p>
                    <p className="text-lg font-black text-red-600 tracking-tight font-mono">+250 783 274 084</p>
                    <p className="text-[9px] text-gray-500 font-bold italic">Speak with the admin to instantly confirm and grant profile access!</p>
                  </div>
                </div>

                <button 
                  disabled={isUploading}
                  onClick={handleNext} 
                  className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-sans font-black uppercase tracking-widest text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  {isUploading ? <Loader2 size={24} className="animate-spin" /> : 'Confirm & Proceed to Completed'}
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
                  <h2 className="text-3xl font-black text-gray-900 font-sans mb-4 tracking-tight uppercase">Under Review!</h2>
                  <p className="text-gray-500 font-sans text-sm mb-6 leading-relaxed max-w-sm italic">
                    Your company details and documents have been sent to our Admin for review.
                  </p>
                  
                  <div className="bg-red-50 border border-red-200 text-red-950 p-6 rounded-3xl text-xs font-sans font-bold leading-relaxed mb-8 max-w-md text-left space-y-3">
                    <span className="text-red-750 font-black uppercase text-[10px] tracking-wider block">📞 CONTACT ADMIN FOR ACTIVATION</span>
                    <p>
                      To instantly verify your corporate documents, address, and representative details, please contact our administrator directly:
                    </p>
                    <div className="bg-white border border-red-100 rounded-2xl p-4 text-center">
                      <p className="text-[9px] uppercase font-black tracking-widest text-gray-400">ADMIN PHONE NUMBER</p>
                      <p className="text-lg font-black text-red-600 tracking-tight font-mono">+250 783 274 084</p>
                      <p className="text-[9px] text-gray-500 font-bold italic mt-1">Direct call or WhatsApp to confirm your Client Badge!</p>
                    </div>
                  </div>

                  <button onClick={() => window.location.href = '/dashboard/company'} className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-sans font-black uppercase tracking-widest text-sm hover:translate-y-[-2px] transition-all">
                    Go to Dashboard
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
            <h4 className="text-xs font-black text-blue-900 font-sans uppercase tracking-widest mb-2">Why Verification Matters?</h4>
            <p className="text-[10px] text-blue-800 font-bold font-sans italic">
              "Verified companies can post unlimited jobs and receive applications from 'Silver Verified' workers who only apply to trusted employers."
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
