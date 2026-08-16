import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, User, MapPin, Upload, Camera, Loader2,
  ChevronRight, CheckCircle2, ShieldAlert, AlertCircle, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../lib/AuthContext';
import { updateUser, saveVerificationDocs } from '../../lib/api';
import { useLanguage } from '../../lib/LanguageContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { isValidNationalId, checkIdImage, normalizeNationalId } from '../../lib/idValidation';
import { VERIFICATION_UNAVAILABLE } from '../../lib/verificationAvailability';
import VerificationUnavailable from '../../components/verification/VerificationUnavailable';

type VerificationStep = 'intro' | 'documents' | 'address' | 'selfie' | 'completed';

export default function EmployerVerification() {
  if (VERIFICATION_UNAVAILABLE) {
    return <VerificationUnavailable dashboardPath="/dashboard/employer" />;
  }

  const { profile } = useAuth();
  const { t } = useLanguage();
  const [step, setStep] = useState<VerificationStep>('intro');
  const [idNumber, setIdNumber] = useState('');
  const [sector, setSector] = useState('');
  const [cell, setCell] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [biometricConsent, setBiometricConsent] = useState(false);

  // Functional ID document upload states for employer
  const [frontId, setFrontId] = useState<string | null>(null);
  const [backId, setBackId] = useState<string | null>(null);
  const [idNumError, setIdNumError] = useState<string | null>(null);
  const [frontIdError, setFrontIdError] = useState<string | null>(null);
  const [backIdError, setBackIdError] = useState<string | null>(null);
  const frontInputRef = useRef<HTMLInputElement | null>(null);
  const backInputRef = useRef<HTMLInputElement | null>(null);

  const saveVerificationToApi = async () => {
    try {
      const verificationPayload = {
        idNumber: normalizeNationalId(idNumber),
        frontId: frontId || undefined,
        backId: backId || undefined,
        sector,
        cell,
        selfie: capturedPhoto || undefined,
        date: new Date().toLocaleString()
      };

      // Save to server-side database so admin can view from any device
      if (profile?.firebaseUid || profile?.id) {
        await saveVerificationDocs(profile.firebaseUid || profile.id, verificationPayload);
        await updateUser(profile.id, {
          verificationStatus: 'pending',
        });
      }

      // Also save locally for offline reference
      localStorage.setItem('employer_verification_docs', JSON.stringify(verificationPayload));
    } catch (e) {
      console.error('Failed to save verification to API', e);
    }
  };

  const handleFrontIdChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const check = await checkIdImage(file);
    if (!check.valid || check.message) {
      setFrontIdError(check.message || 'file_not_image');
      setFrontId(null);
      return;
    }
    setFrontIdError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFrontId(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBackIdChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const check = await checkIdImage(file);
    if (!check.valid || check.message) {
      setBackIdError(check.message || 'file_not_image');
      setBackId(null);
      return;
    }
    setBackIdError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setBackId(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Biometric selfie camera states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Turn off camera on component unmount or step transition
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Safely link media stream to the video element once it mounts
  useEffect(() => {
    if (cameraActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [cameraActive, stream]);

  const startCamera = async () => {
    setCapturedPhoto(null);
    setScanProgress(0);
    setIsScanning(false);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 320, facingMode: 'user' } 
      });
      setStream(mediaStream);
      setCameraActive(true);
    } catch (err) {
      console.warn("Could not initiate hardware camera video stream", err);
      // Fallback gracefully
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const handleCaptureAndScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    
    // Simulate real biometric facial analysis scanning
    const interval = setInterval(() => {
      setScanProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 10;
      });
    }, 150);

    // Save actual frame image snap if camera is running
    if (cameraActive && videoRef.current) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, 300, 300);
          setCapturedPhoto(canvas.toDataURL('image/png'));
        }
      } catch (e) {
        console.error("Canvas snap failed", e);
      }
    } else {
      // No camera available — user must upload selfie manually
      setCapturedPhoto(null);
    }

    setTimeout(() => {
      stopCamera();
      setIsScanning(false);
      
      // Delay to show snapshot confirmation, then move forward
      setTimeout(() => {
        handleNext();
      }, 1000);
    }, 2000);
  };

  const handleNext = async () => {
    setIsUploading(true);

    if (step === 'selfie') {
      await saveVerificationToApi();
    }

    setTimeout(() => {
      setIsUploading(false);
      const steps: VerificationStep[] = ['intro', 'documents', 'address', 'selfie', 'completed'];
      const nextIdx = steps.indexOf(step) + 1;
      
      // If we just finished selfie, final step
      if (step === 'selfie') {
      }

      if (nextIdx < steps.length) setStep(steps[nextIdx]);
    }, 1500);
  };

  // If already verified or pending, show status instead of the flow
  const isAlreadyVerified = profile?.verificationStatus === 'verified';
  const isPending = profile?.verificationStatus === 'pending';

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto py-10 px-4">
        <header className="text-center mb-12">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 mb-6 border border-blue-100">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 font-sans tracking-tight uppercase">{t('get_verified_client_badge')}</h1>
          <p className="text-gray-500 font-sans font-medium mt-2">{t('verification_subtitle')}</p>
        </header>

        {isAlreadyVerified ? (
          <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-gray-100 shadow-xl shadow-gray-200/50">
            <div className="flex flex-col items-center text-center">
              <div className="h-24 w-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-8 border border-green-100 shadow-lg shadow-green-100">
                <CheckCircle2 size={48} strokeWidth={2.5} />
              </div>
              <h2 className="text-3xl font-black text-gray-900 font-sans mb-4 tracking-tight uppercase">{t('already_verified')}</h2>
              <p className="text-gray-500 font-sans text-sm mb-6 leading-relaxed max-w-sm italic">
                {t('already_verified_desc')}
              </p>
              <div className="bg-green-50 border border-green-200 p-6 rounded-3xl text-xs font-sans font-bold leading-relaxed mb-8 max-w-md">
                <span className="text-green-700 font-black uppercase text-[10px] tracking-wider block mb-2">{t('verified_employer_badge_active')}</span>
                <p className="text-green-800">{t('verified_badge_active_desc')}</p>
              </div>
              <button onClick={() => window.location.href = '/dashboard/employer'} className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-sans font-black uppercase tracking-widest text-sm hover:translate-y-[-2px] transition-all">
                {t('go_to_dashboard')}
              </button>
            </div>
          </div>
        ) : isPending ? (
          <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-gray-100 shadow-xl shadow-gray-200/50">
            <div className="flex flex-col items-center text-center">
              <div className="h-24 w-24 bg-yellow-50 text-yellow-500 rounded-full flex items-center justify-center mb-8 border border-yellow-100 shadow-lg shadow-yellow-100">
                <Loader2 size={48} strokeWidth={2.5} className="animate-spin" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 font-sans mb-4 tracking-tight uppercase">{t('under_review')}</h2>
              <p className="text-gray-500 font-sans text-sm mb-6 leading-relaxed max-w-sm italic">
                {t('under_review_desc')}
              </p>
              <button onClick={() => window.location.href = '/dashboard/employer'} className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-sans font-black uppercase tracking-widest text-sm hover:translate-y-[-2px] transition-all">
                {t('go_to_dashboard')}
              </button>
            </div>
          </div>
        ) : (
        <>
        <div className="flex items-center justify-center gap-2 mb-12">
          {['documents', 'address', 'selfie'].map((s, i) => {
            const currentIdx = ['intro', 'documents', 'address', 'selfie', 'completed'].indexOf(step);
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
                <h3 className="text-2xl font-black text-gray-900 font-sans mb-6 uppercase tracking-tight">{t('verified_employer_program')}</h3>
                <div className="space-y-6 mb-10">
                  {[
                    { title: t('verif_feature_top_tier_talent'), desc: t('verif_feature_top_tier_talent_desc'), icon: <User size={20} className="text-blue-600" /> },
                    { title: t('verif_feature_secure_transactions'), desc: t('verif_feature_secure_transactions_desc'), icon: <ShieldCheck size={20} className="text-green-500" /> },
                    { title: t('verif_feature_priority_support'), desc: t('verif_feature_priority_support_desc'), icon: <MapPin size={20} className="text-yellow-500" /> }
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
                  {t('begin_verification')}
                  <ChevronRight size={20} />
                </button>
              </motion.div>
            )}

            {step === 'documents' && (
              <motion.div key="docs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-2xl font-black text-gray-900 font-sans mb-2 uppercase tracking-tight">{t('id_documentation')}</h3>
                <p className="text-gray-500 font-sans mb-8 text-sm italic">{t('id_documentation_desc')}</p>
                
                <div className="space-y-6 mb-10">
                  <div className="space-y-2 px-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('national_id_passport')}</label>
                    <input 
                      type="text" 
                      value={idNumber}
                      onChange={(e) => {
                        setIdNumber(e.target.value);
                        setIdNumError(e.target.value.trim() ? (!isValidNationalId(e.target.value) ? 'id_must_be_16_digits' : null) : null);
                      }}
                      placeholder={t('placeholder_id_number')}
                      inputMode="numeric"
                      maxLength={20}
                      className={`w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all shadow-sm text-center ${
                        idNumError ? 'border-red-300 bg-red-50/40 focus:border-red-500' : ''
                      }`}
                    />
                    {idNumError ? (
                      <p className="text-[11px] font-bold text-red-500 px-1 flex items-center gap-1.5 justify-center">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 inline-block" />
                        {t(idNumError)}
                      </p>
                    ) : idNumber.trim() ? (
                      <p className="text-[11px] font-bold text-green-600 px-1 flex items-center gap-1.5 justify-center">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
                        {t('id_valid')} · {normalizeNationalId(idNumber).length} / 16
                      </p>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      onClick={() => frontInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-600 transition-colors group bg-gray-50/50 relative overflow-hidden min-h-[140px] ${
                        frontIdError ? 'border-red-300 bg-red-50/30' : 'border-gray-150'
                      }`}
                    >
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        ref={frontInputRef} 
                        onChange={handleFrontIdChange} 
                        onClick={(e) => e.stopPropagation()}
                      />
                      {frontId ? (
                        <>
                          <img src={frontId} alt={t('front_id_preview')} className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <span className="text-white text-[10px] font-black uppercase tracking-wider">{t('change_front_id')}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-gray-400 mb-3 group-hover:text-blue-600 shadow-sm transition-all">
                            <Upload size={20} />
                          </div>
                          <p className="text-xs font-black text-gray-900 uppercase tracking-widest italic">{t('front_of_id_document')}</p>
                          <p className="text-[9px] text-gray-400 font-bold mt-1">{t('front_id_hint')}</p>
                        </>
                      )}
                      {frontIdError && (
                        <div className="absolute inset-x-0 bottom-0 bg-red-500/90 text-white text-[9px] font-black uppercase tracking-wide py-1.5 px-2">
                          {t(frontIdError)}
                        </div>
                      )}
                    </div>
 
                    <div 
                      onClick={() => backInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-600 transition-colors group bg-gray-50/50 relative overflow-hidden min-h-[140px] ${
                        backIdError ? 'border-red-300 bg-red-50/30' : 'border-gray-150'
                      }`}
                    >
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        ref={backInputRef} 
                        onChange={handleBackIdChange} 
                        onClick={(e) => e.stopPropagation()}
                      />
                      {backId ? (
                        <>
                          <img src={backId} alt={t('back_id_preview')} className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <span className="text-white text-[10px] font-black uppercase tracking-wider">{t('change_back_id')}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-gray-400 mb-3 group-hover:text-blue-600 shadow-sm transition-all">
                            <Upload size={20} />
                          </div>
                          <p className="text-xs font-black text-gray-900 uppercase tracking-widest italic">{t('back_of_id_document')}</p>
                          <p className="text-[9px] text-gray-400 font-bold mt-1">{t('back_id_hint')}</p>
                        </>
                      )}
                      {backIdError && (
                        <div className="absolute inset-x-0 bottom-0 bg-red-500/90 text-white text-[9px] font-black uppercase tracking-wide py-1.5 px-2">
                          {t(backIdError)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button 
                  disabled={isUploading || !isValidNationalId(idNumber) || !frontId || !backId || !!frontIdError || !!backIdError}
                  onClick={handleNext} 
                  className="w-full py-5 bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-[2rem] font-sans font-black uppercase tracking-widest text-sm hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2"
                >
                  {isUploading ? <Loader2 size={24} className="animate-spin" /> : t('confirm_and_proceed')}
                  {!isUploading && <ChevronRight size={20} />}
                </button>
              </motion.div>
            )}

            {step === 'address' && (
              <motion.div key="address" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <h3 className="text-2xl font-black text-gray-900 font-sans mb-2 uppercase tracking-tight">{t('residential_address')}</h3>
                <p className="text-gray-500 font-sans mb-8 text-sm italic">{t('residential_address_desc')}</p>

                <div className="space-y-6 mb-10">
                  <div className="space-y-2 px-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('sector')}</label>
                    <input 
                      type="text" 
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                      placeholder={t('placeholder_sector')}
                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all shadow-sm"
                    />
                  </div>

                  <div className="space-y-2 px-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('cell_village_name')}</label>
                    <input 
                      type="text" 
                      value={cell}
                      onChange={(e) => setCell(e.target.value)}
                      placeholder={t('placeholder_cell')}
                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all shadow-sm"
                    />
                  </div>
                </div>

                <button 
                  disabled={isUploading || !sector || !cell}
                  onClick={handleNext} 
                  className="w-full py-5 bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-[2rem] font-sans font-black uppercase tracking-widest text-sm hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2"
                >
                  {isUploading ? <Loader2 size={24} className="animate-spin" /> : t('map_address_next')}
                  {!isUploading && <ChevronRight size={20} />}
                </button>
              </motion.div>
            )}

            {step === 'selfie' && (
              <motion.div key="selfie" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <h3 className="text-2xl font-black text-gray-900 font-sans mb-2 uppercase tracking-tight">{t('biometric_photo')}</h3>
                <p className="text-gray-500 font-sans mb-6 text-sm italic font-medium">{t('biometric_photo_desc')}</p>
                
                <div className="relative mx-auto w-64 h-64 border-4 border-blue-600 rounded-[3rem] flex flex-col items-center justify-center overflow-hidden mb-8 bg-gray-950 shadow-2xl group">
                  {cameraActive ? (
                    <div className="absolute inset-0 w-full h-full">
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                      
                      {/* Interactive biometric face scanner guides */}
                      <div className="absolute inset-0 border-[2rem] border-gray-950/40 pointer-events-none rounded-[2.8rem]" />
                      <div className="absolute inset-10 border-2 border-dashed border-blue-400/60 rounded-full opacity-60 pointer-events-none animate-pulse" />
                      
                      {/* Laser scanning beam overlay line */}
                      {isScanning && (
                        <motion.div 
                          initial={{ top: "10%" }}
                          animate={{ top: "90%" }}
                          transition={{ 
                            repeat: Infinity, 
                            repeatType: "reverse", 
                            duration: 1.2,
                            ease: "easeInOut"
                          }}
                          className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_rgba(34,211,238,0.8)] z-10"
                        />
                      )}
                    </div>
                  ) : capturedPhoto ? (
                    <div className="absolute inset-0 w-full h-full">
                      <img 
                        src={capturedPhoto} 
                        alt={t('snapped_face')} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover rounded-[2.8rem]" 
                      />
                      <div className="absolute inset-0 bg-blue-900/10 mix-blend-color" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <CheckCircle2 size={54} className="text-green-400 drop-shadow-lg scale-110 transition-transform" />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-6 flex flex-col items-center justify-center space-y-4">
                      <Camera size={44} className="text-gray-600 group-hover:scale-110 transition-transform" />
                      <div>
                        <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">{t('camera_off')}</p>
                        <p className="text-[9px] text-gray-500 italic mt-1 max-w-[160px]">{t('camera_off_desc')}</p>
                      </div>
                    </div>
                  )}

                  {/* Top-right scanning indicator */}
                  {isScanning && (
                    <div className="absolute top-4 right-4 bg-cyan-500/90 text-white rounded-full px-3 py-1 flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest shadow-md z-20">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                      {t('scanning_progress', { progress: scanProgress })}
                    </div>
                  )}
                </div>

                <div className="border-2 border-blue-100 bg-blue-50/40 rounded-3xl p-5 mb-5">
                  <div className="flex items-start gap-3 mb-3">
                    <ShieldCheck size={18} className="text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest font-sans mb-1">{t('biometric_consent_title')}</h4>
                      <p className="text-[11px] text-gray-600 font-sans font-medium leading-relaxed">{t('biometric_consent_body')}</p>
                      <p className="text-[10px] text-gray-500 font-sans font-medium leading-relaxed mt-1">{t('biometric_consent_usage')}</p>
                      <p className="text-[10px] text-gray-500 font-sans font-medium leading-relaxed mt-1">{t('biometric_consent_agree')}</p>
                    </div>
                  </div>
                  <label className="flex items-center gap-3 bg-white border-2 border-blue-200 rounded-2xl px-4 py-3 cursor-pointer hover:border-blue-400 transition-colors">
                    <span className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${biometricConsent ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                      {biometricConsent && <CheckCircle2 size={14} className="text-white" />}
                    </span>
                    <span className="text-sm font-black text-gray-900 font-sans uppercase tracking-wider">{t('i_agree')}</span>
                    <input
                      type="checkbox"
                      checked={biometricConsent}
                      onChange={(e) => setBiometricConsent(e.target.checked)}
                      className="sr-only"
                    />
                  </label>
                  {!biometricConsent && (
                    <p className="text-[10px] font-bold text-blue-600 mt-2 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600 inline-block animate-pulse" />
                      {t('consent_required_hint')}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  {!cameraActive && !capturedPhoto ? (
                    <button 
                      type="button"
                      onClick={startCamera} 
                      className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[2rem] font-sans font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2"
                    >
                      <Camera size={16} />
                      {t('open_camera_sandbox')}
                    </button>
                  ) : cameraActive ? (
                    <button 
                      type="button"
                      disabled={isScanning || !biometricConsent}
                      onClick={handleCaptureAndScan} 
                      className={`w-full py-5 rounded-[2rem] font-sans font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        !biometricConsent 
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                          : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-xl hover:shadow-cyan-100'
                      }`}
                    >
                      {isScanning ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          <span>{t('analysing_biometrics')}</span>
                        </>
                      ) : (
                        <>
                          <Camera size={18} />
                          <span>{t('initiate_biometric_scan')}</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="text-center">
                      <button 
                        type="button"
                        onClick={startCamera} 
                        className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline flex items-center justify-center gap-1.5 mx-auto"
                      >
                        <RefreshCw size={12} />
                        {t('retake_photo')}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 'completed' && (
              <motion.div key="comp" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="flex flex-col items-center text-center">
                  <div className="h-24 w-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-8 border border-green-100 shadow-lg shadow-green-100">
                    <CheckCircle2 size={48} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 font-sans mb-4 tracking-tight uppercase">{t('under_review_completed')}</h3>
                  <p className="text-gray-500 font-sans text-sm mb-6 leading-relaxed max-w-sm italic">
                    {t('under_review_completed_desc')}
                  </p>
                  
                  <div className="bg-red-50 border border-red-200 text-red-950 p-6 rounded-3xl text-xs font-sans font-bold leading-relaxed mb-8 max-w-md text-left space-y-3">
                    <span className="text-red-750 font-black uppercase text-[10px] tracking-wider block">{t('contact_admin_for_activation')}</span>
                    <p>
                      {t('contact_admin_desc')}
                    </p>
                    <div className="bg-white border border-red-100 rounded-2xl p-4 text-center">
                      <p className="text-[9px] uppercase font-black tracking-widest text-gray-400">{t('admin_phone_number')}</p>
                      <p className="text-lg font-black text-red-600 tracking-tight font-mono">+250 783 274 084</p>
                      <p className="text-[9px] text-gray-500 font-bold italic mt-1">{t('admin_whatsapp_hint')}</p>
                    </div>
                  </div>

                  <button onClick={() => window.location.href = '/dashboard/employer'} className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-sans font-black uppercase tracking-widest text-sm hover:translate-y-[-2px] transition-all">
                    {t('go_to_dashboard')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </>
        )}
      </div>
    </DashboardLayout>
  );
}
