import { Shield, ChevronRight, CheckCircle, Users, Building, Briefcase, Handshake, MapPin, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { useLanguage } from '../../lib/LanguageContext';

export default function Home() {
  const { t } = useLanguage();

  const categories = [
    { name: t('category_office_jobs'), icon: Building },
    { name: t('category_construction'), icon: Briefcase },
    { name: t('category_cleaning'), icon: CheckCircle },
    { name: t('category_mechanic'), icon: Handshake },
    { name: t('category_delivery'), icon: MapPin },
    { name: t('category_it_tech'), icon: Shield },
    { name: t('category_agriculture'), icon: Briefcase },
    { name: t('category_security'), icon: Shield },
    { name: t('category_hospitality'), icon: Users },
  ];

  const stats = [
    { label: t('active_jobs'), value: '1,200+' },
    { label: t('verified_workers'), value: '8,500+' },
    { label: t('verified_companies'), value: '450+' },
    { label: t('completed_hires'), value: '12,000+' },
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
                <span className="font-sans text-sm font-bold tracking-tight">{t('badge_biometric_verification')}</span>
              </div>
              <h1 className="mt-6 font-sans text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-gray-900 leading-tight">
                {t('hero_title')}
              </h1>
              <p className="mt-5 font-sans text-base sm:text-xl text-gray-600 leading-relaxed max-w-xl">
                {t('hero_subtitle')}
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link to="/register" className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 font-sans text-lg font-bold text-white shadow-xl shadow-blue-200 transition-all hover:bg-blue-700 hover:-translate-y-1">
                  {t('find_jobs')}
                  <ChevronRight size={20} />
                </Link>
                <Link to="/register" className="flex items-center justify-center gap-2 rounded-2xl bg-white border-2 border-gray-100 px-8 py-4 font-sans text-lg font-bold text-gray-900 transition-all hover:border-blue-600 hover:text-blue-600">
                  {t('hire_workers')}
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
                        <p className="font-sans text-white font-bold">{t('verified_professional')}</p>
                        <p className="text-white/70 text-sm italic font-sans">{t('testimonial_quote')}</p>
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
            <h2 className="font-sans text-3xl font-extrabold text-gray-900">{t('explore_categories')}</h2>
            <p className="mt-4 font-sans text-lg text-gray-600 max-w-2xl mx-auto">
              {t('explore_categories_desc')}
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
            <h2 className="font-sans text-3xl font-extrabold text-gray-900">{t('how_it_works')}</h2>
          </div>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
            {[
              { title: t('step_create_account'), desc: t('step_create_account_desc'), icon: '01' },
              { title: t('step_verify_identity'), desc: t('step_verify_identity_desc'), icon: '02' },
              { title: t('step_apply_hire'), desc: t('step_apply_hire_desc'), icon: '03' },
              { title: t('step_work_safely'), desc: t('step_work_safely_desc'), icon: '04' },
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
