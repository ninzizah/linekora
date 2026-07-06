import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { Shield, Target, Users, Lock } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-black text-gray-900 font-sans tracking-tight mb-8">Our Mission</h1>
        <p className="text-xl text-gray-600 font-sans leading-relaxed mb-12">
          LINEKORA was founded to solve the trust gap in the African gig economy. We believe that everyone deserves a safe way to work and a reliable way to hire.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
              <Shield size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 font-sans mb-3">Security First</h3>
            <p className="text-gray-600 font-sans leading-relaxed">
              Every user on LINEKORA undergoes biometric identity verification. This ensures that you are dealing with real people, not bots or scammers.
            </p>
          </div>
          <div>
            <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
              <Target size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 font-sans mb-3">Escrow Payments</h3>
            <p className="text-gray-600 font-sans leading-relaxed">
              We hold payments in a secure escrow account until the work is completed and both parties are satisfied. No more ghosting after payment.
            </p>
          </div>
          <div>
            <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
              <Users size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 font-sans mb-3">Community Trust</h3>
            <p className="text-gray-600 font-sans leading-relaxed">
              Our review system and "Trust Score" help you identify the best workers and employers in your local community.
            </p>
          </div>
          <div>
            <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
              <Lock size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 font-sans mb-3">Data Privacy</h3>
            <p className="text-gray-600 font-sans leading-relaxed">
              Your personal documents are encrypted and only used for verification. We never share your ID data with third parties without consent.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
