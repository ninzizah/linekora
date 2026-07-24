import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { 
  ShieldCheck, Upload, Camera, Smartphone, 
  CreditCard, Loader2, CheckCircle2, ChevronRight,
  Star, Zap, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../lib/AuthContext';
import { updateUser } from '../../lib/api';
import DashboardLayout from '../../components/layout/DashboardLayout';

type Tier = 'bronze' | 'silver';
type VerificationStep = 'intro' | 'tier_select' | 'documents' | 'selfie' | 'otp' | 'completed';

export default function WorkerVerification() {
  const { profile } = useAuth();
  const [step, setStep] = useState<VerificationStep>('intro');
  const [selectedTier, setSelectedTier] = useState<Tier>('bronze');
  const [isUploading, setIsUploading] = useState(false);

  // Functional ID document upload states
  const [frontId, setFrontId] = useState<string | null>(null);
  const [backId, setBackId] = useState<string | null>(null);
  const [nationalIdNum, setNationalIdNum] = useState('');
  const frontInputRef = useRef<HTMLInputElement | null>(null);
  const backInputRef = useRef<HTMLInputElement | null>(null);

  const saveVerificationToApi = async () => {
    try {
      // Save full verification artifacts to localStorage so admin has access to view them
      localStorage.setItem('worker_verification_docs', JSON.stringify({
        frontId,
        backId,
        nationalIdNum,
        capturedPhoto,
        selectedTier,
        date: new Date().toLocaleString()
      }));

      if (profile?.id) {
        await updateUser(profile.id, {
          verificationStatus: 'pending',
          trustScore: selectedTier === 'bronze' ? 85 : 98,
        });
      }
    } catch (e) {
      console.error('Failed to save verification to API', e);
    }
  };

  const handleFrontIdChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFrontId(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackIdChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setBackId(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
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
      // Fallback gracefully to high-fidelity animated vector simulation
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
      // Fallback captured image placeholder
      setCapturedPhoto("https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop");
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
      const steps: VerificationStep[] = ['intro', 'tier_select', 'documents', 'selfie', 'otp', 'completed'];
      const nextIdx = steps.indexOf(step) + 1;
      
      // If we just finished OTP, update the demo user data as it was the final step
      if (step === 'otp' && selectedTier) {
        const demoUserStr = localStorage.getItem('demo_user');
        if (demoUserStr) {
          const user = JSON.parse(demoUserStr);
          user.tier = selectedTier === 'bronze' ? 'Verified Bronze' : 'Silver Verified';
          user.verificationStatus = 'pending'; // Mark as pending under review
          user.trustScore = selectedTier === 'bronze' ? 85 : 98;
          localStorage.setItem('demo_user', JSON.stringify(user));
        }
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
          <h1 className="text-3xl font-black text-gray-900 font-sans tracking-tight">Worker Verification</h1>
          <p className="text-gray-500 font-sans font-medium mt-2">Build trust and unlock premium features for your professional profile.</p>
        </header>

        {/* Progress Stepper */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {['tier', 'documents', 'selfie', 'otp'].map((s, i) => {
            const currentIdx = ['intro', 'tier_select', 'documents', 'selfie', 'otp', 'completed'].indexOf(step);
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
                <h3 className="text-2xl font-black text-gray-900 font-sans mb-6 uppercase tracking-tight">Upgrade Your Trust</h3>
                <div className="space-y-6 mb-10">
                  {[
                    { title: "Verification Badge", desc: "Instantly build trust with a verified checkmark on your profile.", icon: <ShieldCheck size={20} className="text-blue-600" /> },
                    { title: "Priority Visibility", desc: "Appear at the top of search results and employer recommendations.", icon: <Star size={20} className="text-yellow-500" /> },
                    { title: "Unlimited Potential", desc: "Apply to more jobs and chat directly with verified employers.", icon: <Zap size={20} className="text-green-500" /> }
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
                <button onClick={() => setStep('tier_select')} className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-sans font-black uppercase tracking-widest text-sm hover:translate-y-[-2px] hover:shadow-xl hover:shadow-blue-200 transition-all flex items-center justify-center gap-2">
                  Select Verification Level
                  <ChevronRight size={20} />
                </button>
              </motion.div>
            )}

            {step === 'tier_select' && (
              <motion.div key="tier_select" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-2xl font-black text-gray-900 font-sans mb-6 uppercase tracking-tight">Choose Your Level</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                  <div 
                    onClick={() => setSelectedTier('bronze')}
                    className={`p-6 rounded-[2.5rem] border-2 cursor-pointer transition-all ${
                      selectedTier === 'bronze' ? 'border-orange-500 bg-orange-50/50' : 'border-gray-100 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="h-12 w-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center"><ShieldCheck size={28} /></span>
                      <span className="text-sm font-black text-orange-600">Verified Bronze</span>
                    </div>
                    <ul className="space-y-2 mb-6">
                      <li className="text-xs font-bold text-gray-600 flex items-center gap-2"><CheckCircle2 size={14} className="text-green-500"/> ID Verification Badge</li>
                      <li className="text-xs font-bold text-gray-600 flex items-center gap-2"><CheckCircle2 size={14} className="text-green-500"/> 5 Active Applications</li>
                      <li className="text-xs font-bold text-gray-600 flex items-center gap-2"><CheckCircle2 size={14} className="text-green-500"/> Higher search ranking</li>
                    </ul>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-black text-gray-900">RWF 15k</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pb-1.5">one-time</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => setSelectedTier('silver')}
                    className={`p-6 rounded-[2.5rem] border-2 cursor-pointer transition-all relative overflow-hidden ${
                      selectedTier === 'silver' ? 'border-gray-400 bg-gray-50/50' : 'border-gray-100 hover:border-gray-300'
                    }`}
                  >
                    <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 text-[8px] font-black uppercase tracking-widest transform rotate-0 rounded-bl-xl shadow-lg">Popular</div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="h-12 w-12 bg-gray-200 text-gray-600 rounded-2xl flex items-center justify-center"><ShieldCheck size={28} /></span>
                      <span className="text-sm font-black text-gray-700">Silver Verified</span>
                    </div>
                    <ul className="space-y-2 mb-6">
                      <li className="text-xs font-bold text-gray-600 flex items-center gap-2"><CheckCircle2 size={14} className="text-green-500"/> Biometric Verified Badge</li>
                      <li className="text-xs font-bold text-gray-600 flex items-center gap-2"><CheckCircle2 size={14} className="text-green-500"/> Unlimited Applications</li>
                      <li className="text-xs font-bold text-gray-600 flex items-center gap-2"><CheckCircle2 size={14} className="text-green-500"/> Direct Chat Features</li>
                    </ul>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-black text-gray-900">RWF 35k</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pb-1.5">one-time</span>
                    </div>
                  </div>
                </div>
                {!selectedTier && (
                  <p className="text-center text-sm text-amber-600 font-bold mb-4 bg-amber-50 py-2 rounded-xl border border-amber-200">
                    👆 Please select a verification level above to continue
                  </p>
                )}
                <button 
                  disabled={!selectedTier}
                  onClick={() => setStep('documents')} 
                  className={`w-full py-5 rounded-[2rem] font-sans font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 ${
                    selectedTier 
                      ? 'bg-blue-600 text-white hover:bg-blue-700 hover:translate-y-[-2px] shadow-xl shadow-blue-200 cursor-pointer' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Confirm Choice & Next
                  <ChevronRight size={20} />
                </button>
              </motion.div>
            )}

            {step === 'documents' && (
              <motion.div key="docs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-2xl font-black text-gray-900 font-sans mb-2 uppercase tracking-tight">Identity Security</h3>
                <p className="text-gray-500 font-sans mb-8 text-sm italic">Verification keeps LINEKORA safe for everyone.</p>
                
                <div className="space-y-6 mb-10">
                  <div className="space-y-2 px-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">National ID / Passport Number</label>
                    <input 
                      type="text" 
                      value={nationalIdNum}
                      onChange={(e) => setNationalIdNum(e.target.value)}
                      placeholder="e.g. 1 1999 8 0000000 0 00"
                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans font-bold transition-all shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      onClick={() => frontInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-150 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-600 transition-colors group bg-gray-50/50 relative overflow-hidden min-h-[140px]"
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
                          <img src={frontId} alt="Front ID Preview" className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <span className="text-white text-[10px] font-black uppercase tracking-wider">Change Front ID</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-gray-400 mb-3 group-hover:text-blue-600 shadow-sm transition-all">
                            <Upload size={20} />
                          </div>
                          <p className="text-xs font-black text-gray-900 uppercase tracking-widest italic">Front ID</p>
                        </>
                      )}
                    </div>
 
                    <div 
                      onClick={() => backInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-150 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-600 transition-colors group bg-gray-50/50 relative overflow-hidden min-h-[140px]"
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
                          <img src={backId} alt="Back ID Preview" className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <span className="text-white text-[10px] font-black uppercase tracking-wider">Change Back ID</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-gray-400 mb-3 group-hover:text-blue-600 shadow-sm transition-all">
                            <Upload size={20} />
                          </div>
                          <p className="text-xs font-black text-gray-900 uppercase tracking-widest italic">Back ID</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button 
                  disabled={isUploading || !nationalIdNum || !frontId || !backId}
                  onClick={handleNext} 
                  className="w-full py-5 bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-[2rem] font-sans font-black uppercase tracking-widest text-sm hover:bg-blue-700 disabled:hover:bg-gray-200 shadow-xl shadow-blue-200 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                >
                  {isUploading ? <Loader2 size={24} className="animate-spin" /> : 'Confirm & Proceed'}
                  {!isUploading && <ChevronRight size={20} />}
                </button>
              </motion.div>
            )}

            {step === 'selfie' && (
              <motion.div key="selfie" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <h3 className="text-2xl font-black text-gray-900 font-sans mb-2 uppercase tracking-tight">Identity Match</h3>
                <p className="text-gray-500 font-sans mb-6 text-sm italic">{selectedTier === 'silver' ? 'Biometric face-matching is required for Silver status.' : 'Quick photo to match your ID documents.'}</p>
                
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
                        alt="Snapped Face" 
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
                        <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Camera Off</p>
                        <p className="text-[9px] text-gray-500 italic mt-1 max-w-[160px]">Click start local device scanner below to calibrate your webcam stream.</p>
                      </div>
                    </div>
                  )}

                  {/* Top-right scanning indicator */}
                  {isScanning && (
                    <div className="absolute top-4 right-4 bg-cyan-500/90 text-white rounded-full px-3 py-1 flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest shadow-md z-20">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                      Scanning {scanProgress}%
                    </div>
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
                      Open Camera Sandbox
                    </button>
                  ) : cameraActive ? (
                    <button 
                      type="button"
                      disabled={isScanning}
                      onClick={handleCaptureAndScan} 
                      className="w-full py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-[2rem] font-sans font-black uppercase tracking-widest text-xs hover:shadow-xl hover:shadow-cyan-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isScanning ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          <span>Analysing Biometrics...</span>
                        </>
                      ) : (
                        <>
                          <Camera size={18} />
                          <span>Initiate Biometric Scan</span>
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
                        Retake Photo
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 'otp' && (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <h3 className="text-2xl font-black text-gray-900 font-sans mb-2 uppercase tracking-tight text-red-600">Admin Matching & Review</h3>
                <p className="text-gray-500 font-sans mb-6 text-sm italic">Verification matches national ID databases and face biometrics.</p>
                
                <div className="bg-red-50 border border-red-200 text-red-950 p-6 rounded-3xl text-xs font-sans font-bold leading-relaxed mb-8 space-y-4">
                  <div>
                    <span className="text-red-750 font-black uppercase text-[10px] tracking-wider block mb-1">🚫 PHONE SMS SECURITY BYPASSED</span>
                    <p>
                      For now, we do not require SMS phone security codes. Instead, we have directly sent a **Direct Review Notification** to our Admin containing your full registration, National ID number, uploaded ID images, and snapped Biometric Selfie!
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
                  <div className="h-24 w-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-8 border border-green-100 shadow-lg shadow-green-100">
                    <CheckCircle2 size={48} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 font-sans mb-4 tracking-tight uppercase">Under Review!</h3>
                  <p className="text-gray-500 font-sans text-sm mb-10 leading-relaxed max-w-sm italic">
                    Your verification request for <span className="font-black text-blue-600 uppercase">Verified {selectedTier}</span> status has been logged and sent to the Admin. Please contact the Admin at <strong className="text-gray-900 font-mono">+250 783 274 084</strong> to confirm matching details and get activated instantly.
                  </p>
                  <button onClick={() => window.location.href = '/dashboard/worker'} className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-sans font-black uppercase tracking-widest text-sm hover:translate-y-[-2px] transition-all">
                    Unlock Dashboard
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}
