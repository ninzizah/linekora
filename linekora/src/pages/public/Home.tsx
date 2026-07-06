import { Shield, ChevronRight, CheckCircle, Users, Building, Briefcase, Handshake, MapPin, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

export default function Home() {
  const categories = [
    { name: 'Office jobs', icon: Building },
    { name: 'Construction', icon: Briefcase },
    { name: 'Cleaning', icon: CheckCircle },
    { name: 'Mechanic', icon: Handshake },
    { name: 'Delivery', icon: MapPin },
    { name: 'IT / Tech', icon: Shield },
    { name: 'Agriculture', icon: Briefcase },
    { name: 'Security', icon: Shield },
    { name: 'Hospitality', icon: Users },
  ];

  const stats = [
    { label: 'Active jobs', value: '1,200+' },
    { label: 'Verified workers', value: '8,500+' },
    { label: 'Verified companies', value: '450+' },
    { label: 'Completed hires', value: '12,000+' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="z-10"
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-blue-600">
                <Shield size={16} />
                <span className="font-sans text-sm font-bold tracking-tight">Biometric Verification Enabled</span>
              </div>
              <h1 className="mt-6 font-sans text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-gray-900 leading-tight">
                Find trusted work. <br/>
                <span className="text-blue-600">Hire trusted people.</span>
              </h1>
              <p className="mt-5 font-sans text-base sm:text-xl text-gray-600 leading-relaxed max-w-xl">
                LINEKORA is Africa's most secure marketplace connecting verified workers with vetted employers. Escrow payments, verified identities, and total peace of mind.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link to="/register" className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 font-sans text-lg font-bold text-white shadow-xl shadow-blue-200 transition-all hover:bg-blue-700 hover:-translate-y-1">
                  Find Jobs
                  <ChevronRight size={20} />
                </Link>
                <Link to="/register" className="flex items-center justify-center gap-2 rounded-2xl bg-white border-2 border-gray-100 px-8 py-4 font-sans text-lg font-bold text-gray-900 transition-all hover:border-blue-600 hover:text-blue-600">
                  Hire Workers
                </Link>
              </div>
              <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
                {stats.map((stat, i) => (
                  <div key={i}>
                    <p className="font-sans text-xl sm:text-2xl font-black text-gray-900">{stat.value}</p>
                    <p className="font-sans text-xs sm:text-sm text-gray-500 font-medium">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="aspect-square rounded-[3rem] bg-gradient-to-br from-blue-600 to-indigo-700 p-8 shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&q=80')] bg-cover opacity-20 mix-blend-overlay"></div>
                <div className="relative flex h-full flex-col justify-end">
                  <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-xl border border-white/20">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-blue-500 border-2 border-white"></div>
                      <div>
                        <p className="font-sans text-white font-bold">Verified Professional</p>
                        <p className="text-white/70 text-sm italic font-sans">"Joining LINEKORA doubled my income in 3 months."</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-12 -right-12 h-64 w-64 rounded-full bg-blue-100/50 mix-blend-multiply filter blur-3xl"></div>
              <div className="absolute -bottom-12 -left-12 h-64 w-64 rounded-full bg-indigo-100/50 mix-blend-multiply filter blur-3xl"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-sans text-3xl font-extrabold text-gray-900">Explore Categories</h2>
            <p className="mt-4 font-sans text-lg text-gray-600 max-w-2xl mx-auto">
              Whatever you need, we have a verified expert ready to help.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {categories.map((cat, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="group flex flex-col items-center justify-center rounded-2xl bg-white p-8 shadow-sm transition-all hover:shadow-md border border-transparent hover:border-blue-100"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gray-50 text-gray-500 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600">
                  <cat.icon size={28} />
                </div>
                <span className="font-sans text-sm font-bold text-gray-900">{cat.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="font-sans text-3xl font-extrabold text-gray-900">How LINEKORA Works</h2>
          </div>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
            {[
              { title: 'Create account', desc: 'Sign up as a worker or employer in seconds.', icon: '01' },
              { title: 'Verify identity', desc: 'Secure biometric verification for total trust.', icon: '02' },
              { title: 'Apply / Hire', desc: 'Post jobs or find work that fits your schedule.', icon: '03' },
              { title: 'Work safely', desc: 'Payments held in escrow until work is done.', icon: '04' },
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="mb-6 font-sans text-6xl font-black text-blue-100">{step.icon}</div>
                <h3 className="mb-3 font-sans text-xl font-bold text-gray-900">{step.title}</h3>
                <p className="font-sans text-sm text-gray-500 leading-relaxed font-medium">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
