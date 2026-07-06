import React from 'react';
import { 
  BarChart2, TrendingUp, Users, Eye, 
  MapPin, Clock, Calendar, ChevronRight,
  TrendingDown, ArrowUpRight
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function CompanyAnalytics() {
  const data = [
    { name: 'Jan', views: 400, applicants: 240 },
    { name: 'Feb', views: 300, applicants: 139 },
    { name: 'Mar', views: 200, applicants: 980 },
    { name: 'Apr', views: 278, applicants: 390 },
    { name: 'May', views: 189, applicants: 480 },
    { name: 'Jun', views: 239, applicants: 380 },
  ];

  const stats = [
    { label: 'Total Views', value: '12.4k', change: '+12%', up: true, icon: Eye },
    { label: 'Conversion Rate', value: '4.2%', change: '-2%', up: false, icon: TrendingUp },
    { label: 'Avg. Days to Hire', value: '18 Days', change: '-4 Days', up: true, icon: Clock },
    { label: 'Quality Score', value: '92/100', change: '+5', up: true, icon: BarChart2 },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto pb-20">
        <header className="mb-10">
          <h1 className="text-3xl font-black text-gray-900 font-sans tracking-tight uppercase">Performance Analytics</h1>
          <p className="text-gray-500 font-sans font-medium mt-1 italic">Data-driven insights to optimize your hiring strategy.</p>
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
                <h3 className="text-lg font-black text-gray-900 font-sans uppercase tracking-tight">Hiring Funnel</h3>
                <select className="text-xs font-black uppercase bg-gray-50 border-none rounded-lg px-3 py-1 outline-none">
                   <option>Last 6 Months</option>
                   <option>Last Year</option>
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
                <h3 className="text-lg font-black text-gray-900 font-sans uppercase tracking-tight">Applicants by Category</h3>
                <BarChart2 size={20} className="text-gray-400" />
             </div>
             <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Cleaning', count: 45 },
                    { name: 'Security', count: 32 },
                    { name: 'IT', count: 21 },
                    { name: 'Admin', count: 18 },
                    { name: 'Logistics', count: 28 },
                  ]}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#9ca3af' }} />
                    <Bar dataKey="count" fill="#2563eb" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </section>
        </div>

        <section className="bg-gray-900 p-10 rounded-[3.5rem] text-white">
           <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
              <div className="flex-1">
                 <h3 className="text-2xl font-black font-sans uppercase tracking-tight mb-2 italic">Ready to scale your team?</h3>
                 <p className="text-gray-400 font-sans font-medium text-sm">
                    Our AI matchmaking engine is now ready to recommend the top 1% of talent based on your recent analytics data.
                 </p>
              </div>
              <button className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-sans font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all whitespace-nowrap">
                 Unlock AI Matchmaking
              </button>
           </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
