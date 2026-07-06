import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { AlertTriangle, ShieldCheck, UserX, Wallet, CheckCircle2, Lock } from 'lucide-react';

export default function ScamAwareness() {
  const tips = [
    {
      title: "Never pay for work upfront",
      desc: "Real employers will never ask you for money to 'secure' a job or for 'processing fees'. If they do, report them immediately.",
      icon: Wallet
    },
    {
      title: "Keep chat on Platform",
      desc: "Scammers want to take you to WhatsApp or Telegram where we can't protect you. Stick to the LINEKORA chat system.",
      icon: Lock
    },
    {
      title: "Verify the Badges",
      desc: "Only trust employers with the 'Verified Company' or 'Identity Verified' badges. Look for high Trust Scores.",
      icon: ShieldCheck
    },
    {
      title: "Report Suspicious Accounts",
      desc: "If a job sounds too good to be true, it probably is. Use the 'Report' button to help us keep the community safe.",
      icon: UserX
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-14 w-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
            <AlertTriangle size={32} />
          </div>
          <h1 className="text-4xl font-black text-gray-900 font-sans tracking-tight">Scam Awareness</h1>
        </div>
        
        <p className="text-xl text-gray-600 font-sans leading-relaxed mb-16">
          Your safety is our top priority. Scammers are becoming more sophisticated, but by following these golden rules, you can protect yourself and your earnings.
        </p>

        <div className="space-y-12 mb-20">
          {tips.map((tip, i) => (
            <div key={i} className="flex gap-8 group">
              <div className="shrink-0 h-16 w-16 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center transition-colors group-hover:bg-blue-600 group-hover:text-white">
                <tip.icon size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 font-sans mb-3">{tip.title}</h3>
                <p className="text-gray-600 font-sans leading-relaxed text-lg">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-green-50 rounded-[3rem] p-10 border border-green-100">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle2 className="text-green-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-900 font-sans">The LINEKORA Security Pledge</h2>
          </div>
          <ul className="space-y-4">
            {[
              "Every ID we receive is manually reviewed by our security team.",
              "We leverage biometric data to prevent account takeovers.",
              "Escrow payments ensure you represent your work, not your wallet.",
              "Our AI system flags suspicious posting patterns in real-time."
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 font-sans font-medium text-gray-700">
                <div className="h-1.5 w-1.5 rounded-full bg-green-600 mt-2.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <Footer />
    </div>
  );
}
