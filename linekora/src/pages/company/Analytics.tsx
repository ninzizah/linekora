import React from 'react';
import { 
  BarChart2, TrendingUp, Users, Eye, 
  MapPin, Clock, Calendar, ChevronRight,
  TrendingDown, ArrowUpRight
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useLanguage } from '../../lib/LanguageContext';

export default function CompanyAnalytics() {
  const { t } = useLanguage();
  const data: any[] = [];

  const stats = [
    { label: t('total_views'), value: '0', change: '+0%', up: true, icon: Eye },
    { label: t('conversion_rate'), value: '0%', change: '0%', up: true, icon: TrendingUp },
    { label: t('avg_days_to_hire'), value: 'N/A', change: '', up: true, icon: Clock },
    { label: t('quality_score'), value: 'N/A', change: '', up: true, icon: BarChart2 },
  ];

  const categoryNames = {
    cleaning: t('category_cleaning'),
    security: t('category_security'),
    it: t('category_it'),
    admin: t('category_admin'),
    logistics: t('category_logistics'),
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto pb-20">
        <header className="mb-10">
          <h1 className="text-3xl font-black text-gray-900 font-sans tracking-tight uppercase">{t('performance_analytics')}</h1>
          <p className="text-gray-500 font-sans font-medium mt-1 italic">{t('analytics_subtitle')}</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                   <stat.icon size={20} />
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${stat.up ? 'text-green-500' : 'text-red-500'}`}>
                   {stat.up ? <ArrowUpRight size={14} /> : <TrendingDown size={14} />}
                   {stat.change}
                </div>
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-gray-900 font-sans tracking-tight">{stat.value}</h3>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
          <section className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-gray-900 font-sans uppercase tracking-tight">{t('hiring_funnel')}</h3>
                <select className="text-xs font-black uppercase bg-gray-50 border-none rounded-lg px-3 py-1 outline-none">
                   <option>{t('last_6_months')}</option>
                   <option>{t('last_year')}</option>
                </select>
             </div>
             <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#9ca3af' }} />
                    <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="views" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                    <Area type="monotone" dataKey="applicants" stroke="#10b981" strokeWidth={3} fillOpacity={0} />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </section>

          <section className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-gray-900 font-sans uppercase tracking-tight">{t('applicants_by_category')}</h3>
                <BarChart2 size={20} className="text-gray-400" />
             </div>
             <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: categoryNames.cleaning, count: 0 },
                    { name: categoryNames.security, count: 0 },
                    { name: categoryNames.it, count: 0 },
                    { name: categoryNames.admin, count: 0 },
                    { name: categoryNames.logistics, count: 0 },
                  ]}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#9ca3af' }} />
                    <Bar dataKey="count" fill="#2563eb" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
