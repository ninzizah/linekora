import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Shield, FileText, Lock, Cookie, Receipt, HelpCircle, ChevronRight, Check } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { motion } from 'motion/react';

type LegalTab = 'privacy' | 'terms' | 'cookies' | 'refund';

export default function Legal() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Set default tab based onhash or search parameter or path query
  const getTabFromPath = (): LegalTab => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab') as LegalTab;
    if (tabParam && ['privacy', 'terms', 'cookies', 'refund'].includes(tabParam)) {
      return tabParam;
    }
    return 'privacy';
  };

  const [activeTab, setActiveTab ] = useState<LegalTab>(getTabFromPath());

  useEffect(() => {
    setActiveTab(getTabFromPath());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location]);

  const changeTab = (tab: LegalTab) => {
    navigate(`/legal?tab=${tab}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <Navbar />

      <main className="flex-grow pt-32 pb-24">
        {/* Decorative Top Banner */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-12">
          <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-blue-950 rounded-[3rem] p-10 md:p-16 text-white text-center md:text-left relative overflow-hidden shadow-2xl">
            <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-radial from-blue-500/10 to-transparent pointer-events-none" />
            <div className="max-w-3xl relative z-10">
              <span className="bg-blue-600 text-white text-[9px] font-black uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-full leading-none">Legal & Compliance Hub</span>
              <h1 className="text-4xl md:text-5xl font-black font-sans tracking-tight uppercase mt-6">Trust & Reliability Standards</h1>
              <p className="text-gray-350 text-base md:text-lg font-sans font-medium mt-4 text-gray-300">
                Transparency is our foundational layer. Study our operational contracts, privacy guidelines, and refund structures designed for LINEKORA East African ecosystem.
              </p>
            </div>
          </div>
        </div>

        {/* Content Section with sidebar */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Sidebar selectors */}
            <div className="lg:col-span-3 space-y-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2.5">Platform Documents</p>
              
              <div className="bg-white rounded-[2rem] p-4 border border-gray-100 shadow-xl shadow-gray-200/40 space-y-2">
                {[
                  { id: 'privacy', label: 'Privacy Policy', icon: <Lock size={16} /> },
                  { id: 'terms', label: 'Terms of Service', icon: <FileText size={16} /> },
                  { id: 'cookies', label: 'Cookie Policy', icon: <Cookie size={16} /> },
                  { id: 'refund', label: 'Refund Policy', icon: <Receipt size={16} /> }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => changeTab(item.id as LegalTab)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl font-sans font-black uppercase text-[10px] tracking-widest transition-all ${
                      activeTab === item.id
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight size={14} className={activeTab === item.id ? 'opacity-100' : 'opacity-30'} />
                  </button>
                ))}
              </div>

              {/* Instant support card */}
              <div className="bg-gradient-to-b from-blue-50 to-white rounded-[2rem] p-6 border border-blue-100 text-center">
                <div className="h-10 w-10 bg-white text-blue-600 border border-blue-200 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <HelpCircle size={18} />
                </div>
                <h4 className="text-xs font-black text-blue-900 font-sans uppercase tracking-widest">Need Assistance?</h4>
                <p className="text-[10px] text-blue-750 font-sans font-medium mt-1 leading-relaxed text-blue-800">
                  Our compliance officers are ready to clarify any escrow clauses or biometric auditing concerns.
                </p>
                <a 
                  href="https://wa.me/250783274084" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="mt-4 block w-full py-3 bg-white hover:bg-blue-50 border border-blue-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-blue-600 transition-all text-center"
                >
                  WhatsApp Support
                </a>
              </div>
            </div>

            {/* Main Policy details */}
            <div className="lg:col-span-9 bg-white rounded-[3rem] border border-gray-100 p-8 md:p-12 shadow-2xl">
              
              {activeTab === 'privacy' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-inner">
                      <Lock size={22} />
                    </span>
                    <div>
                      <h2 className="text-2xl font-black text-gray-950 font-sans uppercase tracking-tight">Privacy Policy</h2>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Effective date: June 23, 2026</p>
                    </div>
                  </div>

                  <hr className="border-gray-100 my-8" />

                  <div className="prose prose-blue max-w-none text-sm text-gray-500 font-sans leading-relaxed space-y-6">
                    <p className="font-bold text-gray-800 text-base">
                      At LINEKORA, we operate under a strict commitment to transparency, user security, and data sovereignty. This Privacy Policy details how we aggregate, evaluate, and secure physical and biometric telemetry when you participate in our verified talent marketplace.
                    </p>

                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest pt-4">1. Data Categories We Gather</h3>
                    <p>
                      To deliver high-trust escrow and identity matching, LINEKORA processes specified personal credentials:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><strong>Identity Records:</strong> National Identification card numbers, RDB certificates, or passport copies which you supply during background checks.</li>
                      <li><strong>Biometric Anchors:</strong> Real-time camera frames and face maps generated during the "Selfie Match" scan. This data is exclusively utilized to verify that your live face aligns with the corresponding National ID registry.</li>
                      <li><strong>Contact Coordinates:</strong> Display names, corporate email addresses, and WhatsApp/phone numbers for communication and secure transacting.</li>
                      <li><strong>Financial Telemetry:</strong> Transaction details, MTN MoMo coordinates, or wallet references to manage escrow contract payouts.</li>
                    </ul>

                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest pt-4">2. Application of Personal Credentials</h3>
                    <p>
                      Your details are put to use only for essential service deliverables:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Preventing workplace fraud, impersonation, or scamming patterns of untrusted agents.</li>
                      <li>Displaying "Verified Client" or "Verified Silver/Bronze" status visual checkmarks.</li>
                      <li>Facilitating secure localized micro-gigs escrows across Kigali districts.</li>
                    </ul>

                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest pt-4">3. Data Preservation & Protection Standards</h3>
                    <p>
                      We keep biometric telemetry only for the immediate confirmation process. Once the administrative review verifies matching, underlying physical frames are purged or compressed in high-security hashed offline formats. We never trade, resell, or distribute your identity materials to advertisement coordinates.
                    </p>
                  </div>
                </motion.div>
              )}

              {activeTab === 'terms' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-inner">
                      <FileText size={22} />
                    </span>
                    <div>
                      <h2 className="text-2xl font-black text-gray-950 font-sans uppercase tracking-tight">Terms of Service</h2>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Effective date: June 23, 2026</p>
                    </div>
                  </div>

                  <hr className="border-gray-100 my-8" />

                  <div className="prose prose-blue max-w-none text-sm text-gray-500 font-sans leading-relaxed space-y-6">
                    <p className="font-bold text-gray-800 text-base">
                      Welcome to LINEKORA. By creating an account or hiring workers through this interface, you consent to these Terms of Service. Please read them thoroughly before establishing escrow deposits or initiating identity scans.
                    </p>

                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest pt-4">1. Escrow Requirements</h3>
                    <p>
                      All client agreements on the LINEKORA platform operate on a prepay Escrow arrangement. Funds are locked securely in transit within the system. Once a worker successfully marks a task completed and the employer approves, funds are immediately disbursed. In the case of disputes, LINEKORA administrators will perform a localized audit before settlement.
                    </p>

                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest pt-4">2. Account Safety and ID Integrity</h3>
                    <p>
                      You are forbidden from registering multiple accounts to bypass negative review stars or feedback metrics. Any false representation of corporate names, RDB tax credentials, or National ID paperwork will trigger a permanent device-level BAN from LINEKORA and may be reported to the appropriate regulatory authorities in Rwanda.
                    </p>

                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest pt-4">3. Biometric Agreement</h3>
                    <p>
                      High-tier Silver Verified profiles require active facial camera scanning to confirm identity compliance against uploaded national resources. You must grant the application camera permissions when prompted to complete verification.
                    </p>
                  </div>
                </motion.div>
              )}

              {activeTab === 'cookies' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-inner">
                      <Cookie size={22} />
                    </span>
                    <div>
                      <h2 className="text-2xl font-black text-gray-950 font-sans uppercase tracking-tight">Cookie Policy</h2>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Effective date: June 23, 2026</p>
                    </div>
                  </div>

                  <hr className="border-gray-100 my-8" />

                  <div className="prose prose-blue max-w-none text-sm text-gray-500 font-sans leading-relaxed space-y-6">
                    <p className="font-bold text-gray-800 text-base">
                      LINEKORA uses essential local storage mechanisms to persist your session information, roles, and profile preference overrides across our workspace interfaces.
                    </p>

                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest pt-4">1. Essential Cookies</h3>
                    <p>
                      We utilize secure local tokens to keep you authenticated directly. Without these tokens, you would be forced to sign inside the system repetitively upon each page route navigation.
                    </p>

                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest pt-4">2. Experience Cookies</h3>
                    <p>
                      These items allow the platform to remember whether you represent a Worker or an Employer, custom panel layouts, and messaging notifications choices, ensuring highly fluid dashboard speeds.
                    </p>

                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest pt-4">3. Managing Settings</h3>
                    <p>
                      You reserve the right to configure your desktop browser settings to prevent local cookie/storage operations. However, disabling these components will degrade dashboard operations and restrict real-time chat updates.
                    </p>
                  </div>
                </motion.div>
              )}

              {activeTab === 'refund' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-inner">
                      <Receipt size={22} />
                    </span>
                    <div>
                      <h2 className="text-2xl font-black text-gray-955 font-sans uppercase tracking-tight">Refund Policy</h2>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Effective date: June 23, 2026</p>
                    </div>
                  </div>

                  <hr className="border-gray-100 my-8" />

                  <div className="prose prose-blue max-w-none text-sm text-gray-500 font-sans leading-relaxed space-y-6">
                    <p className="font-bold text-gray-800 text-base">
                      We aim to make transactions secure and reliable. Please study how identity auditing fees and escrow payments are managed should a dispute arise.
                    </p>

                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest pt-4">1. Verification Auditing Fees</h3>
                    <p>
                      Fees paid to initiate Bronze or Silver verification checkmarks (RWF 15,000 or RWF 35,000) go directly towards background processing and document verification. These fees are <strong>non-refundable</strong> once background checking has commenced.
                    </p>

                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest pt-4">2. Escrow Gigs Releases</h3>
                    <p>
                      Funds transferred to secure escrows for specific task listings are fully refundable to the employer's original MoMo or credit card if:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>The task is manually deleted by the employer before any worker's application has been approved.</li>
                      <li>A worker fails to report to the designated worksite or fails to finalize the described milestones.</li>
                      <li>Our administrative mediation team resolves a payment dispute in favor of the employer.</li>
                    </ul>

                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest pt-4">3. Dispute Mediation Resolution</h3>
                    <p>
                      If a dispute occurs, either the worker or employer can request mediator review. LINEKORA's dispute board evaluates submitted photo artifacts, completion logs, and active chats to determine a fair split or full refund within 48 business hours.
                    </p>
                  </div>
                </motion.div>
              )}

            </div>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
